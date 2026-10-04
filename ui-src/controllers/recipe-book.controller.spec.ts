/** @jest-environment jsdom */
import { RecipeBookController, RecipeBookHost } from './recipe-book.controller';
import { StorageService } from '../services/storage.service';
import type { Recipe } from '../models/eco-chef.models';

const toast = jest.fn();
jest.mock('../components/eco-chef-toast', () => ({ showToast: (...a: unknown[]) => toast(...a), showConfirmToast: jest.fn() }));
jest.mock('../services/pdf.service', () => ({ PdfService: { printCookbook: jest.fn() } }));

const recipe = (title: string) => ({
    title, difficulty: 'Leicht', prepTime: '10 Min.', ecoScore: '🍃🍃🍃', co2SavedKg: 1,
    nutrition: { calories: '300 kcal', protein: '10g', carbs: '40g', fat: '5g' },
    ingredientsList: [{ item: 'Reis', category: 'Vorrat' }], instructions: ['Kochen']
}) as unknown as Recipe;

function make() {
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        achievements: { increment: jest.fn() },
        announce: jest.fn()
    };
    return { host, book: new RecipeBookController(host as unknown as RecipeBookHost) };
}

describe('RecipeBookController', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('saves with rating and image, and reloads the list', () => {
        const { book } = make();
        book.save(recipe('Pfanne'), 'data:image/png;base64,x', 4);
        expect(book.saved).toHaveLength(1);
        expect(book.saved[0]).toMatchObject({ title: 'Pfanne', rating: 4, image: 'data:image/png;base64,x' });
        expect(book.saved[0].savedAt).toBeTruthy();
        expect(StorageService.getSavedRecipes()).toHaveLength(1);
        expect(toast).toHaveBeenCalledWith('Rezept gespeichert mit 4 ⭐!', 'success');
    });

    it('removes by index', () => {
        const { book } = make();
        book.save(recipe('A'), null, 0);
        book.save(recipe('B'), null, 0);
        book.remove(0);
        expect(book.saved.map(r => r.title)).toEqual(['B']);
        expect(StorageService.getSavedRecipes().map(r => r.title)).toEqual(['B']);
    });

    it('rates and counts 5-star ratings for the achievement', () => {
        const { book, host } = make();
        book.save(recipe('A'), null, 0);
        book.rate(0, 3);
        expect(host.achievements.increment).not.toHaveBeenCalled();
        book.rate(0, 5);
        expect(host.achievements.increment).toHaveBeenCalledWith('sterneChef');
        expect(book.saved[0].rating).toBe(5);
        book.rate(9, 5);
        expect(host.achievements.increment).toHaveBeenCalledTimes(1);
    });

    it('appends imported recipes (marked with importedAt) and rejects garbage', () => {
        const { book } = make();
        book.save(recipe('A'), null, 0);
        book.importRaw([recipe('A'), recipe('B')]);
        expect(book.saved.map(r => r.title)).toEqual(['A', 'A', 'B']);
        expect((book.saved[2] as unknown as Record<string, unknown>).importedAt).toEqual(expect.any(String));

        book.importRaw({ nonsense: true });
        expect(toast).toHaveBeenLastCalledWith('Keine gültigen Rezepte in der Datei gefunden.', 'error');
        expect(book.saved).toHaveLength(3);
    });

    it('warns when exporting an empty cookbook', () => {
        const { book } = make();
        book.exportJson();
        expect(toast).toHaveBeenLastCalledWith('Du hast noch keine Rezepte gespeichert.', 'warning');
        book.exportPdf('🧑‍🍳');
        expect(toast).toHaveBeenLastCalledWith('Du hast noch keine gespeicherten Rezepte im Kochbuch.', 'warning');
    });

    it('copies the share text to the clipboard when navigator.share is missing', async () => {
        const { book } = make();
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        await book.share(recipe('Pfanne'));
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Pfanne'));
        expect(toast).toHaveBeenLastCalledWith('Rezept-Text in die Zwischenablage kopiert!', 'success');
    });
});
