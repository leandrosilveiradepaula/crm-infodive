import { useState } from 'react';
import { toast } from 'sonner';
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    Table, 
    TableRow, 
    TableCell, 
    WidthType, 
    AlignmentType,
    VerticalAlign,
    PageBreak,
    ImageRun,
    BorderStyle,
    ShadingType,
    Header,
    Footer,
    TextWrappingType,
    TextWrappingSide
} from 'docx';
import { saveAs } from 'file-saver';
import { isHardware, isSoftware, isSupport, isService } from '@/utils/productClassification';

// Infodive Brand Colors
const COLORS = {
    primary: "1E3A5F", // Deep Blue
    accent: "E31837",  // Power Red
    text: "334155",    // Slate
    light: "F8FAFC",   // Ghost White
    border: "E2E8F0"   // Border Gray
};

export function useProposalDocx() {
    const [generatingDocx, setGeneratingDocx] = useState(false);

    const handleDownloadDocx = async (proposal: any) => {
        if (!proposal.content) {
            toast.error('Conteúdo da proposta não disponível para geração de DOCX.');
            return;
        }

        setGeneratingDocx(true);
        const toastId = toast.loading('Gerando Documento Word Premium...');

        try {
            const { 
                editableTexts = {}, 
                config = {}, 
                aiSummary, 
                objectives = [], 
                simplifiedProductNames = {},
                activeSections = []
            } = proposal.content;
            
            const products = proposal.products_json || [];

            const isSectionActive = (id: string) => {
                if (activeSections.length > 0) return activeSections.includes(id);
                if (id === 'cover') return config.includeCover !== false;
                if (id === 'overview') return config.includeOverview !== false;
                if (id === 'hardware') return config.includeHardware !== false;
                if (id === 'software') return config.includeSoftware !== false;
                if (id === 'investment') return config.includeInvestment !== false;
                return true;
            };

            // Helper to load images safely
            const loadImage = async (url: string): Promise<Uint8Array | null> => {
                try {
                    // Ensure absolute URL for relative paths if in browser
                    const isBrowser = typeof window !== 'undefined';
                    const requestUrl = (isBrowser && url.startsWith('/')) ? `${window.location.origin}${url}` : url;
                    
                    const response = await fetch(requestUrl);
                    if (!response.ok) throw new Error(`Status: ${response.status}`);
                    const buffer = await response.arrayBuffer();
                    return new Uint8Array(buffer);
                } catch (error) {
                    console.error(`[useProposalDocx] Failed to load image from ${url}:`, error);
                    return null;
                }
            };

            const logoBuffer = await loadImage('/assets/logo-infodive.png');
            const dataCenterBuffer = await loadImage('/assets/datacenter-corridor.jpg');
            const clientLogoBuffer = config.clientLogo ? await loadImage(config.clientLogo) : null;

            const children: any[] = [];

            // 1. Cover Page
            if (isSectionActive('cover')) {
                // Left Column Content
                const leftSideChildren = [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            ...(logoBuffer ? [
                                new ImageRun({
                                    data: new Uint8Array(logoBuffer),
                                    transformation: { width: 160, height: 48 },
                                    type: "png"
                                })
                            ] : [])
                        ],
                        spacing: { after: 1200 }
                    }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.LEFT,
                        children: [
                            new TextRun({
                                text: (editableTexts.proposalTitle || proposal.title || "Proposta de Solução de Infraestrutura e Licenciamento").toUpperCase(),
                                bold: true,
                                size: 56, // 28pt
                                color: COLORS.primary,
                                font: "Arial",
                            })
                        ],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                            new TextRun({
                                text: `Infodive IT - Soluções Inteligentes`,
                                size: 28, // 14pt
                                color: COLORS.accent,
                                bold: true,
                                font: "Arial"
                            }),
                        ],
                        spacing: { after: 2000 }
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        },
                        margins: { top: 200, bottom: 200 },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Projeto", bold: true, color: "1E293B", size: 22 })] })],
                                    }),
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: editableTexts.proposalTitle || proposal.title || '', color: "64748B", size: 22 })] })],
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Cliente", bold: true, color: "1E293B", size: 22 })] })],
                                    }),
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: proposal.company_name || 'Cliente', color: "64748B", size: 22 })] })],
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Responsável", bold: true, color: "1E293B", size: 22 })] })],
                                    }),
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Infodive IT", color: "64748B", size: 22 })] })],
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Data", bold: true, color: "1E293B", size: 22 })] })],
                                    }),
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString('pt-BR'), color: "64748B", size: 22 })] })],
                                    }),
                                ]
                            }),
                            ...(proposal.number ? [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            width: { size: 30, type: WidthType.PERCENTAGE },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Nº Proposta", bold: true, color: "1E293B", size: 22 })] })],
                                        }),
                                        new TableCell({
                                            width: { size: 70, type: WidthType.PERCENTAGE },
                                            children: [new Paragraph({ children: [new TextRun({ text: proposal.number, bold: true, color: COLORS.accent, size: 22 })] })],
                                        }),
                                    ]
                                })
                            ] : [])
                        ]
                    })
                ];

                if (clientLogoBuffer) {
                    leftSideChildren.push(
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new ImageRun({
                                    data: new Uint8Array(clientLogoBuffer),
                                    transformation: { width: 120, height: 120 },
                                    type: "png"
                                })
                            ],
                            spacing: { before: 2000 }
                        })
                    );
                }

                // Create the Master 2-Column Table for the Cover Page
                const coverLayoutTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                // Left Cell (Text Content)
                                new TableCell({
                                    children: leftSideChildren,
                                    width: { size: 65, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: { right: 400 }
                                }),
                                // Right Cell (Data Center Image)
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: dataCenterBuffer ? [
                                                new ImageRun({
                                                    data: new Uint8Array(dataCenterBuffer),
                                                    transformation: { width: 320, height: 600 },
                                                    type: "jpg"
                                                })
                                            ] : []
                                        })
                                    ],
                                    width: { size: 35, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.CENTER
                                })
                            ]
                        })
                    ]
                });

                children.push(coverLayoutTable);
                children.push(new Paragraph({ children: [new PageBreak()] }));
            }

            // 2. Project Overview
            if (isSectionActive('overview')) {
                children.push(
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 400 },
                        children: [
                            new TextRun({ text: "01. ", color: COLORS.accent, bold: true }),
                            new TextRun({ text: "Visão Geral do Projeto", color: COLORS.primary, bold: true })
                        ]
                    })
                );

                if (aiSummary) {
                    children.push(
                        new Paragraph({
                            children: [new TextRun({ text: aiSummary, size: 22, color: COLORS.text })],
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 600, line: 360 },
                        })
                    );
                }

                if (objectives.length > 0) {
                    children.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 300 },
                            children: [new TextRun({ text: "Objetivos Estratégicos", color: COLORS.primary, bold: true, size: 28 })]
                        })
                    );

                    objectives.forEach((obj: any) => {
                        children.push(
                            new Paragraph({
                                spacing: { before: 200, after: 100 },
                                children: [
                                    new TextRun({ text: `${obj.number || ''} `, color: COLORS.accent, bold: true, size: 24 }),
                                    new TextRun({ text: obj.title, bold: true, size: 24, color: COLORS.primary }),
                                ],
                            }),
                            new Paragraph({
                                spacing: { after: 300, line: 320 },
                                indent: { left: 400 },
                                children: [new TextRun({ text: obj.description, size: 21, color: "475569" })]
                            })
                        );
                    });
                }

                children.push(new Paragraph({ children: [new PageBreak()] }));
            }

            // 3. Hardware & Infrastructure
            if (isSectionActive('hardware')) {
                const hwProducts = products.filter((p: any) => 
                    (isHardware(p) || isSupport(p) || isService(p)) && p.is_visible_on_proposal !== false
                );

                if (hwProducts.length > 0) {
                    children.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 400, after: 400 },
                            children: [
                                new TextRun({ text: "02. ", color: COLORS.accent, bold: true }),
                                new TextRun({ text: "Especificação Técnica", color: COLORS.primary, bold: true })
                            ]
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 150, bottom: 150, left: 200, right: 200 },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                                left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                                right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            },
                            rows: [
                                new TableRow({
                                    tableHeader: true,
                                    height: { value: 400, rule: "atLeast" },
                                    children: [
                                        new TableCell({ 
                                            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                                            children: [new Paragraph({ 
                                                children: [new TextRun({ text: "DESCRIÇÃO DO ITEM", bold: true, color: "FFFFFF", size: 18 })],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            verticalAlign: VerticalAlign.CENTER
                                        }),
                                        new TableCell({ 
                                            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                                            children: [new Paragraph({ 
                                                children: [new TextRun({ text: "QTD", bold: true, color: "FFFFFF", size: 18 })],
                                                alignment: AlignmentType.CENTER
                                            })], 
                                            width: { size: 15, type: WidthType.PERCENTAGE },
                                            verticalAlign: VerticalAlign.CENTER
                                        }),
                                    ],
                                }),
                                ...hwProducts.flatMap((p: any) => {
                                    const row = new TableRow({
                                        children: [
                                            new TableCell({ 
                                                children: [
                                                    new Paragraph({ 
                                                        spacing: { before: 120, after: 120 },
                                                        children: [
                                                            new TextRun({ text: simplifiedProductNames[p.name] || p.display_name || p.name, bold: true, size: 20, color: COLORS.text }),
                                                            new TextRun({ text: p.sku ? `\nSKU: ${p.sku}` : '', size: 16, color: "64748B" })
                                                        ]
                                                    })
                                                ],
                                                verticalAlign: VerticalAlign.CENTER,
                                                margins: { left: 200 }
                                            }),
                                            new TableCell({ 
                                                children: [new Paragraph({ text: String(p.quantity || 1), alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(p.quantity || 1), size: 20, bold: true })] })],
                                                verticalAlign: VerticalAlign.CENTER
                                            }),
                                        ],
                                    });

                                    const detailRows: TableRow[] = [];
                                    if (p.tech_details) {
                                        try {
                                            const details = typeof p.tech_details === 'string' ? JSON.parse(p.tech_details) : p.tech_details;
                                            if (Array.isArray(details) && details.length > 0) {
                                                detailRows.push(new TableRow({
                                                    children: [
                                                        new TableCell({
                                                            columnSpan: 2,
                                                            margins: { left: 400, bottom: 100 },
                                                            children: details.map(d => new Paragraph({
                                                                spacing: { before: 20, after: 20 },
                                                                children: [
                                                                    new TextRun({ text: `• ${d.label || d.grid_label || 'Info'}: `, bold: true, size: 16, color: "64748B" }),
                                                                    new TextRun({ text: d.description || d.value || '', size: 16, color: "475569" })
                                                                ]
                                                            }))
                                                        })
                                                    ]
                                                }));
                                            }
                                        } catch (e) {}
                                    }

                                    return [row, ...detailRows];
                                })
                            ],
                        })
                    );
                    children.push(new Paragraph({ children: [new PageBreak()] }));
                }
            }

            // 4. Software & Licensing
            if (isSectionActive('software')) {
                const swProducts = products.filter((p: any) => isSoftware(p) && p.is_visible_on_proposal !== false);

                if (swProducts.length > 0) {
                    children.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 400, after: 400 },
                            children: [
                                new TextRun({ text: "03. ", color: COLORS.accent, bold: true }),
                                new TextRun({ text: "Software & Licenciamento", color: COLORS.primary, bold: true })
                            ]
                        }),
                        ...swProducts.map((p: any) => new Paragraph({
                            children: [
                                new TextRun({ text: "■  ", color: COLORS.accent, bold: true }),
                                new TextRun({ text: simplifiedProductNames[p.name] || p.display_name || p.name, bold: true, size: 22, color: COLORS.primary }),
                                new TextRun({ text: ` (Quantidade: ${p.quantity || 1})`, size: 20, color: "64748B" })
                            ],
                            spacing: { before: 200, after: 100 },
                        }))
                    );
                    children.push(new Paragraph({ children: [new PageBreak()] }));
                }
            }

            // 5. Investment
            if (isSectionActive('investment')) {
                const mainProducts = products.filter((p: any) => !p.is_optional && p.is_visible_on_proposal !== false);
                const total = mainProducts.reduce((acc: number, p: any) => acc + (p.unit_price || 0) * (p.quantity || 1), 0);
                
                children.push(
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 400 },
                        children: [
                            new TextRun({ text: "04. ", color: COLORS.accent, bold: true }),
                            new TextRun({ text: "Resumo do Investimento", color: COLORS.primary, bold: true })
                        ]
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        margins: { top: 150, bottom: 150, left: 200, right: 200 },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                            left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                            right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    new TableCell({ 
                                        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "ITEM", bold: true, color: "FFFFFF", size: 18 })], alignment: AlignmentType.CENTER })] 
                                    }),
                                    new TableCell({ 
                                        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "INVESTIMENTO", bold: true, color: "FFFFFF", size: 18 })], alignment: AlignmentType.CENTER })], 
                                        width: { size: 30, type: WidthType.PERCENTAGE } 
                                    }),
                                ],
                            }),
                            ...mainProducts.map((p: any) => new TableRow({
                                children: [
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            spacing: { before: 100, after: 100 },
                                            children: [new TextRun({ text: simplifiedProductNames[p.name] || p.display_name || p.name, size: 20 })]
                                        })],
                                        margins: { left: 200 }
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((p.unit_price || 0) * (p.quantity || 1)), size: 20, bold: true })]
                                        })],
                                        margins: { right: 200 }
                                    }),
                                ],
                            })),
                            new TableRow({
                                children: [
                                    new TableCell({ 
                                        shading: { fill: COLORS.light, type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "INVESTIMENTO TOTAL ESTIMADO", bold: true, color: COLORS.primary, size: 22 })] })],
                                        margins: { left: 200 }
                                    }),
                                    new TableCell({ 
                                        shading: { fill: COLORS.light, type: ShadingType.CLEAR },
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total), bold: true, color: COLORS.accent, size: 24 })]
                                        })],
                                        margins: { right: 200 }
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // 5.1 Billing Info
                const showBilling = config?.showBillingInfo !== false;
                if (showBilling && !config?.isPriceStudy) {
                    const billingOverrides = config.billingOverrides || {};
                    const usedDistIds = [...new Set(mainProducts.map((p: any) => p.distributor_id).filter(Boolean))];
                    
                    if (usedDistIds.length > 0) {
                        children.push(
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: 400, after: 200 },
                                children: [new TextRun({ text: "Informações de Faturamento", color: COLORS.primary, bold: true, size: 24 })]
                            })
                        );

                        usedDistIds.forEach((distId: any) => {
                            const override = billingOverrides[distId];
                            const productInGroup = mainProducts.find((p: any) => p.distributor_id === distId);
                            const displayName = override?.selectedBranchName || productInGroup?.distributor_name || "Distribuidor";
                            const displayCnpj = override?.selectedCnpj || productInGroup?.distributor_cnpj || "";
                            const displayTerms = override?.paymentTerms;

                            children.push(
                                new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                                        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                                        left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.accent },
                                        right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
                                    },
                                    rows: [
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    shading: { fill: COLORS.light, type: ShadingType.CLEAR },
                                                    children: [
                                                        new Paragraph({
                                                            children: [
                                                                new TextRun({ text: "FATURAMENTO DIRETO: ", bold: true, size: 16, color: COLORS.accent }),
                                                                new TextRun({ text: displayName, bold: true, size: 22, color: COLORS.primary }),
                                                            ]
                                                        }),
                                                        new Paragraph({
                                                            children: [
                                                                new TextRun({ text: "CNPJ: ", bold: true, size: 18, color: COLORS.text }),
                                                                new TextRun({ text: displayCnpj, size: 18, color: COLORS.text }),
                                                            ]
                                                        }),
                                                        // List of products in this billing
                                                        new Paragraph({
                                                            spacing: { before: 200 },
                                                            children: [new TextRun({ text: "PRODUTOS NESTE FATURAMENTO:", bold: true, size: 16, color: "64748B" })]
                                                        }),
                                                        new Paragraph({
                                                            children: [
                                                                new TextRun({ 
                                                                    text: Array.from(new Set(
                                                                        mainProducts
                                                                            .filter((p: any) => p.distributor_id === distId)
                                                                            .map((p: any) => {
                                                                                const name = (simplifiedProductNames[p.name] || p.display_name || p.name || '').toString();
                                                                                // High-resilience normalization for Comparison: lowercase & single spaces
                                                                                return name.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]+/g, ' ').trim();
                                                                            })
                                                                            .filter(Boolean)
                                                                        )).reduce((acc: string[], curr: any) => {
                                                                            const val = String(curr);
                                                                            const clean = val.toLowerCase();
                                                                            if (!acc.some(n => n.toLowerCase() === clean)) {
                                                                                acc.push(val);
                                                                            }
                                                                            return acc;
                                                                        }, []).join(' • '), 
                                                                    size: 16, 
                                                                    color: COLORS.text,
                                                                    bold: true
                                                                })
                                                            ]
                                                        }),
                                                        ...(displayTerms ? [
                                                            new Paragraph({
                                                                spacing: { before: 200 },
                                                                children: [new TextRun({ text: "CONDIÇÕES DE PAGAMENTO:", bold: true, size: 18, color: COLORS.accent })]
                                                            }),
                                                            ...displayTerms.split(';').map((term: string) => new Paragraph({
                                                                children: [new TextRun({ text: `• ${term.trim()}`, size: 18, color: COLORS.text })],
                                                                indent: { left: 400 }
                                                            }))
                                                        ] : [])
                                                    ],
                                                    margins: { top: 200, bottom: 200, left: 200, right: 200 }
                                                })
                                            ]
                                        })
                                    ]
                                })
                            );
                            
                            // Add a small spacer after each table
                            children.push(new Paragraph({ spacing: { after: 200 } }));
                        });
                    }
                }
            }

            // 6. Custom Notes
            if (isSectionActive('custom_notes')) {
                const customTitle = editableTexts.customNotesTitle || "Notas Adicionais";
                const customContent = editableTexts.customNotesContent || "";

                if (customContent.trim()) {
                    children.push(new Paragraph({ children: [new PageBreak()] }));
                    children.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 400, after: 400 },
                            children: [
                                new TextRun({ text: "05. ", color: COLORS.accent, bold: true }),
                                new TextRun({ text: customTitle, color: COLORS.primary, bold: true })
                            ]
                        })
                    );

                    customContent.split('\n').filter((p: string) => p.trim() !== '').forEach((para: string) => {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: para, size: 20, color: COLORS.text })],
                            spacing: { before: 100, after: 100 },
                            alignment: AlignmentType.JUSTIFIED
                        }));
                    });
                }
            }

            const doc = new Document({
                title: proposal.title,
                creator: "Infodive Sales Engine",
                description: "Proposta Comercial",
                styles: {
                    default: {
                        heading1: { 
                            run: { size: 32, bold: true, color: COLORS.primary, font: "Arial" },
                            paragraph: { spacing: { before: 400, after: 200 } }
                        },
                        heading2: { 
                            run: { size: 28, bold: true, color: COLORS.accent, font: "Arial" },
                            paragraph: { spacing: { before: 300, after: 150 } }
                        },
                        document: { 
                            run: { size: 22, color: COLORS.text, font: "Arial" },
                            paragraph: { spacing: { line: 360, before: 100, after: 100 } }
                        }
                    }
                },
                sections: [{
                    properties: {
                        page: {
                            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
                        },
                    },
                    headers: {
                        default: new Header({
                            children: [
                                new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    borders: {
                                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.border }
                                    },
                                    rows: [
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    children: [new Paragraph({ children: [new TextRun({ text: "INFODIVE IT SOLUTIONS", bold: true, size: 18, color: COLORS.primary })] })],
                                                    verticalAlign: VerticalAlign.CENTER
                                                }),
                                                new TableCell({
                                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "CONFIDENCIAL", size: 18, color: "94A3B8" })] })],
                                                    verticalAlign: VerticalAlign.CENTER
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    borders: {
                                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        top: { style: BorderStyle.SINGLE, size: 12, color: COLORS.border }
                                    },
                                    rows: [
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    children: [new Paragraph({ children: [new TextRun({ text: "Infodive - Inteligência para o seu negócio", size: 18, color: "94A3B8" })] })],
                                                    verticalAlign: VerticalAlign.CENTER
                                                }),
                                                new TableCell({
                                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
                                                        new TextRun({ text: "Página ", size: 18, color: "94A3B8" }),
                                                        new TextRun({ children: ["PageNumber" as any], size: 18, color: COLORS.accent, bold: true })
                                                    ] })],
                                                    verticalAlign: VerticalAlign.CENTER
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    },
                    children: children
                }],
            });

            const buffer = await Packer.toBlob(doc);
            const filename = `Proposta-Infodive-${(proposal.company_name || proposal.title).replace(/[^a-zA-Z0-9]/g, '-')}.docx`;
            saveAs(buffer, filename);
            
            toast.success('Documento Word de Alta Fidelidade gerado!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar DOCX Premium:', error);
            toast.error('Falha ao gerar o Word Premium.', { id: toastId });
        } finally {
            setGeneratingDocx(false);
        }
    };

    return { generatingDocx, handleDownloadDocx };
}
