import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Recipe, IngredientItem, ShoppingItem, DailyStat, PantryItemAdvanced, Achievement, MealPlan, getLocalDateString } from './models/eco-chef.models';
import { ecoChefStyles } from './styles/eco-chef.styles';

import { StorageService } from './services/storage.service';
import { AudioService } from './services/audio.service';
import { SpeechService } from './services/speech.service';
import { GeminiService } from './services/gemini.service';
import { BarcodeService } from './services/barcode.service';
import { QrService } from './services/qr.service';
import { PdfService } from './services/pdf.service';
import { BackupService } from './services/backup.service';
import { filterRecipes } from './services/recipe-filter';
import { SyncController, SyncData, SyncHost } from './controllers/sync.controller';
import { TimerController, TimerHost } from './controllers/timer.controller';
import { ShoppingListController, ShoppingListHost } from './controllers/shopping-list.controller';
import { CameraController, CameraHost } from './controllers/camera.controller';
import { VoiceController, VoiceHost } from './controllers/voice.controller';
import { AchievementsController } from './controllers/achievements.controller';
import { parseNumericValue, estimateCo2Fallback, parseStepMinutes } from './services/recipe-utils';
import { showToast, showConfirmToast } from './components/eco-chef-toast';

// Always-needed components loaded eagerly
import './components/eco-chef-welcome';
import './components/eco-chef-gdpr-banner';
import './components/eco-chef-privacy-modal';
import './components/eco-chef-timer-expired-modal';
import './components/eco-chef-toast';
// Tab-specific and recipe components are loaded lazily via _loadTabComponent()

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
    @state() recipeChatHistory: string[] = [];

    @state() isCookingMode = false;
    @state() currentCookingStep = 0;

    @state() currentStepTimeMinutes: number | null = null;

    @state() showShoppingList = false;

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


    @state() recipeImage: string | null = null;
    @state() isGeneratingImage = false;
    @state() showWelcomeScreen = true;

    @state() searchQuery = '';
    @state() currentRating = 0;
    @state() savedFilterRating = 0;

    @state() calorieGoal = 2000;
    @state() proteinGoal = 80;
    @state() geminiApiKey = '';
    @state() geminiKeySessionOnly = true;
    @state() selectedAvatar = '🧑‍🍳';
    @state() budgetSettings = StorageService.getBudgetSettings();
    @state() notificationsEnabled = StorageService.getNotificationsEnabled();
    @state() soundEffectsEnabled = StorageService.getSoundEffectsEnabled();
    @state() showQrModal = false;
    @state() qrSvgMarkup = '';
    @state() assistantAnswerText = '';

    @state() currentTab = 'zauberer';
    @state() pantryItemsAdvanced: PantryItemAdvanced[] = [];
    @state() mealPlan: MealPlan = {};
    @state() isGeneratingPlan = false;
    @state() isScanningReceipt = false;
    @state() isScanningProduct = false;
    @state() lastError: string | null = null;

    private readonly sync = new SyncController(this as unknown as SyncHost);
    readonly timers = new TimerController(this as unknown as TimerHost);
    readonly shopping = new ShoppingListController(this as unknown as ShoppingListHost);
    readonly camera = new CameraController(this as unknown as CameraHost);
    readonly voice = new VoiceController(this as unknown as VoiceHost);
    readonly achievements = new AchievementsController(this);

    get syncCode(): string {
        return this.sync.code;
    }

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
        this.shopping.load();
        this.selectedAllergens = StorageService.getAllergens();
        this.stats = StorageService.getStats();
        this.calorieGoal = StorageService.getCalorieGoal();
        this.proteinGoal = StorageService.getProteinGoal();
        this.geminiApiKey = StorageService.getGeminiApiKey();
        this.geminiKeySessionOnly = !this.geminiApiKey || StorageService.isGeminiKeySessionOnly();
        this.selectedAvatar = localStorage.getItem('ecoChef_selectedAvatar') || '🧑‍🍳';

        this.pantryItemsAdvanced = StorageService.getPantryAdvanced();
        this.mealPlan = StorageService.getMealPlan();
        
        this.achievements.load();
        
        this.loadChips();

        void this.sync.start();

        this.updateFontScaleStyle();
        this.updateBodyBackground();
    }

    override disconnectedCallback() {
        document.removeEventListener('backbutton', this.handleBackButton, false);
        SpeechService.cancelSpeak();
        this.timers.stop();
        AudioService.stopAlarm();
        super.disconnectedCallback();
    }

    handleBackButton = (e: Event) => {
        e.preventDefault();
        if (this.timers.showExpiredModal) {
            this.timers.closeExpiredModal();
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

    normalizeIngredients(ingredients: Array<IngredientItem | string> | undefined): IngredientItem[] {
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

    // Note: getGroupedShoppingList() is now the shared utility imported from eco-chef.models.ts

    markAsCooked() {
        if (!this.recipe) return;
        const today = getLocalDateString();
        
        const cal = parseNumericValue(this.recipe.nutrition.calories);
        const prot = parseNumericValue(this.recipe.nutrition.protein);
        const carb = parseNumericValue(this.recipe.nutrition.carbs);
        const fat = parseNumericValue(this.recipe.nutrition.fat);

        // Use AI-provided value; if missing or zero, estimate from eco-score + diet
        const co2 = (this.recipe.co2SavedKg && this.recipe.co2SavedKg > 0)
            ? this.recipe.co2SavedKg
            : estimateCo2Fallback(this.recipe.ecoScore, this.selectedDiet);

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
        this.updateAchievements();
        this.srAnnouncement = `Rezept "${this.recipe.title}" als gekocht markiert. Kalorien und CO2-Ersparnis wurden getrackt.`;
        showToast(`Rezept "${this.recipe.title}" als gekocht markiert! +${co2} kg CO₂ gespart 🌱`, 'success', { duration: 4500 });
    }

    analyzeCurrentStep() {
        if (!this.recipe) return;

        const stepText = this.recipe.instructions[this.currentCookingStep];
        this.currentStepTimeMinutes = parseStepMinutes(stepText);
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
                     
                     <h2>${this.selectedAvatar} EcoChef</h2>
                     <p class="subtitle">Dein KI-Rezept-Zauberer</p>
                     
                     <div class="header-actions">
                         <button class="saved-btn ${this.currentTab === 'zauberer' ? 'active' : ''}" @click="${() => this._switchTab('zauberer')}" aria-label="Rezept-Generator">
                             ✨ Zauberer
                         </button>
                         <button class="saved-btn ${this.currentTab === 'pantry' ? 'active' : ''}" @click="${() => this._switchTab('pantry')}" aria-label="Vorratskammer">
                             🥫 Vorrat
                         </button>
                         <button class="saved-btn ${this.currentTab === 'mealplan' ? 'active' : ''}" @click="${() => this._switchTab('mealplan')}" aria-label="Wochenplan">
                             📅 Wochenplan
                         </button>
                         <button class="saved-btn ${this.currentTab === 'shopping' ? 'active' : ''}" @click="${() => this._switchTab('shopping')}" aria-label="Einkaufsliste">
                             🛒 Einkäufe
                         </button>
                         <button class="saved-btn ${this.currentTab === 'regional' ? 'active' : ''}" @click="${() => this._switchTab('regional')}" aria-label="Wochenmärkte">
                             🌾 Regio Markt
                         </button>
                         <button class="saved-btn ${this.currentTab === 'achievements' ? 'active' : ''}" @click="${() => this._switchTab('achievements')}" aria-label="Erfolge">
                             🏆 Erfolge
                         </button>
                         <button class="saved-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" @click="${() => this._switchTab('dashboard')}" aria-label="Analytics Dashboard">
                             📊 Analytics
                         </button>
                         <button class="saved-btn ${this.currentTab === 'settings' ? 'active' : ''}" @click="${() => this._switchTab('settings')}" aria-label="Einstellungen">
                             ⚙️ Setup
                         </button>
                     </div>
                  </div>

                  ${this.currentTab === 'settings' && !this._loadedTabs.has('settings') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'settings' && this._loadedTabs.has('settings') ? html`
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
                          .budgetSettings="${this.budgetSettings}"
                          .notificationsEnabled="${this.notificationsEnabled}"
                          .soundEffectsEnabled="${this.soundEffectsEnabled}"
                          .geminiApiKey="${this.geminiApiKey}"
                          .geminiKeySessionOnly="${this.geminiKeySessionOnly}"
                          .syncCode="${this.syncCode}"
                          .selectedAvatar="${this.selectedAvatar}"
                          @toggle-sound-effects="${(e: CustomEvent) => this.toggleSoundEffects(e.detail.enabled)}"
                          @toggle-pantry-item="${(e: CustomEvent) => this.togglePantryItem(e.detail.item)}"
                          @toggle-allergen="${(e: CustomEvent) => this.toggleAllergen(e.detail.allergen)}"
                          @change-font-scale="${(e: CustomEvent) => this.changeFontScale(e.detail.delta)}"
                          @change-calorie-goal="${(e: CustomEvent) => this.changeCalorieGoal(e.detail.goal)}"
                          @change-protein-goal="${(e: CustomEvent) => this.changeProteinGoal(e.detail.goal)}"
                          @change-monthly-budget="${(e: CustomEvent) => {
                              this.budgetSettings = { ...this.budgetSettings, monthlyBudget: e.detail.budget };
                              StorageService.setBudgetSettings(this.budgetSettings);
                          }}"
                          @toggle-notifications="${(e: CustomEvent) => {
                              this.notificationsEnabled = e.detail.enabled;
                              StorageService.setNotificationsEnabled(this.notificationsEnabled);
                          }}"
                          @change-gemini-api-key="${(e: CustomEvent) => this.changeGeminiApiKey(e.detail.key, e.detail.sessionOnly)}"
                          @change-avatar="${(e: CustomEvent) => {
                              this.selectedAvatar = e.detail.avatar;
                              localStorage.setItem('ecoChef_selectedAvatar', e.detail.avatar);
                              this.autoSyncPush();
                          }}"
                          @generate-sync-code="${() => this.sync.generate()}"
                          @apply-sync-code="${(e: CustomEvent) => this.sync.connect(e.detail.code)}"
                          @toggle-lrs-mode="${this.toggleLrsMode}"
                          @toggle-reading-ruler="${this.toggleReadingRuler}"
                          @toggle-privacy="${this.togglePrivacyDetails}"
                          @export-recipes="${this.exportRecipes}"
                          @export-full-backup="${this.exportFullBackup}"
                          @import-full-backup="${(e: CustomEvent) => this.importFullBackup(e.detail.data)}"
                          @import-recipes-success="${(e: CustomEvent) => this.importRecipesSuccess(e.detail.recipes)}"
                          @clear-all-data="${this.clearAllData}">
                      </eco-chef-settings>
                  ` : ''}

                  ${this.currentTab === 'pantry' && !this._loadedTabs.has('pantry') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'pantry' && this._loadedTabs.has('pantry') ? html`
                      <eco-chef-pantry
                          .pantryItems="${this.pantryItemsAdvanced}"
                          .isScanning="${this.isLoading && (this.isScanningReceipt || this.isScanningProduct)}"
                          @add-pantry-item="${this.handleAddPantryItem}"
                          @delete-pantry-item="${this.handleDeletePantryItem}"
                          @use-pantry-item="${this.handleUsePantryItem}"
                          @add-seasonal-ingredient="${this.handleSeasonalIngredient}"
                          @search-barcode="${(e: CustomEvent) => this.handleBarcodeSearch(e.detail.barcode)}"
                          @trigger-receipt-scan="${this.handleTriggerReceiptScan}"
                          @trigger-product-scan="${this.handleTriggerProductScan}"
                          @trigger-mystery-box="${this.triggerMysteryBox}">
                      </eco-chef-pantry>
                  ` : ''}

                  ${this.currentTab === 'dashboard' && !this._loadedTabs.has('dashboard') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'dashboard' && this._loadedTabs.has('dashboard') ? html`
                      <eco-chef-dashboard
                          .stats="${this.stats}"
                          .calorieGoal="${this.calorieGoal}"
                          .proteinGoal="${this.proteinGoal}">
                      </eco-chef-dashboard>
                  ` : ''}

                  ${this.currentTab === 'regional' && !this._loadedTabs.has('regional') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'regional' && this._loadedTabs.has('regional') ? html`
                      <eco-chef-regional-map
                          @add-shopping-item="${(e: CustomEvent) => this.shopping.addManual(e.detail.name)}">
                      </eco-chef-regional-map>
                  ` : ''}

                  ${this.currentTab === 'mealplan' && !this._loadedTabs.has('mealplan') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'mealplan' && this._loadedTabs.has('mealplan') ? html`
                      <eco-chef-meal-planner
                          .mealPlan="${this.mealPlan}"
                          .isGeneratingPlan="${this.isGeneratingPlan}"
                          @generate-weekly-plan="${this.handleGenerateWeeklyPlan}"
                          @cook-plan-recipe="${this.handleCookPlanRecipe}"
                          @add-plan-shopping="${this.handleAddPlanShopping}">
                      </eco-chef-meal-planner>
                  ` : ''}

                  ${this.currentTab === 'achievements' && !this._loadedTabs.has('achievements') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'achievements' && this._loadedTabs.has('achievements') ? html`
                      <eco-chef-achievements
                          .achievements="${this.achievements.list}"
                          .stats="${this.stats}">
                      </eco-chef-achievements>
                  ` : ''}

                  ${this.currentTab === 'zauberer' && !this.recipe && !this.showSavedRecipes ? html`
                      ${(() => {
                          if (!this.notificationsEnabled) return '';
                          const expiring = this.pantryItemsAdvanced.filter(item => {
                              if (!item.expiryDate) return false;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const exp = new Date(item.expiryDate);
                              exp.setHours(0, 0, 0, 0);
                              const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              return diffDays >= 0 && diffDays <= 2;
                          });

                          if (expiring.length === 0) return '';
                          const names = expiring.map(i => i.name);
                          return html`
                              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 18px; padding: 14px 18px; margin-bottom: 20px; color: #92400e; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); gap: 10px;">
                                  <div>
                                      <strong style="font-size: 13px;">🚨 MHD-Warnung: ${expiring.length} Zutat(en) laufen bald ab!</strong>
                                      <div style="font-size: 12px; margin-top: 2px; font-weight: 600;">${names.join(', ')}</div>
                                  </div>
                                  <button class="main-btn" @click="${() => {
                                      names.forEach(name => {
                                          if (!this.ingredientChips.includes(name)) {
                                              this.ingredientChips = [...this.ingredientChips, name];
                                              this.urgentIngredients[name] = true;
                                          }
                                      });
                                      this.saveChips();
                                  }}" style="width: auto; padding: 8px 14px; font-size: 12px; margin: 0; background: #d97706; color: white; white-space: nowrap;">
                                      🪄 Verkochen
                                  </button>
                              </div>
                          `;
                      })()}

                      <div class="input-with-camera">
                          <input type="text" id="ingredients-input" placeholder="Zutat eingeben & Enter drücken oder Foto 📷" .value="${this.ingredients}" @input="${this._handleInput}" @keypress="${this.handleIngredientsKeypress}" style="margin-bottom: 0;" aria-label="Zutaten eingeben" />
                          <button class="camera-btn" @click="${this.camera.open}" title="Kühlschrank scannen" aria-label="Kühlschrank scannen oder Foto hochladen">📸</button>
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

                      <div style="margin-top: 24px; text-align: center;">
                          <button class="saved-btn" @click="${this.toggleSavedView}" style="width: 100%; max-width: 300px;">
                              📚 Meine Rezepte anzeigen
                          </button>
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

                  ${this.currentTab === 'shopping' && !this._loadedTabs.has('shopping') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'shopping' && this._loadedTabs.has('shopping') ? html`
                      <eco-chef-shopping-list
                          .shoppingList="${this.shopping.items}"
                          .budgetSettings="${this.budgetSettings}"
                          @add-item="${(e: CustomEvent) => this.shopping.addManual(e.detail.name)}"
                          @toggle-item="${(e: CustomEvent) => this.shopping.toggle(e.detail.index)}"
                          @remove-item="${(e: CustomEvent) => this.shopping.remove(e.detail.index)}"
                          @clear-checked="${this.shopping.clearChecked}"
                          @transfer-to-pantry="${this.transferShoppingToPantry}"
                          @share-list="${this.shopping.share}">
                      </eco-chef-shopping-list>
                  ` : ''}

                  ${this.currentTab === 'zauberer' && this.showSavedRecipes && !this.recipe ? html`
                      <eco-chef-saved-recipes
                          .savedRecipesList="${this.savedRecipesList}"
                          @open-recipe="${(e: CustomEvent) => this.openSavedRecipe(e.detail.recipe)}"
                          @delete-recipe="${(e: CustomEvent) => this.deleteSavedRecipe(e.detail.index, e)}"
                          @update-rating="${(e: CustomEvent) => this.updateSavedRecipeRating(e.detail.index, e.detail.rating, e)}"
                          @import-recipes="${(e: CustomEvent) => this.importRecipesSuccess(e.detail.recipes)}"
                          @export-pdf="${this.exportCookbookPdf}"
                          @back-to-generator="${() => this.showSavedRecipes = false}">
                      </eco-chef-saved-recipes>
                  ` : ''}

                  ${this.currentTab === 'zauberer' && this.recipe && !this._loadedTabs.has('recipe-view') ? html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>` : ''}
                  ${this.currentTab === 'zauberer' && this.recipe && this._loadedTabs.has('recipe-view') ? html`
                      <eco-chef-recipe-view
                          .recipe="${this.recipe}"
                          .recipeImage="${this.recipeImage}"
                          .isGeneratingImage="${this.isGeneratingImage}"
                          .persons="${this.persons}"
                          .currentRating="${this.currentRating}"
                          .isLoading="${this.isLoading}"
                          .pantryItems="${this.pantryItemsAdvanced}"
                          .chatHistory="${this.recipeChatHistory}"
                          @add-to-shopping-list="${(e: CustomEvent) => this.shopping.add(e.detail.item)}"
                          @set-recipe-rating="${(e: CustomEvent) => this.setRecipeRating(e.detail.rating)}"
                          @change-portions="${(e: CustomEvent) => this.handlePortionChange(e.detail.persons)}"
                          @mark-cooked="${this.markAsCooked}"
                          @start-cooking="${this.startCooking}"
                          @print-recipe="${this.printRecipe}"
                          @regenerate-recipe="${(e: CustomEvent) => {
                              this.additionalPrompt = e.detail.additionalPrompt;
                              if (this.additionalPrompt.trim()) {
                                  this.recipeChatHistory = [...this.recipeChatHistory, this.additionalPrompt];
                              }
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
                          @close="${() => {
                              this.recipeChatHistory = [];
                              this.showExitDialog = true;
                          }}">
                      </eco-chef-recipe-view>
                  ` : ''}
               </div>

               ${this.isCookingMode && this.recipe && this._loadedTabs.has('cooking-mode') ? html`
                   <eco-chef-cooking-mode
                       .recipe="${this.recipe}"
                       .currentCookingStep="${this.currentCookingStep}"
                       .timerSecondsRemaining="${this.timers.secondsRemaining}"
                       .currentStepTimeMinutes="${this.currentStepTimeMinutes}"
                       .isVoiceControlActive="${this.voice.isActive}"
                       .voiceStatusText="${this.voice.statusText}"
                       .activeTimers="${this.timers.activeTimers}"
                       .assistantAnswer="${this.assistantAnswerText}"
                       @close="${this.exitCookingMode}"
                       @prev-step="${this.prevStep}"
                       @next-step="${this.nextStep}"
                       @read-step="${this.readCurrentStep}"
                       @toggle-voice="${this.voice.toggle}"
                       @start-timer="${this.timers.start}"
                       @stop-timer="${(e: CustomEvent) => this.timers.stop(e.detail?.id)}"
                       @ask-cooking-assistant="${this.handleAskCookingAssistant}">
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
                           <button class="modal-btn new" @click="${this.openQrModal}" style="background: #8b5cf6; color: white;">📱 QR-Code anzeigen</button>
                           <button class="modal-btn new" @click="${this.startNewRecipe}">🔄 Neues Rezept laden</button>
                           <button class="modal-btn exit" @click="${this.exitApp}">❌ App verlassen</button>
                           <button class="modal-btn cancel" @click="${() => this.showExitDialog = false}">Zurück zum Rezept</button>
                        </div>
                    </div>
                ` : ''}

                <!-- QR-Code Modal -->
                ${this.showQrModal ? html`
                    <div class="modal-overlay" style="z-index: 2200;">
                        <div class="modal-content" style="max-width: 400px; display: flex; flex-direction: column; align-items: center; border-radius: 24px; padding: 24px; text-align: center;">
                            <h3 style="margin-bottom: 12px; color: var(--text-dark);">📱 Rezept per QR-Code teilen</h3>
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Scanne diesen QR-Code mit einem anderen Smartphone, um das Rezept zu übertragen.</p>
                            
                            <div style="margin-bottom: 20px;" .innerHTML="${this.qrSvgMarkup}"></div>
                            
                            <button class="main-btn" @click="${() => this.showQrModal = false}" style="width: 100%;">
                                Schließen
                            </button>
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
                    .showTimerExpiredModal="${this.timers.showExpiredModal}"
                    .timerLabel="${this.timers.expiredLabel}"
                    @close="${this.timers.closeExpiredModal}">
                </eco-chef-timer-expired-modal>

                <!-- Screen Reader Live Announcements & Global File Upload Input -->
                <input type="file" id="file-upload" accept="image/*" style="display: none;" @change="${this.camera.handleFileUpload}" />
                <div class="sr-only" aria-live="polite" id="sr-announcements">
                    ${this.srAnnouncement}
                </div>

                <!-- Floating Persistent Mini Timer Widget -->
                ${this.timers.activeTimers.length > 0 && !this.isCookingMode ? html`
                    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #0f172a; color: white; border: 2px solid #10b981; border-radius: 20px; padding: 12px 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px; font-family: inherit;">
                        <span style="font-size: 20px;">⏱️</span>
                        <div>
                            <div style="font-size: 13px; font-weight: 800; color: #10b981;">
                                ${this.timers.activeTimers[0].label}
                            </div>
                            <div style="font-size: 16px; font-weight: 900; font-family: monospace;">
                                ${Math.floor(this.timers.activeTimers[0].secondsRemaining / 60)}:${(this.timers.activeTimers[0].secondsRemaining % 60).toString().padStart(2, '0')}
                                ${this.timers.activeTimers.length > 1 ? `(+${this.timers.activeTimers.length - 1} weitere)` : ''}
                            </div>
                        </div>
                        <button @click="${() => this.timers.togglePause(this.timers.activeTimers[0].id)}" style="background: #334155; color: white; border: none; border-radius: 10px; width: 32px; height: 32px; font-size: 14px; cursor: pointer;">
                            ${this.timers.activeTimers[0].isPaused ? '▶️' : '⏸️'}
                        </button>
                        <button @click="${() => this.timers.start(1, this.timers.activeTimers[0].label)}" style="background: #059669; color: white; border: none; border-radius: 10px; padding: 6px 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
                            +1 Min
                        </button>
                        <button @click="${() => this.isCookingMode = true}" style="background: #10b981; color: white; border: none; border-radius: 10px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer;">
                            Kochmodus 🍳
                        </button>
                    </div>
                ` : ''}

                <!-- Webcam/Kamera Modal für Webbrowser -->
                ${this.camera.showWebcam ? html`
                    <div class="modal-overlay" style="z-index: 2100;">
                        <div class="modal-content" style="max-width: 500px; display: flex; flex-direction: column; align-items: center; border-radius: 24px; padding: 24px;">
                            <h3 style="margin-bottom: 16px;">📸 Kamera (Web)</h3>
                            <div style="position: relative; width: 100%; max-width: 400px; background: #000; border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; border: 2px solid var(--border);">
                                <video id="webcam-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                                <canvas id="webcam-canvas" style="display: none;"></canvas>
                            </div>
                            <div style="display: flex; gap: 12px; width: 100%; margin-top: 20px;">
                                <button class="main-btn" @click="${this.camera.capture}" style="margin: 0; flex: 1;">Foto aufnehmen 📸</button>
                                <button class="secondary-btn" @click="${this.camera.close}" style="margin: 0; flex: 1;">Abbrechen</button>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Global Toast / Snackbar Notification System -->
                <eco-chef-toast></eco-chef-toast>

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
            showToast('Bitte gib zuerst Zutaten ein oder mache ein Foto deines Kühlschranks!', 'warning');
            return;
        }

        // Preload recipe-view and cooking-mode while Gemini generates the recipe
        void this._loadTabComponent('recipe-view');
        void this._loadTabComponent('cooking-mode');

        this.isLoading = true;
        this.lastError = null;
        this.recipe = null;
        this.recipeImage = null;
        this.srAnnouncement = "Rezept wird von der Künstlichen Intelligenz generiert. Bitte warten Sie einen moment.";

        try {
            const urgentList = Object.keys(this.urgentIngredients).filter(k => this.urgentIngredients[k] && this.ingredientChips.includes(k));
            const activeAllergens = Object.keys(this.selectedAllergens).filter(k => this.selectedAllergens[k]);
            const pantryKeys = Object.keys(this.selectedPantry).filter(key => this.selectedPantry[key]);

            this.recipe = await GeminiService.generateRecipeFromOptions({
                ingredientChips: this.ingredientChips,
                pantryKeys,
                urgentIngredients: urgentList,
                activeAllergens,
                allowExtraIngredients: this.allowExtraIngredients,
                diet: this.selectedDiet,
                effort: this.selectedEffort,
                portions: this.persons || 2,
                chatHistory: this.recipeChatHistory,
                capturedImage: this.capturedImage
            });

            this.srAnnouncement = `Rezept erfolgreich geladen: ${this.recipe.title}. Bild wird generiert.`;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            this.generateRecipeImage(this.recipe.title);

        } catch (networkError: unknown) {
            console.error("API Verbindungsfehler:", networkError);
            const errMsg: string = networkError instanceof Error ? networkError.message : '';
            let userMsg = 'Verbindungsfehler – bitte Internetverbindung prüfen.';
            if (errMsg.includes('API_KEY') || errMsg.includes('403')) {
                userMsg = 'Ungültiger API-Key. Bitte in den Einstellungen prüfen.';
            } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
                userMsg = 'API-Limit erreicht. Bitte kurz warten und dann erneut versuchen.';
            } else if (errMsg.includes('timeout') || errMsg.includes('DEADLINE')) {
                userMsg = 'Zeitüberschreitung – die KI hat zu lange gebraucht. Bitte nochmal versuchen.';
            } else if (errMsg.includes('JSON') || errMsg.includes('Rezeptdaten')) {
                userMsg = 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es nochmal!';
            }
            this.lastError = userMsg;
            showToast(userMsg, 'error', { duration: 5000 });
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
        this.recipeChatHistory = [];
        this.isCookingMode = false;
        SpeechService.cancelSpeak();
        this.timers.stop();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    exitApp() {
        if (navigator.app) {
            navigator.app.exitApp();
        } else {
            showToast('App beenden funktioniert nur auf dem echten Gerät!', 'info');
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
            showToast('Rezept-Text in die Zwischenablage kopiert!', 'success');
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
        showToast(`Rezept gespeichert${this.currentRating ? ` mit ${this.currentRating} ⭐` : ''}!`, 'success');
        this.srAnnouncement = `Rezept "${this.recipe.title}" wurde gespeichert.`;
    }

    toggleSavedView() {
        this.showSavedRecipes = !this.showSavedRecipes;
        if (this.showSavedRecipes) {
            void this._loadTabComponent('saved-recipes');
            this.showShoppingList = false;
            this.showSettings = false;
            const parsed = StorageService.getSavedRecipes();
            this.savedRecipesList = parsed.map((r) => ({
                ...r,
                ingredientsList: this.normalizeIngredients(r.ingredientsList)
            }));
            this.recipe = null;
        }
    }

    openSavedRecipe(savedRecipe: Recipe) {
        this.recipe = {
            ...savedRecipe,
            co2SavedKg: typeof savedRecipe.co2SavedKg === 'number' ? savedRecipe.co2SavedKg : (parseFloat(String(savedRecipe.co2SavedKg)) || 0),
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

            if (rating === 5) {
                this.achievements.increment('sterneChef');
            }

            this.srAnnouncement = `Bewertung auf ${rating} Sterne aktualisiert.`;
        }
    }

    printRecipe() {
        if (!this.recipe) return;
        PdfService.printCookbook([this.recipe], this.selectedAvatar);
        this.srAnnouncement = `Rezept "${this.recipe.title}" wird gedruckt.`;
    }

    handleImportFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.importRecipesSuccess(JSON.parse(e.target?.result as string));
            } catch (err) {
                showToast('Fehler beim Importieren. Stelle sicher, dass es eine gültige EcoChef-JSON-Datei ist.', 'error');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    importRecipesSuccess(raw: unknown) {
        const parsed = BackupService.parseRecipeImport(raw);
        if (!parsed || parsed.recipes.length === 0) {
            showToast('Keine gültigen Rezepte in der Datei gefunden.', 'error');
            return;
        }
        const merged = BackupService.mergeImportedRecipes(StorageService.getSavedRecipes(), parsed.recipes);
        StorageService.setSavedRecipes(merged);
        this.savedRecipesList = merged;
        const skippedHint = parsed.skipped > 0 ? ` (${parsed.skipped} ungültige übersprungen)` : '';
        showToast(`${parsed.recipes.length} Rezept(e) erfolgreich importiert!${skippedHint}`, 'success');
        this.srAnnouncement = `${parsed.recipes.length} Rezepte importiert.`;
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
        showConfirmToast(
            'Alle lokalen Daten (Rezepte, Einkaufsliste, Einstellungen) wirklich löschen? Diese Aktion ist unwiderruflich!',
            '🗑️ Alles löschen',
            'Abbrechen'
        ).then(confirmed => {
            if (!confirmed) return;
            StorageService.clearAll();
            this.srAnnouncement = "Alle Anwendungsdaten wurden gelöscht. Die App wird neu geladen.";
            showToast('Alle Daten gelöscht. App wird neu geladen...', 'warning', { duration: 2500 });
            setTimeout(() => {
                location.reload();
            }, 2500);
        });
    }

    exportRecipes() {
        const saved = StorageService.getSavedRecipes();
        if (saved.length === 0) {
            showToast('Du hast noch keine Rezepte gespeichert.', 'warning');
            return;
        }
        BackupService.downloadJson('ecoChef_rezepte.json', saved);
        this.srAnnouncement = "Deine Rezepte wurden als Datei heruntergeladen.";
    }

    transferShoppingToPantry() {
        const checkedItems = this.shopping.checkedItems();
        if (checkedItems.length === 0) return;

        const todayStr = getLocalDateString();
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 7);
        const expiryStr = getLocalDateString(defaultExpiry);

        let addedCount = 0;
        const updatedPantry = [...this.pantryItemsAdvanced];

        checkedItems.forEach(cItem => {
            const exists = updatedPantry.some(p => p.name.toLowerCase() === cItem.name.toLowerCase());
            if (!exists) {
                updatedPantry.push({
                    name: cItem.name,
                    active: true,
                    addedDate: todayStr,
                    expiryDate: expiryStr,
                    quantity: 1,
                    unit: 'Stk.',
                    location: 'Kühlschrank'
                });
                addedCount++;
            }
        });

        this.pantryItemsAdvanced = updatedPantry;
        StorageService.setPantryAdvanced(this.pantryItemsAdvanced);

        this.shopping.clearChecked();

        showToast(`${addedCount} Zutat(en) in die Reste-Kammer übernommen!`, 'success');
        this.srAnnouncement = `${addedCount} Zutaten in Reste-Kammer übernommen.`;
        this.autoSyncPush();
    }

    handlePortionChange(newPersons: number) {
        if (!this.recipe || newPersons === this.persons || newPersons < 1) return;
        const ratio = newPersons / this.persons;
        const oldPersons = this.persons;
        this.persons = newPersons;

        const scaledIngredients = this.recipe.ingredientsList.map(ing => {
            const scaledItemStr = ing.item.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
                const val = parseFloat(match.replace(',', '.'));
                if (isNaN(val)) return match;
                const scaled = val * ratio;
                return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1).replace('.', ',');
            });
            return {
                ...ing,
                item: scaledItemStr
            };
        });

        const scaleNutrVal = (strVal: string | undefined) => {
            if (!strVal) return strVal || '?';
            return strVal.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
                const val = parseFloat(match.replace(',', '.'));
                if (isNaN(val)) return match;
                const scaled = val * ratio;
                return Math.round(scaled).toString();
            });
        };

        this.recipe = {
            ...this.recipe,
            nutrition: {
                calories: scaleNutrVal(this.recipe.nutrition?.calories),
                protein: scaleNutrVal(this.recipe.nutrition?.protein),
                carbs: scaleNutrVal(this.recipe.nutrition?.carbs),
                fat: scaleNutrVal(this.recipe.nutrition?.fat),
            },
            ingredientsList: scaledIngredients
        };

        this.srAnnouncement = `Portionsmenge von ${oldPersons} auf ${newPersons} Personen angepasst.`;
    }

    exportFullBackup() {
        BackupService.downloadJson(BackupService.backupFilename(), BackupService.createBackup(), true);
        this.srAnnouncement = "Vollständiges EcoChef-Backup heruntergeladen.";
    }

    async handleBarcodeSearch(barcode: string) {
        this.isLoading = true;
        this.srAnnouncement = "Barcode wird abgefragt...";
        const res = await BarcodeService.fetchProductByBarcode(barcode);
        this.isLoading = false;

        if (res.found) {
            const newItem = BarcodeService.createPantryItemFromBarcode(res, barcode);
            this.pantryItemsAdvanced = [...this.pantryItemsAdvanced, newItem];
            StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
            showToast(`"${res.name}" erfolgreich per Barcode hinzugefügt!`, 'success');
            this.srAnnouncement = `${res.name} aus Barcode hinzugefügt.`;
            this.autoSyncPush();
        } else {
            showToast(res.rawMessage || 'Produkt nicht gefunden.', 'error');
        }
    }

    openQrModal() {
        if (!this.recipe) return;
        const payloadStr = QrService.encodeRecipePayload(this.recipe);
        this.qrSvgMarkup = QrService.generateQrSvgMarkup(payloadStr);
        this.showQrModal = true;
    }

    importFullBackup(raw: unknown) {
        const payload = BackupService.parseBackup(raw);
        if (!payload) {
            showToast('Ungültiges Backup-Format.', 'error');
            return;
        }

        try {
            if (payload.savedRecipes) {
                StorageService.setSavedRecipes(payload.savedRecipes as Recipe[]);
                this.savedRecipesList = payload.savedRecipes as Recipe[];
            }
            this.applySyncData({
                pantryItemsAdvanced: payload.pantryItemsAdvanced as PantryItemAdvanced[] | undefined,
                shoppingList: payload.shoppingList as ShoppingItem[] | undefined,
                stats: payload.stats,
                urgentIngredients: payload.urgentIngredients,
                achievementsList: payload.achievements as Achievement[] | undefined,
                ingredientChips: payload.ingredientChips
            });

            showToast('EcoChef-Backup erfolgreich wiederhergestellt!', 'success', { duration: 4500 });
            this.srAnnouncement = "Gesamtdaten erfolgreich importiert.";
            this.requestUpdate();
            this.autoSyncPush();
        } catch (e) {
            console.error("Failed to restore full backup", e);
            showToast('Fehler beim Wiederherstellen des Backups.', 'error');
        }
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

    changeGeminiApiKey(key: string, sessionOnly = true) {
        this.geminiApiKey = key.trim();
        this.geminiKeySessionOnly = sessionOnly;
        StorageService.setGeminiApiKey(this.geminiApiKey, sessionOnly);
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
    hasStepDuration(): boolean {
        return !!this.currentStepTimeMinutes;
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
        return filterRecipes(this.savedRecipesList, this.savedFilterRating, this.searchQuery);
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

    override updated(changedProperties: Map<string | number | symbol, unknown>) {
        super.updated(changedProperties);
        if (changedProperties.has('capturedImage') && this.capturedImage) {
            if (this.isScanningReceipt) {
                this.processReceipt();
            } else if (this.isScanningProduct) {
                this.processProductScan();
            }
        }
    }

    handleAddPantryItem(e: CustomEvent) {
        const { name, expiryDate, quantity, unit, location } = e.detail;
        const exists = this.pantryItemsAdvanced.some(item => item.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            showToast(`"${name}" ist bereits in der Reste-Kammer vorhanden!`, 'warning');
            return;
        }
        const item: PantryItemAdvanced = {
            name,
            active: true,
            addedDate: getLocalDateString(),
            expiryDate,
            quantity: quantity !== undefined ? quantity : 1,
            unit: unit !== undefined ? unit : 'Stk.',
            location: location !== undefined ? location : 'Kühlschrank'
        };
        this.pantryItemsAdvanced = [...this.pantryItemsAdvanced, item];
        StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
        this.srAnnouncement = `${name} zur Reste-Kammer hinzugefügt.`;
        this.autoSyncPush();
    }

    handleDeletePantryItem(e: CustomEvent) {
        const { name } = e.detail;
        this.pantryItemsAdvanced = this.pantryItemsAdvanced.filter(item => item.name !== name);
        StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
        this.srAnnouncement = `${name} aus der Reste-Kammer entfernt.`;
        this.autoSyncPush();
    }

    handleUsePantryItem(e: CustomEvent) {
        const { name } = e.detail;
        
        // Gamification Challenge: mhdRetter
        const matchedItem = this.pantryItemsAdvanced.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (matchedItem && matchedItem.expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(matchedItem.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) {
                if (this.achievements.unlock('mhdRetter')) {
                    showToast('🏆 Erfolg freigeschaltet: MHD-Retter! Zutat kurz vor Ablauf verwendet.', 'success', { duration: 5000 });
                }
            }
        }

        if (!this.ingredientChips.includes(name)) {
            this.ingredientChips = [...this.ingredientChips, name];
            this.saveChips();
        }
        this.currentTab = 'zauberer';
        this.srAnnouncement = `${name} als Zutat ausgewählt. Wechsel zum Zauberer.`;
    }

    handleSeasonalIngredient(e: CustomEvent) {
        const { item } = e.detail;
        if (!this.ingredientChips.includes(item)) {
            this.ingredientChips = [...this.ingredientChips, item];
            this.saveChips();
        }
        this.currentTab = 'zauberer';
        this.srAnnouncement = `${item} als saisonale Zutat ausgewählt. Wechsel zum Zauberer.`;
    }

    handleTriggerReceiptScan() {
        this.isScanningReceipt = true;
        void this.camera.open();
    }

    async processReceipt() {
        if (!this.capturedImage) return;
        this.isLoading = true;
        this.srAnnouncement = "Kassenzettel wird analysiert...";
        try {
            const items = await GeminiService.scanReceipt(this.capturedImage);
            if (items && items.length > 0) {
                const todayStr = getLocalDateString();
                const newItems = items.map(item => {
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + (item.expiryDays || 7));
                    const expiryDateStr = getLocalDateString(expiry);
                    return {
                        name: item.name || "Zutat",
                        active: true,
                        addedDate: todayStr,
                        expiryDate: expiryDateStr,
                        quantity: item.quantity || 1,
                        unit: item.unit || 'Stk.',
                        location: item.location || 'Kühlschrank'
                    };
                });
                this.pantryItemsAdvanced = [...this.pantryItemsAdvanced, ...newItems];
                StorageService.setPantryAdvanced(this.pantryItemsAdvanced);

                this.achievements.increment('scannerProfi');

                showToast(`Kassenzettel gescannt! ${items.length} Zutaten hinzugefügt.`, 'success');
            } else {
                showToast('Es konnten keine Lebensmittel auf dem Foto erkannt werden.', 'warning');
            }
        } catch (e) {
            console.error("Receipt scan failed", e);
            showToast('Fehler beim Scannen des Kassenzettels.', 'error');
        } finally {
            this.capturedImage = null;
            this.isScanningReceipt = false;
            this.isLoading = false;
        }
    }

    async handleGenerateWeeklyPlan(e: CustomEvent) {
        const isMealPrep = e.detail?.isMealPrep || false;
        this.isGeneratingPlan = true;
        this.srAnnouncement = "Wochenplan wird generiert...";
        try {
            const pantryNames = this.pantryItemsAdvanced.map(i => i.name);
            const plan = await GeminiService.generateWeeklyPlan(
                pantryNames,
                this.selectedDiet,
                this.selectedEffort,
                this.persons,
                isMealPrep
            );
            this.mealPlan = plan;
            StorageService.setMealPlan(plan);
            this.srAnnouncement = "Wochenplan erfolgreich generiert.";

            if (isMealPrep) {
                if (this.achievements.unlock('mealPrepKing')) {
                    showToast('🏆 Erfolg freigeschaltet: Meal-Prep-King!', 'success', { duration: 5000 });
                }
            }
        } catch (e) {
            console.error("Failed to generate weekly plan", e);
            showToast('Fehler beim Generieren des Wochenplans. Bitte erneut versuchen.', 'error');
        } finally {
            this.isGeneratingPlan = false;
        }
    }

    handleCookPlanRecipe(e: CustomEvent) {
        const { title } = e.detail;
        this.ingredientChips = [title];
        this.saveChips();
        this.currentTab = 'zauberer';
        this.askGoogle();
    }

    handleAddPlanShopping(e: CustomEvent) {
        const { title } = e.detail;
        this.shopping.addManual(title);
        showToast(`"${title}" zur Einkaufsliste hinzugefügt!`, 'success');
    }



    updateAchievements() {
        this.achievements.onRecipeCooked({
            stats: this.stats,
            recipe: this.recipe,
            diet: this.selectedDiet,
            urgentIngredients: this.urgentIngredients
        });
    }

    handleTriggerProductScan() {
        this.isScanningProduct = true;
        void this.camera.open();
    }

    async processProductScan() {
        if (!this.capturedImage) return;
        this.isLoading = true;
        this.srAnnouncement = "Verpackung wird auf MHD und Inhalt analysiert...";
        try {
            const item = await GeminiService.scanPantryItem(this.capturedImage);
            if (item && item.name) {
                const todayStr = getLocalDateString();
                const newItem = {
                    name: item.name || "Unbekanntes Produkt",
                    active: true,
                    addedDate: todayStr,
                    expiryDate: item.expiryDate || todayStr,
                    quantity: item.quantity || 1,
                    unit: item.unit || 'Stk.',
                    location: item.location || 'Kühlschrank'
                };
                this.pantryItemsAdvanced = [...this.pantryItemsAdvanced, newItem];
                StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
                showToast(`"${newItem.name}" erkannt und zur Vorratskammer hinzugefügt! (MHD: ${newItem.expiryDate})`, 'success', { duration: 5000 });
                this.autoSyncPush();
            } else {
                showToast('Produkt konnte nicht eindeutig identifiziert werden.', 'warning');
            }
        } catch (e) {
            console.error("Product scan failed", e);
            showToast('Fehler beim Scannen des Produkts.', 'error');
        } finally {
            this.capturedImage = null;
            this.isScanningProduct = false;
            this.isLoading = false;
        }
    }

    autoSyncPush() {
        return this.sync.push();
    }

    // --- SyncHost implementation (used by SyncController) ---
    getSyncData(): SyncData {
        return {
            pantryItemsAdvanced: this.pantryItemsAdvanced,
            shoppingList: this.shopping.items,
            achievementsList: this.achievements.list,
            stats: this.stats,
            urgentIngredients: this.urgentIngredients,
            ingredientChips: this.ingredientChips
        };
    }

    applySyncData(data: Partial<SyncData>) {
        if (data.pantryItemsAdvanced) {
            this.pantryItemsAdvanced = data.pantryItemsAdvanced;
            StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
        }
        if (data.shoppingList) {
            this.shopping.set(data.shoppingList);
        }
        if (data.achievementsList) {
            this.achievements.set(data.achievementsList);
        }
        if (data.stats) {
            this.stats = data.stats;
            StorageService.setStats(this.stats);
        }
        if (data.urgentIngredients) {
            this.urgentIngredients = data.urgentIngredients;
            StorageService.setUrgentIngredients(this.urgentIngredients);
        }
        if (data.ingredientChips) {
            this.ingredientChips = data.ingredientChips;
            this.saveChips();
        }
    }

    notify(message: string, type: 'success' | 'error' | 'warning') {
        showToast(message, type);
    }

    announce(message: string) {
        this.srAnnouncement = message;
    }

    setCapturedImage(dataUrl: string) {
        this.capturedImage = dataUrl;
    }

    getStepContext() {
        return {
            stepIndex: this.currentCookingStep,
            stepText: this.recipe?.instructions[this.currentCookingStep] ?? null,
            detectedMinutes: this.currentStepTimeMinutes
        };
    }

    getPantryNames(): string[] {
        return this.pantryItemsAdvanced.map(p => p.name);
    }

    exportCookbookPdf() {
        if (this.savedRecipesList.length === 0) {
            showToast('Du hast noch keine gespeicherten Rezepte im Kochbuch.', 'warning');
            return;
        }
        PdfService.printCookbook(this.savedRecipesList, this.selectedAvatar);
    }

    async handleAskCookingAssistant(e: CustomEvent) {
        const { question } = e.detail;
        if (!this.recipe || !question) return;
        this.assistantAnswerText = 'Chef denkt nach...';
        try {
            const answer = await GeminiService.askCookingQuestion(question, this.recipe.title);
            this.assistantAnswerText = answer;
            SpeechService.speak(answer);
        } catch (err) {
            console.error("Cooking assistant query failed", err);
            this.assistantAnswerText = 'Fehler bei der Antwort des Kochassistenten.';
        }
    }

    triggerMysteryBox() {
        if (this.pantryItemsAdvanced.length === 0) {
            showToast('Deine Vorratskammer ist leer! Füge zuerst Zutaten hinzu.', 'warning');
            return;
        }
        const sorted = [...this.pantryItemsAdvanced].sort((a, b) => {
            const dA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
            const dB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
            return dA - dB;
        });

        const topItems = sorted.slice(0, 3).map(i => i.name);
        this.ingredientChips = Array.from(new Set([...this.ingredientChips, ...topItems]));
        topItems.forEach(item => {
            this.urgentIngredients[item] = true;
        });
        this.selectedEffort = 'schnell';
        this.saveChips();
        this.currentTab = 'zauberer';
        this.srAnnouncement = `Mystery Box aktiviert mit den Zutaten: ${topItems.join(', ')}. Express-Rezept wird generiert.`;
        AudioService.playSuccessChime();
        this.askGoogle();
    }

    toggleSoundEffects(enabled: boolean) {
        this.soundEffectsEnabled = enabled;
        StorageService.setSoundEffectsEnabled(enabled);
        this.srAnnouncement = `Soundeffekte wurden ${enabled ? 'aktiviert' : 'deaktiviert'}.`;
    }

    // ── Lazy Tab Loading ─────────────────────────────────────────────────────
    @state() private _loadedTabs = new Set<string>();

    private async _switchTab(tab: string): Promise<void> {
        if (tab === 'zauberer') {
            this.currentTab = 'zauberer';
            this.showSavedRecipes = false;
            return;
        }
        this.currentTab = tab; // Switch immediately so header highlights; content shows after load
        if (!this._loadedTabs.has(tab)) {
            await this._loadTabComponent(tab);
        }
    }

    async _loadTabComponent(tab: string): Promise<void> {
        if (this._loadedTabs.has(tab)) return;
        const loaders: Record<string, () => Promise<unknown>> = {
            settings:     () => import('./components/eco-chef-settings'),
            pantry:       () => import('./components/eco-chef-pantry'),
            shopping:     () => import('./components/eco-chef-shopping-list'),
            mealplan:     () => import('./components/eco-chef-meal-planner'),
            achievements: () => import('./components/eco-chef-achievements'),
            regional:     () => import('./components/eco-chef-regional-map'),
            dashboard:    () => import('./components/eco-chef-dashboard'),
            'recipe-view':   () => import('./components/eco-chef-recipe-view'),
            'cooking-mode':  () => import('./components/eco-chef-cooking-mode'),
            'saved-recipes': () => import('./components/eco-chef-saved-recipes'),
        };
        const loader = loaders[tab];
        if (loader) {
            await loader();
            this._loadedTabs = new Set([...this._loadedTabs, tab]);
        }
    }
}