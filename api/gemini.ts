import type { VercelRequest, VercelResponse } from './vercel-types';
import {
    ALLOWED_MODELS,
    isAllowedOrigin,
    modelChain,
    sanitizeGenerationConfig,
    validateContents
} from './_validate';
import { isRateLimited } from './_ratelimit';

export const config = { maxDuration: 60 };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const MAX_BODY_BYTES = 4_500_000; // Vercel-Limit für Request-Bodies

function getClientIp(req: VercelRequest): string {
    const forwarded = (req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for']) as string | undefined;
    return forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin as string | undefined;
    if (origin && isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // Browser-Anfragen von fremden Origins ablehnen (Server-zu-Server hat keinen Origin-Header).
    if (origin && !isAllowedOrigin(origin)) {
        return res.status(403).json({ error: 'Origin nicht erlaubt.' });
    }

    const contentLength = Number(req.headers['content-length'] ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'Anfrage zu groß.' });
    }

    if (await isRateLimited(getClientIp(req))) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            error: 'GEMINI_API_KEY nicht auf dem Server konfiguriert. Bitte API-Key in den EcoChef-Einstellungen eintragen.'
        });
    }

    const { action, model, contents, config: geminiConfig } = (req.body ?? {}) as Record<string, unknown>;

    if (!action) {
        return res.status(400).json({ error: 'Fehlender Parameter: action' });
    }

    if (action === 'generateImages') {
        // Imagen requires Vertex AI credentials – not available in the proxy.
        // The client already has a loremflickr fallback for this case.
        return res.status(501).json({
            error: 'generateImages nicht im Proxy verfügbar – Fallback wird verwendet.',
            generatedImages: []
        });
    }

    if (action !== 'generateContent') {
        return res.status(400).json({ error: 'Unbekannte Aktion.' });
    }

    if (typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
        return res.status(400).json({ error: 'Ungültiges oder nicht autorisiertes Modell.' });
    }
    const validated = validateContents(contents);
    if ('error' in validated) {
        return res.status(400).json({ error: validated.error });
    }

    const body: Record<string, unknown> = { contents: [{ role: 'user', parts: validated.parts }] };
    const generationConfig = sanitizeGenerationConfig(geminiConfig);
    if (generationConfig) body.generationConfig = generationConfig;

    try {
        let response!: Response;
        for (const candidate of modelChain(model)) {
            response = await fetch(`${GEMINI_BASE}/models/${candidate}:generateContent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify(body)
            });
            // Only an overloaded (503) or retired (404) model is worth a retry with the next one.
            if (response.status !== 503 && response.status !== 404) break;
            console.warn('Gemini model unavailable, trying next', candidate, response.status);
        }

        if (!response.ok) {
            // Details nur serverseitig loggen, nicht an den Client durchreichen.
            console.error('Gemini upstream error', response.status, (await response.text()).slice(0, 300));
            const status = response.status === 429 ? 429 : 502;
            return res.status(status).json({
                error: status === 429
                    ? 'Das KI-Kontingent ist gerade ausgeschöpft. Bitte später erneut versuchen.'
                    : 'Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.'
            });
        }

        const data = await response.json() as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return res.json({ text });
    } catch (error: unknown) {
        console.error('Gemini proxy error:', error);
        return res.status(500).json({ error: 'Interner Proxy-Fehler' });
    }
}
