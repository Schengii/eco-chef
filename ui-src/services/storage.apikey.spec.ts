import { StorageService } from './storage.service';

function createStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { store = {}; }
    };
}

describe('Gemini API key storage', () => {
    beforeEach(() => {
        (global as unknown as { localStorage: unknown }).localStorage = createStorageMock();
        (global as unknown as { sessionStorage: unknown }).sessionStorage = createStorageMock();
    });

    test('persists by default and reports not session-only', () => {
        StorageService.setGeminiApiKey('AIza-persist');
        expect(StorageService.getGeminiApiKey()).toBe('AIza-persist');
        expect(localStorage.getItem('ecoChef_geminiApiKey')).toBe('AIza-persist');
        expect(StorageService.isGeminiKeySessionOnly()).toBe(false);
    });

    test('session-only keys never touch localStorage', () => {
        StorageService.setGeminiApiKey('AIza-session', true);
        expect(StorageService.getGeminiApiKey()).toBe('AIza-session');
        expect(localStorage.getItem('ecoChef_geminiApiKey')).toBeNull();
        expect(StorageService.isGeminiKeySessionOnly()).toBe(true);
    });

    test('switching mode removes the key from the other store', () => {
        StorageService.setGeminiApiKey('AIza-1');
        StorageService.setGeminiApiKey('AIza-1', true);
        expect(localStorage.getItem('ecoChef_geminiApiKey')).toBeNull();
        StorageService.setGeminiApiKey('AIza-1', false);
        expect(sessionStorage.getItem('ecoChef_geminiApiKey')).toBeNull();
    });

    test('empty key and clear remove everything', () => {
        StorageService.setGeminiApiKey('AIza-1');
        StorageService.setGeminiApiKey('');
        expect(StorageService.getGeminiApiKey()).toBe('');
        StorageService.setGeminiApiKey('AIza-2', true);
        StorageService.clearGeminiApiKey();
        expect(StorageService.getGeminiApiKey()).toBe('');
    });
});
