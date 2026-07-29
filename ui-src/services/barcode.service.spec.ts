import { BarcodeService } from './barcode.service';

describe('BarcodeService Tests', () => {
    test('should reject invalid barcode formats', async () => {
        const res = await BarcodeService.fetchProductByBarcode('123');
        expect(res.found).toBe(false);
        expect(res.rawMessage).toContain('Ungültiges Barcode-Format');
    });

    test('should transform barcode result to PantryItemAdvanced', () => {
        const item = BarcodeService.createPantryItemFromBarcode({
            found: true,
            name: 'Bio-Hafermilch (HaferJuice)',
            brand: 'HaferJuice',
            nutriScore: 'a',
            location: 'Kühlschrank',
            suggestedExpiryDays: 7
        }, '4008400401027');

        expect(item.name).toBe('Bio-Hafermilch (HaferJuice)');
        expect(item.barcode).toBe('4008400401027');
        expect(item.nutriScore).toBe('a');
        expect(item.location).toBe('Kühlschrank');
        expect(item.active).toBe(true);
    });
});
