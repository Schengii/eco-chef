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
        expect(encrypted.startsWith('enc2:')).toBe(true);
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

describe('CryptoService v2 (PBKDF2)', () => {
    const data = { a: 1, list: ['x', 'y'] };

    test('uses enc2: prefix and round-trips', async () => {
        const enc = await CryptoService.encryptData(data, 'SECRET-CODE');
        expect(enc.startsWith('enc2:')).toBe(true);
        expect(await CryptoService.decryptData(enc, 'SECRET-CODE')).toEqual(data);
    });

    test('same input yields different ciphertexts (random IV)', async () => {
        const a = await CryptoService.encryptData(data, 'SECRET-CODE');
        const b = await CryptoService.encryptData(data, 'SECRET-CODE');
        expect(a).not.toBe(b);
    });

    test('wrong secret fails to decrypt', async () => {
        const enc = await CryptoService.encryptData(data, 'SECRET-CODE');
        await expect(CryptoService.decryptData(enc, 'OTHER-CODE')).rejects.toThrow();
    });

    test('encrypt without secret throws instead of writing plaintext', async () => {
        await expect(CryptoService.encryptData(data, '')).rejects.toThrow();
    });
});
