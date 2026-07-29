import { PantryItemAdvanced, getLocalDateString } from '../models/eco-chef.models';

export interface BarcodeProductResult {
    found: boolean;
    name: string;
    brand?: string;
    nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
    location?: 'Kühlschrank' | 'Vorratskammer' | 'Gefrierfach' | 'Sonstiges';
    suggestedExpiryDays?: number;
    rawMessage?: string;
}

export const BarcodeService = {
    async fetchProductByBarcode(barcode: string): Promise<BarcodeProductResult> {
        const cleanBarcode = barcode.trim().replace(/\s+/g, '');
        if (!cleanBarcode || !/^\d{8,14}$/.test(cleanBarcode)) {
            return {
                found: false,
                name: '',
                rawMessage: 'Ungültiges Barcode-Format (8-14 Ziffern erwartet).'
            };
        }

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`);
            if (!response.ok) {
                return {
                    found: false,
                    name: '',
                    rawMessage: `Produkt mit EAN ${cleanBarcode} nicht in der Datenbank gefunden.`
                };
            }

            const data = await response.json();
            if (data.status !== 1 || !data.product) {
                return {
                    found: false,
                    name: '',
                    rawMessage: `Barcode ${cleanBarcode} in OpenFoodFacts nicht registriert.`
                };
            }

            const product = data.product;
            const name = product.product_name_de || product.product_name || product.generic_name_de || product.generic_name || 'Scan-Produkt';
            const brand = product.brands || product.brands_tags?.[0] || '';
            const nsGrade = product.nutriscore_grade ? String(product.nutriscore_grade).toLowerCase() : undefined;
            const validNutri = (nsGrade && ['a', 'b', 'c', 'd', 'e'].includes(nsGrade)) ? (nsGrade as 'a' | 'b' | 'c' | 'd' | 'e') : undefined;

            let location: 'Kühlschrank' | 'Vorratskammer' | 'Gefrierfach' | 'Sonstiges' = 'Vorratskammer';
            const categories = (product.categories || '').toLowerCase();
            if (categories.includes('milch') || categories.includes('kühlung') || categories.includes('käse') || categories.includes('fleisch') || categories.includes('joghurt')) {
                location = 'Kühlschrank';
            } else if (categories.includes('tiefkühl') || categories.includes('gefrier')) {
                location = 'Gefrierfach';
            }

            return {
                found: true,
                name: brand ? `${name} (${brand})` : name,
                brand,
                nutriScore: validNutri,
                location,
                suggestedExpiryDays: location === 'Kühlschrank' ? 7 : 60
            };
        } catch (e) {
            console.error('Failed to fetch from OpenFoodFacts API', e);
            return {
                found: false,
                name: '',
                rawMessage: 'Netzwerkfehler beim Abfragen des Barcodes.'
            };
        }
    },

    createPantryItemFromBarcode(result: BarcodeProductResult, barcode: string): PantryItemAdvanced {
        const today = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(today.getDate() + (result.suggestedExpiryDays || 14));

        return {
            name: result.name || `Produkt (${barcode})`,
            active: true,
            addedDate: getLocalDateString(today),
            expiryDate: getLocalDateString(expiryDate),
            quantity: 1,
            unit: 'Stk.',
            location: result.location || 'Vorratskammer',
            barcode: barcode.trim(),
            nutriScore: result.nutriScore,
            brand: result.brand
        };
    }
};
