import { Recipe } from '../models/eco-chef.models';

/** Filters saved recipes by minimum rating and a free-text query (title or ingredient). */
export function filterRecipes(recipes: Recipe[], minRating: number, query: string): Recipe[] {
    let result = recipes;
    if (minRating > 0) {
        result = result.filter(r => (r.rating || 0) >= minRating);
    }
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.ingredientsList?.some(i => i.item?.toLowerCase().includes(q))
    );
}
