import { test, expect } from "@playwright/test";

test.describe("Fluxo", () => {
  test("deve exibir a página com abas", async ({ page }) => {
    await page.goto("/fluxo");

    await expect(
      page.getByRole("heading", { name: /fluxo/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: /fluxo diário/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /fluxo previsto/i })).toBeVisible();
  });

  test("deve navegar entre abas", async ({ page }) => {
    await page.goto("/fluxo");
    await page.waitForTimeout(2000);

    // Click Fluxo Previsto tab
    await page.getByRole("button", { name: /fluxo previsto/i }).click();
    await page.waitForTimeout(2000);

    // Should show forecast content (table or empty state)
    await expect(
      page.getByText(/previsão|previsto|receita|despesa|nenhum/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Click back to Fluxo Diário
    await page.getByRole("button", { name: /fluxo diário/i }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByText(/saldo|abertura|dia|nenhum/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("deve exibir navegação de mês", async ({ page }) => {
    await page.goto("/fluxo");
    await page.waitForTimeout(2000);

    // MonthPicker should be visible with month navigation
    await expect(
      page.getByText(/janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
