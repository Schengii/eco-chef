import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 60 };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const ALLOWED_MODELS = new Set([
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
]);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 Minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 Anfragen pro Minute pro IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }
    record.count++;
    return false;
}

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

function toRestContents(contents: unknown[]): unknown[] {
    const parts: Part[] = contents.map(item =>
        typeof item === 'string' ? { text: item } : (item as Part)
    );
    return [{ role: 'user', parts }];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            error: 'GEMINI_API_KEY nicht auf dem Server konfiguriert. Bitte API-Key in den EcoChef-Einstellungen eintragen.'
        });
    }

    const { action, model, contents, config: geminiConfig, prompt } = (req.body ?? {}) as Record<string, unknown>;

    if (!action) {
        return res.status(400).json({ error: 'Fehlender Parameter: action' });
    }

    try {
        if (action === 'generateContent') {
            if (!model || typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
                return res.status(400).json({ error: `Ungültiges oder nicht autorisiertes Modell: ${String(model)}` });
            }
            if (!Array.isArray(contents)) {
                return res.status(400).json({ error: 'Für generateContent ist contents (Array) erforderlich.' });
            }

            const body: Record<string, unknown> = {
                contents: toRestContents(contents as unknown[])
            };
            if (geminiConfig) body.generationConfig = geminiConfig;

            const response = await fetch(
                `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 300)}`);
            }

            const data = await response.json() as {
                candidates?: { content?: { parts?: { text?: string }[] } }[];
            };
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            return res.json({ text });
        }

        if (action === 'generateImages') {
            // Imagen requires Vertex AI credentials – not available in Hobby proxy.
            // The client already has a loremflickr fallback for this case.
            return res.status(501).json({
                error: 'generateImages nicht im Proxy verfügbar – Fallback wird verwendet.',
                generatedImages: []
            });
        }

        return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });

    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error('Gemini proxy error:', err);
        const status = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
        return res.status(status).json({ error: err.message ?? 'Interner Proxy-Fehler' });
    }
}
