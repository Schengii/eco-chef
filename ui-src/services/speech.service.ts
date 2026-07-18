class SpeechServiceClass {
    private recognition: any = null;
    private isListening = false;
    private onCommandCallback: ((cmd: string) => void) | null = null;
    private onStatusCallback: ((status: string) => void) | null = null;
    private onErrorCallback: (() => void) | null = null;

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
            alert("Sprachsteuerung wird in diesem Browser leider nicht unterstützt.");
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
                        console.log("Ignored ambient sound/speech:", command);
                        return;
                    }
                }
                
                if (this.onCommandCallback && processedCommand) {
                    this.onCommandCallback(processedCommand);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    this.isListening = false;
                    if (this.onStatusCallback) this.onStatusCallback('Zugriff verweigert');
                    if (this.onErrorCallback) this.onErrorCallback();
                }
            };

            this.recognition.onend = () => {
                // Restart if still marked as listening
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error("Failed to restart speech recognition", e);
                    }
                }
            };
        }

        try {
            this.recognition.start();
            if (this.onStatusCallback) this.onStatusCallback('Hört zu... (Befehle: weiter, zurück, vorlesen, stoppen)');
        } catch (e) {
            console.error("Failed to start speech recognition", e);
        }
    }

    stopListening(): void {
        this.isListening = false;
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
