import { StorageService } from './storage.service';
import { BackupSchema, RecipeListSchema, BackupData } from '../models/schemas';
import { Recipe, getLocalDateString } from '../models/eco-chef.models';

export const BackupService = {
    createBackup() {
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            savedRecipes: StorageService.getSavedRecipes(),
            pantryItemsAdvanced: StorageService.getPantryAdvanced(),
            shoppingList: StorageService.getShoppingList(),
            stats: StorageService.getStats(),
            achievements: StorageService.getAchievements(),
            urgentIngredients: StorageService.getUrgentIngredients(),
            ingredientChips: StorageService.getIngredientChips(),
            calorieGoal: StorageService.getCalorieGoal(),
            proteinGoal: StorageService.getProteinGoal()
        };
    },

    backupFilename(): string {
        return `ecoChef_full_backup_${getLocalDateString()}.json`;
    },

    /** Validates a parsed backup file; returns null when it is not an object at all. */
    parseBackup(raw: unknown): BackupData | null {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
        const result = BackupSchema.safeParse(raw);
        return result.success ? result.data : null;
    },

    /** Validates imported recipes: invalid entries are dropped, the rest normalized. */
    parseRecipeImport(raw: unknown): { recipes: Recipe[]; skipped: number } | null {
        if (!Array.isArray(raw)) return null;
        const result = RecipeListSchema.safeParse(raw);
        if (!result.success) return null;
        return { recipes: result.data as Recipe[], skipped: raw.length - result.data.length };
    },

    mergeImportedRecipes(existing: Recipe[], imported: Recipe[]): Recipe[] {
        const importedAt = new Date().toISOString();
        return [...existing, ...imported.map(r => ({ ...r, importedAt }))];
    },

    downloadJson(filename: string, data: unknown, pretty = false): void {
        const json = JSON.stringify(data, null, pretty ? 2 : undefined);
        const anchor = document.createElement('a');
        anchor.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json));
        anchor.setAttribute('download', filename);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
};
