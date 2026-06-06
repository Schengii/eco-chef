import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { Recipe } from '../models/eco-chef.models';

@customElement('eco-chef-cooking-mode')
export class EcoChefCookingMode extends LitElement {
    static override styles = ecoChefStyles;

    @property({ type: Object }) recipe: Recipe | null = null;
    @property({ type: Number }) currentCookingStep = 0;
    @property({ type: Number }) timerSecondsRemaining = 0;
    @property({ type: Number }) currentStepTimeMinutes: number | null = null;
    @property({ type: Boolean }) isVoiceControlActive = false;
    @property({ type: String }) voiceStatusText = '';

    private _formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    private _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    private _prevStep() {
        this.dispatchEvent(new CustomEvent('prev-step', { bubbles: true, composed: true }));
    }

    private _nextStep() {
        this.dispatchEvent(new CustomEvent('next-step', { bubbles: true, composed: true }));
    }

    private _readStep() {
        this.dispatchEvent(new CustomEvent('read-step', { bubbles: true, composed: true }));
    }

    private _toggleVoice() {
        this.dispatchEvent(new CustomEvent('toggle-voice', { bubbles: true, composed: true }));
    }

    private _startTimer() {
        this.dispatchEvent(new CustomEvent('start-timer', { bubbles: true, composed: true }));
    }

    private _stopTimer() {
        this.dispatchEvent(new CustomEvent('stop-timer', { bubbles: true, composed: true }));
    }

    override render() {
        if (!this.recipe) return '';

        return html`
            <div class="modal-overlay cooking-mode-overlay">
                <div class="modal-content cooking-content" style="position: relative;">

                    <div class="cooking-header">
                        <span class="step-counter">Schritt ${this.currentCookingStep + 1} von ${this.recipe.instructions.length}</span>
                        <button class="close-cooking-btn" @click="${this._close}" aria-label="Kochmodus beenden">❌ Beenden</button>
                    </div>

                    <div class="step-display" style="position: relative;">
                        <p>${this.recipe.instructions[this.currentCookingStep]}</p>
                    </div>

                    ${this.timerSecondsRemaining > 0 ? html`
                        <div class="timer-display">
                            <span class="timer-countdown">⏳ ${this._formatTime(this.timerSecondsRemaining)}</span>
                            <button class="stop-timer-btn" @click="${this._stopTimer}" aria-label="Timer abbrechen">⏹️ Abbrechen</button>
                        </div>
                    ` : this.currentStepTimeMinutes ? html`
                        <div class="timer-display">
                            <button class="start-timer-btn" @click="${this._startTimer}" aria-label="Timer über ${this.currentStepTimeMinutes} Minuten starten">
                                ⏳ ${this.currentStepTimeMinutes} Min. Timer starten
                            </button>
                        </div>
                    ` : ''}

                    <!-- Sprachsteuerung Status-Bar -->
                    ${this.isVoiceControlActive ? html`
                        <div class="voice-status-bar" role="status" aria-live="polite">
                            <div class="mic-pulse"></div>
                            <span>Sprachsteuerung aktiv: <em>${this.voiceStatusText || 'Hört zu... (Befehle: weiter, zurück, vorlesen, stoppen)'}</em></span>
                        </div>
                    ` : ''}

                    <div class="cooking-controls">
                        <button class="control-btn" @click="${this._prevStep}" ?disabled="${this.currentCookingStep === 0}" aria-label="Vorheriger Schritt">⬅️ Zurück</button>
                        
                        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1.5;">
                            <button class="main-btn voice-btn" @click="${this._readStep}" aria-label="Aktuellen Schritt vorlesen">🔊 Vorlesen</button>
                            <button class="secondary-btn" @click="${this._toggleVoice}" style="padding: 8px 12px; font-size: 13px; font-weight: bold; border-color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--border)'}; color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--text-dark)'};" aria-label="${this.isVoiceControlActive ? 'Sprachsteuerung deaktivieren' : 'Freihändige Sprachsteuerung aktivieren'}">
                                ${this.isVoiceControlActive ? '🎙️ Stumm schalten' : '🎙️ Sprachsteuerung start'}
                            </button>
                        </div>

                        <button class="control-btn" @click="${this._nextStep}" ?disabled="${this.currentCookingStep === this.recipe.instructions.length - 1}" aria-label="Nächster Schritt">Weiter ➡️</button>
                    </div>

                </div>
            </div>
        `;
    }
}
