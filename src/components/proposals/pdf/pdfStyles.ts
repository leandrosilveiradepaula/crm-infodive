import { proposalDocumentPrimitives, proposalDocumentColors } from '@/design-system/proposal-document-colors';
import { StyleSheet, Font } from '@react-pdf/renderer';

// Disable hyphenation globally to prevent word breaking (e.g., "Stor-age")
Font.registerHyphenationCallback(word => [word]);

// ── Color Tokens ──────────────────────────────────────────────────────
export const defaultColors = proposalDocumentColors;

export type PdfColors = typeof defaultColors;
export const colors = defaultColors;

/**
 * Generates color tokens based on organization theme
 */
export function getPdfColors(themePrimary?: string, themeAccent?: string) {
    return {
        ...defaultColors,
        primary: themePrimary || defaultColors.primary,
        accent: themeAccent || themePrimary || defaultColors.accent, // Use primary as fallback for accent if not provided
    };
}

/**
 * Generates StyleSheet based on theme colors
 */
export function getPdfStyles(pdfColors = defaultColors) {
    return StyleSheet.create({
        page: {
            width: '210mm',
            backgroundColor: pdfColors.white,
            fontFamily: 'Helvetica',
            color: pdfColors.primary,
            position: 'relative',
            paddingTop: 40,
            paddingBottom: 60,
            paddingLeft: 60,
            paddingRight: 60,
        },
        pageContent: {
            padding: '40px 80px 10px 80px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
        },

        // ── Top Bar ──
        topBar: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            height: 6,
        },

        // ── Logo ──
        logo: {
            height: 42,
            width: 'auto' as const,
        },
        logoRow: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            alignItems: 'flex-start' as const,
            marginBottom: 20,
        },

        // ── Section Header ──
        sectionTitle: {
            fontSize: 28,
            fontWeight: 'bold' as const,
            color: pdfColors.primary,
            marginBottom: 8,
            letterSpacing: -0.5,
        },
        sectionTitleAccent: {
            color: pdfColors.accent,
        },
        titleUnderline: {
            width: 40,
            height: 4,
            backgroundColor: pdfColors.accent,
            borderRadius: 2,
            marginBottom: 16,
        },

        // ── Footer ──
        footer: {
            marginTop: 'auto' as const,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: pdfColors.borderLight,
            alignItems: 'center' as const,
        },
        footerText: {
            fontSize: 11,
            color: pdfColors.textMuted,
        },

        // ── Table ──
        tableHeader: {
            flexDirection: 'row' as const,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: pdfColors.bgLighter,
            borderBottomWidth: 1,
            borderBottomColor: pdfColors.border,
        },
        tableHeaderText: {
            fontSize: 9,
            fontWeight: 'bold' as const,
            color: pdfColors.accent,
            textTransform: 'uppercase' as const,
        },
        tableRow: {
            flexDirection: 'row' as const,
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderBottomWidth: 1,
            borderBottomColor: pdfColors.border,
            alignItems: 'center' as const,
        },
        tableCellText: {
            fontSize: 11,
            color: pdfColors.text,
            fontWeight: 'semibold' as const,
        },

        // ── Cards ──
        card: {
            backgroundColor: pdfColors.bgLight,
            padding: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: pdfColors.border,
        },

        // ── Metadata Row ──
        metaRow: {
            flexDirection: 'row' as const,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: pdfColors.border,
            alignItems: 'flex-start' as const,
        },
        metaLabel: {
            fontSize: 14,
            fontWeight: 'bold' as const,
            color: pdfColors.primary,
            width: 120,
        },
        metaValue: {
            fontSize: 14,
            color: pdfColors.textLight,
            flex: 1,
            lineHeight: 1.4,
        },
    });
}

// ── Shared Styles (Legacy/Default) ─────────────────────────────────────────────────────
export const styles = getPdfStyles(defaultColors);

// ── Gradient simulation (react-pdf doesn't support CSS gradients) ──
// We'll use a simple two-color approach: accent on left, primary on right
export const gradientBarColors = {
    left: colors.accent,
    right: colors.primary,
};

// ── Template Palettes ─────────────────────────────────────────────────
export type TemplatePalette = {
    primary: string;
    accent: string;
    headerBg: string;
    cardBg: string;
    cardBorder: string;
    label: string;
};

export const templatePalettes: Record<string, TemplatePalette> = {
    executivo: {
        primary: proposalDocumentPrimitives.defaultPrimary,
        accent: proposalDocumentPrimitives.defaultAccent,
        headerBg: proposalDocumentPrimitives.printNearWhite,
        cardBg: proposalDocumentPrimitives.printSteel50,
        cardBorder: proposalDocumentPrimitives.printSteelBorder,
        label: 'Executivo Master',
    },
    tecnico: {
        primary: proposalDocumentPrimitives.slate900,
        accent: proposalDocumentPrimitives.blue500,
        headerBg: proposalDocumentPrimitives.sky50,
        cardBg: proposalDocumentPrimitives.blue50,
        cardBorder: proposalDocumentPrimitives.blue200,
        label: 'Mergulho Técnico',
    },
    detalhado: {
        primary: proposalDocumentPrimitives.indigo900,
        accent: proposalDocumentPrimitives.violet600,
        headerBg: proposalDocumentPrimitives.purple50,
        cardBg: proposalDocumentPrimitives.violet50,
        cardBorder: proposalDocumentPrimitives.violet300,
        label: 'Especificação Detalhada',
    },
    rapido: {
        primary: proposalDocumentPrimitives.emerald900,
        accent: proposalDocumentPrimitives.emerald600,
        headerBg: proposalDocumentPrimitives.green50,
        cardBg: proposalDocumentPrimitives.emerald50,
        cardBorder: proposalDocumentPrimitives.emerald200,
        label: 'Via Rápida',
    },
};

export function getTemplatePalette(template: string): TemplatePalette {
    return templatePalettes[template] || templatePalettes.executivo;
}
