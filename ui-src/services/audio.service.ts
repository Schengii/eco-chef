import { StorageService } from './storage.service';

class AudioServiceClass {
    private audioCtx: AudioContext | null = null;
    private alarmActive = false;

    private initContext(): AudioContext | null {
        try {
            if (!this.audioCtx) {
                const win = typeof window !== 'undefined' ? window : (global as any);
                const AudioContextClass = win.AudioContext || win.webkitAudioContext;
                if (AudioContextClass) {
                    this.audioCtx = new AudioContextClass();
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            return this.audioCtx;
        } catch (e) {
            console.error("Audio Context Error", e);
            return null;
        }
    }

    playAlarm(): void {
        this.alarmActive = true;
        const ctx = this.initContext();
        if (!ctx) return;

        const playPulse = () => {
            if (!this.audioCtx || !this.alarmActive) return;
            try {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);

                gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.5);

                setTimeout(playPulse, 800);
            } catch (e) {
                console.error("Alarm audio error", e);
            }
        };

        playPulse();
    }

    stopAlarm(): void {
        this.alarmActive = false;
    }

    playSuccessChime(): void {
        if (!StorageService.getSoundEffectsEnabled()) return;
        const ctx = this.initContext();
        if (!ctx) return;

        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
            });
        } catch (e) {
            console.error("Success chime error", e);
        }
    }

    playAchievementJingle(): void {
        if (!StorageService.getSoundEffectsEnabled()) return;
        const ctx = this.initContext();
        if (!ctx) return;

        try {
            const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

                gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
            });
        } catch (e) {
            console.error("Achievement jingle error", e);
        }
    }

    playItemAddBeep(): void {
        if (!StorageService.getSoundEffectsEnabled()) return;
        const ctx = this.initContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Item add beep error", e);
        }
    }
}

export const AudioService = new AudioServiceClass();
