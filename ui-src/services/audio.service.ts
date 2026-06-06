class AudioServiceClass {
    private audioCtx: AudioContext | null = null;
    private alarmActive = false;

    playAlarm(): void {
        this.alarmActive = true;
        try {
            if (!this.audioCtx) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    this.audioCtx = new AudioContextClass();
                }
            }
            
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const playPulse = () => {
                if (!this.audioCtx || !this.alarmActive) return;
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
            };

            playPulse();
        } catch (e) {
            console.error("Audio Context Error", e);
        }
    }

    stopAlarm(): void {
        this.alarmActive = false;
    }
}

export const AudioService = new AudioServiceClass();
