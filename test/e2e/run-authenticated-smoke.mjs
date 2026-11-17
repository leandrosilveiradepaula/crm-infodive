import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const REQUIRED_ENV = ['CRM_E2E_BASE_URL', 'CRM_E2E_TEST_TARGET'];
const defaultRoutes = [
    '/dashboard', '/pipeline', '/leads', '/contacts', '/customers', '/activities',
    '/contracts', '/proposals', '/products', '/sales', '/sales-orders', '/purchases',
    '/reports', '/goals', '/goals-commissions', '/automations', '/inbox',
    '/service-desk', '/service-desk/knowledge', '/integrations', '/settings',
    '/price-lists', '/design-preview',
];
const viewports = [
    { name: 'desktop', width: 1440, height: 960 },
    { name: 'mobile', width: 390, height: 844 },
];

function skip(message) {
    process.stdout.write(`E2E_AUTHENTICATED_SMOKE=SKIPPED: ${message}\n`);
    process.exit(0);
}

function fail(message) {
    process.stderr.write(`E2E_AUTHENTICATED_SMOKE=FAILED: ${message}\n`);
    process.exitCode = 1;
}

function parseAccounts() {
    const inline = ['CRM_E2E_EMAIL', 'CRM_E2E_PASSWORD'].map((name) => process.env[name]);
    const hasInline = inline.some(Boolean);
    const hasAllInline = inline.every(Boolean);
    if (hasInline && !hasAllInline) throw new Error('Both CRM_E2E_EMAIL and CRM_E2E_PASSWORD are required together.');

    if (process.env.CRM_E2E_ACCOUNTS_JSON && hasInline) {
        throw new Error('Use either CRM_E2E_ACCOUNTS_JSON or CRM_E2E_EMAIL/CRM_E2E_PASSWORD, not both.');
    }
    if (process.env.CRM_E2E_ACCOUNTS_JSON) {
        const accounts = JSON.parse(process.env.CRM_E2E_ACCOUNTS_JSON);
        if (!Array.isArray(accounts) || accounts.length === 0) throw new Error('CRM_E2E_ACCOUNTS_JSON must contain at least one account.');
        return accounts.map((account, index) => ({
            label: `profile-${index + 1}`,
            email: account.email,
            password: account.password,
            routes: account.routes ?? defaultRoutes,
        }));
    }
    if (hasAllInline) {
        return [{
            label: 'profile-1',
            email: process.env.CRM_E2E_EMAIL,
            password: process.env.CRM_E2E_PASSWORD,
            routes: process.env.CRM_E2E_ROUTES?.split(',').map((route) => route.trim()).filter(Boolean) ?? defaultRoutes,
        }];
    }
    skip('No legitimate test account was supplied. Set test-only CRM_E2E_EMAIL/CRM_E2E_PASSWORD or CRM_E2E_ACCOUNTS_JSON through protected CI secrets.');
}

function validateEnvironment() {
    const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
    if (missing.length) skip(`Missing ${missing.join(', ')}. No authenticated target was contacted.`);

    const target = new URL(process.env.CRM_E2E_BASE_URL);
    if (target.username || target.password) throw new Error('CRM_E2E_BASE_URL must not contain credentials.');
    const local = ['localhost', '127.0.0.1', '::1'].includes(target.hostname);
    if (!local && target.protocol !== 'https:') throw new Error('Remote targets must use HTTPS.');
    if (process.env.CRM_E2E_TEST_TARGET !== 'isolated') throw new Error('CRM_E2E_TEST_TARGET must be exactly "isolated".');
    if (!local && (!process.env.CRM_E2E_PREVIEW_SHA || !process.env.CRM_E2E_DEPLOYMENT_ID)) {
        throw new Error('Remote test targets require CRM_E2E_PREVIEW_SHA and CRM_E2E_DEPLOYMENT_ID for auditable evidence.');
    }
    return { baseUrl: target, local };
}

async function loadPlaywright() {
    const moduleName = process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core';
    try {
        return await import(moduleName);
    } catch {
        throw new Error('Playwright is unavailable. Provide PLAYWRIGHT_CORE_PATH from the isolated QA toolchain; do not add credentials or bypass authentication.');
    }
}

function axeSource() {
    try {
        return readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
    } catch {
        throw new Error('axe-core is unavailable in the QA toolchain.');
    }
}

function routeUrl(baseUrl, route) {
    if (!route.startsWith('/') || route.includes('://')) throw new Error(`Invalid E2E route: ${route}`);
    return new URL(route, baseUrl).toString();
}

