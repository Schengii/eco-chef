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
    } | null = null;


    static override styles = ecoChefStyles;

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('backbutton', this.handleBackButton, false);

        const savedTheme = localStorage.getItem('ecoChef_theme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
        } else if (savedTheme === 'light') {
            this.isDarkMode = false;
        } else {
            this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        const savedShopping = localStorage.getItem('ecoChef_shoppingList');
        if (savedShopping) {
            this.shoppingList = JSON.parse(savedShopping);
        }
    }

    override disconnectedCallback() {
        document.removeEventListener('backbutton', this.handleBackButton, false);
        if ('speechSynthesis' in window)  window.speechSynthesis.cancel();
        this.stopTimer();
        super.disconnectedCallback();
    }

    handleBackButton = (e: Event) => {
        e.preventDefault();
        if (this.isCookingMode) {
            this.exitCookingMode();
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
            (imageData: string) => { this.capturedImage = imageData; },
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
                this.capturedImage = result.includes(',') ? result.split(',')[1] : result;
            };
            reader.readAsDataURL(file);
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('ecoChef_theme', this.isDarkMode ? 'dark' : 'light');
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
        if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        alert("⏰ Die Zeit ist abgelaufen! Dein Essen braucht Aufmerksamkeit!");
    }


    override render() {
        return html`
           <div class="app-wrapper ${this.isDarkMode ? 'dark-theme' : ''}">
              <div class="card">
                
                 <div class="header">
                    <button class="theme-toggle-btn" @click="${this.toggleDarkMode}" title="Dark Mode wechseln">
                        ${this.isDarkMode ? '☀️' : '🌙'}
                    </button>
                    
                    <h2>EcoChef</h2>
                    <p class="subtitle">Dein KI-Rezept-Zauberer 🧑‍🍳</p>
                    
                    <div class="header-actions">
                        <button class="saved-btn" @click="${this.toggleSavedView}">
                            ${this.showSavedRecipes ? '🔙 Zurück zum Generator' : '📚 Meine Rezepte'}
                        </button>
                        <button class="saved-btn" @click="${this.toggleShoppingList}">
                            ${this.showShoppingList ? '🔙 Zurück' : '🛒 Einkaufsliste '}
                        </button>
                    </div>
                 </div>
              
                  
                 ${!this.recipe && !this.showSavedRecipes && !this.showShoppingList ? html`

                     <div class="input-with-camera">
                         <input type="text" placeholder="Zutaten (z.B. Tomaten, Eier) oder Foto 📷" .value="${this.ingredients}" @input="${this._handleInput}" style="margin-bottom: 0;" />
                         <input type="file" id="file-upload" accept="image/*" style="display: none;" @change="${this.handleFileUpload}" />
                         <button class="camera-btn" @click="${this.openCamera}" title="Kühlschrank scannen">📸</button>
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
                                       .checked="${this.allowExtraIngredients}"
                                       @change="${(e: Event) => this.allowExtraIngredients = (e.target as HTMLInputElement).checked}">
                                <span class="slider"></span>
                            </label>
                            <span class="toggle-label" style="color: ${this.allowExtraIngredients ? '#4CAF50' : '#f59e0b'};">
                                ${this.allowExtraIngredients ? '🪄 KI darf Zutaten ergänzen' : '🛑 Streng (NUR meine Zutaten)'}
                            </span>
                        </div>

                        <p class="filter-title">Portionen:</p>
                        <div class="stepper-group">
                            <button class="step-btn" @click="${() => this.persons > 1 ? this.persons-- : null}">-</button>
                            <span class="step-value">🍽️ ${this.persons} ${this.persons === 1 ? 'Person' : 'Personen'}</span>
                            <button class="step-btn" @click="${() => this.persons < 12 ? this.persons++ : null}">+</button>
                        </div>

                        <p class="filter-title">Ernährung:</p>
                        <div class="chip-group">
                            <button class="chip ${this.selectedDiet === 'egal' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'egal'}">Alles
                            </button>
                            <button class="chip ${this.selectedDiet === 'vegetarisch' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'vegetarisch'}">Vegetarisch 🥦
                            </button>
                            <button class="chip ${this.selectedDiet === 'vegan' ? 'active' : ''}"
                                    @click="${() => this.selectedDiet = 'vegan'}">Vegan 🌱
                            </button>
                        </div>

                        <p class="filter-title">Zeitaufwand:</p>
                        <div class="chip-group">
                            <button class="chip ${this.selectedEffort === 'egal' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'egal'}">Egal
                            </button>
                            <button class="chip ${this.selectedEffort === 'schnell' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'schnell'}">Schnell ⚡
                            </button>
                            <button class="chip ${this.selectedEffort === 'aufwendig' ? 'active' : ''}"
                                    @click="${() => this.selectedEffort = 'aufwendig'}">Aufwendig 👨‍🍳
                            </button>
                        </div>
                    </div>

                    <div class="action-area">
                        ${this.isLoading
                            ? html`
                                <div class="loader"></div>
                                <p class="loader-text">KI kreiert dein Rezept...</p>`
                            : html`
                                <button class="main-btn" @click="${this.askGoogle}">✨ Rezept Zaubern</button>`
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
                                     style="margin-bottom: 0;" />
                              <button class="camera-btn" @click="${this.addManualShoppingItem}" style="width: auto; padding: 0 20px; font-size: 20px;">+</button>
                          </div>

                          ${this.shoppingList.length === 0 ? html`
                              <p class="empty-state">Deine Liste ist leer. Füge Zutaten aus einem Rezept hinzu!</p>
                          ` : html`
                              <div class="saved-list">
                                  ${this.shoppingList.map((item, index) => html`
                                      <div class="shopping-item ${item.checked ? 'checked' : ''}">
                                          <input type="checkbox"
                                                 class="shopping-c
                                                 heckbox"
                                                 .checked="${item.checked}"
                                                 @change="${() => this.toggleShoppingItem(index)}" />
                                          <span class="shopping-text">${item.name}</span>
                                          <button class="delete-btn" @click="${() => this.removeShoppingItem(index)}" style="width: 32px; height: 32px; font-size: 14px;">❌</button>
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
                    <div class="modal-content cooking-content">

                        <div class="cooking-header">
                            <span class="step-counter">Schritt ${this.currentCookingStep + 1} von ${this.recipe.instructions.length}</span>
                            <button class="close-cooking-btn" @click="${this.exitCookingMode}">❌ Beenden</button>
                        </div>

                        <div class="step-display">
                            <p>${this.recipe.instructions[this.currentCookingStep]}</p>
                        </div>

                        ${this.timerSecondsRemaining > 0 ? html`
                            <div class="timer-display">
                                <span class="timer-countdown">⏳ ${this.formatTime(this.timerSecondsRemaining)}</span>
                                <button class="stop-timer-btn" @click="${this.stopTimer}">⏹️ Abbrechen</button>
                            </div>
                            
                        `: this.currentStepTimeMinutes ? html`
                            <div class="timer-display">
                                <button class="start-timer-btn" @click="${this.startTimer}">
                                    ⏳ ${this.currentStepTimeMinutes} Min. Timer starten
                                </button>
                            </div>
                        ` : ''}

                        <div class="cooking-controls">
                            <button class="control-btn" @click="${this.prevStep}" ?disabled="${this.currentCookingStep === 0}">⬅️ Zurück</button>
                            <button class="main-btn voice-btn" @click="${this.readCurrentStep}">🔊 Vorlesen</button>
                            <button class="control-btn" @click="${this.nextStep}" ?disabled="${this.currentCookingStep === this.recipe.instructions.length - 1}">Weiter ➡️</button>
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

        const portions = this.persons || 2;
        const textIngredients = this.ingredients || "Keine Text-Eingabe, siehe Bild.";

        const strictIngredientRule = this.allowExtraIngredients
            ? "- Zutaten: Du darfst das Rezept mit passenden, zusätzlichen Zutaten aufwerten (z.B. Gemüse, Beilagen, Saucen), damit es perfekt wird."
            : `- Zutaten-Regel (EXTREM WICHTIG): Du darfst AUSSCHLIESSLICH die exakt vom Nutzer angegebenen Zutaten oder auf dem Bild erkennbaren Zutaten verwenden.
               Füge KEINE EINZIGE weitere Hauptzutat zur Zutatenliste hinzu. Basis-Gewürze (Salz, Pfeffer) sowie Öl und Wasser sind okay.
               Sei kreativ und erfinde ein neues Gericht, das wirklich NUR aus diesen vorhandenen Zutaten besteht!`;

        const promptText = `
            Du bist ein professioneller Sternekoch und Ernährungsexperte. Der Nutzer schickt dir Zutaten als Text und/oder ein Foto seines Kühlschranks/seiner Zutaten.
            
            Text-Eingabe des Nutzers: ${textIngredients}
            
            Falls ein Bild beigefügt ist: Analysiere das Bild GANZ GENAU und erkenne alle essbaren Zutaten darauf. Kombiniere sie mit der Text-Eingabe.
            
            VORGABEN:
            - Ernährungsweise: ${this.selectedDiet && this.selectedDiet !== 'egal' ? this.selectedDiet : 'Keine'}
            - Zeitaufwand: ${this.selectedEffort && this.selectedEffort !== 'egal' ? this.selectedEffort : 'Normal'}
            - Portionen: Berechne die Zutatenmengen für exakt ${portions} Person(en).
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
              "nutrition": {
                "calories": "z.B. 450 kcal",
                "protein": "z.B. 25g",
                "carbs": "z.B. 40g",
                "fat": "z.B. 15g"
              },
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
                        data: this.capturedImage,
                        mimeType: "image/jpeg"
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

                window.scrollTo({top: 0, behavior: 'smooth'});

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
        saved.push(this.recipe);
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
}