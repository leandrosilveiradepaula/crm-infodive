import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { getPageProps } from './pdfStyles';

interface PdfCustomNotesPageProps {
    title: string;
    content: string;
    pdfColors: any;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

export function PdfCustomNotesPage({ title, content, pdfColors, pdfStyles, layout = 'portrait' }: PdfCustomNotesPageProps) {
    if (!content?.trim()) {
        return null;
    }

    // Split content by newlines to render proper paragraphs
    const paragraphs = content.split('\n');

    return (
        <Page {...getPageProps(layout)} style={[pdfStyles.page, { padding: '40 50' }]}>
            {/* Header */}
            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: pdfColors.primary, marginBottom: 8 }}>
                    {title || 'Notas Adicionais'}
                </Text>
                <View style={{ width: 30, height: 3, backgroundColor: pdfColors.accent, borderRadius: 1.5 }} />
            </View>

            {/* Content properly formatted */}
            <View style={{ flex: 1 }}>
                {paragraphs.map((para, index) => (
                    // We render empty strings as spacing
                    <Text 
                        key={index} 
                        style={{ 
                            fontSize: 10, 
                            lineHeight: 1.6, 
                            color: '#334155', 
                            marginBottom: para.trim() ? 8 : 4,
                            textAlign: 'justify' 
                        }}
                    >
                        {para}
                    </Text>
                ))}
            </View>
        </Page>
    );
}
