import { StorageService } from './storage.service';
import { PantryItemAdvanced } from '../models/eco-chef.models';

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value.toString(); },
    clear() { store = {}; },
    removeItem(key: string) { delete store[key]; }
  };
})();

(global as any).localStorage = localStorageMock;

describe('StorageService Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should store and retrieve GDPR consent', () => {
    expect(StorageService.getGdprConsent()).toBe(false);
    StorageService.setGdprConsent(true);
    expect(StorageService.getGdprConsent()).toBe(true);
  });

  test('should store and retrieve Theme preference', () => {
    expect(StorageService.getTheme()).toBeNull();
    StorageService.setTheme('dark');
    expect(StorageService.getTheme()).toBe('dark');
    StorageService.setTheme('light');
    expect(StorageService.getTheme()).toBe('light');
  });

  test('should store and retrieve Font Scale', () => {
    expect(StorageService.getFontScale()).toBe(1.0);
    StorageService.setFontScale(1.5);
    expect(StorageService.getFontScale()).toBe(1.5);
  });

  test('should store and retrieve Shopping List', () => {
    expect(StorageService.getShoppingList()).toEqual([]);
    const testList = [{ name: 'Tomaten', checked: false, category: 'Obst & Gemüse' }];
    StorageService.setShoppingList(testList);
    expect(StorageService.getShoppingList()).toEqual(testList);
  });

  test('should store and retrieve Advanced Pantry Items', () => {
    expect(StorageService.getPantryAdvanced()).toEqual([]);
    const testPantry: PantryItemAdvanced[] = [{ name: 'Joghurt', active: true, addedDate: '2026-07-18', expiryDate: '2026-07-25', quantity: 2, unit: 'Pkg.', location: 'Kühlschrank' }];
    StorageService.setPantryAdvanced(testPantry);
    expect(StorageService.getPantryAdvanced()).toEqual(testPantry);
  });
});
