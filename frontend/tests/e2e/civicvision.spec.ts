import { test, expect } from '@playwright/test';

test.describe('CivicVision End-to-End Tests', () => {
  
  test('User can navigate from landing page to the dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check title and main heading
    await expect(page).toHaveTitle(/CivicVision/);
    await expect(page.getByText('AI-Powered Waste Detection for Cleaner Cities')).toBeVisible();

    // Click the Dashboard link in header
    await page.getByRole('link', { name: 'My Dashboard' }).click();
    
    // Ensure we are on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible();
  });

  test('Unauthenticated user is redirected from Report Waste flow', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Accept the native alert that fires when checking auth
    page.on('dialog', dialog => dialog.accept());

    // Click the Report Waste button
    await page.getByRole('link', { name: 'Report Waste' }).first().click();
    
    // It should hit the Auth Guard and redirect to /auth/login
    await expect(page).toHaveURL(/.*auth\/login/);
  });

  test('Admin map loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/map');
    
    // Map Legend should be visible
    await expect(page.getByText('Map Legend')).toBeVisible();
    
    // Check that one of the custom markers (e.g. CV-2026-081294) is present or map loads
    // Wait for dynamic map component to mount
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });
  
});
