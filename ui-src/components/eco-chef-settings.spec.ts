/**
 * @jest-environment jsdom
 */
import './eco-chef-settings';
import type { EcoChefSettings } from './eco-chef-settings';

async function mount(props: Partial<EcoChefSettings> = {}): Promise<EcoChefSettings> {
    const el = document.createElement('eco-chef-settings') as EcoChefSettings;
    Object.assign(el, props);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
}

describe('eco-chef-settings (API key section)', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    test('shows the security hint and defaults to session-only storage', async () => {
        const el = await mount();
        const root = el.shadowRoot!;
        expect(root.textContent).toContain('unverschlüsselt');
        const checkbox = root.querySelector('label input[type="checkbox"]') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    test('emits the key together with the session-only flag', async () => {
        const el = await mount();
        const handler = jest.fn();
        el.addEventListener('change-gemini-api-key', e => handler((e as CustomEvent).detail));

        const input = el.shadowRoot!.querySelector('#settings-api-key-input') as HTMLInputElement;
        input.value = 'AIza-test';
        input.dispatchEvent(new Event('change'));

        expect(handler).toHaveBeenCalledWith({ key: 'AIza-test', sessionOnly: true });
    });

    test('remove button only appears with a key and clears it', async () => {
        const el = await mount();
        expect(el.shadowRoot!.querySelector('[aria-label="Gespeicherten API-Key entfernen"]')).toBeNull();

        const withKey = await mount({ geminiApiKey: 'AIza-x', geminiKeySessionOnly: false });
        const handler = jest.fn();
        withKey.addEventListener('change-gemini-api-key', e => handler((e as CustomEvent).detail));
        (withKey.shadowRoot!.querySelector('[aria-label="Gespeicherten API-Key entfernen"]') as HTMLButtonElement).click();

        expect(handler).toHaveBeenCalledWith({ key: '', sessionOnly: false });
    });
});
