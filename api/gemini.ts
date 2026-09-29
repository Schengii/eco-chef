import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
    maxDuration: 60, // seconds – requires Vercel Pro; Hobby tier caps at 10s
};

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

    const { action, model, contents, config: geminiConfig, prompt, params } = req.body ?? {};

    if (!action) {
        return res.status(400).json({ error: 'Fehlender Parameter: action erforderlich.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        if (action === 'generateContent') {
            if (!model || !contents) {
                return res.status(400).json({ error: 'Für generateContent sind model und contents erforderlich.' });
            }
            const response = await ai.models.generateContent({ model, contents, config: geminiConfig });
            return res.json({ text: response.text ?? '' });
        }

        if (action === 'generateImages') {
            if (!model || !prompt) {
                return res.status(400).json({ error: 'Für generateImages sind model und prompt erforderlich.' });
            }
            const response = await ai.models.generateImages({
                model,
                prompt,
                config: params?.config ?? geminiConfig
            });
            return res.json({ generatedImages: response.generatedImages ?? [] });
        }

        return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });

    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error('Gemini proxy error:', err);
        const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600
            ? err.status : 500;
        return res.status(status).json({ error: err.message ?? 'Interner Proxy-Fehler' });
    }
}
