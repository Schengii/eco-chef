/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:4444/"}
 */
import { initInsights } from './insights.service';

const SELECTOR = 'script[src="/_vercel/insights/script.js"]';

describe('initInsights (lokal)', () => {
    afterEach(() => {
        document.head.innerHTML = '';
        delete (window as unknown as { cordova?: unknown }).cordova;
    });

    it('lädt das Skript nicht auf localhost', () => {
        initInsights();
        expect(document.querySelector(SELECTOR)).toBeNull();
    });

    it('lädt das Skript nicht in der Cordova-App', () => {
        (window as unknown as { cordova?: unknown }).cordova = {};
        initInsights();
        expect(document.querySelector(SELECTOR)).toBeNull();
    });
});
