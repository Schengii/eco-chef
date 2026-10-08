const generateContent = jest.fn();
const generateImages = jest.fn();
const ctor = jest.fn();

jest.mock('@google/genai', () => ({
    GoogleGenAI: class {
        models = { generateContent, generateImages };
        constructor(opts: unknown) { ctor(opts); }
    }
}));

import { GeminiService } from './gemini.service';

function createStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { store = {}; }
    };
}

/** Exercises the direct path: a user-supplied key loads the SDK lazily and bypasses the proxy. */
describe('GeminiService with user key (lazy SDK)', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        generateContent.mockReset();
        generateImages.mockReset();
        ctor.mockReset();
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        (global as unknown as { localStorage: unknown }).localStorage = createStorageMock();
        (global as unknown as { sessionStorage: unknown }).sessionStorage = createStorageMock();
        localStorage.setItem('ecoChef_geminiApiKey', 'user-key');
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    test('text generation uses the SDK with the user key and never the proxy', async () => {
        generateContent.mockResolvedValue({ text: '  Antwort  ' });
        const text = await GeminiService.askCookingQuestion('Wie lange?', 'Curry');
        expect(text).toContain('Antwort');
        expect(ctor).toHaveBeenCalledWith({ apiKey: 'user-key' });
        expect(generateContent).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('image generation returns a data URL from the SDK', async () => {
        generateImages.mockResolvedValue({ generatedImages: [{ image: { imageBytes: 'QUJD' } }] });
        const img = await GeminiService.generateRecipeImage('Curry');
        expect(img).toBe('data:image/jpeg;base64,QUJD');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('image generation falls back to the local placeholder when the SDK fails', async () => {
        generateImages.mockRejectedValue(new Error('quota'));
        const img = await GeminiService.generateRecipeImage('Curry');
        expect(img.startsWith('data:image/svg+xml')).toBe(true);
    });
});
