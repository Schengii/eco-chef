/** @jest-environment jsdom */
import { RecipeGeneratorController, RecipeGeneratorHost } from './recipe-generator.controller';
import { GeminiService } from '../services/gemini.service';
import type { Recipe } from '../models/eco-chef.models';

const toast = jest.fn();
jest.mock('../components/eco-chef-toast', () => ({ showToast: (...a: unknown[]) => toast(...a), showConfirmToast: jest.fn() }));
jest.mock('../services/speech.service', () => ({ SpeechService: { speak: jest.fn(), cancelSpeak: jest.fn() } }));
jest.mock('../services/gemini.service', () => ({
    GeminiService: {
        generateRecipeFromOptions: jest.fn(),
        generateRecipeImage: jest.fn(),
        askCookingQuestion: jest.fn()
    }
}));

const gemini = GeminiService as jest.Mocked<typeof GeminiService>;
const recipe = {
    title: 'Pfanne', nutrition: { calories: '400 kcal', protein: '10g', carbs: '50g', fat: '8g' },
    ingredientsList: [{ item: '200 g Reis', category: 'Vorrat' }], instructions: ['Kochen']
} as unknown as Recipe;

function make(overrides: Record<string, unknown> = {}) {
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        recipe: null as Recipe | null,
        recipeImage: null as string | null,
        isLoading: false,
        capturedImage: null as string | null,
        ingredientChips: ['Tomaten', 'Reis'],
        urgentIngredients: { Tomaten: true, Gurke: true } as Record<string, boolean>,
        selectedAllergens: { Gluten: true, Nüsse: false } as Record<string, boolean>,
        allowExtraIngredients: true,
        selectedDiet: 'vegan',
        selectedEffort: 'schnell',
        persons: 2,
        pantry: { activeStapleKeys: () => ['Salz'] },
        addIngredientFromInput: jest.fn(),
        preloadRecipeComponents: jest.fn(),
        announce: jest.fn(),
        ...overrides
    };
    return { host, gen: new RecipeGeneratorController(host as unknown as RecipeGeneratorHost) };
}

describe('RecipeGeneratorController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('refuses to generate without ingredients or photo', async () => {
        const { host, gen } = make({ ingredientChips: [] });
        await gen.generate();
        expect(gemini.generateRecipeFromOptions).not.toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith('Bitte gib zuerst Zutaten ein oder mache ein Foto deines Kühlschranks!', 'warning');
        expect(host.isLoading).toBe(false);
    });

    it('builds the request from the app state and stores recipe and image', async () => {
        gemini.generateRecipeFromOptions.mockResolvedValue(recipe);
        gemini.generateRecipeImage.mockResolvedValue('data:image/jpeg;base64,img');
        const { host, gen } = make();
        await gen.generate();
        await new Promise(r => setTimeout(r));

        expect(gemini.generateRecipeFromOptions).toHaveBeenCalledWith(expect.objectContaining({
            ingredientChips: ['Tomaten', 'Reis'],
            pantryKeys: ['Salz'],
            urgentIngredients: ['Tomaten'],
            activeAllergens: ['Gluten'],
            diet: 'vegan',
            effort: 'schnell',
            portions: 2
        }));
        expect(host.preloadRecipeComponents).toHaveBeenCalled();
        expect(host.isLoading).toBe(false);
        expect(host.recipeImage).toBe('data:image/jpeg;base64,img');
        expect(host.recipe?.image).toBe('data:image/jpeg;base64,img');
        expect(gen.isGeneratingImage).toBe(false);
    });

    it('keeps the recipe when image generation fails', async () => {
        gemini.generateRecipeFromOptions.mockResolvedValue(recipe);
        gemini.generateRecipeImage.mockRejectedValue(new Error('no imagen'));
        const { host, gen } = make();
        await gen.generate();
        await new Promise(r => setTimeout(r));
        expect(host.recipe?.title).toBe('Pfanne');
        expect(host.recipe?.image).toBeUndefined();
        expect(gen.isGeneratingImage).toBe(false);
    });

    it('shows a friendly error and resets loading when the request fails', async () => {
        gemini.generateRecipeFromOptions.mockRejectedValue(new Error('HTTP 429'));
        const { host, gen } = make();
        await gen.generate();
        expect(gen.lastError).toBe('API-Limit erreicht. Bitte kurz warten und dann erneut versuchen.');
        expect(toast).toHaveBeenCalledWith(gen.lastError, 'error', { duration: 5000 });
        expect(host.isLoading).toBe(false);
        expect(host.recipe).toBeNull();
    });

    it('remembers follow-up prompts, ignores blank ones, and resets the chat', async () => {
        gemini.generateRecipeFromOptions.mockResolvedValue(recipe);
        gemini.generateRecipeImage.mockResolvedValue('x');
        const { gen } = make();
        await gen.regenerate('schärfer bitte');
        await gen.regenerate('   ');
        expect(gen.chatHistory).toEqual(['schärfer bitte']);
        expect(gemini.generateRecipeFromOptions).toHaveBeenLastCalledWith(expect.objectContaining({ chatHistory: ['schärfer bitte'] }));
        gen.resetChat();
        expect(gen.chatHistory).toEqual([]);
    });

    it('scales portions and ignores no-op or invalid changes', () => {
        const { host, gen } = make({ recipe });
        gen.changePortions(2);
        gen.changePortions(0);
        expect(host.persons).toBe(2);
        gen.changePortions(4);
        expect(host.persons).toBe(4);
        expect(host.recipe?.ingredientsList[0].item).toBe('400 g Reis');
        expect(host.announce).toHaveBeenCalledWith('Portionsmenge von 2 auf 4 Personen angepasst.');
    });

    it('answers cooking questions and handles failures', async () => {
        const { gen } = make({ recipe });
        gemini.askCookingQuestion.mockResolvedValueOnce('Rühr öfter um.');
        await gen.askAssistant('Brennt das an?');
        expect(gen.assistantAnswer).toBe('Rühr öfter um.');

        gemini.askCookingQuestion.mockRejectedValueOnce(new Error('x'));
        await gen.askAssistant('Und jetzt?');
        expect(gen.assistantAnswer).toBe('Fehler bei der Antwort des Kochassistenten.');

        await gen.askAssistant('');
        expect(gemini.askCookingQuestion).toHaveBeenCalledTimes(2);
    });
});
