import type { ReactiveControllerHost } from 'lit';
import { AchievementsController } from './achievements.controller';
import { StorageService } from '../services/storage.service';
import type { Achievement, Recipe } from '../models/eco-chef.models';

describe('AchievementsController', () => {
    let mockHost: ReactiveControllerHost;
    let controller: AchievementsController;

    const sampleAchievements: Achievement[] = [
        { id: 'first_recipe', title: 'Erster Koch', icon: '🍳', description: 'Koche dein erstes Rezept', progress: 0, target: 1, unlocked: false },
        { id: 'klimaSchuetzer', title: 'Klimaschützer', icon: '🌳', description: 'CO2 gespart', progress: 0, target: 10, unlocked: false }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockHost = {
            addController: jest.fn(),
            removeController: jest.fn(),
            requestUpdate: jest.fn(),
            updateComplete: Promise.resolve(true),
        } as unknown as ReactiveControllerHost;

        jest.spyOn(StorageService, 'getAchievements').mockReturnValue(sampleAchievements);
        jest.spyOn(StorageService, 'setAchievements').mockImplementation(() => {});

        controller = new AchievementsController(mockHost);
    });

    it('should register with host on creation', () => {
        expect(mockHost.addController).toHaveBeenCalledWith(controller);
    });

    it('load() should retrieve achievements from storage and update host', () => {
        controller.load();
        expect(StorageService.getAchievements).toHaveBeenCalled();
        expect(controller.list.length).toBeGreaterThan(0);
        expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it('set() should update list and save to StorageService', () => {
        controller.set(sampleAchievements);
        expect(controller.list).toEqual(sampleAchievements);
        expect(StorageService.setAchievements).toHaveBeenCalledWith(sampleAchievements);
        expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it('increment() should increment achievement progress and persist', () => {
        controller.set(sampleAchievements);
        controller.increment('first_recipe');
        const updated = controller.list.find(a => a.id === 'first_recipe');
        expect(updated?.progress).toBe(1);
        expect(updated?.unlocked).toBe(true);
        expect(StorageService.setAchievements).toHaveBeenCalled();
    });

    it('unlock() should unlock locked achievement and return true', () => {
        controller.set(sampleAchievements);
        const result = controller.unlock('first_recipe');
        expect(result).toBe(true);
        const item = controller.list.find(a => a.id === 'first_recipe');
        expect(item?.unlocked).toBe(true);
        expect(item?.progress).toBe(item?.target);
        expect(StorageService.setAchievements).toHaveBeenCalled();
    });

    it('unlock() should return false if already unlocked or non-existent', () => {
        controller.set(sampleAchievements);
        controller.unlock('first_recipe');
        
        // Second unlock attempt
        const resultAgain = controller.unlock('first_recipe');
        expect(resultAgain).toBe(false);

        // Non-existent id
        const nonExistent = controller.unlock('unknown_id');
        expect(nonExistent).toBe(false);
    });

    it('onRecipeCooked() should delegate to applyCookedRecipe and persist changes', () => {
        controller.set(sampleAchievements);
        const mockRecipe: Recipe = {
            title: 'Gemüsepfanne',
            difficulty: 'Einfach',
            prepTime: '20 Min',
            ecoScore: 'A',
            beverage: 'Wasser',
            storageTip: 'Kühl lagern',
            nutrition: { calories: '300', protein: '10g', carbs: '40g', fat: '5g' },
            ingredientsList: [{ item: 'Karotte', category: 'Gemüse' }],
            instructions: ['Schneiden', 'Braten'],
            tip: 'Frisch servieren'
        };

        controller.onRecipeCooked({
            stats: {
                '2026-10-12': { calories: 300, protein: 10, carbs: 40, fat: 5, co2Saved: 12, count: 1 }
            },
            recipe: mockRecipe,
            diet: 'vegan',
            urgentIngredients: { 'Karotte': true }
        });
        expect(StorageService.setAchievements).toHaveBeenCalled();
        expect(mockHost.requestUpdate).toHaveBeenCalled();
        const klima = controller.list.find(a => a.id === 'klimaSchuetzer');
        expect(klima?.unlocked).toBe(true);
    });

    it('hostConnected() does not throw', () => {
        expect(() => controller.hostConnected()).not.toThrow();
    });
});
