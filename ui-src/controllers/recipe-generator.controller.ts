import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Recipe } from '../models/eco-chef.models';
import { GeminiService } from '../services/gemini.service';
import { SpeechService } from '../services/speech.service';
import { describeAiError, scaleRecipePortions } from '../services/recipe-utils';
import { showToast } from '../components/eco-chef-toast';
import type { PantryController } from './pantry.controller';

/** The app state a recipe request is built from, and the result it is written back to. */
export interface RecipeGeneratorHost extends ReactiveControllerHost {
    recipe: Recipe | null;
    recipeImage: string | null;
    isLoading: boolean;
    capturedImage: string | null;
    ingredientChips: string[];
    urgentIngredients: Record<string, boolean>;
    selectedAllergens: Record<string, boolean>;
    allowExtraIngredients: boolean;
    selectedDiet: string;
    selectedEffort: string;
    persons: number;
    readonly pantry: Pick<PantryController, 'activeStapleKeys'>;
    addIngredientFromInput(): void;
    /** Starts loading the recipe and cooking-mode chunks while the AI is working. */
    preloadRecipeComponents(): void;
    announce(message: string): void;
}

/** Recipe generation with Gemini: request, follow-up chat, image, portion scaling and the cooking assistant. */
export class RecipeGeneratorController implements ReactiveController {
    chatHistory: string[] = [];
    isGeneratingImage = false;
    assistantAnswer = '';
    lastError: string | null = null;

    constructor(private readonly host: RecipeGeneratorHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    generate = async (): Promise<void> => {
        const host = this.host;
        host.addIngredientFromInput();

        if (host.ingredientChips.length === 0 && !host.capturedImage) {
            showToast('Bitte gib zuerst Zutaten ein oder mache ein Foto deines Kühlschranks!', 'warning');
            return;
        }

        host.preloadRecipeComponents();
        host.isLoading = true;
        this.lastError = null;
        host.recipe = null;
        host.recipeImage = null;
        host.announce('Rezept wird von der Künstlichen Intelligenz generiert. Bitte warten Sie einen moment.');

        try {
            const recipe = await GeminiService.generateRecipeFromOptions({
                ingredientChips: host.ingredientChips,
                pantryKeys: host.pantry.activeStapleKeys(),
                urgentIngredients: Object.keys(host.urgentIngredients).filter(k => host.urgentIngredients[k] && host.ingredientChips.includes(k)),
                activeAllergens: Object.keys(host.selectedAllergens).filter(k => host.selectedAllergens[k]),
                allowExtraIngredients: host.allowExtraIngredients,
                diet: host.selectedDiet,
                effort: host.selectedEffort,
                portions: host.persons || 2,
                chatHistory: this.chatHistory,
                capturedImage: host.capturedImage
            });
            host.recipe = recipe;
            host.announce(`Rezept erfolgreich geladen: ${recipe.title}. Bild wird generiert.`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            void this.generateImage(recipe.title);
        } catch (error: unknown) {
            console.error('API Verbindungsfehler:', error);
            this.lastError = describeAiError(error);
            showToast(this.lastError, 'error', { duration: 5000 });
        } finally {
            host.isLoading = false;
        }
    };

    /** Follow-up request ("make it spicier"): remembered in the chat history, then generates again. */
    regenerate = (additionalPrompt: string): Promise<void> => {
        if (additionalPrompt.trim()) this.chatHistory = [...this.chatHistory, additionalPrompt];
        this.host.requestUpdate();
        return this.generate();
    };

    resetChat = (): void => {
        this.chatHistory = [];
        this.host.requestUpdate();
    };

    async generateImage(title: string): Promise<void> {
        const host = this.host;
        this.isGeneratingImage = true;
        host.recipeImage = null;
        host.requestUpdate();
        try {
            host.recipeImage = await GeminiService.generateRecipeImage(title);
        } catch (e) {
            console.error('Imagen failed', e);
        } finally {
            this.isGeneratingImage = false;
            if (host.recipe) host.recipe = { ...host.recipe, image: host.recipeImage || undefined };
            host.requestUpdate();
        }
    }

    changePortions = (newPersons: number): void => {
        const host = this.host;
        if (!host.recipe || newPersons === host.persons || newPersons < 1) return;
        const oldPersons = host.persons;
        host.recipe = scaleRecipePortions(host.recipe, newPersons / oldPersons);
        host.persons = newPersons;
        host.announce(`Portionsmenge von ${oldPersons} auf ${newPersons} Personen angepasst.`);
    };

    askAssistant = async (question: string): Promise<void> => {
        const recipe = this.host.recipe;
        if (!recipe || !question) return;
        this.assistantAnswer = 'Chef denkt nach...';
        this.host.requestUpdate();
        try {
            const answer = await GeminiService.askCookingQuestion(question, recipe.title);
            this.assistantAnswer = answer;
            SpeechService.speak(answer);
        } catch (err) {
            console.error('Cooking assistant query failed', err);
            this.assistantAnswer = 'Fehler bei der Antwort des Kochassistenten.';
        }
        this.host.requestUpdate();
    };
}
