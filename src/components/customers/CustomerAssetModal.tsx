'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import type { CustomerAsset, ServiceContract } from '@/types/postSales';

interface CustomerAssetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: CustomerAsset | null;
    accountId: string;
    contracts: ServiceContract[];
    onSave: (payload: Partial<CustomerAsset>) => Promise<any>;
}

export function CustomerAssetModal({ open, onOpenChange, asset, accountId, contracts, onSave }: CustomerAssetModalProps) {
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [type, setType] = useState<'hardware' | 'software_license' | 'cloud_subscription'>('hardware');
    const [manufacturer, setManufacturer] = useState('');
    const [nameModel, setNameModel] = useState('');
    const [serialOrKey, setSerialOrKey] = useState('');
    const [status, setStatus] = useState<'active' | 'in_maintenance' | 'retired'>('active');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [warrantyDate, setWarrantyDate] = useState('');
    const [contractId, setContractId] = useState<string>('none');

    useEffect(() => {
        if (open) {
            if (asset) {
                setType(asset.type);
                setManufacturer(asset.manufacturer);
                setNameModel(asset.name_model);
                setSerialOrKey(asset.serial_number_or_key || '');
                setStatus(asset.status);
                setPurchaseDate(asset.purchase_date || '');
                setWarrantyDate(asset.warranty_expires_at || '');
                setContractId(asset.service_contract_id || 'none');
            } else {
                setType('hardware');
                setManufacturer('');
                setNameModel('');
                setSerialOrKey('');
                setStatus('active');
                setPurchaseDate('');
                setWarrantyDate('');
                setContractId('none');
            }
        }
    }, [open, asset]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nameModel.trim() || !manufacturer.trim()) {
            toast.error('Preencha os campos obrigatórios: Fabricante e Modelo.');
            return;
        }

        setLoading(true);
        try {
            const payload: Partial<CustomerAsset> = {
                account_id: accountId,
                type,
                manufacturer,
                name_model: nameModel,
                serial_number_or_key: serialOrKey || undefined,
                status,
                purchase_date: purchaseDate || undefined,
                warranty_expires_at: warrantyDate || undefined,
                service_contract_id: contractId !== 'none' ? contractId : undefined
            };

            await onSave(payload);
            toast.success(asset ? 'Equipamento/Licença atualizado.' : 'Equipamento/Licença cadastrado com sucesso!');
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar ativo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{asset ? 'Editar Equipamento/Licença' : 'Cadastrar Equipamento/Licença'}</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do equipamento ou licença de software que o cliente possui.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Tipo de Ativo *
                            </label>
                            <ThemeSelect
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                            >
                                <option value="hardware">Equipamento (Hardware)</option>
                                <option value="software_license">Licença de Software</option>
                                <option value="cloud_subscription">Assinatura Cloud</option>
                            </ThemeSelect>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Status *
                            </label>
                            <ThemeSelect
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                            >
                                <option value="active">Ativo / Instalado</option>
                                <option value="in_maintenance">Em Manutenção</option>
                                <option value="retired">Aposentado / Inativo</option>
                            </ThemeSelect>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Fabricante *
                            </label>
                            <ThemeInput
                                placeholder="Ex: Dell, Microsoft"
                                value={manufacturer}
                                onChange={(e) => setManufacturer(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Modelo / Título *
                            </label>
                            <ThemeInput
                                placeholder="Ex: PowerEdge R740"
                                value={nameModel}
                                onChange={(e) => setNameModel(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Nº de Série ou Chave de Licença
                        </label>
                        <ThemeInput
                            placeholder="S/N ou License Key"
                            value={serialOrKey}
                            onChange={(e) => setSerialOrKey(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Data de Aquisição
                            </label>
                            <ThemeInput
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Validade da Garantia
                            </label>
                            <ThemeInput
                                type="date"
                                value={warrantyDate}
                                onChange={(e) => setWarrantyDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Coberto pelo Contrato
                        </label>
                        <ThemeSelect
                            value={contractId}
                            onChange={(e) => setContractId(e.target.value)}
                        >
                            <option value="none">Nenhum Contrato / Sem Cobertura SLA</option>
                            {contracts.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </ThemeSelect>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary text-white" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
