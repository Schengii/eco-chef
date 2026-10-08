import handler from './gemini';
import type { VercelRequest, VercelResponse } from './vercel-types';

function createRes() {
    const res = {
        statusCode: 200,
        body: undefined as unknown,
        headers: {} as Record<string, string>,
        status(code: number) { this.statusCode = code; return this; },
        json(payload: unknown) { this.body = payload; return this; },
        end() { return this; },
        setHeader(k: string, v: string) { this.headers[k] = v; return this; }
    };
    return res;
}

function createReq(over: Partial<{ method: string; body: unknown; headers: Record<string, string> }> = {}) {
    return {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 250), ...(over.headers ?? {}) },
        body: { action: 'generateContent', model: 'gemini-2.5-flash', contents: ['Hallo'] },
        socket: { remoteAddress: '127.0.0.1' },
        ...over
    } as unknown as VercelRequest;
}

const run = async (req: VercelRequest) => {
    const res = createRes();
    await handler(req, res as unknown as VercelResponse);
    return res;
};

describe('api/gemini handler', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        (global as unknown as { fetch: unknown }).fetch = fetchMock;
        process.env.GEMINI_API_KEY = 'server-key';
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => { delete process.env.GEMINI_API_KEY; jest.restoreAllMocks(); });

    test('rejects non-POST and answers CORS preflight for allowed origins only', async () => {
        expect((await run(createReq({ method: 'GET' }))).statusCode).toBe(405);

        const ok = await run(createReq({ method: 'OPTIONS', headers: { origin: 'https://eco-chef-theta.vercel.app' } }));
        expect(ok.statusCode).toBe(204);
        expect(ok.headers['Access-Control-Allow-Origin']).toBe('https://eco-chef-theta.vercel.app');

        const evil = await run(createReq({ headers: { origin: 'https://evil.example' } }));
        expect(evil.statusCode).toBe(403);
        expect(evil.headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    test('returns 503 without server key and 400 for invalid input', async () => {
        delete process.env.GEMINI_API_KEY;
        expect((await run(createReq())).statusCode).toBe(503);

        process.env.GEMINI_API_KEY = 'server-key';
        expect((await run(createReq({ body: {} }))).statusCode).toBe(400);
        expect((await run(createReq({ body: { action: 'generateContent', model: 'gpt-4', contents: ['x'] } }))).statusCode).toBe(400);
        expect((await run(createReq({ body: { action: 'generateContent', model: 'gemini-2.5-flash', contents: [] } }))).statusCode).toBe(400);
        expect((await run(createReq({ body: { action: 'nope' } }))).statusCode).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('forwards a sanitized request with the key in a header, not the URL', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Antwort' }] } }] }) });
        const res = await run(createReq({
            body: {
                action: 'generateContent', model: 'gemini-2.5-flash', contents: ['Hallo'],
                config: { responseMimeType: 'application/json', maxOutputTokens: 999999, tools: [{ x: 1 }] }
            }
        }));

        expect(res.body).toEqual({ text: 'Antwort' });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).not.toContain('key=');
        expect(init.headers['x-goog-api-key']).toBe('server-key');
        const sent = JSON.parse(init.body);
        expect(sent.generationConfig).toEqual({ responseMimeType: 'application/json', maxOutputTokens: 8192 });
        expect(sent.tools).toBeUndefined();
    });

    test('does not leak upstream error details', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'secret upstream details key=abc' });
        const res = await run(createReq());
        expect(res.statusCode).toBe(502);
        expect(JSON.stringify(res.body)).not.toContain('secret');

        fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => '' });
        expect((await run(createReq())).statusCode).toBe(429);
    });

    test('rate limits a single IP', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
        const headers = { 'x-forwarded-for': '203.0.113.99' };
        let last = 200;
        for (let i = 0; i < 25; i++) last = (await run(createReq({ headers }))).statusCode;
        expect(last).toBe(429);
    });

    test('generateImages is reported as unavailable', async () => {
        const res = await run(createReq({ body: { action: 'generateImages' } }));
        expect(res.statusCode).toBe(501);
    });

    test('falls back to the next model when the requested one is overloaded or retired', async () => {
        const ok = { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Antwort' }] } }] }) };
        fetchMock
            .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'high demand' })
            .mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'gone' })
            .mockResolvedValueOnce(ok);

        const res = await run(createReq({ body: { action: 'generateContent', model: 'gemini-3.8-flash', contents: ['Hallo'] } }));
        expect(res.body).toEqual({ text: 'Antwort' });
        const urls = fetchMock.mock.calls.map(c => String(c[0]));
        expect(urls[0]).toContain('gemini-3.8-flash:');
        expect(urls[1]).toContain('gemini-3.5-flash:');
        expect(urls[2]).toContain('gemini-3.5-flash-lite:');
    });

    test('does not retry on other upstream errors and maps quota to 429', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => 'quota' });
        const res = await run(createReq());
        expect(res.statusCode).toBe(429);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('answers 502 when every model in the chain is unavailable', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503, text: async () => 'high demand' });
        const res = await run(createReq());
        expect(res.statusCode).toBe(502);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    test('rejects retired models', async () => {
        for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash', 'imagen-3.0-generate-002']) {
            expect((await run(createReq({ body: { action: 'generateContent', model, contents: ['x'] } }))).statusCode).toBe(400);
        }
    });
});
