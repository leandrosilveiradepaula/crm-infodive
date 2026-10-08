import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.CRM_SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const browserExecutablePath = (process.env.CRM_BROWSER_EXECUTABLE_PATH || '').trim();
const checks = [];
const failures = [];

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  if (!ok) failures.push({ name, detail });
}

async function visibleWithin(locator, timeout = 10_000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function noHorizontalOverflow(page, name, expectedWidth = null) {
  const result = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (expectedWidth !== null) {
    record(name + '_uses_device_width', Math.abs(result.innerWidth - expectedWidth) <= 2, JSON.stringify(result));
  }
  const ok = result.scrollWidth <= result.innerWidth + 1;
  record(name, ok, JSON.stringify(result));
}

async function tabSequenceIncludes(page, expectedNames) {
  const seen = [];
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return '';
      return [
        el.tagName,
        el.getAttribute('name') || '',
        el.getAttribute('type') || '',
        (el.textContent || '').trim().slice(0, 80),
      ].join('|');
    });
    seen.push(active);
  }
  const ok = expectedNames.every((expected) => seen.some((item) => item.includes(expected)));
  record('keyboard_tab_reaches_login_controls', ok, JSON.stringify(seen));
}

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutablePath ? { executablePath: browserExecutablePath } : {}),
});
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  const loginResponse = await page.goto(baseUrl + '/login', { waitUntil: 'networkidle' });
  record('login_http_success', Boolean(loginResponse && loginResponse.ok()), String(loginResponse?.status() ?? 'no-response'));

  const titleVisible = await visibleWithin(page.getByText('Bem-vindo de volta', { exact: true }));
  record('login_desktop_renders', titleVisible);

  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  const submit = page.getByRole('button', { name: 'Entrar no Sistema' });
  record('login_controls_have_accessible_roles', (await Promise.all([email, password, submit].map((locator) => visibleWithin(locator)))).every(Boolean));

  await noHorizontalOverflow(page, 'login_desktop_no_horizontal_overflow');
  await tabSequenceIncludes(page, ['email', 'password', 'Entrar no Sistema']);

  const knownRequestId = '11111111-1111-4111-8111-111111111111';
  const healthResponse = await page.request.get(baseUrl + '/api/health', {
    headers: { 'X-Request-Id': knownRequestId },
  });
  const healthBody = await healthResponse.json().catch(() => ({}));
  record(
    'health_fails_closed_without_external_config',
    healthResponse.status() === 503 && healthBody.status === 'degraded',
    JSON.stringify({ status: healthResponse.status(), body: healthBody }),
  );
  record(
    'health_preserves_valid_request_id',
    healthResponse.headers()['x-request-id'] === knownRequestId && healthBody.requestId === knownRequestId,
    JSON.stringify({ header: healthResponse.headers()['x-request-id'], body: healthBody.requestId }),
  );

  const invalidIdResponse = await page.request.get(baseUrl + '/api/health', {
    headers: { 'X-Request-Id': 'not-a-valid-request-id' },
  });
  const replacementId = invalidIdResponse.headers()['x-request-id'] || '';
  record(
    'health_replaces_invalid_request_id',
    replacementId !== 'not-a-valid-request-id' && /^[0-9a-f-]{36}$/i.test(replacementId),
    replacementId,
  );

  const protectedApi = await page.request.post(baseUrl + '/api/sales/reconcile', { data: {} });
  const protectedApiRequestId = protectedApi.headers()['x-request-id'] || '';
  record(
    'protected_api_returns_401_with_request_id',
    protectedApi.status() === 401 && /^[0-9a-f-]{36}$/i.test(protectedApiRequestId),
    JSON.stringify({ status: protectedApi.status(), requestId: protectedApiRequestId }),
  );

  const protectedResponse = await page.goto(baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/login(?:\?|$)/, { timeout: 10_000 }).catch(() => {});
  const protectedUrl = new URL(page.url());
  record(
    'protected_dashboard_redirects_unauthenticated',
    protectedUrl.pathname === '/login',
    JSON.stringify({ status: protectedResponse?.status() ?? null, url: page.url() }),
  );

  for (const internalPath of ['/debug', '/design-preview']) {
    const internalResponse = await page.goto(baseUrl + internalPath, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 10_000 }).catch(() => {});
    const internalUrl = new URL(page.url());
    record(
      'internal_route_' + internalPath.slice(1).replaceAll('-', '_') + '_requires_auth',
      internalUrl.pathname === '/login',
      JSON.stringify({ path: internalPath, status: internalResponse?.status() ?? null, url: page.url() }),
    );
  }

  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(baseUrl + '/login', { waitUntil: 'networkidle' });
  record('login_mobile_renders', await visibleWithin(mobilePage.getByText('Bem-vindo de volta', { exact: true })));
  await noHorizontalOverflow(mobilePage, 'login_mobile_no_horizontal_overflow', 390);

  await mobilePage.goto(baseUrl + '/login?invite_token=smoke-test', { waitUntil: 'networkidle' });
  record('invite_registration_state_renders', await visibleWithin(mobilePage.getByText('Criar nova conta', { exact: true })));
  record('invite_registration_name_field_visible', await visibleWithin(mobilePage.locator('input[name="name"]')));
  await noHorizontalOverflow(mobilePage, 'invite_mobile_no_horizontal_overflow', 390);

  await mobile.close();
} finally {
  await browser.close();
}

mkdirSync('artifacts', { recursive: true });
const evidence = {
  schema_version: 1,
  status: failures.length ? 'failed' : 'passed',
  base_url: baseUrl,
  checks,
  failures,
  generated_at: new Date().toISOString(),
};
writeFileSync('artifacts/browser-smoke.json', JSON.stringify(evidence, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(evidence));

if (failures.length) process.exit(1);
