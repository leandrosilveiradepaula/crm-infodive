import React from 'react';
import type { DealProduct } from '@/types/deal';
import { formatProductDescription } from '@/utils/formatProductDescription';

interface ProposalSoftwareMainHighlightProps {
    softwareName: string;
    softwareHighlights?: Array<{ title: string; value: string }>;
    mainProduct?: DealProduct | null;
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalSoftwareMainHighlight({ softwareName, softwareHighlights, mainProduct, themePrimary, themeAccent }: ProposalSoftwareMainHighlightProps) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    // Default highlights if AI fails or hasn't run yet
    const highlights = softwareHighlights && softwareHighlights.length > 0
        ? softwareHighlights
        : [
            { title: "Edição Enterprise", value: "Recursos completos para demandas críticas de negócio." },
            { title: "Recursos Avançados", value: "Alta disponibilidade, performance e segurança integrada." }
        ];

    const { isStructured, items } = formatProductDescription(mainProduct?.description || mainProduct?.tech_details);
    const techDetails = isStructured && items ? items : [];

    return (
        <div style={{
            backgroundColor: primaryColor,
            padding: '40px',
            borderRadius: '12px',
            marginBottom: '30px',
            color: '#ffffff'
        }}>
            <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '20px',
                color: '#ffffff'
            }}>
                {softwareName}
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
            }}>
                {highlights.map((item, index) => (
                    <div key={index}>
                        <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: accentColor,
                            marginBottom: '8px'
                        }}>
                            {item.title}:
                        </h4>
                        <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: '#e5e7eb'
                        }}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '25px',
                padding: '20px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <h4 style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#ffffff',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{ width: '4px', height: '12px', backgroundColor: accentColor, borderRadius: '2px' }} />
                    Especificações Técnicas:
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {techDetails.map((det, idx) => (
                        <li key={idx} style={{
                            fontSize: '13.5px',
                            color: '#f3f4f6',
                            paddingLeft: '20px',
                            position: 'relative',
                            lineHeight: '1.4'
                        }}>
                            <span style={{ position: 'absolute', left: 0, top: '6px', width: '6px', height: '6px', backgroundColor: accentColor, borderRadius: '50%' }}></span>
                            <span style={{ color: accentColor, fontWeight: '900', marginRight: '6px' }}>{det.quantity > 1 ? `${det.quantity}x` : ''}</span>
                            <span style={{ fontWeight: '500' }}>{det.description}</span>
                            {det.grid_label && (
                                <span style={{
                                    marginLeft: '10px',
                                    fontSize: '9px',
                                    fontWeight: '800',
                                    backgroundColor: `${accentColor}1A`,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    color: accentColor,
                                    border: `1px solid ${accentColor}33`,
                                    textTransform: 'uppercase'
                                }}>{det.grid_label}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

interface ProposalSoftwareAdditionalProps {
    softwareProducts: (DealProduct | null)[];
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalSoftwareAdditional({ softwareProducts, simplifiedProductNames = {}, themePrimary, themeAccent }: ProposalSoftwareAdditionalProps) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    if (softwareProducts.length <= 1) return null;

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
        }}>
            <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: primaryColor,
                marginBottom: '15px'
            }}>
                Software Adicional Incluído:
            </h3>
            <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
            }}>
                {softwareProducts.slice(1).map((product, index) => {
                    const { isStructured, items } = formatProductDescription(product?.description || product?.tech_details);
                    const techDetails = isStructured && items ? items : [];

                    return (
                        <li key={index} style={{
                            fontSize: '14px',
                            color: '#4b5563',
                            marginBottom: '16px',
                            paddingLeft: '24px',
                            position: 'relative',
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '12px 12px 12px 34px'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '12px',
                                color: accentColor,
                                fontWeight: '700'
                            }}>
                                ✓
                            </span>
                            <div style={{ fontWeight: '700', color: primaryColor, marginBottom: techDetails.length > 0 ? '8px' : '0' }}>
                                {(product && simplifiedProductNames[product.name]) || product?.name}
                            </div>

                            {techDetails.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {techDetails.map((det, idx) => (
                                        <li key={idx} style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            paddingLeft: '12px',
                                            position: 'relative',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#9ca3af' }}>-</span>
                                            <span style={{ fontWeight: '600', color: '#4b5563' }}>{det.quantity > 1 ? `${det.quantity}x ` : ''}</span>
                                            {det.description}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {techDetails.length === 0 && product?.description && !product.description.trim().startsWith('[') && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    {product.description}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
