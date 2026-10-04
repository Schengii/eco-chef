import { estimateCo2Fallback, normalizeIngredients, parseNumericValue, parseStepMinutes, prepareSavedRecipe } from './recipe-utils';
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