async function setTheme(page, theme) {
    const button = page.getByTitle('Alternar Tema');
    if (theme === 'dark') {
        const dark = await page.locator('html').evaluate((element) => element.classList.contains('dark'));
        if (!dark) await button.click();
    } else {
        const dark = await page.locator('html').evaluate((element) => element.classList.contains('dark'));
        if (dark) await button.click();
    }
    await page.waitForTimeout(100);
}

async function assertKeyboardFocus(page) {
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        return {
            tag: element.tagName,
            outline: style.outlineStyle,
            boxShadow: style.boxShadow,
        };
    });
    if (!focus || (focus.outline === 'none' && focus.boxShadow === 'none')) {
        throw new Error('Keyboard focus is not visibly rendered.');
    }
}

async function assertLayout(page) {
    const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        main: Boolean(document.querySelector('main')),
        navigation: Boolean(document.querySelector('nav[aria-label="Navegação principal"]')),
    }));
    if (!layout.main || !layout.navigation) throw new Error('Dashboard shell is incomplete.');
    if (layout.scrollWidth > layout.viewportWidth) throw new Error(`Document overflows viewport (${layout.scrollWidth}px > ${layout.viewportWidth}px).`);
}

async function runAxe(page, source) {
    await page.addScriptTag({ content: source });
    const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    }));
    if (result.incomplete.length) throw new Error(`axe returned ${result.incomplete.length} incomplete result(s), which require review.`);
    const blocking = result.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
    if (blocking.length) throw new Error(`axe found blocking violation(s): ${blocking.map(({ id }) => id).join(', ')}.`);
    return result.violations.map(({ id, impact }) => ({ id, impact }));
}

async function login(page, baseUrl, account) {
    await page.goto(routeUrl(baseUrl, '/login'), { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(account.password);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

const results = { version: 1, profiles: [], failures: [] };
let browser;
try {
    const { baseUrl, local } = validateEnvironment();
    const accounts = parseAccounts();
    const { chromium } = await loadPlaywright();
    const source = await axeSource();
    const artifactDir = process.env.CRM_E2E_ARTIFACT_DIR ? resolve(process.env.CRM_E2E_ARTIFACT_DIR) : null;
    const capture = process.env.CRM_E2E_CAPTURE_SANITIZED === 'true';
    if (capture && !artifactDir) throw new Error('CRM_E2E_ARTIFACT_DIR is required when screenshots are enabled.');
    if (artifactDir) await mkdir(artifactDir, { recursive: true });

    browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true,
    });
    for (const account of accounts) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await login(page, baseUrl, account);
        const profileResult = { label: account.label, routeCount: account.routes.length, checks: [] };
        for (const route of account.routes) {
            for (const viewport of viewports) {
                await page.setViewportSize(viewport);
                for (const theme of ['light', 'dark']) {
                    await page.goto(routeUrl(baseUrl, route), { waitUntil: 'networkidle' });
                    if (page.url().includes('/login')) throw new Error(`Authenticated route redirected to login: ${route}`);
                    await setTheme(page, theme);
                    await assertLayout(page);
                    await assertKeyboardFocus(page);
                    const violations = await runAxe(page, source);
                    if (capture) await page.screenshot({ path: resolve(artifactDir, `${account.label}-${route.slice(1).replaceAll('/', '-') || 'root'}-${viewport.name}-${theme}.png`), fullPage: true });
                    profileResult.checks.push({ route, viewport: viewport.name, theme, axeViolations: violations });
                }
            }
        }
        results.profiles.push(profileResult);
        await context.close();
    }
    if (artifactDir) await writeFile(resolve(artifactDir, 'results.json'), `${JSON.stringify({ ...results, target: local ? 'local-isolated' : 'remote-isolated', previewSha: process.env.CRM_E2E_PREVIEW_SHA ?? null, deploymentId: process.env.CRM_E2E_DEPLOYMENT_ID ?? null }, null, 2)}\n`);
    process.stdout.write(`E2E_AUTHENTICATED_SMOKE=PASSED: ${results.profiles.length} profile(s), ${results.profiles.reduce((total, profile) => total + profile.checks.length, 0)} visual route checks.\n`);
} catch (error) {
    results.failures.push({ message: error instanceof Error ? error.message : 'Unknown E2E failure.' });
    fail(error instanceof Error ? error.message : 'Unknown E2E failure.');
} finally {
    await browser?.close();
}
