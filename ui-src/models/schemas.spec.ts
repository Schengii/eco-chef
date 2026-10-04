import { RecipeSchema, ReceiptItemListSchema, ScannedProductSchema, WeeklyPlanSchema, BackupSchema } from './schemas';
import { extractJson, parseAiJson } from '../services/ai-json';

const baseRecipe = {
    title: 'Curry',
    instructions: ['Kochen'],
    ingredientsList: [{ item: '1 Zwiebel', category: 'Obst & Gemüse' }]
};

describe('RecipeSchema', () => {
    test('fills defaults and coerces ingredients/numbers', () => {
        const r = RecipeSchema.parse({ ...baseRecipe, co2SavedKg: '1,5', ingredientsList: ['Reis', { item: 'Salz' }, 42] });
        expect(r.co2SavedKg).toBe(1.5);
        expect(r.ingredientsList).toEqual([
            { item: 'Reis', category: 'Sonstiges' },
            { item: 'Salz', category: 'Sonstiges' },
            { item: '42', category: 'Sonstiges' }
        ]);
        expect(r.difficulty).toBe('Mittel');
        expect(r.nutrition.calories).toBe('? kcal');
    });

    test('rejects recipes without title or instructions', () => {
        expect(RecipeSchema.safeParse({ ...baseRecipe, title: '' }).success).toBe(false);
        expect(RecipeSchema.safeParse({ ...baseRecipe, instructions: [] }).success).toBe(false);
        expect(RecipeSchema.safeParse({ title: 'x' }).success).toBe(false);
    });

    test('keeps extra fields such as importedAt', () => {
        const r = RecipeSchema.parse({ ...baseRecipe, importedAt: '2026-01-01' }) as Record<string, unknown>;
        expect(r.importedAt).toBe('2026-01-01');
    });
});

describe('scan schemas', () => {
    test('receipt list drops invalid entries and defaults the rest', () => {
        const list = ReceiptItemListSchema.parse([
            { name: 'Milch', quantity: '2', unit: 'L', expiryDays: 7, location: 'Kühlschrank' },
            { name: '' },
            { name: 'Nudeln', location: 'Keller' }
        ]);
        expect(list).toHaveLength(2);
        expect(list[0].quantity).toBe(2);
        expect(list[1]).toMatchObject({ name: 'Nudeln', location: 'Kühlschrank', expiryDays: 7 });
    });

    test('product scan requires a name and a valid date format', () => {
        expect(ScannedProductSchema.safeParse({ quantity: 1 }).success).toBe(false);
        const p = ScannedProductSchema.parse({ name: 'Joghurt', expiryDate: 'bald' });
        expect(p.expiryDate).toBeUndefined();
    });
});

describe('WeeklyPlanSchema', () => {
    test('keeps only known weekdays with a title', () => {
        const plan = WeeklyPlanSchema.parse({
            Montag: { title: 'Suppe', prepTime: '20 Min.', co2SavedKg: 1, notes: 'x' },
            Dienstag: { prepTime: 'ohne Titel' },
            Funtag: { title: 'unbekannt' }
        });
        expect(Object.keys(plan)).toEqual(['Montag']);
    });

    test('rejects a plan without any valid day', () => {
        expect(WeeklyPlanSchema.safeParse({}).success).toBe(false);
    });
});

describe('BackupSchema', () => {
    test('accepts partial backups and drops broken entries', () => {
        const b = BackupSchema.parse({
            savedRecipes: [baseRecipe, { nope: true }],
            shoppingList: [{ name: 'Brot' }, 'kaputt'],
            stats: { '2026-01-01': { calories: '100', count: 1 }, bad: 'x' },
            calorieGoal: '2200'
        });
        expect(b.savedRecipes).toHaveLength(1);
        expect(b.shoppingList).toEqual([{ name: 'Brot', checked: false }]);
        expect(b.stats?.['2026-01-01'].calories).toBe(100);
        expect(b.stats?.bad).toBeUndefined();
        expect(b.calorieGoal).toBe(2200);
        expect(b.pantryItemsAdvanced).toBeUndefined();
    });
});

describe('extractJson / parseAiJson', () => {
    test('handles fences and surrounding prose', () => {
        expect(extractJson('Hier:\n```json\n{"a":1}\n```\nViel Spaß')).toEqual({ a: 1 });
        expect(extractJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    });

    test('throws on missing or broken JSON', () => {
        expect(() => extractJson('kein json')).toThrow();
        expect(() => extractJson('{"a":')).toThrow();
    });

    test('parseAiJson throws the given message on schema mismatch', () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => parseAiJson('{"x":1}', RecipeSchema, 'Rezept ungültig')).toThrow('Rezept ungültig');
    });
});
