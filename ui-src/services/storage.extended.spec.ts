import 'fake-indexeddb/auto';
import { Recipe } from '../models/eco-chef.models';
import { StorageService } from './storage.service';

type MockStorage = ReturnType<typeof createStorageMock>;

function createStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string): string | null => (k in store ? store[k] : null),
        setItem: jest.fn((k: string, v: string) => { store[k] = String(v); }),
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { store = {}; }
    };
}

function installStorages(local: MockStorage = createStorageMock(), session: MockStorage = createStorageMock()) {
    (global as any).localStorage = local;
    (global as any).sessionStorage = session;
    return { local, session };
}

const recipe = (title: string, image?: string): Recipe => ({ title, image } as unknown as Recipe);

describe('StorageService (extended)', () => {
    beforeEach(() => {
        installStorages();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('defaults and simple settings', () => {
        test('returns documented defaults when nothing is stored', () => {
            expect(StorageService.getCalorieGoal()).toBe(2000);
            expect(StorageService.getProteinGoal()).toBe(80);
            expect(StorageService.getSoundEffectsEnabled()).toBe(true);
            expect(StorageService.getNotificationsEnabled()).toBe(false);
            expect(StorageService.getLrsMode()).toBe(false);
            expect(StorageService.getShowRuler()).toBe(false);
            expect(StorageService.getBudgetSettings()).toEqual({ monthlyBudget: 250, currentSpent: 0, savedEuro: 0 });
            expect(StorageService.getMealPlan()).toEqual({});
            expect(StorageService.getAchievements()).toEqual([]);
        });

        test('round-trips settings', () => {
            StorageService.setCalorieGoal(1800);
            StorageService.setProteinGoal(120);
            StorageService.setSoundEffectsEnabled(false);
            StorageService.setNotificationsEnabled(true);
            StorageService.setLrsMode(true);
            StorageService.setShowRuler(true);
            StorageService.setBudgetSettings({ monthlyBudget: 300, currentSpent: 10, savedEuro: 5 });
            StorageService.setAllergens({ Nuesse: true });
            StorageService.setStats({ '2026-01-01': { co2: 1 } as any });
            StorageService.setIngredientChips(['Apfel']);
            StorageService.setUrgentIngredients({ Apfel: true });
            StorageService.setPantry({ Salz: true });
            StorageService.setMealPlan({ Montag: { title: 'x' } } as any);
            StorageService.setAchievements([{ id: 'a' } as any]);

            expect(StorageService.getCalorieGoal()).toBe(1800);
            expect(StorageService.getProteinGoal()).toBe(120);
            expect(StorageService.getSoundEffectsEnabled()).toBe(false);
            expect(StorageService.getNotificationsEnabled()).toBe(true);
            expect(StorageService.getLrsMode()).toBe(true);
            expect(StorageService.getShowRuler()).toBe(true);
            expect(StorageService.getBudgetSettings().monthlyBudget).toBe(300);
            expect(StorageService.getAllergens()).toEqual({ Nuesse: true });
            expect(StorageService.getStats()['2026-01-01']).toBeDefined();
            expect(StorageService.getIngredientChips()).toEqual(['Apfel']);
            expect(StorageService.getUrgentIngredients()).toEqual({ Apfel: true });
            expect(StorageService.getPantry()).toEqual({ Salz: true });
            expect(Object.keys(StorageService.getMealPlan())).toEqual(['Montag']);
            expect(StorageService.getAchievements()).toHaveLength(1);
        });

        test('ignores invalid theme values', () => {
            localStorage.setItem('ecoChef_theme', 'neon');
            expect(StorageService.getTheme()).toBeNull();
        });

        test('falls back to defaults on corrupt JSON', () => {
            jest.spyOn(console, 'error').mockImplementation(() => undefined);
            for (const key of ['pantry', 'shoppingList', 'allergens', 'stats', 'ingredientChips',
                'urgentIngredients', 'savedRecipes', 'pantry_advanced', 'achievements', 'mealplan', 'budget']) {
                localStorage.setItem(`ecoChef_${key}`, '{kaputt');
            }
            expect(StorageService.getPantry()).toEqual({});
            expect(StorageService.getShoppingList()).toEqual([]);
            expect(StorageService.getAllergens()).toEqual({});
            expect(StorageService.getStats()).toEqual({});
            expect(StorageService.getIngredientChips()).toEqual([]);
            expect(StorageService.getUrgentIngredients()).toEqual({});
            expect(StorageService.getSavedRecipes()).toEqual([]);
            expect(StorageService.getPantryAdvanced()).toEqual([]);
            expect(StorageService.getAchievements()).toEqual([]);
            expect(StorageService.getMealPlan()).toEqual({});
            expect(StorageService.getBudgetSettings().monthlyBudget).toBe(250);
        });

        test('clearAll removes everything', () => {
            StorageService.setTheme('dark');
            StorageService.clearAll();
            expect(StorageService.getTheme()).toBeNull();
        });
    });

    describe('Gemini API key', () => {
        test('stores persistently by default and clears', () => {
            StorageService.setGeminiApiKey('abc');
            expect(StorageService.getGeminiApiKey()).toBe('abc');
            expect(StorageService.isGeminiKeySessionOnly()).toBe(false);
            StorageService.clearGeminiApiKey();
            expect(StorageService.getGeminiApiKey()).toBe('');
        });

        test('session-only key is not persisted and takes precedence', () => {
            StorageService.setGeminiApiKey('persistent');
            StorageService.setGeminiApiKey('session', true);
            expect(StorageService.getGeminiApiKey()).toBe('session');
            expect(StorageService.isGeminiKeySessionOnly()).toBe(true);
            expect(localStorage.getItem('ecoChef_geminiApiKey')).toBeNull();
        });

        test('empty key removes any stored key', () => {
            StorageService.setGeminiApiKey('abc');
            StorageService.setGeminiApiKey('');
            expect(StorageService.getGeminiApiKey()).toBe('');
        });

        test('falls back to localStorage when sessionStorage is unavailable', () => {
            const denied = () => { throw new Error('denied'); };
            (global as any).sessionStorage = { getItem: denied, setItem: denied, removeItem: denied };
            StorageService.setGeminiApiKey('fallback', true);
            expect(StorageService.getGeminiApiKey()).toBe('fallback');
            expect(StorageService.isGeminiKeySessionOnly()).toBe(false);
        });
    });

    describe('quota handling', () => {
        test('prunes images of older recipes when quota is exceeded', () => {
            const local = createStorageMock();
            const quotaError = Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
            const written: string[] = [];
            let first = true;
            local.setItem.mockImplementation((k: string, v: string) => {
                if (first && k === 'ecoChef_savedRecipes') { first = false; throw quotaError; }
                written.push(v);
            });
            installStorages(local);
            jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            jest.spyOn(console, 'info').mockImplementation(() => undefined);

            const ok = StorageService.setSavedRecipes([
                recipe('alt', 'data:image/jpeg;base64,AAA'),
                recipe('mittel', 'data:image/jpeg;base64,BBB'),
                recipe('neu1', 'data:image/jpeg;base64,CCC'),
                recipe('neu2', 'data:image/jpeg;base64,DDD')
            ]);

            expect(ok).toBe(true);
            const saved = JSON.parse(written[written.length - 1]);
            expect(saved[0].image).toBeUndefined();
            expect(saved[1].image).toBeUndefined();
            expect(saved[2].image).toBeDefined();
            expect(saved[3].image).toBeDefined();
        });

        test('returns false instead of throwing when storage fails', () => {
            const local = createStorageMock();
            local.setItem.mockImplementation(() => { throw new Error('boom'); });
            installStorages(local);
            jest.spyOn(console, 'warn').mockImplementation(() => undefined);

            expect(() => StorageService.setTheme('dark')).not.toThrow();
            expect(StorageService.setSavedRecipes([recipe('x')])).toBe(false);
        });
    });

    describe('IndexedDB recipe store', () => {
        test('saves and reads recipes', async () => {
            expect(await StorageService.saveRecipesToIndexedDb([recipe('A'), recipe('B')])).toBe(true);
            const titles = (await StorageService.getRecipesFromIndexedDb()).map(r => r.title).sort();
            expect(titles).toEqual(['A', 'B']);
        });

        test('saving replaces the previous set', async () => {
            await StorageService.saveRecipesToIndexedDb([recipe('A'), recipe('B')]);
            await StorageService.saveRecipesToIndexedDb([recipe('C')]);
            const titles = (await StorageService.getRecipesFromIndexedDb()).map(r => r.title);
            expect(titles).toEqual(['C']);
        });

        test('restore prefers IndexedDB and mirrors it into localStorage', async () => {
            await StorageService.saveRecipesToIndexedDb([recipe('Aus IDB')]);
            localStorage.setItem('ecoChef_savedRecipes', JSON.stringify([recipe('Aus LS')]));
            const restored = await StorageService.restoreRecipesFromIndexedDb();
            expect(restored.map(r => r.title)).toEqual(['Aus IDB']);
            expect(JSON.parse(localStorage.getItem('ecoChef_savedRecipes')!)[0].title).toBe('Aus IDB');
        });

        test('restore falls back to localStorage when IndexedDB is empty', async () => {
            await StorageService.saveRecipesToIndexedDb([]);
            localStorage.setItem('ecoChef_savedRecipes', JSON.stringify([recipe('Nur LS')]));
            const restored = await StorageService.restoreRecipesFromIndexedDb();
            expect(restored.map(r => r.title)).toEqual(['Nur LS']);
        });
    });
});
