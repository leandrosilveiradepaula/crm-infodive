import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { verifyVercelPreview } from './verify-vercel-preview.mjs';

const require = createRequire(import.meta.url);
const REQUIRED_ENV = ['CRM_E2E_BASE_URL', 'CRM_E2E_TEST_TARGET'];
const defaultRoutes = [
    '/dashboard', '/pipeline', '/leads', '/contacts', '/customers', '/activities',
    '/contracts', '/proposals', '/products', '/sales', '/sales-orders',
    '/reports', '/goals', '/goals-commissions', '/automations', '/inbox',
    '/service-desk', '/service-desk/knowledge', '/integrations', '/settings',
    '/price-lists', '/design-preview',
];
const viewports = [
    { name: 'desktop', width: 1440, height: 960 },
    { name: 'mobile', width: 390, height: 844 },
];

function skip(message) {
    if (process.env.CRM_E2E_ENFORCE_PASS === 'true') {
        process.stderr.write(`E2E_AUTHENTICATED_SMOKE=BLOCKED: ${message}\n`);
        process.exit(2);
    }
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
    if (local && !['http:', 'https:'].includes(target.protocol)) throw new Error('Local targets must use HTTP or HTTPS.');
    if (!local && target.protocol !== 'https:') throw new Error('Remote targets must use HTTPS.');
    if (process.env.CRM_E2E_TEST_TARGET !== 'isolated') throw new Error('CRM_E2E_TEST_TARGET must be exactly "isolated".');
    if (!local && (!process.env.CRM_E2E_PREVIEW_SHA || !process.env.CRM_E2E_DEPLOYMENT_ID)) {
        throw new Error('Remote test targets require CRM_E2E_PREVIEW_SHA and CRM_E2E_DEPLOYMENT_ID for auditable evidence.');
    }
    if (!local && (!process.env.CRM_E2E_EXPECTED_SHA || process.env.CRM_E2E_EXPECTED_SHA !== process.env.CRM_E2E_PREVIEW_SHA)) {
        throw new Error('Remote Preview SHA must match CRM_E2E_EXPECTED_SHA, supplied independently by the protected CI job.');
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
    if (typeof route !== 'string' || (route !== '/login' && !defaultRoutes.includes(route))) throw new Error('E2E route is not an authorized login/dashboard route.');
    const url = new URL(route, baseUrl);
    if (url.origin !== baseUrl.origin) throw new Error('E2E route must remain on the authorized target origin.');
    return url.toString();
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

async function assertMobileNavigation(page, baseUrl) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(routeUrl(baseUrl, '/dashboard'), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });
    const openTranslate = await sidebar.evaluate((element) => getComputedStyle(element).translate);
    if (openTranslate !== '0px') throw new Error('Mobile menu did not open.');
    await page.getByRole('link', { name: 'Pipeline' }).click();
    await page.waitForURL((url) => url.pathname === '/pipeline', { timeout: 20_000 });
    const closedTranslate = await sidebar.evaluate((element) => getComputedStyle(element).translate);
    if (closedTranslate !== '-100%') throw new Error('Mobile menu did not close after navigation.');
}

async function runAxe(page, source) {
    await page.addScriptTag({ content: source });
    const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    }));
    if (result.incomplete.length) throw new Error(`axe returned ${result.incomplete.length} incomplete result(s), which require review.`);
    if (result.violations.length) throw new Error(`axe found WCAG A/AA violation(s): ${result.violations.map(({ id }) => id).join(', ')}.`);
    return [];
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
    // Local Next.js can still point at a live backend. Require the same explicit
    // synthetic-backend approval before a local or remote authenticated session.
    // This flag is a human approval gate, not proof of isolation by itself.
    if (process.env.CRM_E2E_BACKEND_ISOLATED !== 'true') {
        throw new Error('A separate synthetic QA backend must be approved before authenticated E2E.');
    }
    if (!local) {
        await verifyVercelPreview({
            baseUrl: baseUrl.href,
            deploymentId: process.env.CRM_E2E_DEPLOYMENT_ID,
            expectedSha: process.env.CRM_E2E_EXPECTED_SHA,
            expectedBranch: process.env.CRM_E2E_EXPECTED_BRANCH,
            projectId: process.env.CRM_E2E_VERCEL_PROJECT_ID,
            teamId: process.env.CRM_E2E_VERCEL_TEAM_ID,
            token: process.env.VERCEL_TOKEN,
        });
    }
    const { chromium } = await loadPlaywright();
    const source = await axeSource();
    const artifactDir = process.env.CRM_E2E_ARTIFACT_DIR ? resolve(process.env.CRM_E2E_ARTIFACT_DIR) : null;
    const capture = process.env.CRM_E2E_CAPTURE_SANITIZED === 'true';
    if (capture && !artifactDir) throw new Error('CRM_E2E_ARTIFACT_DIR is required when screenshots are enabled.');
    if (artifactDir) await mkdir(artifactDir, { recursive: true });

    const launchOptions = { headless: true };
    if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
    browser = await chromium.launch(launchOptions);
    for (const account of accounts) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await login(page, baseUrl, account);
        if (!Array.isArray(account.routes) || account.routes.length === 0 || !account.routes.every((route) => defaultRoutes.includes(route))) {
            throw new Error('Every test profile must define one or more valid routes from the verified CRM inventory.');
        }
        const profileResult = { label: account.label, routeCount: account.routes.length, checks: [] };
        if (account.routes.includes('/dashboard') && account.routes.includes('/pipeline')) {
            await assertMobileNavigation(page, baseUrl);
            profileResult.checks.push({ route: '/dashboard', viewport: 'mobile', theme: 'system', mobileMenuNavigation: 'passed' });
        } else {
            profileResult.checks.push({ viewport: 'mobile', theme: 'system', mobileMenuNavigation: 'not-applicable-for-profile' });
        }
        for (const route of account.routes) {
            for (const viewport of viewports) {
                await page.setViewportSize(viewport);
                for (const theme of ['light', 'dark']) {
                    const response = await page.goto(routeUrl(baseUrl, route), { waitUntil: 'networkidle' });
                    if (!response?.ok()) throw new Error(`Authenticated route returned an unsuccessful HTTP status: ${route}.`);
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
