import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
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

    const credentialsFile = process.env.CRM_E2E_ACCOUNTS_FILE;
    if (Number(Boolean(credentialsFile)) + Number(Boolean(process.env.CRM_E2E_ACCOUNTS_JSON)) + Number(hasInline) > 1) {
        throw new Error('Provide exactly one E2E account source: protected file, protected JSON secret or single account.');
    }
    if (credentialsFile || process.env.CRM_E2E_ACCOUNTS_JSON) {
        // The auto-provisioner creates this file mode 0600 in a disposable,
        // permission-0700 directory under the protected CI runner temp path.
        let source = process.env.CRM_E2E_ACCOUNTS_JSON;
        if (credentialsFile) {
            const stat = statSync(credentialsFile);
            if (!stat.isFile() || (stat.mode & 0o077) !== 0) {
                throw new Error('Ephemeral E2E credentials file must be a private regular file.');
            }
            source = readFileSync(credentialsFile, 'utf8');
        }
        const accounts = JSON.parse(source);
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
        return readFile(process.env.CRM_QA_AXE_MIN_PATH || require.resolve('axe-core/axe.min.js'), 'utf8');
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

async function setTheme(page, theme, verifyPersistence = false) {
    const wantDark = theme === 'dark';
    const dark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
    // The former 100ms wait sampled CSS halfway through 500–700ms dark/light
    // transitions, producing false axe violations/incomplete results.
    if (dark !== wantDark) await page.getByTitle('Alternar Tema').click();
    try {
        await page.waitForFunction(
            expectedDark => document.documentElement.classList.contains('dark') === expectedDark,
            wantDark,
            { timeout: 5_000 },
        );
    } catch {
        // Bounded, non-sensitive diagnostic: a failing save must not be hidden
        // by forcing a class on the document in the QA runner.
        const signal = await page.evaluate(() => ({
            dark: document.documentElement.classList.contains('dark'),
            saveState: ['saving', 'saved', 'failed'].includes(document.documentElement.dataset.themeSaveState)
                ? document.documentElement.dataset.themeSaveState : 'unobserved',
        }));
        throw new Error('CRM_THEME_PERSISTENCE_BLOCKED: wantedDark=' + wantDark +
            ', renderedDark=' + signal.dark + ', saveState=' + signal.saveState);
    }
    if (verifyPersistence) {
        if (dark !== wantDark) {
            await page.waitForFunction(
                () => ['saved', 'failed'].includes(document.documentElement.dataset.themeSaveState),
                null,
                { timeout: 8_000 },
            );
            const status = await page.locator('html').getAttribute('data-theme-save-state');
            if (status !== 'saved') {
                throw new Error('CRM_THEME_SAVE_NOT_CONFIRMED: server action did not verify the profile write.');
            }
        }
        // A new authenticated request MUST read the preference from the server,
        // rather than relying on a client-only temporary CSS class.
        await page.reload({ waitUntil: 'networkidle' });
        const persistedDark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
        if (persistedDark !== wantDark) {
            throw new Error('CRM_THEME_READ_AFTER_WRITE_FAILED: profile preference did not survive reload.');
        }
    }
    // Wait for actual styles and fonts, not just the HTML theme class. This is
    // deterministic visual stabilization; axe rules remain unchanged.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
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

/**
 * Ensure the real dashboard drag handles are keyboard-operable and their
 * ARIA IDREFs resolve. axe-core may report this rule as incomplete rather
 * than a violation when an externally generated description ID is missing.
 * Do not log element text, ARIA values, account details or selectors.
 */
async function assertDashboardDragHandles(page, viewportName) {
    const state = await page.evaluate((isMobile) => {
        const handles = Array.from(document.querySelectorAll('[data-rfd-drag-handle-draggable-id]'));
        const counts = { handles: handles.length, invalidDescription: 0, unlabeled: 0, notKeyboardReachable: 0, invisibleMobile: 0 };
        for (const handle of handles) {
            const refs = (handle.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
            if (!refs.length || refs.some((id) => !document.getElementById(id))) counts.invalidDescription++;
            if (!handle.getAttribute('aria-label') && !handle.getAttribute('aria-labelledby')) counts.unlabeled++;
            if (handle.tabIndex < 0 || handle.getAttribute('role') !== 'button') counts.notKeyboardReachable++;
            if (isMobile && Number(getComputedStyle(handle).opacity) < 0.99) counts.invisibleMobile++;
        }
        return counts;
    }, viewportName === 'mobile');
    if (state.handles < 1 || state.invalidDescription || state.unlabeled ||
        state.notKeyboardReachable || state.invisibleMobile) {
        throw new Error('CRM_B4_DASHBOARD_DRAG_ARIA_FAILED:' + JSON.stringify(state));
    }
}

async function assertLayout(page) {
    const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        main: Boolean(document.querySelector('main')),
        navigation: Boolean(document.querySelector('nav[aria-label="Áreas principais"]')) &&
            Boolean(document.querySelector('nav[aria-label^="Navegação de "]')),
    }));
    if (!layout.main || !layout.navigation) throw new Error('Dashboard shell is incomplete.');
    if (layout.scrollWidth > layout.viewportWidth) throw new Error(`Document overflows viewport (${layout.scrollWidth}px > ${layout.viewportWidth}px).`);
}

/**
 * Verify real shared components across multiple authenticated route families.
 * The browser changes exactly ONE primitive at a time, measures the computed
 * style and restores the inline override. No settings are persisted and no
 * tenant data is modified. This is a propagation test, not a screenshot-only claim.
 */
async function assertDesignTokenPropagation(page) {
    return page.evaluate(async () => {
        const root = document.documentElement;
        const title = document.querySelector('[data-slot="crm-page-header"] h1');
        const tile = document.querySelector('[data-slot="stats-tile"]');
        const primary = document.querySelector('[data-slot="button"][data-variant="default"]');
        if (!title || !tile || !primary) {
            throw new Error('Design-token propagation lacks real header, stat tile or primary button.');
        }
        const gradient = document.createElement('div');
        gradient.className = 'ds-gradient-context';
        gradient.setAttribute('aria-hidden', 'true');
        gradient.style.cssText = 'position:fixed;left:-9999px;pointer-events:none;width:32px;height:32px;';
        document.body.append(gradient);
        const legacy = document.createElement('div');
        legacy.className = 'text-sm rounded-xl shadow-md font-black tracking-widest';
        legacy.setAttribute('aria-hidden', 'true');
        legacy.style.cssText = 'position:fixed;left:-9999px;pointer-events:none;width:32px;height:32px;';
        document.body.append(legacy);
        const specs = [
            ['primary', '--ds-base-primary', 'oklch(0.37 0.1 230)', primary, 'backgroundColor'],
            ['title-size', '--ds-type-page-title-size', '2.125rem', title, 'fontSize'],
            ['panel-radius', '--ds-base-radius-panel', '1.625rem', tile, 'borderTopLeftRadius'],
            ['card-shadow', '--ds-shadow-card', '0 0 0 6px rgba(13, 33, 56, 0.32)', tile, 'boxShadow'],
            ['body-font', '--ds-font-family-body', 'Georgia, serif', document.body, 'fontFamily'],
            ['highlight-gradient', '--ds-highlight-start', 'oklch(0.72 0.06 210)', gradient, 'backgroundImage'],
            ['legacy-text-size', '--ds-type-body-size', '1.125rem', legacy, 'fontSize'],
            ['legacy-radius', '--ds-base-radius-panel', '1.75rem', legacy, 'borderTopLeftRadius'],
            ['legacy-shadow', '--ds-shadow-card', '0 0 0 3px rgba(23, 43, 61, 0.4)', legacy, 'boxShadow'],
            ['legacy-weight', '--ds-type-heavy-weight', '650', legacy, 'fontWeight'],
            ['legacy-letter-spacing', '--ds-tracking-widest', '0.2em', legacy, 'letterSpacing'],
        ];
        const completed = [];
        try {
            for (const [name, token, value, node, property] of specs) {
                const element = node;
                const previous = root.style.getPropertyValue(token);
                const priority = root.style.getPropertyPriority(token);
                const transition = element.style.transition;
                const before = getComputedStyle(element)[property];
                element.style.transition = 'none';
                try {
                    root.style.setProperty(token, value);
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    const after = getComputedStyle(element)[property];
                    if (!before || !after || before === after) {
                        throw new Error('Central design token did not propagate: ' + name);
                    }
                    completed.push(name);
                } finally {
                    if (previous) root.style.setProperty(token, previous, priority);
                    else root.style.removeProperty(token);
                    element.style.transition = transition;
                }
            }
        } finally {
            gradient.remove();
            legacy.remove();
        }
        return completed;
    });
}

