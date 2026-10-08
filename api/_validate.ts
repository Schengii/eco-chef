/** Request validation for the Gemini proxy (kept separate so it can be unit-tested). */

export const ALLOWED_MODELS = new Set([
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash'
]);

/** Tried in order when the requested model is overloaded (503) or gone (404). Must be a subset of ALLOWED_MODELS. */
export const MODEL_FALLBACKS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

/** Requested model first, then the remaining fallbacks without duplicates. */
export function modelChain(requested: string): string[] {
    return [requested, ...MODEL_FALLBACKS.filter(m => m !== requested)];
}

export const MAX_CONTENT_ITEMS = 8;
export const MAX_TEXT_CHARS = 20_000;
export const MAX_IMAGE_BASE64_CHARS = 4_000_000; // ~3 MB image, below Vercel's 4.5 MB body limit
export const MAX_OUTPUT_TOKENS = 8192;

export type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

export const ALLOWED_ORIGINS = new Set([
    'https://eco-chef-theta.vercel.app',
    'http://localhost:4444',
    'http://localhost',   // Cordova Android (http scheme)
    'https://localhost',  // Cordova Android (https scheme)
    'file://',
    'null'                // file:// pages send "Origin: null"
]);

export function isAllowedOrigin(origin: string | undefined): boolean {
    return !!origin && ALLOWED_ORIGINS.has(origin);
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validates and normalizes contents. Returns parts or an error message. */
export function validateContents(contents: unknown): { parts: Part[] } | { error: string } {
    if (!Array.isArray(contents) || contents.length === 0) {
        return { error: 'Für generateContent ist contents (nicht-leeres Array) erforderlich.' };
    }
    if (contents.length > MAX_CONTENT_ITEMS) {
        return { error: `Zu viele Inhalte (max. ${MAX_CONTENT_ITEMS}).` };
    }
    const parts: Part[] = [];
    for (const item of contents) {
        if (typeof item === 'string') {
            if (item.length > MAX_TEXT_CHARS) return { error: 'Text zu lang.' };
            parts.push({ text: item });
        } else if (isRecord(item) && isRecord(item.inlineData)) {
            const { data, mimeType } = item.inlineData;
            if (typeof data !== 'string' || typeof mimeType !== 'string' || !/^image\/(jpeg|png|webp|heic)$/.test(mimeType)) {
                return { error: 'Ungültiges Bildformat.' };
            }
            if (data.length > MAX_IMAGE_BASE64_CHARS) return { error: 'Bild zu groß.' };
            parts.push({ inlineData: { data, mimeType } });
        } else if (isRecord(item) && typeof item.text === 'string') {
            if (item.text.length > MAX_TEXT_CHARS) return { error: 'Text zu lang.' };
            parts.push({ text: item.text });
        } else {
            return { error: 'Ungültiger Inhalt in contents.' };
        }
    }
    return { parts };
}

/** Whitelists generation config fields; unknown keys are dropped, limits are clamped. */
export function sanitizeGenerationConfig(config: unknown): Record<string, unknown> | undefined {
    if (!isRecord(config)) return undefined;
    const out: Record<string, unknown> = {};
    if (config.responseMimeType === 'application/json' || config.responseMimeType === 'text/plain') {
        out.responseMimeType = config.responseMimeType;
    }
    if (isRecord(config.responseSchema)) out.responseSchema = config.responseSchema;
    if (typeof config.temperature === 'number') out.temperature = Math.min(Math.max(config.temperature, 0), 2);
    if (typeof config.topP === 'number') out.topP = Math.min(Math.max(config.topP, 0), 1);
    if (typeof config.maxOutputTokens === 'number') {
        out.maxOutputTokens = Math.min(Math.max(Math.floor(config.maxOutputTokens), 1), MAX_OUTPUT_TOKENS);
    }
    return Object.keys(out).length ? out : undefined;
}
