import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { Recipe, ActiveTimer } from '../models/eco-chef.models';

@customElement('eco-chef-cooking-mode')
export class EcoChefCookingMode extends LitElement {
    static override styles = [
        ecoChefStyles,
        css`
            .cooking-modal-content {
                max-width: 650px;
                width: 90%;
                background: var(--surface);
                border: 2px solid var(--border);
                border-radius: 28px;
                padding: 24px;
                box-shadow: var(--shadow-lg);
                display: flex;
                flex-direction: column;
                gap: 20px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            /* Timeline / Steps progress */
            .steps-timeline {
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: var(--bg-color);
                border: 2px solid var(--border);
                padding: 16px;
                border-radius: 20px;
            }
            .timeline-step {
                font-size: 13px;
                color: var(--text-muted);
                opacity: 0.6;
                padding: 4px 8px;
                border-radius: 8px;
            }
            .timeline-step.active {
                font-size: 16px;
                font-weight: 850;
                color: var(--primary-dark);
                background: var(--primary-light);
                opacity: 1;
                border-left: 4px solid var(--primary);
                padding: 8px 12px;
            }
            .dark-theme .timeline-step.active {
                color: var(--primary);
            }
            
            /* Circular Timer Area */
            .main-timer-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                margin: 16px 0;
            }
            
            .circular-timer-container {
                position: relative;
                width: 140px;
                height: 140px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .circular-timer-svg {
                transform: rotate(-90deg);
                width: 100%;
                height: 100%;
            }
            
            .timer-circle-bg {
                fill: none;
                stroke: var(--border);
                stroke-width: 8;
            }
            
            .timer-circle-progress {
                fill: none;
                stroke: var(--primary);
                stroke-width: 8;
                stroke-linecap: round;
                transition: stroke-dashoffset 1s linear;
            }
            
            .timer-text-overlay {
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            
            .timer-time {
                font-size: 24px;
                font-weight: 900;
                color: var(--text-dark);
                font-variant-numeric: tabular-nums;
            }
            
            .timer-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                font-weight: 750;
            }
            
            /* Dashboard: Background Active Timers */
            .background-timers {
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: var(--bg-color);
                border: 2px solid var(--border);
                padding: 16px;
                border-radius: 20px;
            }
            .background-timers h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 850;
                color: var(--text-dark);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .bg-timer-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--surface);
                border: 2px solid var(--border);
                padding: 10px 14px;
                border-radius: 14px;
                font-size: 13px;
                gap: 12px;
            }
            .bg-timer-name {
                font-weight: 700;
                color: var(--text-dark);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
            }
            .bg-timer-time {
                font-weight: 900;
                color: var(--accent-dark);
                font-variant-numeric: tabular-nums;
            }
            .bg-timer-cancel {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                padding: 4px;
                border-radius: 8px;
                transition: transform 0.2s ease;
            }
            .bg-timer-cancel:hover {
                transform: scale(1.15);
            }
        `
    ];

    @property({ type: Object }) recipe: Recipe | null = null;
    @property({ type: Number }) currentCookingStep = 0;
    @property({ type: Number }) timerSecondsRemaining = 0;
    @property({ type: Number }) currentStepTimeMinutes: number | null = null;
    @property({ type: Boolean }) isVoiceControlActive = false;
    @property({ type: String }) voiceStatusText = '';
    @property({ type: Array }) activeTimers: ActiveTimer[] = [];
    @property({ type: String }) assistantAnswer = '';

    @state() private questionInput = '';

    private _askAssistant() {
        if (!this.questionInput.trim()) return;
        this.dispatchEvent(new CustomEvent('ask-cooking-assistant', {
            detail: { question: this.questionInput.trim() },
            bubbles: true,
            composed: true
        }));
        this.questionInput = '';
    }

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

    private _startTimer(minutes?: number, label?: string) {
        this.dispatchEvent(new CustomEvent('start-timer', {
            detail: {
                minutes: typeof minutes === 'number' ? minutes : this.currentStepTimeMinutes,
                label: label || (this.recipe ? `Schritt ${this.currentCookingStep + 1}` : undefined)
            },
            bubbles: true,
            composed: true
        }));
    }

    private _promptCustomTimer() {
        const val = prompt("Timer-Dauer in Minuten eingeben:", "5");
        if (val) {
            const mins = parseInt(val, 10);
            if (!isNaN(mins) && mins > 0) {
                this._startTimer(mins, `Timer ${mins} Min.`);
            }
        }
    }

    private _stopTimer(id?: string) {
        this.dispatchEvent(new CustomEvent('stop-timer', { detail: { id }, bubbles: true, composed: true }));
    }

