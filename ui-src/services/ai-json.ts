import type { z } from 'zod';

/** Extracts the outermost JSON object/array from an AI answer (tolerates ```json fences and prose). */
export function extractJson(text: string): unknown {
    const cleaned = (text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const pairs: Array<[string, string]> = [['{', '}'], ['[', ']']];
    const first = pairs
        .map(([open, close]) => ({ close, idx: cleaned.indexOf(open) }))
        .filter(c => c.idx !== -1)
        .sort((a, b) => a.idx - b.idx)[0];
    if (!first) throw new Error('Kein gültiges JSON in der KI-Antwort gefunden.');
    const end = cleaned.lastIndexOf(first.close);
    if (end <= first.idx) throw new Error('Kein gültiges JSON in der KI-Antwort gefunden.');
    try {
        return JSON.parse(cleaned.slice(first.idx, end + 1));
    } catch {
        throw new Error('Die KI-Antwort enthielt ungültiges JSON.');
    }
}

export function parseAiJson<S extends z.ZodType>(text: string, schema: S, errorMessage: string): z.output<S> {
    const result = schema.safeParse(extractJson(text));
    if (!result.success) {
        console.error('[AI] Schema validation failed:', result.error.issues);
        throw new Error(errorMessage);
    }
    return result.data;
}
