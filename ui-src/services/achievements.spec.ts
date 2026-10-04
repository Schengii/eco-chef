import { DEFAULT_ACHIEVEMENTS, applyCookedRecipe, incrementAchievement, mergeWithDefaults } from './achievements';
import type { DailyStat, Recipe } from '../models/eco-chef.models';

const fresh = () => mergeWithDefaults([]);
const find = (list: ReturnType<typeof fresh>, id: string) => list.find(a => a.id === id)!;
const stat = (co2Saved: number): DailyStat => ({ calories: 0, protein: 0, carbs: 0, fat: 0, co2Saved, count: 1 });
const recipe = { ingredientsList: [{ item: '2 Tomaten', category: 'Obst & Gemüse' }] } as unknown as Recipe;

describe('mergeWithDefaults', () => {
    it('returns independent copies of the defaults for an empty store', () => {
        const list = fresh();
        list[0].progress = 3;
        expect(DEFAULT_ACHIEVEMENTS[0].progress).toBe(0);
    });
    it('keeps stored progress and appends missing achievements', () => {
        const stored = [{ ...DEFAULT_ACHIEVEMENTS[0], progress: 2 }];
        const merged = mergeWithDefaults(stored);
        expect(merged).toHaveLength(DEFAULT_ACHIEVEMENTS.length);
        expect(find(merged, DEFAULT_ACHIEVEMENTS[0].id).progress).toBe(2);
    });
});

describe('incrementAchievement', () => {
    it('caps at the target, unlocks and does not mutate the input', () => {
        const list = fresh();
        let next = list;
        for (let i = 0; i < 5; i++) next = incrementAchievement(next, 'scannerProfi');
        expect(find(next, 'scannerProfi')).toMatchObject({ progress: 3, unlocked: true });
        expect(find(list, 'scannerProfi').progress).toBe(0);
    });
    it('ignores unknown ids', () => {
        expect(incrementAchievement(fresh(), 'gibtEsNicht')).toEqual(fresh());
    });
});

describe('applyCookedRecipe', () => {
    it('derives the CO₂ achievement from all stats', () => {
        const list = applyCookedRecipe(fresh(), { stats: { a: stat(4.2), b: stat(6) }, recipe: null, diet: 'egal', urgentIngredients: {} });
        expect(find(list, 'klimaSchuetzer')).toMatchObject({ progress: 10, unlocked: true });
    });
    it('counts vegetarian meals and rescued ingredients', () => {
        const list = applyCookedRecipe(fresh(), { stats: {}, recipe, diet: 'vegan', urgentIngredients: { tomaten: true } });
        expect(find(list, 'pflanzenfresser').progress).toBe(1);
        expect(find(list, 'retterKoenig').progress).toBe(1);
    });
    it('does not count meat dishes or non-urgent ingredients', () => {
        const list = applyCookedRecipe(fresh(), { stats: {}, recipe, diet: 'egal', urgentIngredients: { tomaten: false } });
        expect(find(list, 'pflanzenfresser').progress).toBe(0);
        expect(find(list, 'retterKoenig').progress).toBe(0);
    });
});
