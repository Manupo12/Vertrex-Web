import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Vertrex|Login|Iniciar/i);
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("redirects unauthenticated users from /os to login", async ({ page }) => {
    await page.goto("/os");
    await page.waitForURL(/login|auth/, { timeout: 5000 });
  });
});
