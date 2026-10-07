'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, Sparkles, CheckCircle2, AlertTriangle, X, ArrowRight, Table } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { bulkCreateAccounts } from '@/app/(dashboard)/customers/actions';
import { useRouter } from 'next/navigation';

interface ImportCustomersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportCustomersModal({ isOpen, onClose }: ImportCustomersModalProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setParsedData([]);
            setStats(null);
        }
    };

    const processFile = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                // Pegar apenas as primeiras 20 linhas para a IA analisar a estrutura
                // Mas enviar o conteúdo total se for razoável, ou chunks
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const sampleRows = rows.slice(0, 50); // Amostra de 50 linhas para IA
                
                const response = await fetch('/api/customers/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileContent: JSON.stringify(sampleRows),
                        contentType: file.type
                    })
                });

                if (!response.ok) throw new Error('Falha ao processar arquivo');

                const res = await response.json();
                setParsedData(res.mappedData || []);
                setStats(res.stats || null);
                toast.success('Arquivo analisado com sucesso!');
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar planilha.');
        } finally {
            setLoading(false);
        }
    };

    const confirmImport = async () => {
        if (parsedData.length === 0) return;

        setImporting(true);
        try {
            const result = await bulkCreateAccounts(parsedData);
            
            if (result.errors && result.errors.length > 0) {
                toast.warning(`Importação concluída com ${result.errors.length} erros.`);
                console.error('Import Errors:', result.errors);
            } else {
                toast.success(`Sucesso! ${result.created} criados, ${result.updated} atualizados.`);
            }
            
            router.refresh();
            onClose();
            // Reset
            setFile(null);
            setParsedData([]);
            setStats(null);
        } catch (error) {
            console.error(error);
            toast.error('Erro na importação final.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-card border-border text-foreground p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-info/10">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        Importador Inteligente de Clientes
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    {!parsedData.length ? (
                        <div className="space-y-6">
                            <div 
                                className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv, .xlsx, .xls"
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            {file ? file.name : 'Selecione ou arraste sua planilha'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Suporta .CSV, .XLSX e .XLS
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3 italic text-xs text-amber-600 dark:text-amber-400">
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <p>
                                    Nossa IA detectará automaticamente as colunas de Nome, CNPJ, Endereço e Contatos, 
                                    independentemente de como sua planilha esteja organizada.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                                <Button 
                                    disabled={!file || loading} 
                                    onClick={processFile}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-8"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analisando com IA...
                                        </>
                                    ) : (
                                        'Analisar Planilha'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <h3 className="text-sm font-bold">Mapeamento Concluído</h3>
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-black rounded-full uppercase">
                                        {parsedData.length} Registros Detectados
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setParsedData([])} className="h-8 text-xs font-black uppercase">
                                    <X className="h-3 w-3 mr-1" /> Trocar Arquivo
                                </Button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto border border-border rounded-xl">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 sticky top-0 z-10">
                                        <tr className="border-b border-border">
                                            <th className="text-left p-3 font-black uppercase tracking-widest text-xs text-muted-foreground">Empresa / CNPJ</th>
                                            <th className="text-left p-3 font-black uppercase tracking-widest text-xs text-muted-foreground">Localização</th>
                                            <th className="text-left p-3 font-black uppercase tracking-widest text-xs text-muted-foreground">Contatos Primários</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {parsedData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3">
                                                    <p className="font-bold text-foreground">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{item.cnpj}</p>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-muted-foreground">{item.city} - {item.state}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.street}, {item.number}</p>
                                                </td>
                                                <td className="p-3">
                                                    {item.contacts?.map((c: any, cIdx: number) => (
                                                        <div key={cIdx} className="mb-1 last:mb-0">
                                                            <p className="font-medium text-foreground">{c.name}</p>
                                                            <p className="text-xs text-muted-foreground">{c.email || c.mobile_phone}</p>
                                                        </div>
                                                    ))}
                                                    {!item.contacts?.length && <span className="text-muted-foreground italic opacity-50">Nenhum</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex gap-3 text-xs text-info">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                <p>
                                    Os dados acima foram mapeados via IA. Clientes com o mesmo CNPJ já existentes no CRM serão 
                                    <strong> atualizados</strong>. Novos CNPJs serão cadastrados.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setParsedData([])}>Mapear Novamente</Button>
                                <Button 
                                    onClick={confirmImport}
                                    disabled={importing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 shadow-lg shadow-emerald-600/20"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            Confirmar e Importar
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
