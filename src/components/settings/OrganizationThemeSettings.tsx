'use client';

import { useState } from 'react';
import { updateOrgTheme } from '@/app/actions/theme-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Palette } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

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
        <Card className="bg-card border-border">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle className="text-foreground">Aparência da Organização</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                    Defina o tema padrão para todos os novos usuários desta organização.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="text-foreground">Tema Padrão</Label>
                    <RadioGroup
                        defaultValue="light"
                        value={selectedTheme}
                        onValueChange={(v) => setSelectedTheme(v as 'light' | 'dark')}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="light" id="org-light" className="peer sr-only" />
                            <Label
                                htmlFor="org-light"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <div className="mb-3 h-20 w-full rounded-lg bg-background border border-border shadow-sm" />
                                <span className="block w-full text-center font-bold">Claro</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="dark" id="org-dark" className="peer sr-only" />
                            <Label
                                htmlFor="org-dark"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <div className="mb-3 h-20 w-full rounded-lg bg-[#0f111a] border border-border shadow-sm" />
                                <span className="block w-full text-center font-bold">Escuro</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Padrão
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
