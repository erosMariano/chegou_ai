import { describe, it, expect, vi } from "vitest"
import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { RolesGuard } from "./roles.guard"

function makeContext(user?: { role?: string }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext
}

describe("RolesGuard", () => {
  it("deve permitir acesso quando a rota não exige papéis", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) } as unknown as Reflector
    const guard = new RolesGuard(reflector)

    expect(guard.canActivate(makeContext())).toBe(true)
  })

  it.each([
    ["ADMIN", ["ADMIN"], true],
    ["PORTER", ["PORTER", "ADMIN"], true],
    ["RESIDENT", ["RESIDENT", "ADMIN"], true],
  ])("deve permitir acesso para papel %s quando autorizado em %j", (role, required, expected) => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(required) } as unknown as Reflector
    const guard = new RolesGuard(reflector)

    expect(guard.canActivate(makeContext({ role }))).toBe(expected)
  })

  it.each([
    [undefined, ["ADMIN"]],
    [{ role: "RESIDENT" }, ["ADMIN"]],
    [{ role: "PORTER" }, ["ADMIN"]],
    [{ role: "RESIDENT" }, ["PORTER", "ADMIN"]],
  ])("deve lançar ForbiddenException para usuário %j em rota que exige %j", (user, required) => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(required) } as unknown as Reflector
    const guard = new RolesGuard(reflector)

    expect(() => guard.canActivate(makeContext(user))).toThrow(ForbiddenException)
  })
})

