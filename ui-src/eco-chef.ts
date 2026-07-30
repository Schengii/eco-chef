import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Recipe, IngredientItem, ShoppingItem, DailyStat, PantryItemAdvanced, Achievement, MealPlan, ActiveTimer, getLocalDateString } from './models/eco-chef.models';
import { ecoChefStyles } from './styles/eco-chef.styles';

import { StorageService } from './services/storage.service';
import { AudioService } from './services/audio.service';
import { SpeechService } from './services/speech.service';
import { GeminiService } from './services/gemini.service';
import { BarcodeService } from './services/barcode.service';
import { QrService } from './services/qr.service';
import { PdfService } from './services/pdf.service';

// Import subcomponents so they are registered
import './components/eco-chef-welcome';
import './components/eco-chef-gdpr-banner';
import './components/eco-chef-privacy-modal';
import './components/eco-chef-timer-expired-modal';
import './components/eco-chef-settings';
import './components/eco-chef-shopping-list';
import './components/eco-chef-recipe-view';
import './components/eco-chef-cooking-mode';
import './components/eco-chef-pantry';
import './components/eco-chef-meal-planner';
import './components/eco-chef-achievements';
import './components/eco-chef-regional-map';
import './components/eco-chef-dashboard';

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
    @state() timerSecondsRemaining = 0;
    @state() activeTimers: ActiveTimer[] = [];
    @state() expiredTimerLabel = '';
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
    @state() savedFilterRating = 0;

    @state() calorieGoal = 2000;
    @state() proteinGoal = 80;
    @state() geminiApiKey = '';
    @state() selectedAvatar = '🧑‍🍳';
    @state() budgetSettings = StorageService.getBudgetSettings();
    @state() notificationsEnabled = StorageService.getNotificationsEnabled();
    @state() soundEffectsEnabled = StorageService.getSoundEffectsEnabled();
    @state() showQrModal = false;
    @state() qrSvgMarkup = '';
    @state() assistantAnswerText = '';

    @state() currentTab = 'zauberer';
    @state() pantryItemsAdvanced: PantryItemAdvanced[] = [];
    @state() achievementsList: Achievement[] = [];
    @state() mealPlan: MealPlan = {};
    @state() isGeneratingPlan = false;
    @state() isScanningReceipt = false;
    @state() isScanningProduct = false;
    @state() syncCode = '';

    defaultAchievements: Achievement[] = [
        { id: 'retterKoenig', title: 'Retter-König', description: 'Koche Rezepte mit dringend zu verbrauchenden Zutaten.', icon: '👑', unlocked: false, progress: 0, target: 5 },
        { id: 'klimaSchuetzer', title: 'Klimaschützer', description: 'Erreiche eine CO₂-Ersparnis von insgesamt 10 kg.', icon: '🌳', unlocked: false, progress: 0, target: 10 },
        { id: 'sterneChef', title: 'Sterne-Eco-Chef', description: 'Bewerte 3 gekochte Rezepte mit 5 Sternen.', icon: '⭐', unlocked: false, progress: 0, target: 3 },
        { id: 'scannerProfi', title: 'Scanner-Profi', description: 'Scanne 3 Kassenzettel per Kamera.', icon: '🧾', unlocked: false, progress: 0, target: 3 },
        { id: 'pflanzenfresser', title: 'Pflanzenfresser', description: 'Koche 5 vegetarische oder vegane Gerichte.', icon: '🌿', unlocked: false, progress: 0, target: 5 },
        { id: 'mealPrepKing', title: 'Meal-Prep-King', description: 'Generiere einen wöchentlichen Meal-Prep-Plan.', icon: '📦', unlocked: false, progress: 0, target: 1 },
        { id: 'mhdRetter', title: 'MHD-Retter', description: 'Füge Zutat mit nahem MHD zur Koch-Auswahl hinzu.', icon: '⏰', unlocked: false, progress: 0, target: 1 }
    ];

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
        this.selectedAvatar = localStorage.getItem('ecoChef_selectedAvatar') || '🧑‍🍳';
        this.syncCode = localStorage.getItem('ecoChef_syncCode') || '';

        this.pantryItemsAdvanced = StorageService.getPantryAdvanced();
        this.mealPlan = StorageService.getMealPlan();
        
        let loadedAchievements = StorageService.getAchievements();
        if (loadedAchievements.length === 0) {
            loadedAchievements = [...this.defaultAchievements];
            StorageService.setAchievements(loadedAchievements);
        } else {
            // Merge defaults if new achievements were added
            this.defaultAchievements.forEach(def => {
                if (!loadedAchievements.some(a => a.id === def.id)) {
                    loadedAchievements.push(def);
                }
            });
            StorageService.setAchievements(loadedAchievements);
        }
        this.achievementsList = loadedAchievements;
        
        this.loadChips();

        if (this.syncCode) {
            this.handleApplySyncCode(new CustomEvent('apply-sync-code', { detail: { code: this.syncCode } }));
        }

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
        
        const cleanNameLower = cleanName.toLowerCase();
        const isInPantry = this.pantryItemsAdvanced.some(p => {
            const pClean = p.name.toLowerCase().trim();
            return cleanNameLower.includes(pClean) || pClean.includes(cleanNameLower);
        });

        if (isInPantry) {
            const confirmAdd = confirm(`ℹ️ "${cleanName}" ist bereits in deiner Vorratskammer vorhanden. Trotzdem auf die Einkaufsliste setzen?`);
            if (!confirmAdd) {
                return;
            }
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
        const today = getLocalDateString();
        
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
        this.updateAchievements();
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

    startTimer(minutes?: number | CustomEvent, label?: string) {
        let mins: number | null = null;
        let stepLabel: string | undefined = label;

        if (typeof minutes === 'number') {
            mins = minutes;
        } else if (minutes && typeof minutes === 'object' && 'detail' in minutes) {
            const detail = (minutes as CustomEvent).detail;
            if (detail) {
                if (typeof detail.minutes === 'number') {
                    mins = detail.minutes;
                }
                if (detail.label) {
                    stepLabel = detail.label;
                }
            }
        }

        if (mins === null || mins === undefined || isNaN(mins)) {
            mins = this.currentStepTimeMinutes;
        }

        if (!mins || mins <= 0 || isNaN(mins)) return;

        const defaultLabel = this.recipe ? `Schritt ${this.currentCookingStep + 1}: ${this.recipe.instructions[this.currentCookingStep].substring(0, 30)}...` : `Timer ${this.activeTimers.length + 1}`;
        const finalLabel = stepLabel || defaultLabel;

        const existingIndex = this.activeTimers.findIndex(t => t.label === finalLabel);
        if (existingIndex !== -1) {
            const updated = [...this.activeTimers];
            updated[existingIndex] = {
                ...updated[existingIndex],
                secondsRemaining: mins * 60,
                totalSeconds: mins * 60
            };
            this.activeTimers = updated;
        } else {
            const newTimer: ActiveTimer = {
                id: Math.random().toString(36).substring(2, 9),
                label: finalLabel,
                totalSeconds: mins * 60,
                secondsRemaining: mins * 60,
                stepIndex: this.currentCookingStep
            };
            this.activeTimers = [...this.activeTimers, newTimer];
        }

        this.startTimerTicker();
        SpeechService.speak(`Timer gestartet für ${mins} Minuten.`);
    }

    startTimerTicker() {
        if (this.timerInterval) return;
        this.timerInterval = window.setInterval(() => {
            if (this.activeTimers.length === 0) {
                this.stopTimerTicker();
                return;
            }

            this.activeTimers = this.activeTimers.map(timer => {
                if (timer.isPaused) return timer;
                if (timer.secondsRemaining > 0) {
                    return { ...timer, secondsRemaining: timer.secondsRemaining - 1 };
                } else {
                    return { ...timer, secondsRemaining: 0 };
                }
            });

            // Find expired timer
            const expired = this.activeTimers.find(t => t.secondsRemaining === 0);
            if (expired) {
                this.playAlarm(expired.label);
                this.activeTimers = this.activeTimers.filter(t => t.id !== expired.id);
            }

            // Keep timerSecondsRemaining updated with the current step's timer (if it exists)
            const currentStepTimer = this.activeTimers.find(t => t.stepIndex === this.currentCookingStep);
            this.timerSecondsRemaining = currentStepTimer ? currentStepTimer.secondsRemaining : 0;
            
        }, 1000) as unknown as number;
    }

    stopTimerTicker() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    stopTimer(id?: string) {
        if (typeof id === 'string') {
            this.activeTimers = this.activeTimers.filter(t => t.id !== id);
        } else {
            // If no ID is passed (e.g. from legacy components), stop the current step's timer
            this.activeTimers = this.activeTimers.filter(t => t.stepIndex !== this.currentCookingStep);
        }
        
        if (this.activeTimers.length === 0) {
            this.stopTimerTicker();
        }
        
        const currentStepTimer = this.activeTimers.find(t => t.stepIndex === this.currentCookingStep);
        this.timerSecondsRemaining = currentStepTimer ? currentStepTimer.secondsRemaining : 0;
    }

    playAlarm(label: string = '') {
        this.expiredTimerLabel = label;
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        }
        this.showTimerExpiredModal = true;
        this.srAnnouncement = `Achtung! Die Zeit für ${label || 'den Schritt'} ist abgelaufen!`;
        AudioService.playAlarm();
    }

    closeTimerExpiredModal() {
        this.showTimerExpiredModal = false;
        this.expiredTimerLabel = '';
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
                     
                     <h2>${this.selectedAvatar} EcoChef</h2>
                     <p class="subtitle">Dein KI-Rezept-Zauberer</p>
                     
                     <div class="header-actions">
                         <button class="saved-btn ${this.currentTab === 'zauberer' ? 'active' : ''}" @click="${() => { this.currentTab = 'zauberer'; this.showSavedRecipes = false; }}" aria-label="Rezept-Generator">
                             ✨ Zauberer
                         </button>
                         <button class="saved-btn ${this.currentTab === 'pantry' ? 'active' : ''}" @click="${() => { this.currentTab = 'pantry'; }}" aria-label="Vorratskammer">
                             🥫 Vorrat
                         </button>
                         <button class="saved-btn ${this.currentTab === 'mealplan' ? 'active' : ''}" @click="${() => { this.currentTab = 'mealplan'; }}" aria-label="Wochenplan">
                             📅 Wochenplan
                         </button>
                         <button class="saved-btn ${this.currentTab === 'shopping' ? 'active' : ''}" @click="${() => { this.currentTab = 'shopping'; }}" aria-label="Einkaufsliste">
                             🛒 Einkäufe
                         </button>
                         <button class="saved-btn ${this.currentTab === 'regional' ? 'active' : ''}" @click="${() => { this.currentTab = 'regional'; }}" aria-label="Wochenmärkte">
                             🌾 Regio Markt
                         </button>
                         <button class="saved-btn ${this.currentTab === 'achievements' ? 'active' : ''}" @click="${() => { this.currentTab = 'achievements'; }}" aria-label="Erfolge">
                             🏆 Erfolge
                         </button>
                         <button class="saved-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" @click="${() => { this.currentTab = 'dashboard'; }}" aria-label="Analytics Dashboard">
                             📊 Analytics
                         </button>
                         <button class="saved-btn ${this.currentTab === 'settings' ? 'active' : ''}" @click="${() => { this.currentTab = 'settings'; }}" aria-label="Einstellungen">
                             ⚙️ Setup
                         </button>
                     </div>
                  </div>

                  ${this.currentTab === 'settings' ? html`
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
                          @change-gemini-api-key="${(e: CustomEvent) => this.changeGeminiApiKey(e.detail.key)}"
                          @change-avatar="${(e: CustomEvent) => {
                              this.selectedAvatar = e.detail.avatar;
                              localStorage.setItem('ecoChef_selectedAvatar', e.detail.avatar);
                              this.autoSyncPush();
                          }}"
                          @generate-sync-code="${this.handleGenerateSyncCode}"
                          @apply-sync-code="${this.handleApplySyncCode}"
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

                  ${this.currentTab === 'pantry' ? html`
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

                  ${this.currentTab === 'dashboard' ? html`
                      <eco-chef-dashboard
                          .stats="${this.stats}"
                          .calorieGoal="${this.calorieGoal}"
                          .proteinGoal="${this.proteinGoal}">
                      </eco-chef-dashboard>
                  ` : ''}

                  ${this.currentTab === 'regional' ? html`
                      <eco-chef-regional-map
                          @add-shopping-item="${(e: CustomEvent) => this.addManualShoppingItem(e.detail.name)}">
                      </eco-chef-regional-map>
                  ` : ''}

                  ${this.currentTab === 'mealplan' ? html`
                      <eco-chef-meal-planner
                          .mealPlan="${this.mealPlan}"
                          .isGeneratingPlan="${this.isGeneratingPlan}"
                          @generate-weekly-plan="${this.handleGenerateWeeklyPlan}"
                          @cook-plan-recipe="${this.handleCookPlanRecipe}"
                          @add-plan-shopping="${this.handleAddPlanShopping}">
                      </eco-chef-meal-planner>
                  ` : ''}

                  ${this.currentTab === 'achievements' ? html`
                      <eco-chef-achievements
                          .achievements="${this.achievementsList}"
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

                  ${this.currentTab === 'shopping' ? html`
                      <eco-chef-shopping-list
                          .shoppingList="${this.shoppingList}"
                          .budgetSettings="${this.budgetSettings}"
                          @add-item="${(e: CustomEvent) => this.addManualShoppingItem(e.detail.name)}"
                          @toggle-item="${(e: CustomEvent) => this.toggleShoppingItem(e.detail.index)}"
                          @remove-item="${(e: CustomEvent) => this.removeShoppingItem(e.detail.index)}"
                          @clear-checked="${this.clearCheckedShoppingItems}"
                          @transfer-to-pantry="${this.transferShoppingToPantry}"
                          @share-list="${this.shareShoppingList}">
                      </eco-chef-shopping-list>
                  ` : ''}

                  ${this.currentTab === 'zauberer' && this.showSavedRecipes && !this.recipe ? html`
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
                              <input type="file" id="import-file" accept=".json" style="display: none;" @change="${this.handleImportFile}" />
                              <button class="secondary-btn" @click="${() => (this.shadowRoot?.querySelector('#import-file') as HTMLInputElement)?.click()}" style="border-color: #8b5cf6; color: #6d28d9;" aria-label="Rezepte aus JSON-Datei importieren">
                                  📂 Rezepte importieren (JSON)
                              </button>
                              <button class="secondary-btn" @click="${this.exportCookbookPdf}" style="border-color: #10b981; color: #047857;" aria-label="Kochbuch als PDF/Druck ausgeben">
                                  📖 Kochbuch als PDF / Drucken
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
                          
                          <button class="secondary-btn" @click="${() => this.showSavedRecipes = false}" style="margin-top: 16px;">
                              🔙 Zurück zum Generator
                          </button>
                      </div>
                  ` : ''}

                  ${this.currentTab === 'zauberer' && this.recipe ? html`
                      <eco-chef-recipe-view
                          .recipe="${this.recipe}"
                          .recipeImage="${this.recipeImage}"
                          .isGeneratingImage="${this.isGeneratingImage}"
                          .persons="${this.persons}"
                          .currentRating="${this.currentRating}"
                          .isLoading="${this.isLoading}"
                          .pantryItems="${this.pantryItemsAdvanced}"
                          .chatHistory="${this.recipeChatHistory}"
                          @add-to-shopping-list="${(e: CustomEvent) => this.addToShoppingList(e.detail.item)}"
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

               ${this.isCookingMode && this.recipe ? html`
                   <eco-chef-cooking-mode
                       .recipe="${this.recipe}"
                       .currentCookingStep="${this.currentCookingStep}"
                       .timerSecondsRemaining="${this.timerSecondsRemaining}"
                       .currentStepTimeMinutes="${this.currentStepTimeMinutes}"
                       .isVoiceControlActive="${this.isVoiceControlActive}"
                       .voiceStatusText="${this.voiceStatusText}"
                       .activeTimers="${this.activeTimers}"
                       .assistantAnswer="${this.assistantAnswerText}"
                       @close="${this.exitCookingMode}"
                       @prev-step="${this.prevStep}"
                       @next-step="${this.nextStep}"
                       @read-step="${this.readCurrentStep}"
                       @toggle-voice="${this.toggleVoiceControl}"
                       @start-timer="${this.startTimer}"
                       @stop-timer="${(e: CustomEvent) => this.stopTimer(e.detail?.id)}"
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
                    .showTimerExpiredModal="${this.showTimerExpiredModal}"
                    .timerLabel="${this.expiredTimerLabel}"
                    @close="${this.closeTimerExpiredModal}">
                </eco-chef-timer-expired-modal>

                <!-- Screen Reader Live Announcements & Global File Upload Input -->
                <input type="file" id="file-upload" accept="image/*" style="display: none;" @change="${this.handleFileUpload}" />
                <div class="sr-only" aria-live="polite" id="sr-announcements">
                    ${this.srAnnouncement}
                </div>

                <!-- Floating Persistent Mini Timer Widget -->
                ${this.activeTimers.length > 0 && !this.isCookingMode ? html`
                    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #0f172a; color: white; border: 2px solid #10b981; border-radius: 20px; padding: 12px 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px; font-family: inherit;">
                        <span style="font-size: 20px;">⏱️</span>
                        <div>
                            <div style="font-size: 13px; font-weight: 800; color: #10b981;">
                                ${this.activeTimers[0].label}
                            </div>
                            <div style="font-size: 16px; font-weight: 900; font-family: monospace;">
                                ${Math.floor(this.activeTimers[0].secondsRemaining / 60)}:${(this.activeTimers[0].secondsRemaining % 60).toString().padStart(2, '0')}
                                ${this.activeTimers.length > 1 ? `(+${this.activeTimers.length - 1} weitere)` : ''}
                            </div>
                        </div>
                        <button @click="${() => this.togglePauseTimer(this.activeTimers[0].id)}" style="background: #334155; color: white; border: none; border-radius: 10px; width: 32px; height: 32px; font-size: 14px; cursor: pointer;">
                            ${this.activeTimers[0].isPaused ? '▶️' : '⏸️'}
                        </button>
                        <button @click="${() => this.startTimer(1, this.activeTimers[0].label)}" style="background: #059669; color: white; border: none; border-radius: 10px; padding: 6px 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
                            +1 Min
                        </button>
                        <button @click="${() => this.isCookingMode = true}" style="background: #10b981; color: white; border: none; border-radius: 10px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer;">
                            Kochmodus 🍳
                        </button>
                    </div>
                ` : ''}

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
            
            ${this.recipeChatHistory.length > 0 ? `🚨 ÄNDERUNGSWÜNSCHE (alle vorherigen und der aktuelle müssen berücksichtigt werden):
            ${this.recipeChatHistory.map((p, idx) => `${idx + 1}. "${p}"`).join('\n')}` : ''}
            
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
        this.recipeChatHistory = [];
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
            co2SavedKg: typeof savedRecipe.co2SavedKg === 'number' ? savedRecipe.co2SavedKg : (parseFloat(savedRecipe.co2SavedKg) || 0),
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
                const list = [...this.achievementsList];
                const sc = list.find(a => a.id === 'sterneChef');
                if (sc) {
                    sc.progress = Math.min(sc.target, sc.progress + 1);
                    sc.unlocked = sc.progress >= sc.target;
                    this.achievementsList = list;
                    StorageService.setAchievements(this.achievementsList);
                }
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

    transferShoppingToPantry() {
        const checkedItems = this.shoppingList.filter(item => item.checked);
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

        this.shoppingList = this.shoppingList.filter(item => !item.checked);
        this.saveShoppingList();

        alert(`🎉 ${addedCount} abgehakte Zutat(en) wurden in deine Reste-Kammer übernommen!`);
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
        const backupData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            savedRecipes: StorageService.getSavedRecipes(),
            pantryItemsAdvanced: StorageService.getPantryAdvanced(),
            shoppingList: StorageService.getShoppingList(),
            stats: StorageService.getStats(),
            achievements: StorageService.getAchievements(),
            urgentIngredients: StorageService.getUrgentIngredients(),
            ingredientChips: StorageService.getIngredientChips(),
            calorieGoal: StorageService.getCalorieGoal(),
            proteinGoal: StorageService.getProteinGoal()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `ecoChef_full_backup_${getLocalDateString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
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
            alert(`🎉 "${res.name}" erfolgreich aus Barcode hinzugefügt!`);
            this.srAnnouncement = `${res.name} aus Barcode hinzugefügt.`;
            this.autoSyncPush();
        } else {
            alert(`❌ ${res.rawMessage || 'Produkt nicht gefunden.'}`);
        }
    }

    openQrModal() {
        if (!this.recipe) return;
        const payloadStr = QrService.encodeRecipePayload(this.recipe);
        this.qrSvgMarkup = QrService.generateQrSvgMarkup(payloadStr);
        this.showQrModal = true;
    }

    importFullBackup(payload: any) {
        if (!payload || typeof payload !== 'object') {
            alert("❌ Ungültiges Backup-Format.");
            return;
        }

        try {
            if (Array.isArray(payload.savedRecipes)) {
                StorageService.setSavedRecipes(payload.savedRecipes);
                this.savedRecipesList = payload.savedRecipes;
            }
            if (Array.isArray(payload.pantryItemsAdvanced)) {
                StorageService.setPantryAdvanced(payload.pantryItemsAdvanced);
                this.pantryItemsAdvanced = payload.pantryItemsAdvanced;
            }
            if (Array.isArray(payload.shoppingList)) {
                StorageService.setShoppingList(payload.shoppingList);
                this.shoppingList = payload.shoppingList;
            }
            if (payload.stats && typeof payload.stats === 'object') {
                StorageService.setStats(payload.stats);
                this.stats = payload.stats;
            }
            if (Array.isArray(payload.achievements)) {
                StorageService.setAchievements(payload.achievements);
                this.achievementsList = payload.achievements;
            }
            if (payload.urgentIngredients) {
                StorageService.setUrgentIngredients(payload.urgentIngredients);
                this.urgentIngredients = payload.urgentIngredients;
            }
            if (Array.isArray(payload.ingredientChips)) {
                StorageService.setIngredientChips(payload.ingredientChips);
                this.ingredientChips = payload.ingredientChips;
            }

            alert("🎉 Gesamtes EcoChef-Backup erfolgreich wiederhergestellt!");
            this.srAnnouncement = "Gesamtdaten erfolgreich importiert.";
            this.requestUpdate();
            this.autoSyncPush();
        } catch (e) {
            console.error("Failed to restore full backup", e);
            alert("❌ Fehler beim Wiederherstellen des Backups.");
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
        } else if (command.includes('timer starten') || command.includes('timer start') || command.includes('starten')) {
            if (this.currentStepTimeMinutes) {
                this.startTimer();
            } else {
                SpeechService.speak("Für diesen Schritt ist keine Kochzeit angegeben.");
            }
            this.srAnnouncement = "Timer per Sprachbefehl gestartet.";
        } else if (command.includes('wie viel zeit') || command.includes('restzeit') || command.includes('zeit übrig') || command.includes('dauer')) {
            if (this.activeTimers.length === 0) {
                SpeechService.speak("Es laufen aktuell keine aktiven Timer.");
            } else {
                const textList = this.activeTimers.map(t => {
                    const m = Math.floor(t.secondsRemaining / 60);
                    const s = t.secondsRemaining % 60;
                    const timeText = m > 0 ? `${m} Minuten und ${s} Sekunden` : `${s} Sekunden`;
                    return `Timer für ${t.label.split(':')[0]} hat noch ${timeText} übrig.`;
                });
                SpeechService.speak(`Es laufen ${this.activeTimers.length} Timer. ${textList.join(' ')}`);
            }
            this.srAnnouncement = "Timer-Restlaufzeit per Sprachbefehl angesagt.";
        } else if (command.includes('stopp') || command.includes('halt') || command.includes('anhalten')) {
            SpeechService.cancelSpeak();
            this.stopTimer();
            if (this.showTimerExpiredModal) {
                this.closeTimerExpiredModal();
            }
            this.srAnnouncement = "Sprachausgabe und Timer gestoppt.";
        } else if (command.includes('hilfe') || command.includes('befehle')) {
            SpeechService.speak("Mögliche Befehle sind: weiter, zurück, vorlesen, timer starten, restzeit abfragen, stoppen und hilfe.");
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
        let result = this.savedRecipesList;
        if (this.savedFilterRating > 0) {
            result = result.filter((r: any) => (r.rating || 0) >= this.savedFilterRating);
        }
        if (!this.searchQuery.trim()) return result;
        const query = this.searchQuery.toLowerCase();
        return result.filter((r: any) =>
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
            alert("Diese Zutat existiert bereits in deiner Reste-Kammer!");
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
                const list = [...this.achievementsList];
                const ach = list.find(a => a.id === 'mhdRetter');
                if (ach && !ach.unlocked) {
                    ach.progress = 1;
                    ach.unlocked = true;
                    this.achievementsList = list;
                    StorageService.setAchievements(this.achievementsList);
                    alert("🏆 Erfolg freigeschaltet: MHD-Retter! Du hast eine Zutat verwendet, die bald abläuft.");
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
        this.openCamera();
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

                // Update achievements progress
                const list = [...this.achievementsList];
                const sc = list.find(a => a.id === 'scannerProfi');
                if (sc) {
                    sc.progress = Math.min(sc.target, sc.progress + 1);
                    sc.unlocked = sc.progress >= sc.target;
                }
                this.achievementsList = list;
                StorageService.setAchievements(this.achievementsList);

                alert(`🎉 Kassenzettel erfolgreich gescannt! ${items.length} Zutaten hinzugefügt.`);
            } else {
                alert("Es konnten keine Lebensmittel auf dem Foto erkannt werden.");
            }
        } catch (e) {
            console.error("Receipt scan failed", e);
            alert("Fehler beim Scannen des Kassenzettels.");
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
                const list = [...this.achievementsList];
                const ach = list.find(a => a.id === 'mealPrepKing');
                if (ach && !ach.unlocked) {
                    ach.progress = 1;
                    ach.unlocked = true;
                    this.achievementsList = list;
                    StorageService.setAchievements(this.achievementsList);
                    alert("🏆 Erfolg freigeschaltet: Meal-Prep-King! Du hast die Wochenplanung im Meal-Prep Modus optimiert.");
                }
            }
        } catch (e) {
            console.error("Failed to generate weekly plan", e);
            alert("Fehler beim Generieren des Wochenplans.");
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
        this.addManualShoppingItem(title);
        alert(`🛒 Gericht "${title}" wurde als Zutat auf die Einkaufsliste gesetzt!`);
    }

    async handleGenerateSyncCode() {
        this.srAnnouncement = "Generiere Synchronisations-Code...";
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const payload = {
            pantryItemsAdvanced: this.pantryItemsAdvanced,
            shoppingList: this.shoppingList,
            achievementsList: this.achievementsList,
            stats: this.stats,
            urgentIngredients: this.urgentIngredients,
            ingredientChips: this.ingredientChips
        };

        try {
            const res = await fetch(`https://kvdb.io/ecochefsyncbucket_${code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                this.syncCode = code;
                localStorage.setItem('ecoChef_syncCode', code);
                this.srAnnouncement = `Sync-Code generiert: ${code}.`;
                this.requestUpdate();
            } else {
                throw new Error("HTTP Status " + res.status);
            }
        } catch (e) {
            console.error("Generate sync code failed", e);
            alert("Fehler beim Verbinden mit dem Cloud-Server.");
        }
    }

    async handleApplySyncCode(e: CustomEvent) {
        const { code } = e.detail;
        this.srAnnouncement = "Verbinde und synchronisiere Daten...";
        try {
            const res = await fetch(`https://kvdb.io/ecochefsyncbucket_${code}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    if (data.pantryItemsAdvanced) {
                        this.pantryItemsAdvanced = data.pantryItemsAdvanced;
                        StorageService.setPantryAdvanced(this.pantryItemsAdvanced);
                    }
                    if (data.shoppingList) {
                        this.shoppingList = data.shoppingList;
                        this.saveShoppingList();
                    }
                    if (data.achievementsList) {
                        this.achievementsList = data.achievementsList;
                        StorageService.setAchievements(this.achievementsList);
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
                    this.syncCode = code;
                    localStorage.setItem('ecoChef_syncCode', code);
                    alert("🎉 Daten erfolgreich synchronisiert!");
                    this.srAnnouncement = "Synchronisation abgeschlossen.";
                    this.requestUpdate();
                }
            } else {
                alert("Ungültiger oder abgelaufener Sync-Schlüssel.");
            }
        } catch (err) {
            console.error("Apply sync code failed", err);
            alert("Fehler beim Abrufen der Synchronisationsdaten.");
        }
    }

    updateAchievements() {
        let totalCO2 = 0;
        let cookedCount = 0;
        for (const date in this.stats) {
            totalCO2 += this.stats[date].co2Saved || 0;
            cookedCount += this.stats[date].count || 0;
        }

        const list = [...this.achievementsList];
        
        // 1. Klimaschützer
        const ks = list.find(a => a.id === 'klimaSchuetzer');
        if (ks) {
            ks.progress = Math.round(totalCO2);
            ks.unlocked = ks.progress >= ks.target;
        }

        // 2. Pflanzenfresser
        const pf = list.find(a => a.id === 'pflanzenfresser');
        if (pf && this.recipe) {
            const isVeg = this.selectedDiet === 'vegetarisch' || this.selectedDiet === 'vegan';
            if (isVeg) {
                pf.progress = Math.min(pf.target, pf.progress + 1);
                pf.unlocked = pf.progress >= pf.target;
            }
        }

        // 3. Retter-König
        const rk = list.find(a => a.id === 'retterKoenig');
        if (rk && this.recipe) {
            const hasUrgent = Object.keys(this.urgentIngredients).some(k => this.urgentIngredients[k] && this.recipe?.ingredientsList.some(i => i.item.toLowerCase().includes(k.toLowerCase())));
            if (hasUrgent) {
                rk.progress = Math.min(rk.target, rk.progress + 1);
                rk.unlocked = rk.progress >= rk.target;
            }
        }

        this.achievementsList = list;
        StorageService.setAchievements(this.achievementsList);
    }

    handleTriggerProductScan() {
        this.isScanningProduct = true;
        this.openCamera();
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
                alert(`🎉 Produkt "${newItem.name}" erfolgreich erkannt und der Vorratskammer hinzugefügt! (MHD: ${newItem.expiryDate})`);
                this.autoSyncPush();
            } else {
                alert("Produkt konnte nicht eindeutig identifiziert werden.");
            }
        } catch (e) {
            console.error("Product scan failed", e);
            alert("Fehler beim Scannen des Produkts.");
        } finally {
            this.capturedImage = null;
            this.isScanningProduct = false;
            this.isLoading = false;
        }
    }

    async autoSyncPush() {
        if (!this.syncCode) return;
        const payload = {
            pantryItemsAdvanced: this.pantryItemsAdvanced,
            shoppingList: this.shoppingList,
            achievementsList: this.achievementsList,
            stats: this.stats,
            urgentIngredients: this.urgentIngredients,
            ingredientChips: this.ingredientChips
        };
        try {
            await fetch(`https://kvdb.io/ecochefsyncbucket_${this.syncCode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log("Auto-sync push completed successfully.");
        } catch (e) {
            console.warn("Auto-sync push failed", e);
        }
    }

    exportCookbookPdf() {
        if (this.savedRecipesList.length === 0) {
            alert("Du hast noch keine gespeicherten Rezepte im Kochbuch.");
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

    togglePauseTimer(id: string) {
        this.activeTimers = this.activeTimers.map(t => {
            if (t.id === id) {
                return { ...t, isPaused: !t.isPaused };
            }
            return t;
        });
    }

    triggerMysteryBox() {
        if (this.pantryItemsAdvanced.length === 0) {
            alert("Deine Vorratskammer ist leer! Füge zuerst ein paar Zutaten hinzu.");
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
}