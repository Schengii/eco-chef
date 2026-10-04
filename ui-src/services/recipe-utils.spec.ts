import {
    describeAiError, estimateCo2Fallback, normalizeIngredients, parseNumericValue, parseStepMinutes,
    prepareSavedRecipe, scaleRecipePortions
} from './recipe-utils';
import type { Recipe } from '../models/eco-chef.models';

describe('parseNumericValue', () => {
    it('reads numbers, units and decimal commas', () => {
        expect(parseNumericValue(12)).toBe(12);
        expect(parseNumericValue('450 kcal')).toBe(450);
        expect(parseNumericValue('12,5 g')).toBe(12.5);
    });
    it('returns 0 for missing or non-numeric input', () => {
        expect(parseNumericValue(undefined)).toBe(0);
        expect(parseNumericValue(null)).toBe(0);
        expect(parseNumericValue('keine Angabe')).toBe(0);
    });
});

describe('estimateCo2Fallback', () => {
    it('scales with eco-score leaves', () => {
        expect(estimateCo2Fallback('🍃🍃🍃🍃🍃', 'egal')).toBe(1.4);
        expect(estimateCo2Fallback('🍃🍃', 'egal')).toBe(0.4);
    });
    it('uses 0.5 without a score and applies diet factors', () => {
        expect(estimateCo2Fallback(undefined, 'egal')).toBe(0.5);
        expect(estimateCo2Fallback('🍃🍃🍃🍃🍃', 'vegan')).toBe(1.82);
        expect(estimateCo2Fallback('🍃🍃🍃🍃🍃', 'vegetarisch')).toBe(1.54);
    });
});

describe('parseStepMinutes', () => {
    it('sums hours and minutes', () => {
        expect(parseStepMinutes('Backen, 1 Stunde 20 Minuten')).toBe(80);
        expect(parseStepMinutes('Köcheln lassen, 15 Min.')).toBe(15);
        expect(parseStepMinutes('Ruhen lassen, 2 Std')).toBe(120);
    });
    it('returns null if no duration is mentioned', () => {
        expect(parseStepMinutes('Gemüse schneiden')).toBeNull();
    });
});

describe('normalizeIngredients', () => {
    it('converts strings, fills missing categories and tolerates undefined', () => {
        expect(normalizeIngredients(undefined)).toEqual([]);
        expect(normalizeIngredients(['2 Eier', { item: 'Mehl', category: '' }, { item: 'Apfel', category: 'Obst & Gemüse' }])).toEqual([
            { item: '2 Eier', category: 'Sonstiges' },
            { item: 'Mehl', category: 'Sonstiges' },
            { item: 'Apfel', category: 'Obst & Gemüse' }
        ]);
    });
});

describe('prepareSavedRecipe', () => {
    it('coerces a string CO₂ value and normalizes ingredients', () => {
        const r = prepareSavedRecipe({ title: 'x', co2SavedKg: '1,2 kg' as unknown as number, ingredientsList: ['Salz'] } as unknown as Recipe);
        expect(r.co2SavedKg).toBe(1);
        expect(r.ingredientsList).toEqual([{ item: 'Salz', category: 'Sonstiges' }]);
    });
    it('falls back to 0 for unparsable values', () => {
        expect(prepareSavedRecipe({ title: 'x', co2SavedKg: 'viel' as unknown as number, ingredientsList: [] } as unknown as Recipe).co2SavedKg).toBe(0);
    });
});

describe('scaleRecipePortions', () => {
    const recipe = {
        title: 'x',
        nutrition: { calories: '400 kcal', protein: '12,5g', carbs: '50 g', fat: 'ca. 8 g' },
        ingredientsList: [
            { item: '200 g Reis', category: 'Vorrat' },
            { item: '1,5 l Wasser', category: 'Vorrat' },
            { item: 'Salz', category: 'Vorrat' }
        ]
    } as unknown as Recipe;

    it('scales ingredient amounts, keeping integers clean and decimals with a comma', () => {
        const scaled = scaleRecipePortions(recipe, 1.5);
        expect(scaled.ingredientsList.map(i => i.item)).toEqual(['300 g Reis', '2,3 l Wasser', 'Salz']);
    });
    it('rounds nutrition values and keeps their units', () => {
        expect(scaleRecipePortions(recipe, 2).nutrition).toEqual({ calories: '800 kcal', protein: '25g', carbs: '100 g', fat: 'ca. 16 g' });
    });
    it('uses ? for missing nutrition values and does not mutate the input', () => {
        const bare = { ...recipe, nutrition: { calories: '100' } } as unknown as Recipe;
        expect(scaleRecipePortions(bare, 2).nutrition.protein).toBe('?');
        expect(recipe.ingredientsList[0].item).toBe('200 g Reis');
    });
});

describe('describeAiError', () => {
    it.each([
        ['API_KEY_INVALID', 'Ungültiger API-Key. Bitte in den Einstellungen prüfen.'],
        ['HTTP 403', 'Ungültiger API-Key. Bitte in den Einstellungen prüfen.'],
        ['HTTP 429', 'API-Limit erreicht. Bitte kurz warten und dann erneut versuchen.'],
        ['DEADLINE_EXCEEDED', 'Zeitüberschreitung – die KI hat zu lange gebraucht. Bitte nochmal versuchen.'],
        ['Unexpected token in JSON', 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es nochmal!'],
        ['network down', 'Verbindungsfehler – bitte Internetverbindung prüfen.']
    ])('%s', (message, expected) => {
        expect(describeAiError(new Error(message))).toBe(expected);
    });
    it('handles non-Error values', () => {
        expect(describeAiError('boom')).toBe('Verbindungsfehler – bitte Internetverbindung prüfen.');
    });
});
