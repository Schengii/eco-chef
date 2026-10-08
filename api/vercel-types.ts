/**
 * Minimal request/response types for the Vercel Node runtime.
 * Replaces the `@vercel/node` dev dependency, which is only needed for these two types and drags in
 * several vulnerable build-tool packages (flagged by `npm audit`). The runtime provides the real objects.
 */
import type { IncomingHttpHeaders } from 'http';

export interface VercelRequest {
    method?: string;
    headers: IncomingHttpHeaders;
    body?: unknown;
    socket: { remoteAddress?: string };
}

export interface VercelResponse {
    status(code: number): VercelResponse;
    json(body: unknown): VercelResponse;
    end(): VercelResponse;
    setHeader(name: string, value: string | number | readonly string[]): VercelResponse;
}
