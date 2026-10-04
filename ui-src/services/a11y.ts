/** Keyboard activation (Enter/Space) for non-button elements that use role="button". */
export function onActivate(action: () => void): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };
}