async function assertMobileNavigation(page, baseUrl) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(routeUrl(baseUrl, '/dashboard'), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });
    const openTranslate = await sidebar.evaluate((element) => getComputedStyle(element).translate);
    if (openTranslate !== '0px') throw new Error('Mobile menu did not open.');
    await page.getByRole('link', { name: 'Comercial' }).click();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await sidebar.waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Pipeline' }).click();
    await page.waitForURL((url) => url.pathname === '/pipeline', { timeout: 20_000 });
    const closedTranslate = await sidebar.evaluate((element) => getComputedStyle(element).translate);
    if (closedTranslate !== '-100%') throw new Error('Mobile menu did not close after navigation.');
}

async function runAxe(page, source) {
    // Inject axe once per authenticated page. Repeated script injection in the
    // same dynamically changing Radix dialog can invalidate internal virtual
    // trees; axe.reset() resets cached evaluation state without disabling rules.
    const loaded = await page.evaluate(() => Boolean(window.axe?.run && window.axe?.reset));
    if (!loaded) await page.addScriptTag({ content: source });
    const report = await page.evaluate(async () => {
        window.axe.reset();
        const result = await window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        });
        // Record only rule identifiers, node counts and limited computed CSS.
        // Never retain HTML, text, attributes, selectors, URLs or screenshots.
        const safeColor = (value) => {
            if (typeof value !== 'string' || value.length > 180) return 'unresolved';
            const clean = value.trim().toLowerCase();
            if (clean === 'transparent' || clean === 'currentcolor') return clean;
            if (/^#[a-f0-9]{3,8}$/.test(clean)) return clean;
            const format = /^(rgba?|hsla?|oklch|oklab|lab|lch|color)\(/.exec(clean)?.[1];
            if (!format) return 'unresolved';
            // Return numeric channels only; never raw strings, selectors or user data.
            const channels = (clean.match(/-?\d+(?:\.\d+)?%?/g) || []).slice(0, 6);
            return channels.length ? format + '(' + channels.join(',') + ')' : 'unresolved';
        };
        const safeCheck = (check) => {
            const id = /^[a-z][a-z0-9-]{0,70}$/.test(check.id || '') ? check.id : 'unknown-check';
            const message = typeof check.message === 'string' ? check.message.toLowerCase() : '';
            const reason = /background gradient/.test(message) ? 'gradient' :
                /background image/.test(message) ? 'background-image' :
                /overlap|obscur/.test(message) ? 'overlap' :
                /outside.*viewport/.test(message) ? 'outside-viewport' :
                /pseudo.element|pseudo element/.test(message) ? 'pseudo-element' :
                /parse.*color|color.*pars/.test(message) ? 'color-parse' :
                /transparen|alpha/.test(message) ? 'alpha' :
                /text.shadow/.test(message) ? 'text-shadow' :
                /1:1 contrast|equal.*ratio/.test(message) ? 'equal-ratio' :
                /short.*text/.test(message) ? 'short-text' :
                'undetermined';
            // axe-core's incomplete result has a structured messageKey.
            // Report only allowlisted categories and ARIA ATTRIBUTE NAMES,
            // never attribute values (which may contain a customer's title).
            const data = check.data;
            const messageKey = data && typeof data === 'object' &&
                typeof data.messageKey === 'string' &&
                ['noId', 'noIdShadow', 'ariaCurrent', 'idrefs', 'empty', 'controlsWithinPopup'].includes(data.messageKey)
                ? data.messageKey : 'unclassified';
            const needsReview = data && typeof data === 'object' && typeof data.needsReview === 'string'
                ? data.needsReview : '';
            const attributeName = /^aria-[a-z-]+/.exec(needsReview)?.[0] || 'unclassified';
            const safeAttributeName = [
                'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-controls',
                'aria-owns', 'aria-current', 'aria-hidden', 'aria-errormessage',
            ].includes(attributeName) ? attributeName : 'other-aria-attribute';
            return { id, reason, messageKey, attributeName: safeAttributeName,
                dataKind: Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data };
        };
        const staticTags = new Set([
            'html', 'body', 'main', 'header', 'nav', 'aside', 'section', 'article',
            'div', 'span', 'p', 'button', 'a', 'input', 'select', 'textarea',
            'label', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2', 'h3',
        ]);
        const inspect = (node) => {
            let element = null;
            try {
                const selector = Array.isArray(node.target) ? node.target[0] : null;
                if (typeof selector === 'string') element = document.querySelector(selector);
            } catch {
                // Complex shadow DOM targets are intentionally not serialized.
            }
            if (!element) return { resolved: false };
            const regions = new Set(['stats', 'chart', 'funnel', 'recent_deals', 'tasks', 'health', 'performers', 'ai_suggestions', 'ai_actions', 'deal-doctor', 'deal-risk', 'deal-actions', 'deal-dialog', 'deal-header', 'deal-tabs', 'deal-sidebar', 'deal-financial', 'goals-commissions']);
            const candidateRegion = element.closest('[data-qa-region]')?.getAttribute('data-qa-region');
            const region = regions.has(candidateRegion) ? candidateRegion : 'outside-widgets';
            // Persist only structural and numeric data. Never store HTML,
            // text, selectors, identifiers, customer data or URLs in reports.
            const box = element.getBoundingClientRect();
            const inViewport = box.width > 0 && box.height > 0 &&
                box.left < innerWidth && box.top < innerHeight &&
                box.right > 0 && box.bottom > 0;
            const centerX = inViewport ? Math.max(0, Math.min(innerWidth - 1, box.left + box.width / 2)) : -1;
            const centerY = inViewport ? Math.max(0, Math.min(innerHeight - 1, box.top + box.height / 2)) : -1;
            const hit = inViewport ? document.elementFromPoint(centerX, centerY) : null;
            const hitTest = !hit ? 'none' : hit === element || element.contains(hit) ? 'clear' :
                hit.contains(element) ? 'ancestor' : 'other';
            const pseudoPresent = (selector) => {
                const content = getComputedStyle(element, selector).content;
                return content !== 'none' && content !== 'normal' && content !== '';
            };
            const geometry = {
                inDialog: Boolean(element.closest('[role="dialog"]')),
                radixFocusGuard: element.hasAttribute('data-radix-focus-guard'),
                inAriaHidden: Boolean(element.closest('[aria-hidden="true"]')),
                inInert: Boolean(element.closest('[inert]')),
                tabIndex: Number.isInteger(element.tabIndex) ? element.tabIndex : -1,
                inViewport,
                bounds: inViewport ? [box.x, box.y, box.width, box.height].map(n => Math.round(n / 4) * 4) : [],
                hitTest,
                pseudoBefore: pseudoPresent('::before'),
                pseudoAfter: pseudoPresent('::after'),
            };
            const levels = [];
            let current = element;
            for (let depth = 0; current && depth < 10; depth += 1) {
                const style = getComputedStyle(current);
                const tag = current.tagName?.toLowerCase() || '';
                levels.push({
                    tag: staticTags.has(tag) ? tag : 'other',
                    color: safeColor(style.color),
                    background: safeColor(style.backgroundColor),
                    opacity: /^\d?(?:\.\d+)?$/.test(style.opacity) ? style.opacity : 'unresolved',
                    backgroundImage: style.backgroundImage !== 'none',
                    imageKind: /gradient\(/.test(style.backgroundImage) ? 'gradient' :
                        /url\(/.test(style.backgroundImage) ? 'image' : 'none',
                    backdropFilter: style.backdropFilter !== 'none',
                });
                current = current.parentElement;
            }
            return { resolved: true, region, isSvg: Boolean(element.closest('svg')), geometry, levels };
        };
        const sanitizeRule = (id) => /^[a-z][a-z0-9-]{0,70}$/.test(id || '')
            ? id : 'unknown-rule';
        const inspectViolation = (node) => {
            // Only boolean accessibility properties and allowlisted style categories.
            // Do NOT record text, attribute values, selectors, HTML or user data.
            let element = null;
            try {
                const selector = Array.isArray(node.target) ? node.target[0] : null;
                if (typeof selector === 'string') element = document.querySelector(selector);
            } catch {}
            if (!element) return { resolved: false };
            const style = getComputedStyle(element);
            const tag = element.tagName?.toLowerCase() || '';
            const candidateRegion = element.closest('[data-qa-region]')?.getAttribute('data-qa-region');
            const regions = new Set(['stats', 'chart', 'funnel', 'recent_deals', 'tasks', 'health', 'performers', 'ai_suggestions', 'ai_actions', 'deal-doctor', 'deal-risk', 'deal-actions', 'deal-dialog', 'deal-header', 'deal-tabs', 'deal-sidebar', 'deal-financial', 'goals-commissions']);
            return {
                resolved: true,
                tag: staticTags.has(tag) ? tag : 'other',
                region: regions.has(candidateRegion) ? candidateRegion : 'outside-widgets',
                hasAriaLabel: element.hasAttribute('aria-label'),
                hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
                hasExplicitLabel: Boolean(element.labels?.length),
                hasTitle: element.hasAttribute('title'),
                hasVisibleText: Boolean((element.innerText || '').trim()),
                hasSvgIcon: Boolean(element.querySelector('svg')),
                isSvg: Boolean(element.closest('svg')),
                // Quantized bounding box only; no names, content or selectors.
                bounds: (() => {
                    const rect = element.getBoundingClientRect();
                    return [rect.x, rect.y, rect.width, rect.height].map(n => Math.round(n / 4) * 4);
                })(),
                color: safeColor(style.color),
                background: safeColor(style.backgroundColor),
                hasBackgroundImage: style.backgroundImage !== 'none',
            };
        };
        return {
            incomplete: result.incomplete.slice(0, 6).map(({ id, nodes }) => ({
                rule: sanitizeRule(id),
                count: nodes?.length || 0,
                samples: (nodes || []).slice(0, 16).map((node) => ({
                    ...inspect(node),
                    checks: [...(node.any || []), ...(node.all || []), ...(node.none || [])]
                        .slice(0, 3).map(safeCheck),
                })),
            })),
            incompleteCount: result.incomplete.length,
            violations: result.violations.slice(0, 12).map(({ id, nodes }) => ({
                rule: sanitizeRule(id),
                count: nodes?.length || 0,
                samples: (nodes || []).slice(0, 5).map(inspectViolation),
            })),
            violationsCount: result.violations.length,
        };
    });
    return report;
}

async function assertOpportunityDialogKeyboard(page, opener) {
    const dialog = page.getByRole('dialog');
    const shell = page.locator('[data-slot="crm-dashboard-shell"]');
    if (!(await shell.evaluate(element => element.inert))) {
        throw new Error('Opportunity dialog background is not inert.');
    }
    await dialog.locator('button:not([disabled])').first().focus();
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(key);
        const isolated = await page.evaluate(() => {
            const active = document.activeElement;
            const dialog = document.querySelector('[role="dialog"]');
            return Boolean(active && dialog?.contains(active) && !active.closest('[aria-hidden="true"], [inert]'));
        });
        if (!isolated) throw new Error('Opportunity dialog leaked focus outside active modal.');
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    // Restoration happens on the frame following shell cleanup, so
    // wait for the actual focus state rather than racing the animation.
    const returnedToOpener = await opener.evaluate(element => new Promise(resolve => {
        let frames = 0;
        const check = () => {
            if (document.activeElement === element) return resolve(true);
            if (++frames > 60) return resolve(false);
            requestAnimationFrame(check);
        };
        check();
    }));
    if (!returnedToOpener) throw new Error('Opportunity dialog did not restore focus to opener.');
    if (await shell.evaluate(element => element.inert)) {
        throw new Error('Opportunity dialog left application shell inert after closing.');
    }
}

async function assertOpportunitySections(page, dialog, capture, artifactDir, screenshotPrefix, source) {
    // A secondary destination belongs to the labelled region selected by the
    // combobox, not to a Radix tabpanel whose trigger does not exist.
    const assertSecondaryRegion = async (slug, expectedLabel) => {
        const region = dialog.locator(`[data-qa-secondary-section="${slug}"]`);
        await region.waitFor({ state: 'visible', timeout: 7_000 });
        const valid = await region.evaluate((node, label) => {
            const danglingIdRef = [...node.querySelectorAll('[aria-labelledby]')]
                .some(child => (child.getAttribute('aria-labelledby') || '')
                    .trim().split(/\s+/).filter(Boolean)
                    .some(id => !document.getElementById(id)));
            return node.getAttribute('role') === 'region' &&
                node.getAttribute('aria-label') === label &&
                !node.hasAttribute('aria-labelledby') &&
                !node.closest('[role="tabpanel"]') &&
                !danglingIdRef;
        }, expectedLabel);
        if (!valid) throw new Error('Opportunity overflow section has invalid ARIA region semantics.');
    };
    const tabs = ['Resumo', 'Produtos', 'Propostas'];
    for (const label of tabs) {
        const tab = dialog.getByRole('tab', { name: label, exact: true });
        if (!(await tab.isVisible())) {
            throw new Error('A primary opportunity section is not visible on this viewport.');
        }
        await tab.click();
        if (await tab.getAttribute('data-state') !== 'active') {
            throw new Error('A primary opportunity section did not activate when selected.');
        }
    }
    const barOverflows = await dialog.locator('[data-qa-region="deal-tabs"]').evaluate(element =>
        element.scrollWidth > element.clientWidth + 1
    );
    if (barOverflows) throw new Error('Opportunity section navigation overflows the viewport.');

    const more = dialog.getByRole('combobox', { name: 'Outras seções da oportunidade' });
    await more.click();
    for (const label of ['Parceiros', 'Clientes', 'Documentos', 'Comunicações', 'Histórico']) {
        if (!(await page.getByRole('option', { name: label, exact: true }).isVisible())) {
            throw new Error('An existing opportunity section is not reachable from the overflow menu.');
        }
    }
    await page.getByRole('option', { name: 'Histórico', exact: true }).click();
    await assertSecondaryRegion('history', 'Histórico');
    await dialog.getByText('Atividades registradas', { exact: true }).first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    // A secondary destination cannot leave a misleading primary tab selected.
    const stalePrimary = await dialog.locator('[data-qa-region="deal-tabs"] [role="tab"]')
        .evaluateAll(nodes => nodes.some(node =>
            node.getAttribute('aria-selected') === 'true' ||
            node.getAttribute('data-section-selected') === 'true'
        ));
    if (stalePrimary) throw new Error('Opportunity navigation incorrectly highlights a primary tab in a secondary section.');
    // ARIA-only assertions missed a still-blue Propostas pill in real
    // screenshot evidence for 340e0113. Assert computed rendering too.
    const visuallySelectedPrimary = await dialog.locator('[data-qa-region="deal-tabs"] [role="tab"]')
        .evaluateAll(nodes => {
            const sample = document.createElement('span');
            sample.style.backgroundColor = 'var(--primary)';
            document.body.appendChild(sample);
            const primary = getComputedStyle(sample).backgroundColor;
            sample.remove();
            return nodes.some(node => getComputedStyle(node).backgroundColor === primary);
        });
    if (visuallySelectedPrimary) throw new Error('Opportunity navigation visually highlights a primary tab in a secondary section.');
    if (capture) {
        await page.screenshot({ path: resolve(artifactDir, screenshotPrefix + '-history.png'), fullPage: true });
    }
    // Navigate the actual nested partner and stakeholder panels without writes.
    for (const item of [
        { label: 'Parceiros', heading: 'Ecosistema de Parceiros', slug: 'partners' },
        { label: 'Clientes', heading: 'Clientes & Stakeholders', slug: 'stakeholders' },
    ]) {
        await more.click();
        await page.getByRole('option', { name: item.label, exact: true }).click();
        await assertSecondaryRegion(item.slug, item.label);
        await dialog.getByText(item.heading, { exact: false }).first()
            .waitFor({ state: 'visible', timeout: 7_000 });
        await page.waitForTimeout(500);
        await assertLayout(page);
        const audit = await runAxe(page, source);
        if (audit.violationsCount || audit.incompleteCount) {
            // Sanitized axe data: allowlisted rule names and computed styles only.
            // Describe ONLY the structure of dialog ARIA IDREF wiring; never
            // print element IDs, text, selectors, URLs or customer records.
            const dialogAria = await dialog.evaluate(element => {
                const attrNames = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];
                const references = attrNames.flatMap(name => {
                    const present = (element.getAttribute(name) || '').trim();
                    return present ? [{
                        attribute: name,
                        numberOfReferences: present.split(/\s+/).length,
                        allTargetsExist: present.split(/\s+/).every(id => Boolean(document.getElementById(id))),
                    }] : [];
                });
                const title = element.querySelector('[data-slot="dialog-title"]');
                const description = element.querySelector('[data-slot="dialog-description"]');
                const ariaAttributeNames = Array.from(element.attributes)
                    .map(attribute => attribute.name)
                    .filter(name => /^aria-[a-z-]+$/.test(name))
                    .sort();
                // Names and booleans only: no ARIA attribute values or deal data.
                return { references, hasTitle: Boolean(title),
                    hasDescription: Boolean(description),
                    hasDirectAccessibleName: Boolean(element.getAttribute('aria-label')?.trim()),
                    ariaAttributeNames };

            });
            // Read-only, fail-closed diagnostic. Compare axe's rule behavior
            // for the actual name and a neutral literal. Restore the DOM
            // immediately; the ORIGINAL full audit still fails unchanged.
            const ariaProbe = await page.evaluate(async () => {
                const root = document.querySelector('[data-qa-region="deal-dialog"]');
                if (!root || !window.axe) return { available: false };
                const original = root.getAttribute('aria-label');
                const results = [];
                try {
                    for (const label of ['original', 'neutral-test-label']) {
                        if (label === 'neutral-test-label') {
                            root.setAttribute('aria-label', 'Detalhes da oportunidade');
                        }
                        const report = await window.axe.run(root, {
                            runOnly: { type: 'rule', values: ['aria-valid-attr-value'] },
                        });
                        const first = report.incomplete.find(entry => entry.id === 'aria-valid-attr-value');
                        const firstCheck = first?.nodes?.[0]?.all?.[0] || null;
                        const data = firstCheck?.data;
                        const messageKey = data && typeof data === 'object' &&
                            typeof data.messageKey === 'string' &&
                            ['noId', 'noIdShadow', 'ariaCurrent', 'idrefs', 'empty', 'controlsWithinPopup'].includes(data.messageKey)
                            ? data.messageKey : 'unclassified';
                        // Axe targets can be multi-segment paths into shadow DOM
                        // or frames. Treating target[0] as the final element may
                        // falsely attribute a child failure to DialogContent.
                        // Resolve the path IN MEMORY and report structure only.
                        const node = first?.nodes?.[0] || null;
                        const target = node?.target || [];
                        const resolveTarget = () => {
                            let tree = document;
                            let found = null;
                            for (let outer = 0; outer < target.length; outer += 1) {
                                const segment = target[outer];
                                const selectors = Array.isArray(segment) ? segment : [segment];
                                for (let idx = 0; idx < selectors.length; idx += 1) {
                                    if (!tree || typeof selectors[idx] !== 'string') return null;
                                    try { found = tree.querySelector(selectors[idx]); }
                                    catch { return null; }
                                    if (!found) return null;
                                    if (idx < selectors.length - 1) tree = found.shadowRoot;
                                }
                                if (outer < target.length - 1) tree = found.contentDocument;
                            }
                            return found;
                        };
                        const actual = resolveTarget();
                        const relevantAria = ['aria-label', 'aria-labelledby', 'aria-describedby',
                            'aria-controls', 'aria-owns', 'aria-errormessage'];
                        const ariaAttributes = actual ? relevantAria.filter(name => actual.hasAttribute(name)) : [];
                        const checkText = typeof data?.needsReview === 'string' ? data.needsReview : '';
                        // Parse ONLY in memory. NEVER log any ID, raw attribute value,
                        // HTML, CSS selector, customer title or personal information.
                        const referenceMatch = /^aria-([a-z-]+)="([^"]*)"\s*$/.exec(checkText);
                        const ids = referenceMatch ? referenceMatch[2].trim().split(/\s+/).filter(Boolean) : [];
                        const treeRoot = actual?.getRootNode?.();
                        const sourceAttribute = referenceMatch ? 'aria-' + referenceMatch[1] : 'other';
                        const targetInfo = {
                            targetLayers: Array.isArray(target) ? target.length : 0,
                            nestedSelectorLayers: Array.isArray(target)
                                ? target.filter(Array.isArray).map(part => part.length) : [],
                            actualResolved: Boolean(actual),
                            actualTag: actual && ['div','button','span','input','select','textarea',
                                'section','dialog','a','p','svg'].includes(actual.localName)
                                ? actual.localName : 'other',
                            isDialogContent: actual === root,
                            insideDialog: Boolean(actual && root.contains(actual)),
                            insideShadowRoot: Boolean(treeRoot && treeRoot !== document),
                            ariaAttributes,
                            htmlHadLabelledby: Boolean(node?.html && /\baria-labelledby\s*=/.test(node.html)),
                            referencedAttribute: relevantAria.includes(sourceAttribute) ? sourceAttribute : 'other',
                            referenceCount: ids.length,
                            referencesPresentInDocument: ids.map(id => Boolean(document.getElementById(id))),
                            referencesInOwnTree: ids.map(id => Boolean(treeRoot?.getElementById?.(id))),
                            currentAttributeMatchesCheck: Boolean(actual &&
                                sourceAttribute !== 'other' && actual.getAttribute(sourceAttribute) ===
                                    (referenceMatch ? referenceMatch[2] : null)),
                        };
                        results.push({ label, incomplete: report.incomplete.length,
                            violations: report.violations.length, passed: report.passes.length,
                            messageKey, targetInfo });
                    }
                } catch {
                    results.push({ label: 'probe-exception', incomplete: null,
                        violations: null, passed: null, messageKey: 'unclassified' });
                } finally {
                    if (original === null) root.removeAttribute('aria-label');
                    else root.setAttribute('aria-label', original);
                }
                return { available: true, results, axeVersion: window.axe.version };
            });
            // The engine reported noIdShadow on an absent aria-labelledby.
            // Inspect only attribute NAMES and IDREF presence/counts so the
            // failure can be distinguished from stale axe virtual-node state.
            const idrefProbe = await dialog.evaluate(root => {
                const ariaNames = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];
                const refs = ariaNames.map(name => {
                    const value = root.getAttribute(name);
                    const parts = value ? value.trim().split(/\s+/).filter(Boolean) : [];
                    return { name, present: value !== null, count: parts.length,
                        allInSameTree: parts.every(id => root.getRootNode().getElementById?.(id) !== null),
                        duplicateIds: parts.some(id => document.querySelectorAll('[id]').length > 0 &&
                            Array.from(document.querySelectorAll('[id]')).filter(el => el.id === id).length > 1) };
                });
                const aom = root.ariaLabelledByElements;
                return { refs, aomSupported: aom !== undefined,
                    aomCount: Array.isArray(aom) ? aom.length : null };
            });
            process.stderr.write('CRM_B4_COMMERCIAL_A11Y_DIAGNOSTIC=' +
                JSON.stringify({ state: item.slug, violations: audit.violations,
                    incomplete: audit.incomplete, dialogAria, ariaProbe, idrefProbe }) + '\n');
            throw new Error('COMMERCIAL_FAMILY_ACCESSIBILITY_FAILED: ' + item.slug);
        }
        if (capture) {
            await page.screenshot({
                path: resolve(artifactDir, screenshotPrefix + '-' + item.slug + '.png'),
                fullPage: true,
            });
        }
    }
    // Exercise the remaining secondary destinations without changing records.
    for (const item of [
        { label: 'Documentos', slug: 'documents' },
        { label: 'Comunicações', slug: 'omnichannel' },
    ]) {
        await more.click();
        await page.getByRole('option', { name: item.label, exact: true }).click();
        await assertSecondaryRegion(item.slug, item.label);
    }
    const summary = dialog.getByRole('tab', { name: 'Resumo', exact: true });
    await summary.click();
    await dialog.getByText('Detalhes da oportunidade', { exact: true }).first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    if (await summary.getAttribute('aria-selected') !== 'true') {
        throw new Error('Opportunity summary tab was not selected after returning from History.');
    }
}

