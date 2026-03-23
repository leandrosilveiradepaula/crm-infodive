'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeLabel } from '@/components/ui/theme/ThemeComponents';
import { Lead } from '@/types/lead';
import { convertLeadToDeal } from '@/app/(dashboard)/leads/conversion-actions';
import { Loader2, CheckCircle, FileText, Building, Hash } from 'lucide-react';

interface LeadConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
}

export function LeadConversionModal({ isOpen, onClose, lead }: LeadConversionModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Lead>>({
        company: lead.company,
        contact_name: lead.contact_name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.interest,
        cnpj: lead.cnpj || '',
        ie: lead.ie || '',
        zip: lead.zip || '',
        street: lead.street || '',
        number: lead.number || '',
        complement: lead.complement || '',
        neighborhood: lead.neighborhood || '',
        city: lead.city || '',
        state: lead.state || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await convertLeadToDeal(lead.id, formData);
            onClose();
            // Optional: trigger toast
        } catch (error) {
            console.error(error);
            alert('Erro na conversão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent p-6 border-b border-border shrink-0">
                    <DialogTitle className="text-xl font-black tracking-tight text-foreground flex gap-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Converter Lead
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="conversion-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Data */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest border-b border-border pb-2">
                                Dados Corporativos
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <ThemeLabel>Empresa</ThemeLabel>
                                    <ThemeInput value={formData.company} disabled className="text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <ThemeLabel>CNPJ *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.cnpj}
                                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                        className="border-emerald-500/20 focus:border-emerald-500"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <ThemeLabel>IE</ThemeLabel>
                                    <ThemeInput
                                        value={formData.ie}
                                        onChange={e => setFormData({ ...formData, ie: e.target.value })}
                                        placeholder="Isento"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Data */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest border-b border-border pb-2">
                                Endereço
                            </h4>
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <ThemeLabel>CEP *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.zip}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                        placeholder="00000-000"
                                    />
                                </div>
                                <div className="col-span-4 space-y-1">
                                    <ThemeLabel>Cidade *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-4 space-y-1">
                                    <ThemeLabel>Rua *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <ThemeLabel>Número *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.number}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <ThemeLabel>Bairro</ThemeLabel>
                                    <ThemeInput
                                        value={formData.neighborhood}
                                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <ThemeLabel>UF *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        maxLength={2}
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        className="uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="border-t border-border p-6 bg-muted/30 shrink-0">
                    <Button variant="ghost" type="button" onClick={onClose} className="mr-2 text-muted-foreground hover:text-foreground hover:bg-muted">
                        Cancelar
                    </Button>
                    <Button type="submit" form="conversion-form" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Concluir Conversão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

