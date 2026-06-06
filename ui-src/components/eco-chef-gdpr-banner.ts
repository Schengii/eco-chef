import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';

@customElement('eco-chef-gdpr-banner')
export class EcoChefGdprBanner extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Boolean }) hasConsent = false;

    private _acceptConsent() {
        this.dispatchEvent(new CustomEvent('accept-consent', { bubbles: true, composed: true }));
    }

    private _togglePrivacy() {
        this.dispatchEvent(new CustomEvent('toggle-privacy', { bubbles: true, composed: true }));
    }

    override render() {
        if (this.hasConsent) return '';
        return html`
            <div class="gdpr-banner" role="dialog" aria-labelledby="gdpr-title" aria-describedby="gdpr-desc">
                <h3 id="gdpr-title" style="margin-top: 0; font-size: 20px; font-weight: 800; color: var(--text-dark);">🛡️ Datenschutzeinwilligung</h3>
                <p id="gdpr-desc" class="gdpr-text">
                    Um personalisierte Rezepte mit Künstlicher Intelligenz zu erstellen, sendet diese App Ihre Zutatenliste und ggf. Fotos an die <strong>Google Gemini API</strong>. 
                    Ihre Einstellungen, die Einkaufsliste und Rezepte werden <strong>ausschließlich lokal auf Ihrem Gerät gespeichert</strong>. Es werden keine sonstigen Tracker oder Analysedienste verwendet.
                </p>
                <div class="gdpr-buttons">
                    <button class="main-btn" @click="${this._acceptConsent}" aria-label="Einwilligen und fortfahren">Zustimmen & Fortfahren</button>
                    <button class="secondary-btn" @click="${this._togglePrivacy}" aria-label="Datenschutzerklärung anzeigen">Datenschutzerklärung anzeigen</button>
                </div>
            </div>
        `;
    }
}
