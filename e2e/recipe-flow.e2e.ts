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
    instructions: ['Reis kochen für 10 Minuten', 'Tomaten anbraten', 'Alles mischen und servieren']
};

test('ingredients -> generated recipe -> cooking mode and timer flow', async ({ page }) => {
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

    // Start cooking mode
    const startCookingBtn = page.getByRole('button', { name: '👨‍🍳 Kochmodus starten' });
    await expect(startCookingBtn).toBeVisible();
    await startCookingBtn.click();

    // Verify cooking mode modal opened
    const cookingOverlay = page.locator('.cooking-mode-overlay');
    await expect(cookingOverlay).toBeVisible();
    await expect(page.getByText('Schritt 1 von 3')).toBeVisible();

    // Verify step timeline / instruction in cooking mode
    await expect(cookingOverlay.locator('.timeline-step.active')).toContainText('Reis kochen für 10 Minuten');

    // Start quick timer (+1 Min)
    const quickTimerBtn = page.getByRole('button', { name: '+1 Min' });
    await expect(quickTimerBtn).toBeVisible();
    await quickTimerBtn.click();

    // Check timer is active
    await expect(page.getByText('Aktiv')).toBeVisible();

    // Navigate to next step
    const nextBtn = cookingOverlay.locator('.cooking-controls').getByRole('button', { name: 'Nächster Schritt' });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.getByText('Schritt 2 von 3')).toBeVisible();

    // Navigate back to step 1
    const prevBtn = cookingOverlay.locator('.cooking-controls').getByRole('button', { name: 'Vorheriger Schritt' });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    await expect(page.getByText('Schritt 1 von 3')).toBeVisible();

    // Close cooking mode
    const closeBtn = page.getByRole('button', { name: 'Kochmodus beenden' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(cookingOverlay).toBeHidden();
});
