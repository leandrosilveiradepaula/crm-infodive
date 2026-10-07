'use client';

'use client';

import { useState, useEffect } from 'react';
import { getPipelineStages, savePipelineStages } from '@/app/(dashboard)/settings/actions';
import type { PipelineStage } from '@/services/SettingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Check, Loader2, RefreshCw, Kanban } from 'lucide-react';
import { toast } from 'sonner';

export function PipelineSettings() {
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchStages = async () => {
        setLoading(true);
        try {
            const data = await getPipelineStages();
            setStages(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStages();
    }, []);

    const handleSave = async () => {
        if (stages.some(s => !s.name.trim())) {
            toast.error('Todas as etapas precisam ter um nome.');
            return;
        }
        setSaving(true);
        const result = await savePipelineStages(stages);
        setSaving(false);
        if (result.success) {
            toast.success('Etapas do pipeline salvas com sucesso!');
            fetchStages();
        } else {
            toast.error('Erro ao salvar: ' + result.error);
        }
    };

    const addStage = () => setStages([...stages, {
        id: crypto.randomUUID(),
        name: 'Nova Etapa',
        color: '#888888',
        order_index: stages.length
    }]);

    const removeStage = (id: string) => setStages(stages.filter(s => s.id !== id));

    const updateStage = (id: string, field: keyof PipelineStage, value: any) =>
        setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Kanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-foreground tracking-tight">Estágios do Pipeline</h3>
                        <p className="text-xs text-muted-foreground font-medium">Personalize as etapas do seu processo de vendas.</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchStages} disabled={loading} className="text-muted-foreground hover:bg-muted h-9 w-9 rounded-xl">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            
            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage, index) => (
                            <div key={stage.id} className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                <GripVertical className="h-5 w-5 text-muted-foreground/30 cursor-move flex-shrink-0" />

                                {/* Color swatch + picker */}
                                <div className="relative flex-shrink-0">
                                    <div
                                        className="h-8 w-8 rounded-lg border border-border shadow-sm cursor-pointer"
                                        style={{ backgroundColor: stage.color }}
                                        title="Clique para mudar a cor"
                                    />
                                    <input
                                        type="color"
                                        value={stage.color}
                                        onChange={e => updateStage(stage.id, 'color', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>

                                <Input
                                    value={stage.name}
                                    onChange={e => updateStage(stage.id, 'name', e.target.value)}
                                    className="flex-1 bg-transparent border-none text-foreground font-bold focus-visible:ring-0 p-0 h-auto"
                                    placeholder="Nome da etapa"
                                />

                                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded hidden group-hover:inline">
                                    #{index + 1}
                                </span>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                    onClick={() => removeStage(stage.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <Button onClick={addStage} variant="outline" className="w-full border-dashed border-border hover:bg-muted text-muted-foreground hover:text-foreground h-12 rounded-xl">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Etapa
                    </Button>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button onClick={handleSave} disabled={saving || loading} className="bg-primary hover:bg-primary/90 font-bold text-white px-8 h-11 rounded-xl shadow-lg shadow-primary/10">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Salvar Etapas
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
