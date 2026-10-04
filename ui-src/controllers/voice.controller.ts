import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { SpeechService } from '../services/speech.service';
import { Logger } from '../services/logger';
import type { TimerController } from './timer.controller';

export type VoiceIntent = 'next' | 'previous' | 'read' | 'timer-start' | 'time-left' | 'stop' | 'help';

/** Maps a recognized phrase to an intent. Order matters: the first matching rule wins. */
export function interpretVoiceCommand(command: string): VoiceIntent | null {
    const has = (...words: string[]) => words.some(w => command.includes(w));
    if (has('weiter', 'nächst', 'weiterer')) return 'next';
    if (has('zurück', 'vorherig', 'letzter')) return 'previous';
    if (has('vorlesen', 'lies vor', 'sprechen')) return 'read';
    if (has('timer starten', 'timer start', 'starten')) return 'timer-start';
    if (has('wie viel zeit', 'restzeit', 'zeit übrig', 'dauer')) return 'time-left';
    if (has('stopp', 'halt', 'anhalten')) return 'stop';
    if (has('hilfe', 'befehle')) return 'help';
    return null;
}

export interface VoiceHost extends ReactiveControllerHost {
    readonly timers: Pick<TimerController, 'activeTimers' | 'showExpiredModal' | 'start' | 'stop' | 'closeExpiredModal'>;
    nextStep(): void;
    prevStep(): void;
    readCurrentStep(): void;
    speakCurrentStep(): void;
    hasStepDuration(): boolean;
    announce(message: string): void;
}

/** Hands-free cooking: listens for commands and drives the cooking steps and timers of the host. */
export class VoiceController implements ReactiveController {
    isActive = false;
    statusText = '';

    constructor(private readonly host: VoiceHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    hostDisconnected(): void {
        if (this.isActive) this.stop();
    }

    toggle = (): void => {
        if (this.isActive) {
            this.stop();
            return;
        }
        this.isActive = true;
        this.statusText = 'Hört zu...';
        SpeechService.startListening(
            cmd => this.handle(cmd),
            status => { this.statusText = status; this.host.requestUpdate(); },
            () => { this.isActive = false; this.host.requestUpdate(); }
        );
        SpeechService.speak("Sprachsteuerung aktiv. Sag 'weiter' oder 'zurück', um durch die Schritte zu navigieren.");
        this.host.announce('Sprachsteuerung aktiviert. Das Mikrofon hört zu.');
        this.host.requestUpdate();
    };

    stop = (): void => {
        this.isActive = false;
        this.statusText = '';
        SpeechService.stopListening();
        this.host.announce('Sprachsteuerung deaktiviert.');
        this.host.requestUpdate();
    };

    handle(command: string): void {
        Logger.debug('Voice Command:', command);
        const { host } = this;
        switch (interpretVoiceCommand(command)) {
            case 'next':
                host.nextStep();
                host.speakCurrentStep();
                host.announce('Nächster Schritt vorgelesen.');
                break;
            case 'previous':
                host.prevStep();
                host.speakCurrentStep();
                host.announce('Vorheriger Schritt vorgelesen.');
                break;
            case 'read':
                host.readCurrentStep();
                host.announce('Schritt wird vorgelesen.');
                break;
            case 'timer-start':
                if (host.hasStepDuration()) host.timers.start();
                else SpeechService.speak('Für diesen Schritt ist keine Kochzeit angegeben.');
                host.announce('Timer per Sprachbefehl gestartet.');
                break;
            case 'time-left':
                SpeechService.speak(this.describeTimers());
                host.announce('Timer-Restlaufzeit per Sprachbefehl angesagt.');
                break;
            case 'stop':
                SpeechService.cancelSpeak();
                host.timers.stop();
                if (host.timers.showExpiredModal) host.timers.closeExpiredModal();
                host.announce('Sprachausgabe und Timer gestoppt.');
                break;
            case 'help':
                SpeechService.speak('Mögliche Befehle sind: weiter, zurück, vorlesen, timer starten, restzeit abfragen, stoppen und hilfe.');
                break;
        }
    }

    private describeTimers(): string {
        const timers = this.host.timers.activeTimers;
        if (timers.length === 0) return 'Es laufen aktuell keine aktiven Timer.';
        const parts = timers.map(t => {
            const m = Math.floor(t.secondsRemaining / 60);
            const s = t.secondsRemaining % 60;
            const timeText = m > 0 ? `${m} Minuten und ${s} Sekunden` : `${s} Sekunden`;
            return `Timer für ${t.label.split(':')[0]} hat noch ${timeText} übrig.`;
        });
        return `Es laufen ${timers.length} Timer. ${parts.join(' ')}`;
    }
}
