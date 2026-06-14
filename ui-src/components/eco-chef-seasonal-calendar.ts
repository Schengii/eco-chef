import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('eco-chef-seasonal-calendar')
export class EcoChefSeasonalCalendar extends LitElement {
    static override styles = css`
        :host {
            display: block;
            margin-top: 16px;
        }
        .calendar-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 20px;
            box-shadow: var(--shadow-md);
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .calendar-title {
            font-size: 18px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .month-selector {
            background: var(--bg-color);
            border: 2px solid var(--border);
            color: var(--text-dark);
            padding: 8px 12px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            outline: none;
        }
        .month-selector:focus {
            border-color: var(--primary);
        }
        .info-text {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.5;
            margin-bottom: 16px;
            font-weight: 500;
        }
        .category-sec {
            margin-bottom: 16px;
        }
        .category-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--primary-dark);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dark-theme .category-title {
            color: var(--primary);
        }
        .items-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .seasonal-item {
            background: var(--bg-color);
            border: 2px solid var(--border);
            color: var(--text-dark);
            padding: 8px 14px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        .seasonal-item:hover {
            border-color: var(--primary);
            background: var(--primary-light);
            color: var(--primary-dark);
            transform: translateY(-1px);
        }
        .seasonal-item:active {
            transform: scale(0.95);
        }
    `;

    @property({ type: Number }) currentMonth = new Date().getMonth();

    private months = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    // Simple seasonal data map for Germany/Europe
    private seasonalData: { [key: number]: { veg: string[], fruit: string[], salad: string[] } } = {
        0: { // Jan
            veg: ['Wirsing 🥬', 'Rosenkohl 🟢', 'Pastinaken 🥔', 'Karotten 🥕', 'Lauch 🥖', 'Rote Bete 🟣'],
            fruit: ['Äpfel (Lagerware) 🍎', 'Birnen (Lagerware) 🍐'],
            salad: ['Feldsalat 🍃', 'Chicorée 🥬']
        },
        1: { // Feb
            veg: ['Wirsing 🥬', 'Rosenkohl 🟢', 'Pastinaken 🥔', 'Karotten 🥕', 'Lauch 🥖', 'Rote Bete 🟣'],
            fruit: ['Äpfel (Lagerware) 🍎'],
            salad: ['Feldsalat 🍃', 'Chicorée 🥬']
        },
        2: { // Mar
            veg: ['Wirsing 🥬', 'Spinat 🌱', 'Pastinaken 🥔', 'Lauch 🥖', 'Karotten 🥕'],
            fruit: ['Äpfel (Lagerware) 🍎'],
            salad: ['Chicorée 🥬', 'Feldsalat 🍃']
        },
        3: { // Apr
            veg: ['Spargel 🥖', 'Spinat 🌱', 'Bärlauch 🌿', 'Rhabarber 🎋', 'Radieschen 🔴', 'Blumenkohl 🥦'],
            fruit: ['Äpfel (Lagerware) 🍎'],
            salad: ['Kopfsalat 🥬', 'Feldsalat 🍃']
        },
        4: { // May
            veg: ['Spargel 🥖', 'Spinat 🌱', 'Radieschen 🔴', 'Kohlrabi 🥬', 'Blumenkohl 🥦', 'Brokkoli 🥦', 'Erbsen 🫛'],
            fruit: ['Erdbeeren 🍓', 'Rhabarber 🎋'],
            salad: ['Kopfsalat 🥬', 'Rucola 🌿', 'Eichblattsalat 🥬']
        },
        5: { // Jun
            veg: ['Spargel 🥖', 'Brokkoli 🥦', 'Blumenkohl 🥦', 'Kohlrabi 🥬', 'Zucchini 🥒', 'Erbsen 🫛', 'Karotten (frisch) 🥕', 'Fenchel 🧅'],
            fruit: ['Erdbeeren 🍓', 'Kirschen 🍒', 'Johannisbeeren 🔴', 'Himbeeren 🍓'],
            salad: ['Kopfsalat 🥬', 'Rucola 🌿', 'Eisbergsalat 🥬', 'Lollo Rosso 🥬']
        },
        6: { // Jul
            veg: ['Tomaten 🍅', 'Gurken 🥒', 'Zucchini 🥒', 'Bohnen 🫛', 'Paprika 🫑', 'Brokkoli 🥦', 'Blumenkohl 🥦', 'Zuckermais 🌽'],
            fruit: ['Erdbeeren 🍓', 'Kirschen 🍒', 'Himbeeren 🍓', 'Blaubeeren 🫐', 'Johannisbeeren 🔴', 'Pfirsiche 🍑'],
            salad: ['Kopfsalat 🥬', 'Rucola 🌿', 'Eisbergsalat 🥬']
        },
        7: { // Aug
            veg: ['Tomaten 🍅', 'Gurken 🥒', 'Zucchini 🥒', 'Paprika 🫑', 'Auberginen 🍆', 'Bohnen 🫛', 'Zuckermais 🌽', 'Kürbis 🎃'],
            fruit: ['Äpfel (frisch) 🍎', 'Birnen 🍐', 'Zwetschgen 🟣', 'Blaubeeren 🫐', 'Brombeeren 🍇', 'Melonen 🍉'],
            salad: ['Eisbergsalat 🥬', 'Rucola 🌿', 'Endiviensalat 🥬']
        },
        8: { // Sep
            veg: ['Kürbis 🎃', 'Tomaten 🍅', 'Zucchini 🥒', 'Paprika 🫑', 'Karotten 🥕', 'Rote Bete 🟣', 'Sellerie 🥬', 'Lauch 🥖'],
            fruit: ['Äpfel 🍎', 'Birnen 🍐', 'Zwetschgen 🟣', 'Weintrauben 🍇', 'Brombeeren 🍇'],
            salad: ['Feldsalat 🍃', 'Endiviensalat 🥬', 'Chicorée 🥬']
        },
        9: { // Oct
            veg: ['Kürbis 🎃', 'Kohl 🥬', 'Wirsing 🥬', 'Pastinaken 🥔', 'Karotten 🥕', 'Rote Bete 🟣', 'Steckrüben 🥔', 'Lauch 🥖'],
            fruit: ['Äpfel 🍎', 'Birnen 🍐', 'Quitten 🍏'],
            salad: ['Feldsalat 🍃', 'Endiviensalat 🥬', 'Chicorée 🥬']
        },
        10: { // Nov
            veg: ['Rosenkohl 🟢', 'Grünkohl 🥬', 'Wirsing 🥬', 'Pastinaken 🥔', 'Rote Bete 🟣', 'Kürbis 🎃', 'Steckrüben 🥔'],
            fruit: ['Äpfel (Lagerware) 🍎', 'Birnen (Lagerware) 🍐'],
            salad: ['Feldsalat 🍃', 'Chicorée 🥬']
        },
        11: { // Dec
            veg: ['Rosenkohl 🟢', 'Grünkohl 🥬', 'Wirsing 🥬', 'Pastinaken 🥔', 'Rote Bete 🟣', 'Lauch 🥖'],
            fruit: ['Äpfel (Lagerware) 🍎'],
            salad: ['Feldsalat 🍃', 'Chicorée 🥬']
        }
    };

