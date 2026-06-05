export interface IngredientItem {
    item: string;
    category: string;
}

export interface Nutrition {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
}

export interface Recipe {
    title: string;
    difficulty: string;
    prepTime: string;
    ecoScore: string;
    ecoScoreDetails?: string;
    co2Footprint?: string;
    co2SavedKg?: number;
    beverage: string;
    storageTip: string;
    nutrition: Nutrition;
    ingredientsList: IngredientItem[];
    instructions: string[];
    tip: string;
    image?: string;
}

export interface ShoppingItem {
    name: string;
    checked: boolean;
    category?: string;
}

export interface DailyStat {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    co2Saved: number;
    count: number;
}