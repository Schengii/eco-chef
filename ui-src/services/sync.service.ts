/**
 * Household sync helpers.
 * The sync code is the only secret: it is used (a) as input for the PBKDF2 encryption key
 * and (b) hashed to derive the storage bucket, so the bucket name never reveals the key.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no 0/O/1/I
const CODE_LENGTH = 16; // 16 * 5 bit = 80 bit entropy
const BUCKET_PREFIX = 'https://kvdb.io/ecochef_sync_';

export const SyncService = {
    generateCode(): string {
        const bytes = new Uint8Array(CODE_LENGTH);
        globalThis.crypto.getRandomValues(bytes);
        // 256 is a multiple of 32, so the modulo introduces no bias
        const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
        return chars.match(/.{4}/g)!.join('-');
    },

    /** Returns the canonical XXXX-XXXX-XXXX-XXXX form or null if the input is not a valid code. */
    normalizeCode(input: string): string | null {
        const raw = (input || '').replace(/[\s-]/g, '').toUpperCase();
        if (raw.length !== CODE_LENGTH || ![...raw].every(c => ALPHABET.includes(c))) return null;
        return raw.match(/.{4}/g)!.join('-');
    },

    async bucketUrl(code: string): Promise<string> {
        const data = new TextEncoder().encode('bucket:' + code);
        const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        return BUCKET_PREFIX + hex.slice(0, 32);
    }
};
