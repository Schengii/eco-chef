import { showToast } from '../components/eco-chef-toast';

function isCordova(): boolean {
    return window.location.protocol === 'file:' ||
        window.location.protocol === 'content:' ||
        Boolean((window as unknown as { cordova?: unknown }).cordova);
}

/**
 * Registers the service worker (web/PWA only) and offers an update when a new version is waiting.
 * The new worker only takes over after the user confirms, so a running cooking session is never interrupted.
 */
export function registerServiceWorker(): void {
    if (isCordova() || !('serviceWorker' in navigator)) return;

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            const offerUpdate = (worker: ServiceWorker) => {
                showToast('Neue Version von EcoChef verfügbar.', 'info', {
                    duration: 30000,
                    actionLabel: 'Neu laden',
                    onAction: () => worker.postMessage({ type: 'SKIP_WAITING' })
                });
            };

            // A worker may already be waiting from a previous visit
            if (registration.waiting && navigator.serviceWorker.controller) {
                offerUpdate(registration.waiting);
            }
            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                installing?.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        offerUpdate(installing);
                    }
                });
            });
        }).catch(err => console.warn('[SW] Registrierung fehlgeschlagen:', err));
    });
}
