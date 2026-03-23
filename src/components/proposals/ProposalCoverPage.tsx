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
    themeAccent
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
}) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    return (
        <div
            id="proposal-cover-page"
            style={{
                width: '210mm',
                height: '297mm',
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
                padding: '60px 50px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Logos */}
                <div style={{ marginBottom: '80px', display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                    fontSize: '36px',
                    fontWeight: '700',
                    color: '#000000',
                    marginBottom: '24px',
                    lineHeight: '1.3',
                    letterSpacing: '-0.02em'
                }}>
                    {mainTitle || "Proposta de Solução de Infraestrutura e Licenciamento"}
                </h1>

                {/* Subtitle */}
                <div style={{
                    fontSize: '16px',
                    color: accentColor,
                    marginBottom: '100px',
                    fontWeight: '600'
                }}>
                    Infodive IT - Soluções Inteligentes
                </div>

                {/* Metadata Table */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0'
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
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
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
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
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
                            Infodive IT
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
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
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
                            <div style={{ fontSize: '14px', color: accentColor, fontWeight: '700' }}>
                                {proposalNumber}
                            </div>
                        </div>
                    )}
                </div>
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
