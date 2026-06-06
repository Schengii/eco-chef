import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';

@customElement('eco-chef-privacy-modal')
export class EcoChefPrivacyModal extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Boolean }) showPrivacyDetails = false;

    private _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    override render() {
        if (!this.showPrivacyDetails) return '';
        return html`
            <div class="modal-overlay" style="z-index: 3000;">
                <div class="modal-content" style="max-height: 80vh; overflow-y: auto; border-radius: 24px;">
                    <h3 style="margin-top: 0; font-size: 22px; color: var(--text-dark);">Datenschutzerklärung EcoChef</h3>
                    <div style="font-size: 14px; line-height: 1.6; text-align: left; color: var(--text-dark);">
                        <p><strong>1. Lokale Speicherung</strong><br>
                        Alle von Ihnen erstellten Rezepte, die Einkaufsliste und Ihre Einstellungen werden ausschließlich lokal in der <code>localStorage</code> Ihres Browsers bzw. Geräts gespeichert. Diese Daten verlassen Ihr Gerät nicht, es sei denn, Sie nutzen die Teilen-Funktion.</p>
                        
                        <p><strong>2. Nutzung der Google Gemini API</strong><br>
                        Wenn Sie die Funktion "Rezept Zaubern" nutzen, werden die eingegebenen Zutaten, Portionsgrößen sowie das Kühlschrankfoto an Server von Google (Gemini API) übertragen, um das Rezept zu generieren. Google verarbeitet diese Daten gemäß seinen API-Datenschutzbestimmungen. Es werden keine Identifikatoren Ihres Geräts an Google übermittelt.</p>
                        
                        <p><strong>3. Ihre Rechte (DSGVO)</strong><br>
                        Da alle Daten lokal gespeichert werden, haben Sie die volle Kontrolle: Sie können alle Daten über die App-Einstellungen ("Alle App-Daten löschen") oder durch das Löschen der Browserdaten Ihres Geräts unwiderruflich entfernen. Damit wird Ihr Recht auf Löschung (Art. 17 DSGVO) vollständig gewahrt.</p>
                        
                        <p><strong>4. Kontakt</strong><br>
                        EcoChef App - Lokale Cordova App ohne externe Server-Datenbank.</p>
                    </div>
                    <button class="main-btn" @click="${this._close}" style="margin-top: 24px;" aria-label="Schließen">Schließen</button>
                </div>
            </div>
        `;
    }
}
