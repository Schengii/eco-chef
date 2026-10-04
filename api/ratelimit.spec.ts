import { isRateLimited, isRateLimitedInMemory, MAX_REQUESTS_PER_WINDOW } from './_ratelimit';

describe('rate limit', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        jest.restoreAllMocks();
    });

    test('in-memory: blocks after the limit and resets after the window', () => {
        const t0 = 1_000_000;
        for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) expect(isRateLimitedInMemory('1.1.1.1', t0)).toBe(false);
        expect(isRateLimitedInMemory('1.1.1.1', t0)).toBe(true);
        expect(isRateLimitedInMemory('2.2.2.2', t0)).toBe(false);
        expect(isRateLimitedInMemory('1.1.1.1', t0 + 61_000)).toBe(false);
    });

    test('redis: uses the shared counter when configured', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example/';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';

        fetchMock.mockResolvedValue({ ok: true, json: async () => [{ result: 3 }, { result: 1 }] });
        expect(await isRateLimited('3.3.3.3')).toBe(false);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://redis.example/pipeline');
        expect(init.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(init.body)[0][0]).toBe('INCR');

        fetchMock.mockResolvedValue({ ok: true, json: async () => [{ result: MAX_REQUESTS_PER_WINDOW + 1 }, { result: 1 }] });
        expect(await isRateLimited('3.3.3.3')).toBe(true);
    });

    test('redis failure falls back to the in-memory limit', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';
        fetchMock.mockRejectedValue(new Error('down'));
        expect(await isRateLimited('4.4.4.4')).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
