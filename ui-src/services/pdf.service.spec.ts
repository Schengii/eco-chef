import { PdfService, escapeHtml } from './pdf.service';
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

    test('generateCookbookHtml escapes untrusted recipe content', () => {
        const evil = '<img src=x onerror="alert(1)">';
        const recipe = {
            title: evil,
            difficulty: '<b>x</b>',
            prepTime: '"q"',
            ecoScore: "'s'",
            co2SavedKg: 1,
            ingredientsList: [{ item: '<script>steal()</script>', category: 'x' }],
            instructions: ['<svg onload=1>'],
            nutrition: { calories: '<i>', protein: '&', carbs: '1', fat: '2' },
            tip: '<u>tip</u>',
            beverage: '',
            storageTip: '<a href="javascript:1">x</a>'
        } as unknown as Recipe;

        const html = PdfService.generateCookbookHtml([recipe], '<script>x</script>');
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<svg onload');
        expect(html).not.toContain('<a href');
        expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
        expect(html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
    });

    test('escapeHtml handles nullish values', () => {
        expect(escapeHtml(undefined)).toBe('');
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(0)).toBe('0');
    });

    test('printCookbook writes the document into a new window and prints', () => {
        jest.useFakeTimers();
        const win = { document: { write: jest.fn(), close: jest.fn() }, focus: jest.fn(), print: jest.fn() };
        (global as any).window = { open: jest.fn().mockReturnValue(win) };
        const recipe = { title: 'A', ingredientsList: [], instructions: [] } as unknown as Recipe;

        PdfService.printCookbook([recipe]);
        expect(win.document.write).toHaveBeenCalledWith(expect.stringContaining('EcoChef Kochbuch'));
        jest.advanceTimersByTime(600);
        expect(win.print).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test('printCookbook does nothing when the popup is blocked', () => {
        (global as any).window = { open: jest.fn().mockReturnValue(null) };
        expect(() => PdfService.printCookbook([])).not.toThrow();
    });
});
