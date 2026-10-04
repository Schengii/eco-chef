/**
 * Rate limiting for the Gemini proxy.
 * With UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Vercel Marketplace: Upstash Redis) the limit is shared
 * across all function instances. Without them, or if Redis is unreachable, a best-effort in-memory limit applies.
 */
export const WINDOW_SECONDS = 60;
export const MAX_REQUESTS_PER_WINDOW = 20;

const memory = new Map<string, { count: number; resetTime: number }>();

export function isRateLimitedInMemory(ip: string, now = Date.now()): boolean {
    if (memory.size > 5000) {
        for (const [key, rec] of memory) if (now > rec.resetTime) memory.delete(key);
    }
    const record = memory.get(ip);
    if (!record || now > record.resetTime) {
        memory.set(ip, { count: 1, resetTime: now + WINDOW_SECONDS * 1000 });
        return false;
    }
    if (record.count >= MAX_REQUESTS_PER_WINDOW) return true;
    record.count++;
    return false;
}

async function isRateLimitedRedis(ip: string, url: string, token: string): Promise<boolean> {
    const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
    const key = `ecochef:gemini:${ip}:${bucket}`;
    const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['INCR', key], ['EXPIRE', key, WINDOW_SECONDS * 2]])
    });
    if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
    const data = await res.json() as Array<{ result?: number; error?: string }>;
    const count = data?.[0]?.result;
    if (typeof count !== 'number') throw new Error(data?.[0]?.error ?? 'Unerwartete Redis-Antwort');
    return count > MAX_REQUESTS_PER_WINDOW;
}

export async function isRateLimited(ip: string): Promise<boolean> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
        try {
            return await isRateLimitedRedis(ip, url.replace(/\/$/, ''), token);
        } catch (e) {
            console.error('Redis rate limit failed, using in-memory fallback:', e);
        }
    }
    return isRateLimitedInMemory(ip);
}
