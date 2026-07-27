import pptxgen from 'pptxgenjs';
import { LOGO_BASE64, DATACENTER_BASE64, HANDSHAKE_BASE64 } from '@/components/proposals/pdf/pdfAssetsBase64';
import type { Deal, DealProduct } from '@/types/deal';
import type { Account } from '@/types/account';
import { isSoftware, isHardware, isSupport, isService } from '@/utils/productClassification';
import { getSmartProductDescription } from '@/utils/formatProductDescription';

// ─── Theme & Layout Constants ───────────────────────────────────────────────
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const FONT = 'Inter';

interface PptColors {
    primary: string;
    accent: string;
    textDark: string;
    textMuted: string;
    bg: string;
    border: string;
}

function getColors(primary?: string, accent?: string): PptColors {
    return {
        primary: (primary || '#1e3a5f').replace('#', ''),
        accent: (accent || '#E31837').replace('#', ''),
        textDark: '1e293b',
        textMuted: '64748b',
        bg: 'FFFFFF',
        border: 'e5e7eb',
    };
}

// ─── Shared Helpers ─────────────────────────────────────────────────────────
function addGradientBar(slide: pptxgen.Slide, c: PptColors) {
    slide.addShape('rect', { x: 0, y: 0, w: SLIDE_W / 2, h: 0.08, fill: { color: c.accent } });
    slide.addShape('rect', { x: SLIDE_W / 2, y: 0, w: SLIDE_W / 2, h: 0.08, fill: { color: c.primary } });
}

function addLogo(slide: pptxgen.Slide, x = 0.5, y = 0.25) {
    slide.addImage({ data: LOGO_BASE64, x, y, h: 0.5, w: 1.8 });
}

function addStandardHeader(slide: pptxgen.Slide, c: PptColors, title: string, accentWord: string, subtitle?: string, pageInfo?: string) {
    addGradientBar(slide, c);
    addLogo(slide);
    const titleY = 0.9;
    slide.addText([
        { text: title + ' ', options: { fontSize: 22, bold: true, color: c.primary, fontFace: FONT } },
        { text: accentWord, options: { fontSize: 22, bold: true, color: c.accent, fontFace: FONT } },
        ...(pageInfo ? [{ text: `  ${pageInfo}`, options: { fontSize: 11, color: c.textMuted, fontFace: FONT } }] : []),
    ], { x: 0.5, y: titleY, w: 9, h: 0.45 });
    slide.addShape('rect', { x: 0.5, y: titleY + 0.5, w: 0.5, h: 0.05, fill: { color: c.accent } });
    if (subtitle) {
        slide.addText(subtitle, { x: 0.5, y: titleY + 0.65, w: 9, h: 0.3, fontSize: 10, color: c.textMuted, fontFace: FONT, bold: true });
    }
}

function addFooter(slide: pptxgen.Slide, c: PptColors, text: string) {
    slide.addText(text, { x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.3, align: 'center', fontSize: 8, color: '9ca3af', fontFace: FONT });
}

// ─── Cover Slide ────────────────────────────────────────────────────────────
export interface CoverData {
    dealTitle: string;
    companyName: string;
    date: string;
    proposalTitle?: string;
    proposalNumber?: string;
    sellerName?: string;
    clientLogo?: string;
    primaryColor?: string;
    accentColor?: string;
}

