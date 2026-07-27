import { 
    Document, 
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
    Footer
} from 'docx';

// Infodive Brand Colors
const COLORS = {
    primary: "1E3A5F", // Deep Blue
    accent: "E31837",  // Power Red
    text: "334155",    // Slate
    light: "F8FAFC",   // Ghost White
    border: "E2E8F0"   // Border Gray
};

interface DocxBuilderData {
    exportData: any;
    proposal: any;
    logoBuffer: Uint8Array | null;
    dataCenterBuffer: Uint8Array | null;
    clientLogoBuffer: Uint8Array | null;
}

/**
 * PremiumDocxBuilder structures and formats commercial proposal Word documents.
 */
export class PremiumDocxBuilder {
    static build({
        exportData,
        proposal,
        logoBuffer,
        dataCenterBuffer,
        clientLogoBuffer
    }: DocxBuilderData): Document {
        const children: any[] = [];
        const { isSectionActive, mainProducts, optionBlocks, billingGroups, quoteDisplayMode: displayMode } = exportData;

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
                            text: (exportData.title || proposal.title || "Proposta de Solução de Infraestrutura e Licenciamento").toUpperCase(),
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
                                    children: [new Paragraph({ children: [new TextRun({ text: exportData.title || proposal.title || '', color: "64748B", size: 22 })] })],
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

            if (exportData.aiSummary) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: exportData.aiSummary, size: 22, color: COLORS.text })],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 600, line: 360 },
                    })
                );
            }

            if (exportData.objectives && exportData.objectives.length > 0) {
                children.push(
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 300 },
                        children: [new TextRun({ text: "Objetivos Estratégicos", color: COLORS.primary, bold: true, size: 28 })]
                    })
                );

                exportData.objectives.forEach((obj: any) => {
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
            const hwProducts = mainProducts.filter((p: any) => p.categoryLabel !== 'software');

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
                                                        new TextRun({ text: p.displayName, bold: true, size: 20, color: COLORS.text }),
                                                        new TextRun({ text: p.sku ? `\nSKU: ${p.sku}` : '', size: 16, color: "64748B" })
                                                    ]
                                                })
                                            ],
                                            verticalAlign: VerticalAlign.CENTER,
                                            margins: { left: 200 }
                                        }),
                                        new TableCell({ 
                                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(p.quantity || 1), size: 20, bold: true })] })],
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
                                                        children: details.map((d: any) => new Paragraph({
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
            const swProducts = mainProducts.filter((p: any) => p.categoryLabel === 'software');

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
                            new TextRun({ text: p.displayName, bold: true, size: 22, color: COLORS.primary }),
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
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 400 },
                    children: [
                        new TextRun({ text: "04. ", color: COLORS.accent, bold: true }),
                        new TextRun({ text: "Resumo do Investimento", color: COLORS.primary, bold: true })
                    ]
                })
            );

            // Helper: build investment table for a product set
            const buildInvestmentTable = (prods: any[], totalLabel: string, pricingSuffix?: string, pricingModel?: string) => {
                const sortedProds = prods;
                const hasMonthly = sortedProds.some(p => p.pricingModel === 'monthly');
                
                const total = sortedProds.reduce((acc: number, p: any) => {
                    const val = p.unitPrice * p.quantity;
                    return acc + (p.pricingModel === 'monthly' ? val * 12 : val);
                }, 0);

                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary },
                        left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
                        right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                new TableCell({ 
                                    shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
                                    children: [new Paragraph({ children: [new TextRun({ text: "ITEM / DESCRIÇÃO", bold: true, color: COLORS.primary, size: 16 })], alignment: AlignmentType.LEFT })] 
                                }),
                                new TableCell({ 
                                    shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
                                    children: [new Paragraph({ children: [new TextRun({ text: "QTD", bold: true, color: COLORS.primary, size: 16 })], alignment: AlignmentType.CENTER })], 
                                    width: { size: 8, type: WidthType.PERCENTAGE } 
                                }),
                                new TableCell({ 
                                    shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
                                    children: [new Paragraph({ children: [new TextRun({ text: "UNITÁRIO", bold: true, color: COLORS.primary, size: 16 })], alignment: AlignmentType.RIGHT })], 
                                    width: { size: 15, type: WidthType.PERCENTAGE } 
                                }),
                                new TableCell({ 
                                    shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
                                    children: [new Paragraph({ children: [new TextRun({ text: hasMonthly ? "MENSAL" : "TOTAL", bold: true, color: COLORS.primary, size: 16 })], alignment: AlignmentType.RIGHT })], 
                                    width: { size: 15, type: WidthType.PERCENTAGE } 
                                }),
                                ...(hasMonthly ? [
                                    new TableCell({ 
                                        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "ANUAL", bold: true, color: COLORS.primary, size: 16 })], alignment: AlignmentType.RIGHT })], 
                                        width: { size: 15, type: WidthType.PERCENTAGE } 
                                    })
                                ] : []),
                            ],
                        }),
                        ...sortedProds.flatMap((p: any, idx: number) => {
                            const isMonthly = p.pricingModel === 'monthly';
                            const unitPrice = p.unitPrice || 0;
                            const qty = p.quantity || 1;
                            const rowTotal = unitPrice * qty;
                            const annualTotal = isMonthly ? rowTotal * 12 : rowTotal;
                            const bgColor = idx % 2 === 0 ? "FFFFFF" : "FCFDFF";

                            const formatVal = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

                            return [
                                new TableRow({
                                    children: [
                                        new TableCell({ 
                                            shading: { fill: bgColor, type: ShadingType.CLEAR },
                                            children: [
                                                new Paragraph({ 
                                                    spacing: { before: 80, after: 40 },
                                                    children: [new TextRun({ text: p.displayName, size: 18, bold: true, color: COLORS.primary })]
                                                }),
                                                new Paragraph({
                                                    spacing: { before: 20, after: 80 },
                                                    children: [
                                                        ...(p.sku ? [new TextRun({ text: `[SKU: ${p.sku}] `, size: 14, color: COLORS.accent, bold: true })] : []),
                                                        ...(p.description ? [new TextRun({ text: p.description, size: 16, color: "64748B" })] : [])
                                                    ]
                                                })
                                            ],
                                            margins: { left: 100 }
                                        }),
                                        new TableCell({ 
                                            shading: { fill: bgColor, type: ShadingType.CLEAR },
                                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(qty), size: 18, color: COLORS.text })], spacing: { before: 100 } })],
                                        }),
                                        new TableCell({ 
                                            shading: { fill: bgColor, type: ShadingType.CLEAR },
                                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatVal(unitPrice), size: 16, color: "64748B" })], spacing: { before: 100 } })],
                                        }),
                                        new TableCell({ 
                                            shading: { fill: bgColor, type: ShadingType.CLEAR },
                                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatVal(rowTotal), size: 18, bold: true, color: COLORS.primary })], spacing: { before: 100 } })],
                                        }),
                                        ...(hasMonthly ? [
                                            new TableCell({ 
                                                shading: { fill: bgColor, type: ShadingType.CLEAR },
                                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatVal(annualTotal), size: 18, bold: true, color: isMonthly ? "059669" : COLORS.primary })], spacing: { before: 100 } })],
                                            })
                                        ] : []),
                                    ],
                                })
                            ];
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    shading: { fill: COLORS.light, type: ShadingType.CLEAR },
                                    columnSpan: hasMonthly ? 4 : 3,
                                    children: [new Paragraph({ children: [new TextRun({ text: totalLabel, bold: true, color: COLORS.primary, size: 18 })] })],
                                    margins: { left: 100 }
                                }),
                                new TableCell({ 
                                    shading: { fill: COLORS.light, type: ShadingType.CLEAR },
                                    children: [new Paragraph({ 
                                        alignment: AlignmentType.RIGHT,
                                        children: [new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total), bold: true, color: COLORS.accent, size: 22 })]
                                    })],
                                    margins: { right: 100 }
                                }),
                            ],
                        }),
                    ],
                });
            };

            // Determine display mode
            if (displayMode === 'options' && optionBlocks && optionBlocks.length > 0) {
                optionBlocks.forEach((block: any, idx: number) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    children.push(
                        new Paragraph({
                            spacing: { before: 300, after: 200 },
                            children: [
                                new TextRun({ text: `OPÇÃO ${optionLetter}  `, bold: true, color: COLORS.accent, size: 22 }),
                                new TextRun({ text: block.title, bold: true, color: COLORS.primary, size: 22 }),
                            ]
                        }),
                        buildInvestmentTable(block.products, `INVESTIMENTO OPÇÃO ${optionLetter}`)
                    );
                });
            } else {
                const oneTimeProducts = mainProducts.filter((p: any) => !p.pricingModel || p.pricingModel === 'one_time');
                const monthlyProducts = mainProducts.filter((p: any) => p.pricingModel === 'monthly');
                const annualProducts = mainProducts.filter((p: any) => p.pricingModel === 'annual');
                const hasRecurring = monthlyProducts.length > 0 || annualProducts.length > 0;

                if (!hasRecurring) {
                    children.push(buildInvestmentTable(mainProducts, "INVESTIMENTO TOTAL ESTIMADO"));
                } else {
                    if (oneTimeProducts.length > 0) {
                        children.push(
                            new Paragraph({
                                spacing: { before: 300, after: 100 },
                                children: [new TextRun({ text: "💰 INVESTIMENTO ÚNICO", bold: true, color: COLORS.primary, size: 22 })]
                            }),
                            buildInvestmentTable(oneTimeProducts, "INVESTIMENTO TOTAL ÚNICO", undefined, "one_time")
                        );
                    }
                    if (monthlyProducts.length > 0) {
                        children.push(
                            new Paragraph({
                                spacing: { before: 300, after: 100 },
                                children: [new TextRun({ text: "🔄 INVESTIMENTO RECORRENTE MENSAL", bold: true, color: "0891b2", size: 22 })]
                            }),
                            buildInvestmentTable(monthlyProducts, "TOTAL / MÊS", "/mês", "monthly")
                        );
                    }
                    if (annualProducts.length > 0) {
                        children.push(
                            new Paragraph({
                                spacing: { before: 300, after: 100 },
                                children: [new TextRun({ text: "📅 INVESTIMENTO RECORRENTE ANUAL", bold: true, color: "d97706", size: 22 })]
                            }),
                            buildInvestmentTable(annualProducts, "TOTAL / ANO", "/ano", "annual")
                        );
                    }
                }
            }

            // 5.1 Billing Info
            if (billingGroups && billingGroups.length > 0) {
                children.push(
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [new TextRun({ text: "Informações de Faturamento", color: COLORS.primary, bold: true, size: 24 })]
                    })
                );

                billingGroups.forEach((group: any) => {
                    const { companyName, cnpj, paymentTerms, products: groupProducts } = group;
                    const uniqueProductNames = Array.from(new Set(groupProducts.map((p: any) => p.displayName)));

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
                                                        new TextRun({ text: companyName, bold: true, size: 22, color: COLORS.primary }),
                                                    ]
                                                }),
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({ text: "CNPJ: ", bold: true, size: 18, color: COLORS.text }),
                                                        new TextRun({ text: cnpj, size: 18, color: COLORS.text }),
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
                                                            text: uniqueProductNames.join(' • '), 
                                                            size: 16, 
                                                            color: COLORS.text,
                                                            bold: true
                                                        })
                                                    ]
                                                }),
                                                ...(paymentTerms ? [
                                                    new Paragraph({
                                                        spacing: { before: 200 },
                                                        children: [new TextRun({ text: "CONDIÇÕES DE PAGAMENTO:", bold: true, size: 18, color: COLORS.accent })]
                                                    }),
                                                    ...paymentTerms.split(';').map((term: string) => new Paragraph({
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

        // 6. Custom Notes
        if (isSectionActive('custom_notes')) {
            const customTitle = exportData.customNotesTitle || "Notas Adicionais";
            const customContent = exportData.customNotesContent || "";

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

        return new Document({
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
    }
}
