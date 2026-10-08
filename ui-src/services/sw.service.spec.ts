/** @jest-environment jsdom */
const showToast = jest.fn();
jest.mock('../components/eco-chef-toast', () => ({ showToast: (...a: unknown[]) => showToast(...a) }));

import { registerServiceWorker } from './sw.service';

function installServiceWorker(registration: any, controller: unknown = {}) {
    const sw = {
        controller,
        addEventListener: jest.fn(),
        register: jest.fn().mockResolvedValue(registration)
    };
    Object.defineProperty(navigator, 'serviceWorker', { value: sw, configurable: true });
    return sw;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function fakeInstallingWorker() {
    return { state: 'installing', postMessage: jest.fn(), addEventListener: jest.fn() };
}

describe('registerServiceWorker', () => {
    beforeEach(() => {
        showToast.mockClear();
        delete (window as any).cordova;
    });

    test('does nothing inside Cordova', () => {
        (window as any).cordova = {};
        const sw = installServiceWorker({ addEventListener: jest.fn() });
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
        expect(sw.register).not.toHaveBeenCalled();
    });

    test('registers on load and offers an update for an already waiting worker', async () => {
        const waiting = { postMessage: jest.fn() };
        const sw = installServiceWorker({ waiting, addEventListener: jest.fn() });
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
        await flush();

        expect(sw.register).toHaveBeenCalledWith('./sw.js');
        expect(showToast).toHaveBeenCalledWith('Neue Version von EcoChef verfügbar.', 'info',
            expect.objectContaining({ actionLabel: 'Neu laden' }));
        showToast.mock.calls[0][2].onAction();
        expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    test('offers an update when a new worker finishes installing', async () => {
        const installing = fakeInstallingWorker();
        let updateFound: () => void = () => undefined;
        installServiceWorker({
            waiting: null,
            installing,
            addEventListener: (_t: string, cb: () => void) => { updateFound = cb; }
        });
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
        await flush();

        updateFound();
        installing.state = 'installed';
        installing.addEventListener.mock.calls[0][1]();
        expect(showToast).toHaveBeenCalledTimes(1);
    });

    test('does not announce an update on the very first install (no controller)', async () => {
        const installing = fakeInstallingWorker();
        let updateFound: () => void = () => undefined;
        installServiceWorker({
            waiting: null,
            installing,
            addEventListener: (_t: string, cb: () => void) => { updateFound = cb; }
        }, null);
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
        await flush();

        updateFound();
        installing.state = 'installed';
        installing.addEventListener.mock.calls[0][1]();
        expect(showToast).not.toHaveBeenCalled();
    });

    test('swallows registration failures', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const sw = installServiceWorker({});
        sw.register.mockRejectedValue(new Error('nope'));
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
        await flush();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
