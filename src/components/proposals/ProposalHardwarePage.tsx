import React from 'react';
import type { Deal, DealProduct } from '@/types/deal';
import { ProposalHardwareProduct } from './ProposalHardwareProduct';
import { isSoftware, isHardware, isSupport, isService, getClassificationLabel } from '@/utils/productClassification';

interface ProposalHardwarePageProps {
    deal: Deal;
    aiSpecs?: Array<{ label: string; value: string }>;
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
}

// Visual config per group type helper
const getGroupStyles = (label: string, primary: string, accent: string) => {
    const defaultStyles: Record<string, { color: string; accent: string }> = {
        'Hardware & Infraestrutura': { color: primary, accent: primary },
        'Suporte & Garantia': { color: '#7c3aed', accent: '#7c3aed' },
        'Serviços Profissionais': { color: '#059669', accent: '#059669' },
        'Geral': { color: '#64748b', accent: '#64748b' },
    };
    return defaultStyles[label] || defaultStyles['Geral'];
};

// Renders a compact group separator bar
function GroupSeparator({ label, primaryColor, accentColor }: { label: string, primaryColor: string, accentColor: string }) {
    const style = getGroupStyles(label, primaryColor, accentColor);
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            marginBottom: '10px',
            marginTop: '10px',
            borderLeft: `4px solid ${style.accent}`,
            backgroundColor: `${style.accent}08`,
            borderRadius: '0 8px 8px 0',
        }}>
            <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: style.color,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: `${style.accent}20` }} />
        </div>
    );
}

