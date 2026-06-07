import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Recipe, IngredientItem, ShoppingItem, DailyStat } from './models/eco-chef.models';
import { ecoChefStyles } from './styles/eco-chef.styles';

import { StorageService } from './services/storage.service';
import { AudioService } from './services/audio.service';
import { SpeechService } from './services/speech.service';
import { GeminiService } from './services/gemini.service';

// Import subcomponents so they are registered
import './components/eco-chef-welcome';
import './components/eco-chef-gdpr-banner';
import './components/eco-chef-privacy-modal';
import './components/eco-chef-timer-expired-modal';
import './components/eco-chef-settings';
import './components/eco-chef-shopping-list';
import './components/eco-chef-recipe-view';
import './components/eco-chef-cooking-mode';

@customElement('eco-chef')
export class EcoChef extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: String }) ingredients = '';
    @property({ type: Boolean }) isLoading = false;

    @state() selectedDiet = 'egal';
    @state() selectedEffort = 'egal';
    @state() persons = 2;
    @state() allowExtraIngredients = true;
    @state() isDarkMode = false;

    @state() showExitDialog = false;
    @state() showSavedRecipes = false;
    @state() savedRecipesList: Recipe[] = [];
    @state() additionalPrompt = '';

    @state() isCookingMode = false;
    @state() currentCookingStep = 0;

    @state() currentStepTimeMinutes: number | null = null;
    @state() timerSecondsRemaining = 0;
    private timerInterval: number | null = null;

    @state() showShoppingList = false;
    @state() shoppingList: ShoppingItem[] = [];

    @state() capturedImage: string | null = null;
    @state() recipe: Recipe | null = null;

    @state() selectedAllergens: { [key: string]: boolean } = {};
    @state() ingredientChips: string[] = [];
    @state() urgentIngredients: { [key: string]: boolean } = {};
    @state() stats: { [date: string]: DailyStat } = {};

    @state() hasConsent = false;
    @state() showPrivacyDetails = false;
    @state() showSettings = false;
    @state() srAnnouncement = '';

    @state() isLrsMode = false;
    @state() fontScale = 1.0;
    @state() showReadingRuler = false;
    @state() rulerY = 250;

    pantryItems = ['Salz', 'Pfeffer', 'Olivenöl', 'Wasser', 'Zucker', 'Mehl', 'Milch', 'Butter', 'Eier', 'Knoblauch', 'Zwiebeln'];
    @state() selectedPantry: { [key: string]: boolean } = {};

    @state() isVoiceControlActive = false;
    @state() voiceStatusText = '';

    @state() showTimerExpiredModal = false;
    @state() recipeImage: string | null = null;
    @state() isGeneratingImage = false;
    @state() showWelcomeScreen = true;

    @state() searchQuery = '';
    @state() currentRating = 0;

    @state() calorieGoal = 2000;
    @state() proteinGoal = 80;
    @state() geminiApiKey = '';

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('backbutton', this.handleBackButton, false);

        this.hasConsent = StorageService.getGdprConsent();
        
        const savedTheme = StorageService.getTheme();
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
        } else if (savedTheme === 'light') {
            this.isDarkMode = false;
        } else {
            this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        this.isLrsMode = StorageService.getLrsMode();
        this.fontScale = StorageService.getFontScale();
        this.showReadingRuler = StorageService.getShowRuler();
        this.selectedPantry = StorageService.getPantry();
        this.shoppingList = StorageService.getShoppingList();
        this.selectedAllergens = StorageService.getAllergens();
        this.stats = StorageService.getStats();
        this.calorieGoal = StorageService.getCalorieGoal();
        this.proteinGoal = StorageService.getProteinGoal();
        this.geminiApiKey = StorageService.getGeminiApiKey();
        
        this.loadChips();

        this.updateFontScaleStyle();
        this.updateBodyBackground();
    }

    override disconnectedCallback() {
        document.removeEventListener('backbutton', this.handleBackButton, false);
        SpeechService.cancelSpeak();
        this.stopTimer();
        AudioService.stopAlarm();
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
    };

    @state() showWebcam = false;
    private webcamStream: MediaStream | null = null;

    async openCamera() {
        // App-Kamera über Cordova
        if ((navigator as any).camera) {
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
                    this.srAnnouncement = "Foto erfolgreich über App-Kamera aufgenommen.";
                },
                (error: any) => { 
                    console.error("Cordova Camera error:", error); 
                    this.srAnnouncement = "Fehler bei der App-Kamera.";
                },
                options
            );
            return;
        }

        // Web-Kamera über getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                this.showWebcam = true;
                await this.updateComplete;
                const video = this.shadowRoot?.querySelector('#webcam-video') as HTMLVideoElement;
                this.webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Bevorzugt Rückkamera auf Mobilgeräten im Browser
                });
                if (video) {
                    video.srcObject = this.webcamStream;
                }
                this.srAnnouncement = "Webcam-Vorschau gestartet.";
            } catch (err) {
                console.warn("Webcam access failed, falling back to file picker", err);
                this.showWebcam = false;
                this.triggerFilePicker();
            }
        } else {
            this.triggerFilePicker();
        }
    }

    triggerFilePicker() {
        const fileInput = this.shadowRoot?.querySelector('#file-upload') as HTMLInputElement;
        if (fileInput) fileInput.click();
    }

    captureWebcam() {
        const video = this.shadowRoot?.querySelector('#webcam-video') as HTMLVideoElement;
        const canvas = this.shadowRoot?.querySelector('#webcam-canvas') as HTMLCanvasElement;
        if (video && canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                this.capturedImage = canvas.toDataURL('image/jpeg');
                this.srAnnouncement = "Foto erfolgreich aufgenommen.";
            }
        }
        this.closeWebcam();
    }

    closeWebcam() {
        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        this.showWebcam = false;
        this.srAnnouncement = "Kamera-Modus beendet.";
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
        StorageService.setTheme(this.isDarkMode ? 'dark' : 'light');
        this.updateBodyBackground();
    }

    toggleShoppingList() {
        this.showShoppingList = !this.showShoppingList;
        if (this.showShoppingList) {
            this.showSavedRecipes = false;
            this.showSettings = false;
            this.recipe = null;
        }
    }

    addToShoppingList(ingredient: IngredientItem | string) {
        let cleanName = '';
        let category = 'Sonstiges';
        if (typeof ingredient === 'string') {
            cleanName = ingredient.replace(/^(\*|\d+\.)\s*/, '').trim();
        } else {
            cleanName = ingredient.item.replace(/^(\*|\d+\.)\s*/, '').trim();
            category = ingredient.category || 'Sonstiges';
        }
        if (!this.shoppingList.some(item => item.name === cleanName)) {
            this.shoppingList.push({ name: cleanName, checked: false, category });
            this.saveShoppingList();
            alert(`✅ "${cleanName}" wurde zur Einkaufsliste hinzugefügt!`);
            this.requestUpdate();
        } else {
            alert("Das steht bereits auf deiner Einkaufsliste!");
        }
    }

    addManualShoppingItem(name: string) {
        const trimmed = name.trim();
        if (trimmed !== '') {
            this.shoppingList.push({ name: trimmed, checked: false, category: 'Sonstiges' });
            this.saveShoppingList();
            this.requestUpdate();
        }
    }

    toggleShoppingItem(index: number) {
        if (this.shoppingList[index]) {
            this.shoppingList[index].checked = !this.shoppingList[index].checked;
            this.saveShoppingList();
            this.requestUpdate();
        }
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
        StorageService.setShoppingList(this.shoppingList);
    }

    handleIngredientsKeypress(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.addIngredientFromInput();
        }
    }

    addIngredientFromInput() {
        const val = this.ingredients.trim();
        if (val) {
            const parts = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
            for (const part of parts) {
                if (!this.ingredientChips.includes(part)) {
                    this.ingredientChips = [...this.ingredientChips, part];
                }
            }
            this.ingredients = '';
            const inputEl = this.shadowRoot?.querySelector('#ingredients-input') as HTMLInputElement;
            if (inputEl) {
                inputEl.value = '';
            }
            this.saveChips();
        }
    }

    removeIngredientChip(chip: string) {
        this.ingredientChips = this.ingredientChips.filter(c => c !== chip);
        delete this.urgentIngredients[chip];
        this.urgentIngredients = { ...this.urgentIngredients };
        this.saveChips();
    }

    toggleUrgentIngredient(chip: string) {
        this.urgentIngredients = {
            ...this.urgentIngredients,
            [chip]: !this.urgentIngredients[chip]
        };
        this.saveChips();
        this.srAnnouncement = `${chip} wurde als ${this.urgentIngredients[chip] ? 'dringend zu verbrauchen' : 'normal'} markiert.`;
    }

    saveChips() {
        StorageService.setIngredientChips(this.ingredientChips);
        StorageService.setUrgentIngredients(this.urgentIngredients);
    }

    loadChips() {
        this.ingredientChips = StorageService.getIngredientChips();
        this.urgentIngredients = StorageService.getUrgentIngredients();
    }

    toggleAllergen(allergen: string) {
        this.selectedAllergens = {
            ...this.selectedAllergens,
            [allergen]: !this.selectedAllergens[allergen]
        };
        StorageService.setAllergens(this.selectedAllergens);
        this.srAnnouncement = `Allergenfilter ${allergen} wurde ${this.selectedAllergens[allergen] ? 'aktiviert' : 'deaktiviert'}.`;
    }

    normalizeIngredients(ingredients: any[]): IngredientItem[] {
        if (!ingredients) return [];
        return ingredients.map(ing => {
            if (typeof ing === 'string') {
                return { item: ing, category: 'Sonstiges' };
            }
            if (ing && typeof ing === 'object' && 'item' in ing) {
                return { item: ing.item, category: ing.category || 'Sonstiges' };
            }
            return { item: String(ing), category: 'Sonstiges' };
        });
    }

    getGroupedShoppingList() {
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

    async shareShoppingList() {
        if (this.shoppingList.length === 0) return;
        
        const grouped = this.getGroupedShoppingList();
        let text = `🛒 *Meine EcoChef Einkaufsliste*:\n`;
        
        const categoriesOrder = ['Obst & Gemüse', 'Milchprodukte & Eier', 'Fleisch & Fisch', 'Vorrat & Gewürze', 'Bäckerei', 'Sonstiges'];
        categoriesOrder.forEach(cat => {
            if (grouped[cat] && grouped[cat].length > 0) {
                text += `\n*${cat}*:\n`;
                grouped[cat].forEach(g => {
                    const prefix = g.item.checked ? '✅ ' : '⬜ ';
                    text += `${prefix}${g.item.name}\n`;
                });
            }
        });
        
        text += `\nGeneriert mit EcoChef 🧑‍🍳`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Meine Einkaufsliste',
                    text: text
                });
            } catch (err) {
                console.error("Fehler beim Teilen", err);
            }
        } else {
            await navigator.clipboard.writeText(text);
            alert("Einkaufsliste als Text in die Zwischenablage kopiert!");
        }
    }

    parseVal(val: string | number | undefined): number {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        const match = val.match(/([\d.,]+)/);
        if (match) {
            return parseFloat(match[1].replace(',', '.'));
        }
        return 0;
    }

    markAsCooked() {
        if (!this.recipe) return;
        const today = new Date().toISOString().split('T')[0];
        
        const cal = this.parseVal(this.recipe.nutrition.calories);
        const prot = this.parseVal(this.recipe.nutrition.protein);
        const carb = this.parseVal(this.recipe.nutrition.carbs);
        const fat = this.parseVal(this.recipe.nutrition.fat);
        const co2 = this.recipe.co2SavedKg || 0;

        const currentStat: DailyStat = this.stats[today] || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            co2Saved: 0,
            count: 0
        };

        this.stats = {
            ...this.stats,
            [today]: {
                calories: currentStat.calories + cal,
                protein: currentStat.protein + prot,
                carbs: currentStat.carbs + carb,
                fat: currentStat.fat + fat,
                co2Saved: currentStat.co2Saved + co2,
                count: currentStat.count + 1
            }
        };

        StorageService.setStats(this.stats);
        this.srAnnouncement = `Rezept "${this.recipe.title}" als gekocht markiert. Kalorien und CO2-Ersparnis wurden getrackt.`;
        alert("🎉 Rezept als gekocht markiert! Deine Ernährungs- und CO2-Statistiken wurden aktualisiert.");
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

    playAlarm() {
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        }
        this.showTimerExpiredModal = true;
        this.srAnnouncement = "Achtung! Die Koch-Zeit ist abgelaufen!";
        AudioService.playAlarm();
    }

    closeTimerExpiredModal() {
        this.showTimerExpiredModal = false;
        AudioService.stopAlarm();
        this.srAnnouncement = "Timer-Alarm beendet.";
    }

    override render() {
        if (this.showWelcomeScreen) {
            return html`
                <div class="app-wrapper ${this.isDarkMode ? 'dark-theme' : ''} ${this.isLrsMode ? 'lrs-theme' : ''}">
                    <div class="card" style="padding: 0;">
                        <eco-chef-welcome 
                            .isDarkMode="${this.isDarkMode}"
                            .isLrsMode="${this.isLrsMode}"
                            @toggle-dark-mode="${this.toggleDarkMode}"
                            @toggle-lrs-mode="${this.toggleLrsMode}"
                            @enter-app="${this.enterApp}">
                        </eco-chef-welcome>
                        
                        <eco-chef-gdpr-banner 
                            .hasConsent="${this.hasConsent}"
                            @accept-consent="${this.acceptConsent}"
                            @toggle-privacy="${this.togglePrivacyDetails}">
                        </eco-chef-gdpr-banner>
                        
                        <eco-chef-privacy-modal 
                            .showPrivacyDetails="${this.showPrivacyDetails}"
                            @close="${this.togglePrivacyDetails}">
                        </eco-chef-privacy-modal>
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

                  ${this.showSettings ? html`
                      <eco-chef-settings
                          .isLrsMode="${this.isLrsMode}"
                          .showReadingRuler="${this.showReadingRuler}"
                          .fontScale="${this.fontScale}"
                          .selectedPantry="${this.selectedPantry}"
                          .pantryItems="${this.pantryItems}"
                          .selectedAllergens="${this.selectedAllergens}"
                          .stats="${this.stats}"
                          .calorieGoal="${this.calorieGoal}"
                          .proteinGoal="${this.proteinGoal}"
                          .geminiApiKey="${this.geminiApiKey}"
                          @toggle-pantry-item="${(e: CustomEvent) => this.togglePantryItem(e.detail.item)}"
                          @toggle-allergen="${(e: CustomEvent) => this.toggleAllergen(e.detail.allergen)}"
                          @change-font-scale="${(e: CustomEvent) => this.changeFontScale(e.detail.delta)}"
                          @change-calorie-goal="${(e: CustomEvent) => this.changeCalorieGoal(e.detail.goal)}"
                          @change-protein-goal="${(e: CustomEvent) => this.changeProteinGoal(e.detail.goal)}"
                          @change-gemini-api-key="${(e: CustomEvent) => this.changeGeminiApiKey(e.detail.key)}"
                          @toggle-lrs-mode="${this.toggleLrsMode}"
                          @toggle-reading-ruler="${this.toggleReadingRuler}"
                          @toggle-privacy="${this.togglePrivacyDetails}"
                          @export-recipes="${this.exportRecipes}"
                          @import-recipes-success="${(e: CustomEvent) => this.importRecipesSuccess(e.detail.recipes)}"
                          @clear-all-data="${this.clearAllData}">
                      </eco-chef-settings>
                  ` : ''}

                  ${!this.recipe && !this.showSavedRecipes && !this.showShoppingList && !this.showSettings ? html`
                      <div class="input-with-camera">
                          <input type="text" id="ingredients-input" placeholder="Zutat eingeben & Enter drücken oder Foto 📷" .value="${this.ingredients}" @input="${this._handleInput}" @keypress="${this.handleIngredientsKeypress}" style="margin-bottom: 0;" aria-label="Zutaten eingeben" />
                          <input type="file" id="file-upload" accept="image/*" style="display: none;" @change="${this.handleFileUpload}" />
                          <button class="camera-btn" @click="${this.openCamera}" title="Kühlschrank scannen" aria-label="Kühlschrank scannen oder Foto hochladen">📸</button>
                      </div>

                      ${this.ingredientChips.length > 0 ? html`
                          <div class="ingredient-chips-container">
                              ${this.ingredientChips.map(chip => html`
                                  <div class="ingredient-chip ${this.urgentIngredients[chip] ? 'urgent' : ''}">
                                      <button class="urgent-btn" @click="${() => this.toggleUrgentIngredient(chip)}" title="${this.urgentIngredients[chip] ? 'Dringend verbrauchen deaktivieren' : 'Als dringend markieren'}">
                                          ${this.urgentIngredients[chip] ? '🚨' : '⚠️'}
                                      </button>
                                      <span>${chip}</span>
                                      <button class="remove-chip-btn" @click="${() => this.removeIngredientChip(chip)}" aria-label="${chip} entfernen">❌</button>
                                  </div>
                              `)}
                          </div>
                      ` : ''}

                      ${this.capturedImage ? html`
                          <div class="image-preview-box">
                              <img src="${this.capturedImage}" alt="Kühlschrank-Bild" />
                              <button class="remove-image-btn" @click="${() => this.capturedImage = null}">❌ Entfernen</button>
                          </div>
                      ` : ''}

                      <div class="filter-section" style="margin-top: 20px;">
                          <p class="filter-title">KI-Unterstützung:</p>
                          <div class="toggle-container">
                              <label class="toggle-switch" for="welcome-allow-extra">
                                  <input type="checkbox"
                                         id="welcome-allow-extra"
                                         .checked="${this.allowExtraIngredients}"
                                         @change="${(e: Event) => this.allowExtraIngredients = (e.target as HTMLInputElement).checked}"
                                         aria-label="KI darf Zutaten ergänzen">
                                  <span class="slider"></span>
                              </label>
                              <span class="toggle-label" style="color: ${this.allowExtraIngredients ? '#15803d' : '#d97706'};">
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
                      <eco-chef-shopping-list
                          .shoppingList="${this.shoppingList}"
                          @add-item="${(e: CustomEvent) => this.addManualShoppingItem(e.detail.name)}"
                          @toggle-item="${(e: CustomEvent) => this.toggleShoppingItem(e.detail.index)}"
                          @remove-item="${(e: CustomEvent) => this.removeShoppingItem(e.detail.index)}"
                          @clear-checked="${this.clearCheckedShoppingItems}"
                          @share-list="${this.shareShoppingList}">
                      </eco-chef-shopping-list>
                  ` : ''}

                  ${this.showSavedRecipes && !this.recipe ? html`
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

                          <div style="display: flex; gap: 10px; margin-top: 16px; margin-bottom: 16px;">
                              <input type="file" id="import-file" accept=".json" style="display: none;" @change="${this.handleImportFile}" />
                              <button class="secondary-btn" @click="${() => (this.shadowRoot?.querySelector('#import-file') as HTMLInputElement)?.click()}" style="border-color: #8b5cf6; color: #6d28d9;" aria-label="Rezepte aus JSON-Datei importieren">
                                  📂 Rezepte importieren (JSON)
                              </button>
                          </div>

                          ${this.savedRecipesList.length === 0 ? html`
                              <p class="empty-state">Du hast noch keine Rezepte gespeichert. Zaubere dein erstes Gericht!</p>
                          ` : html`
                              ${(() => {
                                  const filtered = this.getFilteredSavedRecipes();
                                  if (filtered.length === 0) {
                                      return html`<p class="empty-state">Keine Rezepte gefunden für "${this.searchQuery}"</p>`;
                                  }
                                  return html`
                                      <p class="subtitle" style="margin-bottom: 12px;">${filtered.length} von ${this.savedRecipesList.length} Rezept(en)</p>
                                      <div class="saved-list">
                                          ${filtered.map((item: any) => html`
                                              <div class="saved-card" @click="${() => this.openSavedRecipe(item)}">
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
                                                                      @click="${(e: Event) => this.updateSavedRecipeRating(this.savedRecipesList.indexOf(item), star, e)}"
                                                                      aria-label="${star} Sterne"
                                                              >${star <= (item.rating || 0) ? '⭐' : '☆'}</button>
                                                          `)}
                                                      </div>
                                                  </div>
                                                  <button class="delete-btn" @click="${(e: Event) => this.deleteSavedRecipe(this.savedRecipesList.indexOf(item), e)}" aria-label="${item.title} löschen">🗑️</button>
                                              </div>
                                          `)}
                                      </div>
                                  `;
                              })()}
                          `}
                      </div>
                  ` : ''}

                  ${this.recipe ? html`
                      <eco-chef-recipe-view
                          .recipe="${this.recipe}"
                          .recipeImage="${this.recipeImage}"
                          .isGeneratingImage="${this.isGeneratingImage}"
                          .persons="${this.persons}"
                          .currentRating="${this.currentRating}"
                          .isLoading="${this.isLoading}"
                          @add-to-shopping-list="${(e: CustomEvent) => this.addToShoppingList(e.detail.item)}"
                          @set-recipe-rating="${(e: CustomEvent) => this.setRecipeRating(e.detail.rating)}"
                          @mark-cooked="${this.markAsCooked}"
                          @start-cooking="${this.startCooking}"
                          @print-recipe="${this.printRecipe}"
                          @regenerate-recipe="${(e: CustomEvent) => {
                              this.additionalPrompt = e.detail.additionalPrompt;
                              this.askGoogle();
                          }}"
                          @update-recipe="${(e: CustomEvent) => {
                              if (this.recipe) {
                                  this.recipe = {
                                      ...this.recipe,
                                      ingredientsList: e.detail.ingredientsList,
                                      instructions: e.detail.instructions
                                  };
                              }
                          }}"
                          @close="${() => this.showExitDialog = true}">
                      </eco-chef-recipe-view>
                  ` : ''}
               </div>

               ${this.isCookingMode && this.recipe ? html`
                   <eco-chef-cooking-mode
                       .recipe="${this.recipe}"
                       .currentCookingStep="${this.currentCookingStep}"
                       .timerSecondsRemaining="${this.timerSecondsRemaining}"
                       .currentStepTimeMinutes="${this.currentStepTimeMinutes}"
                       .isVoiceControlActive="${this.isVoiceControlActive}"
                       .voiceStatusText="${this.voiceStatusText}"
                       @close="${this.exitCookingMode}"
                       @prev-step="${this.prevStep}"
                       @next-step="${this.nextStep}"
                       @read-step="${this.readCurrentStep}"
                       @toggle-voice="${this.toggleVoiceControl}"
                       @start-timer="${this.startTimer}"
                       @stop-timer="${this.stopTimer}">
                   </eco-chef-cooking-mode>
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
                                this.saveRecipeWithRating();
                                this.showExitDialog = false;
                            }}">💾 Speichern${this.currentRating ? ` (${this.currentRating}⭐)` : ''}
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

                <!-- Cookie/DSGVO Banner -->
                <eco-chef-gdpr-banner 
                    .hasConsent="${this.hasConsent}"
                    @accept-consent="${this.acceptConsent}"
                    @toggle-privacy="${this.togglePrivacyDetails}">
                </eco-chef-gdpr-banner>

                <eco-chef-privacy-modal 
                    .showPrivacyDetails="${this.showPrivacyDetails}"
                    @close="${this.togglePrivacyDetails}">
                </eco-chef-privacy-modal>

                <eco-chef-timer-expired-modal 
                    .showTimerExpiredModal="${this.showTimerExpiredModal}"
                    @close="${this.closeTimerExpiredModal}">
                </eco-chef-timer-expired-modal>

                <!-- Screen Reader Live Announcements -->
                <div class="sr-only" aria-live="polite" id="sr-announcements">
                    ${this.srAnnouncement}
                </div>

                <!-- Webcam/Kamera Modal für Webbrowser -->
                ${this.showWebcam ? html`
                    <div class="modal-overlay" style="z-index: 2100;">
                        <div class="modal-content" style="max-width: 500px; display: flex; flex-direction: column; align-items: center; border-radius: 24px; padding: 24px;">
                            <h3 style="margin-bottom: 16px;">📸 Kamera (Web)</h3>
                            <div style="position: relative; width: 100%; max-width: 400px; background: #000; border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; border: 2px solid var(--border);">
                                <video id="webcam-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                                <canvas id="webcam-canvas" style="display: none;"></canvas>
                            </div>
                            <div style="display: flex; gap: 12px; width: 100%; margin-top: 20px;">
                                <button class="main-btn" @click="${this.captureWebcam}" style="margin: 0; flex: 1;">Foto aufnehmen 📸</button>
                                <button class="secondary-btn" @click="${this.closeWebcam}" style="margin: 0; flex: 1;">Abbrechen</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    startCooking() {
        if (!this.recipe || this.recipe.instructions.length === 0) return;
        this.currentCookingStep = 0;
        this.isCookingMode = true;
        this.analyzeCurrentStep();
    }

    exitCookingMode() {
        this.isCookingMode = false;
        SpeechService.cancelSpeak();
    }

    nextStep() {
        if (this.recipe && this.currentCookingStep < this.recipe.instructions.length - 1) {
            this.currentCookingStep++;
            SpeechService.cancelSpeak();
            this.analyzeCurrentStep();
        }
    }

    prevStep() {
        if (this.currentCookingStep > 0) {
            this.currentCookingStep--;
            SpeechService.cancelSpeak();
            this.analyzeCurrentStep();
        }
    }

    readCurrentStep() {
        if (!this.recipe) return;
        this.srAnnouncement = `Lese Schritt vor.`;
        SpeechService.speak(this.recipe.instructions[this.currentCookingStep]);
    }

    private _handleInput(e: Event) {
        this.ingredients = (e.target as HTMLInputElement).value;
    }

    async askGoogle() {
        this.addIngredientFromInput();

        if (this.ingredientChips.length === 0 && !this.capturedImage) {
            alert("Bitte gib zuerst ein paar Zutaten ein oder mache ein Foto von deinem Kühlschrank!");
            return;
        }
        this.isLoading = true;
        this.recipe = null;
        this.recipeImage = null;
        this.srAnnouncement = "Rezept wird von der Künstlichen Intelligenz generiert. Bitte warten Sie einen moment.";

        const portions = this.persons || 2;
        const textIngredients = this.ingredientChips.join(', ');
        const pantryKeys = Object.keys(this.selectedPantry).filter(key => this.selectedPantry[key]);
        const pantryText = pantryKeys.length > 0 ? `\nGrundzutaten in der Vorratskammer (bereits vorhanden und nutzbar): ${pantryKeys.join(', ')}` : '';
        
        const urgentList = Object.keys(this.urgentIngredients).filter(k => this.urgentIngredients[k] && this.ingredientChips.includes(k));
        const urgentText = urgentList.length > 0 ? `\n🚨 DRINGEND ZU VERBRAUCHEN (diese Zutaten MÜSSEN zwingend im Rezept verwendet werden, um Lebensmittelverschwendung zu vermeiden): ${urgentList.join(', ')}` : '';
        
        const activeAllergens = Object.keys(this.selectedAllergens).filter(k => this.selectedAllergens[k]);
        const allergenText = activeAllergens.length > 0 ? `\n⚠️ ALLERGIE- & UNVERTRÄGLICHKEITS-EINSCHRÄNKUNGEN: Das Rezept MUSS absolut frei von folgenden Allergenen sein (entsprechende Zutaten ausschließen oder durch sichere Alternativen ersetzen): ${activeAllergens.join(', ')}` : '';
        
        const combinedIngredients = textIngredients + pantryText + urgentText + allergenText;

        const strictIngredientRule = this.allowExtraIngredients
            ? "- Zutaten: Du darfst das Rezept mit passenden, zusätzlichen Zutaten aufwerten (z.B. Gemüse, Beilagen, Saucen), damit es perfekt wird."
            : `- Zutaten-Regel (EXTREM WICHTIG): Du darfst AUSSCHLIESSLICH die exakt vom Nutzer angegebenen Zutaten oder auf dem Bild erkennbaren Zutaten verwenden.
               
               Füge KEINE EINZIGE weitere Hauptzutat zur Zutatenliste hinzu. Basis-Gewürze (Salz, Pfeffer) sowie Öl und Wasser sind okay.
               Sei kreativ und erfinde ein neues Gericht, das wirklich NUR aus diesen vorhandenen Zutaten besteht!`;

        const promptText = `
            Du bist ein professioneller Sternekoch und Ernährungsexperte. Der Nutzer schickt dir Zutaten als Text und/oder ein Foto seines Kühlschranks/seiner Zutaten.
            
            Text-Eingabe des Nutzers (inklusive eventueller Vorratskammer-Grundzutaten, Resteverwerter-Modus und Allergenen): ${combinedIngredients}
            
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
              "ecoScoreDetails": "Ausführliche, ansprechende Begründung des Eco-Scores (z.B. Saisonalität, CO2-Einsparung, regionale Zutaten)",
              "co2Footprint": "Niedrig, Mittel oder Hoch (Einschätzung des CO2-Fußabdrucks)",
              "co2SavedKg": 1.2, // geschätzte CO2-Ersparnis in kg gegenüber einem fleischbasierten Vergleichsgericht (als Zahl!)
              "beverage": "Kurze Empfehlung für ein passendes Getränk (Wein, Bier oder was Alkoholfreies)",
              "storageTip": "Kurzer Tipp zur Aufbewahrung oder Resteverwertung",
              "nutrition": { "calories": "z.B. 450 kcal", "protein": "z.B. 25g", "carbs": "z.B. 40g", "fat": "z.B. 15g" },
              "ingredientsList": [
                { "item": "Menge und Zutat, z.B. 250g Kirschtomaten", "category": "Kategorie aus: 'Obst & Gemüse', 'Milchprodukte & Eier', 'Fleisch & Fisch', 'Vorrat & Gewürze', 'Bäckerei', 'Sonstiges'" }
              ],
              "instructions": ["Schritt 1...", "Schritt 2..."],
              "tip": "Tipp..."
            }
        `;

        try {
            const text = await GeminiService.generateRecipe(this.capturedImage, promptText);
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
                    ecoScoreDetails: parsedData.ecoScoreDetails || "",
                    co2Footprint: parsedData.co2Footprint || "Mittel",
                    co2SavedKg: typeof parsedData.co2SavedKg === 'number' ? parsedData.co2SavedKg : parseFloat(parsedData.co2SavedKg) || 0,
                    beverage: parsedData.beverage || "Ein frisches Glas Wasser passt wunderbar.",
                    storageTip: parsedData.storageTip || "Am besten sofort genießen!",
                    nutrition: parsedData.nutrition || fallbackNutrition,
                    ingredientsList: Array.isArray(parsedData.ingredientsList) 
                        ? this.normalizeIngredients(parsedData.ingredientsList) 
                        : [{ item: "Zutaten konnten nicht geladen werden.", category: "Sonstiges" }],
                    instructions: Array.isArray(parsedData.instructions) ? parsedData.instructions : ["Zubereitung fehlt."],
                    tip: parsedData.tip || "Lass es dir schmecken!"
                };

                this.srAnnouncement = `Rezept erfolgreich geladen: ${this.recipe.title}. Bild wird generiert.`;
                window.scrollTo({ top: 0, behavior: 'smooth' });

                this.generateRecipeImage(this.recipe.title);

            } catch (parseError) {
                console.error("Fehler beim Auswerten der KI-Antwort:", parseError);
                alert("Upsi! Die KI hat das Rezept-Format etwas durcheinandergebracht. Bitte klicke nochmal auf 'Rezept Zaubern'!");
            }

        } catch (networkError: any) {
            console.error("API Verbindungsfehler:", networkError);
            alert("Es gab ein Problem mit der Verbindung zu Google: " + networkError.message);
        } finally {
            this.isLoading = false;
        }
    }

    startNewRecipe() {
        this.recipe = null;
        this.recipeImage = null;
        this.ingredients = '';
        this.ingredientChips = [];
        this.urgentIngredients = {};
        this.saveChips();
        this.capturedImage = null;
        this.showExitDialog = false;
        this.showSavedRecipes = false;
        this.showShoppingList = false;
        this.additionalPrompt = '';
        this.isCookingMode = false;
        SpeechService.cancelSpeak();
        this.stopTimer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                await navigator.share({ title: this.recipe.title, text: shareText });
            } catch (err) {
                console.error("Fehler beim Teilen", err);
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            alert("Rezept-Text in die Zwischenablage kopiert!");
        }
    }

    saveRecipeWithRating() {
        if (!this.recipe) return;
        const saved = StorageService.getSavedRecipes();
        const recipeToSave = {
            ...this.recipe,
            image: this.recipeImage || undefined,
            rating: this.currentRating || 0,
            savedAt: new Date().toISOString()
        };
        saved.push(recipeToSave);
        StorageService.setSavedRecipes(saved);
        alert(`✅ Rezept gespeichert${this.currentRating ? ` mit ${this.currentRating} ⭐` : ''}!`);
        this.srAnnouncement = `Rezept "${this.recipe.title}" wurde gespeichert.`;
    }

    toggleSavedView() {
        this.showSavedRecipes = !this.showSavedRecipes;
        if (this.showSavedRecipes) {
            this.showShoppingList = false;
            this.showSettings = false;
            const parsed = StorageService.getSavedRecipes();
            this.savedRecipesList = parsed.map((r: any) => ({
                ...r,
                ingredientsList: this.normalizeIngredients(r.ingredientsList)
            }));
            this.recipe = null;
        }
    }

    openSavedRecipe(savedRecipe: any) {
        this.recipe = {
            ...savedRecipe,
            ingredientsList: this.normalizeIngredients(savedRecipe.ingredientsList)
        };
        this.recipeImage = savedRecipe.image || null;
        this.showSavedRecipes = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteSavedRecipe(index: number, event: Event) {
        event.stopPropagation();
        this.savedRecipesList.splice(index, 1);
        StorageService.setSavedRecipes(this.savedRecipesList);
        this.requestUpdate();
    }

    updateSavedRecipeRating(index: number, rating: number, event: Event) {
        event.stopPropagation();
        if (this.savedRecipesList[index]) {
            this.savedRecipesList[index].rating = rating;
            StorageService.setSavedRecipes(this.savedRecipesList);
            this.requestUpdate();
            this.srAnnouncement = `Bewertung auf ${rating} Sterne aktualisiert.`;
        }
    }

    printRecipe() {
        if (!this.recipe) return;

        const printContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${this.recipe.title} - EcoChef Rezept</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a; }
        h1 { font-size: 28px; margin-bottom: 8px; color: #047857; }
        .meta { display: flex; gap: 16px; margin-bottom: 24px; font-size: 14px; color: #666; }
        .section-title { font-size: 18px; font-weight: 700; margin: 24px 0 12px; border-bottom: 2px solid #047857; padding-bottom: 4px; }
        .ingredients { list-style: disc; padding-left: 24px; }
        .ingredients li { margin-bottom: 6px; font-size: 15px; }
        .step { display: flex; gap: 12px; margin-bottom: 12px; }
        .step-num { background: #ecfdf5; color: #047857; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .step-text { font-size: 15px; line-height: 1.6; }
        .nutrition { display: flex; gap: 20px; margin-top: 12px; font-size: 14px; }
        .tip { background: #fffbeb; border: 1px solid #fde68a; padding: 12px 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
        .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <h1>${this.recipe.title}</h1>
    <div class="meta">
        <span>📊 ${this.recipe.difficulty}</span>
        <span>🕒 ${this.recipe.prepTime}</span>
        <span>🍽️ ${this.persons} Portionen</span>
        <span>🌍 Eco-Score: ${this.recipe.ecoScore}</span>
    </div>
    <div class="nutrition">
        <span>🔥 ${this.recipe.nutrition?.calories}</span>
        <span>🥩 ${this.recipe.nutrition?.protein} Protein</span>
        <span>🌾 ${this.recipe.nutrition?.carbs} KH</span>
        <span>🥑 ${this.recipe.nutrition?.fat} Fett</span>
    </div>
    <h2 class="section-title">🛒 Zutaten</h2>
    <ul class="ingredients">
        ${this.recipe.ingredientsList.map(i => `<li>${i.item}</li>`).join('')}
    </ul>
    <h2 class="section-title">🍳 Zubereitung</h2>
    ${this.recipe.instructions.map((step, i) => `
        <div class="step">
            <div class="step-num">${i + 1}</div>
            <div class="step-text">${step}</div>
        </div>
    `).join('')}
    <div class="tip">💡 <strong>Tipp:</strong> ${this.recipe.tip}</div>
    <p style="margin-top: 16px; font-size: 14px;">🍷 <strong>Getränke-Empfehlung:</strong> ${this.recipe.beverage}</p>
    <p style="margin-top: 8px; font-size: 14px;">🧊 <strong>Aufbewahrung:</strong> ${this.recipe.storageTip}</p>
    <div class="footer">Erstellt mit EcoChef 🧑‍🍳 — Dein KI-Rezept-Zauberer</div>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 300);
        }
        this.srAnnouncement = `Rezept "${this.recipe.title}" wird gedruckt.`;
    }

    handleImportFile(event: Event) {
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

                const existing = StorageService.getSavedRecipes();
                const merged = [...existing, ...imported.map((r: any) => ({
                    ...r,
                    ingredientsList: this.normalizeIngredients(r.ingredientsList),
                    importedAt: new Date().toISOString()
                }))];

                StorageService.setSavedRecipes(merged);
                this.savedRecipesList = merged;
                alert(`✅ ${imported.length} Rezept(e) erfolgreich importiert!`);
                this.srAnnouncement = `${imported.length} Rezepte importiert.`;
            } catch (err) {
                alert('❌ Fehler beim Importieren. Stelle sicher, dass es sich um eine gültige EcoChef-JSON-Datei handelt.');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    importRecipesSuccess(recipes: any[]) {
        const existing = StorageService.getSavedRecipes();
        const merged = [...existing, ...recipes.map((r: any) => ({
            ...r,
            ingredientsList: this.normalizeIngredients(r.ingredientsList),
            importedAt: new Date().toISOString()
        }))];

        StorageService.setSavedRecipes(merged);
        this.savedRecipesList = merged;
        alert(`✅ ${recipes.length} Rezept(e) erfolgreich importiert!`);
        this.srAnnouncement = `${recipes.length} Rezepte importiert.`;
    }

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
        StorageService.setPantry(this.selectedPantry);
        this.srAnnouncement = `${item} wurde in der Vorratskammer ${this.selectedPantry[item] ? 'aktiviert' : 'deaktiviert'}.`;
    }

    clearAllData() {
        if (confirm("Möchtest du wirklich alle lokalen Daten (gespeicherte Rezepte, Einkaufsliste, Einstellungen) löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
            StorageService.clearAll();
            this.srAnnouncement = "Alle Anwendungsdaten wurden gelöscht. Die App wird neu geladen.";
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }

    exportRecipes() {
        const saved = StorageService.getSavedRecipes();
        if (saved.length === 0) {
            alert("Du hast noch keine Rezepte gespeichert, die exportiert werden können.");
            return;
        }
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saved));
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
        StorageService.setLrsMode(this.isLrsMode);
        this.srAnnouncement = `Lese-Rechtschreib-Hilfe wurde ${this.isLrsMode ? 'eingeschaltet' : 'ausgeschaltet'}.`;
    }

    changeFontScale(delta: number) {
        this.fontScale = Math.min(2.0, Math.max(0.8, this.fontScale + delta));
        StorageService.setFontScale(this.fontScale);
        this.updateFontScaleStyle();
        this.srAnnouncement = `Schriftgröße geändert auf ${Math.round(this.fontScale * 100)} Prozent.`;
    }

    toggleReadingRuler() {
        this.showReadingRuler = !this.showReadingRuler;
        StorageService.setShowRuler(this.showReadingRuler);
        this.srAnnouncement = `Leselineal wurde ${this.showReadingRuler ? 'eingeschaltet' : 'ausgeschaltet'}.`;
    }

    changeCalorieGoal(goal: number) {
        this.calorieGoal = goal;
        StorageService.setCalorieGoal(goal);
    }

    changeProteinGoal(goal: number) {
        this.proteinGoal = goal;
        StorageService.setProteinGoal(goal);
    }

    changeGeminiApiKey(key: string) {
        this.geminiApiKey = key.trim();
        StorageService.setGeminiApiKey(this.geminiApiKey);
    }

    acceptConsent() {
        StorageService.setGdprConsent(true);
        this.hasConsent = true;
        this.srAnnouncement = "Datenschutzerklärung akzeptiert. Willkommen bei EcoChef!";
    }

    togglePrivacyDetails() {
        this.showPrivacyDetails = !this.showPrivacyDetails;
    }

    // Sprachsteuerung
    toggleVoiceControl() {
        if (this.isVoiceControlActive) {
            this.stopVoiceRecognition();
        } else {
            this.isVoiceControlActive = true;
            this.voiceStatusText = 'Hört zu...';
            SpeechService.startListening(
                (cmd) => this.handleVoiceCommand(cmd),
                (status) => { this.voiceStatusText = status; },
                () => { this.isVoiceControlActive = false; }
            );
            SpeechService.speak("Sprachsteuerung aktiv. Sag 'weiter' oder 'zurück', um durch die Schritte zu navigieren.");
            this.srAnnouncement = "Sprachsteuerung aktiviert. Das Mikrofon hört zu.";
        }
    }

    stopVoiceRecognition() {
        this.isVoiceControlActive = false;
        this.voiceStatusText = '';
        SpeechService.stopListening();
        this.srAnnouncement = "Sprachsteuerung deaktiviert.";
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
            SpeechService.cancelSpeak();
            this.stopTimer();
            if (this.showTimerExpiredModal) {
                this.closeTimerExpiredModal();
            }
            this.srAnnouncement = "Sprachausgabe und Timer gestoppt.";
        } else if (command.includes('hilfe') || command.includes('befehle')) {
            SpeechService.speak("Mögliche Befehle sind: weiter, zurück, vorlesen, stoppen und hilfe.");
        }
    }

    speakCurrentStep() {
        if (this.recipe) {
            SpeechService.speak(`Schritt ${this.currentCookingStep + 1}: ${this.recipe.instructions[this.currentCookingStep]}`);
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
        const onMouseMove = (moveEvent: MouseEvent) => {
            const cardElement = this.shadowRoot?.querySelector('.card');
            if (cardElement) {
                const rect = cardElement.getBoundingClientRect();
                const relativeY = moveEvent.clientY - rect.top;
                this.rulerY = Math.max(0, Math.min(rect.height - 32, relativeY));
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    getFilteredSavedRecipes() {
        if (!this.searchQuery.trim()) return this.savedRecipesList;
        const query = this.searchQuery.toLowerCase();
        return this.savedRecipesList.filter((r: any) =>
            r.title?.toLowerCase().includes(query) ||
            r.ingredientsList?.some((i: any) => i.item?.toLowerCase().includes(query))
        );
    }

    setRecipeRating(rating: number) {
        if (!this.recipe) return;
        this.currentRating = rating;
        this.srAnnouncement = `Rezept mit ${rating} von 5 Sternen bewertet.`;
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
            this.recipeImage = await GeminiService.generateRecipeImage(title);
        } catch (e) {
            console.error("Imagen failed", e);
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
}