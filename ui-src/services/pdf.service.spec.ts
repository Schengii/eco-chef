import { PdfService } from './pdf.service';
import { Recipe } from '../models/eco-chef.models';

describe('PdfService Tests', () => {
    test('generateCookbookHtml handles empty recipes array', () => {
        const html = PdfService.generateCookbookHtml([]);
        expect(html).toContain('Keine Rezepte zum Drucken vorhanden.');
    });

    test('generateCookbookHtml generates valid HTML with recipe metadata', () => {
        const dummyRecipes: Recipe[] = [
            {
                title: 'Nachhaltiges Gemüsecurry',
                difficulty: 'Leicht',
                prepTime: '20 Min.',
                ecoScore: '🍃🍃🍃🍃🍃',
                ecoScoreDetails: 'Sehr gut',
                co2Footprint: 'Niedrig',
                co2SavedKg: 1.8,
                ingredientsList: [
                    { item: '200g Linsen', category: 'Hülsenfrüchte' },
                    { item: '1 Kokosmilch', category: 'Konserven' }
                ],
                instructions: ['Gemüse anschwitzen', 'Kokosmilch zugeben und 15 Min. köcheln.'],
                nutrition: {
                    calories: '450 kcal',
                    protein: '18g',
                    carbs: '55g',
                    fat: '12g'
                },
                tip: 'Mit frischem Koriander servieren.',
                beverage: 'Wasser mit Zitrone',
                storageTip: 'Im Kühlschrank 2 Tage haltbar.'
            }
        ];

        const html = PdfService.generateCookbookHtml(dummyRecipes, '👨‍🍳');
        expect(html).toContain('Nachhaltiges Gemüsecurry');
        expect(html).toContain('1.8 kg CO₂ gespart');
        expect(html).toContain('200g Linsen');
        expect(html).toContain('👨‍🍳');
    });
});