// Every migrated Goals family must be exercised in the REAL authenticated CRM
// on both viewport sizes and themes, not only captured on its default tab.
// This helper is read-only: it never creates a campaign, pays a commission,
// updates a goal or persists a planning scenario.
async function assertGoalsFamilyStates(page, source, capture, artifactDir, screenshotPrefix) {
    const states = [
        { name: 'Regras de Comissão', landmark: 'Selecione o Usuário', slug: 'commissions' },
        { name: 'Gestão de Campanhas', landmark: 'Nova Campanha', slug: 'campaigns' },
        { name: 'Planejamento Financeiro', landmark: 'Metas e Sazonalidade', slug: 'planning' },
        { name: 'Extrato de Comissões', landmark: null, slug: 'statement' },
    ];
    let checked = 0;
    const goalsA11yFailures = [];
    const audit = async (state) => {
        await assertLayout(page);
        const report = await runAxe(page, source);
        if (report.violationsCount || report.incompleteCount) {
            // Existing runAxe output contains ONLY allowlisted rule IDs,
            // tag names, booleans and sanitized numeric computed styles.
            // Never print axe raw targets, text, HTML, URLs or user data.
            process.stderr.write('CRM_B4_GOALS_A11Y_DIAGNOSTIC=' + JSON.stringify({
                state,
                violations: report.violations,
                incomplete: report.incomplete,
            }) + '\n');
            goalsA11yFailures.push(state);
        }
        if (capture) {
            await page.screenshot({
                path: resolve(artifactDir, screenshotPrefix + '-' + state + '.png'),
                fullPage: true,
            });
        }
        checked += 1;
    };
    for (const state of states) {
        const trigger = page.getByRole('tab', { name: state.name, exact: true });
        await trigger.click();
        if (await trigger.getAttribute('aria-selected') !== 'true') {
            throw new Error('GOALS_FAMILY_TAB_NOT_SELECTED: ' + state.slug);
        }
        if (state.landmark) {
            await page.getByText(state.landmark, { exact: false }).first()
                .waitFor({ state: 'visible', timeout: 10_000 });
        } else {
            await page.getByRole('table').first().waitFor({ state: 'visible', timeout: 10_000 });
        }
        // Wait for the real Radix tab and nested panel fade transitions to settle.
        // Axe still checks the final rendered styles and rejects every real defect.
        await page.waitForTimeout(800);
        await page.evaluate(() => document.fonts.ready);
        await audit(state.slug);
        if (state.slug === 'planning') {
            await page.getByRole('button', { name: 'Curva de Sazonalidade', exact: true }).click();
            await page.getByText('Distribuição Sazonal (Ano)', { exact: false }).first()
                .waitFor({ state: 'visible', timeout: 10_000 });
            await page.locator('.recharts-bar-rectangle path').first().waitFor({
                state: 'attached', timeout: 10_000,
            });
            const correctlyThemedBar = await page.evaluate(() => {
                const bar = document.querySelector('.recharts-bar-rectangle path');
                if (!bar) return false;
                const sample = document.createElement('span');
                sample.style.color = 'var(--primary)';
                document.body.appendChild(sample);
                const expected = getComputedStyle(sample).color;
                sample.remove();
                return getComputedStyle(bar).fill === expected;
            });
            if (!correctlyThemedBar) {
                throw new Error('GOALS_CHART_COLOR_NOT_PROPAGATED: chart fill must use current primary token');
            }
            await page.waitForTimeout(500);
            await audit('seasonality');
        }
    }
    if (goalsA11yFailures.length) {
        throw new Error('GOALS_FAMILY_ACCESSIBILITY_FAILED: ' + goalsA11yFailures.join(', '));
    }
    return checked;
}

