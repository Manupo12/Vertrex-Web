import { test, expect } from '@playwright/test';

test.describe('Portal Client', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/portal/login');
    await expect(page.locator('text=Portal de Cliente')).toBeVisible({ timeout: 5000 });
  });
});
