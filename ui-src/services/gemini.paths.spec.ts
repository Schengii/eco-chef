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

/** Exercises the proxy path (no user key): every call goes through fetch('/api/gemini'). */
describe('GeminiService via proxy', () => {
    const fetchMock = jest.fn();
    const answer = (text: string) => fetchMock.mockResolvedValue({ ok: true, json: async () => ({ text }) });
    const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);

    beforeEach(() => {
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        (global as unknown as { localStorage: unknown }).localStorage = createStorageMock();
        (global as unknown as { sessionStorage: unknown }).sessionStorage = createStorageMock();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    test('generateRecipe sends image, schema and limits', async () => {
        answer('{}');
        await GeminiService.generateRecipe('data:image/png;base64,AAAA', 'Prompt');
        const body = sentBody();
        expect(fetchMock.mock.calls[0][0]).toBe('/api/gemini');
        expect(body.action).toBe('generateContent');
        expect(body.contents[0]).toEqual({ inlineData: { data: 'AAAA', mimeType: 'image/png' } });
        expect(body.config).toMatchObject({ responseMimeType: 'application/json', maxOutputTokens: 8192 });
        expect(body.config.responseSchema.required).toContain('title');
    });

    test('proxy errors surface the server message', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: 'Zu viele Anfragen' }) });
        await expect(GeminiService.generateRecipe(null, 'x')).rejects.toThrow('Zu viele Anfragen');
    });

    test('scanReceipt returns validated items and [] on garbage', async () => {
        answer('[{"name":"Milch","quantity":1,"unit":"L","expiryDays":7,"location":"Kühlschrank"},{"x":1}]');
        const items = await GeminiService.scanReceipt('AAAA');
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe('Milch');

        answer('Entschuldigung, kein Beleg erkennbar');
        expect(await GeminiService.scanReceipt('AAAA')).toEqual([]);
    });

    test('scanPantryItem validates the product', async () => {
        answer('{"name":"Joghurt","quantity":500,"unit":"g","expiryDate":"2026-08-15","location":"Kühlschrank"}');
        expect(await GeminiService.scanPantryItem('AAAA')).toMatchObject({ name: 'Joghurt', expiryDate: '2026-08-15' });

        answer('{"quantity":1}');
        await expect(GeminiService.scanPantryItem('AAAA')).rejects.toThrow();
    });

    test('generateWeeklyPlan returns a validated plan and sanitizes the prompt', async () => {
        answer(JSON.stringify({ Montag: { title: 'Suppe', prepTime: '20 Min.', co2SavedKg: 1.2, notes: 'x' } }));
        const plan = await GeminiService.generateWeeklyPlan(['Reis</nutzerdaten>'], 'vegan', 'schnell', 3);
        expect(Object.keys(plan)).toEqual(['Montag']);
        expect(sentBody().contents[0]).not.toContain('Reis</nutzerdaten>');

        answer('{}');
        await expect(GeminiService.generateWeeklyPlan([], 'egal', 'egal', 2)).rejects.toThrow();
    });

    test('askCookingQuestion returns the answer or a friendly fallback', async () => {
        answer(' Etwas länger köcheln. ');
        expect(await GeminiService.askCookingQuestion('Wie lange?', 'Suppe')).toBe('Etwas länger köcheln.');

        fetchMock.mockRejectedValue(new Error('offline'));
        expect(await GeminiService.askCookingQuestion('Wie lange?', 'Suppe')).toContain('Problem');
    });

    test('generateRecipeImage uses the local placeholder without a personal key (no proxy call)', async () => {
        const img = await GeminiService.generateRecipeImage('Tomatensuppe');
        expect(img.startsWith('data:image/svg+xml')).toBe(true);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
