import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../api-config';
import { StorageService } from './storage.service';

function getApiKey(): string {
    return StorageService.getGeminiApiKey() || GEMINI_API_KEY;
}

function hasDirectKey(): boolean {
    return Boolean(StorageService.getGeminiApiKey() || GEMINI_API_KEY);
}

async function callProxy(action: string, payload: Record<string, unknown>): Promise<any> {
    const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((err as { error?: string }).error ?? `Proxy-Fehler HTTP ${res.status}`);
    }
    return res.json();
}

function buildImageContents(capturedImage: string): { inlineData: { data: string; mimeType: string } } {
    let base64Data = '';
    let mimeType = 'image/jpeg';
    if (capturedImage.includes(',')) {
        const parts = capturedImage.split(',');
        base64Data = parts[1];
        const mimeMatch = parts[0].match(/data:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
    } else {
        base64Data = capturedImage;
    }
    return { inlineData: { data: base64Data, mimeType } };
}

export const GeminiService = {
    getClient(): GoogleGenAI {
        return new GoogleGenAI({ apiKey: getApiKey() });
    },

    async generateRecipe(capturedImage: string | null, promptText: string): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contents: any[] = [];
        if (capturedImage) contents.push(buildImageContents(capturedImage));
        contents.push(promptText);

        const payload = {
            model: 'gemini-flash-latest',
            contents,
            config: { responseMimeType: 'application/json' }
        };

        if (!hasDirectKey()) {
            const result = await callProxy('generateContent', payload);
            return (result as { text?: string }).text ?? '';
        }

        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent(payload);
        return response.text ?? '';
    },

    async generateRecipeImage(title: string): Promise<string> {
        const imagePrompt = `A beautiful, clean studio food photography of ${title}, professional plating, high quality food shot, soft lighting, 4k`;
        const imagePayload = {
            model: 'imagen-3.0-generate-002',
            prompt: imagePrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
        };

        let generatedImages: any[] | null = null;

        try {
            if (!hasDirectKey()) {
                const result = await callProxy('generateImages', imagePayload);
                generatedImages = (result as { generatedImages?: any[] }).generatedImages ?? null;
            } else {
                const ai = new GoogleGenAI({ apiKey: getApiKey() });
                const response = await ai.models.generateImages({
                    model: imagePayload.model,
                    prompt: imagePrompt,
                    config: imagePayload.config
                });
                generatedImages = response.generatedImages ?? null;
            }

            if (generatedImages?.[0]?.image?.imageBytes) {
                return `data:image/jpeg;base64,${generatedImages[0].image.imageBytes}`;
            }
            throw new Error('No image returned by Imagen.');

        } catch (e) {
            console.warn('Imagen failed, using smart Gemini fallback keywords for loremflickr:', e);

            let hash = 0;
            for (let i = 0; i < title.length; i++) {
                hash = title.charCodeAt(i) + ((hash << 5) - hash);
            }
            const lock = Math.abs(hash) % 1000;

            try {
                const kwPrompt = `Translate the German food dish "${title}" to English and extract 2 to 3 descriptive comma-separated keywords (nouns/adjectives) that represent this dish for an image search (e.g. for "Spaghetti mit Tomatensoße" output "pasta,spaghetti,tomato").
Antworte AUSSCHLIESSLICH mit diesen kommagetrennten englischen Wörtern in Kleinbuchstaben, ohne Satzzeichen, ohne Anführungszeichen, ohne Zusatztext.`;

                let kwText = '';
                if (!hasDirectKey()) {
                    const kwResult = await callProxy('generateContent', {
                        model: 'gemini-flash-latest',
                        contents: [kwPrompt]
                    });
                    kwText = (kwResult as { text?: string }).text ?? '';
                } else {
                    const ai = new GoogleGenAI({ apiKey: getApiKey() });
                    const kwResponse = await ai.models.generateContent({
                        model: 'gemini-flash-latest',
                        contents: [kwPrompt]
                    });
                    kwText = kwResponse.text ?? '';
                }

                const keywords = kwText.trim().toLowerCase().replace(/[^a-z,]/g, '');
                if (keywords && keywords.length > 2) {
                    return `https://loremflickr.com/600/400/food,${encodeURIComponent(keywords)}/all?lock=${lock}`;
                }
            } catch (err) {
                console.error('Gemini keyword classification failed:', err);
            }

            return `https://loremflickr.com/600/400/food?lock=${lock}`;
        }
    },

    async scanReceipt(capturedImage: string): Promise<any[]> {
        const prompt = `Du bist ein intelligenter Kassenzettel-Scanner für Lebensmittel. Analysiere das hochgeladene Bild eines Einkaufszettels/Kassenzettels und extrahiere alle essbaren Produkte, Lebensmittel und Kochzutaten. Ignoriere Non-Food Artikel wie Zahnpasta, Tragetaschen, Zeitschriften etc.
Bereinige die Namen der Produkte von Marken, Preisen und Abkürzungen (z.B. aus 'JA! VOLLMILCH 1,5% 1L' wird 'Milch', aus 'BIO DR. OETKER PUDDING' wird 'Puddingpulver').

Bestimme für jedes extrahierte Lebensmittel zusätzlich:
1. Eine geschätzte Menge (quantity, als Zahl, z.B. 1, 500, 2) und die passende Einheit (unit, z.B. "Stk.", "g", "ml", "L", "Pkg.").
2. Den am besten geeigneten Lagerort (location, MUSS einer der folgenden Werte sein: "Kühlschrank", "Vorratskammer", "Gefrierfach", "Sonstiges").
3. Die geschätzte typische Haltbarkeit in Tagen ab dem Kaufdatum (expiryDays, als Zahl, z.B. 7 für Frischmilch, 3 für Hackfleisch, 14 für Käse, 365 für Nudeln/Reis).

Antworte AUSSCHLIESSLICH mit einem validen JSON-Array aus Objekten in deutscher Sprache, z.B.:
[
  {
    "name": "Milch",
    "quantity": 1,
    "unit": "L",
    "expiryDays": 7,
    "location": "Kühlschrank"
  }
]
Gib keine Markdown-Formatierung wie \`\`\`json zurück, sondern NUR das reine Array.`;

        const contents = [buildImageContents(capturedImage), prompt];
        const payload = { model: 'gemini-flash-latest', contents, config: { responseMimeType: 'application/json' } };

        let text = '';
        if (!hasDirectKey()) {
            const result = await callProxy('generateContent', payload);
            text = (result as { text?: string }).text ?? '';
        } else {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent(payload);
            text = (response.text ?? '').trim();
        }

        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse scanned receipt response:', cleaned, e);
            try {
                const startIndex = cleaned.indexOf('[');
                const endIndex = cleaned.lastIndexOf(']');
                if (startIndex !== -1 && endIndex !== -1) {
                    return JSON.parse(cleaned.substring(startIndex, endIndex + 1));
                }
            } catch (err) {
                console.error('Fallback regex parsing failed:', err);
            }
            return [];
        }
    },

    async askCookingQuestion(question: string, recipeTitle: string): Promise<string> {
        const prompt = `Du bist ein erfahrener Küchenchef-Assistent im Live-Kochmodus.
Der Nutzer kocht gerade das Rezept "${recipeTitle}".
Nutzerfrage: "${question}"

Antworte prägnant, hilfreich und freundlich in 1-2 kurzen Sätzen auf Deutsch, damit es beim Kochen direkt verstanden wird. Keine Listen oder lange Erklärungen.`;

        const payload = { model: 'gemini-2.5-flash', contents: [prompt] };

        try {
            let text = '';
            if (!hasDirectKey()) {
                const result = await callProxy('generateContent', payload);
                text = (result as { text?: string }).text ?? '';
            } else {
                const client = this.getClient();
                const response = await client.models.generateContent(payload);
                text = response.text ?? '';
            }
            return text.trim() || 'Entschuldigung, ich konnte die Frage nicht beantworten.';
        } catch (e) {
            console.error('Failed to answer cooking question', e);
            return 'Entschuldigung, bei der Abfrage des Kochassistenten gab es ein Problem.';
        }
    },

    async generateWeeklyPlan(pantry: string[], diet: string, effort: string, persons: number, isMealPrep = false): Promise<any> {
        const prepClause = isMealPrep
            ? '\nOptimiere den Plan extrem für Meal Prep / Batch Cooking: Wähle eine oder zwei Hauptzutaten (z.B. Linsen, Süßkartoffeln, Quinoa, Kichererbsen), die am Wochenanfang in großer Menge zubereitet und an mehreren Tagen in verschiedenen Gerichten kreativ wiederverwendet werden, um Kochzeit und Energie zu sparen. Erwähne das in den \'notes\' der Gerichte.'
            : '';

        const prompt = `Generiere einen wöchentlichen Speiseplan (Montag bis Sonntag) für ${persons} Personen.${prepClause}
Berücksichtige folgende vorhandene Vorräte: ${pantry.join(', ') || 'keine angegeben'}.
Ernährungsweise: ${diet}. Zubereitungsaufwand: ${effort}.
Der Speiseplan soll als JSON-Objekt zurückgegeben werden. Jeder Wochentag (Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag) soll ein eigenes Feld mit folgenden Eigenschaften sein:
- "title": Name des Gerichts (auf Deutsch)
- "prepTime": Zubereitungszeit (z.B. "25 Min.")
- "co2SavedKg": Schätzung der CO2-Ersparnis in kg gegenüber einem fleischlastigen Standardgericht (Dezimalzahl)
- "notes": Kurze Erklärung, warum dieses Gericht gewählt wurde oder wie die angegebenen Vorräte genutzt werden.

Gib AUSSCHLIESSLICH dieses JSON-Objekt zurück, ohne zusätzlichen Text und ohne \`\`\`json Formatierung.`;

        const payload = { model: 'gemini-flash-latest', contents: [prompt], config: { responseMimeType: 'application/json' } };

        let text = '';
        if (!hasDirectKey()) {
            const result = await callProxy('generateContent', payload);
            text = (result as { text?: string }).text ?? '';
        } else {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent(payload);
            text = (response.text ?? '').trim();
        }

        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse weekly plan:', cleaned, e);
            throw e;
        }
    },

    async scanPantryItem(capturedImage: string): Promise<any> {
        const prompt = `Analysiere das Bild dieses Lebensmittel-Produkts oder seiner Verpackung.
Extrahiere:
1. Den Namen des Lebensmittels (name, z.B. "Naturjoghurt").
2. Die Menge (quantity, z.B. 500) und Einheit (unit, z.B. "g").
3. Das gedruckte Mindesthaltbarkeitsdatum (expiryDate im Format YYYY-MM-DD, z.B. "2026-08-15"). Falls kein konkretes Datum auf dem Produkt erkennbar ist, schätze die typische Haltbarkeit in Tagen ab heute ab und gib das berechnete Datum zurück.
4. Den Lagerort (location: "Kühlschrank", "Vorratskammer", "Gefrierfach" oder "Sonstiges").

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, ohne Markdown-Formatierung:
{
  "name": "Produktname",
  "quantity": 500,
  "unit": "g",
  "expiryDate": "YYYY-MM-DD",
  "location": "Kühlschrank"
}`;

        const contents = [buildImageContents(capturedImage), prompt];
        const payload = { model: 'gemini-flash-latest', contents, config: { responseMimeType: 'application/json' } };

        let text = '';
        if (!hasDirectKey()) {
            const result = await callProxy('generateContent', payload);
            text = (result as { text?: string }).text ?? '';
        } else {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent(payload);
            text = (response.text ?? '').trim();
        }

        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse scanned product package:', cleaned, e);
            throw e;
        }
    }
};
