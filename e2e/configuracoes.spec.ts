import { test, expect } from "@playwright/test";

test.describe("Configurações", () => {
  test("deve exibir a página com abas", async ({ page }) => {
    await page.goto("/configuracoes");

    await expect(
      page.getByRole("heading", { name: /configurações/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: "Geral" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Categorias" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Regras de Importação" })).toBeVisible();
  });

  test("deve exibir campos da aba Geral", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Geral" }).click();

    // Closing day select
    await expect(page.getByLabel(/dia do mês/i)).toBeVisible({ timeout: 5000 });

    // Reserve target
    await expect(page.getByLabel(/meta.*meses/i)).toBeVisible();

    // Theme buttons
    await expect(page.getByRole("button", { name: "Claro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escuro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sistema" })).toBeVisible();
  });

  test("deve alternar tema", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Geral" }).click();
    await page.waitForTimeout(1000);

    // Click dark theme
    await page.getByRole("button", { name: "Escuro" }).click();
    await page.waitForTimeout(500);

    // Verify dark mode is applied (html has class "dark")
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");

    // Switch back to light
    await page.getByRole("button", { name: "Claro" }).click();
    await page.waitForTimeout(500);

    const htmlClassLight = await page.locator("html").getAttribute("class");
    expect(htmlClassLight).toContain("light");
  });

  test("deve exibir categorias na aba Categorias", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Categorias" }).click();
    await page.waitForTimeout(1000);

    // Should show new category button and existing categories
    await expect(page.getByRole("button", { name: /nova categoria/i })).toBeVisible({ timeout: 5000 });
  });

  test("deve abrir formulário de nova categoria", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Categorias" }).click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: /nova categoria/i }).click();

    await expect(page.getByLabel(/nome/i).first()).toBeVisible();
    await expect(page.getByLabel(/tipo/i).first()).toBeVisible();
  });
});
