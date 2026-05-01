import { test, expect } from "@playwright/test";

test.describe("OS Workspace Navigation", () => {
  test("landing page loads with navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav, header, [role='navigation']").first()).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("os shell sidebar navigation renders", async ({ page }) => {
    await page.goto("/os");
    const sidebar = page.locator("aside, [class*='sidebar']").first();
    await expect(sidebar).toBeVisible();
  });

  test("workspace health page loads", async ({ page }) => {
    await page.goto("/os/health");
    await expect(page.locator("text=Salud del Workspace").first()).toBeVisible();
  });

  test("projects timeline page loads", async ({ page }) => {
    await page.goto("/os/projects/timeline");
    await expect(page.locator("text=Timeline").first()).toBeVisible();
  });

  test("portal client page loads", async ({ page }) => {
    await page.goto("/portal/demo-client");
    await expect(page.locator("text=Portal de Cliente").first()).toBeVisible();
  });
});
