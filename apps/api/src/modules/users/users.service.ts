import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto"
import { UserRole } from "@prisma/client"
import * as bcrypt from "bcryptjs"

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    role?: UserRole
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }) {
    const page = params?.page ? Math.max(1, Number(params.page)) : 1
    const limit = params?.limit ? Math.max(1, Number(params.limit)) : 50
    const skip = (page - 1) * limit

    const where: any = {}
    if (params?.role) {
      where.role = params.role
    } else {
      where.role = { in: [UserRole.ADMIN, UserRole.PORTER] }
    }
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive
    }
    if (params?.search && params.search.trim()) {
      const term = params.search.trim()
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ]
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              registeredPackages: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ])

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            registeredPackages: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    return user
  }

  async create(dto: CreateUserDto) {
    const normalizedEmail = dto.email.toLowerCase().trim()

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      throw new ConflictException("Já existe um usuário cadastrado com este e-mail.")
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: dto.role || UserRole.PORTER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    const data: any = {}
    if (dto.name) data.name = dto.name.trim()
    if (dto.role) data.role = dto.role
    if (dto.isActive !== undefined) data.isActive = dto.isActive

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim()
      if (normalizedEmail !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
        })
        if (existing && existing.id !== id) {
          throw new ConflictException("Já existe outro usuário cadastrado com este e-mail.")
        }
        data.email = normalizedEmail
      }
    }

    if (dto.password && dto.password.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password, 10)
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
  }

  async toggleStatus(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ForbiddenException("Você não pode inativar seu próprio usuário de administrador.")
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ForbiddenException("Você não pode excluir sua própria conta de administrador.")
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registeredPackages: true,
            packageEvents: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    // Se possui histórico de auditoria ou pacotes, impede deleção física e aplica inativação lógica
    if (user._count.registeredPackages > 0 || user._count.packageEvents > 0) {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      })
      return {
        message:
          "Usuário possui histórico de auditoria e foi inativado logicamente para preservar a rastreabilidade do condomínio.",
        inactivated: true,
      }
    }

    await this.prisma.user.delete({
      where: { id },
    })

    return {
      message: "Operador removido com sucesso.",
      deleted: true,
    }
  }
}

