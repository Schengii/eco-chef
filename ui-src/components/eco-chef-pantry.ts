import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PantryItemAdvanced } from '../models/eco-chef.models';
import './eco-chef-seasonal-calendar';

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
            gap: 10px;
            margin-bottom: 24px;
            background: var(--bg-color);
            padding: 16px;
            border-radius: 18px;
            border: 2px solid var(--border);
        }
        .form-row {
            display: flex;
            gap: 10px;
        }
        .form-row input[type="text"] {
            flex-grow: 2;
            margin-bottom: 0;
            padding: 12px;
            border-radius: 12px;
        }
        .form-row input[type="date"] {
            flex-grow: 1;
            margin-bottom: 0;
            padding: 12px;
            border-radius: 12px;
            border: 2px solid var(--border);
            background: var(--surface);
            color: var(--text-dark);
            font-family: inherit;
            font-size: 14px;
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
        .pantry-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
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
        }
        .item-name {
            font-size: 15px;
            font-weight: 800;
            color: var(--text-dark);
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
    @state() private newItemExpiry = '';

    private getDaysRemaining(expiryDateStr?: string): number | null {
        if (!expiryDateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDateStr);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
                expiryDate: this.newItemExpiry || undefined
            },
            bubbles: true,
            composed: true
        }));
        this.newItemName = '';
        this.newItemExpiry = '';
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

    override render() {
        return html`
            <div class="pantry-card">
                <div class="section-header">
                    <h3 class="title">🥫 Meine Reste-Kammer</h3>
                    ${this.isScanning ? html`
                        <div class="loader"></div>
                    ` : html`
                        <button class="scan-btn" @click="${this.handleScanTrigger}">
                            🧾 Bon scannen
                        </button>
                    `}
                </div>

                <div class="add-form">
                    <div class="form-row">
                        <input type="text" placeholder="Zutat hinzufügen (z.B. Tomaten)" .value="${this.newItemName}" @input="${(e: Event) => this.newItemName = (e.target as HTMLInputElement).value}" />
                        <input type="date" .value="${this.newItemExpiry}" @input="${(e: Event) => this.newItemExpiry = (e.target as HTMLInputElement).value}" />
                    </div>
                    <button class="add-btn" @click="${this.handleAdd}">Hinzufügen</button>
                </div>

                ${this.pantryItems.length === 0 ? html`
                    <p style="text-align: center; color: var(--text-muted); font-weight: 700; font-size: 14px;">
                        Deine Vorratskammer ist leer.
                    </p>
                ` : html`
                    <div class="pantry-list">
                        ${this.pantryItems.map(item => {
                            const days = this.getDaysRemaining(item.expiryDate);
                            return html`
                                <div class="pantry-row">
                                    <div class="item-info">
                                        <span class="item-name">${item.name}</span>
                                        ${this.getStatusBadge(days)}
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
                `}
            </div>

            <eco-chef-seasonal-calendar></eco-chef-seasonal-calendar>
        `;
    }
}
