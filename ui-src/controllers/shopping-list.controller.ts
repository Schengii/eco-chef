import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getGroupedShoppingList, type IngredientItem, type ShoppingItem } from '../models/eco-chef.models';
import { StorageService } from '../services/storage.service';
import { showConfirmToast, showToast } from '../components/eco-chef-toast';

export interface ShoppingListHost extends ReactiveControllerHost {
    /** Names of the items currently in the pantry (to warn before buying what is already at home). */
    getPantryNames(): string[];
}

const CATEGORY_ORDER = ['Obst & Gemüse', 'Milchprodukte & Eier', 'Fleisch & Fisch', 'Vorrat & Gewürze', 'Bäckerei', 'Sonstiges'];

/** Shopping list state, persistence and sharing. Items are replaced immutably so child components re-render. */
export class ShoppingListController implements ReactiveController {
    items: ShoppingItem[] = [];

    constructor(private readonly host: ShoppingListHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    load(): void {
        this.items = StorageService.getShoppingList();
    }

    /** Replaces the list (sync / transfer to pantry) and persists it. */
    set(items: ShoppingItem[]): void {
        this.items = items;
        this.save();
    }

    add = (ingredient: IngredientItem | string): void => {
        const raw = typeof ingredient === 'string' ? ingredient : ingredient.item;
        const name = raw.replace(/^(\*|\d+\.)\s*/, '').trim();
        const category = typeof ingredient === 'string' ? 'Sonstiges' : (ingredient.category || 'Sonstiges');
        const lower = name.toLowerCase();

        const inPantry = this.host.getPantryNames().some(p => {
            const pantryName = p.toLowerCase().trim();
            return lower.includes(pantryName) || pantryName.includes(lower);
        });

        if (inPantry) {
            void showConfirmToast(
                `"${name}" ist bereits in der Vorratskammer. Trotzdem zur Einkaufsliste?`,
                'Hinzufügen',
                'Abbrechen'
            ).then(confirmed => {
                if (confirmed) this.addIfNew(name, category);
            });
            return;
        }
        if (!this.addIfNew(name, category)) {
            showToast('Das steht bereits auf deiner Einkaufsliste!', 'warning');
        }
    };

    addManual = (name: string): void => {
        const trimmed = name.trim();
        if (trimmed !== '') this.set([...this.items, { name: trimmed, checked: false, category: 'Sonstiges' }]);
    };

    toggle = (index: number): void => {
        if (!this.items[index]) return;
        this.set(this.items.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
    };

    remove = (index: number): void => {
        this.set(this.items.filter((_, i) => i !== index));
    };

    clearChecked = (): void => {
        this.set(this.items.filter(item => !item.checked));
    };

    checkedItems(): ShoppingItem[] {
        return this.items.filter(item => item.checked);
    }

    share = async (): Promise<void> => {
        if (this.items.length === 0) return;
        const text = this.toText();
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Meine Einkaufsliste', text });
            } catch (err) {
                console.error('Fehler beim Teilen', err);
            }
        } else {
            await navigator.clipboard.writeText(text);
            showToast('Einkaufsliste in die Zwischenablage kopiert!', 'success');
        }
    };

    toText(): string {
        const grouped = getGroupedShoppingList(this.items);
        let text = '🛒 *Meine EcoChef Einkaufsliste*:\n';
        for (const cat of CATEGORY_ORDER) {
            if (!grouped[cat]?.length) continue;
            text += `\n*${cat}*:\n`;
            for (const g of grouped[cat]) text += `${g.item.checked ? '✅ ' : '⬜ '}${g.item.name}\n`;
        }
        return text + '\nGeneriert mit EcoChef 🧑‍🍳';
    }

    private addIfNew(name: string, category: string): boolean {
        if (this.items.some(item => item.name === name)) return false;
        this.set([...this.items, { name, checked: false, category }]);
        showToast(`"${name}" zur Einkaufsliste hinzugefügt`, 'success');
        return true;
    }

    private save(): void {
        StorageService.setShoppingList(this.items);
        this.host.requestUpdate();
    }
}
