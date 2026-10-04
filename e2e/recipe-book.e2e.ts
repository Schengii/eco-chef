import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

const recipe = {
    title: 'E2E Kochbuch-Eintopf',
    difficulty: 'Leicht',
    prepTime: '20 Min.',
    ecoScore: '🍃🍃🍃',
    co2SavedKg: 0.8,
    nutrition: { calories: '350 kcal', protein: '12g', carbs: '50g', fat: '6g' },
    ingredientsList: [{ item: '200g Linsen', category: 'Vorrat' }],
    instructions: ['Linsen kochen']
};

test('recipe book: save generated recipe, rate it, delete it', async ({ page }) => {
    await page.route('**/api/gemini', route => {
        const body = route.request().postDataJSON() as { action?: string };
        if (body.action === 'generateImages') return route.fulfill({ status: 501, json: { error: 'nicht verfügbar', generatedImages: [] } });
        return route.fulfill({ json: { text: JSON.stringify(recipe) } });
    });
    await enterApp(page);

    const input = page.locator('#ingredients-input');
    await input.fill('Linsen');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Rezept mit künstlicher Intelligenz generieren' }).click();
    await expect(page.getByText(recipe.title).first()).toBeVisible();

    await page.locator('eco-chef-recipe-view .finish-btn').click();
    await page.getByRole('button', { name: /Speichern/ }).click();
    await expect(page.getByText('Rezept gespeichert').first()).toBeVisible();
    await page.locator('eco-chef-recipe-view .finish-btn').click();
    await page.getByRole('button', { name: /Neues Rezept laden/ }).click();

    await page.getByRole('button', { name: /Meine Rezepte anzeigen/ }).click();
    const card = page.getByRole('button', { name: `Rezept öffnen: ${recipe.title}` });
    await expect(card).toBeVisible();

    await page.getByRole('button', { name: '4 Sterne', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: /Küche betreten/ }).click();
    await page.getByRole('button', { name: /Meine Rezepte anzeigen/ }).click();
    await expect(page.getByRole('button', { name: '4 Sterne', exact: true })).toHaveText('⭐');
    await expect(page.getByRole('button', { name: '5 Sterne', exact: true })).toHaveText('☆');

    await page.getByRole('button', { name: `${recipe.title} löschen` }).click();
    await expect(card).toHaveCount(0);
});
