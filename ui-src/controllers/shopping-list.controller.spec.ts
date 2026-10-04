/** @jest-environment jsdom */
import { ShoppingListController, ShoppingListHost } from './shopping-list.controller';
import { StorageService } from '../services/storage.service';

const toast = { showToast: jest.fn(), showConfirmToast: jest.fn() };
jest.mock('../components/eco-chef-toast', () => ({
    showToast: (...a: unknown[]) => toast.showToast(...a),
    showConfirmToast: (...a: unknown[]) => toast.showConfirmToast(...a)
}));

function make(pantry: string[] = []) {
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        getPantryNames: () => pantry
    };
    return { host, list: new ShoppingListController(host as unknown as ShoppingListHost) };
}

describe('ShoppingListController', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('adds, toggles, removes and persists items immutably', () => {
        const { list, host } = make();
        list.addManual('  Brot ');
        const first = list.items;
        list.toggle(0);
        expect(list.items).not.toBe(first);
        expect(list.items[0]).toMatchObject({ name: 'Brot', checked: true });
        expect(list.checkedItems()).toHaveLength(1);
        expect(StorageService.getShoppingList()).toEqual(list.items);

        list.clearChecked();
        expect(list.items).toHaveLength(0);
        expect(host.requestUpdate).toHaveBeenCalled();
    });

    it('cleans list markers from ingredient names and rejects duplicates', () => {
        const { list } = make();
        list.add({ item: '* 200 g Mehl', category: 'Vorrat & Gewürze' });
        list.add('200 g Mehl');
        expect(list.items).toEqual([{ name: '200 g Mehl', checked: false, category: 'Vorrat & Gewürze' }]);
        expect(toast.showToast).toHaveBeenLastCalledWith('Das steht bereits auf deiner Einkaufsliste!', 'warning');
    });

    it('asks before adding something that is already in the pantry', async () => {
        toast.showConfirmToast.mockResolvedValue(false);
        const { list } = make(['Mehl']);
        list.add('Mehl');
        await Promise.resolve();
        expect(toast.showConfirmToast).toHaveBeenCalled();
        expect(list.items).toHaveLength(0);

        toast.showConfirmToast.mockResolvedValue(true);
        list.add('Mehl');
        await new Promise(r => setTimeout(r));
        expect(list.items.map(i => i.name)).toEqual(['Mehl']);
    });

    it('renders a grouped share text', () => {
        const { list } = make();
        list.set([
            { name: 'Apfel', checked: true, category: 'Obst & Gemüse' },
            { name: 'Seife', checked: false }
        ]);
        const text = list.toText();
        expect(text).toContain('*Obst & Gemüse*:\n✅ Apfel');
        expect(text).toContain('*Sonstiges*:\n⬜ Seife');
    });
});
