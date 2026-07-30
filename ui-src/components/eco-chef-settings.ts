import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { DailyStat, getLocalDateString } from '../models/eco-chef.models';

@customElement('eco-chef-settings')
export class EcoChefSettings extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Boolean }) isLrsMode = false;
    @property({ type: Boolean }) showReadingRuler = false;
    @property({ type: Number }) fontScale = 1.0;
    @property({ type: Object }) selectedPantry: { [key: string]: boolean } = {};
    @property({ type: Array }) pantryItems: string[] = [];
    @property({ type: Object }) selectedAllergens: { [key: string]: boolean } = {};
    @property({ type: Object }) stats: { [date: string]: DailyStat } = {};
    @property({ type: Number }) calorieGoal = 2000;
    @property({ type: Number }) proteinGoal = 80;
    @property({ type: String }) geminiApiKey = '';
    @property({ type: String }) syncCode = '';
    @property({ type: String }) selectedAvatar = '🧑‍🍳';
    @property({ type: Object }) budgetSettings: { monthlyBudget: number; currentSpent: number; savedEuro: number } = { monthlyBudget: 250, currentSpent: 0, savedEuro: 0 };
    @property({ type: Boolean }) notificationsEnabled = true;
    @property({ type: Boolean }) soundEffectsEnabled = true;

    private avatarList = ['🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧙‍♂️', '🦁', '🦊', '🐼', '🥦', '🍕', '🥑'];

    private _selectAvatar(avatar: string) {
        this.dispatchEvent(new CustomEvent('change-avatar', {
            detail: { avatar },
            bubbles: true,
            composed: true
        }));
    }

    private _getWeeklyStats() {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCo2Saved = 0;
        let totalCookedCount = 0;

        const last7Days: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(getLocalDateString(d));
        }

        last7Days.forEach(date => {
            const stat = this.stats[date];
            if (stat) {
                totalCalories += stat.calories || 0;
                totalProtein += stat.protein || 0;
                totalCarbs += stat.carbs || 0;
                totalFat += stat.fat || 0;
                totalCo2Saved += stat.co2Saved || 0;
                totalCookedCount += stat.count || 0;
            }
        });

        return {
            calories: Math.round(totalCalories),
            protein: Math.round(totalProtein),
            carbs: Math.round(totalCarbs),
            fat: Math.round(totalFat),
            co2Saved: parseFloat(totalCo2Saved.toFixed(2)),
            count: totalCookedCount
        };
    }

    private _togglePantryItem(item: string) {
        this.dispatchEvent(new CustomEvent('toggle-pantry-item', {
            detail: { item },
            bubbles: true,
            composed: true
        }));
    }

    private _toggleAllergen(allergen: string) {
        this.dispatchEvent(new CustomEvent('toggle-allergen', {
            detail: { allergen },
            bubbles: true,
            composed: true
        }));
    }

    private _changeFontScale(delta: number) {
        this.dispatchEvent(new CustomEvent('change-font-scale', {
            detail: { delta },
            bubbles: true,
            composed: true
        }));
    }

    private _toggleLrsMode() {
        this.dispatchEvent(new CustomEvent('toggle-lrs-mode', { bubbles: true, composed: true }));
    }

    private _toggleReadingRuler() {
        this.dispatchEvent(new CustomEvent('toggle-reading-ruler', { bubbles: true, composed: true }));
    }

    private _togglePrivacy() {
        this.dispatchEvent(new CustomEvent('toggle-privacy', { bubbles: true, composed: true }));
    }

    private _exportRecipes() {
        this.dispatchEvent(new CustomEvent('export-recipes', { bubbles: true, composed: true }));
    }

    private _clearAllData() {
        this.dispatchEvent(new CustomEvent('clear-all-data', { bubbles: true, composed: true }));
    }

    private _onCalorieGoalChange(e: Event) {
        const goal = parseInt((e.target as HTMLInputElement).value, 10) || 2000;
        this.dispatchEvent(new CustomEvent('change-calorie-goal', {
            detail: { goal },
            bubbles: true,
            composed: true
        }));
    }

    private _onProteinGoalChange(e: Event) {
        const goal = parseInt((e.target as HTMLInputElement).value, 10) || 80;
        this.dispatchEvent(new CustomEvent('change-protein-goal', {
            detail: { goal },
            bubbles: true,
            composed: true
        }));
    }

    private _onGeminiApiKeyChange(e: Event) {
        const key = (e.target as HTMLInputElement).value || '';
        this.dispatchEvent(new CustomEvent('change-gemini-api-key', {
            detail: { key },
            bubbles: true,
            composed: true
        }));
    }

    private _applySyncCode() {
        const input = this.shadowRoot?.querySelector('#sync-code-input') as HTMLInputElement;
        const code = input ? input.value.trim().toUpperCase() : '';
        if (code) {
            this.dispatchEvent(new CustomEvent('apply-sync-code', {
                detail: { code },
                bubbles: true,
                composed: true
            }));
            if (input) input.value = '';
        }
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
                    alert('❌ Ungültiges Format. Erwartet wird ein JSON-Array von Rezepten.');
                    return;
                }

                this.dispatchEvent(new CustomEvent('import-recipes-success', {
                    detail: { recipes: imported },
                    bubbles: true,
                    composed: true
                }));
            } catch (err) {
                alert('❌ Fehler beim Importieren. Stelle sicher, dass es sich um eine gültige EcoChef-JSON-Datei handelt.');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    override render() {
        const weekly = this._getWeeklyStats();
        const weeklyCalorieGoal = this.calorieGoal * 7;
        const weeklyProteinGoal = this.proteinGoal * 7;
        const calPercent = Math.min(100, (weekly.calories / weeklyCalorieGoal) * 100);
        const protPercent = Math.min(100, (weekly.protein / weeklyProteinGoal) * 100);

        return html`
            <div class="settings-container">
                <h3 class="recipe-subheading">⚙️ Einstellungen & Vorrat</h3>

                <!-- Budget & Benachrichtigungen Section -->
                <div class="settings-section">
                    <h4 class="settings-title">💰 Budget & MHD-Ablauf-Erinnerungen</h4>
                    
                    <div class="goal-input-group" style="margin-bottom: 16px;">
                        <label class="goal-label" for="budget-goal">Monatliches Lebensmittel-Budget (€):</label>
                        <input type="number"
                               id="budget-goal"
                               class="goal-input"
                               .value="${this.budgetSettings.monthlyBudget.toString()}"
                               @change="${(e: Event) => {
                                   const val = Number((e.target as HTMLInputElement).value) || 250;
                                   this.dispatchEvent(new CustomEvent('change-monthly-budget', { detail: { budget: val }, bubbles: true, composed: true }));
                               }}"
                               min="50" max="2000" step="10" />
                    </div>

                    <div class="setting-toggle-row">
                        <span class="setting-label">🔔 MHD-Ablauf-Erinnerungen aktivieren</span>
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.notificationsEnabled}"
                                   @change="${(e: Event) => {
                                       const val = (e.target as HTMLInputElement).checked;
                                       this.dispatchEvent(new CustomEvent('toggle-notifications', { detail: { enabled: val }, bubbles: true, composed: true }));
                                   }}" />
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-toggle-row" style="margin-top: 12px;">
                        <span class="setting-label">🔊 Synthetisierte Web-Audio Soundeffekte</span>
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.soundEffectsEnabled}"
                                   @change="${(e: Event) => {
                                       const val = (e.target as HTMLInputElement).checked;
                                       this.dispatchEvent(new CustomEvent('toggle-sound-effects', { detail: { enabled: val }, bubbles: true, composed: true }));
                                   }}" />
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h4 class="settings-title">👤 Mein Chefkoch-Profil</h4>
                    <p class="subtitle" style="margin-bottom: 12px;">Wähle deinen persönlichen Koch-Avatar:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; background: var(--bg-color); padding: 12px; border-radius: 18px; border: 2px solid var(--border);">
                        ${this.avatarList.map(avatar => html`
                            <button @click="${() => this._selectAvatar(avatar)}" 
                                    style="font-size: 28px; width: 50px; height: 50px; border-radius: 12px; border: 2px solid ${this.selectedAvatar === avatar ? 'var(--primary)' : 'var(--border)'}; background: ${this.selectedAvatar === avatar ? 'var(--primary-light)' : 'var(--surface)'}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; box-shadow: ${this.selectedAvatar === avatar ? '0 0 10px var(--primary)' : 'none'};"
                                    aria-label="Avatar ${avatar} wählen"
                                    aria-pressed="${this.selectedAvatar === avatar}">
                                ${avatar}
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Statistik & Tracker Section -->
                <div class="settings-section">
                    <h4 class="settings-title">📊 Wochen-Statistik & Tracker</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Statistiken der letzten 7 Tage über gekochte Gerichte.
                    </p>

                    <div class="goals-input-group">
                        <div class="goal-input-container">
                            <label for="calorie-goal-input">Tägl. Kalorienziel (kcal):</label>
                            <input type="number" 
                                   id="calorie-goal-input" 
                                   .value="${this.calorieGoal}" 
                                   @change="${this._onCalorieGoalChange}" 
                                   min="500" 
                                   max="10000" />
                        </div>
                        <div class="goal-input-container">
                            <label for="protein-goal-input">Tägl. Proteinziel (g):</label>
                            <input type="number" 
                                   id="protein-goal-input" 
                                   .value="${this.proteinGoal}" 
                                   @change="${this._onProteinGoalChange}" 
                                   min="10" 
                                   max="500" />
                        </div>
                    </div>
                    
                    <div class="stats-grid" style="margin-top: 24px;">
                        <div class="stat-card full-width">
                            <div class="stat-value">🌳 ${weekly.co2Saved} kg</div>
                            <div class="stat-label">CO₂-Einsparung (vs. Fleisch)</div>
                            <div class="stat-bar-container">
                                <div class="stat-bar-fill co2" style="width: ${Math.min(100, (weekly.co2Saved / 10) * 100)}%;"></div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">🔥 Kalorien (Woche)</div>
                            <div class="circular-progress-container">
                                <svg class="circular-progress" viewBox="0 0 100 100" aria-label="Kalorien Wochenfortschritt: ${Math.round(calPercent)}%">
                                    <circle class="bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="fg calories" cx="50" cy="50" r="40" style="stroke-dashoffset: ${251.2 - (251.2 * calPercent) / 100}"></circle>
                                </svg>
                                <div class="circular-progress-text">
                                    <span class="value">${weekly.calories}</span>
                                    <span class="target">/ ${weeklyCalorieGoal}</span>
                                </div>
                            </div>
                            <div class="stat-subtext">Ziel: ${this.calorieGoal} kcal/Tag</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">🥩 Protein (Woche)</div>
                            <div class="circular-progress-container">
                                <svg class="circular-progress" viewBox="0 0 100 100" aria-label="Protein Wochenfortschritt: ${Math.round(protPercent)}%">
                                    <circle class="bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="fg protein" cx="50" cy="50" r="40" style="stroke-dashoffset: ${251.2 - (251.2 * protPercent) / 100}"></circle>
                                </svg>
                                <div class="circular-progress-text">
                                    <span class="value">${weekly.protein}g</span>
                                    <span class="target">/ ${weeklyProteinGoal}g</span>
                                </div>
                            </div>
                            <div class="stat-subtext">Ziel: ${this.proteinGoal} g/Tag</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">🌾 ${weekly.carbs} g</div>
                            <div class="stat-label">Kohlenhydrate</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">🥑 ${weekly.fat} g</div>
                            <div class="stat-label">Fett</div>
                        </div>
                        
                        <div class="stat-card full-width" style="background: var(--bg-color); border-color: var(--border); color: var(--text-dark);">
                            <div class="stat-value" style="font-size: 16px;">🍳 Gekochte Rezepte: ${weekly.count}</div>
                        </div>
                    </div>
                </div>

                <!-- Vorratskammer Section -->
                <div class="settings-section">
                    <h4 class="settings-title">🥦 Vorratskammer (Standard-Zutaten)</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Zutaten, die du immer daheim hast. Die KI wird sie automatisch für Rezepte verwenden.
                    </p>
                    <div class="pantry-grid">
                        ${this.pantryItems.map(item => html`
                            <button 
                                class="pantry-item ${this.selectedPantry[item] ? 'active' : ''}" 
                                @click="${() => this._togglePantryItem(item)}"
                                aria-pressed="${!!this.selectedPantry[item]}"
                            >
                                ${this.selectedPantry[item] ? '✅' : '➕'} ${item}
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Allergene & Unverträglichkeiten Section -->
                <div class="settings-section">
                    <h4 class="settings-title">⚠️ Allergien & Unverträglichkeiten</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Wähle deine Unverträglichkeiten aus. Rezepte werden von der KI passend abgewandelt.
                    </p>
                    <div class="allergens-grid">
                        ${['Gluten', 'Laktose', 'Nüsse', 'Soja', 'Histamin'].map(allergen => html`
                            <button 
                                class="allergen-item ${this.selectedAllergens[allergen] ? 'active' : ''}" 
                                @click="${() => this._toggleAllergen(allergen)}"
                                aria-pressed="${!!this.selectedAllergens[allergen]}"
                            >
                                ${this.selectedAllergens[allergen] ? '❌' : '➕'} ${allergen}
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Barrierefreiheit Section -->
                <div class="settings-section">
                    <h4 class="settings-title">👁️ Barrierefreiheit & Lesehilfe</h4>
                    
                    <p class="filter-title" style="margin-top: 10px;">Schriftgröße:</p>
                    <div class="font-size-controls">
                        <button class="step-btn" @click="${() => this._changeFontScale(-0.1)}" aria-label="Schriftgröße verkleinern">A-</button>
                        <span class="step-value" style="flex-grow: 1;">${Math.round(this.fontScale * 100)}%</span>
                        <button class="step-btn" @click="${() => this._changeFontScale(0.1)}" aria-label="Schriftgröße vergrößern">A+</button>
                    </div>

                    <div class="toggle-container" style="margin-top: 20px;">
                        <label class="toggle-switch" for="settings-lrs-toggle">
                            <input type="checkbox"
                                   id="settings-lrs-toggle"
                                   .checked="${this.isLrsMode}"
                                   @change="${this._toggleLrsMode}"
                                   aria-label="LRS-Lesehilfe aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="color: ${this.isLrsMode ? '#15803d' : 'var(--text-dark)'};">
                            LRS-Modus (Optimierter Zeilenabstand & Schrift)
                        </span>
                    </div>

                    <div class="toggle-container" style="margin-top: 10px;">
                        <label class="toggle-switch" for="settings-ruler-toggle">
                            <input type="checkbox"
                                   id="settings-ruler-toggle"
                                   .checked="${this.showReadingRuler}"
                                   @change="${this._toggleReadingRuler}"
                                   aria-label="Leselineal aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="color: ${this.showReadingRuler ? '#15803d' : 'var(--text-dark)'};">
                            Leselineal einblenden (Verschiebbar)
                        </span>
                    </div>
                </div>

                <!-- API-Key & Security Section -->
                <div class="settings-section">
                    <h4 class="settings-title">🔑 API-Schlüssel (Optional)</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Gib hier deinen eigenen Gemini API-Key ein, um die App eigenständig zu betreiben. Falls leer, wird der integrierte Entwicklerschlüssel verwendet.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <input type="password" 
                               id="settings-api-key-input" 
                               .value="${this.geminiApiKey}" 
                               @change="${this._onGeminiApiKeyChange}" 
                               placeholder="Z.B. AIzaSy..." 
                               style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-dark); box-sizing: border-box;"
                               aria-label="Gemini API Key" />
                    </div>
                </div>

                <!-- Haushalt-Synchronisation Section -->
                <div class="settings-section">
                    <h4 class="settings-title">👥 Haushalts-Synchronisation (Cloud)</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Teile deine Vorratskammer, Einkaufsliste und Erfolge mit anderen Geräten in deinem Haushalt.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="secondary-btn" @click="${() => this.dispatchEvent(new CustomEvent('generate-sync-code', { bubbles: true, composed: true }))}" style="margin: 0;">
                            🔄 Sync-Schlüssel generieren
                        </button>
                        ${this.syncCode ? html`
                            <div style="background: var(--bg-color); padding: 12px; border-radius: 12px; text-align: center; border: 2px solid var(--primary); margin-top: 8px;">
                                <span style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Dein Sync-Schlüssel (24 Std. gültig):</span>
                                <div style="font-size: 22px; font-weight: 900; color: var(--primary-dark); margin-top: 4px; letter-spacing: 2px;">${this.syncCode}</div>
                            </div>
                        ` : ''}
                        
                        <div style="border-top: 1px solid var(--border); margin: 12px 0;"></div>
                        
                        <label for="sync-code-input" style="font-size: 13px; font-weight: 700; color: var(--text-dark);">Mit vorhandenem Schlüssel verbinden:</label>
                        <div style="display: flex; gap: 10px; align-items: center; width: 100%;">
                            <input type="text" 
                                   id="sync-code-input" 
                                   placeholder="Z.B. A1B2C3" 
                                   style="flex-grow: 1; margin-bottom: 0; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-dark);"
                                   aria-label="Sync Code eingeben" />
                            <button class="main-btn" @click="${this._applySyncCode}" style="margin: 0; padding: 10px 16px; width: auto; font-size: 13px; border-radius: 8px;">Verbinden</button>
                        </div>
                    </div>
                </div>

                <!-- DSGVO & Datenschutz Section -->
                <div class="settings-section">
                    <h4 class="settings-title">🛡️ Datenschutz & DSGVO</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Ihre Daten gehören Ihnen. Alle Rezepte und Einstellungen werden lokal auf Ihrem Gerät gespeichert.
                    </p>
                    <button class="secondary-btn" @click="${this._togglePrivacy}" style="margin-bottom: 12px;" aria-label="Datenschutzerklärung anzeigen">
                        📜 Datenschutzerklärung lesen
                    </button>
                    <button class="secondary-btn" @click="${this._exportRecipes}" style="margin-bottom: 12px; border-color: #2563eb; color: #1d4ed8;" aria-label="Rezepte exportieren">
                        📥 Gespeicherte Rezepte exportieren (JSON)
                    </button>
                    
                    <input type="file" id="import-settings-file" accept=".json" style="display: none;" @change="${this._handleImportFile}" />
                    <button class="secondary-btn" @click="${() => (this.shadowRoot?.querySelector('#import-settings-file') as HTMLInputElement)?.click()}" style="margin-bottom: 12px; border-color: #7c3aed; color: #6d28d9;" aria-label="Rezepte aus JSON importieren">
                        📂 Rezepte importieren (JSON)
                    </button>

                    <button class="main-btn" @click="${() => this.dispatchEvent(new CustomEvent('export-full-backup', { bubbles: true, composed: true }))}" style="margin-bottom: 12px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; font-weight: 800;" aria-label="Vollständiges Backup exportieren">
                        📦 Voll-Backup (Gesamtdaten JSON) sichern
                    </button>

                    <input type="file" id="import-full-backup-file" accept=".json" style="display: none;" @change="${(e: Event) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                try {
                                    const parsed = JSON.parse(ev.target?.result as string);
                                    this.dispatchEvent(new CustomEvent('import-full-backup', { detail: { data: parsed }, bubbles: true, composed: true }));
                                } catch (err) {
                                    alert("❌ Ungültige Backup-Datei.");
                                }
                            };
                            reader.readAsText(file);
                        }
                    }}" />
                    <button class="secondary-btn" @click="${() => (this.shadowRoot?.querySelector('#import-full-backup-file') as HTMLInputElement)?.click()}" style="margin-bottom: 12px; border-color: #10b981; color: #047857;" aria-label="Voll-Backup importieren">
                        📂 Voll-Backup wiederherstellen (JSON)
                    </button>
                    
                    <button class="secondary-btn" @click="${this._clearAllData}" style="border-color: #dc2626; color: #b91c1c;" aria-label="Alle Anwendungsdaten löschen">
                        🗑️ Alle App-Daten löschen
                    </button>
                </div>
            </div>
        `;
    }
}
