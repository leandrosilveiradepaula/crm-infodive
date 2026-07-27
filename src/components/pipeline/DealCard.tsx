'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, Mail, Phone, FileText, ShoppingBag, Calendar, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/format';
import { Deal } from '@/types/deal';

import { Card, CardContent } from '@/components/ui/card';

interface DealCardProps {
    deal: Deal;
    index: number;
    hasProposal?: boolean;
    onClick?: () => void;
    onDuplicate?: (dealId: string) => void;
}

const formatCompact = (val: number) => formatCurrency(val, { compact: true });

export const DealCard: React.FC<DealCardProps> = ({ deal, index, hasProposal, onClick, onDuplicate }) => {

    // Calculate stagnation
    const daysInStage = deal.days_in_stage ?? 0;
    const isStagnant = daysInStage > 7;

    // Get health level
    const healthScore = deal.health_score ?? 100;
    const healthStatus = healthScore < 50 ? 'danger' : healthScore < 80 ? 'warning' : 'good';

    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="outline-none"
                    style={provided.draggableProps.style}
                >
                    <Card
                        onClick={onClick}
                        className={`card-interactive group ${
                            snapshot.isDragging
                                ? 'shadow-2xl shadow-primary/30 ring-2 ring-primary/40 border-primary/50 z-50 bg-card/90 backdrop-blur-md scale-105 rotate-1'
                                : ''
                        }`}
                    >
                        <CardContent>
                        {/* Health Indicator - Sharp */}
                        <div className={`absolute left-0 top-2 bottom-2 w-1 transition-all duration-500 z-10
                            ${healthStatus === 'danger' ? 'bg-destructive shadow-[0_0_8px_var(--color-destructive)]' :
                                healthStatus === 'warning' ? 'bg-warning' :
                                    'bg-success/50'}
                        `} />

                        {/* Stagnation Alert - Floating badge */}
                        {isStagnant && (
                            <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-destructive border border-card shadow-lg z-20 animate-pulse">
                                <div className="h-1 w-1 rounded-full bg-card shadow-sm" />
                                <span className="text-[7px] font-black text-white uppercase tracking-widest">Estagnado</span>
                            </div>
                        )}

                        {/* Content Layer */}
                        <div className="relative z-10 pl-1.5">

                            {/* Tags & Header */}
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                    {(deal.tags || []).slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="px-1 py-0.5 rounded-sm bg-muted/60 text-[7px] font-black text-muted-foreground border border-border/50 uppercase tracking-tighter">
                                            {tag}
                                        </span>
                                    ))}
                                    {(deal.tags || []).length > 3 && (
                                        <span className="text-[7px] font-black text-muted-foreground self-center pl-1">+{(deal.tags || []).length - 3}</span>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground text-xs leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {deal.title}
                                    </h4>
                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-muted-foreground truncate opacity-80">
                                        <ShoppingBag className="h-2.5 w-2.5 shrink-0" />
                                        <span>{deal.company || 'Cliente Desconhecido'}</span>
                                    </div>
                                </div>

                                {/* Next Step Interaction - Subtle & Sharp */}
                                {deal.next_step && (
                                    <div className="px-1.5 py-1 bg-primary/5 rounded-sm border border-primary/10 flex items-center gap-1">
                                        <div className="h-1 w-1 rounded-full bg-primary shrink-0 animate-pulse" />
                                        <p className="text-[8px] text-primary font-bold leading-none uppercase tracking-tight flex-1 truncate">
                                            {deal.next_step}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Value & Metadata Footer */}
                            <div className="mt-2 pt-1.5 border-t border-border/50 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    {(!deal.value || deal.value === 0) ? (
                                        <span className="text-[9px] font-bold text-destructive flex items-center gap-1 animate-pulse border border-destructive/20 bg-destructive/5 px-1 py-0.5 rounded-sm">
                                            ⚠️ Sem valor definido
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold font-mono text-foreground tracking-tight">
                                            {formatCompact(deal.value)}
                                        </span>
                                    )}

                                    {/* Owner Bubble - Sharp & Compact */}
                                    <div className={`
                                        h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black text-white shadow-sm ring-1 ring-border
                                        ${deal.owner === 'Leandro Silveira' ? 'bg-primary' : 'bg-info'}
                                    `} title={`Responsável: ${deal.owner || 'N/A'}`}>
                                        {(deal.owner || 'LS').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>

                                {/* Probability Progress - Flat & Precise */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Probabilidade</span>
                                        <span className={`text-[9px] font-black ${deal.probability > 70 ? 'text-success' : 'text-primary'}`}>
                                            {deal.probability}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-muted/50 rounded-none overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${deal.probability}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full ${deal.probability > 70 ? 'bg-success' : 'bg-primary'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    {daysInStage > 0 && (
                                        <div className="flex items-center gap-1 opacity-60">
                                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                            <span className="text-[9px] font-bold text-muted-foreground">{daysInStage}d na etapa</span>
                                        </div>
                                    )}
                                    {deal.expected_close_date && (
                                        <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 opacity-60">
                                            <Calendar className="h-2.5 w-2.5" />
                                            <span>{new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Overlay (Glass) - Sharp corners */}
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all z-20 pointer-events-auto">
                            <AnimatePresence>
                                {onDuplicate && (
                                    <motion.button
                                        key="duplicate-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicate(deal.id);
                                        }}
                                        className="p-2 bg-popover border border-border rounded-md text-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                        title="Duplicar Oportunidade"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </motion.button>
                                )}
                                {deal.contact_phone && (
                                    <motion.a
                                        key="whatsapp-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`https://wa.me/55${deal.contact_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover border border-border rounded-md text-success hover:border-success/50 transition-all shadow-sm"
                                        title={`WhatsApp: ${deal.contact_phone}`}
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                    </motion.a>
                                )}
                                {deal.contact_email && (
                                    <motion.a
                                        key="email-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`mailto:${deal.contact_email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover border border-border rounded-md text-primary hover:border-primary/50 transition-all shadow-sm"
                                        title={`Email: ${deal.contact_email}`}
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                    </motion.a>
                                )}
                                {deal.contact_phone && (
                                    <motion.a
                                        key="phone-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: 0.1 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`tel:${deal.contact_phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover border border-border rounded-md text-info hover:border-info/50 transition-all shadow-sm"
                                        title={`Ligar: ${deal.contact_phone}`}
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                    </motion.a>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status Icons (Proposal, etc) */}
                        {hasProposal && (
                            <div className="absolute -top-3 -left-3 h-7 w-7 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-md border-2 border-background z-30 transition-transform group-hover:rotate-6">
                                <FileText className="h-3.5 w-3.5 shadow-sm" />
                            </div>
                        )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};
