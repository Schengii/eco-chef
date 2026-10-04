import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { SyncService } from '../services/sync.service';
import { CryptoService } from '../services/crypto.service';
import { SyncPayloadSchema } from '../models/schemas';
import type { Achievement, DailyStat, PantryItemAdvanced, ShoppingItem } from '../models/eco-chef.models';

export interface SyncData {
    pantryItemsAdvanced: PantryItemAdvanced[];
    shoppingList: ShoppingItem[];
    achievementsList: Achievement[];
    stats: Record<string, DailyStat>;
    urgentIngredients: Record<string, boolean>;
    ingredientChips: string[];
}

export interface SyncHost extends ReactiveControllerHost {
    getSyncData(): SyncData;
    applySyncData(data: Partial<SyncData>): void;
    notify(message: string, type: 'success' | 'error' | 'warning'): void;
    announce(message: string): void;
}

export interface CodeStore {
    get(): string;
    set(code: string): void;
    clear(): void;
}

const STORAGE_KEY = 'ecoChef_syncCode';
const localStorageCodeStore: CodeStore = {
    get: () => localStorage.getItem(STORAGE_KEY) || '',
    set: code => localStorage.setItem(STORAGE_KEY, code),
    clear: () => localStorage.removeItem(STORAGE_KEY)
};

/**
 * Household cloud sync (encrypted key-value bucket). Owns the sync code and all network/crypto work;
 * the host component only supplies its data and applies validated results.
 */
export class SyncController implements ReactiveController {
    code = '';

    constructor(
        private readonly host: SyncHost,
        private readonly store: CodeStore = localStorageCodeStore
    ) {
        host.addController(this);
    }

    hostConnected(): void {
        // Intentionally empty: the host calls start() after its own state is loaded.
    }

    /** Loads the stored code (dropping legacy/invalid ones) and pulls the latest data. */
    async start(): Promise<void> {
        const stored = this.store.get();
        if (!stored) return;
        const normalized = SyncService.normalizeCode(stored);
        if (!normalized) {
            // Legacy 6-char code from an older version: no longer secure, drop it.
            this.store.clear();
            return;
        }
        this.code = normalized;
        this.host.requestUpdate();
        await this.connect(normalized, true);
    }

    async generate(): Promise<void> {
        this.host.announce('Generiere Synchronisations-Code...');
        const code = SyncService.generateCode();
        try {
            const res = await this.upload(code);
            if (!res.ok) throw new Error('HTTP Status ' + res.status);
            this.setCode(code);
            this.host.announce(`Sync-Code generiert: ${code}.`);
        } catch (e) {
            console.error('Generate sync code failed', e);
            this.host.notify('Fehler beim Verbinden mit dem Cloud-Server.', 'error');
        }
    }

    async connect(rawCode: string, silent = false): Promise<void> {
        const code = SyncService.normalizeCode(rawCode);
        if (!code) {
            this.host.notify('Ungültiges Schlüssel-Format. Erwartet: XXXX-XXXX-XXXX-XXXX.', 'error');
            return;
        }
        this.host.announce('Verbinde und synchronisiere Daten...');
        try {
            const res = await fetch(await SyncService.bucketUrl(code));
            if (!res.ok) {
                if (!silent) this.host.notify('Ungültiger oder abgelaufener Sync-Schlüssel.', 'error');
                return;
            }
            const raw = await res.json() as { enc?: unknown } | null;
            // Unencrypted payloads are rejected: only data encrypted with the code is trustworthy.
            if (!raw || typeof raw.enc !== 'string') throw new Error('Unverschlüsselte Sync-Daten abgelehnt.');
            const decrypted = await CryptoService.decryptData(raw.enc, code);
            const parsed = SyncPayloadSchema.safeParse(decrypted);
            if (!parsed.success) throw new Error('Ungültige Sync-Daten.');

            this.host.applySyncData(parsed.data as unknown as Partial<SyncData>);
            this.setCode(code);
            if (!silent) this.host.notify('Daten erfolgreich synchronisiert!', 'success');
            this.host.announce('Synchronisation abgeschlossen.');
        } catch (err) {
            console.error('Apply sync code failed', err);
            if (!silent) this.host.notify('Fehler beim Abrufen der Synchronisationsdaten.', 'error');
        }
    }

    async push(): Promise<void> {
        if (!this.code) return;
        try {
            await this.upload(this.code);
        } catch (e) {
            console.warn('Auto-sync push failed', e);
        }
    }

    private async upload(code: string): Promise<Response> {
        const encrypted = await CryptoService.encryptData(this.host.getSyncData(), code);
        return fetch(await SyncService.bucketUrl(code), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enc: encrypted })
        });
    }

    private setCode(code: string): void {
        this.code = code;
        this.store.set(code);
        this.host.requestUpdate();
    }
}
