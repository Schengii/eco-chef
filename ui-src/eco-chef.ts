import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Recipe, ShoppingItem, DailyStat, PantryItemAdvanced, Achievement, MealPlan, getLocalDateString } from './models/eco-chef.models';
import { ecoChefStyles } from './styles/eco-chef.styles';

import { StorageService } from './services/storage.service';
import { AudioService } from './services/audio.service';
import { SpeechService } from './services/speech.service';
import { GeminiService } from './services/gemini.service';
import { QrService } from './services/qr.service';
import { PdfService } from './services/pdf.service';
import { BackupService } from './services/backup.service';
import { SyncController, SyncData, SyncHost } from './controllers/sync.controller';
import { TimerController, TimerHost } from './controllers/timer.controller';
import { ShoppingListController, ShoppingListHost } from './controllers/shopping-list.controller';
import { CameraController, CameraHost } from './controllers/camera.controller';
import { VoiceController, VoiceHost } from './controllers/voice.controller';
import { AchievementsController } from './controllers/achievements.controller';
import { PantryController, PantryHost } from './controllers/pantry.controller';
import { RecipeBookController, RecipeBookHost } from './controllers/recipe-book.controller';
import { RecipeGeneratorController, RecipeGeneratorHost } from './controllers/recipe-generator.controller';
import { sortByExpiry } from './services/pantry';
import { parseNumericValue, estimateCo2Fallback, parseStepMinutes, prepareSavedRecipe } from './services/recipe-utils';
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



    @state() recipeImage: string | null = null;
    @state() showWelcomeScreen = true;

    @state() currentRating = 0;

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

    @state() currentTab = 'zauberer';
    @state() mealPlan: MealPlan = {};
    @state() isGeneratingPlan = false;

    private readonly sync = new SyncController(this as unknown as SyncHost);
    readonly timers = new TimerController(this as unknown as TimerHost);
    readonly shopping = new ShoppingListController(this as unknown as ShoppingListHost);
    readonly camera = new CameraController(this as unknown as CameraHost);
    readonly voice = new VoiceController(this as unknown as VoiceHost);
    readonly achievements = new AchievementsController(this);
    readonly pantry = new PantryController(this as unknown as PantryHost);
    readonly book = new RecipeBookController(this as unknown as RecipeBookHost);
    readonly generator = new RecipeGeneratorController(this as unknown as RecipeGeneratorHost);

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
        this.pantry.load();
        this.shopping.load();
        this.selectedAllergens = StorageService.getAllergens();
        this.stats = StorageService.getStats();
        this.calorieGoal = StorageService.getCalorieGoal();
        this.proteinGoal = StorageService.getProteinGoal();
        this.geminiApiKey = StorageService.getGeminiApiKey();
        this.geminiKeySessionOnly = !this.geminiApiKey || StorageService.isGeminiKeySessionOnly();
        this.selectedAvatar = localStorage.getItem('ecoChef_selectedAvatar') || '🧑‍🍳';

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
        if (this.showWelcomeScreen) return this.renderWelcome();

        return html`
            <div class="app-wrapper ${this.isDarkMode ? 'dark-theme' : ''} ${this.isLrsMode ? 'lrs-theme' : ''}">
               <div class="card">
                  ${this.renderHeader()}
                  ${this.renderSettingsTab()}
                  ${this.renderPantryTab()}
                  ${this.renderDashboardTab()}
                  ${this.renderRegionalTab()}
                  ${this.renderMealplanTab()}
                  ${this.renderAchievementsTab()}
                  ${this.renderGeneratorTab()}
                  ${this.renderShoppingTab()}
                  ${this.renderSavedRecipesTab()}
                  ${this.renderRecipeTab()}
               </div>

               ${this.renderCookingMode()}
               ${this.renderExitDialog()}
               ${this.renderQrModal()}
               ${this.renderReadingRuler()}

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

                ${this.renderMiniTimer()}
                ${this.renderWebcamModal()}

                <!-- Global Toast / Snackbar Notification System -->
                <eco-chef-toast></eco-chef-toast>

            </div>
        `;
    }

    renderSettingsTab() {
        return this.renderLazyTab('settings', () => html`
                      <eco-chef-settings
                          .isLrsMode="${this.isLrsMode}"
                          .showReadingRuler="${this.showReadingRuler}"
                          .fontScale="${this.fontScale}"
                          .selectedPantry="${this.pantry.selectedStaples}"
                          .pantryItems="${this.pantry.staples}"
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
                          @toggle-pantry-item="${(e: CustomEvent) => this.pantry.toggleStaple(e.detail.item)}"
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
                          @export-recipes="${this.book.exportJson}"
                          @export-full-backup="${this.exportFullBackup}"
                          @import-full-backup="${(e: CustomEvent) => this.importFullBackup(e.detail.data)}"
                          @import-recipes-success="${(e: CustomEvent) => this.book.importRaw(e.detail.recipes)}"
                          @clear-all-data="${this.clearAllData}">
                      </eco-chef-settings>
        `);
    }

    renderPantryTab() {
        return this.renderLazyTab('pantry', () => html`
                      <eco-chef-pantry
                          .pantryItems="${this.pantry.items}"
                          .isScanning="${this.isLoading && (this.pantry.isScanningReceipt || this.pantry.isScanningProduct)}"
                          @add-pantry-item="${(e: CustomEvent) => this.pantry.add(e.detail)}"
                          @delete-pantry-item="${(e: CustomEvent) => this.pantry.remove(e.detail.name)}"
                          @use-pantry-item="${this.handleUsePantryItem}"
                          @add-seasonal-ingredient="${this.handleSeasonalIngredient}"
                          @search-barcode="${(e: CustomEvent) => this.pantry.searchBarcode(e.detail.barcode)}"
                          @trigger-receipt-scan="${this.pantry.startReceiptScan}"
                          @trigger-product-scan="${this.pantry.startProductScan}"
                          @trigger-mystery-box="${this.triggerMysteryBox}">
                      </eco-chef-pantry>
        `);
    }

    renderDashboardTab() {
        return this.renderLazyTab('dashboard', () => html`
                      <eco-chef-dashboard
                          .stats="${this.stats}"
                          .calorieGoal="${this.calorieGoal}"
                          .proteinGoal="${this.proteinGoal}">
                      </eco-chef-dashboard>
        `);
    }

    renderRegionalTab() {
        return this.renderLazyTab('regional', () => html`
                      <eco-chef-regional-map
                          @add-shopping-item="${(e: CustomEvent) => this.shopping.addManual(e.detail.name)}">
                      </eco-chef-regional-map>
        `);
    }

    renderMealplanTab() {
        return this.renderLazyTab('mealplan', () => html`
                      <eco-chef-meal-planner
                          .mealPlan="${this.mealPlan}"
                          .isGeneratingPlan="${this.isGeneratingPlan}"
                          @generate-weekly-plan="${this.handleGenerateWeeklyPlan}"
                          @cook-plan-recipe="${this.handleCookPlanRecipe}"
                          @add-plan-shopping="${this.handleAddPlanShopping}">
                      </eco-chef-meal-planner>
        `);
    }

    renderAchievementsTab() {
        return this.renderLazyTab('achievements', () => html`
                      <eco-chef-achievements
                          .achievements="${this.achievements.list}"
                          .stats="${this.stats}">
                      </eco-chef-achievements>
        `);
    }

    renderShoppingTab() {
        return this.renderLazyTab('shopping', () => html`
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
        `);
    }

    renderGeneratorTab() {
        if (!(this.currentTab === 'zauberer' && !this.recipe && !this.showSavedRecipes)) return '';
        return html`
                      ${(() => {
                          if (!this.notificationsEnabled) return '';
                          const expiring = this.pantry.items.filter(item => {
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
                                  <button class="main-btn" @click="${this.generator.generate}" aria-label="Rezept mit künstlicher Intelligenz generieren">✨ Rezept Zaubern</button>`
                          }
                      </div>
        `;
    }

    renderSavedRecipesTab() {
        if (!(this.currentTab === 'zauberer' && this.showSavedRecipes && !this.recipe)) return '';
        return html`
                      <eco-chef-saved-recipes
                          .savedRecipesList="${this.book.saved}"
                          @open-recipe="${(e: CustomEvent) => this.openSavedRecipe(e.detail.recipe)}"
                          @delete-recipe="${(e: CustomEvent) => { e.stopPropagation(); this.book.remove(e.detail.index); }}"
                          @update-rating="${(e: CustomEvent) => { e.stopPropagation(); this.book.rate(e.detail.index, e.detail.rating); }}"
                          @import-recipes="${(e: CustomEvent) => this.book.importRaw(e.detail.recipes)}"
                          @export-pdf="${() => this.book.exportPdf(this.selectedAvatar)}"
                          @back-to-generator="${() => this.showSavedRecipes = false}">
                      </eco-chef-saved-recipes>
        `;
    }

    renderRecipeTab() {
        if (!(this.currentTab === 'zauberer' && this.recipe)) return '';
        if (!this._loadedTabs.has('recipe-view')) return this.renderTabSpinner();
        return html`
                      <eco-chef-recipe-view
                          .recipe="${this.recipe}"
                          .recipeImage="${this.recipeImage}"
                          .isGeneratingImage="${this.generator.isGeneratingImage}"
                          .persons="${this.persons}"
                          .currentRating="${this.currentRating}"
                          .isLoading="${this.isLoading}"
                          .pantryItems="${this.pantry.items}"
                          .chatHistory="${this.generator.chatHistory}"
                          @add-to-shopping-list="${(e: CustomEvent) => this.shopping.add(e.detail.item)}"
                          @set-recipe-rating="${(e: CustomEvent) => this.setRecipeRating(e.detail.rating)}"
                          @change-portions="${(e: CustomEvent) => this.generator.changePortions(e.detail.persons)}"
                          @mark-cooked="${this.markAsCooked}"
                          @start-cooking="${this.startCooking}"
                          @print-recipe="${this.printRecipe}"
                          @regenerate-recipe="${(e: CustomEvent) => this.generator.regenerate(e.detail.additionalPrompt)}"
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
                              this.generator.resetChat();
                              this.showExitDialog = true;
                          }}">
                      </eco-chef-recipe-view>
        `;
    }

    renderCookingMode() {
        if (!(this.isCookingMode && this.recipe && this._loadedTabs.has('cooking-mode'))) return '';
        return html`
                   <eco-chef-cooking-mode
                       .recipe="${this.recipe}"
                       .currentCookingStep="${this.currentCookingStep}"
                       .timerSecondsRemaining="${this.timers.secondsRemaining}"
                       .currentStepTimeMinutes="${this.currentStepTimeMinutes}"
                       .isVoiceControlActive="${this.voice.isActive}"
                       .voiceStatusText="${this.voice.statusText}"
                       .activeTimers="${this.timers.activeTimers}"
                       .assistantAnswer="${this.generator.assistantAnswer}"
                       @close="${this.exitCookingMode}"
                       @prev-step="${this.prevStep}"
                       @next-step="${this.nextStep}"
                       @read-step="${this.readCurrentStep}"
                       @toggle-voice="${this.voice.toggle}"
                       @start-timer="${this.timers.start}"
                       @stop-timer="${(e: CustomEvent) => this.timers.stop(e.detail?.id)}"
                       @ask-cooking-assistant="${(e: CustomEvent) => this.generator.askAssistant(e.detail.question)}">
                   </eco-chef-cooking-mode>
        `;
    }

    renderExitDialog() {
        if (!(this.showExitDialog)) return '';
        return html`
                   <div class="modal-overlay">
                       <div class="modal-content">
                           <h3>Was möchtest du tun?</h3>
                           <p>Dein Rezept ist fertig. Wie soll es weitergehen?</p>
                           <button class="modal-btn share" @click="${() => {
                               if (this.recipe) void this.book.share(this.recipe);
                               this.showExitDialog = false;
                           }}">📤 Teilen
                           </button>
                           <button class="modal-btn save" @click="${() => {
                                if (this.recipe) this.book.save(this.recipe, this.recipeImage, this.currentRating);
                                this.showExitDialog = false;
                            }}">💾 Speichern${this.currentRating ? ` (${this.currentRating}⭐)` : ''}
                            </button>
                           <button class="modal-btn new" @click="${this.openQrModal}" style="background: #8b5cf6; color: white;">📱 QR-Code anzeigen</button>
                           <button class="modal-btn new" @click="${this.startNewRecipe}">🔄 Neues Rezept laden</button>
                           <button class="modal-btn exit" @click="${this.exitApp}">❌ App verlassen</button>
                           <button class="modal-btn cancel" @click="${() => this.showExitDialog = false}">Zurück zum Rezept</button>
                        </div>
                    </div>
        `;
    }

    renderQrModal() {
        if (!(this.showQrModal)) return '';
        return html`
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
        `;
    }

    renderReadingRuler() {
        if (!(this.showReadingRuler && (this.recipe || this.isCookingMode))) return '';
        return html`
                    <div class="reading-ruler" style="top: ${this.rulerY}px;">
                        <div class="reading-ruler-handle" 
                             @touchstart="${this.handleRulerTouch}" 
                             @touchmove="${this.handleRulerTouch}"
                             @mousedown="${this.handleRulerMouseDown}"
                             aria-label="Leselineal verschieben"
                             title="Leselineal verschieben">↔️</div>
                    </div>
        `;
    }

    renderMiniTimer() {
        if (!(this.timers.activeTimers.length > 0 && !this.isCookingMode)) return '';
        return html`
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
        `;
    }

    renderWebcamModal() {
        if (!(this.camera.showWebcam)) return '';
        return html`
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
        `;
    }

    renderHeader() {
        return html`
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
        `;
    }

    renderWelcome() {
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

    private renderTabSpinner() {
        return html`<div style="display:flex;justify-content:center;padding:60px 0"><div class="loader"></div></div>`;
    }

    /** Renders a lazily loaded tab: nothing if inactive, a spinner until its component chunk has loaded. */
    private renderLazyTab(tab: string, content: () => TemplateResult) {
        if (this.currentTab !== tab) return '';
        return this._loadedTabs.has(tab) ? content() : this.renderTabSpinner();
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
        this.generator.resetChat();
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

    toggleSavedView() {
        this.showSavedRecipes = !this.showSavedRecipes;
        if (this.showSavedRecipes) {
            void this._loadTabComponent('saved-recipes');
            this.showShoppingList = false;
            this.showSettings = false;
            this.book.load();
            this.recipe = null;
        }
    }

    openSavedRecipe(savedRecipe: Recipe) {
        this.recipe = prepareSavedRecipe(savedRecipe);
        this.recipeImage = savedRecipe.image || null;
        this.showSavedRecipes = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    printRecipe() {
        if (!this.recipe) return;
        PdfService.printCookbook([this.recipe], this.selectedAvatar);
        this.srAnnouncement = `Rezept "${this.recipe.title}" wird gedruckt.`;
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

    transferShoppingToPantry() {
        const checkedItems = this.shopping.checkedItems();
        if (checkedItems.length === 0) return;

        const addedCount = this.pantry.addFromShopping(checkedItems);
        this.shopping.clearChecked();

        showToast(`${addedCount} Zutat(en) in die Reste-Kammer übernommen!`, 'success');
        this.srAnnouncement = `${addedCount} Zutaten in Reste-Kammer übernommen.`;
        this.autoSyncPush();
    }

    exportFullBackup() {
        BackupService.downloadJson(BackupService.backupFilename(), BackupService.createBackup(), true);
        this.srAnnouncement = "Vollständiges EcoChef-Backup heruntergeladen.";
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
                this.book.set(payload.savedRecipes as Recipe[]);
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

    override updated(changedProperties: Map<string | number | symbol, unknown>) {
        super.updated(changedProperties);
        if (changedProperties.has('capturedImage') && this.capturedImage) {
            void this.pantry.handleCapturedImage();
        }
    }

    handleUsePantryItem(e: CustomEvent) {
        const { name } = e.detail;
        
        this.pantry.onItemUsed(name);

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

    async handleGenerateWeeklyPlan(e: CustomEvent) {
        const isMealPrep = e.detail?.isMealPrep || false;
        this.isGeneratingPlan = true;
        this.srAnnouncement = "Wochenplan wird generiert...";
        try {
            const pantryNames = this.pantry.names();
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
        void this.generator.generate();
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

    autoSyncPush() {
        return this.sync.push();
    }

    // --- SyncHost implementation (used by SyncController) ---
    getSyncData(): SyncData {
        return {
            pantryItemsAdvanced: this.pantry.items,
            shoppingList: this.shopping.items,
            achievementsList: this.achievements.list,
            stats: this.stats,
            urgentIngredients: this.urgentIngredients,
            ingredientChips: this.ingredientChips
        };
    }

    applySyncData(data: Partial<SyncData>) {
        if (data.pantryItemsAdvanced) {
            this.pantry.set(data.pantryItemsAdvanced);
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

    preloadRecipeComponents() {
        void this._loadTabComponent('recipe-view');
        void this._loadTabComponent('cooking-mode');
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
        return this.pantry.names();
    }

    triggerMysteryBox() {
        if (this.pantry.items.length === 0) {
            showToast('Deine Vorratskammer ist leer! Füge zuerst Zutaten hinzu.', 'warning');
            return;
        }
        const sorted = sortByExpiry(this.pantry.items);

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
        void this.generator.generate();
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