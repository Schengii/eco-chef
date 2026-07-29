import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MarketLocation } from '../models/eco-chef.models';

@customElement('eco-chef-regional-map')
export class EcoChefRegionalMap extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }
        .map-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: var(--shadow-md);
        }
        .section-title {
            font-size: 20px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin: 0 0 20px 0;
            font-weight: 500;
        }
        .filter-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .chip {
            padding: 8px 14px;
            border-radius: 20px;
            border: 2px solid var(--border);
            background: var(--bg-color);
            color: var(--text-dark);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .chip.active {
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
            box-shadow: 0 2px 6px rgba(21, 128, 61, 0.3);
        }
        .search-input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 14px;
            border: 2px solid var(--border);
            background: var(--bg-color);
            color: var(--text-dark);
            font-size: 14px;
            font-family: inherit;
            margin-bottom: 16px;
            box-sizing: border-box;
        }
        .search-input:focus {
            outline: none;
            border-color: var(--primary);
        }
        .market-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .market-item {
            background: var(--bg-color);
            border: 2px solid var(--border);
            border-radius: 18px;
            padding: 16px;
            transition: all 0.2s ease;
        }
        .market-item:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
        }
        .market-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .market-name {
            font-size: 16px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0;
        }
        .type-badge {
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 12px;
            background: var(--primary-light);
            color: var(--primary-dark);
        }
        .market-address {
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .market-meta {
            font-size: 12px;
            color: var(--text-dark);
            font-weight: 600;
            margin-bottom: 12px;
        }
        .specialties-group {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }
        .spec-tag {
            font-size: 11px;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 3px 8px;
            border-radius: 10px;
            color: var(--text-muted);
        }
        .add-btn {
            width: 100%;
            background: var(--primary-gradient);
            color: #ffffff;
            border: none;
            padding: 10px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            transition: transform 0.2s ease;
            font-family: inherit;
        }
        .add-btn:hover {
            transform: scale(1.02);
        }
    `;

    @property({ type: Array }) markets: MarketLocation[] = [
        {
            id: 'm1',
            name: 'Zentraler Wochenmarkt',
            type: 'Wochenmarkt',
            address: 'Marktplatz 1, 80331 München',
            distanceKm: 0.8,
            openHours: 'Di & Fr: 07:00 - 13:00 Uhr',
            specialties: ['🥬 Frisches Gemüse', '🍎 Bio-Obst', '🧀 Käse vom Senner']
        },
        {
            id: 'm2',
            name: 'Bio-Hofgut Sonnenberg',
            type: 'Hofladen',
            address: 'Sonnenweg 12, 82008 Unterhaching',
            distanceKm: 3.4,
            openHours: 'Mo-Sa: 08:00 - 18:00 Uhr',
            specialties: ['🥚 Freilandeier', '🥔 Kartoffeln', '🥛 Frischmilch']
        },
        {
            id: 'm3',
            name: 'Unverpackt & Regional Laden',
            type: 'Unverpackt',
            address: 'Hauptstraße 45, 80469 München',
            distanceKm: 1.5,
            openHours: 'Mo-Fr: 09:30 - 19:00 Uhr, Sa: 09:00 - 16:00 Uhr',
            specialties: ['🫘 Hülsenfrüchte', '🌾 Bio-Getreide', '🫒 Olivenöl vom Fass']
        }
    ];

    @state() private selectedType: string = 'all';
    @state() private searchQuery: string = '';

    private _filterMarkets() {
        return this.markets.filter(m => {
            const matchesType = this.selectedType === 'all' || m.type === this.selectedType;
            const matchesSearch = !this.searchQuery.trim() || 
                m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                m.address.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }

    private _addSpecialtiesToShopping(market: MarketLocation) {
        market.specialties.forEach(spec => {
            const cleanName = spec.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').trim();
            this.dispatchEvent(new CustomEvent('add-shopping-item', {
                detail: { name: `${cleanName} (${market.name})` },
                bubbles: true,
                composed: true
            }));
        });
        alert(`🛒 Zutaten vom "${market.name}" wurden zu deiner Einkaufsliste hinzugefügt!`);
    }

    override render() {
        const filtered = this._filterMarkets();

        return html`
            <div class="map-card">
                <h3 class="section-title">🌾 Regionalitäts- & Markt-Finder</h3>
                <p class="section-subtitle">Finde Wochenmärkte, Hofläden und Unverpackt-Geschäfte in deiner Nähe für nachhaltiges Kochen.</p>

                <input type="text" 
                       class="search-input" 
                       placeholder="🔍 Markt oder Ort suchen..."
                       .value="${this.searchQuery}"
                       @input="${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}" 
                       aria-label="Markt suchen" />

                <div class="filter-row">
                    <button class="chip ${this.selectedType === 'all' ? 'active' : ''}" 
                            @click="${() => this.selectedType = 'all'}">Alle Orte</button>
                    <button class="chip ${this.selectedType === 'Wochenmarkt' ? 'active' : ''}" 
                            @click="${() => this.selectedType = 'Wochenmarkt'}">🌾 Wochenmärkte</button>
                    <button class="chip ${this.selectedType === 'Hofladen' ? 'active' : ''}" 
                            @click="${() => this.selectedType = 'Hofladen'}">🍏 Hofläden</button>
                    <button class="chip ${this.selectedType === 'Unverpackt' ? 'active' : ''}" 
                            @click="${() => this.selectedType = 'Unverpackt'}">📦 Unverpackt</button>
                </div>

                <div class="market-list">
                    ${filtered.length === 0 ? html`
                        <p style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 20px;">Keine Märkte für deine Suche gefunden.</p>
                    ` : filtered.map(m => html`
                        <div class="market-item">
                            <div class="market-header">
                                <h4 class="market-name">${m.name}</h4>
                                <span class="type-badge">${m.type}</span>
                            </div>
                            <div class="market-address">📍 ${m.address} (${m.distanceKm} km entfernt)</div>
                            <div class="market-meta">🕒 ${m.openHours}</div>
                            
                            <div class="specialties-group">
                                ${m.specialties.map(s => html`<span class="spec-tag">${s}</span>`)}
                            </div>

                            <button class="add-btn" @click="${() => this._addSpecialtiesToShopping(m)}">
                                🛒 Markt-Spezialitäten auf Einkaufsliste setzen
                            </button>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
}
