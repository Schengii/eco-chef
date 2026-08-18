import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number; // ms, 0 = persistent
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Toast / Snackbar notification system.
 *
 * Usage:
 *   EcoChefToast.show({ message: 'Rezept gespeichert!', type: 'success' });
 *
 * Or with undo-action:
 *   EcoChefToast.show({
 *     message: 'Zutat gelöscht',
 *     type: 'warning',
 *     actionLabel: 'Rückgängig',
 *     onAction: () => restoreItem()
 *   });
 */
@customElement('eco-chef-toast')
export class EcoChefToast extends LitElement {
    static override styles = css`
        :host {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            pointer-events: none;
            width: min(560px, calc(100vw - 32px));
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 18px;
            border-radius: 16px;
            font-family: 'Outfit', system-ui, sans-serif;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
            pointer-events: all;
            cursor: default;
            min-width: 260px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .toast.dismissing {
            animation: slideDown 0.3s ease forwards;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(24px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(16px) scale(0.95);
            }
        }

        /* Type variants */
        .toast.success {
            background: linear-gradient(135deg, #065f46, #047857);
            color: #ecfdf5;
            border: 1.5px solid #10b981;
        }

        .toast.error {
            background: linear-gradient(135deg, #7f1d1d, #991b1b);
            color: #fff1f2;
            border: 1.5px solid #ef4444;
        }

        .toast.warning {
            background: linear-gradient(135deg, #78350f, #92400e);
            color: #fffbeb;
            border: 1.5px solid #f59e0b;
        }

        .toast.info {
            background: linear-gradient(135deg, #1e3a5f, #1d4ed8);
            color: #eff6ff;
            border: 1.5px solid #60a5fa;
        }

        .toast-icon {
            font-size: 20px;
            flex-shrink: 0;
            line-height: 1;
        }

        .toast-message {
            flex: 1;
        }

        .toast-action {
            background: rgba(255, 255, 255, 0.2);
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            border-radius: 10px;
            color: inherit;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
            padding: 6px 12px;
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.2s ease;
            white-space: nowrap;
        }

        .toast-action:hover {
            background: rgba(255, 255, 255, 0.35);
        }

        .toast-close {
            background: transparent;
            border: none;
            color: inherit;
            font-size: 16px;
            cursor: pointer;
            padding: 0 2px;
            flex-shrink: 0;
            opacity: 0.7;
            transition: opacity 0.2s;
            line-height: 1;
        }

        .toast-close:hover {
            opacity: 1;
        }
    `;

    @state() private toasts: (ToastMessage & { dismissing?: boolean })[] = [];

    private timers: Map<string, number> = new Map();

    /**
     * Static singleton accessor – call EcoChefToast.instance?.show(...)
     * or use the global helper showToast() instead.
     */
    static instance: EcoChefToast | null = null;

    override connectedCallback() {
        super.connectedCallback();
        EcoChefToast.instance = this;
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        if (EcoChefToast.instance === this) {
            EcoChefToast.instance = null;
        }
        this.timers.forEach(t => clearTimeout(t));
    }

    /**
     * Public method to add a toast directly (used by showConfirmToast).
     * More type-safe than accessing the private toasts state directly.
     */
    addToast(toast: ToastMessage & { dismissing?: boolean }) {
        this.toasts = [...this.toasts, toast];
    }

    /** Returns whether a toast with the given ID is currently displayed. */
    hasToast(id: string): boolean {
        return this.toasts.some((t: ToastMessage) => t.id === id);
    }

    show(msg: Omit<ToastMessage, 'id'>) {
        const id = Math.random().toString(36).slice(2, 9);
        const duration = msg.duration ?? 3500;
        this.toasts = [...this.toasts, { ...msg, id }];

        if (duration > 0) {
            const timer = window.setTimeout(() => this.dismiss(id), duration);
            this.timers.set(id, timer);
        }
    }

    dismiss(id: string) {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        // Mark as dismissing for the exit animation
        this.toasts = this.toasts.map(t => t.id === id ? { ...t, dismissing: true } : t);
        // Remove after animation
        window.setTimeout(() => {
            this.toasts = this.toasts.filter(t => t.id !== id);
        }, 320);
    }

    private getIcon(type: ToastType): string {
        switch (type) {
            case 'success': return '✅';
            case 'error':   return '❌';
            case 'warning': return '⚠️';
            case 'info':    return 'ℹ️';
        }
    }

    override render() {
        return html`
            ${this.toasts.map(toast => html`
                <div
                    class="toast ${toast.type} ${toast.dismissing ? 'dismissing' : ''}"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                >
                    <span class="toast-icon" aria-hidden="true">${this.getIcon(toast.type)}</span>
                    <span class="toast-message">${toast.message}</span>
                    ${toast.actionLabel && toast.onAction ? html`
                        <button class="toast-action" @click="${() => {
                            toast.onAction!();
                            this.dismiss(toast.id);
                        }}">${toast.actionLabel}</button>
                    ` : ''}
                    <button class="toast-close" @click="${() => this.dismiss(toast.id)}" aria-label="Meldung schließen">✕</button>
                </div>
            `)}
        `;
    }
}

/**
 * Global helper function – shows a toast notification.
 * Can be called from anywhere without needing a reference to the component.
 */
export function showToast(
    message: string,
    type: ToastType = 'info',
    options?: { duration?: number; actionLabel?: string; onAction?: () => void }
): void {
    if (EcoChefToast.instance) {
        EcoChefToast.instance.show({ message, type, ...options });
    } else {
        // Fallback: wenn die Komponente noch nicht im DOM ist
        console.warn('[EcoChef Toast] No toast instance found. Message:', message);
    }
}

/**
 * Global helper for a confirm-style dialog via toast.
 * Returns a Promise that resolves to true if confirmed, false if dismissed/rejected.
 */
export function showConfirmToast(
    message: string,
    confirmLabel = 'Bestätigen',
    _cancelLabel = 'Abbrechen'
): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        if (!EcoChefToast.instance) {
            // Fallback to native confirm if component not available
            resolve(window.confirm(message));
            return;
        }

        // We show a persistent warning toast with Confirm/Cancel actions.
        // Since ToastMessage supports only one action button, we handle
        // cancel via the close button (resolves false) and confirm via actionLabel.
        const id = Math.random().toString(36).slice(2, 9);
        let resolved = false;

        const resolveOnce = (val: boolean) => {
            if (resolved) return;
            resolved = true;
            EcoChefToast.instance?.dismiss(id);
            resolve(val);
        };

        EcoChefToast.instance.addToast({
            id,
            message,
            type: 'warning',
            duration: 0, // persistent
            actionLabel: confirmLabel,
            onAction: () => resolveOnce(true),
        });

        // Monkey-patch: after dismiss fires (close btn), resolve false
        // We do this by observing via a polling approach on the toasts array.
        const checkDismissed = setInterval(() => {
            if (EcoChefToast.instance && !EcoChefToast.instance.hasToast(id)) {
                clearInterval(checkDismissed);
                resolveOnce(false);
            } else if (!EcoChefToast.instance) {
                clearInterval(checkDismissed);
                resolveOnce(false);
            }
        }, 100);
    });
}
