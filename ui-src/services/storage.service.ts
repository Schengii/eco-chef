import { Recipe, ShoppingItem, DailyStat, PantryItemAdvanced, Achievement, MealPlan } from '../models/eco-chef.models';

export const StorageService = {
    getGdprConsent(): boolean {
        return localStorage.getItem('ecoChef_gdprConsent') === 'true';
    },
    setGdprConsent(consent: boolean): void {
        localStorage.setItem('ecoChef_gdprConsent', String(consent));
    },

    getTheme(): 'dark' | 'light' | null {
        const t = localStorage.getItem('ecoChef_theme');
        if (t === 'dark' || t === 'light') return t;
        return null;
    },
    setTheme(theme: 'dark' | 'light'): void {
        localStorage.setItem('ecoChef_theme', theme);
    },

    getLrsMode(): boolean {
        return localStorage.getItem('ecoChef_lrsMode') === 'true';
    },
    setLrsMode(mode: boolean): void {
        localStorage.setItem('ecoChef_lrsMode', String(mode));
    },

    getFontScale(): number {
        const val = localStorage.getItem('ecoChef_fontScale');
        return val ? parseFloat(val) : 1.0;
    },
    setFontScale(scale: number): void {
        localStorage.setItem('ecoChef_fontScale', scale.toFixed(1));
    },

    getShowRuler(): boolean {
        return localStorage.getItem('ecoChef_showRuler') === 'true';
    },
    setShowRuler(show: boolean): void {
        localStorage.setItem('ecoChef_showRuler', String(show));
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
        localStorage.setItem('ecoChef_pantry', JSON.stringify(pantry));
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
        localStorage.setItem('ecoChef_shoppingList', JSON.stringify(list));
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
        localStorage.setItem('ecoChef_allergens', JSON.stringify(allergens));
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
        localStorage.setItem('ecoChef_stats', JSON.stringify(stats));
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
        localStorage.setItem('ecoChef_ingredientChips', JSON.stringify(chips));
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
        localStorage.setItem('ecoChef_urgentIngredients', JSON.stringify(urgent));
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
    setSavedRecipes(recipes: Recipe[]): void {
        localStorage.setItem('ecoChef_savedRecipes', JSON.stringify(recipes));
    },

    getCalorieGoal(): number {
        const val = localStorage.getItem('ecoChef_calorieGoal');
        return val ? parseInt(val, 10) : 2000;
    },
    setCalorieGoal(goal: number): void {
        localStorage.setItem('ecoChef_calorieGoal', String(goal));
    },

    getProteinGoal(): number {
        const val = localStorage.getItem('ecoChef_proteinGoal');
        return val ? parseInt(val, 10) : 80;
    },
    setProteinGoal(goal: number): void {
        localStorage.setItem('ecoChef_proteinGoal', String(goal));
    },

    getGeminiApiKey(): string {
        return localStorage.getItem('ecoChef_geminiApiKey') || '';
    },
    setGeminiApiKey(key: string): void {
        localStorage.setItem('ecoChef_geminiApiKey', key);
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
        localStorage.setItem('ecoChef_pantry_advanced', JSON.stringify(pantry));
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
        localStorage.setItem('ecoChef_achievements', JSON.stringify(achievements));
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
        localStorage.setItem('ecoChef_mealplan', JSON.stringify(plan));
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
        localStorage.setItem('ecoChef_budget', JSON.stringify(budget));
    },

    getNotificationsEnabled(): boolean {
        return localStorage.getItem('ecoChef_notificationsEnabled') === 'true';
    },
    setNotificationsEnabled(enabled: boolean): void {
        localStorage.setItem('ecoChef_notificationsEnabled', String(enabled));
    },

    getSoundEffectsEnabled(): boolean {
        const item = localStorage.getItem('ecoChef_soundEffectsEnabled');
        return item === null ? true : item === 'true';
    },
    setSoundEffectsEnabled(enabled: boolean): void {
        localStorage.setItem('ecoChef_soundEffectsEnabled', String(enabled));
    },

    clearAll(): void {
        localStorage.clear();
    }
};
