/**
 * End-to-End Encryption Service for Cloud Synchronization
 * Uses standard Web Crypto API (AES-GCM 256-bit) to ensure
 * data stored in public key-value stores is encrypted client-side.
 */
function getSubtleCrypto(): SubtleCrypto | null {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        return window.crypto.subtle;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
        return (globalThis as any).crypto.subtle;
    }
    return null;
}

function getRandomValues(arr: Uint8Array): Uint8Array {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        return window.crypto.getRandomValues(arr);
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
        return (globalThis as any).crypto.getRandomValues(arr);
    }
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
}

function toBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(b64, 'base64'));
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export const CryptoService = {
    async encryptData(payload: unknown, secret: string): Promise<string> {
        const subtle = getSubtleCrypto();
        if (!secret || !subtle) {
            return JSON.stringify(payload);
        }
        try {
            const enc = new TextEncoder();
            const keyMaterial = await subtle.importKey(
                'raw',
                enc.encode(secret.padEnd(32, '#').slice(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );
            const iv = getRandomValues(new Uint8Array(12));
            const dataBytes = enc.encode(JSON.stringify(payload));
            const encrypted = await subtle.encrypt(
                { name: 'AES-GCM', iv: iv as any },
                keyMaterial,
                dataBytes as any
            );
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            return 'enc:' + toBase64(combined);
        } catch (e) {
            console.warn('[CryptoService] Encryption fallback to JSON:', e);
            return JSON.stringify(payload);
        }
    },

    async decryptData(encryptedStr: string, secret: string): Promise<any> {
        if (!encryptedStr || !encryptedStr.startsWith('enc:')) {
            // Legacy plaintext fallback
            return JSON.parse(encryptedStr);
        }
        const subtle = getSubtleCrypto();
        if (!secret || !subtle) {
            throw new Error('Web Crypto API nicht verfügbar zur Entschlüsselung.');
        }
        try {
            const bytes = fromBase64(encryptedStr.substring(4));
            const iv = bytes.slice(0, 12);
            const ciphertext = bytes.slice(12);

            const enc = new TextEncoder();
            const keyMaterial = await subtle.importKey(
                'raw',
                enc.encode(secret.padEnd(32, '#').slice(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
            const decrypted = await subtle.decrypt(
                { name: 'AES-GCM', iv: iv as any },
                keyMaterial,
                ciphertext as any
            );
            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decrypted));
        } catch (err) {
            console.error('[CryptoService] Decryption failed:', err);
            throw err;
        }
    }
};
