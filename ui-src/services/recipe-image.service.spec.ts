import { createPlaceholderImage } from './recipe-image.service';

const decode = (uri: string) => decodeURIComponent(uri.replace('data:image/svg+xml;charset=utf-8,', ''));

describe('createPlaceholderImage', () => {
    test('returns an SVG data URI without external references', () => {
        const uri = createPlaceholderImage('Tomatensuppe');
        expect(uri.startsWith('data:image/svg+xml')).toBe(true);
        expect(decode(uri)).toContain('<svg');
        expect(decode(uri)).not.toMatch(/href=|src=/);
    });

    test('is deterministic and picks a matching emoji', () => {
        expect(createPlaceholderImage('Linsen-Curry')).toBe(createPlaceholderImage('Linsen-Curry'));
        expect(decode(createPlaceholderImage('Tomatensuppe'))).toContain('🍲');
        expect(decode(createPlaceholderImage('Spaghetti Bolognese'))).toContain('🍝');
        expect(decode(createPlaceholderImage('Unbekanntes Gericht'))).toContain('🍽️');
    });

    test('does not inject the title into the markup', () => {
        expect(decode(createPlaceholderImage('<script>alert(1)</script>'))).not.toContain('script');
    });
});
