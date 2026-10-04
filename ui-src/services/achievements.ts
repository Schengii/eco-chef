import type { Achievement, DailyStat, Recipe } from '../models/eco-chef.models';

export const DEFAULT_ACHIEVEMENTS: readonly Achievement[] = [
    { id: 'retterKoenig', title: 'Retter-König', description: 'Koche Rezepte mit dringend zu verbrauchenden Zutaten.', icon: '👑', unlocked: false, progress: 0, target: 5 },
    { id: 'klimaSchuetzer', title: 'Klimaschützer', description: 'Erreiche eine CO₂-Ersparnis von insgesamt 10 kg.', icon: '🌳', unlocked: false, progress: 0, target: 10 },
    { id: 'sterneChef', title: 'Sterne-Eco-Chef', description: 'Bewerte 3 gekochte Rezepte mit 5 Sternen.', icon: '⭐', unlocked: false, progress: 0, target: 3 },
    { id: 'scannerProfi', title: 'Scanner-Profi', description: 'Scanne 3 Kassenzettel per Kamera.', icon: '🧾', unlocked: false, progress: 0, target: 3 },
    { id: 'pflanzenfresser', title: 'Pflanzenfresser', description: 'Koche 5 vegetarische oder vegane Gerichte.', icon: '🌿', unlocked: false, progress: 0, target: 5 },
    { id: 'mealPrepKing', title: 'Meal-Prep-King', description: 'Generiere einen wöchentlichen Meal-Prep-Plan.', icon: '📦', unlocked: false, progress: 0, target: 1 },
    { id: 'mhdRetter', title: 'MHD-Retter', description: 'Füge Zutat mit nahem MHD zur Koch-Auswahl hinzu.', icon: '⏰', unlocked: false, progress: 0, target: 1 }
];

function copyDefaults(): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
}

/** Stored list plus any achievements added in newer app versions (stored progress is kept). */
export function mergeWithDefaults(stored: Achievement[]): Achievement[] {
    if (stored.length === 0) return copyDefaults();
    const merged = [...stored];
    for (const def of DEFAULT_ACHIEVEMENTS) {
        if (!merged.some(a => a.id === def.id)) merged.push({ ...def });
    }
    return merged;
}

function update(list: Achievement[], id: string, fn: (a: Achievement) => Achievement): Achievement[] {
    return list.map(a => a.id === id ? fn(a) : a);
}

/** +1 progress (capped at the target). */
export function incrementAchievement(list: Achievement[], id: string): Achievement[] {
    return update(list, id, a => {
        const progress = Math.min(a.target, a.progress + 1);
        return { ...a, progress, unlocked: progress >= a.target };
    });
}

export interface CookedContext {
    stats: Record<string, DailyStat>;
    recipe: Recipe | null;
    diet: string;
    urgentIngredients: Record<string, boolean>;
}

/** Re-evaluates the achievements that depend on cooking a recipe (CO₂ total, vegetarian meals, rescued ingredients). */
export function applyCookedRecipe(list: Achievement[], ctx: CookedContext): Achievement[] {
    const totalCo2 = Object.values(ctx.stats).reduce((sum, d) => sum + (d.co2Saved || 0), 0);
    let result = update(list, 'klimaSchuetzer', a => {
        const progress = Math.round(totalCo2);
        return { ...a, progress, unlocked: progress >= a.target };
    });

    const { recipe } = ctx;
    if (!recipe) return result;

    if (ctx.diet === 'vegetarisch' || ctx.diet === 'vegan') {
        result = incrementAchievement(result, 'pflanzenfresser');
    }
    const usedUrgent = Object.keys(ctx.urgentIngredients).some(k =>
        ctx.urgentIngredients[k] && recipe.ingredientsList.some(i => i.item.toLowerCase().includes(k.toLowerCase())));
    if (usedUrgent) result = incrementAchievement(result, 'retterKoenig');
    return result;
}
