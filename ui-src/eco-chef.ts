import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { GoogleGenAI } from '@google/genai';

@customElement('eco-chef')
export class EcoChef extends LitElement {
    @property({ type: String }) ingredients = '';
    @property({ type: Boolean }) isLoading = false;

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
              <button class="step-btn" @click="${() => this.persons > 1 ? this.persons-- : null}">-</button>
              <span class="step-value">🍽️ ${this.persons} ${this.persons === 1 ? 'Person' : 'Personen'}</span>
              <button class="step-btn" @click="${() => this.persons < 12 ? this.persons++ : null}">+</button>
            </div>

            <p class="filter-title">Ernährung:</p>
            <div class="chip-group">
              <button class="chip ${this.selectedDiet === 'egal' ? 'active' : ''}" @click="${() => this.selectedDiet = 'egal'}">Alles</button>
              <button class="chip ${this.selectedDiet === 'vegetarisch' ? 'active' : ''}" @click="${() => this.selectedDiet = 'vegetarisch'}">Vegetarisch 🥦</button>
              <button class="chip ${this.selectedDiet === 'vegan' ? 'active' : ''}" @click="${() => this.selectedDiet = 'vegan'}">Vegan 🌱</button>
            </div>

            <p class="filter-title">Zeitaufwand:</p>
            <div class="chip-group">
              <button class="chip ${this.selectedEffort === 'egal' ? 'active' : ''}" @click="${() => this.selectedEffort = 'egal'}">Egal</button>
              <button class="chip ${this.selectedEffort === 'schnell' ? 'active' : ''}" @click="${() => this.selectedEffort = 'schnell'}">Schnell ⚡</button>
              <button class="chip ${this.selectedEffort === 'aufwendig' ? 'active' : ''}" @click="${() => this.selectedEffort = 'aufwendig'}">Aufwendig 👨‍🍳</button>
            </div>
          </div>
          
          <div class="action-area">
            ${this.isLoading
            ? html`<div class="loader"></div><p class="loader-text">KI kreiert dein Rezept & Bild...</p>`
            : html`<button class="main-btn" @click="${this.askGoogle}">✨ Rezept Zaubern</button>`
        }
          </div>
        ` : ''}
        
        ${this.recipe ? html`
          <div class="recipe-paper">
            
            ${this.recipe.imageUrl ? html`
              <img class="recipe-image" src="${this.recipe.imageUrl}" alt="${this.recipe.title}" />
            ` : ''}

            <h2 class="recipe-title">${this.recipe.title}</h2>
            
            <h3 class="recipe-subheading">🛒 Zutaten (für ${this.persons}):</h3>
            <ul class="ingredients-list">
              ${this.recipe.ingredientsList.map(item => html`<li>${item}</li>`)}
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
            
