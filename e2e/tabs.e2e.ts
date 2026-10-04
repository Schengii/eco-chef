import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

const tabs: Array<[label: string, element: string]> = [
    ['Vorratskammer', 'eco-chef-pantry'],
    ['Wochenplan', 'eco-chef-meal-planner'],
    ['Einkaufsliste', 'eco-chef-shopping-list'],
    ['Wochenmärkte', 'eco-chef-regional-map'],
    ['Erfolge', 'eco-chef-achievements'],
    ['Analytics Dashboard', 'eco-chef-dashboard'],
    ['Einstellungen', 'eco-chef-settings'],
    ['Rezept-Generator', '#ingredients-input']
];

test('every tab renders its component (lazy loading works)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await enterApp(page);

    for (const [label, selector] of tabs) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await expect(page.locator(selector), label).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('saved recipes view opens from the generator', async ({ page }) => {
    await enterApp(page);
    await page.getByRole('button', { name: /Meine Rezepte anzeigen/ }).click();
    await expect(page.locator('eco-chef-saved-recipes')).toBeVisible();
});
