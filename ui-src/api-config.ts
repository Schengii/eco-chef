/**
 * API Key Configuration
 *
 * The GEMINI_API_KEY is injected at build time via webpack.DefinePlugin from a local .env file.
 * Never commit a real API key to this file!
 *
 * To set your key for local development:
 *   1. Create a file named ".env" in the project root (it is git-ignored)
 *   2. Add: GEMINI_API_KEY=your_actual_key_here
 *
 * In production: Set the GEMINI_API_KEY environment variable in your CI/CD pipeline.
 *
 * The user can also override the key at any time via the EcoChef Settings ⚙️ page.
 */

// The key is injected by webpack DefinePlugin at build time: the expression `process.env.ECOCHEF_GEMINI_API_KEY`
// is replaced with a string literal (empty in production). `typeof process` must NOT be used as a guard here:
// browsers have no `process`, so the guard would always fall through and discard the injected dev key.
declare const process: { env: { ECOCHEF_GEMINI_API_KEY?: string } };

function readInjectedKey(): string {
    try {
        return process.env.ECOCHEF_GEMINI_API_KEY || '';
    } catch {
        return ''; // not bundled by webpack (no DefinePlugin replacement, no `process`)
    }
}

export const GEMINI_API_KEY: string = readInjectedKey(); // Empty string = user must provide key via Settings
