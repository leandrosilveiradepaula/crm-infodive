import React, { useState } from 'react';
import { Shield, Key, Smartphone, Lock, Eye, EyeOff, LogOut, Check } from 'lucide-react';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';
export const SecurityTab = () => {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Senha atualizada com sucesso!');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 2FA Section */}
            <div className="bg-muted/10 p-6 rounded-[var(--radius-panel)] border border-border">
                <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-6">
                        <div className="bg-primary/10 p-3 rounded-[var(--radius-panel)] h-fit">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-section-title font-black text-foreground tracking-tight">Autenticação de Dois Fatores (2FA)</h3>
                            <p className="text-muted-foreground text-body-ui mt-2 max-w-lg font-medium leading-relaxed">
                                Adicione uma camada extra de segurança à sua conta exigindo um código do seu aplicativo autenticador ao fazer login.
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={is2FAEnabled}
                            onChange={() => setIs2FAEnabled(!is2FAEnabled)}
                        />
                        <div className="w-14 h-7 bg-muted/50 border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-muted-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-card peer-checked:after:border-white shadow-inner"></div>
                    </label>
                </div>
                {is2FAEnabled && (
                    <div className="mt-8 p-4 bg-success/10 border border-success/20 rounded-[var(--radius-panel)] flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-success/20 p-1.5 rounded-[var(--radius-control)]">
                            <Check className="h-4 w-4 text-success-readable" />
                        </div>
                        <span className="text-body-ui font-bold text-success-readable">2FA está ativado e protegendo sua conta.</span>
                    </div>
                )}
            </div>

            {/* Password Change Section */}
            <div className="bg-muted/10 p-6 rounded-[var(--radius-panel)] border border-border">
                <div className="flex gap-5 mb-6">
                    <div className="bg-warning/10 p-3 rounded-[var(--radius-panel)] h-fit">
                        <Key className="h-6 w-6 text-warning-readable" />
                    </div>
                    <div>
                        <h3 className="text-section-title font-black text-foreground tracking-tight">Alterar Senha</h3>
                        <p className="text-muted-foreground text-body-ui mt-2 font-medium">
                            Escolha uma senha forte com no mínimo 8 caracteres.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSavePassword} className="max-w-xl space-y-6 relative z-10">
                    <div>
                        <label className="block text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Senha Atual</label>
                        <div className="relative group">
                            <ThemeInput
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-background border border-border rounded-[var(--radius-panel)] px-4 py-3 text-body-ui font-bold text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground pr-12 focus:scale-[1.01] shadow-control-ui"
                                placeholder="Digite sua senha atual..."
                                value={passwords.current}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, current: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Nova Senha</label>
                            <div className="relative group">
                                <ThemeInput
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-background border border-border rounded-[var(--radius-panel)] px-4 py-3 text-body-ui font-bold text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground pr-12 focus:scale-[1.01] shadow-control-ui"
                                    placeholder="Digite sua nova senha..."
                                    value={passwords.new}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Confirmar Nova Senha</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full pl-12 pr-10 py-3.5 bg-background border border-border rounded-[var(--radius-panel)] text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-muted-foreground group-hover:bg-muted"
                                    placeholder="••••••••"
                                    required
                                    value={passwords.confirm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border mt-8">
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-metadata-ui font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] hover:bg-muted transition-all uppercase tracking-wider"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showPassword ? 'Ocultar Senhas' : 'Mostrar Senhas'}
                        </button>
                        <button type="submit" className="bg-primary text-white px-8 py-3 rounded-[var(--radius-panel)] font-black text-metadata-ui uppercase tracking-widest hover:bg-primary transition-all shadow-card-ui shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                            Atualizar Senha
                        </button>
                    </div>
                </form>
            </div>

            {/* Active Sessions */}
            <div className="bg-muted/10 p-6 rounded-[var(--radius-panel)] border border-border">
                <div className="flex gap-5 mb-6">
                    <div className="bg-info/10 p-3 rounded-[var(--radius-panel)] h-fit">
                        <Smartphone className="h-6 w-6 text-info" />
                    </div>
                    <div>
                        <h3 className="text-section-title font-black text-foreground tracking-tight uppercase">Sessões Ativas</h3>
                        <p className="text-muted-foreground text-body-ui mt-2 font-medium">
                            Gerencie os dispositivos conectados à sua conta ultimamente.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-card rounded-[var(--radius-panel)] border border-border hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="h-10 w-10 bg-background rounded-[var(--radius-panel)] flex items-center justify-center border border-border group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <span className="text-page-title">💻</span>
                            </div>
                            <div>
                                <p className="font-black text-foreground text-body-ui tracking-tight">Windows PC - Chrome</p>
                                <p className="text-metadata-ui text-success-readable font-black flex items-center gap-2 mt-1 uppercase tracking-widest bg-success/10 px-2 py-0.5 rounded-[var(--radius-control)] w-fit">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></span> Ativo agora
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hidden sm:block text-metadata-ui font-mono font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-[var(--radius-panel)] border border-border/50">IP: 192.168.1.10 • Brasil</span>
                            <div className="w-px h-10 bg-border/50 ml-2" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-card rounded-[var(--radius-panel)] border border-border opacity-70 hover:opacity-100 transition-all hover:border-border group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-background rounded-[var(--radius-panel)] flex items-center justify-center border border-border">
                                <span className="text-page-title">📱</span>
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-body-ui tracking-tight">iPhone 14 - App</p>
                                <p className="text-metadata-ui text-muted-foreground font-black mt-1 uppercase tracking-widest">Último acesso: 2h atrás</p>
                            </div>
                        </div>
                        <button className="text-destructive-readable hover:text-white p-2.5 hover:bg-destructive rounded-[var(--radius-panel)] transition-all border border-border hover:border-destructive" title="Encerrar Sessão">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
