import { test, expect } from '@playwright/test';

test.describe('Vyra World-Class End-to-End Critical User Journeys', () => {
  test('Flow 1: /today and /exercises load with zero page errors and render core UI', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // 1. Visit /today
    await page.goto('/today');
    await page.waitForLoadState('domcontentloaded');

    // Confirm no unhandled page errors
    expect(pageErrors).toHaveLength(0);

    // Verify main container renders
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    // 2. Visit /exercises (Catalogue & Muscle Filters)
    await page.goto('/exercises');
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors).toHaveLength(0);

    // Search input should be present and focusable
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible();

    // Filter pills should be available
    const allFilter = page.locator('button:has-text("All")').first();
    await expect(allFilter).toBeVisible();
  });

  test('Flow 2: /session active workout and station reorder / jump drawer', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/session');
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors).toHaveLength(0);

    // If on preview screen, start workout
    const startWorkoutBtn = page.locator('button:has-text("Start Workout"), button:has-text("Begin Session"), button:has-text("Start Lifting")').first();
    if (await startWorkoutBtn.isVisible()) {
      await startWorkoutBtn.click();
    }

    // Look for Reorder / Jump Station button
    const reorderBtn = page.locator('button[title*="Reorder" i], button[title*="Jump" i], button:has-text("Jump"), button:has-text("Reorder")').first();
    if (await reorderBtn.isVisible()) {
      await reorderBtn.click();
      // Verify sheet title appears
      const sheetTitle = page.locator('text=/Reorder or Jump Station/i');
      await expect(sheetTitle).toBeVisible();
    }
  });

  test('Flow 3: /invite/coach_demo onboarding and program acceptance', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/invite/coach_demo');
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors).toHaveLength(0);

    // Verify program title appears
    const programHeading = page.locator('text=/16-Week Recomposition & Structural Balance/i');
    await expect(programHeading).toBeVisible();

    // Click Accept button
    const acceptBtn = page.locator('button:has-text("Accept & Start Day 1 Workout")');
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    // Verify navigation or redirect to /today
    await page.waitForURL((url) => url.pathname.includes('/today'), { timeout: 10000 });
    expect(page.url()).toContain('/today');
  });

  test('Flow 4: /posture structural balance architecture hub', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/posture');
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors).toHaveLength(0);

    // Body content renders
    const pageBody = page.locator('body');
    await expect(pageBody).toBeVisible();

    // Ensure no crash overlay
    const nextError = page.locator('nextjs-portal, [data-nextjs-dialog-overlay]');
    expect(await nextError.count()).toBe(0);
  });

  test('Flow 5: /trainee/unknown_id resilient error boundary', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/trainee/non_existent_athlete_id_404');
    await page.waitForLoadState('domcontentloaded');

    expect(pageErrors).toHaveLength(0);

    // Verify Athlete Not Found card renders gracefully without crash
    const notFoundText = page.locator('text=/Athlete Not Found/i');
    await expect(notFoundText).toBeVisible();

    const backLink = page.getByRole('link', { name: 'Back to Roster' });
    await expect(backLink).toBeVisible();
  });
});
