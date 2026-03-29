import { test, expect } from "@playwright/test";

test.describe("Simuladores", () => {
  test("deve exibir a página com todas as abas", async ({ page }) => {
    await page.goto("/simuladores");

    await expect(
      page.getByRole("heading", { name: /simuladores/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: "Juros Compostos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inflação" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Custo de Oportunidade" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Independência Financeira" })).toBeVisible();
  });

  test("deve calcular juros compostos", async ({ page }) => {
    await page.goto("/simuladores");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Juros Compostos" }).click();

    // Fill in the form
    const investimentoInicial = page.getByLabel(/investimento inicial|valor inicial|capital/i);
    if (await investimentoInicial.isVisible()) {
      await investimentoInicial.fill("10000");
    }

    const aporteMensal = page.getByLabel(/aporte mensal|contribuição/i);
    if (await aporteMensal.isVisible()) {
      await aporteMensal.fill("500");
    }

    const taxa = page.getByLabel(/taxa|juros/i).first();
    if (await taxa.isVisible()) {
      await taxa.fill("1");
    }

    const periodo = page.getByLabel(/período|meses|prazo/i).first();
    if (await periodo.isVisible()) {
      await periodo.fill("120");
    }

    // Should show results (chart or summary)
    await page.waitForTimeout(1000);
    await expect(page.getByText(/montante|total|resultado/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("deve navegar entre abas", async ({ page }) => {
    await page.goto("/simuladores");
    await page.waitForTimeout(2000);

    // Navigate to Inflação
    await page.getByRole("button", { name: "Inflação" }).click();
    await expect(page.getByLabel(/inflação|taxa anual/i).first()).toBeVisible({ timeout: 5000 });

    // Navigate to Custo de Oportunidade
    await page.getByRole("button", { name: "Custo de Oportunidade" }).click();
    await expect(page.getByLabel(/gasto mensal|despesa/i).first()).toBeVisible({ timeout: 5000 });

    // Navigate to Independência Financeira
    await page.getByRole("button", { name: "Independência Financeira" }).click();
    await expect(page.getByLabel(/despesa mensal|patrimônio|patrimonio/i).first()).toBeVisible({ timeout: 5000 });
  });
});
