import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { AuthGuard } from "./auth-guard"

const pushMock = vi.fn()
const replaceMock = vi.fn()
const logoutMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

const useAuthMock = vi.fn()
vi.mock("@/entities/user/ui/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}))

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deve renderizar conteúdo protegido quando usuário possui papel permitido", () => {
    useAuthMock.mockReturnValue({
      user: { id: "1", name: "Síndico", email: "a@b.com", role: "ADMIN" },
      isLoading: false,
      logout: logoutMock,
    })

    render(
      <AuthGuard allowedRoles={["ADMIN"]}>
        <div>Painel Administrativo</div>
      </AuthGuard>
    )

    expect(screen.getByText("Painel Administrativo")).toBeInTheDocument()
  })

  it("deve bloquear acesso quando usuário possui papel não autorizado", () => {
    useAuthMock.mockReturnValue({
      user: { id: "2", name: "Morador", email: "m@b.com", role: "RESIDENT" },
      isLoading: false,
      logout: logoutMock,
    })

    render(
      <AuthGuard allowedRoles={["ADMIN"]}>
        <div>Painel Administrativo</div>
      </AuthGuard>
    )

    expect(screen.queryByText("Painel Administrativo")).not.toBeInTheDocument()
    expect(screen.getByText("Acesso Restrito")).toBeInTheDocument()
  })
})

