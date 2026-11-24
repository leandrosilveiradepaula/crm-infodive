'use client';

import React from 'react';
import { ArrowRight, Building2, ClipboardList, Mail, Package, Phone, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Deal } from '@/types/deal';

interface OverviewTabProps {
    deal: Deal;
    onViewStakeholders: () => void;
    onViewProducts: () => void;
    onViewCommunications: () => void;
}

const stageLabels: Record<string, string> = {
    qualification: 'Qualificação',
    discovery: 'Descoberta',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    won: 'Ganho',
    lost: 'Perdido',
};

function recorded(value?: string | null) {
    return value?.trim() ? value : 'Não informado';
}

export function OverviewTab({ deal, onViewStakeholders, onViewProducts, onViewCommunications }: OverviewTabProps) {
    const products = Array.isArray(deal.deal_products) ? deal.deal_products : [];
    const healthScore = typeof deal.health_score === 'number' && Number.isFinite(deal.health_score)
        ? Math.max(0, Math.min(100, deal.health_score)) : null;
    const stakeholderCount = Array.isArray(deal.custom_fields?.stakeholders)
        ? deal.custom_fields.stakeholders.length : null;
    const ownerName = deal.owner_profile?.full_name || deal.owner;
    const nextAction = products.length === 0
        ? {
            title: 'Incluir produtos ou serviços',
            description: 'A oportunidade ainda não possui itens vinculados.',
            label: 'Gerenciar produtos',
            onClick: onViewProducts,
        }
        : deal.stage === 'qualification' || deal.stage === 'discovery'
            ? {
                title: 'Conferir os contatos',
                description: 'Verifique quem está vinculado à negociação antes de avançar de etapa.',
                label: 'Ver contatos',
                onClick: onViewStakeholders,
            }
            : {
                title: 'Revisar as comunicações',
                description: 'Consulte o histórico disponível antes do próximo contato.',
                label: 'Ver comunicações',
                onClick: onViewCommunications,
            };

    return (
        <div data-qa-region="deal-overview" className="ds-deal-overview">
            <section className="ds-deal-overview-section" aria-labelledby="deal-overview-details">
                <div className="ds-deal-section-heading">
                    <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <h3 id="deal-overview-details" className="ds-type-section-title text-foreground">Detalhes da oportunidade</h3>
                </div>
                <dl className="ds-deal-facts">
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Empresa</dt>
                        <dd className="ds-type-body font-medium text-foreground">{recorded(deal.company)}</dd>
                    </div>
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Responsável</dt>
                        <dd className="ds-type-body font-medium text-foreground">{recorded(ownerName)}</dd>
                    </div>
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Etapa atual</dt>
                        <dd className="ds-type-body font-medium text-foreground">{stageLabels[deal.stage] || recorded(deal.stage)}</dd>
                    </div>
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Origem</dt>
                        <dd className="ds-type-body font-medium text-foreground">{recorded(deal.lead_source)}</dd>
                    </div>
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Tempo na etapa</dt>
                        <dd className="ds-type-body font-medium text-foreground">
                            {typeof deal.days_in_stage === 'number' && Number.isFinite(deal.days_in_stage)
                                ? `${deal.days_in_stage} dias` : 'Não informado'}
                        </dd>
                    </div>
                    <div className="ds-deal-fact">
                        <dt className="ds-type-label text-muted-foreground">Saúde registrada</dt>
                        <dd className={`ds-type-body font-medium ${healthScore !== null && healthScore >= 80 ? 'text-success-readable' : 'text-foreground'}`}>
                            {healthScore === null ? 'Sem avaliação' : `${healthScore}/100`}
                        </dd>
                    </div>
                </dl>
            </section>

            <section className="ds-panel-highlight ds-deal-next-action" aria-labelledby="deal-next-action-title">
                <div className="flex min-w-0 items-start gap-3">
                    <ClipboardList className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="ds-type-metadata text-muted-foreground">Ação sugerida conforme os dados da oportunidade</p>
                        <h3 id="deal-next-action-title" className="ds-type-body font-semibold text-foreground">{nextAction.title}</h3>
                        <p className="ds-type-label text-muted-foreground">{nextAction.description}</p>
                    </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="ds-type-control shrink-0"
                    onClick={nextAction.onClick}>
                    {nextAction.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
            </section>

            <div className="ds-deal-overview-grid">
                <section className="ds-deal-overview-section" aria-labelledby="deal-linked-products">
                    <div className="ds-deal-section-heading">
                        <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <h3 id="deal-linked-products" className="ds-type-section-title text-foreground">Produtos vinculados</h3>
                    </div>
                    {products.length ? (
                        <ul className="divide-y divide-border">
                            {products.slice(0, 4).map(product => (
                                <li key={product.id} className="ds-deal-detail-row">
                                    <span className="ds-type-label min-w-0 break-words font-medium text-foreground">
                                        {product.display_name || product.name || 'Item sem nome'}
                                    </span>
                                    <span className="ds-type-label shrink-0 text-muted-foreground">
                                        {product.quantity} un.
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="ds-type-label text-muted-foreground">Nenhum produto ou serviço vinculado.</p>
                    )}
                    {products.length > 4 && (
                        <p className="ds-type-metadata text-muted-foreground">Mostrando 4 de {products.length} itens.</p>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={onViewProducts}
                        className="ds-type-control mt-3">Ver produtos</Button>
                </section>

                <section className="ds-deal-overview-section" aria-labelledby="deal-linked-contact">
                    <div className="ds-deal-section-heading">
                        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <h3 id="deal-linked-contact" className="ds-type-section-title text-foreground">Contato</h3>
                    </div>
                    <dl className="space-y-3">
                        <div className="flex items-start gap-2">
                            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <dt className="ds-type-metadata text-muted-foreground">Nome</dt>
                                <dd className="ds-type-label font-medium text-foreground">{recorded(deal.contact_name)}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div className="min-w-0">
                                <dt className="ds-type-metadata text-muted-foreground">E-mail</dt>
                                <dd className="ds-type-label break-all text-foreground">{recorded(deal.contact_email)}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <dt className="ds-type-metadata text-muted-foreground">Telefone</dt>
                                <dd className="ds-type-label text-foreground">{recorded(deal.contact_phone)}</dd>
                            </div>
                        </div>
                    </dl>
                    {stakeholderCount !== null && (
                        <p className="ds-type-metadata mt-3 text-muted-foreground">{stakeholderCount} contatos complementares registrados.</p>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={onViewStakeholders}
                        className="ds-type-control mt-3">Ver contatos</Button>
                </section>
            </div>

            <section className="ds-deal-overview-section" aria-labelledby="deal-description-heading">
                <div className="ds-deal-section-heading">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <h3 id="deal-description-heading" className="ds-type-section-title text-foreground">Descrição e próximos passos</h3>
                </div>
                <dl className="ds-deal-note-list">
                    <div>
                        <dt className="ds-type-label font-medium text-muted-foreground">Descrição registrada</dt>
                        <dd className="ds-type-label whitespace-pre-wrap break-words text-foreground">{recorded(deal.description)}</dd>
                    </div>
                    <div>
                        <dt className="ds-type-label font-medium text-muted-foreground">Próximo passo registrado</dt>
                        <dd className="ds-type-label whitespace-pre-wrap break-words text-foreground">{recorded(deal.next_step)}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
