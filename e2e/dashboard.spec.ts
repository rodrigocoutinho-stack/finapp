import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("deve carregar o dashboard", async ({ page }) => {
    await page.goto("/");

    // Should show greeting or dashboard heading
    await expect(
      page.getByText(/bom dia|boa tarde|boa noite|dashboard/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve exibir hero cards de resumo", async ({ page }) => {
    await page.goto("/");

    // Wait for dashboard content to load
    await expect(page.getByText(/receitas|despesas|saldo/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("deve exibir KPIs", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(/poupança|runway|reserva/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve navegar pela sidebar", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click on Contas in sidebar
    await page.getByRole("link", { name: "Contas" }).click();
    await expect(page).toHaveURL("/contas");

    // Click on Transações
    await page.getByRole("link", { name: "Transações" }).click();
    await expect(page).toHaveURL("/transacoes");

    // Click on Dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");
  });

  test("deve navegar para Simuladores", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Simuladores" }).click();
    await expect(page).toHaveURL("/simuladores");
    await expect(page.getByText("Juros Compostos")).toBeVisible();
  });
});
