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
    const [roles, setRoles] = useState<string[]>(['sales']);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Generate link based on current origin
    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/login?register=true&email=${encodeURIComponent(email)}&roles=${roles.join(',')}${inviterOrgId ? `&org=${inviterOrgId}` : ''}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-3">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Novo Membro</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Email do Colaborador</label>
                            <div className="flex relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colaborador@empresa.com"
                                    className="w-full pl-10 pr-4 h-11 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">Função / Permissões</label>
                            <RoleSelect
                                value={roles}
                                onChange={setRoles}
                            />
                        </div>
                    </div>

                    {/* Invite Link Section */}
                    {email && (
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 animate-in slide-in-from-top-4 duration-300">
                            <label className="block text-xs font-bold text-primary mb-2">Link Único de Convite</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-primary font-mono truncate flex items-center">
                                    {inviteLink}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                                Compartilhe este link com o coloborador. Ele configurará sua senha para acessar a conta imediatamente.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-end bg-background">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                        Concluir
                    </button>
                </div>
            </div>
        </div>
    );
};
