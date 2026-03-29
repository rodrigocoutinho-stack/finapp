import { test, expect } from "@playwright/test";

test.describe("Dívidas", () => {
  test("deve exibir a página", async ({ page }) => {
    await page.goto("/dividas");

    await expect(
      page.getByRole("heading", { name: /dívidas/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("deve abrir formulário de nova dívida", async ({ page }) => {
    await page.goto("/dividas");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /nova dívida/i }).click();

    await expect(page.getByLabel("Nome da dívida")).toBeVisible();
    await expect(page.getByLabel(/valor original/i)).toBeVisible();
    await expect(page.getByLabel(/saldo devedor/i)).toBeVisible();
    await expect(page.getByLabel(/parcela mensal/i)).toBeVisible();
    await expect(page.getByLabel(/juros/i)).toBeVisible();
  });

  test("deve criar e excluir uma dívida", async ({ page }) => {
    await page.goto("/dividas");
    await page.waitForTimeout(2000);

    // Create
    await page.getByRole("button", { name: /nova dívida/i }).click();

    await page.getByLabel("Nome da dívida").fill("E2E Dívida Test");
    await page.getByLabel("Tipo").selectOption({ index: 1 });
    await page.getByLabel(/valor original/i).fill("10000,00");
    await page.getByLabel(/saldo devedor/i).fill("8000,00");
    await page.getByLabel(/parcela mensal/i).fill("500,00");
    await page.getByLabel(/juros/i).fill("1,5");

    const startDate = page.getByLabel(/data de início/i);
    if (await startDate.isVisible()) {
      await startDate.fill("2025-01-01");
    }

    const dueDate = page.getByLabel(/data de vencimento/i);
    if (await dueDate.isVisible()) {
      await dueDate.fill("2027-12-31");
    }

    const totalInstallments = page.getByLabel(/total de parcelas/i);
    if (await totalInstallments.isVisible()) {
      await totalInstallments.fill("24");
    }

    const paidInstallments = page.getByLabel(/parcelas pagas/i);
    if (await paidInstallments.isVisible()) {
      await paidInstallments.fill("4");
    }

    await page.getByRole("button", { name: /^criar$/i }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText("E2E Dívida Test")).toBeVisible({ timeout: 10000 });

    // Delete
    const card = page.getByText("E2E Dívida Test").first();
    const container = card.locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await container.getByRole("button", { name: /excluir/i }).click();
    await page.getByRole("button", { name: /excluir/i }).last().click();

    await expect(page.getByText(/excluída|removida/i)).toBeVisible({ timeout: 5000 });
  });
});
