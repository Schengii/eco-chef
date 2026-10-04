import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { PantryItemAdvanced, ShoppingItem } from '../models/eco-chef.models';
import { StorageService } from '../services/storage.service';
import { GeminiService } from '../services/gemini.service';
import { BarcodeService } from '../services/barcode.service';
import {
    createPantryItem, daysUntilExpiry, findPantryItem, itemFromProductScan, itemsFromReceipt,
    pantryFromShopping, type NewPantryItemInput
} from '../services/pantry';
import { showToast } from '../components/eco-chef-toast';
import type { AchievementsController } from './achievements.controller';

export interface PantryHost extends ReactiveControllerHost {
    /** Shared busy flag of the app (spinner) and the photo taken by the camera. */
    isLoading: boolean;
    capturedImage: string | null;
    readonly achievements: Pick<AchievementsController, 'unlock' | 'increment'>;
    readonly camera: { open(): Promise<void> };
    announce(message: string): void;
    autoSyncPush(): unknown;
}

/** Basic staples checklist ("Vorratskammer"), the pantry with expiry dates, and receipt/product/barcode scans. */
export class PantryController implements ReactiveController {
    /** Staples the recipe prompt may assume are at home. */
    readonly staples = ['Salz', 'Pfeffer', 'Olivenöl', 'Wasser', 'Zucker', 'Mehl', 'Milch', 'Butter', 'Eier', 'Knoblauch', 'Zwiebeln'];
    selectedStaples: Record<string, boolean> = {};
    items: PantryItemAdvanced[] = [];
    isScanningReceipt = false;
    isScanningProduct = false;

    constructor(private readonly host: PantryHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    load(): void {
        this.selectedStaples = StorageService.getPantry();
        this.items = StorageService.getPantryAdvanced();
    }

    names(): string[] {
        return this.items.map(i => i.name);
    }

    activeStapleKeys(): string[] {
        return Object.keys(this.selectedStaples).filter(k => this.selectedStaples[k]);
    }

    toggleStaple = (item: string): void => {
        this.selectedStaples = { ...this.selectedStaples, [item]: !this.selectedStaples[item] };
        StorageService.setPantry(this.selectedStaples);
        this.host.announce(`${item} wurde in der Vorratskammer ${this.selectedStaples[item] ? 'aktiviert' : 'deaktiviert'}.`);
        this.host.requestUpdate();
    };

    /** Replaces the pantry (sync, shopping transfer) and persists it. */
    set(items: PantryItemAdvanced[]): void {
        this.items = items;
        StorageService.setPantryAdvanced(items);
        this.host.requestUpdate();
    }

    add = (input: NewPantryItemInput): void => {
        if (findPantryItem(this.items, input.name)) {
            showToast(`"${input.name}" ist bereits in der Reste-Kammer vorhanden!`, 'warning');
            return;
        }
        this.set([...this.items, createPantryItem(input)]);
        this.host.announce(`${input.name} zur Reste-Kammer hinzugefügt.`);
        this.host.autoSyncPush();
    };

    remove = (name: string): void => {
        this.set(this.items.filter(item => item.name !== name));
        this.host.announce(`${name} aus der Reste-Kammer entfernt.`);
        this.host.autoSyncPush();
    };

    /** Using an item that expires within 3 days unlocks the MHD-Retter achievement. */
    onItemUsed(name: string): void {
        const days = daysUntilExpiry(findPantryItem(this.items, name)?.expiryDate);
        if (days !== null && days <= 3 && this.host.achievements.unlock('mhdRetter')) {
            showToast('🏆 Erfolg freigeschaltet: MHD-Retter! Zutat kurz vor Ablauf verwendet.', 'success', { duration: 5000 });
        }
    }

    /** Returns how many checked shopping items were new to the pantry. */
    addFromShopping(checked: ShoppingItem[]): number {
        const { items, added } = pantryFromShopping(checked, this.items);
        this.set(items);
        return added;
    }

    searchBarcode = async (barcode: string): Promise<void> => {
        this.host.isLoading = true;
        this.host.announce('Barcode wird abgefragt...');
        const res = await BarcodeService.fetchProductByBarcode(barcode);
        this.host.isLoading = false;

        if (res.found) {
            this.set([...this.items, BarcodeService.createPantryItemFromBarcode(res, barcode)]);
            showToast(`"${res.name}" erfolgreich per Barcode hinzugefügt!`, 'success');
            this.host.announce(`${res.name} aus Barcode hinzugefügt.`);
            this.host.autoSyncPush();
        } else {
            showToast(res.rawMessage || 'Produkt nicht gefunden.', 'error');
        }
    };

    startReceiptScan = (): void => {
        this.isScanningReceipt = true;
        void this.host.camera.open();
    };

    startProductScan = (): void => {
        this.isScanningProduct = true;
        void this.host.camera.open();
    };

    /** Called by the host whenever a new photo arrived; runs the scan the user started. */
    async handleCapturedImage(): Promise<void> {
        if (!this.host.capturedImage) return;
        if (this.isScanningReceipt) await this.processReceipt(this.host.capturedImage);
        else if (this.isScanningProduct) await this.processProduct(this.host.capturedImage);
    }

    private async processReceipt(image: string): Promise<void> {
        this.host.isLoading = true;
        this.host.announce('Kassenzettel wird analysiert...');
        try {
            const scanned = await GeminiService.scanReceipt(image);
            if (scanned && scanned.length > 0) {
                this.set([...this.items, ...itemsFromReceipt(scanned)]);
                this.host.achievements.increment('scannerProfi');
                showToast(`Kassenzettel gescannt! ${scanned.length} Zutaten hinzugefügt.`, 'success');
            } else {
                showToast('Es konnten keine Lebensmittel auf dem Foto erkannt werden.', 'warning');
            }
        } catch (e) {
            console.error('Receipt scan failed', e);
            showToast('Fehler beim Scannen des Kassenzettels.', 'error');
        } finally {
            this.finishScan();
        }
    }

    private async processProduct(image: string): Promise<void> {
        this.host.isLoading = true;
        this.host.announce('Verpackung wird auf MHD und Inhalt analysiert...');
        try {
            const scanned = await GeminiService.scanPantryItem(image);
            if (scanned && scanned.name) {
                const item = itemFromProductScan(scanned);
                this.set([...this.items, item]);
                showToast(`"${item.name}" erkannt und zur Vorratskammer hinzugefügt! (MHD: ${item.expiryDate})`, 'success', { duration: 5000 });
                this.host.autoSyncPush();
            } else {
                showToast('Produkt konnte nicht eindeutig identifiziert werden.', 'warning');
            }
        } catch (e) {
            console.error('Product scan failed', e);
            showToast('Fehler beim Scannen des Produkts.', 'error');
        } finally {
            this.finishScan();
        }
    }

    private finishScan(): void {
        this.host.capturedImage = null;
        this.isScanningReceipt = false;
        this.isScanningProduct = false;
        this.host.isLoading = false;
        this.host.requestUpdate();
    }
}
