import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Recipe } from '../models/eco-chef.models';
import { StorageService } from '../services/storage.service';
import { BackupService } from '../services/backup.service';
import { PdfService } from '../services/pdf.service';
import { normalizeIngredients } from '../services/recipe-utils';
import { showToast } from '../components/eco-chef-toast';
import type { AchievementsController } from './achievements.controller';

export interface RecipeBookHost extends ReactiveControllerHost {
    readonly achievements: Pick<AchievementsController, 'increment'>;
    announce(message: string): void;
}

/** The saved-recipes cookbook: persistence, rating, import/export and sharing. */
export class RecipeBookController implements ReactiveController {
    saved: Recipe[] = [];

    constructor(private readonly host: RecipeBookHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    /** (Re)reads the cookbook from storage. */
    load(): void {
        this.saved = StorageService.getSavedRecipes().map(r => ({ ...r, ingredientsList: normalizeIngredients(r.ingredientsList) }));
        this.host.requestUpdate();
    }

    /** Replaces the whole cookbook (backup restore). */
    set(recipes: Recipe[]): void {
        StorageService.setSavedRecipes(recipes);
        this.load();
    }

    save(recipe: Recipe, image: string | null, rating: number): void {
        const saved = [...StorageService.getSavedRecipes(), {
            ...recipe,
            image: image || undefined,
            rating: rating || 0,
            savedAt: new Date().toISOString()
        }];
        this.set(saved);
        showToast(`Rezept gespeichert${rating ? ` mit ${rating} ⭐` : ''}!`, 'success');
        this.host.announce(`Rezept "${recipe.title}" wurde gespeichert.`);
    }

    remove(index: number): void {
        this.set(this.saved.filter((_, i) => i !== index));
    }

    rate(index: number, rating: number): void {
        if (!this.saved[index]) return;
        this.set(this.saved.map((r, i) => i === index ? { ...r, rating } : r));
        if (rating === 5) this.host.achievements.increment('sterneChef');
        this.host.announce(`Bewertung auf ${rating} Sterne aktualisiert.`);
    }

    importRaw(raw: unknown): void {
        const parsed = BackupService.parseRecipeImport(raw);
        if (!parsed || parsed.recipes.length === 0) {
            showToast('Keine gültigen Rezepte in der Datei gefunden.', 'error');
            return;
        }
        this.set(BackupService.mergeImportedRecipes(StorageService.getSavedRecipes(), parsed.recipes));
        const skippedHint = parsed.skipped > 0 ? ` (${parsed.skipped} ungültige übersprungen)` : '';
        showToast(`${parsed.recipes.length} Rezept(e) erfolgreich importiert!${skippedHint}`, 'success');
        this.host.announce(`${parsed.recipes.length} Rezepte importiert.`);
    }

    exportJson = (): void => {
        const saved = StorageService.getSavedRecipes();
        if (saved.length === 0) {
            showToast('Du hast noch keine Rezepte gespeichert.', 'warning');
            return;
        }
        BackupService.downloadJson('ecoChef_rezepte.json', saved);
        this.host.announce('Deine Rezepte wurden als Datei heruntergeladen.');
    };

    exportPdf(avatar: string): void {
        if (this.saved.length === 0) {
            showToast('Du hast noch keine gespeicherten Rezepte im Kochbuch.', 'warning');
            return;
        }
        PdfService.printCookbook(this.saved, avatar);
    }

    async share(recipe: Recipe): Promise<void> {
        const text = `Schau mal, was ich mit EcoChef gekocht habe:\n\n${recipe.title}\n🔥 ${recipe.nutrition?.calories || ''} | 🌍 Eco-Score: ${recipe.ecoScore || ''}\n🍷 Dazu passt: ${recipe.beverage || ''}\n\nLade dir die EcoChef App herunter!`;
        if (navigator.share) {
            try {
                await navigator.share({ title: recipe.title, text });
            } catch (err) {
                console.error('Fehler beim Teilen', err);
            }
        } else {
            await navigator.clipboard.writeText(text);
            showToast('Rezept-Text in die Zwischenablage kopiert!', 'success');
        }
    }
}
