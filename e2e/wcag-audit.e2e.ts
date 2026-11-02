import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { enterApp } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Automatisierter WCAG & Responsive Audit', () => {
    test('WCAG 2.2 AA Accessibility & Responsive Check (320, 768, 1280px)', async ({ page }) => {
        const auditResults: Record<string, unknown> = {};

        // 1. Check at 320px (Mobile klein)
        await page.setViewportSize({ width: 320, height: 640 });
        await enterApp(page);

        // Check horizontal scroll at 320px
        const scrollWidth320 = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth320 = await page.evaluate(() => window.innerWidth);
        const hasHorizontalScroll320 = scrollWidth320 > innerWidth320;

        // Run axe on 320px (Main Screen)
        const axeResults320 = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        auditResults['vp320'] = {
            hasHorizontalScroll: hasHorizontalScroll320,
            scrollWidth: scrollWidth320,
            innerWidth: innerWidth320,
            violations: axeResults320.violations
        };

        // 2. Check at 768px (Tablet)
        await page.setViewportSize({ width: 768, height: 1024 });
        const scrollWidth768 = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth768 = await page.evaluate(() => window.innerWidth);
        const hasHorizontalScroll768 = scrollWidth768 > innerWidth768;

        const axeResults768 = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        auditResults['vp768'] = {
            hasHorizontalScroll: hasHorizontalScroll768,
            scrollWidth: scrollWidth768,
            innerWidth: innerWidth768,
            violations: axeResults768.violations
        };

        // 3. Check at 1280px (Desktop)
        await page.setViewportSize({ width: 1280, height: 800 });
        const scrollWidth1280 = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth1280 = await page.evaluate(() => window.innerWidth);
        const hasHorizontalScroll1280 = scrollWidth1280 > innerWidth1280;

        const axeResults1280 = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        auditResults['vp1280'] = {
            hasHorizontalScroll: hasHorizontalScroll1280,
            scrollWidth: scrollWidth1280,
            innerWidth: innerWidth1280,
            violations: axeResults1280.violations
        };

        // Check tabs for accessibility
        // Settings Tab
        await page.getByRole('button', { name: 'Einstellungen' }).click();
        const axeSettings = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
        auditResults['settings_tab_violations'] = axeSettings.violations;

        // Pantry Tab
        await page.getByRole('button', { name: 'Vorratskammer' }).click();
        const axePantry = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
        auditResults['pantry_tab_violations'] = axePantry.violations;

        const tmpDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(path.join(tmpDir, 'axe-audit.json'), JSON.stringify(auditResults, null, 2), 'utf-8');

        expect(hasHorizontalScroll320).toBe(false);
        expect(hasHorizontalScroll768).toBe(false);
        expect(hasHorizontalScroll1280).toBe(false);
    });
});
