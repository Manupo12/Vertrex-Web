import { test, expect } from '@playwright/test';

test.describe('Autenticacion OS Interno', () => {
  test('La pagina de login carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Acceso Vertrex OS');
  });

  test('Rutas protegidas redirigen al login', async ({ page }) => {
    await page.goto('/os/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Login fallido muestra mensaje de error', async ({ page }) => {
    await page.goto('/login?error=1');
    await expect(page.locator('text=Credenciales invalidas')).toBeVisible();
  });
});

test.describe('Autenticacion Portal Cliente', () => {
  test('La pagina de login del portal carga correctamente', async ({ page }) => {
    await page.goto('/portal/login');
    await expect(page.locator('h1')).toContainText('Portal de Cliente');
  });

  test('Rutas de portal protegido redirigen a login', async ({ page }) => {
    await page.goto('/portal/demo-client');
    await expect(page).toHaveURL(/.*\/portal\/login/);
  });

  test('Login de portal fallido muestra mensaje de error', async ({ page }) => {
    await page.goto('/portal/login?error=invalid_pin');
    await expect(page.locator('text=Los datos no coinciden')).toBeVisible();
  });
});
