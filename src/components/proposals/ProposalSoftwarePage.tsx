import React from 'react';
import type { Deal, DealProduct } from '@/types/deal';
import { ProposalSoftwareMainHighlight, ProposalSoftwareAdditional } from './ProposalSoftwareComponents';
import { isSoftware, isHardware, isSupport } from '@/utils/productClassification';

interface ProposalSoftwarePageProps {
    deal: Deal;
    softwareHighlights?: Array<{ title: string; value: string }>;
    benefitTiles?: Array<{ value: string; label: string }>;
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalSoftwarePage({ deal, softwareHighlights, benefitTiles, simplifiedProductNames = {}, themePrimary, themeAccent, layout = 'portrait' }: ProposalSoftwarePageProps & { layout?: 'portrait' | 'landscape' }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '293mm';

    // Detect product mix scenario
    const allProducts = deal.deal_products || [];
    const hasHW = allProducts.some(p => (isHardware(p) || isSupport(p)) && p.is_visible_on_proposal !== false);
    const isSWOnly = !hasHW;

    // Filter and deduplicate software products by name to avoid repeating items in listing
    const rawSoftwareProducts = allProducts.filter(p => isSoftware(p) && p.is_visible_on_proposal !== false);
    const softwareProducts = rawSoftwareProducts.filter((product, index, self) =>
        index === self.findIndex((t) => t.name === product.name)
    );

    if (softwareProducts.length === 0) return null;

    // Dynamic section title based on scenario
    const sectionTitle = isSWOnly ? 'Soluções' : 'Software';
    const sectionAccent = isSWOnly ? 'Licenciamento' : 'Licenciamento';

    // Main software (first or most expensive)
    const mainSoftware = softwareProducts.length > 0
        ? softwareProducts.reduce((prev, current) =>
            ((current.unit_price || 0) > (prev.unit_price || 0)) ? current : prev
        )
        : null;

    const softwareName = mainSoftware?.name || 'Licenciamento Corporativo';

    // Pagination logic for "Additional Software"
    const additionalItems = softwareProducts.filter(p => p.id !== mainSoftware?.id);
    const firstPageLimit = isLandscape ? 4 : 8;
    const subsequentPageLimit = isLandscape ? 12 : 20;

    const firstPageItems = additionalItems.slice(0, firstPageLimit);
    const remainingItems = additionalItems.slice(firstPageLimit);

    const extraChunks: DealProduct[][] = [];
    for (let i = 0; i < remainingItems.length; i += subsequentPageLimit) {
        extraChunks.push(remainingItems.slice(i, i + subsequentPageLimit));
    }

    const totalPages = 1 + extraChunks.length;

    // Default benefit tiles if AI hasn't provided them
    const tiles = benefitTiles && benefitTiles.length > 0
        ? benefitTiles
        : [
            { value: "100%", label: "Licenciamento Legal" },
            { value: "24/7", label: "Suporte Especializado" },
            { value: "HIGH", label: "Performance & Valor" }
        ];

    return (
        <div className="proposal-software-multi-page">
            {/* Page 1: Highlights and first set of items */}
            <div
                className="proposal-software-page"
                data-proposal-page="true"
                style={{
                    width: width,
                    height: height,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    padding: isLandscape ? '30px 60px' : '60px 80px',
                    color: primaryColor,
                    marginBottom: totalPages > 1 ? '40px' : 0
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '6px',
                    background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)`
                }} />

                {/* Header */}
                <div style={{ marginBottom: isLandscape ? '25px' : '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '15px' : '30px' }}>
                        <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: primaryColor, marginBottom: '8px', letterSpacing: '-1px' }}>
                        {sectionTitle} & <span style={{ color: accentColor }}>{sectionAccent}</span>
                        {totalPages > 1 && <span style={{ fontSize: '16px', color: '#64748b', marginLeft: '12px', fontWeight: '400' }}>({1}/{totalPages})</span>}
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                </div>

                <ProposalSoftwareMainHighlight
                    softwareName={simplifiedProductNames[mainSoftware?.name || ''] || softwareName}
                    softwareHighlights={softwareHighlights}
                    mainProduct={mainSoftware}
                    simplifiedProductNames={simplifiedProductNames}
                    themePrimary={primaryColor}
                    themeAccent={accentColor}
                />

                {/* Benefits Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: isLandscape ? '15px' : '30px' }}>
                    {tiles.map((tile, idx) => (
                        <div key={idx} style={{
                            padding: isLandscape ? '15px' : '25px',
                            backgroundColor: idx === 0 ? '#f0f9ff' : idx === 1 ? '#fef2f2' : '#f0fdf4',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: `1px solid ${idx === 0 ? '#bfdbfe' : idx === 1 ? '#fecaca' : '#bbf7d0'}`
                        }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: idx === 0 ? primaryColor : idx === 1 ? accentColor : '#16a34a',
                                marginBottom: '8px'
                            }}>
                                {tile.value}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase' }}>
                                {tile.label}
                            </div>
                        </div>
                    ))}
                </div>

                <ProposalSoftwareAdditional 
                    softwareProducts={mainSoftware ? [mainSoftware, ...firstPageItems] : []} 
                    simplifiedProductNames={simplifiedProductNames}
                    themePrimary={primaryColor}
                    themeAccent={accentColor}
                />

                <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', color: '#9ca3af', fontSize: '11px' }}>
                    Infodive IT Solutions - Pag 1 de {totalPages}
                </div>
            </div>

            {/* Subsequent Pages for overflowing items */}
            {extraChunks.map((chunk, index) => (
                <div
                    key={index}
                    className="proposal-software-page"
                    data-proposal-page="true"
                    style={{
                        width: width,
                        height: height,
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        padding: isLandscape ? '30px 60px' : '60px 80px',
                        color: primaryColor,
                        marginBottom: index < extraChunks.length - 1 ? '40px' : 0
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)` }} />
                    <div style={{ marginBottom: isLandscape ? '25px' : '50px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '20px' : '40px' }}>
                            <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', color: primaryColor, marginBottom: '8px', letterSpacing: '-1px' }}>
                            {sectionTitle} & <span style={{ color: accentColor }}>{sectionAccent}</span>
                            <span style={{ fontSize: '16px', color: '#64748b', marginLeft: '12px', fontWeight: '400' }}>({index + 2}/{totalPages})</span>
                        </h1>
                        <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <ProposalSoftwareAdditional 
                            softwareProducts={[null, ...chunk]} 
                            simplifiedProductNames={simplifiedProductNames}
                            themePrimary={primaryColor}
                            themeAccent={accentColor}
                        />
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', color: '#9ca3af', fontSize: '11px' }}>
                        Infodive IT Solutions - Pag {index + 2} de {totalPages}
                    </div>
                </div>
            ))}
        </div>
    );
}
