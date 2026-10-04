import { expect, type Page } from '@playwright/test';

/** Opens the app on a fresh profile: accept the GDPR banner first (it overlays the welcome screen), then enter. */
export async function enterApp(page: Page): Promise<void> {
    await page.goto('/');
    const consent = page.getByRole('button', { name: 'Einwilligen und fortfahren' });
    await expect(consent).toBeVisible();
    await consent.click();
    await expect(consent).toBeHidden();
    await page.getByRole('button', { name: /Küche betreten/ }).click();
}
