'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Zap, History } from 'lucide-react';
import { type Automation } from "@/types/automation";

interface AutomationHistorySheetProps {
    automation: Automation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AutomationHistorySheet({ automation, open, onOpenChange }: AutomationHistorySheetProps) {
    if (!automation) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl bg-card/95 backdrop-blur-2xl border-l border-white/10 p-0 overflow-hidden">
                <div className="relative h-full flex flex-col">
                    <SheetHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-foreground tracking-tight">{automation.name}</SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium">
                                    Execuções verificadas deste fluxo
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 px-8 pb-8">
                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                            <History className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                            <h4 className="font-bold text-foreground">Nenhuma execução verificada</h4>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                O runtime das automações configuráveis ainda não está habilitado.
                                Este painel só exibirá eventos persistidos pelo executor real; dados demonstrativos não são apresentados como histórico.
                            </p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
