import { test, expect } from "@playwright/test";

// These tests don't use storageState (no auth)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Autenticação", () => {
  test("deve exibir a página de login", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /entrar|login/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("deve exibir erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("invalid@test.com");
    await page.getByLabel("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Should show error message
    await expect(page.getByText(/inválid|incorret|erro/i)).toBeVisible({ timeout: 10000 });
  });

  test("deve exibir a página de registro", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByLabel("Nome completo")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta|registrar/i })).toBeVisible();
  });

  test("deve redirecionar para login quando não autenticado", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
