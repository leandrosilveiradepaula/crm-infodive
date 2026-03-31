import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors } from './pdfStyles';
import { LOGO_BASE64, DATACENTER_BASE64, HANDSHAKE_BASE64 } from './pdfAssetsBase64';

interface PdfCoverPageProps {
    dealTitle: string;
    companyName: string;
    date: string;
    proposalTitle: string;
    proposalNumber?: string;
    clientLogo?: string;
    sellerName?: string;
    pdfColors: PdfColors;
    pdfStyles: any;
}

export function PdfCoverPage({
    dealTitle,
    companyName,
    date,
    proposalTitle,
    proposalNumber,
    clientLogo,
    sellerName,
    pdfColors,
    pdfStyles,
}: PdfCoverPageProps) {
    return (
        <Page size="A4" style={[pdfStyles.page, { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }]}>
            {/* Top gradient bar (simulated with two halves) */}
            <View style={{
                position: 'absolute', top: 0, left: 0, width: '50%', height: 6,
                backgroundColor: pdfColors.accent,
            }} />
            <View style={{
                position: 'absolute', top: 0, left: '50%', width: '50%', height: 6,
                backgroundColor: pdfColors.primary,
            }} />

            <View style={{ flexDirection: 'row', flex: 1 }}>
                {/* Left Side - Information (65%) */}
                <View style={{ width: '65%', padding: '60px 50px', flexDirection: 'column' }}>
                    {/* Logos */}
                    <View style={{ marginBottom: 80, flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                        <Image src={LOGO_BASE64} style={{ height: 50, width: 'auto' }} />
                        {clientLogo && (
                            <>
                                <View style={{ width: 1, height: 40, backgroundColor: '#e2e8f0' }} />
                                <Image src={clientLogo} style={{ height: 45, width: 'auto', maxWidth: 120 }} />
                            </>
                        )}
                    </View>

                    {/* Title */}
                    <Text 
                        style={{
                            fontSize: 32, fontWeight: 'bold', color: pdfColors.black,
                            marginBottom: 24, lineHeight: 1.2,
                        }}
                    >
                        {proposalTitle || 'Proposta de Solução de Infraestrutura e Licenciamento'}
                    </Text>

                    {/* Subtitle */}
                    <Text style={{
                        fontSize: 16, color: pdfColors.accent, marginBottom: 100, fontWeight: 'bold',
                    }}>
                        Infodive IT - Soluções Inteligentes
                    </Text>

                    {/* Metadata Table */}
                    <View style={{ flexDirection: 'column' }}>
                        {[
                            { label: 'Projeto', value: dealTitle },
                            { label: 'Cliente', value: companyName },
                            { label: 'Responsável', value: sellerName ? `${sellerName} (Infodive IT)` : 'Infodive IT' },
                            { label: 'Data', value: date },
                            ...(proposalNumber ? [{ label: 'Nº Proposta', value: proposalNumber, isAccent: true }] : []),
                        ].map((row, i) => (
                            <View key={i} style={pdfStyles.metaRow}>
                                <Text style={pdfStyles.metaLabel}>{row.label}</Text>
                                <Text style={[
                                    pdfStyles.metaValue,
                                    (row as any).isAccent ? { color: pdfColors.accent, fontWeight: 'bold' } : {},
                                ]}>
                                    {row.value}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Right Side - Data Center Image (35%) */}
                <View style={{ width: '35%', position: 'relative', overflow: 'hidden' }}>
                    <Image
                        src={DATACENTER_BASE64}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </View>
            </View>
        </Page>
    );
}
