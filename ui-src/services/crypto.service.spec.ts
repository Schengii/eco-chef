import { CryptoService } from './crypto.service';

describe('CryptoService Tests', () => {
    const testSecret = 'ABC123XYZ';
    const testData = {
        pantry: ['Apfel', 'Milch'],
        count: 42,
        active: true
    };

    test('should encrypt data with enc: prefix and decrypt back to original', async () => {
        const encrypted = await CryptoService.encryptData(testData, testSecret);
        expect(typeof encrypted).toBe('string');
        expect(encrypted.startsWith('enc:')).toBe(true);
        expect(encrypted).not.toContain('Apfel');

        const decrypted = await CryptoService.decryptData(encrypted, testSecret);
        expect(decrypted).toEqual(testData);
    });

    test('should fallback to plain JSON when not enc: prefixed', async () => {
        const plainJson = JSON.stringify(testData);
        const decrypted = await CryptoService.decryptData(plainJson, testSecret);
        expect(decrypted).toEqual(testData);
    });
});
