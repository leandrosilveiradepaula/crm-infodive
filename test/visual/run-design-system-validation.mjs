import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.VISUAL_BASE_URL ?? 'http://127.0.0.1:4173/test/visual/harness/';
const artifactDir = resolve(process.env.VISUAL_ARTIFACT_DIR ?? 'docs/ui/evidence/49226af');
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');

await mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage();
const results = { baseUrl, checks: [], axeViolations: {} };

async function capture(name, viewport, dark = false) {
    await page.setViewportSize(viewport);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate((enabled) => document.documentElement.classList.toggle('dark', enabled), dark);
    await page.screenshot({ path: resolve(artifactDir, `${name}.png`), fullPage: true });
    results.checks.push({ name, viewport, theme: dark ? 'dark' : 'light', screenshot: `${name}.png` });
}

try {
    await capture('desktop-light', { width: 1440, height: 960 });
    await capture('desktop-dark', { width: 1440, height: 960 }, true);
    await capture('mobile-light', { width: 390, height: 844 });

    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: resolve(artifactDir, 'mobile-menu-open.png'), fullPage: true });
    const sidebarTranslate = await page.locator('aside').evaluate((element) => getComputedStyle(element).translate);
    if (sidebarTranslate !== '0px') throw new Error('Mobile menu did not open.');
    await page.getByRole('link', { name: 'Pipeline' }).click();
    await page.waitForTimeout(250);
    const closedTranslate = await page.locator('aside').evaluate((element) => getComputedStyle(element).translate);
    if (closedTranslate !== '-100%') throw new Error('Mobile menu did not close after navigation.');
    results.checks.push({ name: 'mobile-menu-navigation', sidebarTranslate, closedTranslate });

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('#fixture-search').focus();
    const focusStyle = await page.locator('#fixture-search').evaluate((element) => {
        const style = getComputedStyle(element);
        return { outline: style.outlineStyle, boxShadow: style.boxShadow };
    });
    if (focusStyle.outline === 'none' && focusStyle.boxShadow === 'none') throw new Error('Input focus is not visible.');
    await page.screenshot({ path: resolve(artifactDir, 'desktop-focus.png'), fullPage: true });
    results.checks.push({ name: 'keyboard-focus', focusStyle });

    await page.addScriptTag({ content: axeSource });
    const critical = [];
    for (const [theme, dark] of [['light', false], ['dark', true]]) {
        await page.evaluate((enabled) => document.documentElement.classList.toggle('dark', enabled), dark);
        const axe = await page.evaluate(async () => window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        }));
        results.axeViolations[theme] = axe.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, targets: nodes.map(({ target }) => target.join(' ')) }));
        critical.push(...axe.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious').map(({ id }) => `${theme}:${id}`));
    }
    if (critical.length) throw new Error(`Axe found serious/critical violations: ${critical.join(', ')}`);
} finally {
    await writeFile(resolve(artifactDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
    await browser.close();
}
