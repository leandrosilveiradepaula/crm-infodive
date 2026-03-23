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

            {/* AI Summary or Objectives */}
            {aiSummary ? (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '30px 35px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    marginTop: '10px',
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center' // Center text if short
                }}>
                    <div style={{
                        color: '#1e3a5f',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'justify',
                        fontWeight: '400'
                    }}>
                        {aiSummary}
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '30px',
                    marginTop: '20px'
                }}>
                    {objectives.map((objective, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: '#f8f9fa',
                                padding: '30px',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb',
                                position: 'relative'
                            }}
                        >
                            {/* Number Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '-15px',
                                left: '30px',
                                width: '50px',
                                height: '50px',
                                backgroundColor: accentColor,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#ffffff',
                                boxShadow: `0 4px 6px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.3)`
                            }}>
                                {objective.number}
                            </div>

                            {/* Content */}
                            <div style={{ marginTop: '25px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: primaryColor,
                                    marginBottom: '12px',
                                    lineHeight: '1.3'
                                }}>
                                    {objective.title}
                                </h3>

                                <p style={{
                                    fontSize: '14px',
                                    color: '#4b5563',
                                    lineHeight: '1.6'
                                }}>
                                    {objective.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
