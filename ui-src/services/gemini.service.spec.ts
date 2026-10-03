import { GeminiService } from './gemini.service';

describe('GeminiService Tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('generateRecipeFromOptions should parse valid JSON and normalize recipe', async () => {
        const mockJsonResponse = JSON.stringify({
            title: 'Kreatives Gemüse-Curry',
            difficulty: 'Leicht',
            prepTime: '25 Min.',
            ecoScore: '🍃🍃🍃🍃',
            ecoScoreDetails: 'Saisonal und pflanzlich',
            co2Footprint: 'Niedrig',
            co2SavedKg: 1.8,
            beverage: 'Frisches Zitronenwasser',
            storageTip: '2 Tage im Kühlschrank haltbar',
            nutrition: { calories: '420 kcal', protein: '12g', carbs: '55g', fat: '10g' },
            ingredientsList: [
                { item: '2 Zucchini', category: 'Obst & Gemüse' },
                '1 Dose Kokosmilch'
            ],
            instructions: ['Gemüse schneiden', 'Anbraten und köcheln lassen'],
            tip: 'Mit frischem Koriander verfeinern.'
        });

        jest.spyOn(GeminiService, 'generateRecipe').mockResolvedValue(mockJsonResponse);

        const recipe = await GeminiService.generateRecipeFromOptions({
            ingredientChips: ['Zucchini', 'Kokosmilch'],
            portions: 2
        });

        expect(recipe.title).toBe('Kreatives Gemüse-Curry');
        expect(recipe.co2SavedKg).toBe(1.8);
        expect(recipe.instructions.length).toBe(2);
        expect(recipe.ingredientsList.length).toBe(2);
        expect(recipe.ingredientsList[1].item).toBe('1 Dose Kokosmilch');
        expect(recipe.ingredientsList[1].category).toBe('Sonstiges');
    });

    test('generateRecipeFromOptions should throw error when JSON is missing or malformed', async () => {
        jest.spyOn(GeminiService, 'generateRecipe').mockResolvedValue('Entschuldigung, ich konnte kein Rezept finden.');

        await expect(GeminiService.generateRecipeFromOptions({
            ingredientChips: ['Wasser'],
            portions: 1
        })).rejects.toThrow();
    });
});
