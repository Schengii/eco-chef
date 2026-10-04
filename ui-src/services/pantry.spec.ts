import {
    createPantryItem, daysUntilExpiry, findPantryItem, itemFromProductScan, itemsFromReceipt,
    pantryFromShopping, sortByExpiry
} from './pantry';
import type { PantryItemAdvanced } from '../models/eco-chef.models';

const NOW = new Date(2026, 9, 4, 15, 30); // 2026-10-04, local time
const item = (name: string, expiryDate?: string): PantryItemAdvanced => ({ name, active: true, addedDate: '2026-10-01', expiryDate });

describe('createPantryItem', () => {
    it('fills defaults', () => {
        expect(createPantryItem({ name: 'Milch' }, '2026-10-04')).toEqual({
            name: 'Milch', active: true, addedDate: '2026-10-04', expiryDate: undefined,
            quantity: 1, unit: 'Stk.', location: 'Kühlschrank'
        });
    });
    it('keeps explicit values, including 0', () => {
        expect(createPantryItem({ name: 'Reis', quantity: 0, unit: 'g', location: 'Vorratskammer' }, 'x'))
            .toMatchObject({ quantity: 0, unit: 'g', location: 'Vorratskammer' });
    });
});

describe('findPantryItem', () => {
    it('matches case-insensitively', () => {
        expect(findPantryItem([item('Milch')], 'MILCH')?.name).toBe('Milch');
        expect(findPantryItem([item('Milch')], 'Butter')).toBeUndefined();
    });
});

describe('itemsFromReceipt', () => {
    it('adds the estimated shelf life, defaulting to 7 days', () => {
        const [a, b] = itemsFromReceipt([
            { name: 'Joghurt', quantity: 2, unit: 'Stk.', expiryDays: 3, location: 'Kühlschrank' },
            { name: 'Reis', quantity: 1, unit: 'kg', expiryDays: 0, location: 'Vorratskammer' }
        ], NOW);
        expect(a).toMatchObject({ name: 'Joghurt', addedDate: '2026-10-04', expiryDate: '2026-10-07', quantity: 2 });
        expect(b).toMatchObject({ expiryDate: '2026-10-11', location: 'Vorratskammer' });
    });
});

describe('itemFromProductScan', () => {
    it('uses the scanned MHD, or today if unreadable', () => {
        const base = { name: 'Quark', quantity: 500, unit: 'g', location: 'Kühlschrank' as const };
        expect(itemFromProductScan({ ...base, expiryDate: '2026-10-20' }, '2026-10-04').expiryDate).toBe('2026-10-20');
        expect(itemFromProductScan(base, '2026-10-04').expiryDate).toBe('2026-10-04');
    });
});

describe('pantryFromShopping', () => {
    it('adds only unknown items with 7 days shelf life', () => {
        const pantry = [item('Milch')];
        const { items, added } = pantryFromShopping(
            [{ name: 'milch', checked: true }, { name: 'Brot', checked: true }], pantry, NOW);
        expect(added).toBe(1);
        expect(items).toHaveLength(2);
        expect(items[1]).toMatchObject({ name: 'Brot', expiryDate: '2026-10-11', unit: 'Stk.' });
        expect(pantry).toHaveLength(1);
    });
});

describe('daysUntilExpiry', () => {
    it('counts whole days, ignoring the time of day', () => {
        expect(daysUntilExpiry('2026-10-04', NOW)).toBe(0);
        expect(daysUntilExpiry('2026-10-07', NOW)).toBe(3);
        expect(daysUntilExpiry('2026-10-01', NOW)).toBe(-3);
    });
    it('returns null without a date', () => {
        expect(daysUntilExpiry(undefined, NOW)).toBeNull();
    });
});

describe('sortByExpiry', () => {
    it('puts the soonest first and undated last without mutating', () => {
        const input = [item('C'), item('B', '2026-11-01'), item('A', '2026-10-05')];
        expect(sortByExpiry(input).map(i => i.name)).toEqual(['A', 'B', 'C']);
        expect(input.map(i => i.name)).toEqual(['C', 'B', 'A']);
    });
});
