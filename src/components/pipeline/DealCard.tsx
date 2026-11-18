'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Building, Clock, Mail, Phone, ExternalLink, FileText, ChevronRight, AlertCircle, ShoppingBag, User, Calendar, Copy, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/format';
import { Deal } from '@/types/deal';

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
                    onClick={onClick}
                    className="rounded-[var(--radius-panel)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={provided.draggableProps.style}
                >
                    <motion.div
                        layout
                        layoutId={deal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: snapshot.isDragging ? 1.05 : 1,
                            rotate: snapshot.isDragging ? 2 : 0
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            mass: 0.8
                        }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            relative group cursor-pointer rounded-[var(--radius-panel)] border border-border bg-card p-3 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform]
                            ${snapshot.isDragging
                                ? 'z-50 scale-[1.02] border-primary/50 bg-card/95 shadow-xl ring-2 ring-primary/40 backdrop-blur-md'
                                : 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md'
                            }
                        `}
                    >
                        {/* Health Indicator - Slimmer */}
                        <div className={`absolute left-0 top-3 bottom-3 w-1 transition-all duration-500 z-10 rounded-r-full
                            ${healthStatus === 'danger' ? 'bg-destructive shadow-[0_0_8px_var(--color-destructive)]' :
                                healthStatus === 'warning' ? 'bg-warning' :
                                    'bg-success/50'}
                        `} />

                        {/* Stagnation Alert - Floating badge */}
                        {isStagnant && (
                            <div className="absolute -top-2 -right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive-subtle border border-destructive/40 shadow-lg z-20 animate-pulse">
                                <div className="h-1 w-1 rounded-full bg-card shadow-sm" />
                                <span className="text-[8px] font-black text-foreground uppercase tracking-widest">Estagnado</span>
                            </div>
                        )}

                        {/* Content Layer */}
                        <div className="relative z-10 pl-2">
                            {/* Dedicated drag handle prevents nested interactive descendants:
                                Space lifts/drops the card via dnd keyboard sensor, while
                                Enter on the independent action opens the details. */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <button
                                    {...provided.dragHandleProps}
                                    type="button"
                                    aria-label={`Arrastar oportunidade ${deal.title}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className="focus-ring rounded-md border border-border bg-surface-subtle p-1.5 text-muted-foreground"
                                >
                                    <GripHorizontal className="h-3.5 w-3.5" />
                                </button>
                                {onClick && (
                                    <button
                                        type="button"
                                        onClick={(event) => { event.stopPropagation(); onClick(); }}
                                        className="focus-ring rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-muted"
                                    >
                                        Abrir detalhes <span className="sr-only">da oportunidade {deal.title}</span>
                                    </button>
                                )}
                            </div>

                            {/* Tags & Header */}
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {(deal.tags || []).slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-muted text-[8px] font-black text-muted-foreground border border-border/50 uppercase tracking-tighter">
                                            {tag}
                                        </span>
                                    ))}
                                    {(deal.tags || []).length > 3 && (
                                        <span className="text-[8px] font-black text-muted-foreground self-center pl-1">+{(deal.tags || []).length - 3}</span>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                        {deal.title}
                                    </h4>
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground truncate">
                                        <ShoppingBag className="h-3 w-3 shrink-0" />
                                        <span>{deal.company || 'Cliente Desconhecido'}</span>
                                    </div>
                                </div>

                                {/* Next Step Interaction - More subtle */}
                                {deal.next_step && (
                                    <div className="px-2 py-1.5 bg-surface-subtle rounded-lg border border-border flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-primary shrink-0 animate-pulse" />
                                        <p className="text-[9px] text-primary font-bold leading-tight uppercase tracking-tight flex-1 truncate">
                                            {deal.next_step}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Value & Metadata Footer */}
                            <div className="mt-3 pt-2 border-t border-border/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-black text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left">
                                        {formatCompact(deal.value)}
                                    </span>

                                    {/* Owner Bubble - Overlapping or singular */}
                                    <div className={`
                                        h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md ring-2 ring-card
                                        ${deal.owner === 'Leandro Silveira' ? 'bg-primary' : 'bg-info'}
                                    `} title={`Responsável: ${deal.owner || 'N/A'}`}>
                                        {(deal.owner || 'LS').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>

                                {/* Probability Progress - Sleek */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Probabilidade</span>
                                        <span className={`text-[9px] font-black ${deal.probability > 70 ? 'text-success' : 'text-primary'}`}>
                                            {deal.probability}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${deal.probability}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full ${deal.probability > 70 ? 'bg-gradient-to-r from-success to-success/80' : 'bg-gradient-to-r from-primary to-primary/60'}`}
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
                                        <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            <span>{new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Overlay (Glass) - MUST be pointer-events-auto */}
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all z-20 pointer-events-auto">
                            <AnimatePresence>
                                {onDuplicate && (
                                    <motion.button
                                        key="duplicate-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicate(deal.id);
                                        }}
                                        className="p-2 bg-popover shadow-2xl border border-primary/30 rounded-xl text-primary hover:text-primary/80 hover:border-primary/50 transition-all"
                                        title="Duplicar Oportunidade"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </motion.button>
                                )}
                                {deal.contact_phone && (
                                    <motion.a
                                        key="whatsapp-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={`https://wa.me/55${deal.contact_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover shadow-2xl border border-success/30 rounded-xl text-success hover:text-success/80 hover:border-success/50 transition-all"
                                        title={`WhatsApp: ${deal.contact_phone}`}
                                    >
                                        <Phone className="h-4 w-4" />
                                    </motion.a>
                                )}
                                {deal.contact_email && (
                                    <motion.a
                                        key="email-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: 0.05 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={`mailto:${deal.contact_email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover shadow-2xl border border-primary/30 rounded-xl text-primary hover:text-primary/80 hover:border-primary/50 transition-all"
                                        title={`Email: ${deal.contact_email}`}
                                    >
                                        <Mail className="h-4 w-4" />
                                    </motion.a>
                                )}
                                {deal.contact_phone && (
                                    <motion.a
                                        key="phone-action"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: 0.1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={`tel:${deal.contact_phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-popover shadow-2xl border border-info/30 rounded-xl text-info hover:text-info/80 hover:border-info/50 transition-all"
                                        title={`Ligar: ${deal.contact_phone}`}
                                    >
                                        <Phone className="h-4 w-4" />
                                    </motion.a>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status Icons (Proposal, etc) */}
                        {hasProposal && (
                            <div className="absolute -top-3 -left-3 h-8 w-8 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-12 border-2 border-background z-30 transition-transform group-hover:rotate-0">
                                <FileText className="h-4 w-4 shadow-sm" />
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </Draggable>
    );
};
