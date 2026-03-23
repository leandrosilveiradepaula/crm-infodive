'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Building, Clock, Mail, Phone, ExternalLink, FileText, ChevronRight, AlertCircle, ShoppingBag, User, Calendar, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/format';

interface DealCardProps {
    deal: any;
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
                        onClick={onClick}
                        className={`
                            relative group cursor-pointer
                            bg-card rounded-[1.75rem] p-4 border shadow-sm transition-all duration-300
                            ${snapshot.isDragging
                                ? 'shadow-2xl shadow-primary/30 ring-2 ring-primary/40 border-primary/50 z-50 bg-card/90 backdrop-blur-md scale-105 rotate-2'
                                : 'hover:shadow-lg hover:border-primary/30 border-border hover:-translate-y-1'
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
                            <div className="absolute -top-2 -right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive border border-card shadow-lg z-20 animate-pulse">
                                <div className="h-1 w-1 rounded-full bg-card shadow-sm" />
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Estagnado</span>
                            </div>
                        )}

                        {/* Content Layer */}
                        <div className="relative z-10 pl-2">

                            {/* Tags & Header */}
                            <div className="space-y-2.5">
                                <div className="flex flex-wrap gap-1">
                                    {(deal.tags || []).slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-muted/50 text-[8px] font-black text-muted-foreground border border-border/50 uppercase tracking-tighter">
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
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground truncate opacity-80">
                                        <ShoppingBag className="h-3 w-3 shrink-0" />
                                        <span>{deal.company || 'Cliente Desconhecido'}</span>
                                    </div>
                                </div>

                                {/* Next Step Interaction - More subtle */}
                                {deal.next_step && (
                                    <div className="px-2 py-1.5 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-primary shrink-0 animate-pulse" />
                                        <p className="text-[9px] text-primary font-bold leading-tight uppercase tracking-tight flex-1 truncate">
                                            {deal.next_step}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Value & Metadata Footer */}
                            <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left">
                                        {formatCompact(deal.value)}
                                    </span>

                                    {/* Owner Bubble - Overlapping or singular */}
                                    <div className={`
                                        h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md ring-2 ring-card
                                        ${deal.owner_name === 'Leandro Silveira' ? 'bg-primary' : 'bg-info'}
                                    `} title={`Responsável: ${deal.owner_name || deal.owner || 'N/A'}`}>
                                        {(deal.owner_name || deal.owner || 'LS').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>

                                {/* Probability Progress - Sleek */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Probabilidade</span>
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
                                        <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 opacity-60">
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
                                        className="p-2 bg-popover/90 backdrop-blur-md shadow-2xl border border-primary/30 rounded-xl text-primary hover:text-primary/80 hover:border-primary/50 transition-all"
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
                                        className="p-2 bg-popover/90 backdrop-blur-md shadow-2xl border border-success/30 rounded-xl text-success hover:text-success/80 hover:border-success/50 transition-all"
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
                                        className="p-2 bg-popover/90 backdrop-blur-md shadow-2xl border border-primary/30 rounded-xl text-primary hover:text-primary/80 hover:border-primary/50 transition-all"
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
                                        className="p-2 bg-popover/90 backdrop-blur-md shadow-2xl border border-info/30 rounded-xl text-info hover:text-info/80 hover:border-info/50 transition-all"
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
