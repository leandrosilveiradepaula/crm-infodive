'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Building2, Linkedin, Edit2, X, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/types/contact';
import { updateContact } from '@/app/(dashboard)/contacts/actions';
import { useDraftForm, FloatingSaveBar, UnsavedChangesDialog } from '@/components/ui/floating-save-bar';
import { GhostField } from '@/components/ui/ghost-field';

interface ViewContactDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact: Contact | null;
    onEdit?: (contact: Contact) => void;
}

export function ViewContactDrawer({ open, onOpenChange, contact: initialContact, onEdit }: ViewContactDrawerProps) {
    const router = useRouter();
    const [localContact, setLocalContact] = useState<Contact | null>(initialContact);

    // Sync state with prop changes
    useEffect(() => {
        setLocalContact(initialContact);
    }, [initialContact?.id]);

    const initialContactData = React.useMemo(() => ({
        name: localContact?.name || '',
        role: localContact?.role || '',
        email: localContact?.email || '',
        mobile_phone: localContact?.mobile_phone || '',
        landline_phone: localContact?.landline_phone || '',
        linkedin: localContact?.linkedin || ''
    }), [localContact]);

    const {
        formData,
        setFormData,
        updateField,
        isDirty,
        changedCount,
        isSaving,
        saveChanges,
        discardChanges,
        safeExecute,
        showUnsavedModal,
        setShowUnsavedModal
    } = useDraftForm({
        initialData: initialContactData,
        onSave: async (updated) => {
            if (!localContact?.id) return;
            await updateContact(localContact.id, updated as Partial<Contact>);
            setLocalContact((prev: Contact | null) => prev ? { ...prev, ...updated } as Contact : null);
            router.refresh();
        }
    });

    if (!localContact) return null;

    return (
        <Sheet open={open} onOpenChange={(val) => !val && safeExecute(() => onOpenChange(false))}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[540px] flex flex-col p-0 gap-0"
                onPointerDownOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest('.floating-save-bar')) {
                        e.preventDefault();
                    }
                }}
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-6 pt-5 pb-4 shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20 shrink-0">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="font-bold text-foreground text-base tracking-tight leading-tight truncate">
                                    {formData.name || localContact.name}
                                </SheetTitle>
                                <SheetDescription className="sr-only">Detalhes do contato {localContact.name}</SheetDescription>
                                <div className="flex items-center gap-2 mt-1">
                                    {localContact.is_primary ? (
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                            Contato Principal
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground border-border">
                                            Contato Secundário
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => safeExecute(() => onOpenChange(false))}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
                    {/* Dados Cadastrais */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Informações Pessoais</h3>
                        <div className="bg-card border border-border rounded-xl p-4 space-y-0.5 shadow-sm">
                            <GhostField label="Nome" value={formData.name} onChange={v => updateField('name', v)} />
                            <GhostField label="Cargo" value={formData.role} onChange={v => updateField('role', v)} />
                        </div>
                    </div>

                    {/* Vínculo de Empresa */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Empresa</h3>
                        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg border border-border shrink-0">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate">{localContact.account?.name || 'Sem Empresa'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Canais de Contato</h3>
                        <div className="bg-card border border-border rounded-xl p-4 space-y-0.5 shadow-sm">
                            <GhostField label="Email" value={formData.email} onChange={v => updateField('email', v)} icon={<Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />} />
                            <GhostField label="Celular" value={formData.mobile_phone} onChange={v => updateField('mobile_phone', v)} icon={<Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />} />
                            <GhostField label="Telefone Fixo" value={formData.landline_phone} onChange={v => updateField('landline_phone', v)} icon={<Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />} />
                        </div>
                    </div>

                    {/* Social networks */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Redes Sociais</h3>
                        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
                            <GhostField label="LinkedIn" value={formData.linkedin} onChange={v => updateField('linkedin', v)} icon={<Linkedin className="w-3.5 h-3.5 text-[#0077b5] shrink-0" />} placeholder="https://linkedin.com/in/..." />
                            {formData.linkedin && (
                                <Button
                                    variant="outline"
                                    className="w-full h-9 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border-[#0077b5]/20 text-[#0077b5] text-xs font-bold uppercase tracking-wider gap-2 rounded-xl"
                                    onClick={() => window.open(formData.linkedin, '_blank')}
                                >
                                    <Linkedin className="h-4 w-4" />
                                    Ver Perfil
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <FloatingSaveBar
                    isDirty={isDirty && !showUnsavedModal}
                    changedCount={changedCount}
                    isSaving={isSaving}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                />

                <UnsavedChangesDialog
                    open={showUnsavedModal}
                    onOpenChange={setShowUnsavedModal}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                    isSaving={isSaving}
                />
            </SheetContent>
        </Sheet>
    );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 last:pb-0 first:pt-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-[240px]">
                {value || '—'}
            </span>
        </div>
    );
}
