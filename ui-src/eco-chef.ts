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
    @state() showExitDialog = false;
    @state() showSavedRecipes = false;
    @state() savedRecipesList: any[] = [];
    @state() isEditing = false;
    @state() additionalPrompt = '';

    @state() recipe: {
        title: string;
        difficulty: string;
        prepTime: string;
        imageUrl?: string;
        ingredientsList: string[];
        instructions: string[];
        tip: string;
    } | null = null;

    static override styles = ecoChefStyles;

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('backbutton', this.handleBackButton, false);
    }

    override disconnectedCallback() {
        document.removeEventListener('backbutton', this.handleBackButton, false);
        super.disconnectedCallback();
    }

    handleBackButton = (e: Event) => {
        e.preventDefault();
        if (this.showSavedRecipes) {
            this.toggleSavedView();
        } else if (this.recipe && !this.showExitDialog) {
            this.showExitDialog = true;
        } else if (this.showExitDialog) {
            this.showExitDialog = false;
        } else {
            this.exitApp();
        }
    }

    override render() {
        return html`
            <div class="card">
                <div class="header">
                    <h2>EcoChef</h2>
                    <p class="subtitle">Dein KI-Rezept-Zauberer 🧑‍🍳</p>

                    <button class="saved-btn" @click="${this.toggleSavedView}">
                        ${this.showSavedRecipes ? '🔙 Zurück zum Generator' : '📚 Meine Rezepte'}
                    </button>
                </div>

                ${!this.recipe && !this.showSavedRecipes ? html`
                    <input
                            type="text"
                            placeholder="Zutaten (z.B. Tomaten, Eier, Speck)"
                            .value="${this.ingredients}"
                            @input="${this._handleInput}"
                    />

                    <div class="filter-section">
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

                        ${this.recipe.imageUrl ? html`
                            <img
                                    class="recipe-image"
                                    src="${this.recipe.imageUrl}"
                                    alt="${this.recipe.title}"
                                    @error="${this.handleImageError}"
                            />
                        ` : ''}

                        <h2 class="recipe-title">${this.recipe.title}</h2>
                        <div class="recipe-meta">
                            <span class="difficulty-badge ${this.recipe.difficulty.toLowerCase()}">
                                📊 ${this.recipe.difficulty}
                            </span>
                            <span class="time-badge">
                                🕒 ${this.recipe.prepTime}
                            </span>
                        </div>

                        ${this.isEditing ? html`
                            <div class="edit-mode-box">
                                <h3 class="recipe-subheading">🖊️ Zutaten bearbeiten:</h3>
                                <p class="edit-hint">Eine Zutat pro Zeile</p>
                                <textarea id="edit-ingredients" class="edit-area" rows="6">${this.recipe.ingredientsList.join('\n')}</textarea>
                                
                                <h3 class="recipe-subheading">🖊️ Zubereitung bearbeiten:</h3>
                                <p class="edit-hint">Ein Schritt pro Zeile</p>
                                <textarea id="edit-instructions" class="edit-area" rows="8">${this.recipe.instructions.join('\n')}</textarea>
                                
                                <button class="main-btn save-edit-btn" @click="${this.saveEdits}">💾 Änderungen übernehmen</button>
                            </div>
                        ` : html`
                            <h3 class="recipe-subheading">
                                🛒 Zutaten (für ${this.persons}):
                                <button class="icon-btn" @click="${() => this.isEditing = true}">🖊️</button>
                            </h3>
                            <ul class="ingredients-list">
                                ${this.recipe.ingredientsList.map(item => html`<li>${item}</li>`)}
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

                        <div class="regenerate-box">
                            <h4>Nicht ganz zufrieden?</h4>
                            <input
                                    type="text"
                                    class="regenerate-input"
                                    placeholder="z.B. Mach es schärfer, ohne Eier..."
                                    .value="${this.additionalPrompt}"
                                    @input="${(e: Event) => this.additionalPrompt = (e.target as HTMLInputElement).value}"
                            />
                            ${this.isLoading ? html`<div class="loader inline-loader"></div>` : html`
                                <button class="secondary-btn" @click="${this.askGoogle}">🔄 Neu zaubern</button>
                            `}
                        </div>

                        <button class="main-btn finish-btn" @click="${() => this.showExitDialog = true}">
                            ✅ Rezept schließen
                        </button>
                    </div>
                ` : ''}
            </div>

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
        `;
    }

    private _handleInput(e: Event) {
        this.ingredients = (e.target as HTMLInputElement).value;
    }

    async askGoogle() {
        if (!this.ingredients) {
            alert("Bitte gib zuerst ein paar Zutaten ein!");
            return;
        }
        this.isLoading = true;
        this.recipe = null;

        const portions = this.persons || 2;

        const prompt = `
            Du bist ein professioneller Sternekoch. Erstelle ein Rezept basierend auf: ${this.ingredients}.
            VORGABEN:
            - Ernährungsweise: ${this.selectedDiet && this.selectedDiet !== 'egal' ? this.selectedDiet : 'Keine'}
            - Zeitaufwand: ${this.selectedEffort && this.selectedEffort !== 'egal' ? this.selectedEffort : 'Normal'}
            - Portionen: Berechne die Zutatenmengen für exakt ${portions} Person(en).
            
            ${this.additionalPrompt ? `🚨 ACHTUNG, DER NUTZER HAT EINEN ÄNDERUNGSWUNSCH ZUM VORHERIGEN REZEPT: 
            "${this.additionalPrompt}". Bitte passe das neue Rezept exakt an diesen Wunsch an!` : ''}
            
            Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt. Das JSON MUSS diese Struktur haben:
            {
              "title": "Name des Gerichts",
              "difficulty": "Leicht, Mittel oder Schwer",
              "prepTime": "z.B. 25 Min.",
              "visualDescription": "Kurze englische Beschreibung für ein Food-Foto...",
              "ingredientsList": ["1. Zutat", "2. Zutat"],
              "instructions": ["Schritt 1...", "Schritt 2..."],
              "tip": "Tipp..."
            }
        `;

        try {
            const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
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
                    if (!parsedData.title || !parsedData.ingredientsList || !parsedData.instructions || !parsedData.visualDescription) {
                        throw new Error("Wichtige Rezeptdaten (Titel, Zutaten, Schritte oder Bildbeschreibung) fehlen.");
                    }

                    const imagePrompt = parsedData.visualDescription || parsedData.title;
                    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=600&height=400&nofeed=true`;
                    console.log("Die generierte Bild-URL lautet:", pollinationUrl);

                    this.recipe = {
                        title: parsedData.title,
                        difficulty: parsedData.difficulty || "Unbekannt",
                        prepTime: parsedData.prepTime || "Unbekannt",
                        imageUrl: pollinationUrl,
                        ingredientsList: Array.isArray(parsedData.ingredientsList)
                            ? parsedData.ingredientsList
                            : ["Zutaten konnten nicht geladen werden."],

                        instructions: Array.isArray(parsedData.instructions)
                            ? parsedData.instructions
                            : ["Zubereitung fehlt."],

                        tip: parsedData.tip || "Lass es dir schmecken!"
                    };
                    window.scrollTo({top: 0, behavior: 'smooth'});

                } catch (parseError) {
                    console.error("Fehler beim Auswerten der KI-Antwort:", parseError);
                    console.log("Die originale KI-Antwort war:", text);

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
        this.ingredients = '';
        this.showExitDialog = false;
        this.showSavedRecipes = false;
        this.additionalPrompt = '';
        this.isEditing = false;
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
        const shareText = `Schau mal, was ich mit EcoChef gekocht habe:\n\n${this.recipe.title}\n\nLade dir die EcoChef App herunter!`;
        if (navigator.share) {
            try {
                await navigator.share({title: this.recipe.title, text: shareText});
            } catch (err) {
                console.error("Fehler beim Teilen", err);
            }
        } else {
            navigator.clipboard.writeText(shareText);
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

    handleImageError(e: Event) {
        const img = e.target as HTMLImageElement;
        img.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=600&auto=format&fit=crop';
        console.warn("Pollinations.ai Bild konnte nicht geladen werden, Fallback wird angezeigt.");
    }
}