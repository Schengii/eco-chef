import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

test('pantry: add item with MHD, reject duplicate, delete', async ({ page }) => {
    await enterApp(page);
    await page.getByRole('button', { name: 'Vorratskammer', exact: true }).click();

    const name = page.getByPlaceholder('Zutat (z.B. Tomaten)');
    await name.fill('E2E Joghurt');
    await page.locator('.input-date').fill('2030-01-31');
    await page.getByRole('button', { name: 'Manuell Hinzufügen' }).click();
    await expect(page.locator('.item-name', { hasText: 'E2E Joghurt' })).toBeVisible();

    await name.fill('e2e joghurt');
    await page.getByRole('button', { name: 'Manuell Hinzufügen' }).click();
    await expect(page.getByText('bereits in der Reste-Kammer vorhanden')).toBeVisible();
    await expect(page.locator('.item-name', { hasText: 'E2E Joghurt' })).toHaveCount(1);

    await page.reload();
    await page.getByRole('button', { name: /Küche betreten/ }).click();
    await page.getByRole('button', { name: 'Vorratskammer', exact: true }).click();
    await expect(page.locator('.item-name', { hasText: 'E2E Joghurt' })).toBeVisible();

    await page.getByTitle('Löschen').click();
    await expect(page.locator('.item-name', { hasText: 'E2E Joghurt' })).toHaveCount(0);
});
