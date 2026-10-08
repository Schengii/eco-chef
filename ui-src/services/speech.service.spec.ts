/** @jest-environment jsdom */
import { SpeechService } from './speech.service';

class FakeRecognition {
    static last: FakeRecognition;
    continuous = false;
    interimResults = true;
    lang = '';
    onresult: ((e: any) => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    onend: (() => void) | null = null;
    start = jest.fn();
    stop = jest.fn();
    constructor() { FakeRecognition.last = this; }
}

const say = (rec: FakeRecognition, transcript: string) =>
    rec.onresult!({ results: [[{ transcript }]] });

describe('SpeechService', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        (window as any).SpeechRecognition = FakeRecognition;
    });

    afterEach(() => {
        SpeechService.stopListening();
        (SpeechService as any).recognition = null;
        delete (window as any).SpeechRecognition;
        delete (window as any).speechSynthesis;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('reports unsupported browsers', () => {
        delete (window as any).SpeechRecognition;
        const onStatus = jest.fn();
        const onError = jest.fn();
        SpeechService.startListening(jest.fn(), onStatus, onError);
        expect(onError).toHaveBeenCalled();
        expect(onStatus).toHaveBeenCalledWith(expect.stringContaining('nicht unterstützt'));
    });

    test('starts recognition with German continuous settings', () => {
        const onStatus = jest.fn();
        SpeechService.startListening(jest.fn(), onStatus, jest.fn());
        const rec = FakeRecognition.last;
        expect(rec.lang).toBe('de-DE');
        expect(rec.continuous).toBe(true);
        expect(rec.start).toHaveBeenCalled();
        expect(onStatus).toHaveBeenCalledWith(expect.stringContaining('Hört zu'));
    });

    test('accepts wake-word commands and direct commands, ignores ambient speech', () => {
        const onCommand = jest.fn();
        SpeechService.startListening(onCommand, jest.fn(), jest.fn());
        const rec = FakeRecognition.last;

        say(rec, 'EcoChef weiter');
        expect(onCommand).toHaveBeenLastCalledWith('weiter');
        say(rec, 'zurück');
        expect(onCommand).toHaveBeenLastCalledWith('zurück');
        const calls = onCommand.mock.calls.length;
        say(rec, 'was gibt es heute zum essen');
        say(rec, 'chef');
        expect(onCommand).toHaveBeenCalledTimes(calls);
    });

    test('permission denial stops listening and reports', () => {
        const onStatus = jest.fn();
        const onError = jest.fn();
        SpeechService.startListening(jest.fn(), onStatus, onError);
        const rec = FakeRecognition.last;
        rec.onerror!({ error: 'not-allowed' });
        expect(onStatus).toHaveBeenCalledWith('Zugriff verweigert');
        expect(onError).toHaveBeenCalled();
        rec.onend!();
        jest.advanceTimersByTime(1000);
        expect(rec.start).toHaveBeenCalledTimes(1);
    });

    test('restarts after end and gives up after too many rapid restarts', () => {
        const onError = jest.fn();
        SpeechService.startListening(jest.fn(), jest.fn(), onError);
        const rec = FakeRecognition.last;
        rec.onend!();
        jest.advanceTimersByTime(700);
        expect(rec.start).toHaveBeenCalledTimes(2);

        for (let i = 0; i < 10; i++) {
            rec.onend!();
            jest.advanceTimersByTime(700);
        }
        expect(onError).toHaveBeenCalled();
    });

    test('stopListening stops recognition and clears status', () => {
        const onStatus = jest.fn();
        SpeechService.startListening(jest.fn(), onStatus, jest.fn());
        SpeechService.stopListening();
        expect(FakeRecognition.last.stop).toHaveBeenCalled();
        expect(onStatus).toHaveBeenLastCalledWith('');
    });

    test('speak and cancelSpeak use speechSynthesis when available and are safe without it', () => {
        expect(() => SpeechService.speak('Hallo')).not.toThrow();
        expect(() => SpeechService.cancelSpeak()).not.toThrow();

        const speechSynthesis = { cancel: jest.fn(), speak: jest.fn() };
        (window as any).speechSynthesis = speechSynthesis;
        (global as any).SpeechSynthesisUtterance = class {
            lang = '';
            rate = 1;
            constructor(public text: string) {}
        };
        SpeechService.speak('Hallo');
        expect(speechSynthesis.cancel).toHaveBeenCalled();
        expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hallo', lang: 'de-DE' }));
        SpeechService.cancelSpeak();
        expect(speechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });
});
