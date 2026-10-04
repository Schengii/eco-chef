/** @jest-environment jsdom */
import { TimerController, TimerHost } from './timer.controller';

jest.mock('../services/audio.service', () => ({ AudioService: { playAlarm: jest.fn(), stopAlarm: jest.fn() } }));
jest.mock('../services/speech.service', () => ({ SpeechService: { speak: jest.fn(), cancelSpeak: jest.fn() } }));

function makeHost(step = { stepIndex: 0, stepText: 'Nudeln kochen, 10 Minuten' as string | null, detectedMinutes: 10 as number | null }) {
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        getStepContext: () => step,
        announce: jest.fn()
    };
    return { host: host as unknown as TimerHost & typeof host, step };
}

describe('TimerController', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('falls back to the detected step duration and labels by step', () => {
        const { host } = makeHost();
        const timers = new TimerController(host);
        timers.start();
        expect(timers.activeTimers).toHaveLength(1);
        expect(timers.activeTimers[0].totalSeconds).toBe(600);
        expect(timers.activeTimers[0].label).toMatch(/^Schritt 1: Nudeln kochen/);
        timers.stop();
    });

    it('ignores start without any duration', () => {
        const { host } = makeHost({ stepIndex: 0, stepText: null, detectedMinutes: null });
        const timers = new TimerController(host);
        timers.start();
        expect(timers.activeTimers).toHaveLength(0);
    });

    it('reads minutes and label from a start-timer event and restarts a timer with the same label', () => {
        const { host } = makeHost();
        const timers = new TimerController(host);
        timers.start(new CustomEvent('start-timer', { detail: { minutes: 5, label: 'Reis' } }));
        timers.start(1, 'Reis');
        expect(timers.activeTimers).toHaveLength(1);
        expect(timers.activeTimers[0].secondsRemaining).toBe(60);
        timers.stop();
    });

    it('counts down, respects pause and raises the alarm on expiry', () => {
        const { host } = makeHost();
        const timers = new TimerController(host);
        timers.start(1, 'Ei');
        const id = timers.activeTimers[0].id;

        jest.advanceTimersByTime(3000);
        expect(timers.activeTimers[0].secondsRemaining).toBe(57);
        expect(timers.secondsRemaining).toBe(57);

        timers.togglePause(id);
        jest.advanceTimersByTime(5000);
        expect(timers.activeTimers[0].secondsRemaining).toBe(57);

        timers.togglePause(id);
        jest.advanceTimersByTime(57_000);
        expect(timers.activeTimers).toHaveLength(0);
        expect(timers.showExpiredModal).toBe(true);
        expect(timers.expiredLabel).toBe('Ei');

        timers.closeExpiredModal();
        expect(timers.showExpiredModal).toBe(false);
    });

    it('stop() without id only removes timers of the current step', () => {
        const { host, step } = makeHost();
        const timers = new TimerController(host);
        timers.start(5, 'A');
        step.stepIndex = 1;
        timers.start(5, 'B');
        timers.stop();
        expect(timers.activeTimers.map(t => t.label)).toEqual(['A']);
        timers.stop(timers.activeTimers[0].id);
        expect(timers.activeTimers).toHaveLength(0);
    });
});
