import pptxgen from 'pptxgenjs';
import { LOGO_BASE64, DATACENTER_BASE64, HANDSHAKE_BASE64 } from '@/components/proposals/pdf/pdfAssetsBase64';
import type { Deal, DealProduct } from '@/types/deal';
import { isSoftware, isHardware, isSupport, isService } from '@/utils/productClassification';

// ─── Theme & Layout Constants ───────────────────────────────────────────────
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const FONT = 'Arial';

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
        slide.addShape('roundRect', { x: 0.5, y: contentY, w: 9, h: 1.25, fill: { color: 'f8f9fa' }, line: { color: c.border, width: 0.5 }, rectRadius: 0.1 });
        slide.addText(data.aiSummary, { x: 0.7, y: contentY + 0.05, w: 8.6, h: 1.15, fontSize: 9, color: c.primary, fontFace: FONT, lineSpacingMultiple: 1.2, valign: 'top' });
        contentY += 1.4;
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
        slide.addShape('roundRect', { x: 0.5, y, w: 9, h: 0.85, fill: { color: d.bgColor }, line: { color, width: 1 }, rectRadius: 0.08 });
        slide.addText(d.icon, { x: 0.7, y, w: 0.6, h: 0.85, fontSize: 26, align: 'center', valign: 'middle' });
        slide.addText(d.title, { x: 1.4, y: y + 0.08, w: 7.8, h: 0.3, fontSize: 13, bold: true, color, fontFace: FONT });
        slide.addText(d.desc, { x: 1.4, y: y + 0.38, w: 7.8, h: 0.35, fontSize: 9, color: '4b5563', fontFace: FONT, lineSpacingMultiple: 1.2 });
    });

    // Banner
    slide.addShape('roundRect', { x: 0.5, y: 4.95, w: 9, h: 0.4, fill: { color: c.primary }, rectRadius: 0.08 });
    slide.addText([
        { text: 'Mais de 15 anos ', options: { fontSize: 10, bold: true, color: c.accent, fontFace: FONT } },
        { text: 'transformando infraestruturas de TI em vantagens competitivas', options: { fontSize: 10, color: 'FFFFFF', fontFace: FONT } },
    ], { x: 0.5, y: 4.95, w: 9, h: 0.4, align: 'center', valign: 'middle' });

    return slide;
}

// ─── Custom Notes Slide ─────────────────────────────────────────────────────
export function buildCustomNotesSlide(pptx: pptxgen, title: string, content: string, primaryColor?: string, accentColor?: string) {
    if (!content?.trim()) return null;
    const c = getColors(primaryColor, accentColor);
    const slide = pptx.addSlide();
    addStandardHeader(slide, c, title || 'Notas', 'Adicionais');
    slide.addText(content, { x: 0.5, y: 1.7, w: 9, h: 3.5, fontSize: 10, color: '334155', fontFace: FONT, lineSpacingMultiple: 1.4, valign: 'top', paraSpaceAfter: 6 });
    addFooter(slide, c, 'Infodive IT Solutions');
    return slide;
}

// ─── Investment Slide(s) ────────────────────────────────────────────────────
export interface InvestmentData {
    deal: Deal;
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

