import { BarcodeService } from './barcode.service';

describe('BarcodeService.fetchProductByBarcode', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    const respond = (body: unknown, ok = true) => fetchMock.mockResolvedValue({ ok, json: async () => body });

    test('maps a found product incl. location and nutri-score', async () => {
        respond({ status: 1, product: { product_name_de: 'Joghurt', brands: 'Molkerei', nutriscore_grade: 'B', categories: 'Milchprodukte, Joghurt' } });
        const res = await BarcodeService.fetchProductByBarcode(' 4008 4004 01027 ');
        expect(res).toMatchObject({ found: true, name: 'Joghurt (Molkerei)', nutriScore: 'b', location: 'Kühlschrank', suggestedExpiryDays: 7 });
        expect(fetchMock.mock.calls[0][0]).toContain('/product/4008400401027.json');
    });

    test('detects frozen goods and ignores invalid nutri-scores', async () => {
        respond({ status: 1, product: { product_name: 'Erbsen', categories: 'Tiefkühlgemüse', nutriscore_grade: 'z' } });
        const res = await BarcodeService.fetchProductByBarcode('12345678');
        expect(res).toMatchObject({ location: 'Gefrierfach', nutriScore: undefined });
    });

    test('reports unknown products, HTTP errors and network failures', async () => {
        respond({ status: 0 });
        expect((await BarcodeService.fetchProductByBarcode('12345678')).rawMessage).toContain('nicht registriert');

        respond({}, false);
        expect((await BarcodeService.fetchProductByBarcode('12345678')).rawMessage).toContain('nicht in der Datenbank');

        fetchMock.mockRejectedValue(new Error('offline'));
        expect((await BarcodeService.fetchProductByBarcode('12345678')).rawMessage).toContain('Netzwerkfehler');
    });
});
