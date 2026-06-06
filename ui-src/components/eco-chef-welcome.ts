import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';

@customElement('eco-chef-welcome')
export class EcoChefWelcome extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Boolean }) isDarkMode = false;
    @property({ type: Boolean }) isLrsMode = false;

    private _toggleDarkMode() {
        this.dispatchEvent(new CustomEvent('toggle-dark-mode', { bubbles: true, composed: true }));
    }

    private _toggleLrsMode() {
        this.dispatchEvent(new CustomEvent('toggle-lrs-mode', { bubbles: true, composed: true }));
    }

    private _enterApp() {
        this.dispatchEvent(new CustomEvent('enter-app', { bubbles: true, composed: true }));
    }

    override render() {
        return html`
            <div class="welcome-container">
                <div class="welcome-logo-area">
                    <span class="welcome-logo" role="img" aria-label="EcoChef Logo">🍳</span>
                </div>
                
                <h1 class="welcome-title">EcoChef</h1>
                <p class="welcome-desc">
                    Dein intelligenter KI-Rezept-Zauberer. Koche kreativ mit deinen Kühlschrankzutaten, schütze die Umwelt und genieße maximale Barrierefreiheit.
                </p>

                <!-- Schnell-Einstellungen vor dem Start -->
                <div class="welcome-quick-settings">
                    <h4>⚙️ Barrierefreiheit & Design</h4>
                    
                    <div class="toggle-container" style="background: transparent; border: none; margin-bottom: 12px; padding: 0; display: flex; align-items: center; gap: 12px; justify-content: center;">
                        <label class="toggle-switch" for="dark-mode-welcome">
                            <input type="checkbox"
                                   id="dark-mode-welcome"
                                   .checked="${this.isDarkMode}"
                                   @change="${this._toggleDarkMode}"
                                   aria-label="Dunkelmodus umschalten">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="font-weight: 700; color: var(--text-dark);">
                            Dunkelmodus: ${this.isDarkMode ? 'Ein 🌙' : 'Aus ☀️'}
                        </span>
                    </div>

                    <div class="toggle-container" style="background: transparent; border: none; margin-bottom: 0; padding: 0; display: flex; align-items: center; gap: 12px; justify-content: center;">
                        <label class="toggle-switch" for="lrs-mode-welcome">
                            <input type="checkbox"
                                   id="lrs-mode-welcome"
                                   .checked="${this.isLrsMode}"
                                   @change="${this._toggleLrsMode}"
                                   aria-label="LRS-Lesehilfe aktivieren">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label" style="font-weight: 700; color: var(--text-dark);">
                            LRS-Modus (Lesehilfe): ${this.isLrsMode ? 'Ein 👁️' : 'Aus'}
                        </span>
                    </div>
                </div>

                <button class="welcome-enter-btn" @click="${this._enterApp}" aria-label="Küche betreten und App starten">
                    Küche betreten 🧑‍🍳
                </button>
            </div>
        `;
    }
}
