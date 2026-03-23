'use client';

import { useState, useEffect } from 'react';
import { CustomerAsset, ServiceContract } from '@/types/postSales';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Laptop, RefreshCw, Trash2, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerAssetModal } from './CustomerAssetModal';
import { ServiceContractModal } from './ServiceContractModal';
import { createAccountAsset, updateAccountAsset, deleteAccountAsset, createAccountContract, updateAccountContract, deleteAccountContract } from '@/app/(dashboard)/customers/postSalesActions';

interface PostSalesTabProps {
    accountId: string;
    getAssets: (id: string) => Promise<CustomerAsset[]>;
    getContracts: (id: string) => Promise<ServiceContract[]>;
    // simplified for brevity... (edit/delete callbacks)
}

export function PostSalesTab({ accountId, getAssets, getContracts }: PostSalesTabProps) {
    const [assets, setAssets] = useState<CustomerAsset[]>([]);
    const [contracts, setContracts] = useState<ServiceContract[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<CustomerAsset | null>(null);
    const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedAssets, fetchedContracts] = await Promise.all([
                getAssets(accountId),
                getContracts(accountId)
            ]);
            setAssets(fetchedAssets);
            setContracts(fetchedContracts);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar dados de pós-venda');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [accountId]);

    const handleSaveAsset = async (payload: Partial<CustomerAsset>) => {
        if (editingAsset) {
            await updateAccountAsset(editingAsset.id, payload);
        } else {
            await createAccountAsset(payload);
        }
        await fetchData();
    };

    const handleSaveContract = async (payload: Partial<ServiceContract>) => {
        if (editingContract) {
            await updateAccountContract(editingContract.id, payload);
        } else {
            await createAccountContract(payload);
        }
        await fetchData();
    };

    const handleDeleteAsset = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja remover o ativo "${name}"?`)) {
            try {
                await deleteAccountAsset(id);
                toast.success('Ativo removido.');
                await fetchData();
            } catch (err: any) {
                toast.error(err.message || 'Erro ao remover ativo');
            }
        }
    };

    const handleDeleteContract = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja remover o contrato "${name}"?`)) {
            try {
                await deleteAccountContract(id);
                toast.success('Contrato removido.');
                await fetchData();
            } catch (err: any) {
                toast.error(err.message || 'Erro ao remover contrato');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Contratos de Suporte */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Contratos de Suporte ({contracts.length})
                    </h3>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => { setEditingContract(null); setIsContractModalOpen(true); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Novo Contrato
                    </Button>
                </div>

                {contracts.length === 0 ? (
                    <EmptyState text="Nenhum contrato ativo" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contracts.map(contract => (
                            <div key={contract.id} className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-sm truncate">{contract.title}</p>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        contract.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {contract.status}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Válido até: {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '—'}</p>
                                    <p className="font-mono mt-2 truncate">{(contract as any).deal?.title || 'Contrato Manual'}</p>
                                </div>
                                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContract(contract); setIsContractModalOpen(true); }}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteContract(contract.id, contract.title)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Equipamentos & Licenças */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-blue-500" />
                        Equipamentos e Licenças ({assets.length})
                    </h3>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => { setEditingAsset(null); setIsAssetModalOpen(true); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Ativo
                    </Button>
                </div>

                {assets.length === 0 ? (
                    <EmptyState text="Nenhum equipamento/licença" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assets.map(asset => (
                            <div key={asset.id} className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-sm truncate">{asset.name_model}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{asset.manufacturer} • {asset.type}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        asset.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {asset.status}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1 mt-3">
                                    {asset.serial_number_or_key && <p className="font-mono truncate">SN/Key: {asset.serial_number_or_key}</p>}
                                    <p>Garantia Expira: {asset.warranty_expires_at ? new Date(asset.warranty_expires_at).toLocaleDateString() : '—'}</p>
                                    {(asset as any).service_contract && (
                                        <p className="text-blue-500 truncate text-[10px] uppercase font-bold mt-1">
                                            Coberto por: {(asset as any).service_contract.title}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteAsset(asset.id, asset.name_model)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modals */}
            <ServiceContractModal
                open={isContractModalOpen}
                onOpenChange={setIsContractModalOpen}
                contract={editingContract}
                accountId={accountId}
                onSave={handleSaveContract}
            />

            <CustomerAssetModal
                open={isAssetModalOpen}
                onOpenChange={setIsAssetModalOpen}
                asset={editingAsset}
                accountId={accountId}
                contracts={contracts}
                onSave={handleSaveAsset}
            />
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
            <p className="text-sm font-bold text-muted-foreground">{text}</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase mt-1">Use os botões acima para cadastrar</p>
        </div>
    );
}
