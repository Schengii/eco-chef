import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { ShoppingItem } from '../models/eco-chef.models';

@customElement('eco-chef-shopping-list')
export class EcoChefShoppingList extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Array }) shoppingList: ShoppingItem[] = [];
    @property({ type: Object }) budgetSettings: { monthlyBudget: number; currentSpent: number; savedEuro: number } = { monthlyBudget: 250, currentSpent: 0, savedEuro: 0 };

    @state() private manualShoppingItem = '';

    private _getGroupedShoppingList() {
        const groups: { [key: string]: { item: ShoppingItem, originalIndex: number }[] } = {};
        this.shoppingList.forEach((item, index) => {
            const cat = item.category || 'Sonstiges';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push({ item, originalIndex: index });
        });
        return groups;
    }

    private _addManualShoppingItem() {
        const name = this.manualShoppingItem.trim();
        if (name !== '') {
            this.dispatchEvent(new CustomEvent('add-item', {
                detail: { name },
                bubbles: true,
                composed: true
            }));
            this.manualShoppingItem = '';
        }
    }

    private _toggleShoppingItem(index: number) {
        this.dispatchEvent(new CustomEvent('toggle-item', {
            detail: { index },
            bubbles: true,
            composed: true
        }));
    }

    private _removeShoppingItem(index: number) {
        this.dispatchEvent(new CustomEvent('remove-item', {
            detail: { index },
            bubbles: true,
            composed: true
        }));
    }

    private _clearCheckedShoppingItems() {
        this.dispatchEvent(new CustomEvent('clear-checked', { bubbles: true, composed: true }));
    }

    private _shareShoppingList() {
        this.dispatchEvent(new CustomEvent('share-list', { bubbles: true, composed: true }));
    }

    override render() {
        const pct = Math.min(100, Math.round((this.budgetSettings.currentSpent / (this.budgetSettings.monthlyBudget || 1)) * 100));

        return html`
            <div class="shopping-list-container">
                <h3 class="recipe-subheading">🛒 Deine Einkaufsliste</h3>

                <!-- Monats-Budget Tracker Card -->
                <div style="background: var(--bg-color); border: 2px solid var(--border); border-radius: 18px; padding: 16px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 850; font-size: 13px; color: var(--text-dark);">
                        <span>💰 Monatsbudget: ${this.budgetSettings.currentSpent} € / ${this.budgetSettings.monthlyBudget} €</span>
                        <span style="color: #16a34a;">🌱 ${this.budgetSettings.savedEuro} € gespart!</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: ${pct > 90 ? '#ef4444' : 'var(--primary-gradient)'}; transition: width 0.4s ease;"></div>
                    </div>
                </div>

                <div class="add-item-box">
                    <input type="text"
                           placeholder="Zutat hinzufügen..."
                           .value="${this.manualShoppingItem}"
                           @input="${(e: Event) => this.manualShoppingItem = (e.target as HTMLInputElement).value}"
                           @keypress="${(e: KeyboardEvent) => e.key === 'Enter' && this._addManualShoppingItem()}"
                           style="margin-bottom: 0;"
                           aria-label="Manuelle Zutat eingeben" />
                    <button class="camera-btn" @click="${this._addManualShoppingItem}" style="width: auto; padding: 0 20px; font-size: 20px;" aria-label="Zutat hinzufügen">+</button>
                </div>

                ${this.shoppingList.length === 0 ? html`
                    <p class="empty-state">Deine Liste ist leer. Füge Zutaten aus einem Rezept hinzu!</p>
                ` : html`
                    <!-- Button zum Teilen der Einkaufsliste -->
                    <button class="secondary-btn" @click="${this._shareShoppingList}" style="margin-bottom: 20px; border-color: #10b981; color: #047857; font-weight: 800;">
                        📤 Einkaufsliste teilen
                    </button>

                    <div class="saved-list">
                        ${(() => {
                            const grouped = this._getGroupedShoppingList();
                            const categoriesOrder = ['Obst & Gemüse', 'Milchprodukte & Eier', 'Fleisch & Fisch', 'Vorrat & Gewürze', 'Bäckerei', 'Sonstiges'];
                            
                            return categoriesOrder.map(cat => {
                                const items = grouped[cat];
                                if (!items || items.length === 0) return '';
                                
                                return html`
                                    <div class="shopping-category-header">${cat}</div>
                                    ${items.map(g => html`
                                        <div class="shopping-item ${g.item.checked ? 'checked' : ''}">
                                            <input type="checkbox"
                                                   class="shopping-checkbox"
                                                   .checked="${g.item.checked}"
                                                   @change="${() => this._toggleShoppingItem(g.originalIndex)}"
                                                   aria-label="${g.item.name} abchecken" />
                                            <span class="shopping-text">${g.item.name}</span>
                                            <button class="delete-btn" @click="${() => this._removeShoppingItem(g.originalIndex)}" style="width: 32px; height: 32px; font-size: 14px;" aria-label="${g.item.name} löschen">❌</button>
                                        </div>
                                    `)}
                                `;
                            });
                        })()}
                    </div>

                    ${this.shoppingList.some(item => item.checked) ? html`
                        <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                            <button class="main-btn" @click="${() => this.dispatchEvent(new CustomEvent('transfer-to-pantry', { bubbles: true, composed: true }))}" style="flex: 1.5; background: var(--primary-gradient); color: white; border: none; font-weight: 800; font-size: 13px; margin-top: 0;">
                                🥫 Abgehakte in Reste-Kammer übernehmen
                            </button>
                            <button class="secondary-btn" @click="${this._clearCheckedShoppingItems}" style="flex: 1; border-color: var(--border); margin-top: 0;">
                                🧹 Erledigte löschen
                            </button>
                        </div>
                    ` : ''}
                `}
            </div>
        `;
    }
}
