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
    beverage: string;
    storageTip: string;
    nutrition: Nutrition;
    ingredientsList: string[];
    instructions: string[];
    tip: string;
}

export interface ShoppingItem {
    name: string;
    checked: boolean;
}