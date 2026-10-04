import { Recipe, ShoppingItem, DailyStat, PantryItemAdvanced, Achievement, MealPlan } from '../models/eco-chef.models';

function safeSetItem(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (err: any) {
        console.warn(`[StorageService] Failed to set ${key} in localStorage:`, err);
        if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2147024882) {
            // Attempt recovery if this is savedRecipes
            if (key === 'ecoChef_savedRecipes') {
                try {
                    const recipes = JSON.parse(value);
                    if (Array.isArray(recipes)) {
                        // Strip image data from older recipes to reclaim space
                        const pruned = recipes.map((r: any, idx: number) => {
                            if (idx < recipes.length - 2 && r.image?.startsWith('data:image')) {
                                return { ...r, image: undefined };
                            }
                            return r;
                        });
                        localStorage.setItem(key, JSON.stringify(pruned));
                        console.info('[StorageService] Successfully recovered storage space by pruning old images.');
                        return true;
                    }
                } catch {
                    // Ignore parsing error on recovery attempt
                }
            }
        }
        return false;
    }
}

function openIndexedDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open('ecoChef_db', 1);
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('recipes')) {
                    db.createObjectStore('recipes', { keyPath: 'title' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

export const StorageService = {
    getGdprConsent(): boolean {
        return localStorage.getItem('ecoChef_gdprConsent') === 'true';
    },
    setGdprConsent(consent: boolean): void {
        safeSetItem('ecoChef_gdprConsent', String(consent));
    },

    getTheme(): 'dark' | 'light' | null {
        const t = localStorage.getItem('ecoChef_theme');
        if (t === 'dark' || t === 'light') return t;
        return null;
    },
    setTheme(theme: 'dark' | 'light'): void {
        safeSetItem('ecoChef_theme', theme);
    },

    getLrsMode(): boolean {
        return localStorage.getItem('ecoChef_lrsMode') === 'true';
    },
    setLrsMode(mode: boolean): void {
        safeSetItem('ecoChef_lrsMode', String(mode));
    },

    getFontScale(): number {
        const val = localStorage.getItem('ecoChef_fontScale');
        return val ? parseFloat(val) : 1.0;
    },
    setFontScale(scale: number): void {
        safeSetItem('ecoChef_fontScale', scale.toFixed(1));
    },

    getShowRuler(): boolean {
        return localStorage.getItem('ecoChef_showRuler') === 'true';
    },
    setShowRuler(show: boolean): void {
        safeSetItem('ecoChef_showRuler', String(show));
    },

    getPantry(): { [key: string]: boolean } {
        const saved = localStorage.getItem('ecoChef_pantry');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing pantry", e);
            }
        }
        return {};
    },
    setPantry(pantry: { [key: string]: boolean }): void {
        safeSetItem('ecoChef_pantry', JSON.stringify(pantry));
    },

    getShoppingList(): ShoppingItem[] {
        const saved = localStorage.getItem('ecoChef_shoppingList');
        if (saved) {
            try {
                return JSON.parse(saved).map((item: any) => ({
                    name: item.name,
                    checked: !!item.checked,
                    category: item.category || 'Sonstiges'
                }));
            } catch (e) {
                console.error("Error parsing shopping list", e);
            }
        }
        return [];
    },
    setShoppingList(list: ShoppingItem[]): void {
        safeSetItem('ecoChef_shoppingList', JSON.stringify(list));
    },

    getAllergens(): { [key: string]: boolean } {
        const saved = localStorage.getItem('ecoChef_allergens');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing allergens", e);
            }
        }
        return {};
    },
    setAllergens(allergens: { [key: string]: boolean }): void {
        safeSetItem('ecoChef_allergens', JSON.stringify(allergens));
    },

    getStats(): { [date: string]: DailyStat } {
        const saved = localStorage.getItem('ecoChef_stats');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing stats", e);
            }
        }
        return {};
    },
    setStats(stats: { [date: string]: DailyStat }): void {
        safeSetItem('ecoChef_stats', JSON.stringify(stats));
    },

    getIngredientChips(): string[] {
        const saved = localStorage.getItem('ecoChef_ingredientChips');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing ingredient chips", e);
            }
        }
        return [];
    },
    setIngredientChips(chips: string[]): void {
        safeSetItem('ecoChef_ingredientChips', JSON.stringify(chips));
    },

    getUrgentIngredients(): { [key: string]: boolean } {
        const saved = localStorage.getItem('ecoChef_urgentIngredients');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing urgent ingredients", e);
            }
        }
        return {};
    },
    setUrgentIngredients(urgent: { [key: string]: boolean }): void {
        safeSetItem('ecoChef_urgentIngredients', JSON.stringify(urgent));
    },

    getSavedRecipes(): Recipe[] {
        const saved = localStorage.getItem('ecoChef_savedRecipes');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing saved recipes", e);
            }
        }
        return [];
    },
    setSavedRecipes(recipes: Recipe[]): boolean {
        void this.saveRecipesToIndexedDb(recipes);
        return safeSetItem('ecoChef_savedRecipes', JSON.stringify(recipes));
    },

    async saveRecipesToIndexedDb(recipes: Recipe[]): Promise<boolean> {
        const db = await openIndexedDb();
        if (!db) return false;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction('recipes', 'readwrite');
                const store = tx.objectStore('recipes');
                store.clear();
                recipes.forEach(r => store.put(r));
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch {
                resolve(false);
            }
        });
    },

    async getRecipesFromIndexedDb(): Promise<Recipe[]> {
        const db = await openIndexedDb();
        if (!db) return [];
        return new Promise((resolve) => {
            try {
                const tx = db.transaction('recipes', 'readonly');
                const store = tx.objectStore('recipes');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            } catch {
                resolve([]);
            }
        });
    },

    async restoreRecipesFromIndexedDb(): Promise<Recipe[]> {
        const idbRecipes = await this.getRecipesFromIndexedDb();
        if (idbRecipes.length > 0) {
            safeSetItem('ecoChef_savedRecipes', JSON.stringify(idbRecipes));
            return idbRecipes;
        }
        return this.getSavedRecipes();
    },

    getCalorieGoal(): number {
        const val = localStorage.getItem('ecoChef_calorieGoal');
        return val ? parseInt(val, 10) : 2000;
    },
    setCalorieGoal(goal: number): void {
        safeSetItem('ecoChef_calorieGoal', String(goal));
    },

    getProteinGoal(): number {
        const val = localStorage.getItem('ecoChef_proteinGoal');
        return val ? parseInt(val, 10) : 80;
    },
    setProteinGoal(goal: number): void {
        safeSetItem('ecoChef_proteinGoal', String(goal));
    },

    /** User-supplied Gemini key. Session-only keys (sessionStorage) take precedence over persisted ones. */
    getGeminiApiKey(): string {
        try {
            const sessionKey = sessionStorage.getItem('ecoChef_geminiApiKey');
            if (sessionKey) return sessionKey;
        } catch { /* sessionStorage unavailable */ }
        return localStorage.getItem('ecoChef_geminiApiKey') || '';
    },
    isGeminiKeySessionOnly(): boolean {
        try {
            return !!sessionStorage.getItem('ecoChef_geminiApiKey');
        } catch {
            return false;
        }
    },
    setGeminiApiKey(key: string, sessionOnly = false): void {
        this.clearGeminiApiKey();
        if (!key) return;
        if (sessionOnly) {
            try {
                sessionStorage.setItem('ecoChef_geminiApiKey', key);
                return;
            } catch { /* fall through to persistent storage */ }
        }
        safeSetItem('ecoChef_geminiApiKey', key);
    },
    clearGeminiApiKey(): void {
        try { sessionStorage.removeItem('ecoChef_geminiApiKey'); } catch { /* ignore */ }
        localStorage.removeItem('ecoChef_geminiApiKey');
    },

    getPantryAdvanced(): PantryItemAdvanced[] {
        const saved = localStorage.getItem('ecoChef_pantry_advanced');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing advanced pantry", e);
            }
        }
        return [];
    },
    setPantryAdvanced(pantry: PantryItemAdvanced[]): void {
        safeSetItem('ecoChef_pantry_advanced', JSON.stringify(pantry));
    },

    getAchievements(): Achievement[] {
        const saved = localStorage.getItem('ecoChef_achievements');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing achievements", e);
            }
        }
        return [];
    },
    setAchievements(achievements: Achievement[]): void {
        safeSetItem('ecoChef_achievements', JSON.stringify(achievements));
    },

    getMealPlan(): MealPlan {
        const saved = localStorage.getItem('ecoChef_mealplan');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing meal plan", e);
            }
        }
        return {};
    },
    setMealPlan(plan: MealPlan): void {
        safeSetItem('ecoChef_mealplan', JSON.stringify(plan));
    },

    getBudgetSettings(): { monthlyBudget: number; currentSpent: number; savedEuro: number } {
        const saved = localStorage.getItem('ecoChef_budget');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing budget settings", e);
            }
        }
        return { monthlyBudget: 250, currentSpent: 0, savedEuro: 0 };
    },
    setBudgetSettings(budget: { monthlyBudget: number; currentSpent: number; savedEuro: number }): void {
        safeSetItem('ecoChef_budget', JSON.stringify(budget));
    },

    getNotificationsEnabled(): boolean {
        return localStorage.getItem('ecoChef_notificationsEnabled') === 'true';
    },
    setNotificationsEnabled(enabled: boolean): void {
        safeSetItem('ecoChef_notificationsEnabled', String(enabled));
    },

    getSoundEffectsEnabled(): boolean {
        const item = localStorage.getItem('ecoChef_soundEffectsEnabled');
        return item === null ? true : item === 'true';
    },
    setSoundEffectsEnabled(enabled: boolean): void {
        safeSetItem('ecoChef_soundEffectsEnabled', String(enabled));
    },

    clearAll(): void {
        localStorage.clear();
    }
};
