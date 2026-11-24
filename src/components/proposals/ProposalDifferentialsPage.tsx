import { proposalDocumentPrimitives } from '@/design-system/proposal-document-colors';
import React from 'react';

interface ProposalDifferentialsPageProps {
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalDifferentialsPage({ themePrimary, themeAccent, layout = 'portrait' }: ProposalDifferentialsPageProps & { layout?: 'portrait' | 'landscape' }) {
    const primaryColor = themePrimary || proposalDocumentPrimitives.defaultPrimary;
    const accentColor = themeAccent || proposalDocumentPrimitives.defaultAccent;
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '297mm';
    const differentials = [
        {
            title: 'Expertise Técnica Comprovada',
            description: 'Equipe certificada com anos de experiência em infraestrutura crítica e soluções enterprise',
            icon: '🎯'
        },
        {
            title: 'Parcerias Estratégicas',
            description: 'Parceiros oficiais Lenovo, Microsoft, Veeam, Virtuozzo, IBM, VMware, RedHat e principais fabricantes do mercado',
            icon: '🤝'
        },
        {
            title: 'Foco no Sucesso do Cliente',
            description: 'Suporte dedicado e acompanhamento contínuo pós-implementação para garantir resultados',
            icon: '⭐'
        }
    ];

    return (
        <div
            className="proposal-differentials-page"
            style={{
                width: width,
                height: height,
                backgroundColor: proposalDocumentPrimitives.paperWhite,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', system-ui, sans-serif",
                padding: isLandscape ? '40px 60px' : '60px 80px',
                color: primaryColor
            }}
        >
            {/* Standardized Top Bar Decoration */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '6px',
                background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)`
            }} />

            {/* Standardized Header */}
            <div style={{ marginBottom: isLandscape ? '30px' : '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '20px' : '40px' }}>
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
                        Diferenciais da <span style={{ color: accentColor }}>Solução</span>
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                    <p style={{
                        fontSize: '14px',
                        color: proposalDocumentPrimitives.slate500,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Por que escolher a Infodive IT como parceira estratégica
                    </p>
                </div>
            </div>

            {/* Differentials Cards */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isLandscape ? '15px' : '30px'
            }}>
                {differentials.map((differential, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            gap: isLandscape ? '20px' : '30px',
                            padding: isLandscape ? '20px' : '35px',
                            backgroundColor: index === 0 ? proposalDocumentPrimitives.sky50 : index === 1 ? proposalDocumentPrimitives.red50 : proposalDocumentPrimitives.green50,
                            borderRadius: '12px',
                            border: `2px solid ${index === 0 ? primaryColor : index === 1 ? accentColor : proposalDocumentPrimitives.green600}`,
                            alignItems: 'center'
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            fontSize: '48px',
                            minWidth: '80px',
                            textAlign: 'center'
                        }}>
                            {differential.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: index === 0 ? primaryColor : index === 1 ? accentColor : proposalDocumentPrimitives.green600,
                                marginBottom: '12px'
                            }}>
                                {differential.title}
                            </h3>

                            <p style={{
                                fontSize: '14px',
                                color: proposalDocumentPrimitives.gray600,
                                lineHeight: '1.6'
                            }}>
                                {differential.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Banner */}
            <div style={{
                marginTop: isLandscape ? '20px' : '40px',
                padding: isLandscape ? '20px' : '30px',
                backgroundColor: primaryColor,
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                <p style={{
                    fontSize: '16px',
                    color: proposalDocumentPrimitives.paperWhite,
                    fontWeight: '600',
                    lineHeight: '1.6'
                }}>
                    <span style={{ color: accentColor, fontWeight: '700' }}>Mais de 15 anos</span> transformando infraestruturas de TI em vantagens competitivas
                </p>
            </div>

            {/* Standardized Footer */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                borderTop: `1px solid ${proposalDocumentPrimitives.slate100}`,
                color: proposalDocumentPrimitives.gray400,
                fontSize: '11px'
            }}>
                Infodive IT Solutions - Confidencial
            </div>
        </div>
    );
}
