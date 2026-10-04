/** @jest-environment jsdom */
import { VoiceController, VoiceHost, interpretVoiceCommand } from './voice.controller';
import { SpeechService } from '../services/speech.service';

jest.mock('../services/speech.service', () => ({
    SpeechService: { speak: jest.fn(), cancelSpeak: jest.fn(), startListening: jest.fn(), stopListening: jest.fn() }
}));

describe('interpretVoiceCommand', () => {
    it.each([
        ['weiter', 'next'],
        ['gehe zum nächsten schritt', 'next'],
        ['zurück', 'previous'],
        ['bitte vorlesen', 'read'],
        ['timer starten', 'timer-start'],
        ['wie viel zeit ist noch übrig', 'time-left'],
        ['stopp', 'stop'],
        ['hilfe', 'help'],
        ['kartoffeln', null]
    ])('%s -> %s', (phrase, intent) => {
        expect(interpretVoiceCommand(phrase)).toBe(intent);
    });
});

function make(opts: { hasDuration?: boolean; timers?: Array<{ label: string; secondsRemaining: number }> } = {}) {
    const timers = {
        activeTimers: (opts.timers ?? []) as never[],
        showExpiredModal: true,
        start: jest.fn(),
        stop: jest.fn(),
        closeExpiredModal: jest.fn()
    };
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        timers,
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        readCurrentStep: jest.fn(),
        speakCurrentStep: jest.fn(),
        hasStepDuration: () => opts.hasDuration ?? false,
        announce: jest.fn()
    };
    return { host, timers, voice: new VoiceController(host as unknown as VoiceHost) };
}

describe('VoiceController', () => {
    beforeEach(() => jest.clearAllMocks());

    it('toggles listening on and off', () => {
        const { voice } = make();
        voice.toggle();
        expect(voice.isActive).toBe(true);
        expect(SpeechService.startListening).toHaveBeenCalled();
        voice.toggle();
        expect(voice.isActive).toBe(false);
        expect(SpeechService.stopListening).toHaveBeenCalled();
    });

    it('navigates steps by voice', () => {
        const { voice, host } = make();
        voice.handle('weiter');
        expect(host.nextStep).toHaveBeenCalled();
        expect(host.speakCurrentStep).toHaveBeenCalled();
        voice.handle('zurück');
        expect(host.prevStep).toHaveBeenCalled();
    });

    it('starts a timer only if the step has a duration', () => {
        const without = make({ hasDuration: false });
        without.voice.handle('timer starten');
        expect(without.timers.start).not.toHaveBeenCalled();
        expect(SpeechService.speak).toHaveBeenCalledWith('Für diesen Schritt ist keine Kochzeit angegeben.');

        const withDuration = make({ hasDuration: true });
        withDuration.voice.handle('timer starten');
        expect(withDuration.timers.start).toHaveBeenCalled();
    });

    it('reports remaining time of active timers', () => {
        const { voice } = make({ timers: [{ label: 'Schritt 2: Reis', secondsRemaining: 95 }] });
        voice.handle('restzeit');
        expect(SpeechService.speak).toHaveBeenCalledWith('Es laufen 1 Timer. Timer für Schritt 2 hat noch 1 Minuten und 35 Sekunden übrig.');
    });

    it('stop silences speech, timers and the alarm modal', () => {
        const { voice, timers } = make();
        voice.handle('stopp');
        expect(SpeechService.cancelSpeak).toHaveBeenCalled();
        expect(timers.stop).toHaveBeenCalled();
        expect(timers.closeExpiredModal).toHaveBeenCalled();
    });
});
