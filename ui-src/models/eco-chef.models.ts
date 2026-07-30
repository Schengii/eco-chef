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
    rating?: number;
    savedAt?: string;
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

export interface PantryItemAdvanced {
    name: string;
    active: boolean;
    addedDate: string;
    expiryDate?: string;
    quantity?: number;
    unit?: string;
    location?: 'Kühlschrank' | 'Vorratskammer' | 'Gefrierfach' | 'Sonstiges';
    barcode?: string;
    nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
    brand?: string;
}

export interface MarketLocation {
    id: string;
    name: string;
    type: 'Wochenmarkt' | 'Hofladen' | 'Unverpackt';
    address: string;
    distanceKm: number;
    openHours: string;
    specialties: string[];
    phone?: string;
}

export interface BudgetSettings {
    monthlyBudget: number;
    currentSpent: number;
    savedEuro: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
    target: number;
}

export interface MealPlanDay {
    recipe?: Recipe;
    title?: string;
    prepTime?: string;
    co2SavedKg?: number;
    notes?: string;
}

export interface MealPlan {
    [day: string]: MealPlanDay;
}

export interface ActiveTimer {
    id: string;
    label: string;
    totalSeconds: number;
    secondsRemaining: number;
    stepIndex: number;
    isPaused?: boolean;
}

export function getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

