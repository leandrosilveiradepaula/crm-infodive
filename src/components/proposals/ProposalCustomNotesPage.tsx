import React from 'react';

interface ProposalCustomNotesPageProps {
    title: string;
    content: string;
    themePrimary?: string;
    themeAccent?: string;
    layout?: 'portrait' | 'landscape';
}

export function ProposalCustomNotesPage({ 
    title, 
    content, 
    themePrimary, 
    themeAccent, 
    layout = 'portrait' 
}: ProposalCustomNotesPageProps) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '297mm';

    // Se não houver nada escrito, não precisa ocupar espaço
    if (!content?.trim()) {
        return null;
    }

    return (
        <div
            className="proposal-custom-notes-page"
            style={{
                width: width,
                height: height,
                backgroundColor: '#ffffff',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '15px' : '30px' }}>
                    <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: primaryColor, marginBottom: '8px', letterSpacing: '-1px' }}>
                    {title || 'Notas Adicionais'}
                </h1>
                <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px' }} />
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'hidden' }}>
                <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    color: '#334155' 
                }}>
                    {content}
                </div>
            </div>

            {/* Footer Decorative Optional */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                right: isLandscape ? '60px' : '80px',
                opacity: 0.1,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <img src="/assets/icon.png" alt="Infodive Icon" style={{ height: '32px', filter: 'grayscale(100%)' }} onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
        </div>
    );
}