            <button class="modal-btn share" @click="${() => { this.shareRecipe(); this.showExitDialog = false; }}">📤 Teilen</button>
            <button class="modal-btn save" @click="${() => { this.saveRecipe(); this.showExitDialog = false; }}">💾 Speichern</button>
            <button class="modal-btn new" @click="${this.startNewRecipe}">🔄 Neues Rezept laden</button>
            <button class="modal-btn exit" @click="${this.exitApp}">❌ App verlassen</button>
            <button class="modal-btn cancel" @click="${() => this.showExitDialog = false}">Zurück zum Rezept</button>
          </div>
        </div>
      ` : ''}
    `;
    }

    private _handleInput(e: Event) { this.ingredients = (e.target as HTMLInputElement).value; }

    async askGoogle() {
        if (!this.ingredients) { alert("Bitte gib zuerst ein paar Zutaten ein!"); return; }
        this.isLoading = true; this.recipe = null;

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
            const ai = new GoogleGenAI({apiKey: "AIzaSyCI5pl0jM4F4CjXuRHYPqOEPuzG47yji3Q"});
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = response.text!;
            const cleanJson =  text.replace(/```json/g, '').replace(/```/g, '').trim();
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) { console.error("Format fehlerhaft", e); }
        } catch (error: any) { alert("Netzwerkfehler: " + error.message); }
        finally { this.isLoading = false; }
    }

    startNewRecipe() {
        this.recipe = null;
        this.ingredients = '';
        this.showExitDialog = false;
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
        const shareText = `Schau mal, was ich mit EcoChef gekocht habe:\n\n${this.recipe.title}\n\nLade dir die EcoChef App herunter!`;
        if (navigator.share) {
            try { await navigator.share({ title: this.recipe.title, text: shareText }); } catch (err) { }
        } else {
            navigator.clipboard.writeText(shareText); alert("Kopiert!");
        }
    }

    saveRecipe() {
        if (!this.recipe) return;
        const saved = JSON.parse(localStorage.getItem('ecoChef_savedRecipes') || '[]');
        saved.push(this.recipe);
        localStorage.setItem('ecoChef_savedRecipes', JSON.stringify(saved));
        alert("✅ Rezept lokal gespeichert!");
    }

    static override styles = css`
    :host { display: block; padding: 16px; font-family: 'Segoe UI', system-ui, sans-serif; background-color: #f0f4f8; min-height: 100vh; }
    .card { background-color: white; border-radius: 20px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-width: 500px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; }
    h2 { color: #2e7d32; margin: 0; font-size: 28px; }
    .subtitle { color: #666; margin-top: 4px; font-size: 14px; }
    
    input { width: 100%; padding: 16px; margin-bottom: 20px; box-sizing: border-box; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; transition: 0.3s; }
    input:focus { outline: none; border-color: #4CAF50; }

    .filter-section { margin-bottom: 20px; }
    .filter-title { font-size: 14px; font-weight: bold; color: #4a5568; margin: 0 0 8px 4px; }
    .chip-group { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip { padding: 8px 16px; border-radius: 20px; border: 1px solid #cbd5e1; background: white; color: #475569; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .chip.active { background: #e6f4ea; border-color: #4CAF50; color: #2e7d32; font-weight: bold; }

    .stepper-group { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 8px; border-radius: 16px; width: fit-content; }
    .step-btn { background: white; border: 1px solid #cbd5e1; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; font-weight: bold; color: #2e7d32; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.1s; }
    .step-btn:active { transform: scale(0.9); background: #e6f4ea; }
    .step-value { font-size: 16px; font-weight: bold; color: #1e293b; min-width: 90px; text-align: center; }

    .action-area { text-align: center; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .main-btn { width: 100%; padding: 16px; background: #4CAF50; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
    .finish-btn { margin-top: 30px; background: #1e293b; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3); }
    
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4CAF50; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    .loader-text { margin-top: 10px; color: #666; font-size: 14px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .recipe-paper { margin-top: 20px; padding: 20px; background-color: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .recipe-image { width: 100%; height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #f1f5f9; }
    .recipe-title { color: #1a202c; margin-top: 0; font-size: 22px; text-align: center; line-height: 1.3;}
    .recipe-subheading { color: #2e7d32; font-size: 18px; margin: 24px 0 12px 0; border-bottom: 2px solid #e6f4ea; padding-bottom: 4px;}
    .ingredients-list { padding-left: 20px; color: #4a5568; line-height: 1.6; }
    .instructions-box { display: flex; flex-direction: column; gap: 12px; }
    .step-item { display: flex; background: #f8fafc; padding: 12px; border-radius: 12px; }
    .step-number { background: #4CAF50; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
    .step-text { color: #334155; line-height: 1.5; padding-top: 2px; }
    .tip-box { margin-top: 24px; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; color: #92400e; font-size: 14px; line-height: 1.5; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-content { background: white; border-radius: 24px; padding: 24px; width: 85%; max-width: 350px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); text-align: center; animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-content h3 { margin-top: 0; color: #1e293b; font-size: 22px; }
    .modal-content p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .modal-btn { width: 100%; padding: 14px; margin-bottom: 12px; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .modal-btn.share { background: #e0f2fe; color: #0284c7; }
    .modal-btn.save { background: #f1f5f9; color: #475569; }
    .modal-btn.new { background: #e6f4ea; color: #2e7d32; }
    .modal-btn.exit { background: #fee2e2; color: #dc2626; }
    .modal-btn.cancel { background: transparent; color: #94a3b8; margin-bottom: 0; text-decoration: underline; font-weight: normal; }
    .modal-btn:active { transform: scale(0.96); }
  `;
}