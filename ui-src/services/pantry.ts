import { getLocalDateString, type PantryItemAdvanced, type ShoppingItem } from '../models/eco-chef.models';
import type { ReceiptItem, ScannedProduct } from '../models/schemas';

/** Pure pantry rules (no DOM, storage or network) so they can be unit-tested in isolation. */

export interface NewPantryItemInput {
    name: string;
    expiryDate?: string;
    quantity?: number;
    unit?: string;
    location?: PantryItemAdvanced['location'];
}

export function findPantryItem(items: PantryItemAdvanced[], name: string): PantryItemAdvanced | undefined {
    const lower = name.toLowerCase();
    return items.find(p => p.name.toLowerCase() === lower);
}

export function createPantryItem(input: NewPantryItemInput, today = getLocalDateString()): PantryItemAdvanced {
    return {
        name: input.name,
        active: true,
        addedDate: today,
        expiryDate: input.expiryDate,
        quantity: input.quantity !== undefined ? input.quantity : 1,
        unit: input.unit !== undefined ? input.unit : 'Stk.',
        location: input.location !== undefined ? input.location : 'Kühlschrank'
    };
}

/** Items from a scanned receipt; the expiry date is today + the AI's estimate (default 7 days). */
export function itemsFromReceipt(scanned: ReceiptItem[], now = new Date()): PantryItemAdvanced[] {
    return scanned.map(item => {
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + (item.expiryDays || 7));
        return {
            name: item.name || 'Zutat',
            active: true,
            addedDate: getLocalDateString(now),
            expiryDate: getLocalDateString(expiry),
            quantity: item.quantity || 1,
            unit: item.unit || 'Stk.',
            location: item.location || 'Kühlschrank'
        };
    });
}

export function itemFromProductScan(scanned: ScannedProduct, today = getLocalDateString()): PantryItemAdvanced {
    return {
        name: scanned.name || 'Unbekanntes Produkt',
        active: true,
        addedDate: today,
        expiryDate: scanned.expiryDate || today,
        quantity: scanned.quantity || 1,
        unit: scanned.unit || 'Stk.',
        location: scanned.location || 'Kühlschrank'
    };
}

/** Moves checked shopping items into the pantry (7 days shelf life); names already in the pantry are skipped. */
export function pantryFromShopping(
    checked: ShoppingItem[],
    pantry: PantryItemAdvanced[],
    now = new Date()
): { items: PantryItemAdvanced[]; added: number } {
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 7);
    const items = [...pantry];
    let added = 0;
    for (const c of checked) {
        if (findPantryItem(items, c.name)) continue;
        items.push({
            name: c.name,
            active: true,
            addedDate: getLocalDateString(now),
            expiryDate: getLocalDateString(expiry),
            quantity: 1,
            unit: 'Stk.',
            location: 'Kühlschrank'
        });
        added++;
    }
    return { items, added };
}

/** Whole days from today until the expiry date (negative if expired); null without a date. */
export function daysUntilExpiry(expiryDate: string | undefined, now = new Date()): number | null {
    if (!expiryDate) return null;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Soonest expiry first; items without a date last. */
export function sortByExpiry(items: PantryItemAdvanced[]): PantryItemAdvanced[] {
    const time = (p: PantryItemAdvanced) => p.expiryDate ? new Date(p.expiryDate).getTime() : Infinity;
    return [...items].sort((a, b) => time(a) - time(b));
}
