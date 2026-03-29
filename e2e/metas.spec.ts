import { test, expect } from "@playwright/test";

test.describe("Metas Financeiras", () => {
  test("deve exibir a página", async ({ page }) => {
    await page.goto("/metas");

    await expect(
      page.getByRole("heading", { name: /metas financeiras/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve abrir formulário de nova meta", async ({ page }) => {
    await page.goto("/metas");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /nova meta/i }).click();

    await expect(page.getByLabel("Nome da meta")).toBeVisible();
    await expect(page.getByLabel(/valor alvo/i)).toBeVisible();
    await expect(page.getByLabel("Prazo")).toBeVisible();
  });

  test("deve criar e excluir uma meta", async ({ page }) => {
    await page.goto("/metas");
    await page.waitForTimeout(2000);

    // Create
    await page.getByRole("button", { name: /nova meta/i }).click();

    await page.getByLabel("Nome da meta").fill("E2E Meta Test");
    await page.getByLabel(/valor alvo/i).fill("5000,00");

    // Set deadline 1 year from now
    const deadline = new Date();
    deadline.setFullYear(deadline.getFullYear() + 1);
    await page.getByLabel("Prazo").fill(deadline.toISOString().split("T")[0]);

    await page.getByLabel("Horizonte").selectOption({ index: 1 });
    await page.getByLabel("Prioridade").selectOption({ index: 2 });

    // Set initial value (should appear when no account is linked)
    const currentAmountField = page.getByLabel(/valor atual/i);
    if (await currentAmountField.isVisible()) {
      await currentAmountField.fill("1000,00");
    }

    await page.getByRole("button", { name: /^criar$/i }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText("E2E Meta Test")).toBeVisible({ timeout: 10000 });

    // Delete
    const card = page.getByText("E2E Meta Test").first();
    const container = card.locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await container.getByRole("button", { name: /excluir/i }).click();
    await page.getByRole("button", { name: /excluir/i }).last().click();

    await expect(page.getByText(/excluída|removida/i)).toBeVisible({ timeout: 5000 });
  });
});
