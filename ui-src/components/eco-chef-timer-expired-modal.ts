import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';

@customElement('eco-chef-timer-expired-modal')
export class EcoChefTimerExpiredModal extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Boolean }) showTimerExpiredModal = false;
    @property({ type: String }) timerLabel = '';

    private _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    override render() {
        if (!this.showTimerExpiredModal) return '';
        return html`
            <div class="modal-overlay" style="z-index: 2500;">
                <div class="modal-content" style="text-align: center; border-radius: 24px; padding: 32px 24px;">
                    <h3 style="color: #ef4444; font-size: 28px; margin-top: 0;">⏰ Timer abgelaufen!</h3>
                    ${this.timerLabel ? html`<p style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: var(--text-dark);">${this.timerLabel}</p>` : ''}
                    <p style="font-size: 18px; margin-bottom: 32px; color: var(--text-dark);">Dein Essen braucht jetzt deine Aufmerksamkeit!</p>
                    <button class="main-btn" @click="${this._close}" style="background-color: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); border: 2px solid #b91c1c;" aria-label="Alarm stoppen">
                        Alarm stoppen ⏹️
                    </button>
                </div>
            </div>
        `;
    }
}
