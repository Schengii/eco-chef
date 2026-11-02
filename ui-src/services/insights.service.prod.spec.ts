/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://eco-chef-theta.vercel.app/"}
 */
import { initInsights } from './insights.service';

const SELECTOR = 'script[src="/_vercel/insights/script.js"]';

describe('initInsights (Produktion)', () => {
    afterEach(() => {
        document.head.innerHTML = '';
        delete (window as unknown as { cordova?: unknown }).cordova;
        delete (window as unknown as { va?: unknown }).va;
        delete (window as unknown as { vaq?: unknown }).vaq;
    });

    it('lädt das Skript genau einmal und legt die va-Queue an', () => {
        initInsights();
        initInsights();
        expect(document.querySelectorAll(SELECTOR)).toHaveLength(1);
        expect(typeof (window as unknown as { va?: unknown }).va).toBe('function');
    });

    it('lädt das Skript nicht in der Cordova-App', () => {
        (window as unknown as { cordova?: unknown }).cordova = {};
        initInsights();
        expect(document.querySelector(SELECTOR)).toBeNull();
    });
});
