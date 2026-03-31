import React from 'react';

// Using inline styles for jsPDF/modern-screenshot compatibility
export function ProposalCoverPage({
    dealTitle,
    companyName,
    date,
    clientLogo,
    mainTitle,
    proposalNumber,
    themePrimary,
    themeAccent,
    layout = 'portrait',
    hideValues = false,
    sellerName
}: {
    dealTitle: string;
    companyName: string;
    totalValue?: number;
    proposalNumber?: string;
    date: string;
    clientLogo?: string;
    mainTitle?: string;
    themePrimary?: string;
    themeAccent?: string;
    layout?: 'portrait' | 'landscape';
    hideValues?: boolean;
    sellerName?: string;
}) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '297mm';

    return (
        <div
            id="proposal-cover-page"
            style={{
                width: width,
                height: height,
                backgroundColor: '#ffffff',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}
        >
            {/* Standardized Top Bar Decoration */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '6px',
                background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)`,
                zIndex: 10
            }} />
            {/* Left Side - Information */}
            <div style={{
                width: '65%',
                padding: isLandscape ? '40px 50px' : '60px 50px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Logos */}
                <div style={{ marginBottom: isLandscape ? '40px' : '80px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <img
                        src="/assets/logo-infodive.png"
                        alt="Infodive Logo"
                        style={{
                            height: '50px',
                            width: 'auto'
                        }}
                    />
                    {clientLogo && (
                        <>
                            <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                            <img
                                src={clientLogo}
                                alt="Client Logo"
                                style={{
                                    height: '45px',
                                    width: 'auto',
                                    maxWidth: '120px',
                                    objectFit: 'contain'
                                }}
                            />
                        </>
                    )}
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: isLandscape ? '30px' : '36px',
                    fontWeight: '700',
                    color: '#000000',
                    opacity: hideValues ? 0 : 1,
                    marginBottom: isLandscape ? '16px' : '24px',
                    lineHeight: '1.3',
                    letterSpacing: '-0.02em'
                }}>
                    {mainTitle || "Proposta de Solução de Infraestrutura e Licenciamento"}
                </h1>

                {/* Subtitle */}
                <div style={{
                    fontSize: '16px',
                    color: accentColor,
                    fontWeight: '600'
                }}>
                    Infodive IT - Soluções Inteligentes
                </div>
            </div>

            {/* Metadata Table (Absolutely Positioned to prevent layout drift) */}
            <div style={{
                position: 'absolute',
                top: isLandscape ? '330px' : '520px',
                left: '50px',
                width: 'calc(65% - 100px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                zIndex: 20
            }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                            Projeto
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', opacity: hideValues ? 0 : 1 }}>
                            {dealTitle}
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                            Cliente
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', opacity: hideValues ? 0 : 1 }}>
                            {companyName}
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                            Responsável
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {sellerName ? `${sellerName} (Infodive IT)` : 'Infodive IT'}
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                            Data
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', opacity: hideValues ? 0 : 1 }}>
                            {date}
                        </div>
                    </div>

                    {proposalNumber && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '140px 1fr',
                            padding: '12px 0',
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                Nº Proposta
                            </div>
                            <div style={{ fontSize: '14px', color: accentColor, fontWeight: '700', opacity: hideValues ? 0 : 1 }}>
                                {proposalNumber}
                            </div>
                        </div>
                    )}
                </div>

            {/* Right Side - Data Center Image */}
            <div style={{
                width: '35%',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <img
                    src="/assets/datacenter-corridor.jpg"
                    alt="Data Center"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            </div>
        </div>
    );
}
