import { test, expect } from '@playwright/test';

test('household sync: code is generated and uploaded encrypted (CSP allows kvdb.io)', async ({ page }) => {
    const uploads: Array<{ url: string; body: string }> = [];
    await page.route('https://kvdb.io/**', async route => {
        uploads.push({ url: route.request().url(), body: route.request().postData() ?? '' });
        return route.fulfill({ status: 200, body: 'ok' });
    });
    const cspViolations: string[] = [];
    page.on('console', msg => {
        if (/Content Security Policy/i.test(msg.text())) cspViolations.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Küche betreten/ }).click();
    const consent = page.getByRole('button', { name: 'Einwilligen und fortfahren' });
    if (await consent.isVisible().catch(() => false)) await consent.click();

    await page.getByRole('button', { name: 'Einstellungen', exact: true }).click();
    await page.getByRole('button', { name: /Sync-Schlüssel generieren/ }).click();

    await expect(page.getByText(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)).toBeVisible();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].url).toMatch(/^https:\/\/kvdb\.io\/ecochef_sync_[0-9a-f]{32}$/);
    expect(JSON.parse(uploads[0].body).enc).toMatch(/^enc2:/);
    expect(cspViolations).toEqual([]);
});
