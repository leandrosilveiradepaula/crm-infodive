import React from 'react';
import type { Deal, DealProduct } from '@/types/deal';
import type { Account } from '@/types/account';
import type { BillingOverride } from '@/hooks/useProposalEditorState';
import { ProposalInvestmentTable, ProposalInvestmentOptionals } from './ProposalInvestmentComponents';

interface ProposalInvestmentPageProps {
    deal: Deal;
    distributors?: Account[];
    config?: any;
    simplifiedProductNames?: Record<string, string>;
    billingOverrides?: Record<string, BillingOverride>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalInvestmentPage({ deal, distributors = [], config, simplifiedProductNames = {}, billingOverrides = {}, themePrimary, themeAccent, layout = 'portrait' }: ProposalInvestmentPageProps & { layout?: 'portrait' | 'landscape' }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    
    const isLandscape = layout === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const height = isLandscape ? '167mm' : '293mm';
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
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
    interface BillingGroup {
        title: string;
        products: DealProduct[];
        type: 'reseller' | 'direct';
        distributor?: Account;
        distributorCnpj?: string;
    }
    const groups: BillingGroup[] = [];

    // 1. Reseller Group
    const resellerProducts = mainProducts.filter(p => p.billing_type === 'direct' || !p.billing_type);
    if (resellerProducts.length > 0) {
        // Find the CNPJ from any product in this group
        const resellerCnpjOverride = resellerProducts.find(p => p.distributor_cnpj && p.distributor_cnpj.length > 5)?.distributor_cnpj;
        
        groups.push({
            title: 'Faturamento Revenda (Infodive)',
            products: resellerProducts,
            type: 'reseller',
            // Pass the override directly in the group metadata for easier access
            distributorCnpj: resellerCnpjOverride
        });
    }

    // 2. Direct Groups by Distributor + CNPJ (Branch Support)
    const directProducts = mainProducts.filter(p => p.billing_type === 'indirect');
    
    // Create unique keys for each unique billing entity (Distributor + Specific CNPJ)
    const directGroupKeys = Array.from(new Set(directProducts.map(p => `${p.distributor_id || 'no-dist'}|${p.distributor_cnpj || 'no-cnpj'}`)));

    directGroupKeys.forEach(key => {
        const [dId, dCnpj] = key.split('|');
        const productsInGroup = directProducts.filter(p => 
            (p.distributor_id || 'no-dist') === dId && 
            (p.distributor_cnpj || 'no-cnpj') === dCnpj
        );
        
        if (productsInGroup.length === 0) return;

        const dist = dId !== 'no-dist' ? distributors.find(d => d.id === dId) : undefined;
        
        groups.push({
            title: `Faturamento Direto (${dist?.name || 'Distribuidor'})`,
            products: productsInGroup,
            type: 'direct',
            distributor: dist,
            distributorCnpj: dCnpj !== 'no-cnpj' ? dCnpj : undefined
        });
    });


    const showBilling = config?.showBillingInfo !== false;
    const hasOptionals = optionalProducts.length > 0;

    // Chunk optional products (Top-level blocks)
    // Max 3 per page (or 2 in landscape) to avoid overflow since they can have children
    const topLevelOptionals = optionalProducts.filter(p => !p.parent_id || !optionalProducts.some(op => op.id === p.parent_id));
    const optionalsPerPage = isLandscape ? 2 : 3;
    const optionalChunks: DealProduct[][] = [];
    for (let i = 0; i < topLevelOptionals.length; i += optionalsPerPage) {
        optionalChunks.push(topLevelOptionals.slice(i, i + optionalsPerPage));
    }

    const totalOptionalPages = optionalChunks.length;

    return (
        <div className="proposal-investment-multi-page">
            {/* Investment Page */}
            <div
                className="proposal-investment-page"
                data-proposal-page="true"
                style={{
                    width: width,
                    minHeight: height,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: primaryColor,
                    marginBottom: '40px',
                    paddingBottom: isLandscape ? '20px' : '40px'
                }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)` }} />

                <div style={{ padding: isLandscape ? '25px 80px 15px 80px' : '40px 80px 20px 80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '15px' : '20px' }}>
                        <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: primaryColor, marginBottom: '8px', letterSpacing: '-1px' }}>
                        Estrutura de <span style={{ color: accentColor }}>Investimento</span>
                    </h1>
                    <div style={{ width: '40px', height: '4px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                </div>

                {/* Investment Tables */}
                {(() => {
                    // Derive quote info: prefer deal_quotes, fallback to unique quote_ids from products
                    const quotes = deal.deal_quotes && deal.deal_quotes.length > 0
                        ? deal.deal_quotes
                        : (() => {
                            const uniqueIds = [...new Set(mainProducts.map(p => p.quote_id).filter(Boolean))] as string[];
                            return uniqueIds.map(id => ({ id, title: `Cotação`, is_primary: false }));
                        })();
                    const isMultiQuoteOptions = config?.quoteDisplayMode === 'options' && quotes.length > 1;
                    const isSingleQuoteOptions = config?.quoteDisplayMode === 'options' && quotes.length <= 1;

                    // Multi-quote options: each quote = 1 option (existing behavior)
                    if (isMultiQuoteOptions) {
                        return (
                            <div>
                                {quotes
                                    .filter(q => mainProducts.some(p => p.quote_id === q.id))
                                    .map((quote, qIdx) => {
                                        const quoteProducts = mainProducts.filter(p => p.quote_id === quote.id);
                                        const optionLabel = String.fromCharCode(65 + qIdx);
                                        return (
                                            <div key={quote.id} style={{ marginBottom: '28px' }}>
                                                <div style={{
                                                    padding: '0 80px',
                                                    marginBottom: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                }}>
                                                    <div style={{
                                                        border: `1.5px solid ${accentColor}`,
                                                        color: accentColor,
                                                        fontSize: '10px',
                                                        fontWeight: '800',
                                                        padding: '3px 10px',
                                                        borderRadius: '6px',
                                                        letterSpacing: '1px',
                                                        backgroundColor: `${accentColor}08`
                                                    }}>
                                                        OPÇÃO {optionLabel}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '15px',
                                                        fontWeight: '700',
                                                        color: primaryColor,
                                                        letterSpacing: '-0.2px'
                                                    }}>
                                                        {quote.title}
                                                    </span>
                                                </div>
                                                <ProposalInvestmentTable
                                                    mainProducts={quoteProducts}
                                                    formatCurrency={formatCurrency}
                                                    simplifiedProductNames={simplifiedProductNames}
                                                    themePrimary={primaryColor}
                                                    themeAccent={accentColor}
                                                    optionLabel={`Opção ${optionLabel}`}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        );
                    }

                    // Single-quote options: each root product (+ children) = 1 option
                    if (isSingleQuoteOptions) {
                        const rootProducts = mainProducts.filter(p => !p.parent_id);
                        return (
                            <div>
                                {rootProducts.map((rootProduct, pIdx) => {
                                    const children = mainProducts.filter(p => p.parent_id === rootProduct.id);
                                    const optionProducts = [rootProduct, ...children];
                                    const optionLabel = String.fromCharCode(65 + pIdx);
                                    const displayName = simplifiedProductNames[rootProduct.name] || rootProduct.display_name || rootProduct.name;
                                    return (
                                        <div key={rootProduct.id} style={{ marginBottom: '28px' }}>
                                            <div style={{
                                                padding: '0 80px',
                                                marginBottom: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                            }}>
                                                <div style={{
                                                    backgroundColor: accentColor,
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    letterSpacing: '0.5px',
                                                }}>
                                                    OPÇÃO {optionLabel}
                                                </div>
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    color: primaryColor,
                                                }}>
                                                    {displayName}
                                                </span>
                                            </div>
                                            <ProposalInvestmentTable
                                                mainProducts={optionProducts}
                                                formatCurrency={formatCurrency}
                                                simplifiedProductNames={simplifiedProductNames}
                                                themePrimary={primaryColor}
                                                themeAccent={accentColor}
                                                optionLabel={`Opção ${optionLabel}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }

                    // Consolidated view: follow strict order from CRM
                    return (
                        <ProposalInvestmentTable
                            mainProducts={mainProducts}
                            formatCurrency={formatCurrency}
                            simplifiedProductNames={simplifiedProductNames}
                            themePrimary={primaryColor}
                            themeAccent={accentColor}
                        />
                    );
                })()}

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
                                    productNames={Array.from(
                                        group.products.reduce((acc, p) => {
                                            const rawName = (simplifiedProductNames[p.name] || p.display_name || p.name || '').toString();
                                            // Nuclear clean: remove ALL types of invisible spaces, normalize to single space, trim, and handle Case
                                            const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                                            const key = clean.toLowerCase();
                                            
                                            if (clean && !acc.has(key)) {
                                                acc.set(key, clean);
                                            }
                                            return acc;
                                        }, new Map<string, string>()).values()
                                    )}
                                    billingOverrides={billingOverrides}
                                    themePrimary={primaryColor}
                                    themeAccent={accentColor}
                                    displayCnpjOverride={group.distributorCnpj}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {config?.isPriceStudy && (
                    <div style={{ padding: '0 80px', marginTop: '10px' }}>
                        <PriceStudySection themePrimary={primaryColor} priceStudyValidity={config?.editableTexts?.priceStudyValidity} />
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
                        width: width,
                        height: height,
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
                    <div style={{ padding: isLandscape ? '25px 80px 10px 80px' : '40px 80px 10px 80px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '15px' : '20px' }}>
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
                        simplifiedProductNames={simplifiedProductNames}
                        themePrimary={primaryColor}
                        themeAccent={accentColor}
                    />

                    {/* Only show billing/price study on the LAST optional page */}
                    {index === totalOptionalPages - 1 && (
                        <>
                            {showBilling && !config?.isPriceStudy && (
                                <div style={{ padding: '0 80px', marginTop: '10px' }}>
                                    <GroupBillingInfo 
                                        type="reseller" 
                                        formatCNPJ={formatCNPJ} 
                                        themePrimary={primaryColor} 
                                        themeAccent={accentColor}
                                        productNames={Array.from(
                                            optionalProducts
                                                .filter(p => p.billing_type === 'direct' || !p.billing_type)
                                                .reduce((acc, p) => {
                                                    const rawName = (simplifiedProductNames[p.name] || p.display_name || p.name || '').toString();
                                                    const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                                                    const key = clean.toLowerCase();
                                                    if (clean && !acc.has(key)) acc.set(key, clean);
                                                    return acc;
                                                }, new Map<string, string>()).values()
                                        )}
                                    />
                                </div>
                            )}

                            {config?.isPriceStudy && (
                                <div style={{ padding: '0 80px', marginTop: '10px' }}>
                                    <PriceStudySection themePrimary={primaryColor} priceStudyValidity={config?.editableTexts?.priceStudyValidity} />
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
                        width: width,
                        height: height,
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
                    <div style={{ padding: isLandscape ? '30px 80px 20px 80px' : '60px 80px 20px 80px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLandscape ? '15px' : '30px' }}>
                            <img src="/assets/logo-infodive.png" alt="Infodive" style={{ height: '42px' }} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: primaryColor, marginBottom: '8px' }}>Condições de <span style={{ color: accentColor }}>Pagamento</span></h2>
                        <div style={{ width: '30px', height: '3px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '16px' }} />
                    </div>

                    {!config?.isPriceStudy && (
                        <div style={{ padding: '0 80px', marginTop: '10px' }}>
                            {/* If no main products and no optionals, and showBilling is true, default to reseller billing with override check */}
                            <GroupBillingInfo 
                                type="reseller" 
                                formatCNPJ={formatCNPJ} 
                                themePrimary={primaryColor} 
                                themeAccent={accentColor}
                                displayCnpjOverride={products.find(p => p.distributor_cnpj && p.distributor_cnpj.length > 5)?.distributor_cnpj}
                                productNames={Array.from(
                                    products.reduce((acc, p) => {
                                        const rawName = (simplifiedProductNames[p.name] || p.display_name || p.name || '').toString();
                                        const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                                        const key = clean.toLowerCase();
                                        if (clean && !acc.has(key)) acc.set(key, clean);
                                        return acc;
                                    }, new Map<string, string>()).values()
                                )}
                            />
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
function GroupBillingInfo({ type, distributor, formatCNPJ, productNames = [], billingOverrides = {}, themePrimary, themeAccent, displayCnpjOverride }: { type: 'reseller' | 'direct', distributor?: Account, formatCNPJ: (v: string) => string, productNames?: string[], billingOverrides?: Record<string, BillingOverride>, themePrimary?: string, themeAccent?: string, displayCnpjOverride?: string }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';

    // Ultimate deduplication logic inside the component to be 100% sure
    const deduplicatedNames = React.useMemo(() => {
        const seen = new Set<string>();
        return productNames.filter(name => {
            if (!name) return false;
            // Normalize for comparison: lowercase and single spaces
            const clean = name.toLowerCase().replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]+/g, ' ').trim();
            if (seen.has(clean)) return false;
            seen.add(clean);
            return true;
        });
    }, [productNames]);

    const productList = deduplicatedNames.length > 0 ? (
        <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Produtos neste faturamento:
            </div>
            <div style={{ fontSize: '11px', color: primaryColor, fontWeight: '600', lineHeight: '1.6' }}>
                {deduplicatedNames.join(' • ')}
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
                    <div><span style={{ fontWeight: '700', color: primaryColor }}>CNPJ:</span> {formatCNPJ(displayCnpjOverride || '05.613.186/0001-78')}</div>
                    <div><span style={{ fontWeight: '700', color: primaryColor }}>IE:</span> Isento</div>
                </div>
                {productList}
            </div>
        );
    }

    if (distributor) {
        const override = billingOverrides[distributor.id];
        // 1. Prioritize Product-level override (from opportunity selection)
        // 2. Fallback to Proposal-level override (from editor state)
        // 3. Fallback to Distributor main CNPJ
        const displayCnpj = displayCnpjOverride || override?.selectedCnpj || distributor.cnpj;

        // Try to resolve branch name if a specific CNPJ is chosen
        const branch = (distributor as any).account_branches?.find((b: any) => b.cnpj === displayCnpjOverride);
        const displayName = branch?.name || override?.selectedBranchName || distributor.name;
        
        const displayTerms = override?.paymentTerms ?? branch?.payment_terms ?? distributor.payment_terms;
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
function PriceStudySection({ themePrimary, priceStudyValidity }: { themePrimary?: string; priceStudyValidity?: string }) {
    const primaryColor = themePrimary || '#1e3a5f';
    const validityDate = priceStudyValidity || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
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
                Este estudo tem validade até o dia <strong>{validityDate}</strong>, devido às constantes atualizações de preços por parte dos fabricantes nesse momento do mercado.
            </div>
        </div>
    );
}
