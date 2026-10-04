import { SyncService } from './sync.service';

describe('SyncService', () => {
    test('generateCode creates 16 chars in 4 groups from the safe alphabet', () => {
        const code = SyncService.generateCode();
        expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
    });

    test('generateCode yields unique codes', () => {
        const codes = new Set(Array.from({ length: 200 }, () => SyncService.generateCode()));
        expect(codes.size).toBe(200);
    });

    test('normalizeCode accepts lowercase and missing dashes, rejects invalid input', () => {
        const code = SyncService.generateCode();
        expect(SyncService.normalizeCode(code.replace(/-/g, '').toLowerCase())).toBe(code);
        expect(SyncService.normalizeCode(` ${code} `)).toBe(code);
        expect(SyncService.normalizeCode('A1B2C3')).toBeNull(); // legacy 6-char code
        expect(SyncService.normalizeCode('')).toBeNull();
    });

    test('bucketUrl is deterministic and does not reveal the code', async () => {
        const code = SyncService.generateCode();
        const a = await SyncService.bucketUrl(code);
        const b = await SyncService.bucketUrl(code);
        expect(a).toBe(b);
        expect(a.startsWith('https://kvdb.io/')).toBe(true);
        expect(a).not.toContain(code.replace(/-/g, ''));
        expect(await SyncService.bucketUrl(SyncService.generateCode())).not.toBe(a);
    });
});
