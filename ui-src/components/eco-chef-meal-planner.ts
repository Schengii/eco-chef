import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MealPlan, MealPlanDay } from '../models/eco-chef.models';

@customElement('eco-chef-meal-planner')
export class EcoChefMealPlanner extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }
        .planner-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: var(--shadow-md);
            margin-bottom: 24px;
        }
        .header-sec {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .planner-title {
            font-size: 20px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .days-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .day-row {
            background: var(--bg-color);
            border: 2px solid var(--border);
            border-radius: 18px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all 0.3s ease;
        }
        .day-row:hover {
            border-color: var(--primary);
            transform: translateY(-1px);
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .day-name {
            font-size: 15px;
            font-weight: 900;
            color: var(--primary-dark);
        }
        .dark-theme .day-name {
            color: var(--primary);
        }
        .day-recipe-title {
            font-size: 16px;
            font-weight: 800;
            color: var(--text-dark);
            margin: 4px 0;
        }
        .day-meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 700;
        }
        .day-notes {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.5;
            font-style: italic;
        }
        .day-actions {
            display: flex;
            gap: 8px;
            margin-top: 4px;
        }
        .action-btn {
            padding: 8px 14px;
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            color: var(--text-dark);
            font-family: inherit;
            transition: all 0.2s ease;
        }
        .action-btn:hover {
            border-color: var(--primary);
            background: var(--primary-light);
            color: var(--primary-dark);
        }
        .action-btn.cook {
            background: var(--primary-light);
            border-color: var(--primary);
            color: var(--primary-dark);
        }
        .action-btn.cook:hover {
            background: var(--primary);
            color: white;
        }
        .generate-btn {
            width: 100%;
            padding: 16px;
            background: var(--primary-gradient);
            color: white;
            border: none;
            border-radius: 18px;
            font-size: 15px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
            transition: all 0.3s ease;
            font-family: inherit;
            margin-bottom: 20px;
        }
        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        }
        .generate-btn:active {
            transform: scale(0.98);
        }
        .loader {
            border: 3px solid var(--border);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 28px;
            height: 28px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .empty-state {
            text-align: center;
            color: var(--text-muted);
            font-weight: 700;
            padding: 32px 16px;
            background: var(--bg-color);
            border-radius: 18px;
            border: 2px dashed var(--border);
            font-size: 14px;
        }
    `;

    @property({ type: Object }) mealPlan: MealPlan = {};
    @property({ type: Boolean }) isGeneratingPlan = false;

    @state() private isMealPrepMode = false;

    private daysOfWeek = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    private onGeneratePlan() {
        this.dispatchEvent(new CustomEvent('generate-weekly-plan', {
            detail: { isMealPrep: this.isMealPrepMode },
            bubbles: true,
            composed: true
        }));
    }

    private cookRecipe(title: string) {
        this.dispatchEvent(new CustomEvent('cook-plan-recipe', {
            detail: { title },
            bubbles: true,
            composed: true
        }));
    }

    private addRecipeToShoppingList(title: string) {
        this.dispatchEvent(new CustomEvent('add-plan-shopping', {
            detail: { title },
            bubbles: true,
            composed: true
        }));
    }

    override render() {
        const hasPlan = Object.keys(this.mealPlan).length > 0;

        return html`
            <div class="planner-card">
                <div class="header-sec">
                    <h3 class="planner-title">📅 Wochenplan</h3>
                </div>

                ${this.isGeneratingPlan ? html`
                    <div style="text-align: center; padding: 24px 0;">
                        <div class="loader"></div>
                        <p style="font-weight: 700; margin-top: 12px; font-size: 14px; color: var(--text-dark);">
                            KI plant deine Woche...
                        </p>
                    </div>
                ` : html`
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: var(--bg-color); border: 2px solid var(--border); padding: 12px; border-radius: 14px; box-shadow: var(--shadow-sm);">
                        <span style="font-size: 13px; font-weight: 850; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
                            📦 Meal-Prep Modus (Batch Cooking)
                        </span>
                        <input type="checkbox" ?checked="${this.isMealPrepMode}" @change="${(e: Event) => this.isMealPrepMode = (e.target as HTMLInputElement).checked}" style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--primary);" />
                    </div>

                    <button class="generate-btn" @click="${this.onGeneratePlan}">
                        ✨ Wochenplan mit KI generieren
                    </button>

                    ${!hasPlan ? html`
                        <div class="empty-state">
                            Noch kein Wochenplan generiert. Lass die KI einen maßgeschneiderten Plan für dich erstellen!
                        </div>
                    ` : html`
                        <div class="days-container">
                            ${this.daysOfWeek.map(day => {
                                const info: MealPlanDay = this.mealPlan[day] || {};
                                return html`
                                    <div class="day-row">
                                        <div class="day-header">
                                            <span class="day-name">${day}</span>
                                            ${info.prepTime ? html`<span class="day-meta">🕒 ${info.prepTime}</span>` : ''}
                                        </div>
                                        
                                        ${info.title ? html`
                                            <div class="day-recipe-title">${info.title}</div>
                                            ${info.co2SavedKg ? html`
                                                <div class="day-meta" style="color: #15803d;">
                                                    🌳 ${info.co2SavedKg} kg CO₂ gespart
                                                </div>
                                            ` : ''}
                                            ${info.notes ? html`<div class="day-notes">${info.notes}</div>` : ''}
                                            
                                            <div class="day-actions">
                                                <button class="action-btn cook" @click="${() => this.cookRecipe(info.title!)}">
                                                    🧑‍🍳 Kochen
                                                </button>
                                                <button class="action-btn" @click="${() => this.addRecipeToShoppingList(info.title!)}">
                                                    🛒 Zutat auf Einkaufsliste
                                                </button>
                                            </div>
                                        ` : html`
                                            <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;">
                                                Kein Rezept geplant.
                                            </div>
                                        `}
                                    </div>
                                `;
                            })}
                        </div>
                    `}
                `}
            </div>
        `;
    }
}
