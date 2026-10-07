'use client';

import { Suspense, useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, logout, getSessionData } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const inviteToken = searchParams.get('invite_token');
    
    // Se tiver um token de convite, força a tela de registro
    const [isLogin, setIsLogin] = useState(!inviteToken);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        async function checkSession() {
            try {
                const session = await getSessionData();
                
                if (session.isLoggedIn) {
                    if (inviteToken) {
                        // If it's a registration invite but user is logged in, force logout
                        await logout();
                        setCheckingSession(false);
                    } else {
                        // If it's a normal login but user is already logged in, go to dashboard
                        router.push('/dashboard');
                    }
                } else {
                    setCheckingSession(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setCheckingSession(false);
            }
        }
        checkSession();
    }, [inviteToken, router]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const res = await login(formData);
                if (res?.error) setError(res.error);
            } else {
                const res = await signup(formData);
                if (res?.error) setError(res.error);
                if (res?.success) {
                    setSuccess(res.success);
                    setIsLogin(true); // Switch back to login
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    }

    if (checkingSession) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium animate-pulse uppercase tracking-widest">Validando acesso...</p>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md bg-card border-border text-foreground relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center space-y-4 pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                    <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black tracking-tight">
                        {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {isLogin ? 'Acesse o CRM Premium para continuar' : 'Preencha seus dados para começar'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-500 text-xs font-black uppercase">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-500 text-xs font-black uppercase">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    {!isLogin && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs font-black uppercase tracking-widest">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="name"
                                        placeholder="Seu nome"
                                        className="pl-10 h-11 bg-muted/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <input type="hidden" name="invite_token" value={inviteToken || ''} />
                        </>
                    )}

                    {isLogin && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs font-black uppercase tracking-widest">Email Corporativo</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="pl-10 h-11 bg-muted/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl font-bold"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs font-black uppercase tracking-widest">Senha</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 h-11 bg-muted/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl font-bold"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all uppercase tracking-[0.2em] text-xs"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                                {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center border-t border-border pt-6 flex-col space-y-4 pb-8">
                {inviteToken ? (
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="text-xs text-muted-foreground hover:text-primary font-black uppercase tracking-widest transition-colors"
                    >
                        Já tem uma conta? Voltar para o Login
                    </button>
                ) : (
                    <p className="text-xs text-muted-foreground/60 font-black uppercase tracking-widest cursor-default">
                        O cadastro no sistema é feito exclusivamente por convite
                    </p>
                )}
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Logo area */}
            <div className="mb-12 relative z-10 flex flex-col items-center">
                <div className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl" />
                    INFODIVE<span className="text-primary">CRM</span>
                </div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Next Gen Business Intelligence</div>
            </div>

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
            </div>

            <Suspense fallback={<div className="text-muted-foreground animate-pulse font-black uppercase text-xs tracking-widest">Carregando ambiente...</div>}>
                <LoginForm />
            </Suspense>

            <div className="mt-12 text-xs font-black text-muted-foreground uppercase tracking-widest opacity-30 select-none">
                © 2026 INFODIVE S.A. | Todos os direitos reservados
            </div>
        </div>
    );
}
