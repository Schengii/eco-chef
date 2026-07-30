import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PantryItemAdvanced } from '../models/eco-chef.models';
import './eco-chef-seasonal-calendar';
import './eco-chef-fridge-guide';

@customElement('eco-chef-pantry')
export class EcoChefPantry extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }
        .pantry-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: var(--shadow-md);
            margin-bottom: 24px;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .scan-btn {
            background: var(--primary-gradient);
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
            transition: all 0.2s;
            font-family: inherit;
        }
        .scan-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
        }
        .add-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
            background: var(--bg-color);
            padding: 16px;
            border-radius: 18px;
            border: 2px solid var(--border);
        }
        .form-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .form-row input, .form-row select {
            padding: 12px;
            border-radius: 12px;
            border: 2px solid var(--border);
            background: var(--surface);
            color: var(--text-dark);
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
        }
        .input-name {
            flex: 2 1 200px;
        }
        .input-qty {
            flex: 1 1 70px;
            max-width: 100px;
        }
        .input-unit {
            flex: 1 1 80px;
            max-width: 120px;
        }
        .input-date {
            flex: 1.5 1 130px;
        }
        .input-loc {
            flex: 1.5 1 130px;
        }
        .add-btn {
            background: var(--text-dark);
            color: var(--surface);
            border: none;
            padding: 12px;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            font-family: inherit;
            transition: opacity 0.2s;
        }
        .add-btn:hover {
            opacity: 0.9;
        }
        
        /* Categories Grouping */
        .location-section {
            margin-top: 20px;
        }
        .location-title {
            font-size: 14px;
            font-weight: 850;
            color: var(--primary-dark);
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dark-theme .location-title {
            color: var(--primary);
        }
        
        .pantry-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 16px;
        }
        .pantry-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: var(--bg-color);
            border: 2px solid var(--border);
            border-radius: 16px;
            transition: border-color 0.2s;
        }
        .pantry-row:hover {
            border-color: var(--primary);
        }
        .item-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
        }
        .item-main {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .item-name {
            font-size: 15px;
            font-weight: 800;
            color: var(--text-dark);
        }
        .item-quantity-badge {
            background: var(--border);
            color: var(--text-dark);
            font-size: 11px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 8px;
        }
        .item-expiry-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .item-expiry {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
        }
        .status-badge.fresh {
            background: #dcfce7;
            color: #15803d;
        }
        .status-badge.warning {
            background: #fef3c7;
            color: #d97706;
        }
        .status-badge.expired {
            background: #fee2e2;
            color: #dc2626;
        }
        .status-badge.none {
            background: #f1f5f9;
            color: #64748b;
        }
        .actions-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .row-btn {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 10px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .row-btn:hover {
            border-color: var(--primary);
            background: var(--primary-light);
        }
        .row-btn.delete:hover {
            border-color: #ef4444;
            background: #fee2e2;
        }
        .loader {
            border: 3px solid var(--border);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    @property({ type: Array }) pantryItems: PantryItemAdvanced[] = [];
    @property({ type: Boolean }) isScanning = false;

    @state() private newItemName = '';
    @state() private newItemQuantity = 1;
    @state() private newItemUnit = 'Stk.';
    @state() private newItemExpiry = '';
    @state() private newItemLocation: 'Kühlschrank' | 'Vorratskammer' | 'Gefrierfach' | 'Sonstiges' = 'Kühlschrank';
    @state() private barcodeInput = '';

    @state() private selectedLocationFilter: string = 'all';
    @state() private sortBy: string = 'expiry';

    private handleTriggerMysteryBox() {
        this.dispatchEvent(new CustomEvent('trigger-mystery-box', {
            bubbles: true,
            composed: true
        }));
    }

    private getDaysRemaining(expiryDateStr?: string): number | null {
        if (!expiryDateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDateStr);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private getNutriScoreBadge(score?: 'a' | 'b' | 'c' | 'd' | 'e') {
        if (!score) return '';
        const colors: { [key: string]: string } = {
            a: '#15803d',
            b: '#84cc16',
            c: '#eab308',
            d: '#f97316',
            e: '#ef4444'
        };
        return html`
            <span style="background: ${colors[score] || '#64748b'}; color: #ffffff; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
                Nutri-Score ${score.toUpperCase()}
            </span>
        `;
    }

    private handleBarcodeSearch() {
        if (!this.barcodeInput.trim()) return;
        this.dispatchEvent(new CustomEvent('search-barcode', {
            detail: { barcode: this.barcodeInput.trim() },
            bubbles: true,
            composed: true
        }));
        this.barcodeInput = '';
    }

    private getStatusBadge(days: number | null) {
        if (days === null) return html`<span class="status-badge none">Kein MHD</span>`;
        if (days < 0) return html`<span class="status-badge expired">Abgelaufen (${Math.abs(days)} T.)</span>`;
        if (days <= 3) return html`<span class="status-badge warning">Läuft ab (${days} T.)</span>`;
        return html`<span class="status-badge fresh">Haltbar (${days} T.)</span>`;
    }

    private handleAdd() {
        if (!this.newItemName.trim()) return;
        this.dispatchEvent(new CustomEvent('add-pantry-item', {
            detail: {
                name: this.newItemName.trim(),
                expiryDate: this.newItemExpiry || undefined,
                quantity: Number(this.newItemQuantity) || 1,
                unit: this.newItemUnit,
                location: this.newItemLocation
            },
            bubbles: true,
            composed: true
        }));
        this.newItemName = '';
        this.newItemExpiry = '';
        this.newItemQuantity = 1;
        this.newItemUnit = 'Stk.';
        this.newItemLocation = 'Kühlschrank';
    }

    private handleDelete(name: string) {
        this.dispatchEvent(new CustomEvent('delete-pantry-item', {
            detail: { name },
            bubbles: true,
            composed: true
        }));
    }

    private handleUseItem(name: string) {
        this.dispatchEvent(new CustomEvent('use-pantry-item', {
            detail: { name },
            bubbles: true,
            composed: true
        }));
    }

    private handleScanTrigger() {
        this.dispatchEvent(new CustomEvent('trigger-receipt-scan', {
            bubbles: true,
            composed: true
        }));
    }

    private handlePantryItemScanTrigger() {
        this.dispatchEvent(new CustomEvent('trigger-product-scan', {
            bubbles: true,
            composed: true
        }));
    }

    override render() {
        // Filter & Sort items
        let processedItems = [...this.pantryItems];

        if (this.selectedLocationFilter === 'urgent') {
            processedItems = processedItems.filter(item => {
                const days = this.getDaysRemaining(item.expiryDate);
                return days !== null && days <= 3;
            });
        } else if (this.selectedLocationFilter !== 'all') {
            processedItems = processedItems.filter(item => (item.location || 'Sonstiges') === this.selectedLocationFilter);
        }

        if (this.sortBy === 'expiry') {
            processedItems.sort((a, b) => {
                const daysA = this.getDaysRemaining(a.expiryDate) ?? 9999;
                const daysB = this.getDaysRemaining(b.expiryDate) ?? 9999;
                return daysA - daysB;
            });
        } else if (this.sortBy === 'name') {
            processedItems.sort((a, b) => a.name.localeCompare(b.name, 'de'));
        }

        // Group items by location
        const grouped: { [key: string]: PantryItemAdvanced[] } = {
            'Kühlschrank': [],
            'Vorratskammer': [],
            'Gefrierfach': [],
            'Sonstiges': []
        };

        processedItems.forEach(item => {
            const loc = item.location || 'Sonstiges';
            if (grouped[loc]) {
                grouped[loc].push(item);
            } else {
                grouped['Sonstiges'].push(item);
            }
        });

        const locationEmojis: { [key: string]: string } = {
            'Kühlschrank': '❄️ Kühlschrank',
            'Vorratskammer': '🌾 Vorratskammer',
            'Gefrierfach': '🧊 Gefrierfach',
            'Sonstiges': '📦 Sonstiges'
        };

        return html`
            <div class="pantry-card">
                <div class="section-header" style="flex-wrap: wrap; gap: 8px;">
                    <h3 class="title">🥫 Meine Reste-Kammer</h3>
                    ${this.isScanning ? html`
                        <div class="loader"></div>
                    ` : html`
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="scan-btn" @click="${this.handleScanTrigger}">
                                🧾 Bon scannen
                            </button>
                            <button class="scan-btn" @click="${this.handlePantryItemScanTrigger}" style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-color: #6d28d9;">
                                📸 Produkt & MHD scannen
                            </button>
                            <button class="scan-btn" @click="${this.handleTriggerMysteryBox}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-color: #b45309;">
                                🎲 Restekiste Zaubern
                            </button>
                        </div>
                    `}
                </div>

                <div class="add-form">
                    <div class="form-row">
                        <input class="input-name" type="text" placeholder="Zutat (z.B. Tomaten)" .value="${this.newItemName}" @input="${(e: Event) => this.newItemName = (e.target as HTMLInputElement).value}" />
                        <input class="input-qty" type="number" placeholder="Menge" .value="${this.newItemQuantity.toString()}" @input="${(e: Event) => this.newItemQuantity = Number((e.target as HTMLInputElement).value)}" min="0.1" step="any" />
                        <select class="input-unit" .value="${this.newItemUnit}" @change="${(e: Event) => this.newItemUnit = (e.target as HTMLSelectElement).value}">
                            <option value="Stk.">Stk.</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="Pkg.">Pkg.</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <input class="input-date" type="date" .value="${this.newItemExpiry}" @input="${(e: Event) => this.newItemExpiry = (e.target as HTMLInputElement).value}" title="Mindesthaltbarkeitsdatum" />
                        <select class="input-loc" .value="${this.newItemLocation}" @change="${(e: Event) => this.newItemLocation = (e.target as HTMLSelectElement).value as any}">
                            <option value="Kühlschrank">Kühlschrank ❄️</option>
                            <option value="Vorratskammer">Vorratskammer 🌾</option>
                            <option value="Gefrierfach">Gefrierfach 🧊</option>
                            <option value="Sonstiges">Sonstiges 📦</option>
                        </select>
                    </div>
                    <div class="form-row" style="align-items: center; gap: 8px;">
                        <input type="text" 
                               placeholder="🔍 Barcode / EAN suchen (OpenFoodFacts)" 
                               .value="${this.barcodeInput}" 
                               @input="${(e: Event) => this.barcodeInput = (e.target as HTMLInputElement).value}" 
                               style="flex: 1; padding: 10px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface); color: var(--text-dark); font-family: inherit; font-size: 13px;" />
                        <button class="scan-btn" @click="${this.handleBarcodeSearch}" style="padding: 10px 14px; font-size: 12px;">
                            EAN Abfragen
                        </button>
                    </div>
                    <button class="add-btn" @click="${this.handleAdd}">Manuell Hinzufügen</button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="scan-btn" style="padding: 6px 12px; font-size: 12px; opacity: ${this.selectedLocationFilter === 'all' ? '1' : '0.65'};" @click="${() => this.selectedLocationFilter = 'all'}">
                            Alle (${this.pantryItems.length})
                        </button>
                        <button class="scan-btn" style="padding: 6px 12px; font-size: 12px; opacity: ${this.selectedLocationFilter === 'Kühlschrank' ? '1' : '0.65'};" @click="${() => this.selectedLocationFilter = 'Kühlschrank'}">
                            ❄️ Kühlschrank
                        </button>
                        <button class="scan-btn" style="padding: 6px 12px; font-size: 12px; opacity: ${this.selectedLocationFilter === 'Vorratskammer' ? '1' : '0.65'};" @click="${() => this.selectedLocationFilter = 'Vorratskammer'}">
                            🌾 Kammer
                        </button>
                        <button class="scan-btn" style="padding: 6px 12px; font-size: 12px; opacity: ${this.selectedLocationFilter === 'Gefrierfach' ? '1' : '0.65'};" @click="${() => this.selectedLocationFilter = 'Gefrierfach'}">
                            🧊 Tiefkühl
                        </button>
                        <button class="scan-btn" style="padding: 6px 12px; font-size: 12px; background: #fee2e2; color: #dc2626; border-color: #fca5a5; opacity: ${this.selectedLocationFilter === 'urgent' ? '1' : '0.75'};" @click="${() => this.selectedLocationFilter = 'urgent'}">
                            🚨 Bald ablaufend
                        </button>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-dark);">Sortierung:</span>
                        <select .value="${this.sortBy}" @change="${(e: Event) => this.sortBy = (e.target as HTMLSelectElement).value}" style="padding: 6px 10px; border-radius: 10px; border: 2px solid var(--border); font-size: 12px; background: var(--surface); color: var(--text-dark);">
                            <option value="expiry">⏰ Nächstes MHD zuerst</option>
                            <option value="name">🔤 Name (A-Z)</option>
                        </select>
                    </div>
                </div>

                ${processedItems.length === 0 ? html`
                    <p style="text-align: center; color: var(--text-muted); font-weight: 700; font-size: 14px;">
                        Keine Vorräte für den gewählten Filter gefunden.
                    </p>
                ` : html`
                    ${Object.keys(grouped).map(loc => {
                        const items = grouped[loc];
                        if (items.length === 0) return '';
                        return html`
                            <div class="location-section">
                                <h4 class="location-title">${locationEmojis[loc]}</h4>
                                <div class="pantry-list">
                                    ${items.map(item => {
                                        const days = this.getDaysRemaining(item.expiryDate);
                                        return html`
                                            <div class="pantry-row">
                                                <div class="item-info">
                                                    <div class="item-main">
                                                        <span class="item-name">${item.name}</span>
                                                        <span class="item-quantity-badge">${item.quantity || 1} ${item.unit || 'Stk.'}</span>
                                                        ${this.getNutriScoreBadge(item.nutriScore)}
                                                    </div>
                                                    <div class="item-expiry-row">
                                                        ${this.getStatusBadge(days)}
                                                    </div>
                                                </div>
                                                <div class="actions-group">
                                                    <button class="row-btn" @click="${() => this.handleUseItem(item.name)}" title="Als Zutat zum Kochen auswählen">
                                                        🍳
                                                    </button>
                                                    <button class="row-btn delete" @click="${() => this.handleDelete(item.name)}" title="Löschen">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    })}
                                </div>
                            </div>
                        `;
                    })}
                `}
            </div>

            <eco-chef-seasonal-calendar></eco-chef-seasonal-calendar>
            <eco-chef-fridge-guide></eco-chef-fridge-guide>
        `;
    }
}
