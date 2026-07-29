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
     * Generates a clean SVG String representing a QR Code visually
     */
    generateQrSvgMarkup(text: string): string {
        // High contrast SVG representation of data token
        const size = 200;
        const matrixSize = 21;
        const cellSize = Math.floor(size / matrixSize);
        
        // Simple deterministic hash pattern for visual QR representation
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }

        let rects = '';
        
        // Finder patterns (top-left, top-right, bottom-left)
        const isFinder = (r: number, c: number) => {
            if (r < 7 && c < 7) return true;
            if (r < 7 && c >= matrixSize - 7) return true;
            if (r >= matrixSize - 7 && c < 7) return true;
            return false;
        };

        // Draw cells
        for (let r = 0; r < matrixSize; r++) {
            for (let c = 0; c < matrixSize; c++) {
                let fill = false;
                if (isFinder(r, c)) {
                    // Finder pattern border & core
                    const inTL = r < 7 && c < 7;
                    const inTR = r < 7 && c >= matrixSize - 7;
                    const rRel = inTL ? r : (inTR ? r : r - (matrixSize - 7));
                    const cRel = inTL ? c : (inTR ? c - (matrixSize - 7) : c);
                    if (rRel === 0 || rRel === 6 || cRel === 0 || cRel === 6 || (rRel >= 2 && rRel <= 4 && cRel >= 2 && cRel <= 4)) {
                        fill = true;
                    }
                } else {
                    const pseudoVal = Math.sin(hash * 0.1 + r * 13 + c * 37);
                    fill = pseudoVal > 0.05;
                }

                if (fill) {
                    rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background: #ffffff; padding: 12px; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">${rects}</svg>`;
    }
};
