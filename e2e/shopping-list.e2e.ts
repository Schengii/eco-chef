import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

test('shopping list: add item, survives reload', async ({ page }) => {
    await enterApp(page);

    await page.getByRole('button', { name: 'Einkaufsliste', exact: true }).click();
    const input = page.getByLabel('Manuelle Zutat eingeben');
    await input.fill('E2E Haferflocken');
    await page.getByRole('button', { name: 'Zutat hinzufügen' }).click();
    await expect(page.getByText('E2E Haferflocken')).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /Küche betreten/ }).click();
    await page.getByRole('button', { name: 'Einkaufsliste', exact: true }).click();
    await expect(page.getByText('E2E Haferflocken')).toBeVisible();
});
