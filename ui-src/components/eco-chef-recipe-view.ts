import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { Recipe, IngredientItem, PantryItemAdvanced } from '../models/eco-chef.models';

@customElement('eco-chef-recipe-view')
export class EcoChefRecipeView extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Object }) recipe: Recipe | null = null;
    @property({ type: String }) recipeImage: string | null = null;
    @property({ type: Boolean }) isGeneratingImage = false;
    @property({ type: Number }) persons = 2;
    @property({ type: Number }) currentRating = 0;
    @property({ type: Boolean }) isLoading = false;
    @property({ type: Array }) pantryItems: PantryItemAdvanced[] = [];
    @property({ type: Array }) chatHistory: string[] = [];

    @state() private isEditing = false;
    @state() private additionalPrompt = '';

    private _addToShoppingList(item: IngredientItem) {
        this.dispatchEvent(new CustomEvent('add-to-shopping-list', {
            detail: { item },
            bubbles: true,
            composed: true
        }));
    }

    private _setRecipeRating(rating: number) {
        this.dispatchEvent(new CustomEvent('set-recipe-rating', {
            detail: { rating },
            bubbles: true,
            composed: true
        }));
    }

    private _saveEdits() {
        if (!this.recipe) return;
        const ingArea = this.shadowRoot?.querySelector('#edit-ingredients') as HTMLTextAreaElement;
        const instArea = this.shadowRoot?.querySelector('#edit-instructions') as HTMLTextAreaElement;

        if (ingArea && instArea) {
            const editedList = ingArea.value.split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    const trimmed = line.trim();
                    const existing = this.recipe!.ingredientsList.find(i => i.item === trimmed);
                    return {
                        item: trimmed,
                        category: existing ? existing.category : 'Sonstiges'
                    };
                });

            const instructions = instArea.value.split('\n').filter(line => line.trim() !== '');

            this.dispatchEvent(new CustomEvent('update-recipe', {
                detail: { ingredientsList: editedList, instructions },
                bubbles: true,
                composed: true
            }));
        }
        this.isEditing = false;
    }

    private _regenerateRecipe() {
        if (!this.additionalPrompt.trim()) return;
        this.dispatchEvent(new CustomEvent('regenerate-recipe', {
            detail: { additionalPrompt: this.additionalPrompt },
            bubbles: true,
            composed: true
        }));
        this.additionalPrompt = '';
    }

    private _markAsCooked() {
        this.dispatchEvent(new CustomEvent('mark-cooked', { bubbles: true, composed: true }));
    }

    private _startCooking() {
        this.dispatchEvent(new CustomEvent('start-cooking', { bubbles: true, composed: true }));
    }

    private _printRecipe() {
        this.dispatchEvent(new CustomEvent('print-recipe', { bubbles: true, composed: true }));
    }

    private _closeRecipe() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    private _isIngredientInPantry(itemName: string): boolean {
        const cleanName = itemName.toLowerCase().replace(/[\d\s\.,]+(g|ml|l|stk\.|pkg\.|kg|dose|dosen|zehen|zehe|prise|prisen|el|tl|etwas|paar)\b/g, '').trim();
        if (cleanName.length < 2) return false;
        return this.pantryItems.some(p => {
            const pClean = p.name.toLowerCase().trim();
            return cleanName.includes(pClean) || pClean.includes(cleanName);
        });
    }

    private _addAllMissingToShoppingList() {
        if (!this.recipe) return;
        let count = 0;
        this.recipe.ingredientsList.forEach(item => {
            if (!this._isIngredientInPantry(item.item)) {
                this._addToShoppingList(item);
                count++;
            }
        });
        alert(`🎉 ${count} fehlende Zutaten wurden der Einkaufsliste hinzugefügt!`);
    }

    private _shareRecipe() {
        if (!this.recipe) return;
        const text = `EcoChef Rezept: ${this.recipe.title}\n\n` +
            `Schwierigkeit: ${this.recipe.difficulty}\n` +
            `Dauer: ${this.recipe.prepTime}\n\n` +
            `Zutaten:\n${this.recipe.ingredientsList.map(i => `- ${i.item}`).join('\n')}\n\n` +
            `Zubereitung:\n${this.recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}\n\n` +
            `Tipp: ${this.recipe.tip}\n\nGuten Appetit! 🧑‍🍳`;
            
        if (navigator.share) {
            navigator.share({
                title: this.recipe.title,
                text: text
            }).catch(err => console.error("Error sharing:", err));
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert("Rezept wurde in die Zwischenablage kopiert! 📋");
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
            });
        }
    }

    override render() {
        if (!this.recipe) return '';

        return html`
            <div class="recipe-paper">
                <h2 class="recipe-title">${this.recipe.title}</h2>
                
                <!-- Rezept-Bild -->
                <div class="recipe-image-box">
                    ${this.isGeneratingImage ? html`
                        <div class="recipe-image-placeholder">
                            <div class="spinner"></div>
                            <span>Gerichtsbild wird von der KI generiert...</span>
                        </div>
                    ` : this.recipeImage ? html`
                        <img src="${this.recipeImage}" alt="Foto von ${this.recipe.title}" class="recipe-image" />
                    ` : html`
                        <div class="recipe-image-placeholder">
                            <span>Kein Bild verfügbar</span>
                        </div>
                    `}
                </div>
                
                <div class="recipe-meta">
                    <span class="difficulty-badge ${this.recipe.difficulty?.toLowerCase()}">
                        📊 ${this.recipe.difficulty}
                    </span>
                    <span class="time-badge">
                        🕒 ${this.recipe.prepTime}
                    </span>
                    <span class="eco-badge">
                        🌍 Eco-Score: ${this.recipe.ecoScore || '🍃🍃🍃'}
                    </span>
                    ${this.recipe.co2Footprint ? html`
                        <span class="eco-badge" style="background: #f0fdfa; color: #0f766e; border-color: #ccfbf1;">
                            👣 CO₂: ${this.recipe.co2Footprint}
                        </span>
                    ` : ''}
                    ${this.recipe.co2SavedKg !== undefined && this.recipe.co2SavedKg > 0 ? html`
                        <span class="eco-badge" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">
                            🌳 CO₂-Ersparnis: ${this.recipe.co2SavedKg} kg
                        </span>
                    ` : ''}
                </div>

                ${this.recipe.ecoScoreDetails ? html`
                    <div class="extras-box" style="background-color: #ecfdf5; border-color: #a7f3d0; color: #065f46; margin-top: 0; margin-bottom: 24px;">
                        <p><strong>🌍 Saison & CO₂-Fakten:</strong> ${this.recipe.ecoScoreDetails}</p>
                    </div>
                ` : ''}

                <div class="macros-box">
                    <span class="macro-item"><strong>🔥 ${this.recipe.nutrition?.calories || '? kcal'}</strong></span>
                    <span class="macro-item"><strong>🥩 ${this.recipe.nutrition?.protein || '? g'}</strong> Protein</span>
                    <span class="macro-item"><strong>🌾 ${this.recipe.nutrition?.carbs || '? g'}</strong> KH</span>
                    <span class="macro-item"><strong>🥑 ${this.recipe.nutrition?.fat || '? g'}</strong> Fett</span>
                </div>

                ${this.isEditing ? html`
                    <div class="edit-mode-box">
                        <h3 class="recipe-subheading">🖊️ Zutaten bearbeiten:</h3>
                        <textarea id="edit-ingredients" class="edit-area" rows="6">${this.recipe.ingredientsList.map(i => i.item).join('\n')}</textarea>
                        <h3 class="recipe-subheading">🖊️ Zubereitung bearbeiten:</h3>
                        <textarea id="edit-instructions" class="edit-area" rows="8">${this.recipe.instructions.join('\n')}</textarea>
                        <button class="main-btn save-edit-btn" @click="${this._saveEdits}">💾 Änderungen übernehmen</button>
                    </div>
                ` : html`
                    <h3 class="recipe-subheading" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                        <span>🛒 Zutaten:</span>
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 14px;">
                            <button class="step-btn" @click="${() => this.dispatchEvent(new CustomEvent('change-portions', { detail: { persons: Math.max(1, this.persons - 1) }, bubbles: true, composed: true }))}" aria-label="Portionen verringern" style="padding: 2px 8px; font-size: 14px;">-</button>
                            <span style="font-weight: 850; color: var(--primary-dark);">🍽️ ${this.persons} ${this.persons === 1 ? 'Person' : 'Personen'}</span>
                            <button class="step-btn" @click="${() => this.dispatchEvent(new CustomEvent('change-portions', { detail: { persons: Math.min(12, this.persons + 1) }, bubbles: true, composed: true }))}" aria-label="Portionen vergrößern" style="padding: 2px 8px; font-size: 14px;">+</button>
                            <button class="icon-btn" @click="${() => this.isEditing = true}" aria-label="Zutaten bearbeiten" style="margin-left: 6px;">🖊️</button>
                        </div>
                    </h3>
                    <ul class="ingredients-list">
                        ${this.recipe.ingredientsList.map(item => {
                            const exists = this._isIngredientInPantry(item.item);
                            return html`
                                <li style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>
                                        ${item.item}
                                        <span style="font-size: 11px; margin-left: 8px; font-weight: bold; color: ${exists ? '#10b981' : '#ef4444'};">
                                            (${exists ? '🟢 Vorhanden' : '🔴 Fehlt'})
                                        </span>
                                    </span>
                                    <button class="add-to-list-btn" @click="${() => this._addToShoppingList(item)}" title="Zur Einkaufsliste hinzufügen">
                                        + 🛒
                                    </button>
                                </li>
                            `;
                        })}
                    </ul>
                    <button class="main-btn" @click="${this._addAllMissingToShoppingList}" style="background-color: #4b5563; border-color: #374151; color: white; margin-top: 8px; margin-bottom: 24px;" aria-label="Fehlende Zutaten einkaufen">
                        🛒 Nur fehlende Zutaten auf Einkaufsliste
                    </button>

                    <h3 class="recipe-subheading">
                        🍳 Zubereitung:
                        <button class="icon-btn" @click="${() => this.isEditing = true}" aria-label="Zubereitungsschritte bearbeiten">🖊️</button>
                    </h3>
                    <div class="instructions-box">
                        ${this.recipe.instructions.map((step, index) => html`
                            <div class="step-item">
                                <div class="step-number">${index + 1}</div>
                                <div class="step-text">${step}</div>
                            </div>
                        `)}
                    </div>
                `}

                <div class="tip-box">
                    <strong>💡 Chefkoch-Tipp:</strong> ${this.recipe.tip}
                </div>
                <div class="extras-box">
                    <p><strong>🍷 Getränke-Empfehlung:</strong> ${this.recipe.beverage || 'Ein Glas kaltes Wasser geht immer.'}</p>
                    <p><strong>🧊 Haltbarkeit & Reste:</strong> ${this.recipe.storageTip || 'Am besten frisch genießen!'}</p>
                </div>

                <div class="regenerate-box">
                    <h4>Rezept anpassen / Chat 💬</h4>
                    ${this.chatHistory && this.chatHistory.length > 0 ? html`
                        <div class="chat-history" style="margin-bottom: 12px; background: var(--bg-color); border: 2px solid var(--border); padding: 12px; border-radius: 12px; max-height: 150px; overflow-y: auto; text-align: left;">
                            ${this.chatHistory.map(msg => html`
                                <div class="chat-message" style="margin-bottom: 6px; font-size: 13px; font-weight: 700; color: var(--text-dark); display: flex; gap: 6px; align-items: flex-start;">
                                    <span>💬</span>
                                    <span>${msg}</span>
                                </div>
                            `)}
                        </div>
                    ` : ''}
                    <input
                            type="text"
                            class="regenerate-input"
                            placeholder="z.B. Mach es schärfer, ohne Eier..."
                            .value="${this.additionalPrompt}"
                            @input="${(e: Event) => this.additionalPrompt = (e.target as HTMLInputElement).value}"
                    />
                    ${this.isLoading ? html`
                        <div class="loader inline-loader"></div>
                    ` : html`
                        <button class="secondary-btn" @click="${this._regenerateRecipe}">💬 Rezept anpassen</button>
                    `}
                </div>

                <!-- Bewertung & Aktionen -->
                <div class="recipe-rating-box">
                    <p class="filter-title" style="margin-bottom: 8px;">⭐ Rezept bewerten:</p>
                    <div class="rating-stars large">
                        ${[1, 2, 3, 4, 5].map(star => html`
                            <button class="star-btn large ${star <= this.currentRating ? 'filled' : ''}"
                                    @click="${() => this._setRecipeRating(star)}"
                                    aria-label="${star} Sterne vergeben"
                            >${star <= this.currentRating ? '⭐' : '☆'}</button>
                        `)}
                    </div>
                </div>

                <button class="main-btn" @click="${this._markAsCooked}" style="background-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin-top: 15px; margin-bottom: 10px; border: 2px solid #059669; color: white;">
                    🍳 Als gekocht markieren
                </button>
                <button class="main-btn" @click="${this._startCooking}" style="background-color: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); margin-top: 0; margin-bottom: 10px; border: 2px solid #d97706; color: white;">
                    👨‍🍳 Kochmodus starten
                </button>
                <button class="main-btn" @click="${this._shareRecipe}" style="background-color: #8b5cf6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); margin-top: 0; margin-bottom: 10px; border: 2px solid #7c3aed; color: white;">
                    📤 Rezept teilen
                </button>
                <button class="main-btn" @click="${this._printRecipe}" style="background-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin-top: 0; margin-bottom: 10px; border: 2px solid #2563eb; color: white;">
                    🖨️ Rezept drucken
                </button>
                <button class="main-btn finish-btn" @click="${this._closeRecipe}">
                    ✅ Rezept schließen
                </button>
            </div>
        `;
    }
}
