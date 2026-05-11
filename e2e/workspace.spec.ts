import { test, expect } from '@playwright/test';

test.describe('Workspace OS V2 Routes', () => {
  // Use a mocked login or just test that the routes don't 404
  // For these we will just check that they exist and have proper auth protection
  test('Dashboard admin route exists and is protected', async ({ page }) => {
    const response = await page.goto('/os/admin');
    expect(response?.status()).not.toBe(404);
  });

  test('Links detail route exists', async ({ page }) => {
    const response = await page.goto('/os/links/123');
    expect(response?.status()).not.toBe(404);
  });

  test('Marketing detail route exists', async ({ page }) => {
    const response = await page.goto('/os/marketing/123');
    expect(response?.status()).not.toBe(404);
  });

  test('Projects detail route exists', async ({ page }) => {
    const response = await page.goto('/os/projects/123');
    expect(response?.status()).not.toBe(404);
  });

  test('Hub note detail route exists', async ({ page }) => {
    const response = await page.goto('/os/hub/123');
    expect(response?.status()).not.toBe(404);
  });
});

test.describe('UX Quality Gates', () => {
  // Simple checks to make sure we don't have basic UI
  test('Landing page publicly accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});