export function buildCoverSlide(pptx: pptxgen, data: CoverData) {
    const c = getColors(data.primaryColor, data.accentColor);
    const slide = pptx.addSlide();

    addGradientBar(slide, c);

    // Left content area (65%)
    addLogo(slide, 0.5, 0.3);

    // Client logo if present
    if (data.clientLogo) {
        slide.addShape('rect', { x: 2.5, y: 0.3, w: 0.02, h: 0.45, fill: { color: c.border } });
        slide.addImage({ data: data.clientLogo, x: 2.7, y: 0.3, h: 0.45, w: 1.2 });
    }

    // Title
    slide.addText(data.proposalTitle || 'Proposta de Solução de Infraestrutura e Licenciamento', {
        x: 0.5, y: 1.2, w: 5.8, h: 0.8, fontSize: 24, bold: true, color: c.primary, fontFace: FONT, valign: 'top',
    });

    // Subtitle
    slide.addText('Infodive IT - Soluções Inteligentes', {
        x: 0.5, y: 2.1, w: 5.8, h: 0.3, fontSize: 12, bold: true, color: c.accent, fontFace: FONT,
    });

    // Metadata table (native pptxgenjs table)
    const metaRows: pptxgen.TableRow[] = [
        [{ text: 'Projeto', options: { fontSize: 10, bold: true, color: c.textDark, fontFace: FONT } },
         { text: data.dealTitle || '', options: { fontSize: 10, color: c.textMuted, fontFace: FONT } }],
        [{ text: 'Cliente', options: { fontSize: 10, bold: true, color: c.textDark, fontFace: FONT } },
         { text: data.companyName || '', options: { fontSize: 10, color: c.textMuted, fontFace: FONT } }],
        [{ text: 'Responsável', options: { fontSize: 10, bold: true, color: c.textDark, fontFace: FONT } },
         { text: data.sellerName ? `${data.sellerName} (Infodive IT)` : 'Infodive IT', options: { fontSize: 10, color: c.textMuted, fontFace: FONT } }],
        [{ text: 'Data', options: { fontSize: 10, bold: true, color: c.textDark, fontFace: FONT } },
         { text: data.date || '', options: { fontSize: 10, color: c.textMuted, fontFace: FONT } }],
    ];

    if (data.proposalNumber) {
        metaRows.push([
            { text: 'Nº Proposta', options: { fontSize: 10, bold: true, color: c.textDark, fontFace: FONT } },
            { text: data.proposalNumber, options: { fontSize: 10, bold: true, color: c.accent, fontFace: FONT } },
        ]);
    }

    slide.addTable(metaRows, {
        x: 0.5, y: 2.7, w: 5.8,
        colW: [1.3, 4.5],
        border: { type: 'solid', pt: 0.5, color: c.border },
        rowH: 0.3,
        margin: [3, 5, 3, 5],
    });

    // Right side image
    slide.addImage({ data: DATACENTER_BASE64, x: 6.5, y: 0, h: SLIDE_H, w: 3.5 });

    return slide;
}

