import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface FridgeZone {
    id: string;
    name: string;
    tempRange: string;
    icon: string;
    items: string[];
    description: string;
}

@customElement('eco-chef-fridge-guide')
export class EcoChefFridgeGuide extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }
        .guide-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: var(--shadow-md);
            margin-top: 24px;
        }
        .title {
            font-size: 18px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0 0 6px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .subtitle {
            font-size: 12px;
            color: var(--text-muted);
            margin: 0 0 16px 0;
        }
        .fridge-graphic {
            border: 3px solid var(--border);
            border-radius: 20px;
            background: var(--bg-color);
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .fridge-zone {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 14px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .fridge-zone:hover, .fridge-zone.active {
            border-color: var(--primary);
            background: var(--primary-light);
            transform: scale(1.01);
        }
        .zone-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .zone-icon {
            font-size: 24px;
        }
        .zone-name {
            font-size: 14px;
            font-weight: 850;
            color: var(--text-dark);
        }
        .zone-temp {
            font-size: 11px;
            font-weight: 800;
            background: var(--primary);
            color: white;
            padding: 3px 8px;
            border-radius: 10px;
        }
        .detail-box {
            background: var(--bg-color);
            border: 2px solid var(--border);
            border-radius: 16px;
            padding: 16px;
            margin-top: 16px;
            animation: fadeIn 0.3s ease;
        }
        .detail-title {
            font-size: 15px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0 0 6px 0;
        }
        .detail-desc {
            font-size: 12px;
            color: var(--text-muted);
            margin: 0 0 10px 0;
            line-height: 1.5;
        }
        .item-chips {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .chip {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            color: var(--text-dark);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    @state() private activeZoneId = 'top';

    private zones: FridgeZone[] = [
        {
            id: 'top',
            name: 'Oberes Fach',
            tempRange: '8–10 °C',
            icon: '🧀',
            items: ['Käse', 'Zubereitete Speisen', 'Speisereste', 'Geräuchertes'],
            description: 'Hier herrscht die milde Wärme im Kühlschrank. Ideal für verzehrfertige Speisen, Reste und Käse, der hier sein Aroma am besten entfaltet.'
        },
        {
            id: 'middle',
            name: 'Mittleres Fach',
            tempRange: '5 °C',
            icon: '🥛',
            items: ['Joghurt', 'Quark', 'Frischmilch', 'Sahne'],
            description: 'Der perfekte Platz für alle Milchprodukte. Gleichbleibende Kälte schützt empfindliche Milchsäurebakterien.'
        },
        {
            id: 'bottom',
            name: 'Unteres Fach (Kältezone)',
            tempRange: '2–3 °C',
            icon: '❄️',
            items: ['Frischfleisch', 'Fisch', 'Geflügel', 'Hackfleisch'],
            description: 'Die kälteste Zone direkt über der Glasplatte. Hier müssen leicht verderbliche rohe Lebensmittel gelagert werden.'
        },
        {
            id: 'crisper',
            name: 'Gemüsefach',
            tempRange: '0–4 °C',
            icon: '🥦',
            items: ['Salat', 'Brokkoli', 'Karotten', 'Beeren', 'Kräuter'],
            description: 'Hohe Luftfeuchtigkeit schützt Knackiges vor dem Austrocknen. Achtung: Tomaten, Äpfel und Bananen gehören NICHT in den Kühlschrank!'
        },
        {
            id: 'door',
            name: 'Türfächer',
            tempRange: '10–15 °C',
            icon: '🚪',
            items: ['Butter', 'Eier', 'Dressings', 'Getränke', 'Senf & Saucen'],
            description: 'Der wärmste Bereich im Kühlschrank. Perfekt für Butter (bleibt streichzart), Eier und geöffnete Flaschen.'
        }
    ];

    override render() {
        const activeZone = this.zones.find(z => z.id === this.activeZoneId) || this.zones[0];

        return html`
            <div class="guide-card">
                <h4 class="title">🧊 Interaktiver Kühlschrank-Zone-Guide</h4>
                <p class="subtitle">Klicke auf eine Zone, um zu erfahren, wo Lebensmittel am längsten frisch bleiben:</p>

                <div class="fridge-graphic">
                    ${this.zones.map(z => html`
                        <div class="fridge-zone ${z.id === this.activeZoneId ? 'active' : ''}" @click="${() => this.activeZoneId = z.id}">
                            <div class="zone-left">
                                <span class="zone-icon">${z.icon}</span>
                                <span class="zone-name">${z.name}</span>
                            </div>
                            <span class="zone-temp">${z.tempRange}</span>
                        </div>
                    `)}
                </div>

                <div class="detail-box">
                    <h5 class="detail-title">${activeZone.icon} ${activeZone.name} (${activeZone.tempRange})</h5>
                    <p class="detail-desc">${activeZone.description}</p>

                    <div class="item-chips">
                        ${activeZone.items.map(item => html`<span class="chip">${item}</span>`)}
                    </div>
                </div>
            </div>
        `;
    }
}
