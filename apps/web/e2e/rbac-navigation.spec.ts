import { test, expect } from "@playwright/test"

test.describe("Login e RBAC na Interface", () => {
  test("deve redirecionar moradora para /morador e bloquear acesso a /admin", async ({ page }) => {
    await page.route("**/api/v1/auth/setup-status", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ initialized: true }) })
    )
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "u-res", name: "Mariana", email: "mariana@chegou.ai", role: "RESIDENT", unitId: "unit-1" },
          token: "e2e-jwt-resident",
        }),
      })
    )
    await page.route("**/api/v1/residents/me/packages*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) })
    )

    await page.goto("/login")
    await page.locator("#email").fill("mariana@chegou.ai")
    await page.locator("#password").fill("123456")
    await page.getByRole("button", { name: /Entrar no Sistema/i }).click()

    await expect(page).toHaveURL(/\/morador/)

    await page.goto("/admin")
    await expect(page.getByText("Acesso Restrito")).toBeVisible()
  })

  test("deve redirecionar porteiro para /portaria e bloquear acesso administrativo", async ({ page }) => {
    await page.route("**/api/v1/auth/setup-status", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ initialized: true }) })
    )
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "u-port", name: "Carlos", email: "porteiro@chegou.ai", role: "PORTER" },
          token: "e2e-jwt-porter",
        }),
      })
    )
    await page.route("**/api/v1/packages*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    )

    await page.goto("/login")
    await page.locator("#email").fill("porteiro@chegou.ai")
    await page.locator("#password").fill("123456")
    await page.getByRole("button", { name: /Entrar no Sistema/i }).click()

    await expect(page).toHaveURL(/\/portaria/)

    await page.goto("/admin/usuarios")
    await expect(page.getByText("Acesso Restrito")).toBeVisible()
  })
})
