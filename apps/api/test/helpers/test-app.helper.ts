import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { UserRole, PackageStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomInt, randomUUID } from "crypto"
import { AppModule } from "@/app.module"
import { Rfc7807ExceptionFilter } from "@/common/filters/rfc7807-exception.filter"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { MailService } from "@/common/mail/mail.service"
import { RabbitMQService } from "@/modules/notifications/rabbitmq.service"

export interface CapturedEmail {
  type: "invite" | "password_reset"
  to: string
  name: string
  url: string
}

export class InMemoryMailService {
  public outbox: CapturedEmail[] = []

  clear() {
    this.outbox = []
  }

  async sendResidentInviteEmail(params: {
    to: string
    residentName: string
    unitInfo: string
    inviteUrl: string
  }): Promise<boolean> {
    this.outbox.push({
      type: "invite",
      to: params.to,
      name: params.residentName,
      url: params.inviteUrl,
    })
    return true
  }

  async sendPasswordResetEmail(params: {
    to: string
    userName: string
    resetUrl: string
  }): Promise<boolean> {
    this.outbox.push({
      type: "password_reset",
      to: params.to,
      name: params.userName,
      url: params.resetUrl,
    })
    return true
  }
}

export class NoopRabbitMQService {
  public published: unknown[] = []

  clear() {
    this.published = []
  }

  async publishPackageReceived(payload: unknown): Promise<boolean> {
    this.published.push(payload)
    return true
  }

  async consumePackageReceived(): Promise<void> {
    // No-op em testes de integração
  }
}

export interface TestAppContext {
  app: INestApplication
  prisma: PrismaService
  redis: RedisService
  jwtService: JwtService
  mail: InMemoryMailService
  rabbitmq: NoopRabbitMQService
}

export async function createIntegrationTestApp(): Promise<TestAppContext> {
  const mail = new InMemoryMailService()
  const rabbitmq = new NoopRabbitMQService()

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useValue(mail)
    .overrideProvider(RabbitMQService)
    .useValue(rabbitmq)
    .compile()

  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix("api/v1")
  app.useGlobalFilters(new Rfc7807ExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  await app.init()

  return {
    app,
    prisma: app.get(PrismaService),
    redis: app.get(RedisService),
    jwtService: app.get(JwtService),
    mail,
    rabbitmq,
  }
}

export async function resetTestState(ctx: TestAppContext) {
  ctx.mail.clear()
  ctx.rabbitmq.clear()
  await ctx.redis.getClient().flushdb()
  await ctx.prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "package_events", "packages", "push_subscriptions", "residents", "units", "users", "condominium_addresses", "condominiums" RESTART IDENTITY CASCADE'
  )
}

export async function createUnitFixture(
  prisma: PrismaService,
  overrides: { block?: string; number?: string } = {}
) {
  return prisma.unit.create({
    data: {
      block: overrides.block ?? "A",
      number: overrides.number ?? String(randomInt(100, 999)),
      isActive: true,
    },
  })
}

export async function createUserFixture(
  prisma: PrismaService,
  overrides: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    unitId?: string | null
    isActive?: boolean
  } = {}
) {
  const passwordHash = await bcrypt.hash(overrides.password ?? "SenhaForte@2026", 10)
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Usuário Teste",
      email: (overrides.email ?? `user-${randomUUID().slice(0, 8)}@chegou.test`).toLowerCase(),
      passwordHash,
      role: overrides.role ?? UserRole.PORTER,
      unitId: overrides.unitId ?? null,
      isActive: overrides.isActive ?? true,
    },
  })
}

export async function createResidentFixture(
  prisma: PrismaService,
  unitId: string,
  overrides: { fullName?: string; email?: string; isPrimary?: boolean } = {}
) {
  return prisma.resident.create({
    data: {
      unitId,
      fullName: overrides.fullName ?? "Morador Teste",
      email: (overrides.email ?? `resident-${randomUUID().slice(0, 8)}@chegou.test`).toLowerCase(),
      isPrimary: overrides.isPrimary ?? true,
    },
  })
}

export async function createPackageFixture(
  prisma: PrismaService,
  params: {
    unitId: string
    registeredByUserId: string
    pin?: string
    status?: PackageStatus
    recipientNameRaw?: string
  }
) {
  const rawPin = params.pin ?? String(randomInt(100000, 999999))
  const pinHash = await bcrypt.hash(rawPin, 10)
  const pkg = await prisma.package.create({
    data: {
      unitId: params.unitId,
      registeredByUserId: params.registeredByUserId,
      recipientNameRaw: params.recipientNameRaw ?? "Destinatário Teste",
      carrier: "Amazon",
      trackingCode: `TRK-${randomUUID().slice(0, 8).toUpperCase()}`,
      pickupPin: rawPin,
      pickupPinHash: pinHash,
      pickupQrToken: randomUUID(),
      status: params.status ?? PackageStatus.RECEIVED,
      version: 1,
    },
  })
  return { pkg, rawPin }
}

export function signTokenForUser(
  jwtService: JwtService,
  user: { id: string; email: string; role: UserRole; unitId?: string | null },
  expiresIn = "1h"
) {
  return jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId ?? undefined,
    },
    { expiresIn }
  )
}

