import { test, expect } from "@playwright/test";

test.describe("Transações Planejadas", () => {
  test("deve exibir a página", async ({ page }) => {
    await page.goto("/recorrentes");

    await expect(
      page.getByRole("heading", { name: /transações planejadas/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve abrir formulário de nova transação planejada", async ({ page }) => {
    await page.goto("/recorrentes");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /nova transação/i }).click();

    await expect(page.getByLabel("Tipo")).toBeVisible();
    await expect(page.getByLabel(/valor/i)).toBeVisible();
    await expect(page.getByLabel("Descrição")).toBeVisible();
    await expect(page.getByLabel(/dia do mês/i)).toBeVisible();
  });

  test("deve criar e excluir uma recorrente", async ({ page }) => {
    await page.goto("/recorrentes");
    await page.waitForTimeout(2000);

    // Create
    await page.getByRole("button", { name: /nova transação/i }).click();
    await page.getByLabel("Tipo").selectOption("despesa");
    await page.waitForTimeout(500);

    await page.getByLabel(/valor/i).fill("99,90");
    await page.getByLabel("Descrição").fill("E2E Recorrente Test");
    await page.getByLabel(/dia do mês/i).fill("15");

    const accountSelect = page.getByLabel("Conta");
    const accountOpts = await accountSelect.locator("option").count();
    if (accountOpts > 1) await accountSelect.selectOption({ index: 1 });

    const categorySelect = page.getByLabel("Categoria");
    const categoryOpts = await categorySelect.locator("option").count();
    if (categoryOpts > 1) await categorySelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /^criar$/i }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText("E2E Recorrente Test")).toBeVisible({ timeout: 10000 });

    // Delete
    const card = page.getByText("E2E Recorrente Test").first();
    const container = card.locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await container.getByRole("button", { name: /excluir/i }).click();
    await page.getByRole("button", { name: /excluir/i }).last().click();

    await expect(page.getByText(/excluída|removida/i)).toBeVisible({ timeout: 5000 });
  });
});