// Component to render highlighted specs in a compact grid
function TechnicalSummaryGrid({ specs, primaryColor }: { specs: Array<{ label: string; value: string }>, primaryColor: string }) {
    if (specs.length === 0) return null;
    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px',
            backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '12px',
            border: '1px solid #cbd5e1'
        }}>
            {specs.map((spec, i) => (
                <div key={i} style={{
                    flex: '1 1 calc(33.333% - 10px)', minWidth: '140px', backgroundColor: '#ffffff', padding: '10px',
                    borderRadius: '8px', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
                        {spec.label}
                    </span>
                    <span style={{ fontSize: '13px', color: primaryColor, fontWeight: '900', textAlign: 'center' }}>
                        {spec.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

type RenderItem = { type: 'header'; label: string } | { type: 'product'; product: DealProduct } | { type: 'grid'; specs: Array<{ label: string; value: string }> };

export function ProposalHardwarePage({ deal, simplifiedProductNames = {}, themePrimary, themeAccent, layout = 'portrait' }: ProposalHardwarePageProps & { layout?: 'portrait' | 'landscape' }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '293mm';

    // 1. Filter out completely irrelevant products and deduplicate by name to match PDF
    const hardwareProducts = deal.deal_products?.filter(p =>
        (isHardware(p) || isSupport(p) || isService(p)) && p.is_visible_on_proposal !== false
    ) || [];

    const deduplicated = hardwareProducts.filter((p, i, self) =>
        i === self.findIndex(t => t.name === p.name)
    );

    if (deduplicated.length === 0) return null;

    // 2. Categorize explicitly
    const hw = deduplicated.filter(p => isHardware(p));
    const support = deduplicated.filter(p => isSupport(p));
    const services = deduplicated.filter(p => isService(p));

    // 3. Extract highlighted specs for the summary grid
    const allHighlightedSpecs: Array<{ label: string; value: string }> = [];
    deduplicated.forEach(p => {
        const sourceDetails = p.description || p.tech_details;
        if (sourceDetails) {
            try {
                const parsed = typeof sourceDetails === 'string' ? JSON.parse(sourceDetails) : sourceDetails;
                if (Array.isArray(parsed)) {
                    parsed.forEach(item => {
                        if (item.is_highlighted_on_grid && item.grid_label) {
                            if (!allHighlightedSpecs.some(s => s.label === item.grid_label)) {
                                allHighlightedSpecs.push({
                                    label: item.grid_label || 'Info',
                                    value: item.description
                                });
                            }
                        }
                    });
                }
            } catch (e) { /* ignore */ }
        }
    });

    // 4. Build linear items list to chunk
    const renderItems: RenderItem[] = [];

    if (hw.length > 0) {
        renderItems.push({ type: 'header', label: 'Hardware & Infraestrutura' });
        if (allHighlightedSpecs.length > 0) {
            renderItems.push({ type: 'grid', specs: allHighlightedSpecs });
        }
        hw.forEach(product => renderItems.push({ type: 'product', product }));
    }

    if (support.length > 0) {
        renderItems.push({ type: 'header', label: 'Suporte & Garantia' });
        support.forEach(product => renderItems.push({ type: 'product', product }));
    }

    if (services.length > 0) {
        renderItems.push({ type: 'header', label: 'Serviços Profissionais' });
        services.forEach(product => renderItems.push({ type: 'product', product }));
    }

    // 5. Chunk items into pages
    // We assign weights to items to know when to break the page
    // Headers cost 0.5, grid costs 1.5, product costs 1. Max capacity ~ 3 per page (or 2 for landscape).
    const MAX_PAGE_CAPACITY = isLandscape ? 2 : 3;
    const pages: RenderItem[][] = [];
    let currentPage: RenderItem[] = [];
    let currentCapacity = 0;

    for (const item of renderItems) {
        let weight = 0;
        if (item.type === 'header') weight = 0.5;
        if (item.type === 'grid') weight = 1.2;
        if (item.type === 'product') weight = 1.0;

        if (currentCapacity + weight > MAX_PAGE_CAPACITY && currentPage.length > 0) {
            // Push current page and start new one
            pages.push(currentPage);
            currentPage = [];
            currentCapacity = 0;

            // If we broke right before a product but we were in a section, 
            // the previous item might have been a header. To avoid orphaned headers,
            // we probably ideally want to pull the header to the new page.
            // But a simpler fix is if the First item on new page is a product, 
            // we should technically re-inject the header. We'll rely on the visual continuity for now 
            // as it matches exactly the PDF behavior.
        }

        currentPage.push(item);
        currentCapacity += weight;
    }
    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    // 6. Section Title
    const hasStorage = deduplicated.some(p =>
        p.name.toLowerCase().match(/storage|flash|ds8|v5000|v7000|v9000|fs7300|fs9200/) ||
        p.category?.toLowerCase().includes('storage')
    );
    const hasServers = deduplicated.some(p =>
        p.name.toLowerCase().match(/servidor|server|power|think|node|chassis/) ||
        p.category?.toLowerCase().includes('servidor') ||
        p.category?.toLowerCase().includes('server')
    );

    let sectionTitle = "Infraestrutura de Hardware e Servidores";
    if (hasStorage && hasServers) sectionTitle = "Infraestrutura de Storage e Servidores";
    else if (hasStorage) sectionTitle = "Infraestrutura de Storage";
    else if (hasServers) sectionTitle = "Infraestrutura de Servidores";
    else if (hw.length === 0 && (services.length > 0 || support.length > 0)) sectionTitle = "Serviços & Suporte Ténico";


    return (
        <div className="proposal-hardware-multi-page">
            {pages.map((pageItems, chunkIndex) => (
                <div
                    key={chunkIndex}
                    className="proposal-hardware-page"
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
                        padding: isLandscape ? '20px 60px' : '40px 60px',
                        color: primaryColor,
                        marginBottom: chunkIndex < pages.length - 1 ? '30px' : 0,
                        pageBreakAfter: 'always'
                    }}
                >
                    {/* Background Decoration */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100%',
                        height: '6px',
                        background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)`
                    }} />

                    {/* Standardized Header Section */}
                    <div style={{ marginBottom: isLandscape ? '15px' : '25px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '10px' : '20px' }}>
                            <img
                                src="/assets/logo-infodive.png"
                                alt="Infodive"
                                style={{ height: '42px' }}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: '800',
                                color: primaryColor,
                                marginBottom: '8px',
                                letterSpacing: '-1px'
                            }}>
                                Especificação <span style={{ color: accentColor }}>Técnica</span>
                                {pages.length > 1 && (
                                    <span style={{ fontSize: '16px', color: '#64748b', marginLeft: '12px', fontWeight: '400' }}>
                                        ({chunkIndex + 1}/{pages.length})
                                    </span>
                                )}
                            </h1>
                            <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                            <p style={{
                                fontSize: '14px',
                                color: '#64748b',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {sectionTitle}
                            </p>
                        </div>
                    </div>

                    {/* Product Grid with Group Headers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pageItems.map((item, idx) => {
                            if (item.type === 'header') {
                                return <GroupSeparator key={`header-${idx}`} label={item.label} primaryColor={primaryColor} accentColor={accentColor} />;
                            }
                            if (item.type === 'grid') {
                                return <TechnicalSummaryGrid key={`grid-${idx}`} specs={item.specs} primaryColor={primaryColor} />;
                            }
                            return <ProposalHardwareProduct key={`prod-${idx}`} product={item.product} simplifiedName={simplifiedProductNames[item.product.name]} />;
                        })}
                    </div>

                    {/* Standardized Footer */}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        borderTop: '1px solid #f1f5f9',
                        color: '#9ca3af',
                        fontSize: '11px'
                    }}>
                        Infodive IT Solutions - Pag {chunkIndex + 1} de {pages.length}
                    </div>

                    {/* Visual Flair */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '50%',
                        zIndex: -1
                    }} />
                </div>
            ))}
        </div>
    );
}