async function login(page, baseUrl, account, options = {}) {
    await page.goto(routeUrl(baseUrl, '/login'), { waitUntil: 'networkidle' });
    // Before entering any credentials, prove the REAL unauthenticated Next.js
    // login screen in both themes/viewport sizes. Captures contain no email,
    // password or personally identifying values. Test-only classes are restored.
    if (options.inspectLogin) {
        const originalViewport = page.viewportSize();
        const originalDark = await page.locator('html').evaluate(node => node.classList.contains('dark'));
        try {
            for (const viewport of viewports) {
                await page.setViewportSize(viewport);
                for (const theme of ['light', 'dark']) {
                    await page.locator('html').evaluate((node, dark) => node.classList.toggle('dark', dark), theme === 'dark');
                    // Let global light/dark color transitions finish so axe
                    // audits stable computed colors, not animation midpoints.
                    await page.waitForTimeout(750);
                    await page.getByRole('button', { name: 'Entrar no Sistema' }).waitFor({ state: 'visible' });
                    // The login page intentionally has no dashboard navigation.
                    // Its own layout gate checks clipping without requiring CRM shell.
                    const overflow = await page.evaluate(() =>
                        document.documentElement.scrollWidth > window.innerWidth + 1);
                    const audit = await runAxe(page, options.source);
                    if (overflow || audit.violationsCount || audit.incompleteCount) {
                        // Keep the strict fail-closed result, but still audit the
                        // complete 22-route matrix instead of stopping after login.
                        a11yFailureCount += 1;
                        a11yFailedRoutes.add('/login');
                        const finding = {
                            profileIndex: 0, route: '/login',
                            viewport: viewport.name, theme, layoutOverflow: overflow,
                            violations: audit.violations, incomplete: audit.incomplete,
                        };
                        if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                            results.failures.push(finding);
                            process.stderr.write('CRM_B4_LOGIN_A11Y_DIAGNOSTIC=' +
                                JSON.stringify(finding) + '\n');
                        }
                    }
                    if (options.capture) {
                        await page.screenshot({ path: resolve(options.artifactDir,
                            `login-${viewport.name}-${theme}.png`), fullPage: true });
                    }
                }
            }
        } finally {
            await page.locator('html').evaluate((node, dark) => node.classList.toggle('dark', dark), originalDark);
            if (originalViewport) await page.setViewportSize(originalViewport);
        }
    }
    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(account.password);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

