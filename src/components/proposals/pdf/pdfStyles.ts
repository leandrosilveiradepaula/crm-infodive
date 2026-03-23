import { StyleSheet, Font } from '@react-pdf/renderer';

// Disable hyphenation globally to prevent word breaking (e.g., "Stor-age")
Font.registerHyphenationCallback(word => [word]);

// ── Color Tokens ──────────────────────────────────────────────────────
export const defaultColors = {
    primary: '#1e3a5f',       // Default Navy
    accent: '#E31837',        // Default Red
    text: '#374151',          // gray-700
    textLight: '#64748b',     // slate-500
    textMuted: '#9ca3af',     // gray-400
    border: '#e5e7eb',        // gray-200
    borderLight: '#f1f5f9',   // slate-100
    bgLight: '#f8f9fa',       // near-white
    bgLighter: '#f3f4f6',     // gray-100
    white: '#ffffff',
    black: '#111827',         // gray-900
    green: '#059669',
    emerald: '#16a34a',
    purple: '#7c3aed',
    cyan: '#0891b2',
    amber: '#b45309',
    yellowLight: '#fef3c7',
    yellowBorder: '#fde68a',
};

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
        primary: '#1e3a5f',
        accent: '#E31837',
        headerBg: '#f8f9fa',
        cardBg: '#f0f4f8',
        cardBorder: '#d1dce8',
        label: 'Executivo Master',
    },
    tecnico: {
        primary: '#0f172a',
        accent: '#3b82f6',
        headerBg: '#f0f9ff',
        cardBg: '#eff6ff',
        cardBorder: '#bfdbfe',
        label: 'Mergulho Técnico',
    },
    detalhado: {
        primary: '#312e81',
        accent: '#7c3aed',
        headerBg: '#faf5ff',
        cardBg: '#f5f3ff',
        cardBorder: '#c4b5fd',
        label: 'Especificação Detalhada',
    },
    rapido: {
        primary: '#064e3b',
        accent: '#059669',
        headerBg: '#f0fdf4',
        cardBg: '#ecfdf5',
        cardBorder: '#a7f3d0',
        label: 'Via Rápida',
    },
};

export function getTemplatePalette(template: string): TemplatePalette {
    return templatePalettes[template] || templatePalettes.executivo;
}