// ─── Confidentiality Slide ──────────────────────────────────────────────────
export function buildConfidentialitySlide(pptx: pptxgen, primaryColor?: string, accentColor?: string) {
    const c = getColors(primaryColor, accentColor);
    const slide = pptx.addSlide();

    addGradientBar(slide, c);
    addLogo(slide, 0.5, 0.3);

    // Title
    slide.addText([
        { text: 'Termos de ', options: { fontSize: 22, bold: true, color: c.primary, fontFace: FONT } },
        { text: 'Confidencialidade', options: { fontSize: 22, bold: true, color: c.accent, fontFace: FONT } },
    ], { x: 0.5, y: 1.0, w: 4.5, h: 0.4 });

    slide.addShape('rect', { x: 0.5, y: 1.5, w: 0.5, h: 0.05, fill: { color: c.accent } });

    // Content
    slide.addText(
        'O conteúdo deste documento destina-se exclusivamente à avaliação interna da organização ' +
        'destinatária. As informações aqui contidas são proprietárias e não devem ser compartilhadas ' +
        'com terceiros sem autorização prévia. Qualquer alteração nas premissas técnicas ou ' +
        'comerciais descritas implicará na necessidade de uma revisão formal das condições propostas.',
        { x: 0.5, y: 1.8, w: 4.3, h: 1.8, fontSize: 10, color: '374151', fontFace: FONT, lineSpacingMultiple: 1.5, valign: 'top' }
    );

    // Quote
    slide.addShape('rect', { x: 0.5, y: 3.8, w: 0.04, h: 0.7, fill: { color: c.accent } });
    slide.addText(
        '"A integridade das informações e a proteção da estratégia de TI são pilares fundamentais desta parceria comercial."',
        { x: 0.7, y: 3.8, w: 4.1, h: 0.7, fontSize: 10, italic: true, color: c.accent, fontFace: FONT, lineSpacingMultiple: 1.3 }
    );

    // Right image
    slide.addShape('rect', { x: 5, y: 0, w: 5, h: SLIDE_H, fill: { color: c.primary } });
    slide.addImage({ data: HANDSHAKE_BASE64, x: 5.5, y: 1.0, h: 3.5, w: 4, sizing: { type: 'contain', w: 4, h: 3.5 } });

    return slide;
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

// ─── Overview Slide ─────────────────────────────────────────────────────────
export interface OverviewData {
    dealTitle: string;
    aiSummary?: string;
    objectives?: Array<{ number: string; title: string; description: string }>;
    primaryColor?: string;
    accentColor?: string;
}

export function buildOverviewSlide(pptx: pptxgen, data: OverviewData) {
    const c = getColors(data.primaryColor, data.accentColor);
    const slide = pptx.addSlide();

    addStandardHeader(slide, c, 'Visão Geral do', 'Projeto', data.dealTitle);

    let contentY = 2.0;

    if (data.aiSummary) {
        // Enforce max-length to guarantee that layout does not break/overflow the slide
        const safeSummary = truncateText(data.aiSummary, 800);
        
        // Dynamically calculate block height based on text content
        // Account for paragraph breaks, word-wrap, and line-spacing
        const TEXT_W = 8.6;         // usable text width in inches
        const FONT_SIZE = 9;        // font size in pt
        const CHAR_WIDTH = 0.065;   // approx width per char at 9pt Inter (~15.4 chars/inch)
        const CHARS_PER_LINE = Math.floor(TEXT_W / CHAR_WIDTH); // ~132 chars, but use conservative estimate
        const EFFECTIVE_CPL = 105;   // conservative: accounts for word-wrap not breaking mid-word
        const LINE_H_BASE = FONT_SIZE / 72; // base line height in inches (9pt = 0.125in)
        const LINE_SPACING = 1.2;
        const LINE_H = LINE_H_BASE * LINE_SPACING; // ~0.15in per line
        const PADDING_V = 0.4;      // vertical padding (top + bottom combined)

        // Count actual lines: split by paragraph breaks, then estimate wrapped lines per paragraph
        const paragraphs = safeSummary.split('\n');
        const totalLines = paragraphs.reduce((sum, para) => {
            if (para.trim() === '') return sum + 0.5; // empty line = half line
            return sum + Math.max(1, Math.ceil(para.length / EFFECTIVE_CPL));
        }, 0);

        const estimatedH = Math.min(3.2, Math.max(0.6, totalLines * LINE_H + PADDING_V));

        slide.addShape('roundRect', { x: 0.5, y: contentY, w: 9, h: estimatedH, fill: { color: 'f8f9fa' }, line: { color: c.border, width: 0.5 }, rectRadius: 0.1 });
        slide.addText(safeSummary, { x: 0.7, y: contentY + 0.12, w: 8.6, h: estimatedH - 0.24, fontSize: FONT_SIZE, color: c.primary, fontFace: FONT, lineSpacingMultiple: LINE_SPACING, valign: 'top' });
        contentY += estimatedH + 0.15;
    }

    const objectives = data.objectives || [];
    if (objectives.length > 0) {
        const colW = 4.3;
        objectives.forEach((obj, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ox = 0.5 + col * (colW + 0.4);
            const oy = contentY + row * 1.0;
            if (oy + 0.9 > SLIDE_H - 0.3) return;

            slide.addShape('roundRect', { x: ox, y: oy, w: colW, h: 0.9, fill: { color: c.bg }, line: { color: c.border, width: 0.5 }, rectRadius: 0.08 });
            slide.addShape('roundRect', { x: ox + 0.1, y: oy + 0.1, w: 0.25, h: 0.25, fill: { color: c.accent }, rectRadius: 0.05 });
            slide.addText(obj.number, { x: ox + 0.1, y: oy + 0.1, w: 0.25, h: 0.25, fontSize: 8, bold: true, color: 'FFFFFF', fontFace: FONT, align: 'center', valign: 'middle' });
            slide.addText(obj.title, { x: ox + 0.45, y: oy + 0.1, w: colW - 0.6, h: 0.25, fontSize: 10, bold: true, color: c.primary, fontFace: FONT });
            slide.addText(obj.description, { x: ox + 0.45, y: oy + 0.4, w: colW - 0.6, h: 0.45, fontSize: 8, color: c.textMuted, fontFace: FONT, lineSpacingMultiple: 1.2, valign: 'top' });
        });
    }

    addFooter(slide, c, 'Infodive IT Solutions - Confidencial');
    return slide;
}

// ─── Differentials Slide ────────────────────────────────────────────────────
export function buildDifferentialsSlide(pptx: pptxgen, primaryColor?: string, accentColor?: string) {
    const c = getColors(primaryColor, accentColor);
    const slide = pptx.addSlide();

    addStandardHeader(slide, c, 'Diferenciais da', 'Solução', 'Por que escolher a Infodive IT como parceira estratégica');

    const diffs = [
        { title: 'Expertise Técnica Comprovada', desc: 'Equipe certificada com anos de experiência em infraestrutura crítica e soluções enterprise', icon: '🎯', bgColor: 'f0f9ff', borderColor: c.primary },
        { title: 'Parcerias Estratégicas', desc: 'Parceiros oficiais Lenovo, Microsoft, Veeam, Virtuozzo, IBM, VMware, RedHat e principais fabricantes', icon: '🤝', bgColor: 'fef2f2', borderColor: c.accent },
        { title: 'Foco no Sucesso do Cliente', desc: 'Suporte dedicado e acompanhamento contínuo pós-implementação para garantir resultados', icon: '⭐', bgColor: 'f0fdf4', borderColor: '16a34a' },
    ];

    diffs.forEach((d, i) => {
        const y = 2.0 + i * 0.95;
        const color = d.borderColor;
        const fontFace = 'Inter';
        slide.addShape('roundRect', { x: 0.5, y, w: 9, h: 0.85, fill: { color: d.bgColor }, line: { color, width: 1 }, rectRadius: 0.08 });
        slide.addText(d.icon, { x: 0.7, y, w: 0.6, h: 0.85, fontSize: 26, align: 'center', valign: 'middle' });
        slide.addText(d.title, { x: 1.4, y: y + 0.08, w: 7.8, h: 0.3, fontSize: 13, bold: true, color, fontFace });
        slide.addText(d.desc, { x: 1.4, y: y + 0.38, w: 7.8, h: 0.35, fontSize: 9, color: '4b5563', fontFace, lineSpacingMultiple: 1.2 });
    });

    // Banner
    slide.addShape('roundRect', { x: 0.5, y: 4.95, w: 9, h: 0.4, fill: { color: c.primary }, rectRadius: 0.08 });
    slide.addText([
        { text: 'Mais de 15 anos ', options: { fontSize: 10, bold: true, color: c.accent, fontFace: 'Inter' } },
        { text: 'transformando infraestruturas de TI em vantagens competitivas', options: { fontSize: 10, color: 'FFFFFF', fontFace: 'Inter' } },
    ], { x: 0.5, y: 4.95, w: 9, h: 0.4, align: 'center', valign: 'middle' });

    return slide;
}

// ─── Custom Notes Slide ─────────────────────────────────────────────────────
export function buildCustomNotesSlide(pptx: pptxgen, title: string, content: string, primaryColor?: string, accentColor?: string) {
    if (!content?.trim()) return null;
    const c = getColors(primaryColor, accentColor);
    const slide = pptx.addSlide();
    addStandardHeader(slide, c, title || 'Notas', 'Adicionais');
    slide.addText(content, { x: 0.5, y: 1.7, w: 9, h: 3.5, fontSize: 10, color: '334155', fontFace: 'Inter', lineSpacingMultiple: 1.4, valign: 'top', paraSpaceAfter: 6 });
    addFooter(slide, c, 'Infodive IT Solutions');
    return slide;
}

// ─── Investment Slide(s) ────────────────────────────────────────────────────
export interface InvestmentData {
    deal: Deal;
    distributors?: Account[];
    billingOverrides?: Record<string, any>;
    simplifiedProductNames?: Record<string, string>;
    primaryColor?: string;
    accentColor?: string;
    showBillingInfo?: boolean;
    quoteDisplayMode?: 'consolidated' | 'options';
    dealQuotes?: Array<{ id: string; title: string; is_primary: boolean }>;
}

export function buildInvestmentSlides(pptx: pptxgen, data: InvestmentData): pptxgen.Slide[] {
    const c = getColors(data.primaryColor, data.accentColor);
    const slides: pptxgen.Slide[] = [];
    const products = data.deal.deal_products || [];
    const mainProducts = products.filter(p => !p.is_optional);
    const simplify = data.simplifiedProductNames || {};

    const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL'
    }).format(v);

    const formatUSD = (v: number) => new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD'
    }).format(v);

    const ROW_H = 0.28;
    const TABLE_X = 0.5;
    const TABLE_W = 9;
    const COL_W: number[] = [0.4, 4.5, 0.6, 1.6, 1.9];
    const MAX_Y = SLIDE_H - 0.5; // leave room for footer

    // Helper: build table rows for a product set
    const buildTableRows = (prods: DealProduct[], label?: string, pricingSuffix?: string, pricingModel?: string, hideTotal: boolean = false) => {
        const headerRow: pptxgen.TableRow = [
            { text: '#', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', align: 'center' } },
            { text: 'Produto / Serviço', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter' } },
            { text: 'Qtd', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', align: 'center' } },
            { text: `Valor Unit.`, options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', align: 'right' } },
            { text: `Total`, options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', align: 'right' } },
        ];

        const dataRows: pptxgen.TableRow[] = prods.map((p, i) => {
            let name = simplify[p.name] || p.display_name || p.name || 'Item';
            if (p.duration && p.duration_unit) {
                const isRecurring = pricingModel === 'monthly' || pricingModel === 'annual';
                name += `\n${isRecurring ? '(Contrato de ' : '(Válido por '}${p.duration} ${p.duration_unit})`;
            }
            const qty = p.quantity || 1;
            const isUSD = !!p.present_in_usd;
            const unit = isUSD ? ((p.unit_price || 0) / (p.exchange_rate || 1)) : (p.unit_price || 0);
            const total = unit * qty;
            const bgColor = i % 2 === 0 ? 'f8fafc' : 'FFFFFF';
            const formatter = isUSD ? formatUSD : formatBRL;

            return [
                { text: String(i + 1), options: { fontSize: 8, color: c.textMuted, fontFace: 'Inter', align: 'center', fill: { color: bgColor } } },
                { text: name, options: { fontSize: 8, color: c.textDark, fontFace: 'Inter', fill: { color: bgColor } } },
                { text: String(qty), options: { fontSize: 8, color: c.textDark, fontFace: 'Inter', align: 'center', fill: { color: bgColor } } },
                { text: formatter(unit), options: { fontSize: 8, color: c.textDark, fontFace: 'Inter', align: 'right', fill: { color: bgColor } } },
                { text: formatter(total), options: { fontSize: 8, bold: true, color: c.textDark, fontFace: 'Inter', align: 'right', fill: { color: bgColor } } },
            ];
        });

        // Split totals if mixed currency
        const totalBRL = prods.reduce((s, p) => p.present_in_usd ? s : s + ((p.unit_price || 0) * (p.quantity || 1)), 0);
        const totalUSD = prods.reduce((s, p) => !p.present_in_usd ? s : s + (((p.unit_price || 0) / (p.exchange_rate || 1)) * (p.quantity || 1)), 0);
        
        const rows = [headerRow, ...dataRows];
        
        if (!hideTotal) {
            if (totalBRL > 0) {
                const labelBRL = label ? `TOTAL ${label.toUpperCase()}${totalUSD > 0 ? ' (BRL)' : ''}` : totalUSD > 0 ? 'TOTAL CONSOLIDADO (BRL)' : 'TOTAL CONSOLIDADO';
                rows.push([
                    { text: labelBRL, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', colspan: 3, align: 'right' } },
                    { text: '', options: { fill: { color: c.primary } } },
                    { text: formatBRL(totalBRL), options: { fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: 'Inter', align: 'right' } },
                ]);
            }
            if (totalUSD > 0) {
                const labelUSD = label ? `TOTAL ${label.toUpperCase()} (USD)` : 'TOTAL CONSOLIDADO (USD)';
                rows.push([
                    { text: labelUSD, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: '475569' }, fontFace: 'Inter', colspan: 3, align: 'right' } },
                    { text: '', options: { fill: { color: '475569' } } },
                    { text: formatUSD(totalUSD), options: { fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '475569' }, fontFace: 'Inter', align: 'right' } },
                ]);
            }
        }

        return { rows, height: rows.length * ROW_H };
    };

    // Determine display mode
    const quotes = data.dealQuotes || [];
    const isMultiQuoteOptions = data.quoteDisplayMode === 'options' && quotes.length > 1;
    const isSingleQuoteOptions = data.quoteDisplayMode === 'options' && quotes.length <= 1;

    if (isMultiQuoteOptions || isSingleQuoteOptions) {
        // Build option blocks: { label, displayName, products }
        type OptionBlock = { label: string; displayName: string; prods: DealProduct[] };
        const optionBlocks: OptionBlock[] = [];

        if (isMultiQuoteOptions) {
            quotes
                .filter(q => mainProducts.some(p => p.quote_id === q.id))
                .forEach((quote, qIdx) => {
                    optionBlocks.push({
                        label: `Opção ${String.fromCharCode(65 + qIdx)}`,
                        displayName: quote.title,
                        prods: mainProducts.filter(p => p.quote_id === quote.id),
                    });
                });
        } else {
            const rootProducts = mainProducts.filter(p => !p.parent_id);
            rootProducts.forEach((rootProduct, pIdx) => {
                const children = mainProducts.filter(p => p.parent_id === rootProduct.id);
                optionBlocks.push({
                    label: `Opção ${String.fromCharCode(65 + pIdx)}`,
                    displayName: simplify[rootProduct.name] || rootProduct.display_name || rootProduct.name || '',
                    prods: [rootProduct, ...children],
                });
            });
        }

        // Render all option blocks, packing into as few slides as possible
        let slide = pptx.addSlide();
        slides.push(slide);
        addStandardHeader(slide, c, 'Estrutura de', 'Investimento');
        let curY = 1.7;

        optionBlocks.forEach((block) => {
            const labelH = 0.3;
            const { rows, height: tableH } = buildTableRows(block.prods, block.label, undefined, undefined, true);
            const blockH = labelH + tableH + 0.15; // label + table + gap

            // Check if we need a new slide
            if (curY + blockH > MAX_Y && curY > 2.0) {
                addFooter(slide, c, 'Infodive IT Solutions - Resumo de Investimento');
                slide = pptx.addSlide();
                slides.push(slide);
                addStandardHeader(slide, c, 'Estrutura de', 'Investimento', '(cont.)');
                curY = 1.7;
            }

            // Option label badge
            slide.addShape('roundRect', { x: TABLE_X, y: curY, w: 0.7, h: 0.22, fill: { color: c.accent }, rectRadius: 0.04 });
            slide.addText(block.label.toUpperCase(), { x: TABLE_X, y: curY, w: 0.7, h: 0.22, fontSize: 7, bold: true, color: 'FFFFFF', fontFace: 'Inter', align: 'center', valign: 'middle' });
            slide.addText(block.displayName, { x: TABLE_X + 0.8, y: curY, w: 8, h: 0.22, fontSize: 9, bold: true, color: c.primary, fontFace: 'Inter', valign: 'middle' });
            curY += labelH;

            // Table
            slide.addTable(rows, {
                x: TABLE_X, y: curY, w: TABLE_W,
                colW: COL_W, rowH: ROW_H,
                border: { type: 'solid', pt: 0.3, color: c.border },
                margin: [2, 4, 2, 4],
            });
            curY += tableH + 0.15;
        });

        addFooter(slide, c, 'Infodive IT Solutions - Resumo de Investimento');
    } else {
        // Consolidated view: follow strict linear order
        const slide = pptx.addSlide();
        slides.push(slide);
        addStandardHeader(slide, c, 'Estrutura de', 'Investimento');

        const { rows } = buildTableRows(mainProducts);
        slide.addTable(rows, {
            x: TABLE_X, y: 1.7, w: TABLE_W,
            colW: COL_W, rowH: ROW_H,
            border: { type: 'solid', pt: 0.3, color: c.border },
            margin: [2, 4, 2, 4],
        });

        addFooter(slide, c, 'Infodive IT Solutions - Resumo de Investimento');
    }

    // ── Billing Info Slide ─────────────────────────────────────────────
    if (data.showBillingInfo !== false) {
        const billingSlide = pptx.addSlide();
        slides.push(billingSlide);
        addStandardHeader(billingSlide, c, 'Condições de', 'Pagamento');

        const products = data.deal.deal_products || [];
        const mainProducts = products.filter(p => !p.is_optional);
        const distributors = data.distributors || [];
        const billingOverrides = data.billingOverrides || {};

        const groups: any[] = [];
        
        // Reseller Group (Infodive)
        const resellerProducts = mainProducts.filter(p => p.billing_type === 'direct' || !p.billing_type);
        if (resellerProducts.length > 0) {
            const override = billingOverrides['infodive'] || {};
            const cnpjOverride = override.cnpj || resellerProducts.find(p => p.distributor_cnpj && p.distributor_cnpj.length > 5)?.distributor_cnpj;
            const termsOverride = override.paymentTerms || 'Até 10 dias, após a conclusão do serviço';

            groups.push({
                title: 'Faturamento Direto (Infodive)',
                name: override.selectedBranchName || 'Infodive Representações e Serviços Ltda',
                cnpj: cnpjOverride || '05.613.186/0001-78',
                terms: termsOverride,
                type: 'reseller',
                products: resellerProducts
            });
        }

        // Direct Groups
        const directProducts = mainProducts.filter(p => p.billing_type === 'indirect');
        const directKeys = Array.from(new Set(directProducts.map(p => `${p.distributor_id || 'no-dist'}|${p.distributor_cnpj || 'no-cnpj'}`)));
        
        directKeys.forEach(key => {
            const [dId, dCnpj] = key.split('|');
            const dist = dId !== 'no-dist' ? distributors.find(d => d.id === dId) : undefined;
            if (dist) {
                const override = billingOverrides[dist.id] || {};
                const displayCnpj = override.cnpj || (dCnpj !== 'no-cnpj' ? dCnpj : undefined) || dist.cnpj;
                const displayName = override.selectedBranchName || dist.name;
                const displayTerms = override.paymentTerms ?? dist.payment_terms;

                const distProducts = directProducts.filter(p => 
                    (p.distributor_id || 'no-dist') === dId && 
                    (p.distributor_cnpj || 'no-cnpj') === dCnpj
                );

                groups.push({
                    title: `Faturamento Direto (${dist.name})`,
                    name: displayName,
                    cnpj: displayCnpj,
                    terms: displayTerms,
                    type: 'direct',
                    products: distProducts
                });
            }
        });

        // Render groups
        groups.forEach((group, idx) => {
            const y = 1.7 + idx * 1.5;
            const accent = group.type === 'reseller' ? '#64748b' : c.accent;
            
            billingSlide.addShape('roundRect', { x: 0.5, y, w: 9, h: 1.3, fill: { color: 'f8fafc' }, line: { color: c.border, width: 0.5 }, rectRadius: 0.05 });
            billingSlide.addShape('rect', { x: 0.5, y, w: 0.06, h: 1.3, fill: { color: accent } });
            
            billingSlide.addText('FATURAMENTO DIRETO', { x: 0.7, y: y + 0.1, w: 5, h: 0.2, fontSize: 7, bold: true, color: accent, fontFace: 'Inter' });
            billingSlide.addText(group.name, { x: 0.7, y: y + 0.3, w: 8.5, h: 0.3, fontSize: 11, bold: true, color: c.primary, fontFace: 'Inter' });
            billingSlide.addText(`CNPJ: ${group.cnpj || '-'}`, { x: 0.7, y: y + 0.55, w: 4, h: 0.2, fontSize: 8, color: c.textMuted, fontFace: 'Inter' });

            const productsList = Array.from((group.products || []).reduce((acc: Map<string, string>, p: any) => {
                const rawName = (p.display_name || p.name || '').toString();
                const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                const key = clean.toLowerCase();
                if (clean && !acc.has(key)) acc.set(key, clean);
                return acc;
            }, new Map<string, string>()).values()).join(' • ');

            if (productsList) {
                billingSlide.addText([
                    { text: 'PRODUTOS: ', options: { bold: true, color: c.textMuted, fontSize: 8, fontFace: FONT } },
                    { text: productsList, options: { color: c.primary, fontSize: 8, fontFace: FONT, bold: true } }
                ], { x: 4.5, y: y + 0.55, w: 4.8, h: 0.2 });
            }

            if (group.terms) {
                const termsY = y + 0.8;
                billingSlide.addShape('roundRect', { x: 0.7, y: termsY, w: 8.6, h: 0.4, fill: { color: 'fff1f2' }, line: { color: 'fecdd3', width: 0.5 }, rectRadius: 0.04 });
                billingSlide.addText('CONDIÇÕES DE PAGAMENTO:', { x: 0.85, y: termsY + 0.05, w: 3, h: 0.15, fontSize: 6, bold: true, color: '#e31837', fontFace: FONT });
                billingSlide.addText(group.terms.replace(/;/g, '  •  '), { x: 0.85, y: termsY + 0.18, w: 8.3, h: 0.2, fontSize: 8, color: '#9f1239', bold: true, fontFace: FONT });
            }
        });

        addFooter(billingSlide, c, 'Infodive IT Solutions - Condições Comerciais');
    }

    return slides;
}

// ─── Hardware Slides ────────────────────────────────────────────────────────
export interface HardwareData {
    deal: Deal;
    simplifiedProductNames?: Record<string, string>;
    primaryColor?: string;
    accentColor?: string;
}

export function buildHardwareSlides(pptx: pptxgen, data: HardwareData): pptxgen.Slide[] {
    const c = getColors(data.primaryColor, data.accentColor);
    const slides: pptxgen.Slide[] = [];
    const allProducts = data.deal.deal_products || [];
    const simplify = data.simplifiedProductNames || {};

    const hwProducts = allProducts.filter(p =>
        (isHardware(p) || isSupport(p) || isService(p)) && p.is_visible_on_proposal !== false
    );
    const deduped = hwProducts.filter((p, i, s) => i === s.findIndex(t => t.name === p.name));
    if (deduped.length === 0) return slides;

    const MAX_Y = 5.1;
    let page = 0;
    let slide = pptx.addSlide();
    slides.push(slide);
    addStandardHeader(slide, c, 'Infraestrutura &', 'Hardware', undefined, '');

    let curY = 1.7;
    let productsInPage = 0;

    deduped.forEach((product) => {
        // Parse specs into bullet lines using getSmartProductDescription (just like the PDF)
        const specs: string[] = [];
        let rawSpecs: any[] = [];
        try {
            const sourceDetails = product.description || product.tech_details;
            if (sourceDetails) {
                rawSpecs = typeof sourceDetails === 'string' ? JSON.parse(sourceDetails) : sourceDetails;
            }
        } catch {
            rawSpecs = String(product.description || '').split('\n').filter(l => l.trim().length > 0).map((l, i) => ({ description: l, quantity: 1 }));
        }

        if (rawSpecs && rawSpecs.length > 0) {
            const specsLines = getSmartProductDescription(rawSpecs, 1);
            specsLines.forEach(spec => {
                const qtyPrefix = spec.qty && spec.qty > 0 ? `${spec.qty} x ` : '';
                specs.push(`${qtyPrefix}${spec.description}`);
            });
        }

        // Limit to 8 specs to prevent huge cards
        const displaySpecs = specs.slice(0, 8);

        // Height calculation: header (0.35) + 0.16 per spec + 0.15 padding
        const cardH = 0.35 + (displaySpecs.length * 0.16) + 0.15;

        // Check overflow
        if (curY + cardH > MAX_Y && productsInPage > 0) {
            page++;
            slide = pptx.addSlide();
            slides.push(slide);
            addStandardHeader(slide, c, 'Infraestrutura &', 'Hardware', undefined, '');
            curY = 1.7;
            productsInPage = 0;
        }

        // Parent product name with quantity prefix
        const qtyPrefix = product.quantity && product.quantity > 0 ? `${product.quantity} x ` : '';
        const name = qtyPrefix + (simplify[product.name] || product.display_name || product.name || 'Produto');

        // Draw card background
        slide.addShape('roundRect', { 
            x: 0.5, 
            y: curY, 
            w: 9, 
            h: cardH, 
            fill: { color: productsInPage % 2 === 0 ? 'f8fafc' : 'FFFFFF' }, 
            line: { color: c.border, width: 0.5 }, 
            rectRadius: 0.05 
        });

        // Left accent stripe
        slide.addShape('rect', { 
            x: 0.5, 
            y: curY, 
            w: 0.06, 
            h: cardH, 
            fill: { color: c.primary } 
        });

        // Product Title
        slide.addText(name, { 
            x: 0.7, 
            y: curY + 0.1, 
            w: 8.5, 
            h: 0.22, 
            fontSize: 10, 
            bold: true, 
            color: c.primary, 
            fontFace: FONT 
        });

        // Spec bullets
        displaySpecs.forEach((spec, sIdx) => {
            const specY = curY + 0.35 + (sIdx * 0.16);
            // Draw bullet marker
            slide.addShape('ellipse', { 
                x: 0.75, 
                y: specY + 0.06, 
                w: 0.04, 
                h: 0.04, 
                fill: { color: c.accent } 
            });
            // Draw text next to bullet
            slide.addText(spec, { 
                x: 0.85, 
                y: specY, 
                w: 8.3, 
                h: 0.16, 
                fontSize: 8.5, 
                color: c.textMuted, 
                fontFace: FONT 
            });
        });

        curY += cardH + 0.15;
        productsInPage++;
    });

    // Update page numbers across all created hardware slides
    const totalPages = slides.length;
    slides.forEach((s, idx) => {
        const pageInfo = totalPages > 1 ? `(${idx + 1}/${totalPages})` : '';
        // Re-apply standard header with correct page info (the simple addStandardHeader call in loop was blank)
        addStandardHeader(s, c, 'Infraestrutura &', 'Hardware', undefined, pageInfo);
        addFooter(s, c, `Infodive IT Solutions - Pag ${idx + 1} de ${totalPages}`);
    });

    return slides;
}

// ─── Software Slides ────────────────────────────────────────────────────────
export interface SoftwareData {
    deal: Deal;
    simplifiedProductNames?: Record<string, string>;
    primaryColor?: string;
    accentColor?: string;
}

export function buildSoftwareSlides(pptx: pptxgen, data: SoftwareData): pptxgen.Slide[] {
    const c = getColors(data.primaryColor, data.accentColor);
    const slides: pptxgen.Slide[] = [];
    const allProducts = data.deal.deal_products || [];
    const simplify = data.simplifiedProductNames || {};

    const swProducts = allProducts.filter(p => isSoftware(p) && p.is_visible_on_proposal !== false);
    const deduped = swProducts.filter((p, i, s) => i === s.findIndex(t => t.name === p.name));
    if (deduped.length === 0) return slides;

    const slide = pptx.addSlide();
    slides.push(slide);
    addStandardHeader(slide, c, 'Software &', 'Licenciamento');

    deduped.slice(0, 8).forEach((product, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 0.5 + col * 4.6;
        const y = 1.7 + row * 0.85;
        const name = simplify[product.name] || product.display_name || product.name || 'Software';

        slide.addShape('roundRect', { x, y, w: 4.3, h: 0.7, fill: { color: 'f8fafc' }, line: { color: c.border, width: 0.5 }, rectRadius: 0.06 });
        slide.addText(name, { x: x + 0.15, y: y + 0.05, w: 4, h: 0.25, fontSize: 9, bold: true, color: c.primary, fontFace: FONT });

        let desc = '';
        try {
            const parsed = JSON.parse(product.description || product.tech_details || '[]');
            if (Array.isArray(parsed)) {
                desc = parsed.slice(0, 2).map((d: any) => {
                    if (typeof d === 'string') return d;
                    const label = d.label || d.title || d.name || '';
                    const val = d.description || d.value || d.text || '';
                    if (label && val) return `${label}: ${val}`;
                    return label || val || '';
                }).filter(Boolean).join(' | ');
            }
        } catch { desc = String(product.description || '').substring(0, 80); }
        if (desc) slide.addText(desc, { x: x + 0.15, y: y + 0.33, w: 4, h: 0.3, fontSize: 8, color: c.textMuted, fontFace: FONT, valign: 'top' });
    });

    addFooter(slide, c, 'Infodive IT Solutions - Software & Licenciamento');
    return slides;
}
