import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { UserRole } from "@prisma/client"
import {
  TestAppContext,
  createIntegrationTestApp,
  resetTestState,
  createUnitFixture,
  createUserFixture,
  createPackageFixture,
  signTokenForUser,
} from "../helpers/test-app.helper"

describe("RBAC e Isolamento Multi-Unidade / IDOR (Integração)", () => {
  let ctx: TestAppContext
  let adminToken: string
  let porterToken: string
  let residentAToken: string
  let residentBToken: string
  let unlinkedResidentToken: string
  let unitAId: string
  let unitBId: string
  let packageAId: string
  let packageBId: string
  let porterId: string

  beforeAll(async () => {
    ctx = await createIntegrationTestApp()
  })

  afterAll(async () => {
    await ctx.app.close()
  })

  beforeEach(async () => {
    await resetTestState(ctx)

    const unitA = await createUnitFixture(ctx.prisma, { block: "A", number: "101" })
    const unitB = await createUnitFixture(ctx.prisma, { block: "B", number: "202" })
    unitAId = unitA.id
    unitBId = unitB.id

    const admin = await createUserFixture(ctx.prisma, { role: UserRole.ADMIN })
    const porter = await createUserFixture(ctx.prisma, { role: UserRole.PORTER })
    const residentA = await createUserFixture(ctx.prisma, { role: UserRole.RESIDENT, unitId: unitAId })
    const residentB = await createUserFixture(ctx.prisma, { role: UserRole.RESIDENT, unitId: unitBId })
    const unlinked = await createUserFixture(ctx.prisma, { role: UserRole.RESIDENT, unitId: null })

    porterId = porter.id
    adminToken = signTokenForUser(ctx.jwtService, admin)
    porterToken = signTokenForUser(ctx.jwtService, porter)
    residentAToken = signTokenForUser(ctx.jwtService, residentA)
    residentBToken = signTokenForUser(ctx.jwtService, residentB)
    unlinkedResidentToken = signTokenForUser(ctx.jwtService, unlinked)

    const pkgA = await createPackageFixture(ctx.prisma, {
      unitId: unitAId,
      registeredByUserId: porter.id,
      recipientNameRaw: "Morador A",
    })
    const pkgB = await createPackageFixture(ctx.prisma, {
      unitId: unitBId,
      registeredByUserId: porter.id,
      recipientNameRaw: "Morador B",
    })
    packageAId = pkgA.pkg.id
    packageBId = pkgB.pkg.id
  })

  const getTokenByRole = (role: "ANON" | "RESIDENT" | "PORTER" | "ADMIN") => {
    if (role === "RESIDENT") return residentAToken
    if (role === "PORTER") return porterToken
    if (role === "ADMIN") return adminToken
    return null
  }

  it.each([
    ["GET", "/api/v1/users", "ANON", 401],
    ["GET", "/api/v1/users", "RESIDENT", 403],
    ["GET", "/api/v1/users", "PORTER", 403],
    ["GET", "/api/v1/users", "ADMIN", 200],
    ["GET", "/api/v1/audit/events", "ANON", 401],
    ["GET", "/api/v1/audit/events", "RESIDENT", 403],
    ["GET", "/api/v1/audit/events", "PORTER", 403],
    ["GET", "/api/v1/audit/events", "ADMIN", 200],
    ["GET", "/api/v1/residents", "ANON", 401],
    ["GET", "/api/v1/residents", "RESIDENT", 403],
    ["GET", "/api/v1/residents", "PORTER", 200],
    ["GET", "/api/v1/residents", "ADMIN", 200],
    ["GET", "/api/v1/packages", "ANON", 401],
    ["GET", "/api/v1/packages", "RESIDENT", 200],
    ["GET", "/api/v1/packages", "PORTER", 200],
    ["GET", "/api/v1/packages", "ADMIN", 200],
  ] as const)(
    "deve aplicar matriz RBAC para %s %s com papel %s retornando %i",
    async (method, path, role, expectedStatus) => {
      const token = getTokenByRole(role)
      const req = (request(ctx.app.getHttpServer()) as any)[method.toLowerCase()](path)
      if (token) {
        req.set("Authorization", `Bearer ${token}`)
      }
      const res = await req
      expect(res.status).toBe(expectedStatus)
    }
  )

  it("deve bloquear IDOR quando morador A tenta consultar encomenda da unidade B", async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/packages/${packageBId}`)
      .set("Authorization", `Bearer ${residentAToken}`)

    expect(res.status).toBe(403)
    expect(JSON.stringify(res.body)).not.toContain("Morador B")
  })

  it("deve isolar listagem de encomendas para retornar apenas pacotes da própria unidade do morador", async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/packages?unitId=${unitBId}`)
      .set("Authorization", `Bearer ${residentAToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe(packageAId)
  })

  it("deve retornar lista vazia (fail-closed) quando morador sem unidade vinculada consulta pacotes", async () => {
    const res = await request(ctx.app.getHttpServer())
      .get("/api/v1/packages")
      .set("Authorization", `Bearer ${unlinkedResidentToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it("deve bloquear escalada de privilégio por porteiro ou morador tentando promover conta via PUT /users/:id", async () => {
    const res = await request(ctx.app.getHttpServer())
      .put(`/api/v1/users/${porterId}`)
      .set("Authorization", `Bearer ${porterToken}`)
      .send({ role: "ADMIN" })

    expect(res.status).toBe(403)

    const residentRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${residentBToken}`)
      .send({ name: "Hacker", email: "h@chegou.test", password: "Password@123", role: "ADMIN" })

    expect(residentRes.status).toBe(403)
  })

  it("deve rejeitar propriedades não permitidas (mass assignment) no DTO de check-in", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${porterToken}`)
      .send({
        unitId: unitAId,
        recipientNameRaw: "Mariana",
        status: "DELIVERED",
      })

    expect(res.status).toBe(400)
  })

  it("deve rejeitar token malformado, expirado e usuário desativado com 401", async () => {
    const malformed = await request(ctx.app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer token-invalido-xyz")
    expect(malformed.status).toBe(401)

    const inactiveUser = await createUserFixture(ctx.prisma, {
      role: UserRole.PORTER,
      isActive: false,
    })
    const inactiveToken = signTokenForUser(ctx.jwtService, inactiveUser)
    const inactiveRes = await request(ctx.app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${inactiveToken}`)
    expect(inactiveRes.status).toBe(401)

    const expiredToken = signTokenForUser(
      ctx.jwtService,
      { id: porterId, email: "p@chegou.test", role: UserRole.PORTER },
      "-10s"
    )
    const expiredRes = await request(ctx.app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
    expect(expiredRes.status).toBe(401)
  })
})

