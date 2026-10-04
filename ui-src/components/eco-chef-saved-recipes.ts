import { onActivate } from '../services/a11y';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { Recipe } from '../models/eco-chef.models';
import { showToast } from './eco-chef-toast';

@customElement('eco-chef-saved-recipes')
export class EcoChefSavedRecipes extends LitElement {
    static override styles = [
        ecoChefStyles,
        css`
            :host {
                display: block;
                width: 100%;
            }
            .search-box input {
                width: 100%;
                box-sizing: border-box;
            }
        `
    ];

    @property({ type: Array }) savedRecipesList: Recipe[] = [];
    @state() private searchQuery = '';
    @state() private savedFilterRating = 0;

    private getFilteredSavedRecipes(): Recipe[] {
        return this.savedRecipesList.filter(item => {
            const query = this.searchQuery.toLowerCase().trim();
            const matchesQuery = !query ||
                item.title.toLowerCase().includes(query) ||
                (item.ingredientsList && item.ingredientsList.some(i => i.item.toLowerCase().includes(query)));
            const matchesRating = this.savedFilterRating === 0 || (item.rating && item.rating >= this.savedFilterRating);
            return matchesQuery && matchesRating;
        });
    }

    private _openRecipe(recipe: Recipe) {
        this.dispatchEvent(new CustomEvent('open-recipe', {
            detail: { recipe },
            bubbles: true,
            composed: true
        }));
    }

    private _deleteRecipe(index: number, e: Event) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('delete-recipe', {
            detail: { index },
            bubbles: true,
            composed: true
        }));
    }

    private _updateRating(index: number, rating: number, e: Event) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('update-rating', {
            detail: { index, rating },
            bubbles: true,
            composed: true
        }));
    }

    private _exportPdf() {
        this.dispatchEvent(new CustomEvent('export-pdf', {
            bubbles: true,
            composed: true
        }));
    }

    private _back() {
        this.dispatchEvent(new CustomEvent('back-to-generator', {
            bubbles: true,
            composed: true
        }));
    }

    private _triggerFileInput() {
        const fileInput = this.shadowRoot?.querySelector('#import-file') as HTMLInputElement | null;
        fileInput?.click();
    }

    private _handleImportFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const imported = JSON.parse(content);
                if (!Array.isArray(imported)) {
                    showToast('Ungültiges Format. Erwartet wird ein JSON-Array von Rezepten.', 'error');
                    return;
                }
                this.dispatchEvent(new CustomEvent('import-recipes', {
                    detail: { recipes: imported },
                    bubbles: true,
                    composed: true
                }));
            } catch (err) {
                console.error('Import error:', err);
                showToast('Fehler beim Importieren. Stelle sicher, dass es eine gültige JSON-Datei ist.', 'error');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    override render() {
        const filtered = this.getFilteredSavedRecipes();

        return html`
            <div class="saved-recipes-container">
                <h3 class="recipe-subheading">📚 Deine gespeicherten Rezepte</h3>

                <div class="search-box">
                    <input type="text"
                           placeholder="🔍 Rezepte durchsuchen..."
                           .value="${this.searchQuery}"
                           @input="${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}"
                           style="margin-bottom: 0;"
                           aria-label="Gespeicherte Rezepte durchsuchen" />
                </div>

                <div style="display: flex; gap: 6px; margin-top: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <button class="chip ${this.savedFilterRating === 0 ? 'active' : ''}" @click="${() => this.savedFilterRating = 0}">Alle</button>
                    <button class="chip ${this.savedFilterRating === 4 ? 'active' : ''}" @click="${() => this.savedFilterRating = 4}">⭐ 4+ Sterne</button>
                    <button class="chip ${this.savedFilterRating === 5 ? 'active' : ''}" @click="${() => this.savedFilterRating = 5}">⭐ 5 Sterne</button>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 16px; flex-wrap: wrap;">
                    <input type="file" id="import-file" accept=".json" style="display: none;" @change="${this._handleImportFile}" />
                    <button class="secondary-btn" @click="${this._triggerFileInput}" style="border-color: #8b5cf6; color: #6d28d9;" aria-label="Rezepte aus JSON-Datei importieren">
                        📂 Rezepte importieren (JSON)
                    </button>
                    <button class="secondary-btn" @click="${this._exportPdf}" style="border-color: #10b981; color: #047857;" aria-label="Kochbuch als PDF/Druck ausgeben">
                        📖 Kochbuch als PDF / Drucken
                    </button>
                </div>

                ${this.savedRecipesList.length === 0 ? html`
                    <p class="empty-state">Du hast noch keine Rezepte gespeichert. Zaubere dein erstes Gericht!</p>
                ` : html`
                    ${filtered.length === 0 ? html`
                        <p class="empty-state">Keine Rezepte gefunden für "${this.searchQuery}"</p>
                    ` : html`
                        <p class="subtitle" style="margin-bottom: 12px;">${filtered.length} von ${this.savedRecipesList.length} Rezept(en)</p>
                        <div class="saved-list">
                            ${filtered.map((item: Recipe) => {
                                const realIndex = this.savedRecipesList.indexOf(item);
                                return html`
                                    <div class="saved-card" role="button" tabindex="0" aria-label="Rezept öffnen: ${item.title}" @click="${() => this._openRecipe(item)}" @keydown="${onActivate(() => this._openRecipe(item))}">
                                        <div class="saved-card-content">
                                            <h4>${item.title}</h4>
                                            <div class="saved-meta">
                                                <span>📊 ${item.difficulty || '?'}</span>
                                                <span>🕒 ${item.prepTime || '?'}</span>
                                                ${item.savedAt ? html`<span>📅 ${new Date(item.savedAt).toLocaleDateString('de-DE')}</span>` : ''}
                                            </div>
                                            <div class="rating-stars" @click="${(e: Event) => e.stopPropagation()}">
                                                ${[1, 2, 3, 4, 5].map(star => html`
                                                    <button class="star-btn ${star <= (item.rating || 0) ? 'filled' : ''}"
                                                            @click="${(e: Event) => this._updateRating(realIndex, star, e)}"
                                                            aria-label="${star} Sterne"
                                                    >${star <= (item.rating || 0) ? '⭐' : '☆'}</button>
                                                `)}
                                            </div>
                                        </div>
                                        <button class="delete-btn" @click="${(e: Event) => this._deleteRecipe(realIndex, e)}" aria-label="${item.title} löschen">🗑️</button>
                                    </div>
                                `;
                            })}
                        </div>
                    `}
                `}

                <button class="secondary-btn" @click="${this._back}" style="margin-top: 16px;">
                    🔙 Zurück zum Generator
                </button>
            </div>
        `;
    }
}
