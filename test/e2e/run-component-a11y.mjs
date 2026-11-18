#!/usr/bin/env node
/**
 * Browser audit for actual CRM components rendered with synthetic data and real
 * project CSS. Never reads GitHub environments, CRM credentials or Supabase.
 * It is only a preflight; the protected authenticated E2E remains mandatory.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const base = 'http://127.0.0.1:4178';
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome || !existsSync(chrome)) throw new Error('Chrome is unavailable on QA runner.');
const vite = spawn(process.execPath, [resolve(repo, 'node_modules/vite/bin/vite.js'), '--config', resolve(repo, 'test/e2e/component-qa/vite.config.mjs')], {
    cwd: repo, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
for (const stream of [vite.stdout, vite.stderr]) stream.on('data', chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-3000); });
let browser;
let failingCombinations = 0;
try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
        if (vite.exitCode !== null) throw new Error('Synthetic QA server exited: ' + serverOutput);
        try { const r = await fetch(base); if (r.ok) { ready = true; break; } } catch {}
        await pause(250);
    }
    if (!ready) throw new Error('Synthetic QA server failed to start: ' + serverOutput);
    browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
    for (const theme of ['light', 'dark']) {
        for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
            const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
            const browserErrors = [];
            page.on('pageerror', error => {
                if (browserErrors.length < 5) browserErrors.push('pageerror:' + error.name + ':' + error.message.slice(0, 450));
            });
            page.on('console', message => {
                if (message.type() === 'error' && browserErrors.length < 5) {
                    browserErrors.push('console:' + message.text().slice(0, 450));
                }
            });
            try {
                await page.goto(base + '/?theme=' + theme, { waitUntil: 'networkidle' });
                try {
                    await page.waitForFunction(() => (document.body.textContent || '').includes('Nenhuma sugestão ativa') &&
                        (document.body.textContent || '').includes('Reativar oportunidade fictícia') &&
                        (document.body.textContent || '').includes('Visão Geral de Metas') &&
                        (document.body.textContent || '').includes('Follow-up QA fictício'), null, { timeout: 15000 });
                } catch {
                    const flags = await page.evaluate(() => ({
                        suggestions: (document.body.textContent || '').includes('Nenhuma sugestão ativa'),
                        active: (document.body.textContent || '').includes('Reativar oportunidade fictícia'),
                        goals: (document.body.textContent || '').includes('Visão Geral de Metas'),
                        automations: (document.body.textContent || '').includes('Follow-up QA fictício'),
                    }));
                    throw new Error('Synthetic components not mounted: flags=' + JSON.stringify(flags) +
                        ' browserErrors=' + JSON.stringify(browserErrors) + ' vite=' + serverOutput.slice(-1200));
                }
                await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
                const result = await page.evaluate(async () => {
                    const report = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
                    const diagnose = node => {
                        const target = Array.isArray(node.target) ? node.target[0] : null;
                        let element = null;
                        try { if (typeof target === 'string') element = document.querySelector(target); } catch {}
                        if (!element) return { resolved: false };
                        const region = element.closest('section[aria-label]')?.getAttribute('aria-label') || 'other';
                        const safeRegions = new Set([
                            'Sugestões vazias', 'Sugestões presentes', 'Líderes de desempenho',
                            'Campos em ambos os temas', 'Navegação de vendas responsiva',
                            'Prévia real do sistema de design', 'Metas reais com dados sintéticos',
                            'Automações reais com dados sintéticos',
                        ]);
                        const styles = [];
                        for (let e = element, depth = 0; e && depth < 4; e = e.parentElement, depth++) {
                            const s = getComputedStyle(e);
                            styles.push({
                                tag: e.tagName.toLowerCase().slice(0, 12),
                                color: s.color.slice(0, 80),
                                background: s.backgroundColor.slice(0, 80),
                                opacity: s.opacity.slice(0, 8),
                                classes: Array.from(e.classList).filter(x => /^(text-|bg-|opacity-|animate-|dark:|group-hover:)/.test(x)).slice(0, 8),
                            });
                        }
                        return { resolved: true, region: safeRegions.has(region) ? region : 'other', styles };
                    };
                    return {
                        violations: report.violations.map(x => ({ rule: x.id, count: x.nodes.length, samples: x.nodes.slice(0, 6).map(diagnose) })),
                        incomplete: report.incomplete.map(x => ({ rule: x.id, count: x.nodes.length, samples: x.nodes.slice(0, 6).map(diagnose) })),
                    };
                });
                const issueCount = result.violations.length + result.incomplete.length;
                process.stdout.write('CRM_B4_SYNTHETIC_AXE=' + JSON.stringify({
                    theme, viewport: viewport.width === 390 ? 'mobile' : 'desktop',
                    result: issueCount ? 'FAIL' : 'PASS', ...result,
                }) + '\n');
                if (issueCount) failingCombinations += 1;
            } finally { await page.close(); }
        }
    }
    if (failingCombinations) {
        throw new Error('Synthetic browser WCAG A/AA failed in ' + failingCombinations + ' combinations; protected approval is blocked.');
    }
} finally {
    if (browser) await browser.close();
    vite.kill('SIGTERM');
}
