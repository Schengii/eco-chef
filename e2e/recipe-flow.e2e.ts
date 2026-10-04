import { test, expect } from '@playwright/test';
import { enterApp } from './helpers';

const recipe = {
    title: 'E2E Tomaten-Reis-Pfanne',
    difficulty: 'Leicht',
    prepTime: '15 Min.',
    ecoScore: '🍃🍃🍃🍃',
    co2SavedKg: 1.1,
    nutrition: { calories: '400 kcal', protein: '10g', carbs: '60g', fat: '8g' },
    ingredientsList: [{ item: '2 Tomaten', category: 'Obst & Gemüse' }, { item: '150g Reis', category: 'Vorrat' }],
    instructions: ['Reis kochen', 'Tomaten anbraten', 'Alles mischen']
};

test('ingredients -> generated recipe (mocked AI proxy)', async ({ page }) => {
    const requests: Array<Record<string, unknown>> = [];
    await page.route('**/api/gemini', async route => {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        requests.push(body);
        if (body.action === 'generateImages') {
            return route.fulfill({ status: 501, json: { error: 'nicht verfügbar', generatedImages: [] } });
        }
        return route.fulfill({ json: { text: JSON.stringify(recipe) } });
    });

    await enterApp(page);


    const input = page.locator('#ingredients-input');
    await input.fill('Tomaten');
    await input.press('Enter');
    await input.fill('Reis');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Rezept mit künstlicher Intelligenz generieren' }).click();

    await expect(page.getByText(recipe.title).first()).toBeVisible();
    expect(requests.some(r => r.action === 'generateContent')).toBe(true);

    const prompt = String((requests.find(r => r.action === 'generateContent')!.contents as unknown[]).at(-1));
    expect(prompt).toContain('Tomaten');
    expect(prompt).toContain('<nutzerdaten');
});