const results = { version: 2, profiles: [], failures: [] };
const MAX_A11Y_DIAGNOSTICS = 32;
let a11yFailureCount = 0;
const a11yFailedRoutes = new Set();
let browser;
try {
    // This reads the checked-out candidate, not GitHub's PR merge SHA. The
    // workflow explicitly checks out the head SHA before this runner starts.
    const candidateSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (!/^[a-f0-9]{40}$/i.test(candidateSha)) throw new Error('Could not determine the checked-out candidate SHA.');
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
    for (const [profileIndex, account] of accounts.entries()) {
        const context = await browser.newContext();
        // Bypass only the Vercel deployment's outer SSO layer, never CRM Auth.
        // A cross-origin request (e.g. to Supabase) must NEVER receive the secret.
        if (!local) {
            const bypass = process.env.CRM_B4_PROTECTION_BYPASS;
            if (!/^[a-f0-9]{32}$/.test(bypass || '')) {
                throw new Error('Protected QA deployment requires ephemeral Vercel SSO authorization.');
            }
            await context.route('**/*', async (route) => {
                const requestedUrl = new URL(route.request().url());
                if (requestedUrl.origin !== baseUrl.origin) {
                    await route.continue();
                    return;
                }
                await route.continue({
                    headers: {
                        ...route.request().headers(),
                        'x-vercel-protection-bypass': bypass,
                    },
                });
            });
        }
        const page = await context.newPage();
        await login(page, baseUrl, account, { inspectLogin: local && profileIndex === 0, source, capture, artifactDir });
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
                    await setTheme(page, theme,
                        local && profileIndex === 0 && route === '/leads' && viewport.name === 'desktop');
                    if (local && profileIndex === 0 &&
                        ['/leads', '/contacts', '/activities'].includes(route)) {
                        const propagated = await assertDesignTokenPropagation(page);
                        if (propagated.length !== 11) {
                            throw new Error('Design-system propagation matrix is incomplete.');
                        }
                        profileResult.checks.push({
                            route, viewport: viewport.name, theme,
                            state: 'design-token-propagation',
                            primitiveCount: propagated.length, status: 'passed',
                        });
                    }
                    // The original pre-QA could report green even if a route
                    // rendered an empty product catalog. Local QA must prove
                    // that the actual seeded tenant data reached the Next.js page.
                    if (local && route === '/products') {
                        const expectedSku = profileIndex === 3 ? 'QA-ISOLATED-003' : 'QA-SRV-001';
                        try {
                            await page.getByText(expectedSku, { exact: true }).first().waitFor({
                                state: 'visible', timeout: 12_000,
                            });
                        } catch {
                            throw new Error('LOCAL_QA_FIXTURE_NOT_RENDERED: products; profile=' + profileIndex);
                        }
                    }
                    if (local && route === '/automations' && profileIndex === 0) {
                        try {
                            await page.getByText('Fluxo Inativo de Demonstração', { exact: true }).first()
                                .waitFor({ state: 'visible', timeout: 12_000 });
                        } catch {
                            throw new Error('LOCAL_QA_FIXTURE_NOT_RENDERED: automations');
                        }
                    }
                    await assertLayout(page);
                    if (route === '/dashboard') await assertDashboardDragHandles(page, viewport.name);
                    await assertKeyboardFocus(page);
                    const axeReport = await runAxe(page, source);
                    const issues = axeReport.incompleteCount + axeReport.violationsCount;
                    if (issues) {
                        a11yFailureCount += 1;
                        a11yFailedRoutes.add(route);
                        // Continue the full approved profile/viewport/theme matrix on
                        // failure. The previous diagnostic shortcut hid later defects
                        // and required another human approval for each newly found issue.
                        // Bound stored diagnostics to avoid leaking excess QA metadata.
                        if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                            const finding = {
                                profileIndex, route, viewport: viewport.name, theme,
                                incompleteCount: axeReport.incompleteCount,
                                violationsCount: axeReport.violationsCount,
                                incomplete: axeReport.incomplete,
                                violations: axeReport.violations,
                            };
                            results.failures.push(finding);
                            // Only bounded allowlisted regions, tags and numeric CSS.
                            // Never record user data, HTML, selectors, URLs or secrets.
                            process.stderr.write('CRM_B4_A11Y_DIAGNOSTIC=' + JSON.stringify({
                                ...finding,
                                incomplete: finding.incomplete.map((rule) => ({
                                    ...rule, samples: rule.samples.slice(0, 4),
                                })),
                                violations: finding.violations.map((rule) => ({
                                    ...rule, samples: rule.samples.slice(0, 4),
                                })),
                            }) + '\n');
                        }
                    }
                    if (capture) await page.screenshot({ path: resolve(artifactDir, `${account.label}-${route.slice(1).replaceAll('/', '-') || 'root'}-${viewport.name}-${theme}.png`), fullPage: true });
                    profileResult.checks.push({ route, viewport: viewport.name, theme, axeStatus: issues ? 'failed' : 'passed' });
                    // Real read-only interaction proof for the automation workspace.
                    // Do not submit, toggle, delete, duplicate or execute any workflow.
                    if (local && profileIndex === 0 && route === '/automations') {
                        const savedFlow = page.getByText('Fluxo Inativo de Demonstração', { exact: true }).first();
                        const draft = page.getByRole('textbox', { name: 'Descrever automação' });
                        const search = page.getByRole('textbox', { name: 'Buscar fluxos de trabalho' });
                        const filters = page.getByRole('group', { name: 'Filtrar fluxos por status' });
                        await draft.fill('Enviar e-mail de acompanhamento');
                        await savedFlow.waitFor({ state: 'visible' });
                        await draft.clear();
                        await search.fill('qa-sem-correspondencia-987');
                        await savedFlow.waitFor({ state: 'hidden' });
                        await search.clear();
                        await savedFlow.waitFor({ state: 'visible' });
                        await filters.getByRole('button', { name: 'Ativos', exact: true }).click();
                        await savedFlow.waitFor({ state: 'hidden' });
                        await filters.getByRole('button', { name: 'Pausados', exact: true }).click();
                        await savedFlow.waitFor({ state: 'visible' });
                        await filters.getByRole('button', { name: 'Todos', exact: true }).click();
                        const library = page.getByRole('region', { name: 'Biblioteca de receitas' });
                        if (await library.getByRole('button', { name: /^Usar modelo / }).count() !== 6) {
                            throw new Error('AUTOMATION_LIBRARY_INCOMPLETE');
                        }
                        await page.getByRole('link', { name: 'Ver modelos' }).click();
                        const fitsHorizontally = await library.evaluate(node => {
                            const bounds = node.getBoundingClientRect();
                            return node.scrollWidth <= node.clientWidth + 1 &&
                                [...node.querySelectorAll('button')].every(button => {
                                    const rect = button.getBoundingClientRect();
                                    return rect.width > 0 && rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
                                });
                        });
                        if (!fitsHorizontally) throw new Error('AUTOMATION_LIBRARY_HORIZONTAL_CLIPPING');
                        if (capture) await page.screenshot({
                            path: resolve(artifactDir, account.label + '-automations-library-' + viewport.name + '-' + theme + '.png'),
                            fullPage: true,
                        });
                        const recipe = library.getByRole('button', { name: 'Usar modelo Notificar VIP', exact: true });
                        await recipe.click();
                        const editor = page.getByRole('dialog', { name: 'Novo Fluxo de Trabalho' });
                        await editor.waitFor({ state: 'visible', timeout: 8000 });
                        if (await editor.getByRole('textbox', { name: 'Nome da automação' }).inputValue() !== 'Notificar VIP') {
                            throw new Error('AUTOMATION_RECIPE_PREFILL_FAILED');
                        }
                        for (let step = 1; step <= 3; step++) {
                            if (step > 1) await editor.getByRole('button', { name: 'Próximo', exact: true }).click();
                            if (step === 2 && await editor.getByRole('button', { name: /Oportunidade Criada/ }).getAttribute('aria-pressed') !== 'true') {
                                throw new Error('AUTOMATION_RECIPE_TRIGGER_LOST');
                            }
                            if (step === 3) {
                                if (await editor.getByRole('button', { name: 'Notificação Push', exact: true }).getAttribute('aria-pressed') !== 'true') {
                                    throw new Error('AUTOMATION_RECIPE_ACTION_LOST');
                                }
                                await editor.getByRole('button', { name: 'Adicionar ação', exact: true }).click();
                                await editor.getByRole('button', { name: 'Remover ação 2' }).click();
                            }
                            await page.waitForTimeout(300);
                            const fits = await editor.evaluate(node => {
                                const box = node.getBoundingClientRect();
                                const button = [...node.querySelectorAll('button')].at(-1)?.getBoundingClientRect();
                                return box.left >= -1 && box.right <= innerWidth + 1 &&
                                    box.top >= -1 && box.bottom <= innerHeight + 1 &&
                                    !!button && button.top >= box.top - 1 && button.bottom <= box.bottom + 1;
                            });
                            if (!fits) throw new Error('AUTOMATION_EDITOR_CLIPPING: step ' + step);
                            const editorAxe = await runAxe(page, source);
                            const editorIssues = editorAxe.violationsCount + editorAxe.incompleteCount;
                            if (editorIssues) {
                                a11yFailureCount += 1;
                                a11yFailedRoutes.add('/automations?editor-step=' + step);
                                const finding = { profileIndex, route, state: 'automation-editor-' + step,
                                    viewport: viewport.name, theme, violations: editorAxe.violations, incomplete: editorAxe.incomplete };
                                if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                                    results.failures.push(finding);
                                    process.stderr.write('CRM_AUTOMATION_EDITOR_DIAGNOSTIC=' + JSON.stringify(finding) + '\n');
                                }
                            }
                            if (capture) await page.screenshot({
                                path: resolve(artifactDir, account.label + '-automations-editor-step-' + step + '-' + viewport.name + '-' + theme + '.png'),
                                fullPage: true,
                            });
                            profileResult.checks.push({ route, state: 'automation-editor-' + step, viewport: viewport.name, theme,
                                status: editorIssues ? 'failed' : 'passed' });
                        }
                        await page.keyboard.press('Tab');
                        if (!await editor.evaluate(node => node.contains(document.activeElement))) {
                            throw new Error('AUTOMATION_EDITOR_FOCUS_LEAK');
                        }
                        await page.keyboard.press('Escape');
                        await editor.waitFor({ state: 'hidden', timeout: 8000 });
                        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Usar modelo Notificar VIP');
                        await savedFlow.waitFor({ state: 'visible' });
                        profileResult.checks.push({ route, state: 'automation-library-filter-cancel', viewport: viewport.name, theme, status: 'passed' });
                        // Confirm the recorded counters, not a fabricated event timeline.
                        const historyButton = page.getByRole('button', { name: 'Ver execuções' }).first();
                        await historyButton.click();
                        const historyDialog = page.getByRole('dialog', { name: 'Execuções de automação' });
                        await historyDialog.waitFor({ state: 'visible', timeout: 8000 });
                        await historyDialog.getByText('Histórico detalhado indisponível', { exact: true }).waitFor({ state: 'visible' });
                        if (await historyDialog.getByText(/cliente@email\.com|TIMEOUT|Configurar Notificações de Erro/).count()) {
                            throw new Error('AUTOMATION_HISTORY_CONTAINS_SIMULATED_EVENTS');
                        }
                        await page.waitForTimeout(350);
                        const historyAxe = await runAxe(page, source);
                        const historyIssues = historyAxe.violationsCount + historyAxe.incompleteCount;
                        if (historyIssues) {
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/automations?history');
                            const finding = { profileIndex, route, state: 'automation-history',
                                viewport: viewport.name, theme, violations: historyAxe.violations, incomplete: historyAxe.incomplete };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                                results.failures.push(finding);
                                process.stderr.write('CRM_AUTOMATION_HISTORY_DIAGNOSTIC=' + JSON.stringify(finding) + '\n');
                            }
                        }
                        if (capture) await page.screenshot({
                            path: resolve(artifactDir, account.label + '-automations-history-' + viewport.name + '-' + theme + '.png'),
                            fullPage: true,
                        });
                        await page.keyboard.press('Escape');
                        await historyDialog.waitFor({ state: 'hidden', timeout: 8000 });
                        await page.waitForFunction(() => document.activeElement?.textContent?.includes('Ver execuções'));
                        profileResult.checks.push({ route, state: 'automation-history', viewport: viewport.name, theme,
                            status: historyIssues ? 'failed' : 'passed' });
                    }
                    // Verify that the actual global search control is an action,
                    // not a fake input. No search is submitted or data changed here.
                    if (local && profileIndex === 0 && route === '/dashboard') {
                        await page.getByRole('button', { name: 'Buscar no CRM' }).first().click();
                        const commandDialog = page.getByRole('dialog', { name: 'Pesquisa e comandos do CRM' });
                        await commandDialog.waitFor({ state: 'visible', timeout: 8_000 });
                        // Radix takes 200ms to enter. Test the settled visual,
                        // with the real background focus trap active.
                        await page.waitForTimeout(450);
                        const commandAxe = await runAxe(page, source);
                        const commandIssues = commandAxe.violationsCount + commandAxe.incompleteCount;
                        if (commandIssues) {
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/dashboard?global-search');
                            const finding = {
                                profileIndex, route: '/dashboard', state: 'global-search',
                                viewport: viewport.name, theme,
                                violations: commandAxe.violations, incomplete: commandAxe.incomplete,
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                                results.failures.push(finding);
                                process.stderr.write('CRM_B4_COMMAND_DIALOG_DIAGNOSTIC=' +
                                    JSON.stringify(finding) + '\n');
                            }
                        }
                        if (capture) {
                            await page.screenshot({
                                path: resolve(artifactDir,
                                    `${account.label}-dashboard-command-search-${viewport.name}-${theme}.png`),
                                fullPage: true,
                            });
                        }
                        await page.keyboard.press('Escape');
                        await commandDialog.waitFor({ state: 'hidden', timeout: 7_000 });
                        // The global Ctrl+K shortcut must reopen the same control.
                        await page.keyboard.press('Control+k');
                        await commandDialog.waitFor({ state: 'visible', timeout: 7_000 });
                        await page.keyboard.press('Escape');
                        await commandDialog.waitFor({ state: 'hidden', timeout: 7_000 });
                        profileResult.checks.push({
                            route, state: 'global-search', viewport: viewport.name, theme,
                            status: commandIssues ? 'failed' : 'passed',
                        });
                    }
                    // The actual Dashboard header mounts the Watson AI drawer.
                    // Exercise open/close and axe in the real isolated CRM without
                    // submitting prompts or calling any external AI provider.
                    if (local && profileIndex === 0 && route === '/dashboard') {
                        await page.getByRole('button', { name: 'Watson AI' }).first().click();
                        const assistantDialog = page.getByRole('dialog', { name: 'Watson AI' });
                        await assistantDialog.waitFor({ state: 'visible', timeout: 8_000 });
                        const assistantAxe = await runAxe(page, source);
                        const assistantIssues = assistantAxe.violationsCount + assistantAxe.incompleteCount;
                        if (assistantIssues) {
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/dashboard?assistant');
                            const finding = {
                                profileIndex, route: '/dashboard', state: 'ai-drawer',
                                viewport: viewport.name, theme,
                                violations: assistantAxe.violations, incomplete: assistantAxe.incomplete,
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                                results.failures.push(finding);
                                process.stderr.write('CRM_B4_ASSISTANT_DRAWER_DIAGNOSTIC=' +
                                    JSON.stringify(finding) + '\n');
                            }
                        }
                        if (capture) {
                            await page.screenshot({
                                path: resolve(artifactDir,
                                    `${account.label}-dashboard-ai-drawer-${viewport.name}-${theme}.png`),
                                fullPage: true,
                            });
                        }
                        // Escape must dismiss and restore focus to the opener.
                        await page.keyboard.press('Escape');
                        await assistantDialog.waitFor({ state: 'hidden', timeout: 7_000 });
                        const focusRestored = await page.evaluate(() =>
                            document.activeElement?.getAttribute('title') === 'Watson AI');
                        if (!focusRestored) {
                            throw new Error('AI_DRAWER_FOCUS_RESTORE_FAILED: trigger did not regain focus.');
                        }
                        await page.getByRole('button', { name: 'Watson AI' }).first().click();
                        await assistantDialog.waitFor({ state: 'visible', timeout: 7_000 });
                        await page.getByRole('button', { name: 'Fechar Watson AI' }).click();
                        await assistantDialog.waitFor({ state: 'hidden', timeout: 7_000 });
                        profileResult.checks.push({
                            route, state: 'ai-drawer', viewport: viewport.name, theme,
                            status: assistantIssues ? 'failed' : 'passed',
                        });
                    }
                    // Exercise real migrated lead/contact/customer creation dialogs
                    // without submitting or changing the synthetic QA database.
                    // A static source test cannot see focus, scrollbar clipping
                    // or color contrast inside an actual Radix modal.
                    if (local && profileIndex === 0 && [
                        '/customers', '/contacts', '/leads',
                    ].includes(route)) {
                        const createLabel = {
                            '/customers': 'Novo Cadastro',
                            '/contacts': 'Novo Contato',
                            '/leads': 'Novo Lead',
                        }[route];
                        await page.getByRole('button', { name: createLabel, exact: true }).first().click();
                        const formDialog = page.getByRole('dialog').first();
                        await formDialog.waitFor({ state: 'visible', timeout: 8_000 });
                        // Measure settled styling after Radix's 200ms open animation.
                        // Do not suppress any real axe failure or incomplete check.
                        await page.waitForTimeout(450);
                        const dialogLayout = await formDialog.evaluate(node => {
                            const box = node.getBoundingClientRect();
                            return box.width > 0 && box.height > 0 &&
                                box.left >= -1 && box.right <= window.innerWidth + 1;
                        });
                        const submitLabel = {
                            '/customers': 'Cadastrar Empresa',
                            '/contacts': 'Cadastrar Contato',
                            '/leads': 'Cadastrar Lead',
                        }[route];
                        const submitVisible = await formDialog.getByRole('button', { name: submitLabel })
                            .evaluate(button => {
                                const box = button.getBoundingClientRect();
                                const dialog = button.closest('[role="dialog"]');
                                const frame = dialog?.getBoundingClientRect();
                                return !!frame && box.width > 0 && box.height > 0 &&
                                    box.left >= frame.left - 1 && box.right <= frame.right + 1 &&
                                    box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1 &&
                                    box.bottom <= window.innerHeight + 1;
                            });
                        const modalAudit = await runAxe(page, source);
                        const modalIssues = modalAudit.violationsCount + modalAudit.incompleteCount;
                        if (!dialogLayout || !submitVisible || modalIssues) {
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add(route + '?create');
                            const finding = {
                                profileIndex, route, state: 'create-dialog',
                                viewport: viewport.name, theme, dialogFitsViewport: dialogLayout,
                                submitActionVisible: submitVisible,
                                violations: modalAudit.violations, incomplete: modalAudit.incomplete,
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) {
                                results.failures.push(finding);
                                process.stderr.write('CRM_B4_CREATE_DIALOG_DIAGNOSTIC=' +
                                    JSON.stringify(finding) + '\n');
                            }
                        }
                        if (capture) {
                            await page.screenshot({
                                path: resolve(artifactDir,
                                    `${account.label}-${route.slice(1)}-create-${viewport.name}-${theme}.png`),
                                fullPage: true,
                            });
                        }
                        await page.keyboard.press('Escape');
                        await formDialog.waitFor({ state: 'hidden', timeout: 7_000 });
                        profileResult.checks.push({
                            route, state: 'create-dialog', viewport: viewport.name, theme,
                            status: dialogLayout && submitVisible && !modalIssues ? 'passed' : 'failed',
                        });
                    }
                    // Source-level component tests cannot certify the four Goals
                    // tabs or the Recharts theme colors. Exercise actual UI
                    // transitions with local synthetic data on the SAME SHA.
                    if (local && profileIndex === 0 && route === '/goals') {
                        const states = await assertGoalsFamilyStates(
                            page, source, capture, artifactDir,
                            `${account.label}-goals-family-${viewport.name}-${theme}`,
                        );
                        profileResult.checks.push({
                            route: '/goals', state: 'goals-family-sections',
                            viewport: viewport.name, theme, checkedStates: states, status: 'passed',
                        });
                    }

                    // The board screenshot alone cannot prove the focused opportunity
                    // inspector. Capture one read-only drawer state from the synthetic
                    // admin fixture without changing stage, products, or any deal data.
                    if (capture && local && profileIndex === 0 && route === '/pipeline') {
                        // Verify compiled Tailwind stage role classes match central CSS tokens.
                        const stageTokensRendered = await page.evaluate(() => {
                            const columns = Array.from(document.querySelectorAll('[data-qa-stage]'));
                            if (columns.length !== 5) return false;
                            return columns.every(column => {
                                const stage = column.getAttribute('data-qa-stage');
                                if (!['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) return false;
                                const dot = column.querySelector('[data-qa-stage-dot]');
                                if (!dot) return false;
                                const sample = document.createElement('span');
                                sample.style.backgroundColor = 'var(--stage-' + stage + ')';
                                document.body.appendChild(sample);
                                const expected = getComputedStyle(sample).backgroundColor;
                                sample.remove();
                                return expected !== 'rgba(0, 0, 0, 0)' &&
                                    getComputedStyle(dot).backgroundColor === expected;
                            });
                        });
                        if (!stageTokensRendered) throw new Error('COMMERCIAL_STAGE_TOKEN_RENDERING_FAILED');
                        const openDetails = page.getByRole('button', { name: /Abrir detalhes da oportunidade/i }).first();
                        await openDetails.click();
                        const dialog = page.getByRole('dialog');
                        await dialog.waitFor({ state: 'visible', timeout: 12_000 });
                        // Wait for the actual dialog opening animation to settle
                        // before measuring text contrast and keyboard behavior.
                        await page.waitForTimeout(350);
                        await assertLayout(page);
                        const bounds = await dialog.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            return { left: rect.left, right: rect.right, width: innerWidth };
                        });
                        if (bounds.left < -1 || bounds.right > bounds.width + 1) {
                            throw new Error('Opportunity detail extends outside the device viewport.');
                        }
                        // Regression for the clipped title/company/actions seen in
                        // the real 96d8253c mobile and desktop QA screenshots.
                        const headerClipped = await dialog.evaluate(node => {
                            const header = node.querySelector('[data-qa-region="deal-header"]');
                            if (!header) return true;
                            const bottom = header.getBoundingClientRect().bottom;
                            return Array.from(header.children).some(child => (
                                child.getBoundingClientRect().bottom > bottom + 1
                            ));
                        });
                        if (headerClipped) throw new Error('Opportunity header content is clipped or obscured.');
                        const detailAxe = await runAxe(page, source);
                        const detailIssues = detailAxe.incompleteCount + detailAxe.violationsCount;
                        if (detailIssues) {
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/pipeline?detail');
                            const finding = {
                                profileIndex, route: '/pipeline', state: 'deal-detail', viewport: viewport.name, theme,
                                incompleteCount: detailAxe.incompleteCount,
                                violationsCount: detailAxe.violationsCount,
                                incomplete: detailAxe.incomplete,
                                violations: detailAxe.violations,
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) results.failures.push(finding);
                            process.stderr.write('CRM_B4_A11Y_DIAGNOSTIC=' + JSON.stringify({
                                ...finding,
                                incomplete: finding.incomplete.map((rule) => ({ ...rule, samples: rule.samples.slice(0, 4) })),
                                violations: finding.violations.map((rule) => ({ ...rule, samples: rule.samples.slice(0, 4) })),
                            }) + '\n');
                        }
                        const detailScreenshotName = `${account.label}-pipeline-deal-detail-${viewport.name}-${theme}.png`;
                        await page.screenshot({ path: resolve(artifactDir, detailScreenshotName), fullPage: true });
                        let sectionNavigationStatus = 'passed';
                        try {
                            await assertOpportunitySections(page, dialog, capture, artifactDir,
                                `${account.label}-pipeline-deal-detail-${viewport.name}-${theme}`, source);
                        } catch {
                            sectionNavigationStatus = 'failed';
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/pipeline?detail:sections');
                            const finding = {
                                profileIndex, route: '/pipeline', state: 'deal-detail-sections',
                                viewport: viewport.name, theme, sectionNavigation: 'failed',
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) results.failures.push(finding);
                            process.stderr.write('CRM_B4_SECTION_NAV_DIAGNOSTIC=' + JSON.stringify(finding) + '\n');
                        }
                        profileResult.checks.push({
                            route: '/pipeline', state: 'deal-detail-sections',
                            viewport: viewport.name, theme, sectionNavigation: sectionNavigationStatus,
                        });
                        // Record keyboard failures separately, keeping the rest of
                        // the 4-profile / 22-route synthetic matrix auditable.
                        let keyboardStatus = 'passed';
                        try {
                            await assertOpportunityDialogKeyboard(page, openDetails);
                        } catch {
                            keyboardStatus = 'failed';
                            a11yFailureCount += 1;
                            a11yFailedRoutes.add('/pipeline?detail:keyboard');
                            const finding = {
                                profileIndex, route: '/pipeline', state: 'deal-detail',
                                viewport: viewport.name, theme, keyboardFocus: 'failed',
                            };
                            if (results.failures.length < MAX_A11Y_DIAGNOSTICS) results.failures.push(finding);
                            process.stderr.write('CRM_B4_KEYBOARD_DIAGNOSTIC=' + JSON.stringify(finding) + '\n');
                        }
                        profileResult.checks.push({ route: '/pipeline', state: 'deal-detail', viewport: viewport.name, theme, axeStatus: detailIssues ? 'failed' : 'passed', keyboardIsolation: keyboardStatus });
                    }
                }
            }
        }
        results.profiles.push(profileResult);
        await context.close();
    }
    if (artifactDir) await writeFile(resolve(artifactDir, 'results.json'), `${JSON.stringify({ ...results, candidateSha, target: local ? 'local-isolated' : 'remote-isolated', previewSha: process.env.CRM_E2E_PREVIEW_SHA ?? null, deploymentId: process.env.CRM_E2E_DEPLOYMENT_ID ?? null }, null, 2)}\n`);
    if (a11yFailureCount) {
        fail('WCAG remains unresolved in ' + a11yFailureCount +
            ' audited combination(s) across ' + a11yFailedRoutes.size +
            ' route(s). Full matrix was audited but not certified.');
    } else {
        process.stdout.write(`E2E_AUTHENTICATED_SMOKE=PASSED: ${results.profiles.length} profile(s), ${results.profiles.reduce((total, profile) => total + profile.checks.length, 0)} visual route checks.\n`);
    }
} catch (error) {
    results.failures.push({ message: error instanceof Error ? error.message : 'Unknown E2E failure.' });
    fail(error instanceof Error ? error.message : 'Unknown E2E failure.');
} finally {
    await browser?.close();
}
