import React from 'react';

import { ProjectObjective, defaultObjectives } from './ProposalOverviewConstants';

export interface ProposalOverviewPageProps {
    dealTitle: string;
    objectives?: ProjectObjective[];
}

export function ProposalOverviewPage({
    dealTitle,
    objectives = defaultObjectives,
    aiSummary,
    themePrimary,
    themeAccent,
    layout = 'portrait'
}: ProposalOverviewPageProps & { aiSummary?: string; themePrimary?: string; themeAccent?: string; layout?: 'portrait' | 'landscape' }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '297mm';

    return (
        <div
            className="proposal-overview-page"
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
            <div style={{ marginBottom: isLandscape ? '25px' : '50px' }}>
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
                        Visão Geral do <span style={{ color: accentColor }}>Projeto</span>
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {dealTitle}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
                {/* AI Summary Section */}
                {aiSummary && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '20px 25px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        flex: '0 0 auto'
                    }}>
                        <div style={{
                            color: '#1e3a5f',
                            fontSize: '13.5px', // Reduced for better density
                            lineHeight: '1.45',
                            whiteSpace: 'pre-wrap',
                            textAlign: 'justify',
                            fontWeight: '400'
                        }}>
                            {aiSummary}
                        </div>
                    </div>
                )}

                {/* Objectives Grid */}
                {objectives.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        flex: aiSummary ? '0 1 auto' : '1'
                    }}>
                        {objectives.map((objective, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: '#ffffff',
                                    padding: '16px 20px',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    position: 'relative'
                                }}
                            >
                                {/* Mini Number Badge */}
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: accentColor,
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: '#ffffff',
                                    marginBottom: '8px'
                                }}>
                                    {objective.number}
                                </div>

                                <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: primaryColor,
                                    marginBottom: '4px',
                                    lineHeight: '1.2'
                                }}>
                                    {objective.title}
                                </h3>

                                <p style={{
                                    fontSize: '11.5px',
                                    color: '#64748b',
                                    lineHeight: '1.4'
                                }}>
                                    {objective.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
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
                Infodive IT Solutions - Confidencial
            </div>
        </div>
    );
}
