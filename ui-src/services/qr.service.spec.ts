import { QrService } from './qr.service';
import { Recipe } from '../models/eco-chef.models';

describe('QrService Tests', () => {
    const testRecipe: Recipe = {
        title: 'Schnelles Gemüse-Curry',
        difficulty: 'Einfach',
        prepTime: '20 Min',
        ecoScore: 'A+',
        co2SavedKg: 2.1,
        beverage: 'Wasser',
        storageTip: 'Kühl lagern',
        nutrition: { calories: '400 kcal', protein: '15g', carbs: '50g', fat: '10g' },
        ingredientsList: [
            { item: '2 Tomaten', category: 'Obst & Gemüse' },
            { item: '100g Reis', category: 'Vorrat' }
        ],
        instructions: ['Reis kochen', 'Gemüse anbraten', 'Servieren'],
        tip: 'Guten Appetit!'
    };

    test('should encode and decode recipe payload correctly', () => {
        const encoded = QrService.encodeRecipePayload(testRecipe);
        expect(typeof encoded).toBe('string');
        
        const decoded = QrService.decodeRecipePayload(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded?.title).toBe('Schnelles Gemüse-Curry');
        expect(decoded?.co2SavedKg).toBe(2.1);
        expect(decoded?.instructions.length).toBe(3);
    });

    test('should generate valid QR SVG markup', () => {
        const svg = QrService.generateQrSvgMarkup('test-payload');
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox');
        expect(svg).toContain('</svg>');
    });
});
