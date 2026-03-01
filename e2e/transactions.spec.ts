import { test, expect } from "@playwright/test";

test.describe("Transações", () => {
  test("deve exibir a página de transações", async ({ page }) => {
    await page.goto("/transacoes");

    await expect(
      page.getByRole("heading", { name: /transações/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve abrir o formulário de nova transação", async ({ page }) => {
    await page.goto("/transacoes");

    await page.getByRole("button", { name: /nova transação/i }).click();

    // Form should be visible
    await expect(page.getByLabel("Tipo")).toBeVisible();
    await expect(page.getByLabel(/valor/i)).toBeVisible();
    await expect(page.getByLabel("Descrição")).toBeVisible();
  });

  test("deve criar uma transação de despesa", async ({ page }) => {
    await page.goto("/transacoes");

    await page.getByRole("button", { name: /nova transação/i }).click();

    // Fill form
    await page.getByLabel("Tipo").selectOption("despesa");

    // Wait for categories to load
    await page.waitForTimeout(500);

    await page.getByLabel(/valor/i).fill("25,00");
    await page.getByLabel("Descrição").fill("E2E Test - Café");

    // Select first account and category if available
    const accountSelect = page.getByLabel("Conta");
    const accountOptions = await accountSelect.locator("option").count();
    if (accountOptions > 1) {
      await accountSelect.selectOption({ index: 1 });
    }

    const categorySelect = page.getByLabel("Categoria");
    const categoryOptions = await categorySelect.locator("option").count();
    if (categoryOptions > 1) {
      await categorySelect.selectOption({ index: 1 });
    }

    await page.getByLabel("Data").fill(new Date().toISOString().split("T")[0]);

    await page.getByRole("button", { name: /criar transação/i }).click();

    // Should show success or redirect
    await page.waitForTimeout(2000);

    // Look for the transaction in the list
    await expect(page.getByText("E2E Test - Café")).toBeVisible({ timeout: 10000 });
  });

  test("deve excluir a transação de teste", async ({ page }) => {
    await page.goto("/transacoes");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Find the E2E test transaction
    const row = page.getByText("E2E Test - Café").first();
    const isVisible = await row.isVisible().catch(() => false);

    if (isVisible) {
      // Find and click the delete button in the same row
      const tableRow = row.locator("xpath=ancestor::tr");
      await tableRow.getByRole("button", { name: /excluir/i }).click();

      // Confirm deletion
      await page
        .getByRole("button", { name: /excluir/i })
        .last()
        .click();

      // Should show toast
      await expect(page.getByText(/excluída/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