    private changeMonth(e: Event) {
        const select = e.target as HTMLSelectElement;
        this.currentMonth = parseInt(select.value, 10);
    }

    private itemClicked(itemName: string) {
        // Strip emoji for search/pantry addition
        const cleanName = itemName.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        this.dispatchEvent(new CustomEvent('add-seasonal-ingredient', {
            detail: { item: cleanName },
            bubbles: true,
            composed: true
        }));
    }

    override render() {
        const data = this.seasonalData[this.currentMonth] || { veg: [], fruit: [], salad: [] };
        
        return html`
            <div class="calendar-card">
                <div class="calendar-header">
                    <h3 class="calendar-title">📅 Saisonkalender</h3>
                    <select class="month-selector" @change="${this.changeMonth}">
                        ${this.months.map((m, idx) => html`
                            <option value="${idx}" ?selected="${idx === this.currentMonth}">${m}</option>
                        `)}
                    </select>
                </div>
                
                <p class="info-text">
                    Saisonales Obst und Gemüse hat einen kürzeren Transportweg und spart Energie beim Anbau. 
                    Klicke auf eine Zutat, um sie deiner Zutatenliste hinzuzufügen.
                </p>

                ${data.veg.length > 0 ? html`
                    <div class="category-sec">
                        <div class="category-title">🥦 Gemüse</div>
                        <div class="items-grid">
                            ${data.veg.map(item => html`
                                <button class="seasonal-item" @click="${() => this.itemClicked(item)}">${item}</button>
                            `)}
                        </div>
                    </div>
                ` : ''}

                ${data.fruit.length > 0 ? html`
                    <div class="category-sec">
                        <div class="category-title">🍎 Obst</div>
                        <div class="items-grid">
                            ${data.fruit.map(item => html`
                                <button class="seasonal-item" @click="${() => this.itemClicked(item)}">${item}</button>
                            `)}
                        </div>
                    </div>
                ` : ''}

                ${data.salad.length > 0 ? html`
                    <div class="category-sec">
                        <div class="category-title">🥬 Salate</div>
                        <div class="items-grid">
                            ${data.salad.map(item => html`
                                <button class="seasonal-item" @click="${() => this.itemClicked(item)}">${item}</button>
                            `)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
