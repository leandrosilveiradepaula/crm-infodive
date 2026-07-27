'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmExitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function ConfirmExitDialog({ open, onOpenChange, onConfirm }: ConfirmExitDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-[400px] rounded-md border border-border p-6 shadow-2xl">
                <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
                    <div className="h-10 w-10 shrink-0 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-bold text-foreground">Alterações não salvas</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Você possui alterações que ainda não foram salvas. Deseja realmente sair e descartar as alterações?
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <DialogFooter className="mt-4 gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-md font-bold text-muted-foreground hover:text-foreground h-9 text-xs"
                    >
                        Continuar editando
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-md h-9 text-xs shadow-md"
                    >
                        Descartar e Sair
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
