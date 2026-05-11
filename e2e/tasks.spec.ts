import { test, expect } from '@playwright/test';

test.describe('Tasks Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.SEED_ADMIN_EMAIL || 'admin@vertrex.com');
    await page.fill('input[name="password"]', process.env.SEED_ADMIN_PASSWORD || 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/os/admin');
  });

  test('should create a task from the projects page', async ({ page }) => {
    await page.goto('/os/projects');
    await page.waitForLoadState('networkidle');
    const projectLink = page.locator('a[href*="/os/projects/"]').first();
    await projectLink.click();
    await page.waitForLoadState('networkidle');
    await page.goto(page.url() + '/tasks');
    await page.waitForLoadState('networkidle');
    const newTaskBtn = page.locator('button', { hasText: '+ Tarea' }).first();
    if (await newTaskBtn.isVisible()) {
      await newTaskBtn.click();
      await page.fill('input[placeholder*="tarea"]', 'E2E Test Task');
      await page.click('button:has-text("Crear tarea")');
    }
  });

  test('should display kanban board', async ({ page }) => {
    await page.goto('/os/projects');
    await page.waitForLoadState('networkidle');
    const projectLink = page.locator('a[href*="/os/projects/"]').first();
    await projectLink.click();
    await page.goto(page.url() + '/board');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=backlog').first()).toBeVisible({ timeout: 5000 });
  });
});
