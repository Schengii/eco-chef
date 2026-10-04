/**
 * End-to-End Encryption Service for Cloud Synchronization
 * Uses standard Web Crypto API (AES-GCM 256-bit) to ensure
 * data stored in public key-value stores is encrypted client-side.
 */
function getSubtleCrypto(): SubtleCrypto | null {
    return globalThis.crypto?.subtle ?? null;
}

function getRandomValues(arr: Uint8Array): Uint8Array {
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Kein sicherer Zufallsgenerator verfügbar.');
    }
    return globalThis.crypto.getRandomValues(arr);
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

const PBKDF2_ITERATIONS = 150_000;
const PBKDF2_SALT = 'ecochef-sync-v2';

async function deriveKey(subtle: SubtleCrypto, secret: string, usage: KeyUsage): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const material = await subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        [usage]
    );
}

/** Legacy (v1) key: secret padded to 32 bytes. Only used to read old "enc:" payloads. */
async function legacyKey(subtle: SubtleCrypto, secret: string): Promise<CryptoKey> {
    return subtle.importKey(
        'raw',
        new TextEncoder().encode(secret.padEnd(32, '#').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );
}

export const CryptoService = {
    /** Encrypts with AES-GCM-256, key derived via PBKDF2. Never falls back to plaintext. */
    async encryptData(payload: unknown, secret: string): Promise<string> {
        const subtle = getSubtleCrypto();
        if (!secret) throw new Error('Kein Schlüssel für die Verschlüsselung angegeben.');
        if (!subtle) throw new Error('Web Crypto API nicht verfügbar zur Verschlüsselung.');

        const key = await deriveKey(subtle, secret, 'encrypt');
        const iv = getRandomValues(new Uint8Array(12));
        const dataBytes = new TextEncoder().encode(JSON.stringify(payload));
        const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, dataBytes as BufferSource);

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);
        return 'enc2:' + toBase64(combined);
    },

    async decryptData(encryptedStr: string, secret: string): Promise<unknown> {
        const isV2 = encryptedStr?.startsWith('enc2:');
        const isV1 = encryptedStr?.startsWith('enc:');
        if (!isV1 && !isV2) {
            // Legacy plaintext fallback
            return JSON.parse(encryptedStr);
        }
        const subtle = getSubtleCrypto();
        if (!secret || !subtle) {
            throw new Error('Web Crypto API nicht verfügbar zur Entschlüsselung.');
        }
        try {
            const bytes = fromBase64(encryptedStr.substring(isV2 ? 5 : 4));
            const iv = bytes.slice(0, 12);
            const ciphertext = bytes.slice(12);
            const key = isV2 ? await deriveKey(subtle, secret, 'decrypt') : await legacyKey(subtle, secret);
            const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ciphertext as BufferSource);
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (err) {
            console.error('[CryptoService] Decryption failed:', err);
            throw err;
        }
    }
};
