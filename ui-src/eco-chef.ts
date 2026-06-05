import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from './api-config';
import { ecoChefStyles } from "./eco-chef.styles";


@customElement('eco-chef')
export class EcoChef extends LitElement {

    @property({type: String}) ingredients = '';
    @property({type: Boolean}) isLoading = false;

    @state() selectedDiet = 'egal';
    @state() selectedEffort = 'egal';
    @state() persons = 2;
    @state() allowExtraIngredients = true;
    @state() isDarkMode = false;

    @state() showExitDialog = false;
    @state() showSavedRecipes = false;
    @state() savedRecipesList: any[] = [];
    @state() isEditing = false;
    @state() additionalPrompt = '';

    @state() isCookingMode = false;
    @state() currentCookingStep = 0;

    @state() currentStepTimeMinutes: number | null = null;
    @state() timerSecondsRemaining = 0;
    private timerInterval: number | null = null;

    @state() showShoppingList = false;
    @state() shoppingList: { name: string, checked: boolean }[] = [];

    @state() manualShoppingItem = '';
    @state() capturedImage: string | null = null;
    @state() recipe: {
        title: string;
        difficulty: string;
        prepTime: string;
        ecoScore: string;
        beverage: string;
        storageTip: string;
        nutrition: {
            calories: string;
            protein: string;
            carbs: string;
            fat: string;
        };
        ingredientsList: string[];
        instructions: string[];
        tip: string;
        image?: string;
    } | null = null;

    // DSGVO & Einstellungen
    @state() hasConsent = false;
    @state() showPrivacyDetails = false;
    @state() showSettings = false;
    @state() srAnnouncement = '';

    // LRS & Barrierefreiheit
    @state() isLrsMode = false;
    @state() fontScale = 1.0;
    @state() showReadingRuler = false;
    @state() rulerY = 250;

    // Vorratskammer (Pantry)
    @state() selectedPantry: { [key: string]: boolean } = {};
    pantryItems = ['Salz', 'Pfeffer', 'Olivenöl', 'Wasser', 'Zucker', 'Mehl', 'Milch', 'Butter', 'Eier', 'Knoblauch', 'Zwiebeln'];

    // Sprachsteuerung
    @state() isVoiceControlActive = false;
    @state() voiceStatusText = '';
    private recognition: any = null;

    // Timer & Audio
    @state() showTimerExpiredModal = false;
    private audioCtx: AudioContext | null = null;
    private alarmActive = false;
    private isDraggingRuler = false;

    // Rezept-Bild & Startseite
    @state() recipeImage: string | null = null;
    @state() isGeneratingImage = false;
    @state() showWelcomeScreen = true;


    static override styles = ecoChefStyles;

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('backbutton', this.handleBackButton, false);

        // DSGVO Consent prüfen
        const savedConsent = localStorage.getItem('ecoChef_gdprConsent');
        if (savedConsent === 'true') {
            this.hasConsent = true;
        }

        // Theme laden
        const savedTheme = localStorage.getItem('ecoChef_theme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
        } else if (savedTheme === 'light') {
            this.isDarkMode = false;
        } else {
            this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // LRS & FontScale laden
        const savedLrs = localStorage.getItem('ecoChef_lrsMode');
        this.isLrsMode = savedLrs === 'true';

        const savedScale = localStorage.getItem('ecoChef_fontScale');
        if (savedScale) {
            this.fontScale = parseFloat(savedScale);
        }

        const savedRuler = localStorage.getItem('ecoChef_showRuler');
        this.showReadingRuler = savedRuler === 'true';

        // Pantry laden
        const savedPantry = localStorage.getItem('ecoChef_pantry');
        if (savedPantry) {
            this.selectedPantry = JSON.parse(savedPantry);
        }

        const savedShopping = localStorage.getItem('ecoChef_shoppingList');
        if (savedShopping) {
            this.shoppingList = JSON.parse(savedShopping);
        }

        this.updateFontScaleStyle();
        this.updateBodyBackground();
    }

    override disconnectedCallback() {
        document.removeEventListener('backbutton', this.handleBackButton, false);
        if ('speechSynthesis' in window)  window.speechSynthesis.cancel();
        this.stopTimer();
        this.stopAlarmSound();
        this.stopVoiceRecognition();
        super.disconnectedCallback();
    }

    handleBackButton = (e: Event) => {
        e.preventDefault();
        if (this.showTimerExpiredModal) {
            this.closeTimerExpiredModal();
        } else if (this.isCookingMode) {
            this.exitCookingMode();
        } else if (this.showSettings) {
            this.toggleSettings();
        } else if (this.showShoppingList) {
            this.toggleShoppingList();
        } else if (this.showSavedRecipes) {
            this.toggleSavedView();
        } else if (this.recipe && !this.showExitDialog) {
            this.showExitDialog = true;
        } else if (this.showExitDialog) {
            this.showExitDialog = false;
        } else {
            this.exitApp();
        }
    }

    openCamera() {
        if(!(navigator as any).camera) {
            const fileInput = this.shadowRoot?.querySelector('#file-upload') as HTMLInputElement;
            if (fileInput) fileInput.click();
            return;
        }

        const options = {
            quality: 70,
            destinationType: (navigator as any).camera.DestinationType.DATA_URL,
            encodingType: (navigator as any).camera.EncodingType.JPEG,
            mediaType: (navigator as any).camera.MediaType.PICTURE,
            correctOrientation: true,
            targetWidth: 800,
            targetHeight: 800
        };

        (navigator as any).camera.getPicture(
            (imageData: string) => { 
                this.capturedImage = 'data:image/jpeg;base64,' + imageData; 
            },
            (error: any) => { console.error(error); },
            options
        );
    }


    handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                this.capturedImage = result;
            };
            reader.readAsDataURL(file);
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('ecoChef_theme', this.isDarkMode ? 'dark' : 'light');
        this.updateBodyBackground();
    }

    toggleShoppingList() {
        this.showShoppingList = !this.showShoppingList;
        if (this.showShoppingList) {
            this.showSavedRecipes = false;
            this.recipe = null;
        }
    }

    addToShoppingList(ingredient: string) {
        const cleanName = ingredient.replace(/^(\*|\d+\.)\s*/, '').trim();
        if (!this.shoppingList.some(item => item.name === cleanName)) {
            this.shoppingList.push({ name: cleanName, checked: false });
            this.saveShoppingList();
            alert(`✅ "${cleanName}" wurde zur Einkaufsliste hinzugefügt!`);
            this.requestUpdate();
        } else {
            alert("Das steht bereits auf deiner Einkaufsliste!");
        }
    }

    addManualShoppingItem() {
        if (this.manualShoppingItem.trim() !== '') {
            this.shoppingList.push({ name: this.manualShoppingItem.trim(), checked: false });
            this.manualShoppingItem = '';
            this.saveShoppingList();
        }
    }

    toggleShoppingItem(index: number) {
        this.shoppingList[index].checked = !this.shoppingList[index].checked;
        this.saveShoppingList();
        this.requestUpdate();
    }

    removeShoppingItem(index: number) {
        this.shoppingList.splice(index, 1);
        this.saveShoppingList();
        this.requestUpdate();
    }

    clearCheckedShoppingItems() {
        this.shoppingList = this.shoppingList.filter(item => !item.checked);
        this.saveShoppingList();
    }

    saveShoppingList() {
        localStorage.setItem('ecoChef_shoppingList', JSON.stringify(this.shoppingList));
    }


    analyzeCurrentStep() {
        if (!this.recipe) return;

        const stepText = this.recipe.instructions[this.currentCookingStep];
        const minMatch = stepText.match(/(\d+)\s*(Minuten|Minute|Min|Min\.|min|min\.)/i);
        const hrMatch = stepText.match(/(\d+)\s*(Stunden|Stunde|Std|Std\.|std|std\.)/i);

        let totalMinutes = 0;
        if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
        if (minMatch) totalMinutes += parseInt(minMatch[1], 10);

        this.currentStepTimeMinutes = totalMinutes > 0 ? totalMinutes : null;
    }


    startTimer() {
        if (!this.currentStepTimeMinutes) return;
        this.timerSecondsRemaining = this.currentStepTimeMinutes * 60;

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = window.setInterval(() => {
            if (this.timerSecondsRemaining > 0) {
                this.timerSecondsRemaining--;
            } else {
                this.playAlarm();
                this.stopTimer();
            }
        }, 1000) as unknown as number;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerSecondsRemaining = 0;
    }

    formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    playAlarm() {
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        }
        this.showTimerExpiredModal = true;
        this.alarmActive = true;
        this.srAnnouncement = "Achtung! Die Koch-Zeit ist abgelaufen!";
        this.playAlarmSound();
    }


    override render() {
        if (this.showWelcomeScreen) {
            return html`
                <div class="app-wrapper ${this.isDarkMode ? 'dark-theme' : ''} ${this.isLrsMode ? 'lrs-theme' : ''}">
                    <div class="card" style="padding: 0;">
                        ${this.renderWelcomeScreen()}
                        
                        <!-- Datenschutzeinwilligung auf Startseite anzeigen -->
                        ${this.renderGdprBanner()}
                        ${this.renderPrivacyDetailsModal()}
                    </div>
                </div>
            `;
        }

        return html`
           <div class="app-wrapper ${this.isDarkMode ? 'dark-theme' : ''} ${this.isLrsMode ? 'lrs-theme' : ''}">
              <div class="card">
                
                 <div class="header">
                    <button class="theme-toggle-btn" @click="${this.toggleDarkMode}" title="Dark Mode wechseln" aria-label="Dunkelmodus umschalten" aria-pressed="${this.isDarkMode}">
                        ${this.isDarkMode ? '☀️' : '🌙'}
                    </button>
                    
                    <h2>EcoChef</h2>
                    <p class="subtitle">Dein KI-Rezept-Zauberer 🧑‍🍳</p>
                    
                    <div class="header-actions">
                        <button class="saved-btn" @click="${this.toggleSavedView}" aria-label="${this.showSavedRecipes ? 'Zurück zum Rezept-Generator' : 'Gespeicherte Rezepte anzeigen'}">
                            ${this.showSavedRecipes ? '🔙 Zurück zum Generator' : '📚 Meine Rezepte'}
                        </button>
                        <button class="saved-btn" @click="${this.toggleShoppingList}" aria-label="${this.showShoppingList ? 'Zurück zum Rezept-Generator' : 'Einkaufsliste anzeigen'}">
                            ${this.showShoppingList ? '🔙 Zurück' : '🛒 Einkaufsliste '}
                        </button>
                        <button class="saved-btn" @click="${this.toggleSettings}" aria-label="${this.showSettings ? 'Zurück zum Rezept-Generator' : 'Einstellungen und Vorratskammer'}">
                            ${this.showSettings ? '🔙 Zurück' : '⚙️ Einstellungen'}
                        </button>
                    </div>
                 </div>
              
                  
                 ${this.showSettings ? this.renderSettings() : ''}

                 ${!this.recipe && !this.showSavedRecipes && !this.showShoppingList && !this.showSettings ? html`

                     <div class="input-with-camera">
                         <input type="text" id="ingredients-input" placeholder="Zutaten (z.B. Tomaten, Eier) oder Foto 📷" .value="${this.ingredients}" @input="${this._handleInput}" style="margin-bottom: 0;" aria-label="Zutaten eingeben" />
                         <input type="file" id="file-upload" accept="image/*" style="display: none;" @change="${this.handleFileUpload}" />
                         <button class="camera-btn" @click="${this.openCamera}" title="Kühlschrank scannen" aria-label="Kühlschrank scannen oder Foto hochladen">📸</button>
                     </div>
                     

                    ${this.capturedImage ? html`
                        <div class="image-preview-box">
                            <img src="data:image/jpeg;base64,${this.capturedImage}" alt="Kühlschrank-Bild" />
                            <button class="remove-image-btn" @click="${() => this.capturedImage = null}">❌ Entfernen</button>
                        </div>
                    ` : ''}

                    <div class="filter-section" style="margin-top: 20px;">
                        <p class="filter-title">KI-Unterstützung:</p>
                        <div class="toggle-container">
                            <label class="toggle-switch">
                                <input type="checkbox"
                                       id="extra-ingredients-checkbox"
                                       .checked="${this.allowExtraIngredients}"
                                       @change="${(e: Event) => this.allowExtraIngredients = (e.target as HTMLInputElement).checked}"
                                       aria-label="KI darf Zutaten ergänzen">
                                <span class="slider"></span>
                            </label>
                            <span class="toggle-label" style="color: ${this.allowExtraIngredients ? '#4CAF50' : '#f59e0b'};">
                                ${this.allowExtraIngredients ? '🪄 KI darf Zutaten ergänzen' : '🛑 Streng (NUR meine Zutaten)'}
                            </span>
                        </div>

                        <p class="filter-title">Portionen:</p>
                        <div class="stepper-group">
                            <button class="step-btn" @click="${() => this.persons > 1 ? this.persons-- : null}" aria-label="Portionen verringern">-</button>
                            <span class="step-value">🍽️ ${this.persons} ${this.persons === 1 ? 'Person' : 'Personen'}</span>
                            <button class="step-btn" @click="${() => this.persons < 12 ? this.persons++ : null}" aria-label="Portionen erhöhen">+</button>
                        </div>

                        <p class="filter-title">Ernährung:</p>
                        <div class="chip-group">
                            <button class="chip ${this.selectedDiet === 'egal' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'egal'}"
                                    aria-pressed="${this.selectedDiet === 'egal'}">Alles
                            </button>
                            <button class="chip ${this.selectedDiet === 'vegetarisch' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'vegetarisch'}"
                                    aria-pressed="${this.selectedDiet === 'vegetarisch'}">Vegetarisch 🥦
                            </button>
                            <button class="chip ${this.selectedDiet === 'vegan' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'vegan'}"
                                    aria-pressed="${this.selectedDiet === 'vegan'}">Vegan 🌱
                            </button>
                        </div>

                        <p class="filter-title">Zeitaufwand:</p>
                        <div class="chip-group">
                            <button class="chip ${this.selectedEffort === 'egal' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'egal'}"
                                    aria-pressed="${this.selectedEffort === 'egal'}">Egal
                            </button>
                            <button class="chip ${this.selectedEffort === 'schnell' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'schnell'}"
                                    aria-pressed="${this.selectedEffort === 'schnell'}">Schnell ⚡
                            </button>
                            <button class="chip ${this.selectedEffort === 'aufwendig' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'aufwendig'}"
                                    aria-pressed="${this.selectedEffort === 'aufwendig'}">Aufwendig 👨‍🍳
                            </button>
                        </div>
                    </div>

                    <div class="action-area">
                        ${this.isLoading
                            ? html`
                                <div class="loader"></div>
                                <p class="loader-text">KI kreiert dein Rezept...</p>`
                            : html`
                                <button class="main-btn" @click="${this.askGoogle}" aria-label="Rezept mit künstlicher Intelligenz generieren">✨ Rezept Zaubern</button>`
                        }
                    </div>
                ` : ''}

                  
                  ${this.showShoppingList ? html`
                      <div class="shopping-list-container">
                          <h3 class="recipe-subheading">🛒 Deine Einkaufsliste</h3>
                          <div class="add-item-box">
                              <input type="text"
                                     placeholder="Zutat hinzufügen..."
                                     .value="${this.manualShoppingItem}"
                                     @input="${(e: Event) => this.manualShoppingItem = (e.target as HTMLInputElement).value}"
                                     @keypress="${(e: KeyboardEvent) => e.key === 'Enter' && this.addManualShoppingItem()}"
                                     style="margin-bottom: 0;"
                                     aria-label="Manuelle Zutat eingeben" />
                              <button class="camera-btn" @click="${this.addManualShoppingItem}" style="width: auto; padding: 0 20px; font-size: 20px;" aria-label="Zutat hinzufügen">+</button>
                          </div>

                          ${this.shoppingList.length === 0 ? html`
                              <p class="empty-state">Deine Liste ist leer. Füge Zutaten aus einem Rezept hinzu!</p>
                          ` : html`
                              <div class="saved-list">
                                  ${this.shoppingList.map((item, index) => html`
                                      <div class="shopping-item ${item.checked ? 'checked' : ''}">
                                          <input type="checkbox"
                                                 class="shopping-checkbox"
                                                 .checked="${item.checked}"
                                                 @change="${() => this.toggleShoppingItem(index)}"
                                                 aria-label="${item.name} abchecken" />
                                          <span class="shopping-text">${item.name}</span>
                                          <button class="delete-btn" @click="${() => this.removeShoppingItem(index)}" style="width: 32px; height: 32px; font-size: 14px;" aria-label="${item.name} löschen">❌</button>
                                      </div>
                                  `)}
                              </div>

                              ${this.shoppingList.some(item => item.checked) ? html`
                                <button class="secondary-btn" @click="${this.clearCheckedShoppingItems}" style="margin-top: 20px;">
                                    🧹 Erledigte löschen
                                </button>
                            ` : ''}
                          `}
                      </div>
                  ` : ''}
                  
                  
                ${this.showSavedRecipes && !this.recipe ? html`
                    <div class="saved-recipes-container">
                        <h3 class="recipe-subheading">Deine gespeicherten Rezepte</h3>

                        ${this.savedRecipesList.length === 0 ? html`
                            <p class="empty-state">Du hast noch keine Rezepte gespeichert. Zaubere dein erstes Gericht!</p>
                        ` : html`
                            <div class="saved-list">
                                ${this.savedRecipesList.map((item, index) => html`
                                    <div class="saved-card" @click="${() => this.openSavedRecipe(item)}">
                                        <div class="saved-card-content">
                                            <h4>${item.title}</h4>
                                            <div class="saved-meta">
                                                <span>📊 ${item.difficulty || '?'}</span>
                                                <span>🕒 ${item.prepTime || '?'}</span>
                                            </div>
                                        </div>
                                        <button class="delete-btn" @click="${(e: Event) => this.deleteSavedRecipe(index, e)}">🗑️</button>
                                    </div>
                                `)}
                            </div>
                        `}
                    </div>
                ` : ''}

                  
                ${this.recipe ? html`
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
                        </div>

                        <div class="macros-box">
                            <span class="macro-item"><strong>🔥 ${this.recipe.nutrition?.calories || '? kcal'}</strong></span>
                            <span class="macro-item"><strong>🥩 ${this.recipe.nutrition?.protein || '? g'}</strong> Protein</span>
                            <span class="macro-item"><strong>🌾 ${this.recipe.nutrition?.carbs || '? g'}</strong> KH</span>
                            <span class="macro-item"><strong>🥑 ${this.recipe.nutrition?.fat || '? g'}</strong> Fett</span>
                        </div>

                        
                        ${this.isEditing ? html`
                            <div class="edit-mode-box">
                                <h3 class="recipe-subheading">🖊️ Zutaten bearbeiten:</h3>
                                <textarea id="edit-ingredients" class="edit-area" rows="6">${this.recipe.ingredientsList.join('\n')}</textarea>
                                <h3 class="recipe-subheading">🖊️ Zubereitung bearbeiten:</h3>
                                <textarea id="edit-instructions" class="edit-area" rows="8">${this.recipe.instructions.join('\n')}</textarea>
                                <button class="main-btn save-edit-btn" @click="${this.saveEdits}">💾 Änderungen übernehmen</button>
                            </div>

                        ` : html`
                            <h3 class="recipe-subheading">
                                🛒 Zutaten (für ${this.persons}):
                                <button class="icon-btn" @click="${() => this.isEditing = true}">🖊️</button>
                            </h3>
                            <ul class="ingredients-list">
                                ${this.recipe.ingredientsList.map(item => html`
                                    <li>
                                        <span>${item}</span>
                                        <button class="add-to-list-btn" @click="${() => this.addToShoppingList(item)}" title="Zur Einkaufsliste hinzufügen">
                                            + 🛒
                                        </button>
                                    </li>
                                `)}
                            </ul>

                            <h3 class="recipe-subheading">
                                🍳 Zubereitung:
                                <button class="icon-btn" @click="${() => this.isEditing = true}">🖊️</button>
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
                            <h4>Nicht ganz zufrieden?</h4>
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
                                <button class="secondary-btn" @click="${this.askGoogle}">🔄 Neu zaubern</button>
                            `}
                        </div>

                        <button class="main-btn" @click="${this.startCookingMode}" style="background-color: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); margin-top: 15px; margin-bottom: 10px;">
                            👨‍🍳 Kochmodus starten
                        </button>
                        <button class="main-btn finish-btn" @click="${() => this.showExitDialog = true}">
                            ✅ Rezept schließen
                        </button>
                    </div>
                ` : ''}
             </div>

               
             ${this.isCookingMode && this.recipe ? html`
                <div class="modal-overlay cooking-mode-overlay">
                    <div class="modal-content cooking-content" style="position: relative;">

                        <div class="cooking-header">
                            <span class="step-counter">Schritt ${this.currentCookingStep + 1} von ${this.recipe.instructions.length}</span>
                            <button class="close-cooking-btn" @click="${this.exitCookingMode}" aria-label="Kochmodus beenden">❌ Beenden</button>
                        </div>

                        <div class="step-display" style="position: relative;">
                            <p>${this.recipe.instructions[this.currentCookingStep]}</p>
                        </div>

                        ${this.timerSecondsRemaining > 0 ? html`
                            <div class="timer-display">
                                <span class="timer-countdown">⏳ ${this.formatTime(this.timerSecondsRemaining)}</span>
                                <button class="stop-timer-btn" @click="${this.stopTimer}" aria-label="Timer abbrechen">⏹️ Abbrechen</button>
                            </div>
                            
                        `: this.currentStepTimeMinutes ? html`
                            <div class="timer-display">
                                <button class="start-timer-btn" @click="${this.startTimer}" aria-label="Timer über ${this.currentStepTimeMinutes} Minuten starten">
                                    ⏳ ${this.currentStepTimeMinutes} Min. Timer starten
                                </button>
                            </div>
                        ` : ''}

                        <!-- Sprachsteuerung Status-Bar -->
                        ${this.isVoiceControlActive ? html`
                            <div class="voice-status-bar" role="status" aria-live="polite">
                                <div class="mic-pulse"></div>
                                <span>Sprachsteuerung aktiv: <em>${this.voiceStatusText || 'Hört zu... (Befehle: weiter, zurück, vorlesen, stoppen)'}</em></span>
                            </div>
                        ` : ''}

                        <div class="cooking-controls">
                            <button class="control-btn" @click="${this.prevStep}" ?disabled="${this.currentCookingStep === 0}" aria-label="Vorheriger Schritt">⬅️ Zurück</button>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1.5;">
                                <button class="main-btn voice-btn" @click="${this.readCurrentStep}" aria-label="Aktuellen Schritt vorlesen">🔊 Vorlesen</button>
                                <button class="secondary-btn" @click="${this.toggleVoiceControl}" style="padding: 8px 12px; font-size: 13px; font-weight: bold; border-color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--border)'}; color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--text-dark)'};" aria-label="${this.isVoiceControlActive ? 'Sprachsteuerung deaktivieren' : 'Freihändige Sprachsteuerung aktivieren'}">
                                    ${this.isVoiceControlActive ? '🎙️ Stumm schalten' : '🎙️ Sprachsteuerung start'}
                                </button>
                            </div>

                            <button class="control-btn" @click="${this.nextStep}" ?disabled="${this.currentCookingStep === this.recipe.instructions.length - 1}" aria-label="Nächster Schritt">Weiter ➡️</button>
                        </div>

                    </div>
                </div>
            ` : ''}

               
           ${this.showExitDialog ? html`
               <div class="modal-overlay">
                   <div class="modal-content">
                       <h3>Was möchtest du tun?</h3>
                       <p>Dein Rezept ist fertig. Wie soll es weitergehen?</p>
                       <button class="modal-btn share" @click="${() => {
                           this.shareRecipe();
                           this.showExitDialog = false;
                       }}">📤 Teilen
                       </button>
                       <button class="modal-btn save" @click="${() => {
                           this.saveRecipe();
                           this.showExitDialog = false;
                       }}">💾 Speichern
                       </button>
                       <button class="modal-btn new" @click="${this.startNewRecipe}">🔄 Neues Rezept laden</button>
                       <button class="modal-btn exit" @click="${this.exitApp}">❌ App verlassen</button>
                       <button class="modal-btn cancel" @click="${() => this.showExitDialog = false}">Zurück zum Rezept</button>
                    </div>
                </div>
            ` : ''}
            <!-- Leselineal -->
            ${this.showReadingRuler && (this.recipe || this.isCookingMode) ? html`
                <div class="reading-ruler" style="top: ${this.rulerY}px;">
                    <div class="reading-ruler-handle" 
                         @touchstart="${this.handleRulerTouch}" 
                         @touchmove="${this.handleRulerTouch}"
                         @mousedown="${this.handleRulerMouseDown}"
                         aria-label="Leselineal verschieben"
                         title="Leselineal verschieben">↔️</div>
                </div>
            ` : ''}

            <!-- DSGVO Banner -->
            ${this.renderGdprBanner()}

            <!-- Datenschutz Modal -->
            ${this.renderPrivacyDetailsModal()}

            <!-- Timer Abgelaufen Modal -->
            ${this.renderTimerExpiredModal()}

            <!-- Screen Reader Live Announcements -->
            <div class="sr-only" aria-live="polite" id="sr-announcements">
                ${this.srAnnouncement}
            </div>

          </div>
       `;
    }

    startCookingMode() {
        if (!this.recipe || this.recipe.instructions.length === 0) return;
        this.currentCookingStep = 0;
        this.isCookingMode = true;
        this.analyzeCurrentStep();
    }

    exitCookingMode() {
        this.isCookingMode = false;
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    nextStep() {
        if (this.recipe && this.currentCookingStep < this.recipe.instructions.length - 1) {
            this.currentCookingStep++;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            this.analyzeCurrentStep();
        }
    }

    prevStep() {
        if (this.currentCookingStep > 0) {
            this.currentCookingStep--;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            this.analyzeCurrentStep();
        }
    }

    readCurrentStep() {
        if (!this.recipe) return;
        if (!('speechSynthesis' in window)) {
            alert("Dein aktuelles Gerät unterstützt leider keine automatische Sprachausgabe.");
            return;
        }

        window.speechSynthesis.cancel();
        const textToRead = this.recipe.instructions[this.currentCookingStep];
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    private _handleInput(e: Event) {
        this.ingredients = (e.target as HTMLInputElement).value;
    }

    async askGoogle() {
        if (!this.ingredients && !this.capturedImage) {
            alert("Bitte gib zuerst ein paar Zutaten ein oder mache ein Foto von deinem Kühlschrank!");
            return;
        }
        this.isLoading = true;
        this.recipe = null;
        this.recipeImage = null;
        this.srAnnouncement = "Rezept wird von der Künstlichen Intelligenz generiert. Bitte warten Sie einen moment.";

        let base64Data = '';
        let mimeType = 'image/jpeg';
        if (this.capturedImage) {
            if (this.capturedImage.includes(',')) {
                const parts = this.capturedImage.split(',');
                base64Data = parts[1];
                const mimeMatch = parts[0].match(/data:(.*?);/);
                if (mimeMatch) {
                    mimeType = mimeMatch[1];
                }
            } else {
                base64Data = this.capturedImage;
            }
        }

        const portions = this.persons || 2;
        const textIngredients = this.ingredients || "Keine Text-Eingabe, siehe Bild.";
        const pantryKeys = Object.keys(this.selectedPantry).filter(key => this.selectedPantry[key]);
        const pantryText = pantryKeys.length > 0 ? `\nGrundzutaten in der Vorratskammer (bereits vorhanden und nutzbar): ${pantryKeys.join(', ')}` : '';
        const combinedIngredients = textIngredients + pantryText;

        const strictIngredientRule = this.allowExtraIngredients
            ? "- Zutaten: Du darfst das Rezept mit passenden, zusätzlichen Zutaten aufwerten (z.B. Gemüse, Beilagen, Saucen), damit es perfekt wird."
            : `- Zutaten-Regel (EXTREM WICHTIG): Du darfst AUSSCHLIESSLICH die exakt vom Nutzer angegebenen Zutaten oder auf dem Bild erkennbaren Zutaten verwenden.
               
               Füge KEINE EINZIGE weitere Hauptzutat zur Zutatenliste hinzu. Basis-Gewürze (Salz, Pfeffer) sowie Öl und Wasser sind okay.
               Sei kreativ und erfinde ein neues Gericht, das wirklich NUR aus diesen vorhandenen Zutaten besteht!`;

        const promptText = `
            Du bist ein professioneller Sternekoch und Ernährungsexperte. Der Nutzer schickt dir Zutaten als Text und/oder ein Foto seines Kühlschranks/seiner Zutaten.
            
            Text-Eingabe des Nutzers (inklusive eventueller Vorratskammer-Grundzutaten): ${combinedIngredients}
            
            Falls ein Bild beigefügt ist: Analysiere das Bild GANZ GENAU und erkenne alle essbaren Zutaten darauf. Kombiniere sie mit der Text-Eingabe.
            
            VORGABEN:
            - Ernährungsweise: ${this.selectedDiet && this.selectedDiet !== 'egal' ? this.selectedDiet : 'Keine'}
            - Zeitaufwand: ${this.selectedEffort && this.selectedEffort !== 'egal' ? this.selectedEffort : 'Normal'}
            - Portionen: 
            Berechne die Zutatenmengen für exakt ${portions} Person(en).
            ${strictIngredientRule}
            
            ${this.additionalPrompt ? `🚨 ÄNDERUNGSWUNSCH: "${this.additionalPrompt}". Bitte anpassen!` : ''}
            
            Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt. Das JSON MUSS diese exakte Struktur haben:
            {
              "title": "Name des Gerichts",
              "difficulty": "Leicht, Mittel oder Schwer",
              "prepTime": "z.B. 25 Min.",
              "ecoScore": "Bewerte die Nachhaltigkeit/Regionalität des Gerichts von 1 bis 5 Blättern (Gib NUR diese Emojis zurück: z.B. '🍃🍃🍃🍃')",
              "beverage": "Kurze Empfehlung für ein passendes Getränk (Wein, Bier oder was Alkoholfreies)",
              "storageTip": "Kurzer Tipp zur Aufbewahrung oder Resteverwertung",
              "nutrition": { "calories": "z.B. 450 kcal", "protein": "z.B. 25g", "carbs": "z.B. 40g", "fat": "z.B. 15g" },
              "ingredientsList": ["1. Zutat", "2. Zutat"],
              "instructions": ["Schritt 1...", "Schritt 2..."],
              "tip": "Tipp..."
            }
        `;


        try {
            const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
            const requestContents: any[] = [];
            if (this.capturedImage) {
                requestContents.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }
            requestContents.push(promptText);
            const response = await ai.models.generateContent({
                model: "gemini-flash-latest",
                contents: requestContents,
            });

            const text = response.text || "";
            try {
                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');

                if (startIndex === -1 || endIndex === -1) {
                    throw new Error("Kein JSON-Format in der Antwort gefunden.");
                }

                const jsonString = text.substring(startIndex, endIndex + 1);
                const parsedData = JSON.parse(jsonString);

                if (!parsedData.title || !parsedData.ingredientsList || !parsedData.instructions) {
                    throw new Error("Wichtige Rezeptdaten fehlen.");
                }

                const fallbackNutrition = { calories: "? kcal", protein: "?g", carbs: "?g", fat: "?g" };

                this.recipe = {
                    title: parsedData.title,
                    difficulty: parsedData.difficulty || "Unbekannt",
                    prepTime: parsedData.prepTime || "Unbekannt",
                    ecoScore: parsedData.ecoScore || "🍃🍃🍃",
                    beverage: parsedData.beverage || "Ein frisches Glas Wasser passt wunderbar.",
                    storageTip: parsedData.storageTip || "Am besten sofort genießen!",
                    nutrition: parsedData.nutrition || fallbackNutrition,
                    ingredientsList: Array.isArray(parsedData.ingredientsList) ? parsedData.ingredientsList : ["Zutaten konnten nicht geladen werden."],
                    instructions: Array.isArray(parsedData.instructions) ? parsedData.instructions : ["Zubereitung fehlt."],
                    tip: parsedData.tip || "Lass es dir schmecken!"
                };

                this.srAnnouncement = `Rezept erfolgreich geladen: ${this.recipe.title}. Es besteht aus ${this.recipe.ingredientsList.length} Zutaten und ${this.recipe.instructions.length} Zubereitungsschritten. Bild wird generiert.`;
                window.scrollTo({top: 0, behavior: 'smooth'});

                // Trigger background recipe image generation
                this.generateRecipeImage(this.recipe.title);

            }   catch (parseError) {
                console.error("Fehler beim Auswerten der KI-Antwort:", parseError);
                alert("Upsi! Die KI hat das Rezept-Format etwas durcheinandergebracht. Bitte klicke nochmal auf 'Rezept Zaubern'!");
            }

        }   catch (networkError: any) {
            console.error("API Verbindungsfehler:", networkError);
            alert("Es gab ein Problem mit der Verbindung zu Google: " + networkError.message);
        }   finally {
            this.isLoading = false;
        }
    }

    startNewRecipe() {
        this.recipe = null;
        this.ingredients = '';
        this.capturedImage = null;
        this.showExitDialog = false;
        this.showSavedRecipes = false;
        this.showShoppingList = false;
        this.additionalPrompt = '';
        this.isEditing = false;
        this.isCookingMode = false;
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        this.stopTimer();
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    exitApp() {
        if ((navigator as any).app) {
            (navigator as any).app.exitApp();
        } else {
            alert("App beenden funktioniert nur auf dem echten Handy/Emulator!");
        }
    }

    async shareRecipe() {
        if (!this.recipe) return;
        const shareText = `Schau mal, was ich mit EcoChef gekocht habe:\n\n${this.recipe.title}\n🔥 ${this.recipe.nutrition?.calories || ''} | 🌍 Eco-Score: ${this.recipe.ecoScore || ''}\n🍷 Dazu passt: ${this.recipe.beverage || ''}\n\nLade dir die EcoChef App herunter!`;
        if (navigator.share) {
            try {
                await navigator.share({title: this.recipe.title, text: shareText});
            } catch (err) {
                console.error("Fehler beim Teilen", err);
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            alert("Rezept-Text in die Zwischenablage kopiert!");
        }
    }

    saveRecipe() {
        if (!this.recipe) return;
        const saved = JSON.parse(localStorage.getItem('ecoChef_savedRecipes') || '[]');
        const recipeToSave = {
            ...this.recipe,
            image: this.recipeImage || undefined
        };
        saved.push(recipeToSave);
        localStorage.setItem('ecoChef_savedRecipes', JSON.stringify(saved));
        alert("✅ Rezept lokal gespeichert!");
    }

    toggleSavedView() {
        this.showSavedRecipes = !this.showSavedRecipes;
        if (this.showSavedRecipes) {
            this.showShoppingList = false;
            const saved = localStorage.getItem('ecoChef_savedRecipes');
            this.savedRecipesList = saved ? JSON.parse(saved) : [];
            this.recipe = null;
        }
    }

    openSavedRecipe(savedRecipe: any) {
        this.recipe = savedRecipe;
        this.recipeImage = savedRecipe.image || null;
        this.showSavedRecipes = false;
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    deleteSavedRecipe(index: number, event: Event) {
        event.stopPropagation();
        this.savedRecipesList.splice(index, 1);
        localStorage.setItem('ecoChef_savedRecipes', JSON.stringify(this.savedRecipesList));
        this.requestUpdate();
    }

    saveEdits() {
        if (!this.recipe) return;
        const ingArea = this.shadowRoot?.querySelector('#edit-ingredients') as HTMLTextAreaElement;
        const instArea = this.shadowRoot?.querySelector('#edit-instructions') as HTMLTextAreaElement;

        if (ingArea && instArea) {
            this.recipe = {
                ...this.recipe,
                ingredientsList: ingArea.value.split('\n').filter(line => line.trim() !== ''),
                instructions: instArea.value.split('\n').filter(line => line.trim() !== '')
            };
        }
        this.isEditing = false;
    }

    // --- NEUE HILFSMETHODEN ---

    updateFontScaleStyle() {
        this.style.setProperty('--font-scale', this.fontScale.toString());
    }

    toggleSettings() {
        this.showSettings = !this.showSettings;
        if (this.showSettings) {
            this.showSavedRecipes = false;
            this.showShoppingList = false;
            this.recipe = null;
        }
    }

    togglePantryItem(item: string) {
        this.selectedPantry = {
            ...this.selectedPantry,
            [item]: !this.selectedPantry[item]
        };
        localStorage.setItem('ecoChef_pantry', JSON.stringify(this.selectedPantry));
        this.srAnnouncement = `${item} wurde in der Vorratskammer ${this.selectedPantry[item] ? 'aktiviert' : 'deaktiviert'}.`;
    }

    clearAllData() {
        if (confirm("Möchtest du wirklich alle lokalen Daten (gespeicherte Rezepte, Einkaufsliste, Einstellungen) löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
            localStorage.clear();
            this.srAnnouncement = "Alle Anwendungsdaten wurden gelöscht. Die App wird neu geladen.";
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }

    exportRecipes() {
        const saved = localStorage.getItem('ecoChef_savedRecipes');
        if (!saved || JSON.parse(saved).length === 0) {
            alert("Du hast noch keine Rezepte gespeichert, die exportiert werden können.");
            return;
        }
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(saved);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "ecoChef_rezepte.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.srAnnouncement = "Deine Rezepte wurden als Datei heruntergeladen.";
    }

    toggleLrsMode() {
        this.isLrsMode = !this.isLrsMode;
        localStorage.setItem('ecoChef_lrsMode', this.isLrsMode ? 'true' : 'false');
        this.srAnnouncement = `Lese-Rechtschreib-Hilfe wurde ${this.isLrsMode ? 'eingeschaltet' : 'ausgeschaltet'}.`;
    }

    changeFontScale(delta: number) {
        this.fontScale = Math.min(2.0, Math.max(0.8, this.fontScale + delta));
        localStorage.setItem('ecoChef_fontScale', this.fontScale.toFixed(1));
        this.updateFontScaleStyle();
        this.srAnnouncement = `Schriftgröße geändert auf ${Math.round(this.fontScale * 100)} Prozent.`;
    }

    toggleReadingRuler() {
        this.showReadingRuler = !this.showReadingRuler;
        localStorage.setItem('ecoChef_showRuler', this.showReadingRuler ? 'true' : 'false');
        this.srAnnouncement = `Leselineal wurde ${this.showReadingRuler ? 'eingeschaltet' : 'ausgeschaltet'}.`;
    }

    acceptConsent() {
        localStorage.setItem('ecoChef_gdprConsent', 'true');
        this.hasConsent = true;
        this.srAnnouncement = "Datenschutzerklärung akzeptiert. Willkommen bei EcoChef!";
    }

    togglePrivacyDetails() {
        this.showPrivacyDetails = !this.showPrivacyDetails;
    }

    // Web Audio API
    playAlarmSound() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const playPulse = () => {
                if (!this.audioCtx || !this.alarmActive) return;
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);

                gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.5);

                setTimeout(playPulse, 800);
            };

            playPulse();
        } catch (e) {
            console.error("Audio Context Error", e);
        }
    }

    stopAlarmSound() {
        this.alarmActive = false;
    }

    closeTimerExpiredModal() {
        this.showTimerExpiredModal = false;
        this.stopAlarmSound();
        this.srAnnouncement = "Timer-Alarm beendet.";
    }

    // Sprachsteuerung
    initVoiceRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'de-DE';

        this.recognition.onresult = (event: any) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            this.voiceStatusText = `Befehl erkannt: "${command}"`;
            this.handleVoiceCommand(command);
        };

        this.recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                this.isVoiceControlActive = false;
                this.voiceStatusText = 'Zugriff verweigert';
            }
        };

        this.recognition.onend = () => {
            if (this.isVoiceControlActive && this.isCookingMode) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.error(e);
                }
            }
        };
    }

    toggleVoiceControl() {
        if (!this.recognition) {
            this.initVoiceRecognition();
        }

        if (!this.recognition) {
            alert("Sprachsteuerung wird in diesem Browser leider nicht unterstützt.");
            return;
        }

        this.isVoiceControlActive = !this.isVoiceControlActive;
        if (this.isVoiceControlActive) {
            this.voiceStatusText = 'Hört zu...';
            try {
                this.recognition.start();
            } catch (e) {
                console.error(e);
            }
            this.speakText("Sprachsteuerung aktiv. Sag 'weiter' oder 'zurück', um durch die Schritte zu navigieren.");
            this.srAnnouncement = "Sprachsteuerung aktiviert. Das Mikrofon hört zu.";
        } else {
            this.voiceStatusText = '';
            try {
                this.recognition.stop();
            } catch (e) {
                console.error(e);
            }
            this.srAnnouncement = "Sprachsteuerung deaktiviert.";
        }
    }

    stopVoiceRecognition() {
        this.isVoiceControlActive = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore error
            }
        }
    }

    speakText(text: string) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }

    handleVoiceCommand(command: string) {
        console.log("Voice Command:", command);
        if (command.includes('weiter') || command.includes('nächst') || command.includes('weiterer')) {
            this.nextStep();
            this.speakCurrentStep();
            this.srAnnouncement = "Nächster Schritt vorgelesen.";
        } else if (command.includes('zurück') || command.includes('vorherig') || command.includes('letzter')) {
            this.prevStep();
            this.speakCurrentStep();
            this.srAnnouncement = "Vorheriger Schritt vorgelesen.";
        } else if (command.includes('vorlesen') || command.includes('lies vor') || command.includes('sprechen')) {
            this.readCurrentStep();
            this.srAnnouncement = "Schritt wird vorgelesen.";
        } else if (command.includes('stopp') || command.includes('halt') || command.includes('anhalten')) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            this.stopTimer();
            if (this.showTimerExpiredModal) {
                this.closeTimerExpiredModal();
            }
            this.srAnnouncement = "Sprachausgabe und Timer gestoppt.";
        } else if (command.includes('hilfe') || command.includes('befehle')) {
            this.speakText("Mögliche Befehle sind: weiter, zurück, vorlesen, stoppen und hilfe.");
        }
    }

    speakCurrentStep() {
        if (this.recipe) {
            this.speakText(`Schritt ${this.currentCookingStep + 1}: ${this.recipe.instructions[this.currentCookingStep]}`);
        }
    }

    // Leselineal Drag Handlers
    handleRulerTouch(e: TouchEvent) {
        if (e.touches && e.touches[0]) {
            const cardElement = this.shadowRoot?.querySelector('.card');
            if (cardElement) {
                const rect = cardElement.getBoundingClientRect();
                const relativeY = e.touches[0].clientY - rect.top;
                this.rulerY = Math.max(0, Math.min(rect.height - 32, relativeY));
            }
        }
    }

    handleRulerMouseDown() {
        this.isDraggingRuler = true;
        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!this.isDraggingRuler) return;
            const cardElement = this.shadowRoot?.querySelector('.card');
            if (cardElement) {
                const rect = cardElement.getBoundingClientRect();
                const relativeY = moveEvent.clientY - rect.top;
                this.rulerY = Math.max(0, Math.min(rect.height - 32, relativeY));
            }
        };

        const onMouseUp = () => {
            this.isDraggingRuler = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    // Render Sub-Components
    renderSettings() {
        return html`
            <div class="settings-container">
                <h3 class="recipe-subheading">⚙️ Einstellungen & Vorrat</h3>

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
                                @click="${() => this.togglePantryItem(item)}"
                                aria-pressed="${!!this.selectedPantry[item]}"
                            >
                                ${this.selectedPantry[item] ? '✅' : '➕'} ${item}
                            </button>
                        `)}
                    </div>
                </div>

                <!-- Barrierefreiheit Section -->
                <div class="settings-section">
                    <h4 class="settings-title">👁️ Barrierefreiheit & Lesehilfe</h4>
                    
                    <p class="filter-title" style="margin-top: 10px;">Schriftgröße:</p>
                    <div class="font-size-controls">
                        <button class="step-btn" @click="${() => this.changeFontScale(-0.1)}" aria-label="Schriftgröße verkleinern">A-</button>
                        <span class="step-value" style="flex-grow: 1;">${Math.round(this.fontScale * 100)}%</span>
                        <button class="step-btn" @click="${() => this.changeFontScale(0.1)}" aria-label="Schriftgröße vergrößern">A+</button>
                    </div>

                    <div class="toggle-container" style="margin-top: 20px;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.isLrsMode}"
                                   @change="${this.toggleLrsMode}"
                                   aria-label="LRS-Lesehilfe aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="color: ${this.isLrsMode ? '#4CAF50' : 'var(--text-dark)'};">
                            LRS-Modus (Optimierter Zeilenabstand & Schrift)
                        </span>
                    </div>

                    <div class="toggle-container" style="margin-top: 10px;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.showReadingRuler}"
                                   @change="${this.toggleReadingRuler}"
                                   aria-label="Leselineal aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="color: ${this.showReadingRuler ? '#4CAF50' : 'var(--text-dark)'};">
                            Leselineal einblenden (Verschiebbar)
                        </span>
                    </div>
                </div>

                <!-- DSGVO & Datenschutz Section -->
                <div class="settings-section">
                    <h4 class="settings-title">🛡️ Datenschutz & DSGVO</h4>
                    <p class="subtitle" style="margin-bottom: 16px;">
                        Ihre Daten gehören Ihnen. Alle Rezepte und Einstellungen werden lokal auf Ihrem Gerät gespeichert.
                    </p>
                    <button class="secondary-btn" @click="${this.togglePrivacyDetails}" style="margin-bottom: 12px;" aria-label="Datenschutzerklärung anzeigen">
                        📜 Datenschutzerklärung lesen
                    </button>
                    <button class="secondary-btn" @click="${this.exportRecipes}" style="margin-bottom: 12px; border-color: #3b82f6; color: #1d4ed8;" aria-label="Rezepte exportieren">
                        📥 Gespeicherte Rezepte exportieren (JSON)
                    </button>
                    <button class="secondary-btn" @click="${this.clearAllData}" style="border-color: #ef4444; color: #b91c1c;" aria-label="Alle Anwendungsdaten löschen">
                        🗑️ Alle App-Daten löschen
                    </button>
                </div>
            </div>
        `;
    }

    renderGdprBanner() {
        if (this.hasConsent) return '';
        return html`
            <div class="gdpr-banner" role="dialog" aria-labelledby="gdpr-title" aria-describedby="gdpr-desc">
                <h3 id="gdpr-title" style="margin-top: 0; font-size: 20px; font-weight: 800; color: var(--text-dark);">🛡️ Datenschutzeinwilligung</h3>
                <p id="gdpr-desc" class="gdpr-text">
                    Um personalisierte Rezepte mit Künstlicher Intelligenz zu erstellen, sendet diese App Ihre Zutatenliste und ggf. Fotos an die <strong>Google Gemini API</strong>. 
                    Ihre Einstellungen, die Einkaufsliste und Rezepte werden <strong>ausschließlich lokal auf Ihrem Gerät gespeichert</strong>. Es werden keine sonstigen Tracker oder Analysedienste verwendet.
                </p>
                <div class="gdpr-buttons">
                    <button class="main-btn" @click="${this.acceptConsent}" aria-label="Einwilligen und fortfahren">Zustimmen & Fortfahren</button>
                    <button class="secondary-btn" @click="${this.togglePrivacyDetails}" aria-label="Datenschutzerklärung anzeigen">Datenschutzerklärung anzeigen</button>
                </div>
            </div>
        `;
    }

    renderPrivacyDetailsModal() {
        if (!this.showPrivacyDetails) return '';
        return html`
            <div class="modal-overlay" style="z-index: 3000;">
                <div class="modal-content" style="max-height: 80vh; overflow-y: auto; border-radius: 24px;">
                    <h3 style="margin-top: 0; font-size: 22px; color: var(--text-dark);">Datenschutzerklärung EcoChef</h3>
                    <div style="font-size: 14px; line-height: 1.6; text-align: left; color: var(--text-dark);">
                        <p><strong>1. Lokale Speicherung</strong><br>
                        Alle von Ihnen erstellten Rezepte, die Einkaufsliste und Ihre Einstellungen werden ausschließlich lokal in der <code>localStorage</code> Ihres Browsers bzw. Geräts gespeichert. Diese Daten verlassen Ihr Gerät nicht, es sei denn, Sie nutzen die Teilen-Funktion.</p>
                        
                        <p><strong>2. Nutzung der Google Gemini API</strong><br>
                        Wenn Sie die Funktion "Rezept Zaubern" nutzen, werden die eingegebenen Zutaten, Portionsgrößen sowie das Kühlschrankfoto an Server von Google (Gemini API) übertragen, um das Rezept zu generieren. Google verarbeitet diese Daten gemäß seinen API-Datenschutzbestimmungen. Es werden keine Identifikatoren Ihres Geräts an Google übermittelt.</p>
                        
                        <p><strong>3. Ihre Rechte (DSGVO)</strong><br>
                        Da alle Daten lokal gespeichert werden, haben Sie die volle Kontrolle: Sie können alle Daten über die App-Einstellungen ("Alle App-Daten löschen") oder durch das Löschen der Browserdaten Ihres Geräts unwiderruflich entfernen. Damit wird Ihr Recht auf Löschung (Art. 17 DSGVO) vollständig gewahrt.</p>
                        
                        <p><strong>4. Kontakt</strong><br>
                        EcoChef App - Lokale Cordova App ohne externe Server-Datenbank.</p>
                    </div>
                    <button class="main-btn" @click="${this.togglePrivacyDetails}" style="margin-top: 24px;" aria-label="Schließen">Schließen</button>
                </div>
            </div>
        `;
    }

    renderTimerExpiredModal() {
        if (!this.showTimerExpiredModal) return '';
        return html`
            <div class="modal-overlay" style="z-index: 2500;">
                <div class="modal-content" style="text-align: center; border-radius: 24px; padding: 32px 24px;">
                    <h3 style="color: #ef4444; font-size: 28px; margin-top: 0;">⏰ Timer abgelaufen!</h3>
                    <p style="font-size: 18px; margin-bottom: 32px; color: var(--text-dark);">Dein Essen braucht jetzt deine Aufmerksamkeit!</p>
                    <button class="main-btn" @click="${this.closeTimerExpiredModal}" style="background-color: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);" aria-label="Alarm stoppen">
                        Alarm stoppen ⏹️
                    </button>
                </div>
            </div>
        `;
    }

    updateBodyBackground() {
        document.body.style.backgroundColor = this.isDarkMode ? '#0f172a' : '#96C7E8';
    }

    enterApp() {
        this.showWelcomeScreen = false;
        this.srAnnouncement = "Willkommen in der Küche von EcoChef. Du kannst jetzt Zutaten eingeben.";
    }

    async generateRecipeImage(title: string) {
        this.isGeneratingImage = true;
        this.recipeImage = null;
        
        try {
            const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: `A beautiful, clean studio food photography of ${title}, professional plating, high quality food shot, soft lighting, 4k`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '4:3',
                }
            });
            
            if (response && response.generatedImages && response.generatedImages[0] && response.generatedImages[0].image) {
                const base64Bytes = response.generatedImages[0].image.imageBytes;
                this.recipeImage = `data:image/jpeg;base64,${base64Bytes}`;
                console.log("Successfully generated image via Imagen!");
            } else {
                throw new Error("No image returned by Imagen.");
            }
        } catch (e) {
            console.warn("Imagen generation failed, falling back to loremflickr:", e);
            const cleanTitle = title.replace(/[^a-zA-Z ]/g, '').split(' ').slice(0, 2).join(',');
            this.recipeImage = `https://loremflickr.com/600/400/food,${encodeURIComponent(cleanTitle)}/all`;
        } finally {
            this.isGeneratingImage = false;
            if (this.recipe) {
                this.recipe = {
                    ...this.recipe,
                    image: this.recipeImage || undefined
                };
            }
            this.requestUpdate();
        }
    }

    renderWelcomeScreen() {
        return html`
            <div class="welcome-container">
                <div class="welcome-logo-area">
                    <span class="welcome-logo" role="img" aria-label="EcoChef Logo">🍳</span>
                </div>
                
                <h1 class="welcome-title">EcoChef</h1>
                <p class="welcome-desc">
                    Dein intelligenter KI-Rezept-Zauberer. Koche kreativ mit deinen Kühlschrankzutaten, schütze die Umwelt und genieße maximale Barrierefreiheit.
                </p>

                <!-- Schnell-Einstellungen vor dem Start -->
                <div class="welcome-quick-settings">
                    <h4>⚙️ Barrierefreiheit & Design</h4>
                    
                    <div class="toggle-container" style="background: transparent; border: none; margin-bottom: 12px; padding: 0; display: flex; align-items: center; gap: 12px; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.isDarkMode}"
                                   @change="${this.toggleDarkMode}"
                                   aria-label="Dunkelmodus umschalten">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="font-weight: 700; color: var(--text-dark);">
                            Dunkelmodus: ${this.isDarkMode ? 'Ein 🌙' : 'Aus ☀️'}
                        </span>
                    </div>

                    <div class="toggle-container" style="background: transparent; border: none; margin-bottom: 0; padding: 0; display: flex; align-items: center; gap: 12px; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   .checked="${this.isLrsMode}"
                                   @change="${this.toggleLrsMode}"
                                   aria-label="LRS-Lesehilfe aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="font-weight: 700; color: var(--text-dark);">
                            LRS-Modus (Lesehilfe): ${this.isLrsMode ? 'Ein 👁️' : 'Aus'}
                        </span>
                    </div>
                </div>

                <button class="welcome-enter-btn" @click="${this.enterApp}" aria-label="Küche betreten und App starten">
                    Küche betreten 🧑‍🍳
                </button>
            </div>
        `;
    }
}