import { test, expect } from "@playwright/test";

test.describe("Contas", () => {
  test("deve exibir a página de contas", async ({ page }) => {
    await page.goto("/contas");

    await expect(
      page.getByRole("heading", { name: /contas/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve abrir o formulário de nova conta", async ({ page }) => {
    await page.goto("/contas");

    await page.getByRole("button", { name: /nova conta/i }).click();

    // Form should be visible
    await expect(page.getByLabel("Nome da conta")).toBeVisible();
    await expect(page.getByLabel("Tipo")).toBeVisible();
  });

  test("deve criar uma conta de teste", async ({ page }) => {
    await page.goto("/contas");

    await page.getByRole("button", { name: /nova conta/i }).click();

    await page.getByLabel("Nome da conta").fill("E2E Test Conta");
    await page.getByLabel("Tipo").selectOption("carteira");

    await page.getByRole("button", { name: /criar conta/i }).click();

    // Wait for modal to close and list to refresh
    await page.waitForTimeout(2000);

    // Should show the new account
    await expect(page.getByText("E2E Test Conta")).toBeVisible({ timeout: 10000 });
  });

  test("deve excluir a conta de teste", async ({ page }) => {
    await page.goto("/contas");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Find the E2E test account
    const card = page.getByText("E2E Test Conta").first();
    const isVisible = await card.isVisible().catch(() => false);

    if (isVisible) {
      // Find the card container and click Excluir
      const cardContainer = card.locator("xpath=ancestor::div[contains(@class,'rounded-xl')]");
      await cardContainer.getByRole("button", { name: /excluir/i }).click();

      // Confirm deletion
      await page
        .getByRole("button", { name: /excluir/i })
        .last()
        .click();

      // Should show success
      await expect(page.getByText(/excluída/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
