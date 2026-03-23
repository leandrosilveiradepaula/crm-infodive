import React from 'react';
import type { Deal } from '@/types/deal';
import type { BillingOverride } from '@/hooks/useProposalEditorState';
import { ProposalInvestmentTable, ProposalInvestmentOptionals } from './ProposalInvestmentComponents';

interface ProposalInvestmentPageProps {
    deal: Deal;
    distributors?: any[];
    config?: any;
    billingOverrides?: Record<string, BillingOverride>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalInvestmentPage({ deal, distributors = [], config, billingOverrides = {}, themePrimary, themeAccent }: ProposalInvestmentPageProps) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: deal.deal_products?.[0]?.is_usd ? 'USD' : 'BRL'
        }).format(value);
    };

    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '-';
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return cnpj;
        return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    // Investment page shows ALL products regardless of visibility flag
    // (visibility only controls spec pages, not the financial summary)
    const products = deal.deal_products || [];
    const mainProducts = products.filter(p => !p.is_optional);
    const optionalProducts = products.filter(p => p.is_optional);
    const totalConsolidatedValue = mainProducts.reduce((acc, item) => acc + ((item.unit_price || 0) * (item.quantity || 1)), 0);

    // Grouping logic for Main Products
    const groups: { title: string, products: any[], type: 'reseller' | 'direct', distributor?: any }[] = [];

    // 1. Reseller Group
    const resellerProducts = mainProducts.filter(p => p.billing_type === 'direct' || !p.billing_type);
    if (resellerProducts.length > 0) {
        groups.push({
            title: 'Faturamento Revenda (Infodive)',
            products: resellerProducts,
            type: 'reseller'
        });
    }

    // 2. Direct Groups by Distributor
    const directProducts = mainProducts.filter(p => p.billing_type === 'indirect');
    const distributorIds = Array.from(new Set(directProducts.map(p => p.distributor_id).filter(Boolean)));

    distributorIds.forEach(dId => {
        const dProducts = directProducts.filter(p => p.distributor_id === dId);
        const dist = distributors.find(d => d.id === dId);
        if (dProducts.length > 0) {
            groups.push({
                title: `Faturamento Direto (${dist?.name || 'Distribuidor'})`,
                products: dProducts,
                type: 'direct',
                distributor: dist
            });
        }
    });

    // 3. Fallback: indirect products without a distributor_id
    const orphanDirectProducts = directProducts.filter(p => !p.distributor_id);
    if (orphanDirectProducts.length > 0) {
        groups.push({
            title: 'Faturamento Direto',
            products: orphanDirectProducts,
            type: 'direct'
        });
    }

    const showBilling = config?.showBillingInfo !== false;
    const hasOptionals = optionalProducts.length > 0;

    // Chunk optional products (Top-level blocks)
    // Max 3 per page to avoid overflow since they can have children
    const topLevelOptionals = optionalProducts.filter(p => !p.parent_id || !optionalProducts.some(op => op.id === p.parent_id));
    const optionalChunks: any[][] = [];
    for (let i = 0; i < topLevelOptionals.length; i += 3) {
        optionalChunks.push(topLevelOptionals.slice(i, i + 3));
    }

    const totalOptionalPages = optionalChunks.length;

    return (
        <div className="proposal-investment-multi-page">
            {/* Investment Page */}
            <div
                className="proposal-investment-page"
                data-proposal-page="true"
                style={{
                    width: '210mm',
                    minHeight: '293mm',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: primaryColor,
                    marginBottom: '40px',
                    paddingBottom: '40px'
                }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)` }} />

                <div style={{ padding: '40px 80px 20px 80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: primaryColor, marginBottom: '8px', letterSpacing: '-1px' }}>
                        Estrutura de <span style={{ color: accentColor }}>Investimento</span>
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                </div>

                {/* Single unified investment table with ALL products */}
                <ProposalInvestmentTable
                    mainProducts={mainProducts}
                    formatCurrency={formatCurrency}
                    totalMainValue={totalConsolidatedValue}
                    themePrimary={primaryColor}
                    themeAccent={accentColor}
                />

                {/* Separate billing info section */}
                {showBilling && !config?.isPriceStudy && groups.some(g => g.distributor || g.type === 'reseller') && (
                    <div style={{ padding: '0 80px', marginTop: '32px' }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{ width: '3px', height: '12px', backgroundColor: accentColor, borderRadius: '2px' }} />
                            Informações de Faturamento
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {groups.map((group, gIdx) => (
                                <GroupBillingInfo
                                    key={gIdx}
                                    type={group.type}
                                    distributor={group.distributor}
                                    formatCNPJ={formatCNPJ}
                                    productNames={group.products.map(p => p.name)}
                                    billingOverrides={billingOverrides}
                                    themePrimary={primaryColor}
                                    themeAccent={accentColor}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {config?.isPriceStudy && (
                    <div style={{ padding: '0 80px', marginTop: '10px' }}>
                        <PriceStudySection themePrimary={primaryColor} />
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', color: '#9ca3af', fontSize: '11px', paddingBottom: '20px' }}>
                    Infodive IT Solutions - Resumo de Investimento
                </div>
            </div>

            {/* Optionals Page(s) */}
            {optionalChunks.map((chunk, index) => (
                <div
                    key={`opt-${index}`}
                    className="proposal-investment-page"
                    data-proposal-page="true"
                    style={{
                        width: '210mm',
                        height: '293mm',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        color: primaryColor,
                        marginBottom: '40px'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)` }} />
                    <div style={{ padding: '40px 80px 10px 80px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: primaryColor, marginBottom: '8px' }}>
                            Condições de <span style={{ color: accentColor }}>Pagamento</span>
                            {totalOptionalPages > 1 && <span style={{ fontSize: '16px', color: '#64748b', marginLeft: '12px', fontWeight: '400' }}>({index + 1}/{totalOptionalPages})</span>}
                        </h2>
                        <div style={{ width: '30px', height: '3px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '12px' }} />
                    </div>

                    <ProposalInvestmentOptionals
                        optionalProducts={optionalProducts}
                        rootProducts={chunk}
                        formatCurrency={formatCurrency}
                        themePrimary={primaryColor}
                        themeAccent={accentColor}
                    />

                    {/* Only show billing/price study on the LAST optional page */}
                    {index === totalOptionalPages - 1 && (
                        <>
                            {showBilling && !config?.isPriceStudy && (
                                <div style={{ padding: '0 80px', marginTop: '10px' }}>
                                    <GroupBillingInfo type="reseller" formatCNPJ={formatCNPJ} themePrimary={primaryColor} themeAccent={accentColor} />
                                </div>
                            )}

                            {config?.isPriceStudy && (
                                <div style={{ padding: '0 80px', marginTop: '10px' }}>
                                    <PriceStudySection themePrimary={primaryColor} />
                                </div>
                            )}
                        </>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', color: '#9ca3af', fontSize: '11px', paddingBottom: '40px' }}>
                        Infodive IT Solutions - Condições Comerciais {totalOptionalPages > 1 ? `(${index + 1})` : ''}
                    </div>
                </div>
            ))}

            {/* Handle case where there are NO optionals but showBilling is true (managed in main loop actually) */}
            {!hasOptionals && showBilling && groups.length === 0 && (
                <div
                    className="proposal-investment-page"
                    data-proposal-page="true"
                    style={{
                        width: '210mm',
                        height: '293mm',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        color: primaryColor,
                        marginBottom: '40px'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)` }} />
                    <div style={{ padding: '60px 80px 20px 80px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                            <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: primaryColor, marginBottom: '8px' }}>Condições de <span style={{ color: accentColor }}>Pagamento</span></h2>
                        <div style={{ width: '30px', height: '3px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                    </div>

                    {!config?.isPriceStudy && (
                        <div style={{ padding: '0 80px', marginTop: '10px' }}>
                            {/* If no main products and no optionals, and showBilling is true, default to reseller billing */}
                            <GroupBillingInfo type="reseller" formatCNPJ={formatCNPJ} themePrimary={primaryColor} themeAccent={accentColor} />
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', color: '#9ca3af', fontSize: '11px', paddingBottom: '40px' }}>
                        Infodive IT Solutions - Condições Comerciais
                    </div>
                </div>
            )}
        </div>
    );
}

// New helper component for Group Billing Info
function GroupBillingInfo({ type, distributor, formatCNPJ, productNames = [], billingOverrides = {}, themePrimary, themeAccent }: { type: 'reseller' | 'direct', distributor?: any, formatCNPJ: (v: string) => string, productNames?: string[], billingOverrides?: Record<string, BillingOverride>, themePrimary?: string, themeAccent?: string }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';

    const productList = productNames.length > 0 ? (
        <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Produtos neste faturamento:
            </div>
            <div style={{ fontSize: '11px', color: primaryColor, fontWeight: '600', lineHeight: '1.6' }}>
                {productNames.join(' • ')}
            </div>
        </div>
    ) : null;

    if (type === 'reseller') {
        return (
            <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '4px', backgroundColor: '#64748b' }} />
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faturamento Direto</div>
                <div style={{ fontSize: '14px', color: primaryColor, fontWeight: '800' }}>Infodive Representações e Serviços Ltda</div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '11px', color: '#475569' }}>
                    <div><span style={{ fontWeight: '700', color: primaryColor }}>CNPJ:</span> 05.613.186/0001-78</div>
                    <div><span style={{ fontWeight: '700', color: primaryColor }}>IE:</span> Isento</div>
                </div>
                {productList}
            </div>
        );
    }

    if (distributor) {
        const override = billingOverrides[distributor.id];
        const displayCnpj = override?.selectedCnpj || distributor.cnpj;
        const displayName = override?.selectedBranchName || distributor.name;
        const displayTerms = override?.paymentTerms ?? distributor.payment_terms;
        return (
            <div style={{
                border: '1px solid #fecdd3',
                borderRadius: '16px',
                padding: '24px',
                backgroundColor: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(227, 24, 55, 0.05)',
                width: '100%'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '6px', backgroundColor: accentColor }} />
                <div style={{ fontSize: '10px', fontWeight: '900', color: accentColor, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Faturamento Direto</div>
                <div style={{ fontSize: '18px', color: primaryColor, fontWeight: '800', marginBottom: '4px' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600' }}>CNPJ:</span> {formatCNPJ(displayCnpj)}
                </div>

                {productList}

                {displayTerms && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#fff1f2',
                        borderRadius: '12px',
                        border: '1px solid #fecdd3',
                        marginTop: '12px',
                    }}>
                        <span style={{
                            textTransform: 'uppercase',
                            fontSize: '10px',
                            fontWeight: '900',
                            color: accentColor,
                            display: 'block',
                            marginBottom: '12px',
                            letterSpacing: '0.5px'
                        }}>
                            Condições e Prazos de Pagamento:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayTerms.split(';').map((part: string, pIdx: number) => {
                                if (!part.trim()) return null;
                                return (
                                    <div key={pIdx} style={{
                                        display: 'flex',
                                        gap: '10px',
                                        fontSize: '11px',
                                        color: '#9f1239',
                                        lineHeight: '1.6',
                                        fontWeight: '600'
                                    }}>
                                        <div style={{ color: accentColor, fontSize: '14px', marginTop: '-2px' }}>•</div>
                                        <div style={{ flex: 1 }}>{part.trim()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

// Helper component for Price Study Section
function PriceStudySection({ themePrimary }: { themePrimary?: string }) {
    const primaryColor = themePrimary || '#1e3a5f';
    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: primaryColor, marginBottom: '10px', textTransform: 'uppercase' }}>
                Estudo de Preços
            </h3>
            <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                color: '#92400e',
                lineHeight: '1.5'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Validade da Estimativa</div>
                Este estudo tem validade até o dia <strong>25 de março de 2025</strong>, devido às constantes atualizações de preços por parte dos fabricantes nesse momento do mercado.
            </div>
        </div>
    );
}
