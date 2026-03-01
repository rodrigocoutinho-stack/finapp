import { test as setup, expect } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? "";
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "";

setup("authenticate", async ({ page }) => {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(
      "Missing E2E_USER_EMAIL or E2E_USER_PASSWORD environment variables. " +
      "Create a test user in Supabase and set these env vars before running tests."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Senha").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL("/", { timeout: 15000 });

  // Save authentication state
  await page.context().storageState({ path: ".playwright/.auth/user.json" });
});
