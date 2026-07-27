'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, RotateCcw, AlertTriangle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// 1. HOOK: useDraftForm
// ==========================================
export interface UseDraftFormOptions<T extends Record<string, any>> {
    initialData: T;
    onSave: (updatedData: T) => Promise<void>;
    onDiscard?: () => void;
}

export function useDraftForm<T extends Record<string, any>>({
    initialData,
    onSave,
    onDiscard,
}: UseDraftFormOptions<T>) {
    const [currentBaseData, setCurrentBaseData] = useState<T>(initialData);
    const [formData, setFormData] = useState<T>(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Sync when initialData changes from server
    useEffect(() => {
        setCurrentBaseData(initialData);
        setFormData(initialData);
    }, [initialData]);

    // Calculate modified fields count comparing to current base data
    const changedFields = useMemo(() => {
        const diffs: (keyof T)[] = [];
        if (!currentBaseData || !formData) return diffs;

        Object.keys(formData).forEach((key) => {
            const initialVal = currentBaseData[key];
            const currentVal = formData[key];

            // Normalize empty strings vs null vs undefined for clean diffing
            const normInit = initialVal === null || initialVal === undefined ? '' : initialVal;
            const normCurr = currentVal === null || currentVal === undefined ? '' : currentVal;

            if (typeof normInit === 'object' || typeof normCurr === 'object') {
                if (JSON.stringify(normInit) !== JSON.stringify(normCurr)) {
                    diffs.push(key as keyof T);
                }
            } else if (normInit !== normCurr) {
                diffs.push(key as keyof T);
            }
        });
        return diffs;
    }, [currentBaseData, formData]);

    const isDirty = changedFields.length > 0;

    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const updateFormData = useCallback((partial: Partial<T>) => {
        setFormData((prev) => ({
            ...prev,
            ...partial,
        }));
    }, []);

    const discardChanges = useCallback(() => {
        setFormData(currentBaseData);
        if (onDiscard) onDiscard();
        setShowUnsavedModal(false);
        setPendingAction(null);
    }, [currentBaseData, onDiscard]);

    const saveChanges = useCallback(async () => {
        if (!isDirty) return;
        setIsSaving(true);
        try {
            await onSave(formData);
            toast.success('Alterações salvas com sucesso!');
            setCurrentBaseData(formData); // Sincroniza a base de dados de rascunhos para limpar isDirty imediatamente
            setShowUnsavedModal(false);
            if (pendingAction) {
                const action = pendingAction;
                setPendingAction(null);
                action();
            }
        } catch (error) {
            console.error('Error saving draft form:', error);
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    }, [formData, isDirty, onSave, pendingAction]);

    // Guard method to intercept drawer close or tab switch
    const safeExecute = useCallback(
        (action: () => void) => {
            if (isDirty && !isSaving) {
                setPendingAction(() => action);
                setShowUnsavedModal(true);
            } else {
                action();
            }
        },
        [isDirty, isSaving]
    );

    return {
        formData,
        setFormData,
        updateField,
        updateFormData,
        isDirty,
        changedCount: changedFields.length,
        isSaving,
        saveChanges,
        discardChanges,
        safeExecute,
        showUnsavedModal,
        setShowUnsavedModal,
    };
}

// ==========================================
// 2. COMPONENT: FloatingSaveBar
// ==========================================
export interface FloatingSaveBarProps {
    isDirty: boolean;
    changedCount: number;
    isSaving: boolean;
    onSave: () => void;
    onDiscard: () => void;
    className?: string;
}

export function FloatingSaveBar({
    isDirty,
    changedCount,
    isSaving,
    onSave,
    onDiscard,
    className = '',
}: FloatingSaveBarProps) {
    if (!isDirty) return null;

    return (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`floating-save-bar fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-foreground/90 text-background backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${className}`}
        >
            <div className="flex items-center gap-2 pr-2 border-r border-background/20">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide">
                    {changedCount} {changedCount === 1 ? 'alteração pendente' : 'alterações pendentes'}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (isSaving) return;
                        onDiscard();
                    }}
                    className="h-8 px-3 text-xs font-bold text-background/80 hover:text-background hover:bg-background/20 rounded-xl"
                >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Descartar
                </Button>

                <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                        if (isSaving) return;
                        onSave();
                    }}
                    className="h-8 px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                    {isSaving ? (
                        <span className="flex items-center">
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Salvando...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Salvar Alterações
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}

// ==========================================
// 3. COMPONENT: UnsavedChangesDialog
// ==========================================
export interface UnsavedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => Promise<void>;
    onDiscard: () => void;
    isSaving?: boolean;
}

export function UnsavedChangesDialog({
    open,
    onOpenChange,
    onSave,
    onDiscard,
    isSaving = false,
}: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 z-[110]">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        Alterações Não Salvas
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Você possui alterações que ainda não foram salvas no banco. Se continuar, essas alterações serão perdidas.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onDiscard}
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-xl"
                    >
                        Descartar
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar e Continuar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