    override render() {
        if (!this.recipe) return '';

        const totalSteps = this.recipe.instructions.length;
        
        // Find active timer specifically for the current step index
        const currentStepTimer = this.activeTimers.find(t => t.stepIndex === this.currentCookingStep);
        
        // Find active timers running for other steps
        const backgroundTimers = this.activeTimers.filter(t => t.stepIndex !== this.currentCookingStep);

        // Calculations for Circle Progress
        const radius = 40;
        const circumference = 2 * Math.PI * radius; // ~251.32
        const secondsRemaining = currentStepTimer ? currentStepTimer.secondsRemaining : 0;
        const totalSeconds = currentStepTimer ? currentTimerTotalSeconds(currentStepTimer) : 1;
        const strokeDashoffset = circumference * (1 - (secondsRemaining / totalSeconds));

        function currentTimerTotalSeconds(t: ActiveTimer) {
            return t.totalSeconds > 0 ? t.totalSeconds : 1;
        }

        return html`
            <div class="modal-overlay cooking-mode-overlay">
                <div class="cooking-modal-content">

                    <div class="cooking-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 12px; margin-bottom: 8px;">
                        <span class="step-counter" style="font-weight: 850; font-size: 16px; color: var(--text-dark);">Schritt ${this.currentCookingStep + 1} von ${totalSteps}</span>
                        <button class="close-cooking-btn" @click="${this._close}" style="padding: 6px 12px; font-size: 12px; font-weight: 800; border-radius: 12px; background: hsl(0, 84.3%, 95%); border-color: hsl(0, 84.3%, 90%); color: hsl(0, 84.3%, 45%);" aria-label="Kochmodus beenden">❌ Beenden</button>
                    </div>

                    <!-- Schritt-Timeline (Dashboard) -->
                    <div class="steps-timeline">
                        ${this.currentCookingStep > 0 ? html`
                            <div class="timeline-step" @click="${this._prevStep}" style="cursor: pointer;">
                                ⬅️ ${this.recipe.instructions[this.currentCookingStep - 1].substring(0, 60)}...
                            </div>
                        ` : ''}
                        
                        <div class="timeline-step active">
                            ${this.recipe.instructions[this.currentCookingStep]}
                        </div>
                        
                        ${this.currentCookingStep < totalSteps - 1 ? html`
                            <div class="timeline-step" @click="${this._nextStep}" style="cursor: pointer;">
                                ➡️ ${this.recipe.instructions[this.currentCookingStep + 1].substring(0, 60)}...
                            </div>
                        ` : ''}
                    </div>

                    <!-- Haupt-Timer Bereich -->
                    <div class="main-timer-section">
                        ${currentStepTimer ? html`
                            <div class="circular-timer-container">
                                <svg class="circular-timer-svg" viewBox="0 0 100 100">
                                    <circle class="timer-circle-bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="timer-circle-progress" cx="50" cy="50" r="40"
                                            stroke-dasharray="${circumference}"
                                            stroke-dashoffset="${strokeDashoffset}"></circle>
                                </svg>
                                <div class="timer-text-overlay">
                                    <span class="timer-time">${this._formatTime(secondsRemaining)}</span>
                                    <span class="timer-label">Aktiv</span>
                                </div>
                            </div>
                            <button class="stop-timer-btn" @click="${() => this._stopTimer(currentStepTimer.id)}" style="background: hsl(0, 84.3%, 95%); border-color: hsl(0, 84.3%, 90%); color: hsl(0, 84.3%, 45%); font-weight: 800; font-size: 13px; padding: 8px 16px; border-radius: 14px;" aria-label="Timer abbrechen">⏹️ Stoppen</button>
                        ` : this.currentStepTimeMinutes ? html`
                            <button class="start-timer-btn" @click="${() => this._startTimer()}" style="background: var(--accent); border-color: var(--accent-dark); color: white; padding: 12px 20px; font-size: 15px; font-weight: 850; border-radius: 18px; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 8px;" aria-label="Timer über ${this.currentStepTimeMinutes} Minuten starten">
                                ⏳ ${this.currentStepTimeMinutes} Min. Schritt-Timer starten
                            </button>
                        ` : html`
                            <span style="font-size: 13px; color: var(--text-muted); font-weight: bold; font-style: italic;">Kein automatischer Schritt-Timer</span>
                        `}

                        <!-- Schnelle Manuelle Custom Timer -->
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 8px;">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); width: 100%; text-align: center;">Schnell-Timer:</span>
                            <button class="action-btn" @click="${() => this._startTimer(1, '1 Min. Timer')}" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;">+1 Min</button>
                            <button class="action-btn" @click="${() => this._startTimer(5, '5 Min. Timer')}" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;">+5 Min</button>
                            <button class="action-btn" @click="${() => this._startTimer(10, '10 Min. Timer')}" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;">+10 Min</button>
                            <button class="action-btn" @click="${this._promptCustomTimer}" style="padding: 4px 10px; font-size: 11px; border-radius: 8px; border-color: var(--primary);">⏱️ Eigener</button>
                        </div>
                    </div>

                    <!-- Dashboard für Hintergrund-Timer -->
                    ${backgroundTimers.length > 0 ? html`
                        <div class="background-timers">
                            <h4>⏱️ Hintergrund-Timer (${backgroundTimers.length})</h4>
                            ${backgroundTimers.map(t => html`
                                <div class="bg-timer-item">
                                    <span class="bg-timer-name">${t.label.split(':')[0]}</span>
                                    <span class="bg-timer-time">⏳ ${this._formatTime(t.secondsRemaining)}</span>
                                    <button class="bg-timer-cancel" @click="${() => this._stopTimer(t.id)}" aria-label="Timer beenden">❌</button>
                                </div>
                            `)}
                        </div>
                    ` : ''}

                    <!-- Sprachsteuerung Status-Bar -->
                    ${this.isVoiceControlActive ? html`
                        <div class="voice-status-bar" role="status" aria-live="polite">
                            <div class="mic-pulse"></div>
                            <span>Sprachsteuerung aktiv: <em>${this.voiceStatusText || 'Hört zu... (Befehle: weiter, zurück, vorlesen, timer starten, restzeit, stoppen)'}</em></span>
                        </div>
                    ` : ''}

                    <div class="cooking-controls" style="display: flex; gap: 12px; margin-top: 8px;">
                        <button class="control-btn" @click="${this._prevStep}" ?disabled="${this.currentCookingStep === 0}" style="flex: 1; padding: 12px; font-weight: bold;" aria-label="Vorheriger Schritt">⬅️ Zurück</button>
                        
                        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1.8;">
                            <button class="main-btn voice-btn" @click="${this._readStep}" style="padding: 12px; font-weight: bold;" aria-label="Aktuellen Schritt vorlesen">🔊 Vorlesen</button>
                            <button class="secondary-btn" @click="${this._toggleVoice}" style="padding: 8px 12px; font-size: 13px; font-weight: bold; border-color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--border)'}; color: ${this.isVoiceControlActive ? '#ef4444' : 'var(--text-dark)'};" aria-label="${this.isVoiceControlActive ? 'Sprachsteuerung deaktivieren' : 'Freihändige Sprachsteuerung aktivieren'}">
                                ${this.isVoiceControlActive ? '🎙️ Sprachsteuerung Stopp' : '🎙️ Sprachsteuerung Start'}
                            </button>
                        </div>

                        <button class="control-btn" @click="${this._nextStep}" ?disabled="${this.currentCookingStep === totalSteps - 1}" style="flex: 1; padding: 12px; font-weight: bold;" aria-label="Nächster Schritt">Weiter ➡️</button>
                    </div>

                    <!-- KI Live-Kochassistent Fragen-Box -->
                    <div style="margin-top: 20px; background: var(--bg-color); border: 2px solid var(--border); border-radius: 18px; padding: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 850; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
                            👨‍🍳 KI-Kochassistent Fragen
                        </h4>
                        <div style="display: flex; gap: 8px;">
                            <input type="text"
                                   placeholder="Frage stellen (z.B. Womit Sahne ersetzen?)"
                                   .value="${this.questionInput}"
                                   @input="${(e: Event) => this.questionInput = (e.target as HTMLInputElement).value}"
                                   @keypress="${(e: KeyboardEvent) => e.key === 'Enter' && this._askAssistant()}"
                                   style="flex: 1; padding: 10px 14px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface); color: var(--text-dark); font-family: inherit; font-size: 13px;" />
                            <button class="scan-btn" @click="${this._askAssistant}" style="padding: 10px 14px; font-size: 13px;">
                                Fragen ❓
                            </button>
                        </div>
                        ${this.assistantAnswer ? html`
                            <div style="margin-top: 12px; background: var(--primary-light); border: 2px solid var(--primary); border-radius: 12px; padding: 12px; font-size: 13px; color: var(--primary-dark); font-weight: 700;">
                                💬 <strong>Antwort:</strong> ${this.assistantAnswer}
                            </div>
                        ` : ''}
                    </div>

                </div>
            </div>
        `;
    }
}
