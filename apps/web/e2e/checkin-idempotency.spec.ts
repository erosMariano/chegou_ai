import { test, expect } from "@playwright/test"

test.describe("Check-in pela Interface sem Duplicidade", () => {
  test("deve registrar encomenda uma única vez mesmo com clique duplo no botão de confirmar", async ({ page }) => {
    let createPackageCalls = 0

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
    await page.route("**/api/v1/units", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "unit-1", block: "A", number: "101", isActive: true }]),
      })
    )
    await page.route("**/api/v1/bff/packages/extract-label", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          extracted: {
            recipientName: "Camila Vasconcelos",
            unitBlock: "A",
            unitNumber: "101",
            trackingCode: "AMZ987654321BR",
            carrier: "Amazon",
            confidenceScore: 0.95,
            uncertaintyReason: null,
          },
          matchedUnitId: "unit-1",
          confidenceScore: 0.95,
          requiresReview: false,
          processingTimeMs: 42,
          addressValidation: { isMatch: true, confidence: 1, matchedAddressLabel: "Portaria", mismatchReason: null },
        }),
      })
    )
    await page.route("**/api/v1/packages*", async (route) => {
      if (route.request().method() === "POST") {
        createPackageCalls++
        await new Promise((r) => setTimeout(r, 150))
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "pkg-e2e-1",
            status: "RECEIVED",
            unit: { id: "unit-1", block: "A", number: "101" },
            recipientNameRaw: "Camila Vasconcelos",
            carrier: "Amazon",
            trackingCode: "AMZ987654321BR",
            pickupQrToken: "qr-e2e-1",
            receivedAt: new Date().toISOString(),
            aiConfidenceScore: 0.95,
          }),
        })
        return
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    })

    await page.goto("/login")
    await page.locator("#email").fill("porteiro@chegou.ai")
    await page.locator("#password").fill("123456")
    await page.getByRole("button", { name: /Entrar no Sistema/i }).click()
    await expect(page).toHaveURL(/\/portaria/)

    await page.goto("/portaria/checkin")
    await page.getByRole("button", { name: /Simular Extração/i }).click()

    const submitBtn = page.getByRole("button", { name: /Confirmar Check-in/i })
    await expect(submitBtn).toBeEnabled()

    await submitBtn.dblclick()
    await expect(page).toHaveURL(/\/portaria$/)
    await expect(page.getByText("Check-in concluído e Web Push despachado!")).toHaveCount(1)
  })
})