    const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: products[0]?.is_usd ? 'USD' : 'BRL'
    }).format(v);

    const ROW_H = 0.28;
    const TABLE_X = 0.5;
    const TABLE_W = 9;
    const COL_W: number[] = [0.4, 4.5, 0.6, 1.6, 1.9];
    const MAX_Y = SLIDE_H - 0.5; // leave room for footer

    // Helper: build table rows for a product set
    const buildTableRows = (prods: DealProduct[], label?: string, pricingSuffix?: string, pricingModel?: string) => {
        const headerRow: pptxgen.TableRow = [
            { text: '#', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, align: 'center' } },
            { text: 'Produto / Serviço', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT } },
            { text: 'Qtd', options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, align: 'center' } },
            { text: `Valor Unit.${pricingSuffix ? ` ${pricingSuffix}` : ''}`, options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, align: 'right' } },
            { text: `Total${pricingSuffix ? ` ${pricingSuffix}` : ''}`, options: { fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, align: 'right' } },
        ];

        const dataRows: pptxgen.TableRow[] = prods.map((p, i) => {
            let name = simplify[p.name] || p.display_name || p.name || 'Item';
            if (p.duration && p.duration_unit) {
                const isRecurring = pricingModel === 'monthly' || pricingModel === 'annual';
                name += `\n${isRecurring ? '(Contrato de ' : '(Válido por '}${p.duration} ${p.duration_unit})`;
            }
            const qty = p.quantity || 1;
            const unit = p.unit_price || 0;
            const total = unit * qty;
            const bgColor = i % 2 === 0 ? 'f8fafc' : 'FFFFFF';
            return [
                { text: String(i + 1), options: { fontSize: 8, color: c.textMuted, fontFace: FONT, align: 'center', fill: { color: bgColor } } },
                { text: name, options: { fontSize: 8, color: c.textDark, fontFace: FONT, fill: { color: bgColor } } },
                { text: String(qty), options: { fontSize: 8, color: c.textDark, fontFace: FONT, align: 'center', fill: { color: bgColor } } },
                { text: formatCurrency(unit), options: { fontSize: 8, color: c.textDark, fontFace: FONT, align: 'right', fill: { color: bgColor } } },
                { text: formatCurrency(total), options: { fontSize: 8, bold: true, color: c.textDark, fontFace: FONT, align: 'right', fill: { color: bgColor } } },
            ];
        });

        const grandTotal = prods.reduce((s, p) => s + ((p.unit_price || 0) * (p.quantity || 1)), 0);
        const totalLabel = label ? `TOTAL ${label.toUpperCase()}` : pricingSuffix ? `TOTAL ${pricingSuffix.toUpperCase().trim()}` : 'TOTAL CONSOLIDADO';
        const totalRow: pptxgen.TableRow = [
            { text: '', options: { fill: { color: c.primary } } },
            { text: totalLabel, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, colspan: 2 } },
            { text: '', options: { fill: { color: c.primary } } },
            { text: '', options: { fill: { color: c.primary } } },
            { text: formatCurrency(grandTotal), options: { fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: c.primary }, fontFace: FONT, align: 'right' } },
        ];

        return { rows: [headerRow, ...dataRows, totalRow], height: (prods.length + 2) * ROW_H };
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
            const { rows, height: tableH } = buildTableRows(block.prods, block.label);
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
            slide.addText(block.label.toUpperCase(), { x: TABLE_X, y: curY, w: 0.7, h: 0.22, fontSize: 7, bold: true, color: 'FFFFFF', fontFace: FONT, align: 'center', valign: 'middle' });
            slide.addText(block.displayName, { x: TABLE_X + 0.8, y: curY, w: 8, h: 0.22, fontSize: 9, bold: true, color: c.primary, fontFace: FONT, valign: 'middle' });
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
        // Consolidated view with pricing model grouping
        const oneTimeProducts = mainProducts.filter(p => !p.pricing_model || p.pricing_model === 'one_time');
        const monthlyProducts = mainProducts.filter(p => p.pricing_model === 'monthly');
        const annualProducts = mainProducts.filter(p => p.pricing_model === 'annual');
        const hasRecurring = monthlyProducts.length > 0 || annualProducts.length > 0;

        if (!hasRecurring) {
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
        } else {
            // Grouped blocks
            const blocks: { prods: DealProduct[], suffix?: string, model: string, titleColor: string, titleText: string }[] = [];
            if (oneTimeProducts.length > 0) blocks.push({ prods: oneTimeProducts, model: 'one_time', titleColor: c.primary, titleText: 'INVESTIMENTO ÚNICO' });
            if (monthlyProducts.length > 0) blocks.push({ prods: monthlyProducts, suffix: '/mês', model: 'monthly', titleColor: '0891b2', titleText: 'INVESTIMENTO RECORRENTE MENSAL' });
            if (annualProducts.length > 0) blocks.push({ prods: annualProducts, suffix: '/ano', model: 'annual', titleColor: 'd97706', titleText: 'INVESTIMENTO RECORRENTE ANUAL' });

            let slide = pptx.addSlide();
            slides.push(slide);
            addStandardHeader(slide, c, 'Estrutura de', 'Investimento');

            let curY = 1.7;

            blocks.forEach((block) => {
                const { rows, height: tableH } = buildTableRows(block.prods, undefined, block.suffix, block.model);
                const labelH = 0.3;

                // Overflow check
                if (curY + labelH + tableH > MAX_Y) {
                    slide = pptx.addSlide();
                    slides.push(slide);
                    addStandardHeader(slide, c, 'Estrutura de', 'Investimento', '(Continuação)');
                    curY = 1.7;
                }

                // Badge
                slide.addShape('roundRect', { x: TABLE_X, y: curY, w: 2.8, h: 0.22, fill: { color: block.titleColor }, rectRadius: 0.05 });
                slide.addText(block.titleText, { x: TABLE_X + 0.05, y: curY, w: 2.7, h: 0.22, fontSize: 8, bold: true, color: 'FFFFFF', fontFace: FONT });
                curY += labelH;

                slide.addTable(rows, {
                    x: TABLE_X, y: curY, w: TABLE_W,
                    colW: COL_W, rowH: ROW_H,
                    border: { type: 'solid', pt: 0.3, color: c.border },
                    margin: [2, 4, 2, 4],
                });
                curY += tableH + 0.15;
            });

            addFooter(slide, c, 'Infodive IT Solutions - Resumo de Investimento');
        }
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

    const productsPerPage = 4;
    for (let page = 0; page * productsPerPage < deduped.length; page++) {
        const chunk = deduped.slice(page * productsPerPage, (page + 1) * productsPerPage);
        const totalPages = Math.ceil(deduped.length / productsPerPage);
        const pageInfo = totalPages > 1 ? `(${page + 1}/${totalPages})` : '';
        const slide = pptx.addSlide();
        slides.push(slide);
        addStandardHeader(slide, c, 'Infraestrutura &', 'Hardware', undefined, pageInfo);

        chunk.forEach((product, idx) => {
            const y = 1.7 + idx * 0.85;
            const name = simplify[product.name] || product.display_name || product.name || 'Produto';
            slide.addShape('roundRect', { x: 0.5, y, w: 9, h: 0.75, fill: { color: idx % 2 === 0 ? 'f8fafc' : 'FFFFFF' }, line: { color: c.border, width: 0.5 }, rectRadius: 0.05 });
            slide.addText(name, { x: 0.7, y: y + 0.1, w: 8.5, h: 0.22, fontSize: 10, bold: true, color: c.primary, fontFace: FONT });

            let descText = '';
            try {
                const parsed = JSON.parse(product.description || product.tech_details || '[]');
                if (Array.isArray(parsed)) {
                    descText = parsed.slice(0, 3).map((d: any) => {
                        if (typeof d === 'string') return d;
                        const label = d.label || d.title || d.name || '';
                        const val = d.description || d.value || d.text || '';
                        if (label && val) return `${label}: ${val}`;
                        return label || val || '';
                    }).filter(Boolean).join('  |  ');
                }
            } catch { descText = String(product.description || '').substring(0, 120); }
            if (descText) {
                slide.addText(descText, { x: 0.7, y: y + 0.4, w: 8.5, h: 0.25, fontSize: 8.5, color: c.textMuted, fontFace: FONT });
            }
        });

        addFooter(slide, c, `Infodive IT Solutions - Pag ${page + 1} de ${totalPages}`);
    }
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
