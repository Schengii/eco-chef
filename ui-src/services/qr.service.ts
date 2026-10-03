import qrcode from 'qrcode-generator';
import { Recipe } from '../models/eco-chef.models';

export const QrService = {
    /**
     * Serializes a Recipe into a compact JSON string for QR Code sharing
     */
    encodeRecipePayload(recipe: Recipe): string {
        const minimal = {
            v: 1,
            t: recipe.title,
            d: recipe.difficulty,
            p: recipe.prepTime,
            e: recipe.ecoScore,
            i: recipe.ingredientsList.map(ing => ing.item),
            s: recipe.instructions,
            c: recipe.co2SavedKg || 0,
            n: recipe.nutrition
        };
        return JSON.stringify(minimal);
    },

    /**
     * Restores a Recipe object from a scanned QR Code payload string
     */
    decodeRecipePayload(payloadStr: string): Recipe | null {
        try {
            const data = JSON.parse(payloadStr);
            if (!data || !data.t || !Array.isArray(data.s)) {
                return null;
            }
            return {
                title: data.t,
                difficulty: data.d || 'Mittel',
                prepTime: data.p || '25 Min',
                ecoScore: data.e || 'A+',
                co2SavedKg: typeof data.c === 'number' ? data.c : (parseFloat(data.c) || 0),
                beverage: 'Wasser / Passender Wein',
                storageTip: 'Kühl und luftdicht verschlossen aufbewahren.',
                nutrition: data.n || { calories: '450 kcal', protein: '18g', carbs: '55g', fat: '12g' },
                ingredientsList: Array.isArray(data.i) ? data.i.map((item: any) => typeof item === 'string' ? { item, category: 'Zutat' } : item) : [],
                instructions: data.s,
                tip: 'Frisch genießen!'
            };
        } catch (e) {
            console.error('Failed to decode QR recipe payload', e);
            return null;
        }
    },

    /**
     * Generates a valid, standards-compliant SVG String representing a real QR Code.
     * Compatible with any camera scanner or QR reader app.
     */
    generateQrSvgMarkup(text: string): string {
        try {
            // 0 = automatic type selection (1 to 40), 'M' = 15% error correction
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();

            const count = qr.getModuleCount();
            const margin = 2;
            const size = 240;
            const totalModules = count + margin * 2;
            const cellSize = size / totalModules;

            let rects = '';
            for (let r = 0; r < count; r++) {
                for (let c = 0; c < count; c++) {
                    if (qr.isDark(r, c)) {
                        const x = ((c + margin) * cellSize).toFixed(2);
                        const y = ((r + margin) * cellSize).toFixed(2);
                        const w = cellSize.toFixed(2);
                        const h = cellSize.toFixed(2);
                        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0f172a" />`;
                    }
                }
            }

            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background: #ffffff; padding: 12px; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">${rects}</svg>`;
        } catch (err) {
            console.error('Failed to generate QR code SVG:', err);
            // Fallback error SVG
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ef4444" font-size="12">QR-Code Fehler</text></svg>`;
        }
    }
};
