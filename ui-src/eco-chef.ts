import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from './api-config';
import { ecoChefStyles} from "./eco-chef.styles";


@customElement('eco-chef')

export class EcoChef extends LitElement {
    @property({type: String}) ingredients = '';
    @property({type: Boolean}) isLoading = false;

    @state() selectedDiet = 'egal';
    @state() selectedEffort = 'egal';
    @state() persons = 2;
    @state() showExitDialog = false;

    @state() recipe: {
        title: string;
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
        if (this.recipe && !this.showExitDialog) {
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
                </div>

                ${!this.recipe ? html`
                    <input
                            type="text"
                            placeholder="Zutaten (z.B. Tomaten, Eier, Speck)"
                            .value="${this.ingredients}"
                            @input="${this._handleInput}"
                    />

                    <div class="filter-section">
                        <p class="filter-title">Portionen:</p>
                        <div class="stepper-group">
                            <button class="step-btn" @click="${() => this.persons > 1 ? this.persons-- : null}">-
                            </button>
                            <span class="step-value">🍽️ ${this.persons} ${this.persons === 1 ? 'Person' : 'Personen'}</span>
                            <button class="step-btn" @click="${() => this.persons < 12 ? this.persons++ : null}">+
                            </button>
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
                                    <div class="loader"></div><p class="loader-text">KI kreiert dein Rezept &
                                        Bild...</p>`
                                : html`
                                    <button class="main-btn" @click="${this.askGoogle}">✨ Rezept Zaubern</button>`
                        }
                    </div>
                ` : ''}

                ${this.recipe ? html`
                    <div class="recipe-paper">

                        ${this.recipe.imageUrl ? html`
                            <img class="recipe-image" src="${this.recipe.imageUrl}" alt="${this.recipe.title}"/>
                        ` : ''}

                        <h2 class="recipe-title">${this.recipe.title}</h2>

                        <h3 class="recipe-subheading">🛒 Zutaten (für ${this.persons}):</h3>
                        <ul class="ingredients-list">
                            ${this.recipe.ingredientsList.map(item => html`
                                <li>${item}</li>`)}
                        </ul>

                        <h3 class="recipe-subheading">🍳 Zubereitung:</h3>
                        <div class="instructions-box">
                            ${this.recipe.instructions.map((step, index) => html`
                                <div class="step-item">
                                    <div class="step-number">${index + 1}</div>
                                    <div class="step-text">${step}</div>
                                </div>
                            `)}
                        </div>

                        <div class="tip-box">
                            <strong>💡 Chefkoch-Tipp:</strong> ${this.recipe.tip}
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
                        <button class="modal-btn cancel" @click="${() => this.showExitDialog = false}">Zurück zum
                            Rezept
                        </button>
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

        console.log("\n--------- NEUER AUFTRAG ---------");
        console.log("👨‍🍳 Zutaten:", this.ingredients);
        console.log("🥗 Ernährung:", this.selectedDiet || "egal");
        console.log("⏱️ Zeitaufwand:", this.selectedEffort || "egal");
        console.log("👥 Portionen:", portions);

        const prompt = `
            Du bist ein professioneller Sternekoch. Erstelle ein Rezept basierend auf: ${this.ingredients}.
            VORGABEN:
            - Ernährungsweise: ${this.selectedDiet && this.selectedDiet !== 'egal' ? this.selectedDiet : 'Keine'}
            - Zeitaufwand: ${this.selectedEffort && this.selectedEffort !== 'egal' ? this.selectedEffort : 'Normal'}
            - Portionen: Berechne die Zutatenmengen für exakt ${portions} Person(en).
            
            Erstelle im Feld "visualDescription" eine detaillierte ENGLISCHE Beschreibung des angerichteten Gerichts.
            
            Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt. Das JSON MUSS diese Struktur haben:
            {
              "title": "Name des Gerichts",
              "visualDescription": "English description...",
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

            const text = response.text!;
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);
            try {
                let parsedData = data;
                if (typeof data.rezept === 'string') parsedData = JSON.parse(data.rezept);
                else if (typeof data === 'string') parsedData = JSON.parse(data);

                this.recipe = {
                    title: parsedData.title || "Leckeres Gericht",
                    imageUrl: parsedData.imageUrl || data.imageUrl,
                    ingredientsList: parsedData.ingredientsList || ["Zutaten konnten nicht geladen werden."],
                    instructions: parsedData.instructions || ["Zubereitung fehlt."],
                    tip: parsedData.tip || "Lass es dir schmecken!"
                };
                window.scrollTo({top: 0, behavior: 'smooth'});
            } catch (e) {
                console.error("Format fehlerhaft", e);
            }
        } catch (error: any) {
            alert("Netzwerkfehler: " + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    startNewRecipe() {
        this.recipe = null;
        this.ingredients = '';
        this.showExitDialog = false;
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
            }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Kopiert!");
        }
    }

    saveRecipe() {
        if (!this.recipe) return;
        const saved = JSON.parse(localStorage.getItem('ecoChef_savedRecipes') || '[]');
        saved.push(this.recipe);
        localStorage.setItem('ecoChef_savedRecipes', JSON.stringify(saved));
        alert("✅ Rezept lokal gespeichert!");
    }

}