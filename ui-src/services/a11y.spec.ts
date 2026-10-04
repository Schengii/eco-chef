import { onActivate } from './a11y';

const key = (k: string) => ({ key: k, preventDefault: jest.fn() }) as unknown as KeyboardEvent;

describe('onActivate', () => {
    test('triggers on Enter and Space and prevents scrolling', () => {
        const action = jest.fn();
        const handler = onActivate(action);
        const space = key(' ');
        handler(key('Enter'));
        handler(space);
        expect(action).toHaveBeenCalledTimes(2);
        expect(space.preventDefault).toHaveBeenCalled();
    });

    test('ignores other keys', () => {
        const action = jest.fn();
        onActivate(action)(key('a'));
        expect(action).not.toHaveBeenCalled();
    });
});
