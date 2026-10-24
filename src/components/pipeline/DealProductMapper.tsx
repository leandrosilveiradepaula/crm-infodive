import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ColumnMapping } from '@/utils/excelParser';

interface DealProductMapperProps {
    headers: string[];
    mapping: ColumnMapping;
    onMappingChange: (mapping: ColumnMapping) => void;
    previewRows?: any[][];
}

const FIELD_LABELS = {
    name: 'Nome do Produto (Obrigatório)',
    sku: 'SKU / Part Number',
    cost: 'Preço/Custo Unitário',
    quantity: 'Quantidade',
};

const REQUIRED_FIELDS = ['name', 'cost', 'quantity'];

export const DealProductMapper: React.FC<DealProductMapperProps> = ({
    headers,
    mapping,
    onMappingChange,
    previewRows = []
}) => {
    const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
        onMappingChange({
            ...mapping,
            [field]: value || undefined
        });
    };

    const isFieldMapped = (field: keyof ColumnMapping) => !!mapping[field];
    const isRequired = (field: string) => REQUIRED_FIELDS.includes(field);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-black text-foreground">Mapeamento de Colunas</p>
                    <p className="text-xs text-muted-foreground font-bold">Relacione as colunas da planilha com os campos da oportunidade</p>
                </div>
            </div>

            {/* Mapping Grid */}
            <div className="bg-muted/10 border border-border rounded-2xl p-6 space-y-4">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                    <div key={field} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                        {/* System Field */}
                        <div className="flex items-center gap-2">
                            {isFieldMapped(field as keyof ColumnMapping) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : isRequired(field) ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            ) : (
                                <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                            )}
                            <div>
                                <p className="text-sm font-bold text-foreground">{label}</p>
                                {isRequired(field) && (
                                    <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Obrigatório</p>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        {/* Spreadsheet Column Selector */}
                        <select
                            value={mapping[field as keyof ColumnMapping] || ''}
                            onChange={(e) => handleMappingChange(field as keyof ColumnMapping, e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="">-- Selecione uma coluna --</option>
                            {headers.map((header, index) => (
                                <option key={index} value={header}>
                                    {header}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {/* Preview */}
            {previewRows.length > 0 && mapping.name && (
                <div className="bg-muted/10 border border-border rounded-2xl p-6">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Preview (primeiras 3 linhas)</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    {Object.entries(mapping).filter(([_, value]) => value).map(([field, _]) => (
                                        <th key={field} className="px-3 py-2 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                                            {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-white/5 dark:border-white/5">
                                        {Object.entries(mapping).filter(([_, value]) => value).map(([field, columnName]) => {
                                            const columnIndex = headers.indexOf(columnName!);
                                            const value = row[columnIndex];
                                            return (
                                                <td key={field} className="px-3 py-2 text-foreground font-mono">
                                                    {field === 'cost' && value ? `R$ ${parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.')).toFixed(2)}` : value || '---'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Validation Summary */}
            <div className="flex items-center gap-2 text-xs">
                {REQUIRED_FIELDS.every(f => mapping[f as keyof ColumnMapping]) ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 font-bold">Todos os campos obrigatórios mapeados</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-500 font-bold">
                            {REQUIRED_FIELDS.filter(f => !mapping[f as keyof ColumnMapping]).length} campo(s) obrigatório(s) pendente(s)
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
