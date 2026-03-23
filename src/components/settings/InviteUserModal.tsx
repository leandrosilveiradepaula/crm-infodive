import React, { useState } from 'react';
import { X, Copy, Check, Mail, UserPlus } from 'lucide-react';
import { RoleSelect } from './RoleSelect';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviterOrgId?: string | null;
}

export const InviteUserModal = ({ isOpen, onClose, inviterOrgId }: InviteUserModalProps) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('vendedor');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Generate link based on current origin
    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/login?register=true&email=${encodeURIComponent(email)}&role=${role}${inviterOrgId ? `&org=${inviterOrgId}` : ''}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card border-none rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
                {/* Header */}
                <div className="px-8 py-8 border-b border-white/5 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Novo Membro</h3>
                            <p className="text-muted-foreground text-sm font-medium">Convide um colaborador para sua equipe.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Email do Colaborador</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colaborador@empresa.com"
                                    className="w-full pl-12 pr-4 h-14 bg-muted/20 border-border rounded-2xl text-foreground placeholder-muted-foreground/60 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Função / Permissões</label>
                            <div className="p-1 bg-muted/20 rounded-2xl border border-border">
                                <RoleSelect
                                    value={role}
                                    onChange={setRole}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invite Link Section */}
                    {email && (
                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                            <label className="block text-[10px] font-black text-primary uppercase mb-3 tracking-widest">Link de Acesso Único</label>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-[11px] text-primary font-mono truncate select-all flex items-center">
                                    {inviteLink}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary text-white shadow-primary/20 hover:scale-105'}`}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Pronto!' : 'Copiar'}
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-4 font-medium leading-relaxed">
                                Compartilhe este link com o novo membro. Ele poderá configurar sua senha e acessar o CRM instantaneamente.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-muted/30 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[11px] tracking-widest px-8 h-12 rounded-xl transition-all border border-border/50"
                    >
                        Concluir
                    </button>
                </div>
            </div>
        </div>
    );
};
