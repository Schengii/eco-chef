/**
 * Vercel Web Analytics (cookielos, ohne Profilbildung).
 *
 * Das Skript liefert Vercel unter `/_vercel/insights/script.js` nur auf der echten Web-Domain aus.
 * Deshalb wird es weder in der Cordova-App (file:/content:/cordova) noch lokal (localhost, Dev-Server)
 * geladen – dort gäbe es nur 404-Fehler. Kein npm-Paket nötig, die Start-Bundle-Größe bleibt gleich.
 */
const SCRIPT_SRC = '/_vercel/insights/script.js';

function isLocalHost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '';
}

function isCordova(): boolean {
    return window.location.protocol === 'file:' ||
        window.location.protocol === 'content:' ||
        Boolean((window as unknown as { cordova?: unknown }).cordova);
}

/** Lädt Vercel Web Analytics, falls die App als Web-Version auf einer echten Domain läuft. */
export function initInsights(): void {
    if (isCordova() || isLocalHost(window.location.hostname)) return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    const win = window as unknown as { va?: (...args: unknown[]) => void; vaq?: unknown[] };
    if (!win.va) {
        win.va = (...args: unknown[]) => {
            (win.vaq = win.vaq || []).push(args);
        };
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = SCRIPT_SRC;
    document.head.appendChild(script);
}
