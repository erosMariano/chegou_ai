import { test, expect } from "@playwright/test"

test.describe("Fluxo de Reset de Senha", () => {
  test("deve solicitar recuperação de senha e concluir redefinição via link", async ({ page }) => {
    await page.route("**/api/v1/auth/setup-status", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ initialized: true }) })
    )
    await page.route("**/api/v1/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Se o e-mail estiver cadastrado, as instruções para redefinição foram geradas.",
        }),
      })
    })
    await page.route("**/api/v1/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Senha redefinida com sucesso.",
        }),
      })
    })

    await page.goto("/esqueci-minha-senha")
    await page.waitForLoadState("networkidle")

    await page.locator("#email").fill("morador@chegou.ai")
    await page.getByRole("button", { name: /Enviar Instruções/i }).click()

    await expect(page.getByText("Solicitação Enviada!")).toBeVisible()

    await page.goto("/redefinir-senha?token=token-e2e-123&email=morador%40chegou.ai")
    await page.waitForLoadState("networkidle")
    const passwordInputs = page.locator('input[type="password"]')
    await passwordInputs.nth(0).fill("NovaSenha@2026")
    await passwordInputs.nth(1).fill("NovaSenha@2026")
    await page.getByRole("button", { name: /Salvar Nova Senha/i }).click()

    await expect(page.getByText(/Senha Redefinida|sucesso/i).first()).toBeVisible()
  })
})
