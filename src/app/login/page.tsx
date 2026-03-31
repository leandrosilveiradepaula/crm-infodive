'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { login, signup } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
    const searchParams = useSearchParams();

    const initRegister = searchParams.get('register') === 'true';
    const defaultEmail = searchParams.get('email') || '';
    const paramRole = searchParams.get('role') || 'vendedor';
    const paramOrg = searchParams.get('org') || '';

    const [isLogin, setIsLogin] = useState(!initRegister);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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

    return (
        <Card className="w-full max-w-md bg-card border-border text-foreground relative z-10 shadow-2xl">
            <CardHeader className="text-center space-y-4 pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                    <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isLogin ? 'Acesse o CRM Next Gen para continuar' : 'Preencha seus dados para começar'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-500 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="name"
                                    placeholder="Seu nome"
                                    className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                    required
                                />
                            </div>
                            <input type="hidden" name="role" value={paramRole} />
                            {paramOrg && <input type="hidden" name="organization_id" value={paramOrg} />}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Email Corporativo</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="email"
                                type="email"
                                defaultValue={defaultEmail}
                                placeholder="seu@email.com"
                                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-primary to-teal-600 hover:shadow-lg hover:shadow-primary/25 text-primary-foreground font-bold py-6 rounded-xl"
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
            <CardFooter className="justify-center border-t border-border pt-6">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                    {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                </button>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-teal-600/20 rounded-full blur-[100px]" />
            </div>

            <Suspense fallback={<div className="text-white">Carregando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
