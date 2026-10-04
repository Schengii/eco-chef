import { Logger } from './logger';
class SpeechServiceClass {
    private recognition: any = null;
    private isListening = false;
    private onCommandCallback: ((cmd: string) => void) | null = null;
    private onStatusCallback: ((status: string) => void) | null = null;
    private onErrorCallback: (() => void) | null = null;
    private restartTimeout: any = null;
    private restartAttempts = 0;
    private readonly maxRestartAttempts = 5;

    speak(text: string): void {
        if (!('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Error during TTS", e);
        }
    }

    cancelSpeak(): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    startListening(
        onCommand: (cmd: string) => void,
        onStatusChange: (status: string) => void,
        onError: () => void
    ): void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[SpeechService] Web Speech API not supported in this browser.');
            onStatusChange('Sprachsteuerung wird in diesem Browser nicht unterstützt.');
            onError();
            return;
        }

        this.onCommandCallback = onCommand;
        this.onStatusCallback = onStatusChange;
        this.onErrorCallback = onError;
        this.isListening = true;

        if (!this.recognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'de-DE';

            this.recognition.onresult = (event: any) => {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.trim().toLowerCase();
                
                let processedCommand = '';
                const wakeWords = ['ecochef', 'eco chef', 'chefkoch', 'chef', 'koch', 'hallo chef'];
                let foundWakeWord = false;
                
                for (const ww of wakeWords) {
                    if (command.startsWith(ww)) {
                        processedCommand = command.substring(ww.length).trim();
                        foundWakeWord = true;
                        break;
                    }
                }
                
                if (!foundWakeWord) {
                    const directCommands = ['weiter', 'nächster', 'zurück', 'vorheriger', 'vorlesen', 'lies vor', 'stopp', 'anhalten', 'hilfe'];
                    if (directCommands.includes(command)) {
                        processedCommand = command;
                    } else {
                        Logger.debug("Ignored ambient sound/speech:", command);
                        return;
                    }
                }
                
                if (this.onCommandCallback && processedCommand) {
                    this.onCommandCallback(processedCommand);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.isListening = false;
                    clearTimeout(this.restartTimeout);
                    if (this.onStatusCallback) this.onStatusCallback('Zugriff verweigert');
                    if (this.onErrorCallback) this.onErrorCallback();
                }
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    if (this.restartAttempts >= this.maxRestartAttempts) {
                        console.warn('[SpeechService] Exceeded max rapid restarts, stopping listener.');
                        this.isListening = false;
                        if (this.onStatusCallback) this.onStatusCallback('Spracherkennung beendet (zu viele Abbrüche)');
                        if (this.onErrorCallback) this.onErrorCallback();
                        return;
                    }
                    this.restartAttempts++;
                    clearTimeout(this.restartTimeout);
                    this.restartTimeout = setTimeout(() => {
                        if (this.isListening && this.recognition) {
                            try {
                                this.recognition.start();
                                setTimeout(() => { this.restartAttempts = 0; }, 5000);
                            } catch (e) {
                                console.error("Failed to restart speech recognition", e);
                            }
                        }
                    }, 600);
                }
            };
        }

        try {
            this.restartAttempts = 0;
            this.recognition.start();
            if (this.onStatusCallback) this.onStatusCallback('Hört zu... (Befehle: weiter, zurück, vorlesen, stoppen)');
        } catch (e) {
            console.error("Failed to start speech recognition", e);
        }
    }

    stopListening(): void {
        this.isListening = false;
        clearTimeout(this.restartTimeout);
        this.restartAttempts = 0;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.error("Error stopping speech recognition", e);
            }
        }
        if (this.onStatusCallback) this.onStatusCallback('');
    }
}

export const SpeechService = new SpeechServiceClass();
