import { SyncController, SyncHost, SyncData, CodeStore } from './sync.controller';
import { SyncService } from '../services/sync.service';
import { CryptoService } from '../services/crypto.service';

const emptyData = (): SyncData => ({
    pantryItemsAdvanced: [], shoppingList: [{ name: 'Brot', checked: false }], achievementsList: [],
    stats: {}, urgentIngredients: {}, ingredientChips: ['Apfel']
});

function setup(initialCode = '') {
    let stored = initialCode;
    const store: CodeStore = { get: () => stored, set: c => { stored = c; }, clear: () => { stored = ''; } };
    const host = {
        addController: jest.fn(),
        requestUpdate: jest.fn(),
        getSyncData: jest.fn(emptyData),
        applySyncData: jest.fn(),
        notify: jest.fn(),
        announce: jest.fn()
    };
    const controller = new SyncController(host as unknown as SyncHost, store);
    return { host, controller, store, getStored: () => stored };
}

describe('SyncController', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    test('generate uploads encrypted data and stores the code', async () => {
        fetchMock.mockResolvedValue({ ok: true });
        const { controller, getStored } = setup();
        await controller.generate();

        expect(controller.code).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
        expect(getStored()).toBe(controller.code);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(await SyncService.bucketUrl(controller.code));
        const body = JSON.parse(init.body);
        expect(body.enc.startsWith('enc2:')).toBe(true);
        expect(init.body).not.toContain('Brot');
    });

    test('connect applies validated, decrypted data', async () => {
        const code = SyncService.generateCode();
        const enc = await CryptoService.encryptData({ ...emptyData(), ingredientChips: ['Birne', 5] }, code);
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ enc }) });
        const { controller, host } = setup();

        await controller.connect(code.toLowerCase().replace(/-/g, ''));

        expect(host.applySyncData).toHaveBeenCalledTimes(1);
        expect(host.applySyncData.mock.calls[0][0].ingredientChips).toEqual(['Birne']);
        expect(controller.code).toBe(code);
        expect(host.notify).toHaveBeenCalledWith('Daten erfolgreich synchronisiert!', 'success');
    });

    test('connect rejects unencrypted payloads and wrong keys', async () => {
        const code = SyncService.generateCode();
        const { controller, host } = setup();

        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ shoppingList: [] }) });
        await controller.connect(code);

        const otherEnc = await CryptoService.encryptData(emptyData(), SyncService.generateCode());
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ enc: otherEnc }) });
        await controller.connect(code);

        expect(host.applySyncData).not.toHaveBeenCalled();
        expect(controller.code).toBe('');
        expect(host.notify).toHaveBeenCalledTimes(2);
    });

    test('connect rejects malformed codes without network access', async () => {
        const { controller, host } = setup();
        await controller.connect('A1B2C3');
        expect(fetchMock).not.toHaveBeenCalled();
        expect(host.notify).toHaveBeenCalledWith(expect.stringContaining('Ungültiges Schlüssel-Format'), 'error');
    });

    test('start drops legacy codes and pulls valid ones silently', async () => {
        const legacy = setup('A1B2C3');
        await legacy.controller.start();
        expect(legacy.getStored()).toBe('');
        expect(fetchMock).not.toHaveBeenCalled();

        fetchMock.mockResolvedValue({ ok: false });
        const code = SyncService.generateCode();
        const valid = setup(code);
        await valid.controller.start();
        expect(valid.controller.code).toBe(code);
        expect(valid.host.notify).not.toHaveBeenCalled();
    });

    test('push does nothing without a code and never throws on network errors', async () => {
        const { controller } = setup();
        await controller.push();
        expect(fetchMock).not.toHaveBeenCalled();

        fetchMock.mockResolvedValue({ ok: true });
        await controller.generate();
        fetchMock.mockRejectedValue(new Error('offline'));
        await expect(controller.push()).resolves.toBeUndefined();
    });
});
