/**
 * @jest-environment jsdom
 */
import { initInsights } from './insights.service';

const SELECTOR = 'script[src="/_vercel/insights/script.js"]';

function setLocation(url: string): void {
    window.history.replaceState({}, '', url);
}

describe('initInsights', () => {
    afterEach(() => {
        document.head.innerHTML = '';
        delete (window as unknown as { cordova?: unknown }).cordova;
        delete (window as unknown as { va?: unknown }).va;
        delete (window as unknown as { vaq?: unknown }).vaq;
    });

    it('lädt das Skript nicht auf localhost', () => {
        setLocation('http://localhost:4444/');
        initInsights();
        expect(document.querySelector(SELECTOR)).toBeNull();
    });

    it('lädt das Skript nicht in der Cordova-App', () => {
        (window as unknown as { cordova?: unknown }).cordova = {};
        initInsights();
        expect(document.querySelector(SELECTOR)).toBeNull();
    });
});
