import {
    validateContents, sanitizeGenerationConfig, isAllowedOrigin, MAX_OUTPUT_TOKENS,
    ALLOWED_MODELS, MODEL_FALLBACKS, modelChain
} from './_validate';

describe('proxy validation', () => {
    test('accepts strings and valid images', () => {
        const r = validateContents(['hi', { inlineData: { data: 'AAAA', mimeType: 'image/jpeg' } }]);
        expect(r).toEqual({ parts: [{ text: 'hi' }, { inlineData: { data: 'AAAA', mimeType: 'image/jpeg' } }] });
    });

    test.each([
        [undefined], [[]], [Array(9).fill('x')], [['x'.repeat(20_001)]],
        [[{ inlineData: { data: 'AAAA', mimeType: 'application/pdf' } }]],
        [[{ inlineData: { data: 'A'.repeat(4_000_001), mimeType: 'image/png' } }]],
        [[42]]
    ])('rejects invalid contents %#', (c) => {
        expect(validateContents(c)).toHaveProperty('error');
    });

    test('config whitelist drops unknown keys and clamps limits', () => {
        const out = sanitizeGenerationConfig({
            responseMimeType: 'application/json', maxOutputTokens: 999999, temperature: 9, systemInstruction: 'evil', tools: []
        });
        expect(out).toEqual({ responseMimeType: 'application/json', maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 2 });
        expect(sanitizeGenerationConfig({ tools: [] })).toBeUndefined();
        expect(sanitizeGenerationConfig('x')).toBeUndefined();
    });

    test('origin allowlist', () => {
        expect(isAllowedOrigin('https://eco-chef-theta.vercel.app')).toBe(true);
        expect(isAllowedOrigin('https://evil.example')).toBe(false);
        expect(isAllowedOrigin(undefined)).toBe(false);
    });

    test('model chain starts with the requested model and has no duplicates', () => {
        expect(modelChain('gemini-3.8-flash')).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']);
        expect(modelChain('gemini-3.5-flash')).toEqual(['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']);
    });

    test('every fallback model is allowed', () => {
        for (const m of MODEL_FALLBACKS) expect(ALLOWED_MODELS.has(m)).toBe(true);
    });
});
