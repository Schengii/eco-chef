/** @jest-environment jsdom */
import { PantryController, PantryHost } from './pantry.controller';
import { StorageService } from '../services/storage.service';
import { GeminiService } from '../services/gemini.service';
import { BarcodeService } from '../services/barcode.service';

const toast = jest.fn();
jest.mock('../components/eco-chef-toast', () => ({ showToast: (...a: unknown[]) => toast(...a), showConfirmToast: jest.fn() }));
jest.mock('../services/gemini.service', () => ({ GeminiService: { scanReceipt: jest.fn(), scanPantryItem: jest.fn() } }));
jest.mock('../services/barcode.service', () => ({
    BarcodeService: { fetchProductByBarcode: jest.fn(), createPantryItemFromBarcode: jest.fn() }
}));

function make() {
    const host = {
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        isLoading: false,
        capturedImage: null as string | null,
        achievements: { unlock: jest.fn().mockReturnValue(true), increment: jest.fn() },
        camera: { open: jest.fn().mockResolvedValue(undefined) },
        announce: jest.fn(),
        autoSyncPush: jest.fn()
    };
    return { host, pantry: new PantryController(host as unknown as PantryHost) };
}

describe('PantryController', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('adds an item once, persists it and triggers a sync push', () => {
        const { pantry, host } = make();
        pantry.add({ name: 'Milch', expiryDate: '2026-10-10' });
        pantry.add({ name: 'milch' });
        expect(pantry.items).toHaveLength(1);
        expect(StorageService.getPantryAdvanced()).toEqual(pantry.items);
        expect(host.autoSyncPush).toHaveBeenCalledTimes(1);
        expect(toast).toHaveBeenCalledWith('"milch" ist bereits in der Reste-Kammer vorhanden!', 'warning');
    });

    it('removes by name', () => {
        const { pantry } = make();
        pantry.add({ name: 'Milch' });
        pantry.add({ name: 'Brot' });
        pantry.remove('Milch');
        expect(pantry.names()).toEqual(['Brot']);
    });

    it('unlocks MHD-Retter only for items expiring within 3 days', () => {
        const { pantry, host } = make();
        const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
        pantry.set([
            { name: 'Alt', active: true, addedDate: '2026-01-01', expiryDate: inDays(2) },
            { name: 'Frisch', active: true, addedDate: '2026-01-01', expiryDate: inDays(30) }
        ]);
        pantry.onItemUsed('Frisch');
        expect(host.achievements.unlock).not.toHaveBeenCalled();
        pantry.onItemUsed('alt');
        expect(host.achievements.unlock).toHaveBeenCalledWith('mhdRetter');
    });

    it('toggles staples and lists the active ones', () => {
        const { pantry } = make();
        pantry.toggleStaple('Salz');
        pantry.toggleStaple('Mehl');
        pantry.toggleStaple('Mehl');
        expect(pantry.activeStapleKeys()).toEqual(['Salz']);
    });

    it('adds a barcode product and reports unknown ones', async () => {
        const { pantry, host } = make();
        (BarcodeService.fetchProductByBarcode as jest.Mock).mockResolvedValueOnce({ found: true, name: 'Hafermilch' });
        (BarcodeService.createPantryItemFromBarcode as jest.Mock).mockReturnValueOnce({ name: 'Hafermilch', active: true, addedDate: 'x' });
        await pantry.searchBarcode('123');
        expect(pantry.names()).toEqual(['Hafermilch']);
        expect(host.isLoading).toBe(false);

        (BarcodeService.fetchProductByBarcode as jest.Mock).mockResolvedValueOnce({ found: false, name: '', rawMessage: 'nichts gefunden' });
        await pantry.searchBarcode('999');
        expect(toast).toHaveBeenLastCalledWith('nichts gefunden', 'error');
        expect(pantry.items).toHaveLength(1);
    });

    it('runs a receipt scan after the photo arrives and resets the scan state', async () => {
        const { pantry, host } = make();
        (GeminiService.scanReceipt as jest.Mock).mockResolvedValueOnce([
            { name: 'Joghurt', quantity: 1, unit: 'Stk.', expiryDays: 5, location: 'Kühlschrank' }
        ]);
        pantry.startReceiptScan();
        expect(host.camera.open).toHaveBeenCalled();
        host.capturedImage = 'data:image/jpeg;base64,xx';
        await pantry.handleCapturedImage();

        expect(pantry.names()).toEqual(['Joghurt']);
        expect(host.achievements.increment).toHaveBeenCalledWith('scannerProfi');
        expect(host.capturedImage).toBeNull();
        expect(pantry.isScanningReceipt).toBe(false);
        expect(host.isLoading).toBe(false);
    });

    it('survives a failing product scan', async () => {
        const { pantry, host } = make();
        (GeminiService.scanPantryItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        pantry.startProductScan();
        host.capturedImage = 'img';
        await pantry.handleCapturedImage();
        expect(toast).toHaveBeenLastCalledWith('Fehler beim Scannen des Produkts.', 'error');
        expect(pantry.isScanningProduct).toBe(false);
        expect(host.capturedImage).toBeNull();
    });

    it('ignores a photo when no scan was started', async () => {
        const { pantry, host } = make();
        host.capturedImage = 'img';
        await pantry.handleCapturedImage();
        expect(GeminiService.scanReceipt).not.toHaveBeenCalled();
        expect(host.capturedImage).toBe('img');
    });
});
