import type { IngredientItem, Recipe } from '../models/eco-chef.models';

/** Pure helpers for recipe data (no DOM, no storage) so they can be unit-tested in isolation. */

/** Extracts the first number from values like "450 kcal" or "12,5 g"; 0 if there is none. */
export function parseNumericValue(val: string | number | undefined | null): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const match = val.match(/([\d.,]+)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
}

const CO2_BASE_BY_LEAF: Record<number, number> = { 5: 1.4, 4: 1.0, 3: 0.7, 2: 0.4, 1: 0.2 };

/**
 * Estimates CO₂ savings (kg per meal vs. a meat-based reference) from the eco-score leaves (🍃🍃🍃🍃🍃 = best)
 * and the diet, for recipes where the AI returned no explicit co2SavedKg.
 */
export function estimateCo2Fallback(ecoScore: string | undefined, diet: string): number {
    const leafCount = ((ecoScore || '').match(/🍃/g) || []).length;
    let base = CO2_BASE_BY_LEAF[leafCount] ?? 0.5;
    if (diet === 'vegan') base *= 1.3;
    else if (diet === 'vegetarisch') base *= 1.1;
    return parseFloat(base.toFixed(2));
}

/** Total duration in minutes mentioned in a cooking step ("1 Stunde 20 Minuten" → 80), or null. */
export function parseStepMinutes(stepText: string): number | null {
    const minMatch = stepText.match(/(\d+)\s*(Minuten|Minute|Min|Min\.|min|min\.)/i);
    const hrMatch = stepText.match(/(\d+)\s*(Stunden|Stunde|Std|Std\.|std|std\.)/i);
    let total = 0;
    if (hrMatch) total += parseInt(hrMatch[1], 10) * 60;
    if (minMatch) total += parseInt(minMatch[1], 10);
    return total > 0 ? total : null;
}

/** Ingredient lists from older saves/imports may contain plain strings; always return {item, category}. */
export function normalizeIngredients(ingredients: Array<IngredientItem | string> | undefined): IngredientItem[] {
    if (!ingredients) return [];
    return ingredients.map(ing => {
        if (typeof ing === 'string') return { item: ing, category: 'Sonstiges' };
        if (ing && typeof ing === 'object' && 'item' in ing) return { item: ing.item, category: ing.category || 'Sonstiges' };
        return { item: String(ing), category: 'Sonstiges' };
    });
}

/** A stored recipe ready to be shown: numeric CO₂ value and normalized ingredients. */
export function prepareSavedRecipe(recipe: Recipe): Recipe {
    return {
        ...recipe,
        co2SavedKg: typeof recipe.co2SavedKg === 'number' ? recipe.co2SavedKg : (parseFloat(String(recipe.co2SavedKg)) || 0),
        ingredientsList: normalizeIngredients(recipe.ingredientsList)
    };
}

function scaleNumbers(text: string, ratio: number, format: (scaled: number) => string): string {
    return text.replace(/(\d+(?:[.,]\d+)?)/g, match => {
        const val = parseFloat(match.replace(',', '.'));
        return isNaN(val) ? match : format(val * ratio);
    });
}

/** Scales every number in the ingredient lines and the nutrition values by `ratio` (new portions / old portions). */
export function scaleRecipePortions(recipe: Recipe, ratio: number): Recipe {
    const scaleIngredient = (s: string) =>
        scaleNumbers(s, ratio, scaled => Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1).replace('.', ','));
    const scaleNutrition = (s: string | undefined) =>
        s ? scaleNumbers(s, ratio, scaled => Math.round(scaled).toString()) : '?';
    return {
        ...recipe,
        nutrition: {
            calories: scaleNutrition(recipe.nutrition?.calories),
            protein: scaleNutrition(recipe.nutrition?.protein),
            carbs: scaleNutrition(recipe.nutrition?.carbs),
            fat: scaleNutrition(recipe.nutrition?.fat)
        },
        ingredientsList: recipe.ingredientsList.map(ing => ({ ...ing, item: scaleIngredient(ing.item) }))
    };
}

/** User-facing message for a failed recipe request. */
export function describeAiError(error: unknown): string {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('API_KEY') || msg.includes('403')) return 'Ungültiger API-Key. Bitte in den Einstellungen prüfen.';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return 'API-Limit erreicht. Bitte kurz warten und dann erneut versuchen.';
    if (msg.includes('timeout') || msg.includes('DEADLINE')) return 'Zeitüberschreitung – die KI hat zu lange gebraucht. Bitte nochmal versuchen.';
    if (msg.includes('JSON') || msg.includes('Rezeptdaten')) return 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es nochmal!';
    return 'Verbindungsfehler – bitte Internetverbindung prüfen.';
}
