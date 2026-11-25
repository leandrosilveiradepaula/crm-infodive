#!/usr/bin/env node
/**
 * Real, isolated proposal export proof. Loads the same ProposalPdfDocument and
 * renderToBuffer used by the production export route, without calling that
 * route (which allocates proposal numbers and persists business records).
 * All fixture data is invented, no network or database credentials required.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServer } from 'vite';

const root = process.cwd();
const output = resolve(process.env.CRM_PROPOSAL_EVIDENCE_DIR || join(root, '.next', 'proposal-render-evidence'));
await mkdir(output, { recursive: true });
const vite = await createServer({
  root,
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  resolve: { alias: [{ find: /^@\//, replacement: join(root, 'src') + '/' }] },
});

const norm = text => text.replace(/\s+/g, ' ').trim();
const product = (id, name, category, quantity, unit_price, pricing_model, extra = {}) => ({
  id, name, category, quantity, unit_price, pricing_model,
  organization_id: 'qa-synthetic-org', deal_id: 'qa-synthetic-deal',
  sku: id, cost: 0, margin: 0, is_visible_on_proposal: true,
  ...extra,
});

function parsePpm(buffer) {
  let index = 0;
  function token() {
    while (index < buffer.length) {
      if (buffer[index] === 35) {
        while (index < buffer.length && buffer[index] !== 10) index++;
      } else if (buffer[index] <= 32) index++;
      else break;
    }
    const start = index;
    while (index < buffer.length && buffer[index] > 32) index++;
    return buffer.toString('ascii', start, index);
  }
  assert.equal(token(), 'P6');
  const width = Number(token()), height = Number(token());
  assert.equal(Number(token()), 255);
  assert.ok(width > 100 && height > 100);
  // Consume the header delimiter, not arbitrary binary bytes.
  if (buffer[index] === 13 && buffer[index + 1] === 10) index += 2;
  else index++;
  assert.equal(buffer.length - index, width * height * 3);
  return {
    width,
    pixel(x, y) {
      const i = index + (y * width + x) * 3;
      return Array.from(buffer.subarray(i, i + 3));
    },
  };
}
function assertColor(actual, hex, label) {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  const expected = hex.slice(1).match(/../g).map(value => parseInt(value, 16));
  assert.ok(actual.every((value, i) => Math.abs(value - expected[i]) <= 6),
    label + ': expected ' + expected.join(',') + ', got ' + actual.join(','));
}

try {
  const { ProposalPdfDocument } = await vite.ssrLoadModule('/src/components/proposals/pdf/ProposalPdfDocument.tsx');
  const { proposalDocumentColors, proposalDocumentBand } = await vite.ssrLoadModule('/src/design-system/proposal-document-colors.ts');
  const fixture = {
    dealTitle: 'Projeto QA Sintetico',
    companyName: 'Cliente Ficticio QA',
    proposalNumber: 'QA-0001',
    products: [
      product('QA-HW', 'QASERVIDOR', 'Hardware', 2, 1234, 'one_time'),
      product('QA-SW', 'QALICENCA', 'Software', 2, 5200, 'monthly', {
        is_usd: true, present_in_usd: true, exchange_rate: 5.2,
      }),
      product('QA-SUP', 'QASUPORTE', 'Suporte', 1, 900, 'annual'),
    ],
    activeSections: ['cover', 'confidentiality', 'overview', 'hardware', 'software', 'investment', 'differentials', 'custom_notes'],
    editableTexts: {
      proposalTitle: 'Proposta QA Sintetica',
      confidentialityText: 'QACONFIDENCIAL. Documento ficticio para testes automatizados.',
      differentials: [{ title: 'QADIFERENCIAL', description: 'Validacao de renderizacao.', icon: '' }],
      priceStudyValidity: '30 dias',
      generalNotes: '',
      customNotesTitle: 'Notas QA',
      customNotesContent: 'QANOTAS. Conteudo sintetico para validar a pagina de notas.',
    },
    config: { template: 'executivo', showBillingInfo: false, isPriceStudy: false, allowSignature: false, includeAISummary: true, billingOverrides: {} },
    aiSummary: 'QARESUMO. Resumo ficticio de projeto para validar a exportacao.',
    objectives: [],
    simplifiedProductNames: {},
    softwareHighlights: [{ title: 'QADESTAQUE', value: 'Descricao ficticia.' }],
    benefitTiles: [{ value: '1', label: 'QA' }],
    distributors: [],
  };
  const variants = [
    { name: 'default', primary: proposalDocumentColors.primary, accent: proposalDocumentColors.accent, overrides: {} },
    { name: 'organization-override', primary: '#234B6B', accent: '#A84C21', overrides: { themePrimary: '#234B6B', themeAccent: '#A84C21' } },
  ];
  const results = [];
  for (const variant of variants) {
    const pdf = join(output, variant.name + '.pdf');
    const bytes = await renderToBuffer(React.createElement(ProposalPdfDocument, { ...fixture, ...variant.overrides }));
    assert.ok(bytes.length > 1000 && bytes.subarray(0, 5).toString() === '%PDF-', 'Invalid PDF');
    await writeFile(pdf, bytes);

    const pagesText = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const text = norm(pagesText);
    const pageTexts = pagesText.split('\f');
    const pageInfo = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
    const pages = Number(pageInfo.match(/^Pages:\s+(\d+)$/m)?.[1]);
    assert.ok(Number.isInteger(pages) && pages >= 8, 'Expected the eight real document sections');
    for (const marker of ['QACONFIDENCIAL', 'QARESUMO', 'QASERVIDOR', 'QALICENCA', 'QASUPORTE', 'QADIFERENCIAL', 'QANOTAS', '2.468,00', '2,000.00', '900,00']) {
      assert.ok(text.includes(marker), variant.name + ' missing rendered text/value: ' + marker);
    }
    const overviewIndex = pageTexts.findIndex(page => page.includes('QARESUMO')) + 1;
    assert.ok(overviewIndex > 0 && overviewIndex <= pages);
    const image = parsePpm(execFileSync('pdftoppm', ['-f', String(overviewIndex), '-l', String(overviewIndex), '-r', '72', '-singlefile', pdf], { maxBuffer: 8 * 1024 * 1024 }));
    assertColor(image.pixel(Math.floor(image.width / 4), 2), variant.accent, variant.name + ' accent band');
    assertColor(image.pixel(Math.floor(3 * image.width / 4), 2), variant.primary, variant.name + ' primary band');
    execFileSync('pdftoppm', ['-png', '-r', '96', pdf, join(output, variant.name)], { maxBuffer: 8 * 1024 * 1024 });
    results.push({ name: variant.name, pages, text, primary: variant.primary, accent: variant.accent });
  }
  assert.equal(results[0].pages, results[1].pages, 'Changing brand colors must not alter pagination');
  assert.equal(results[0].text, results[1].text, 'Changing brand colors must not alter proposal values or text');
  assert.equal(proposalDocumentBand(variants[1].accent, variants[1].primary), 'linear-gradient(90deg, #A84C21 0%, #234B6B 100%)');
  const report = { sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), result: 'PASS', sectionCount: 8, variants: results.map(({ text, ...result }) => result), currencyTotals: 'PASS', rasterBrandColors: 'PASS', textAndPaginationUnchanged: 'PASS' };
  await writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('CRM_PROPOSAL_RENDER=' + JSON.stringify(report));
} finally {
  await vite.close();
}
