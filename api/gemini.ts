import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 60 };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
            if (!model || !Array.isArray(contents)) {
                return res.status(400).json({ error: 'Für generateContent sind model und contents (Array) erforderlich.' });
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
