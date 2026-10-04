/**
 * Offline placeholder illustration for recipes (no third-party image service, no data leaves the device).
 * Emoji and colors are derived deterministically from the dish title.
 */
const EMOJI_RULES: Array<[RegExp, string]> = [
    [/suppe|eintopf|brühe|bruehe/i, '🍲'],
    [/salat/i, '🥗'],
    [/pasta|nudel|spaghetti|lasagne|penne/i, '🍝'],
    [/curry|reis|risotto/i, '🍛'],
    [/pizza|flammkuchen/i, '🍕'],
    [/burger/i, '🍔'],
    [/kuchen|torte|muffin|dessert|pudding/i, '🍰'],
    [/brot|toast|sandwich|stulle/i, '🥪'],
    [/ei(er)?\b|omelett|rührei/i, '🍳'],
    [/fisch|lachs|thunfisch/i, '🐟'],
    [/hähnchen|huhn|geflügel|pute|fleisch|schnitzel|braten/i, '🍗'],
    [/kartoffel|püree|pommes|gratin/i, '🥔'],
    [/gemüse|pfanne|wok/i, '🥘'],
    [/smoothie|shake|saft/i, '🥤']
];

const PALETTES: Array<[string, string]> = [
    ['#a8e063', '#56ab2f'], ['#f6d365', '#fda085'], ['#84fab0', '#8fd3f4'],
    ['#fbc2eb', '#a6c1ee'], ['#ffecd2', '#fcb69f'], ['#c3f0ca', '#6bc5a0']
];

function hashTitle(title: string): number {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function createPlaceholderImage(title: string): string {
    const emoji = EMOJI_RULES.find(([rule]) => rule.test(title))?.[1] ?? '🍽️';
    const [from, to] = PALETTES[hashTitle(title) % PALETTES.length];
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" role="img">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
        `<rect width="600" height="400" fill="url(#g)"/>` +
        `<text x="300" y="235" font-size="150" text-anchor="middle">${emoji}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
