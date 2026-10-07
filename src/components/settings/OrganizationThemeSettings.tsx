'use client';

import { useState } from 'react';
import { updateOrgTheme } from '@/app/actions/theme-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Palette } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function OrganizationThemeSettings() {
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme(); // This is user theme, but we want to show org theme settings
    // In a real app, we should fetch the current org setting. 
    // For now, let's assume 'light' as initial value or fetch it if we had a getter for org settings specifically.
    // The user theme overrides it anyway, so this panel is for ADMIN to set DEFAULT for others.

    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateOrgTheme(selectedTheme);
            toast.success('Tema padrão da organização atualizado!');
        } catch (error) {
            toast.error('Erro ao atualizar tema da organização');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] ml-1">Tema Padrão da Organização</Label>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide ml-1 opacity-60">
                    Defina a experiência visual para novos membros da equipe.
                </p>
            </div>

            <RadioGroup
                value={selectedTheme}
                onValueChange={(v) => setSelectedTheme(v as 'light' | 'dark')}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {/* Light Theme Option */}
                <div className="relative">
                    <RadioGroupItem value="light" id="org-light" className="peer sr-only" />
                    <Label
                        htmlFor="org-light"
                        className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-muted bg-card hover:bg-accent transition-all cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                        <div className="h-24 w-full rounded-xl bg-white border border-border shadow-inner relative overflow-hidden">
                            <div className="absolute inset-4 space-y-2">
                                <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                                <div className="h-1.5 w-full bg-slate-50 rounded-full" />
                            </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-center">Interface Clara</span>
                    </Label>
                </div>

                {/* Dark Theme Option */}
                <div className="relative">
                    <RadioGroupItem value="dark" id="org-dark" className="peer sr-only" />
                    <Label
                        htmlFor="org-dark"
                        className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-muted bg-card hover:bg-accent transition-all cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                        <div className="h-24 w-full rounded-xl bg-[#0f111a] border border-white/5 shadow-inner relative overflow-hidden">
                            <div className="absolute inset-4 space-y-2">
                                <div className="h-2 w-2/3 bg-slate-800/50 rounded-full" />
                                <div className="h-1.5 w-full bg-slate-900/50 rounded-full" />
                            </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-center">Interface Escura</span>
                    </Label>
                </div>
            </RadioGroup>

            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleSave} 
                    disabled={loading} 
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl transition-all"
                >
                    {loading ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <Palette className="mr-3 h-4 w-4" />}
                    Salvar Tema Padrão
                </Button>
            </div>
        </div>
    );
}
