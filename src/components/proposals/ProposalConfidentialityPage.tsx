import React from 'react';

export function ProposalConfidentialityPage({
    themePrimary,
    themeAccent,
    layout = 'portrait'
}: {
    themePrimary?: string;
    themeAccent?: string;
    layout?: 'portrait' | 'landscape';
}) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '297mm';
    return (
        <div
            className="proposal-confidentiality-page"
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
            {/* Left Side - Content */}
            <div style={{
                width: '50%',
                padding: isLandscape ? '40px 50px' : '60px 50px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Standardized Logo Area */}
                <div style={{ marginBottom: isLandscape ? '30px' : '60px' }}>
                    <img
                        src="/assets/logo-infodive.png"
                        alt="Infodive Logo"
                        style={{ height: '42px' }}
                    />
                </div>

                {/* Standardized Title Section */}
                <div style={{ position: 'relative', marginBottom: isLandscape ? '20px' : '40px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: primaryColor,
                        marginBottom: '8px',
                        letterSpacing: '-1px'
                    }}>
                        Termos de <span style={{ color: accentColor }}>Confidencialidade</span>
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px' }} />
                </div>

                {/* Content Text */}
                <div style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.8',
                    marginBottom: isLandscape ? '20px' : '40px',
                    textAlign: 'justify'
                }}>
                    O conteúdo deste documento destina-se exclusivamente à avaliação interna da organização
                    destinatária. As informações aqui contidas são proprietárias e não devem ser compartilhadas
                    com terceiros sem autorização prévia. Qualquer alteração nas permissas técnicas ou
                    comerciais descritas implicará na necessidade de uma revisão formal das condições propostas.
                </div>

                {/* Quote */}
                <div style={{
                    fontSize: '16px',
                    color: accentColor,
                    fontStyle: 'italic',
                    lineHeight: '1.6',
                    paddingLeft: '20px',
                    borderLeft: `3px solid ${accentColor}`
                }}>
                    "A integridade das informações e a proteção da estratégia de TI são
                    pilares fundamentais desta parceria comercial."
                </div>
            </div>

            {/* Right Side - Image with Dark Blue Background */}
            <div style={{
                width: '50%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isLandscape ? '40px' : '80px'
            }}>
                <img
                    src="/assets/digital-handshake.jpg"
                    alt="Digital Partnership"
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.3))'
                    }}
                />
            </div>
        </div>
    );
}
