/** Debug output only in development builds, so user data (e.g. voice commands) never ends up in production consoles. */
const isDev = process.env.NODE_ENV !== 'production';

export const Logger = {
    debug: (...args: unknown[]): void => {
        if (isDev) console.debug('[EcoChef]', ...args);
    }
};
