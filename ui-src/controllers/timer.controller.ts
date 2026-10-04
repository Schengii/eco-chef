import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ActiveTimer } from '../models/eco-chef.models';
import { AudioService } from '../services/audio.service';
import { SpeechService } from '../services/speech.service';

export interface TimerHost extends ReactiveControllerHost {
    /** Current cooking step plus the duration detected in its text (used when no minutes are passed). */
    getStepContext(): { stepIndex: number; stepText: string | null; detectedMinutes: number | null };
    announce(message: string): void;
}

/** Cooking timers (several in parallel, one ticker) and the expiry alarm. */
export class TimerController implements ReactiveController {
    activeTimers: ActiveTimer[] = [];
    /** Seconds left on the timer of the current cooking step (0 if none). */
    secondsRemaining = 0;
    showExpiredModal = false;
    expiredLabel = '';

    private interval: number | null = null;

    constructor(private readonly host: TimerHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    hostDisconnected(): void {
        this.stopTicker();
        AudioService.stopAlarm();
    }

    /** Accepts minutes directly or a `start-timer` CustomEvent ({minutes, label}); falls back to the step's duration. */
    start = (minutes?: number | CustomEvent, label?: string): void => {
        const ctx = this.host.getStepContext();
        let mins: number | null = null;
        let stepLabel = label;

        if (typeof minutes === 'number') {
            mins = minutes;
        } else if (minutes && typeof minutes === 'object' && 'detail' in minutes) {
            const detail = minutes.detail;
            if (detail) {
                if (typeof detail.minutes === 'number') mins = detail.minutes;
                if (detail.label) stepLabel = detail.label;
            }
        }
        if (mins === null || isNaN(mins)) mins = ctx.detectedMinutes;
        if (!mins || mins <= 0) return;

        const defaultLabel = ctx.stepText
            ? `Schritt ${ctx.stepIndex + 1}: ${ctx.stepText.substring(0, 30)}...`
            : `Timer ${this.activeTimers.length + 1}`;
        const finalLabel = stepLabel || defaultLabel;

        const existing = this.activeTimers.findIndex(t => t.label === finalLabel);
        if (existing !== -1) {
            const updated = [...this.activeTimers];
            updated[existing] = { ...updated[existing], secondsRemaining: mins * 60, totalSeconds: mins * 60 };
            this.activeTimers = updated;
        } else {
            this.activeTimers = [...this.activeTimers, {
                id: Math.random().toString(36).substring(2, 9),
                label: finalLabel,
                totalSeconds: mins * 60,
                secondsRemaining: mins * 60,
                stepIndex: ctx.stepIndex
            }];
        }

        this.startTicker();
        SpeechService.speak(`Timer gestartet für ${mins} Minuten.`);
        this.host.requestUpdate();
    };

    /** Stops the timer with the given id; without id, the timers of the current step. */
    stop = (id?: string): void => {
        const { stepIndex } = this.host.getStepContext();
        this.activeTimers = typeof id === 'string'
            ? this.activeTimers.filter(t => t.id !== id)
            : this.activeTimers.filter(t => t.stepIndex !== stepIndex);
        if (this.activeTimers.length === 0) this.stopTicker();
        this.syncCurrentStep();
        this.host.requestUpdate();
    };

    togglePause = (id: string): void => {
        this.activeTimers = this.activeTimers.map(t => t.id === id ? { ...t, isPaused: !t.isPaused } : t);
        this.host.requestUpdate();
    };

    closeExpiredModal = (): void => {
        this.showExpiredModal = false;
        this.expiredLabel = '';
        AudioService.stopAlarm();
        this.host.announce('Timer-Alarm beendet.');
        this.host.requestUpdate();
    };

    private startTicker(): void {
        if (this.interval) return;
        this.interval = window.setInterval(() => this.tick(), 1000);
    }

    private stopTicker(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private tick(): void {
        if (this.activeTimers.length === 0) {
            this.stopTicker();
            return;
        }
        this.activeTimers = this.activeTimers.map(t =>
            t.isPaused ? t : { ...t, secondsRemaining: Math.max(0, t.secondsRemaining - 1) });

        const expired = this.activeTimers.find(t => t.secondsRemaining === 0);
        if (expired) {
            this.alarm(expired.label);
            this.activeTimers = this.activeTimers.filter(t => t.id !== expired.id);
        }
        this.syncCurrentStep();
        this.host.requestUpdate();
    }

    private alarm(label: string): void {
        this.expiredLabel = label;
        if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        this.showExpiredModal = true;
        this.host.announce(`Achtung! Die Zeit für ${label || 'den Schritt'} ist abgelaufen!`);
        AudioService.playAlarm();
    }

    private syncCurrentStep(): void {
        const { stepIndex } = this.host.getStepContext();
        const current = this.activeTimers.find(t => t.stepIndex === stepIndex);
        this.secondsRemaining = current ? current.secondsRemaining : 0;
    }
}
