import { BackupService } from './backup.service';
import { filterRecipes } from './recipe-filter';
import { Recipe } from '../models/eco-chef.models';

const recipe = (title: string, items: string[], rating?: number): Recipe => ({
    title, difficulty: 'Leicht', prepTime: '10 Min.', ecoScore: '🍃', beverage: '', storageTip: '',
    nutrition: { calories: '', protein: '', carbs: '', fat: '' },
    ingredientsList: items.map(item => ({ item, category: 'Sonstiges' })),
    instructions: ['x'], tip: '', rating
});

describe('BackupService', () => {
    test('parseBackup rejects non-objects and accepts partial data', () => {
        expect(BackupService.parseBackup(null)).toBeNull();
        expect(BackupService.parseBackup([])).toBeNull();
        expect(BackupService.parseBackup('x')).toBeNull();
        expect(BackupService.parseBackup({ ingredientChips: ['Apfel', 3] })?.ingredientChips).toEqual(['Apfel']);
    });

    test('parseRecipeImport reports skipped entries', () => {
        const res = BackupService.parseRecipeImport([recipe('A', ['x']), { kaputt: 1 }]);
        expect(res?.recipes).toHaveLength(1);
        expect(res?.skipped).toBe(1);
        expect(BackupService.parseRecipeImport({ not: 'array' })).toBeNull();
    });

    test('mergeImportedRecipes appends with importedAt', () => {
        const merged = BackupService.mergeImportedRecipes([recipe('A', [])], [recipe('B', [])]);
        expect(merged.map(r => r.title)).toEqual(['A', 'B']);
        expect((merged[1] as unknown as Record<string, unknown>).importedAt).toEqual(expect.any(String));
    });
});

describe('filterRecipes', () => {
    const list = [recipe('Tomatensuppe', ['Tomate'], 5), recipe('Pasta', ['Nudeln', 'Tomate'], 3), recipe('Salat', ['Gurke'])];

    test('filters by rating', () => {
        expect(filterRecipes(list, 4, '').map(r => r.title)).toEqual(['Tomatensuppe']);
    });
    test('filters by title or ingredient, case-insensitive', () => {
        expect(filterRecipes(list, 0, ' TOMATE ').map(r => r.title)).toEqual(['Tomatensuppe', 'Pasta']);
        expect(filterRecipes(list, 0, 'gurke')).toHaveLength(1);
    });
    test('empty query returns all', () => {
        expect(filterRecipes(list, 0, '  ')).toHaveLength(3);
    });
});
