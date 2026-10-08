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

    test('image generation uses the Gemini image model and returns a data URL', async () => {
        generateContent.mockResolvedValue({
            candidates: [{ content: { parts: [{ text: 'hier' }, { inlineData: { mimeType: 'image/png', data: 'QUJD' } }] } }]
        });
        const img = await GeminiService.generateRecipeImage('Curry');
        expect(img).toBe('data:image/png;base64,QUJD');
        expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
            model: 'gemini-nano-banana-2.1',
            config: expect.objectContaining({ responseModalities: ['IMAGE'] })
        }));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('image generation falls back to the local placeholder when the model fails or returns no image', async () => {
        generateContent.mockRejectedValueOnce(new Error('quota'));
        expect((await GeminiService.generateRecipeImage('Curry')).startsWith('data:image/svg+xml')).toBe(true);
        generateContent.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: 'nur Text' }] } }] });
        expect((await GeminiService.generateRecipeImage('Curry')).startsWith('data:image/svg+xml')).toBe(true);
    });

    test('text generation uses gemini-3.5-flash and falls back when the model is overloaded', async () => {
        generateContent
            .mockRejectedValueOnce(Object.assign(new Error('This model is currently experiencing high demand'), { status: 503 }))
            .mockResolvedValueOnce({ text: 'Fallback-Antwort' });
        const text = await GeminiService.askCookingQuestion('Wie lange?', 'Curry');
        expect(text).toContain('Fallback-Antwort');
        expect(generateContent.mock.calls[0][0].model).toBe('gemini-3.5-flash');
        expect(generateContent.mock.calls[1][0].model).toBe('gemini-3.5-flash-lite');
    });

    test('other SDK errors are not retried', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        generateContent.mockRejectedValue(Object.assign(new Error('API key not valid'), { status: 400 }));
        const text = await GeminiService.askCookingQuestion('Wie lange?', 'Curry');
        expect(text).toContain('Problem');
        expect(generateContent).toHaveBeenCalledTimes(1);
    });
});
