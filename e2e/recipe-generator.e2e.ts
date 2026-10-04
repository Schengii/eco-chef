import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

const recipe = {
    title: 'E2E Gemüse-Reis',
    difficulty: 'Leicht',
    prepTime: '15 Min.',
    ecoScore: '🍃🍃🍃🍃',
    co2SavedKg: 1.1,
    nutrition: { calories: '400 kcal', protein: '10g', carbs: '60g', fat: '8g' },
    ingredientsList: [{ item: '2 Tomaten', category: 'Obst & Gemüse' }, { item: '150g Reis', category: 'Vorrat' }],
    instructions: ['Reis kochen', 'Tomaten anbraten']
};

test.beforeEach(async ({ page }) => {
    await page.route('**/api/gemini', route => {
        const body = route.request().postDataJSON() as { action?: string };
        if (body.action === 'generateImages') return route.fulfill({ status: 501, json: { error: 'nicht verfügbar', generatedImages: [] } });
        return route.fulfill({ json: { text: JSON.stringify(recipe) } });
    });
});

async function generate(page: import('@playwright/test').Page) {
    await enterApp(page);
    const input = page.locator('#ingredients-input');
    await input.fill('Reis');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Rezept mit künstlicher Intelligenz generieren' }).click();
    await expect(page.getByText(recipe.title).first()).toBeVisible();
}

test('portions: scaling ingredients and nutrition', async ({ page }) => {
    await generate(page);
    await page.getByRole('button', { name: 'Portionen vergrößern' }).click();
    await expect(page.getByText('🍽️ 3 Personen')).toBeVisible();
    await expect(page.getByText('225g Reis')).toBeVisible();
    await expect(page.getByText('3 Tomaten')).toBeVisible();
});

test('follow-up prompt is sent with the chat history and shown in the chat', async ({ page }) => {
    const prompts: string[] = [];
    await page.route('**/api/gemini', async route => {
        const body = route.request().postDataJSON() as { action?: string; contents?: unknown[] };
        if (body.action === 'generateContent') prompts.push(String(body.contents?.at(-1)));
        return route.fallback();
    });
    await generate(page);

    await page.locator('.regenerate-input').fill('mach es schärfer');
    await page.getByRole('button', { name: /Rezept anpassen/ }).click();

    await expect(page.locator('.chat-message', { hasText: 'mach es schärfer' })).toBeVisible();
    await expect.poll(() => prompts.length).toBe(2);
    expect(prompts[1]).toContain('mach es schärfer');
    expect(prompts[0]).not.toContain('mach es schärfer');
});
