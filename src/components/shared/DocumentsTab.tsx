'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FileText, Download, Trash2, Upload, HardDrive, FileSpreadsheet,
    File as FileIcon, Image as ImageIcon, Loader2, FolderOpen,
    FileArchive, Presentation
} from 'lucide-react';
import { toast } from 'sonner';

import type { EntityDocument, DocumentCategory, EntityType } from '@/types/document';
import { getDocumentCategories } from '@/types/document';
import { Button } from '@/components/ui/button';

interface DocumentsTabProps {
    entityType: EntityType;
    entityId: string;
    fetchDocuments: (entityId: string) => Promise<EntityDocument[]>;
    uploadDocument: (entityId: string, formData: FormData) => Promise<EntityDocument>;
    getSignedUrl: (documentId: string) => Promise<string>;
    deleteDocument: (documentId: string) => Promise<boolean>;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
        return <Presentation className="w-5 h-5 text-orange-500" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-teal-500" />;
    if (mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar'))
        return <FileArchive className="w-5 h-5 text-yellow-600" />;
    return <FileIcon className="w-5 h-5 text-muted-foreground" />;
}

function getCategoryBadge(category: DocumentCategory, entityType: EntityType) {
    const map: Record<string, { bg: string; text: string }> = {
        contrato: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
        contrato_social: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
        financeiro: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300' },
        fiscal: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
        certificado: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
        ata: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
        nf: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
        tecnico: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
        outro: { bg: 'bg-muted', text: 'text-muted-foreground' },
    };
    const categories = getDocumentCategories(entityType);
    const label = categories.find((c) => c.value === category)?.label ?? category;
    const colors = map[category] ?? map.outro;
    return (
        <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
            {label}
        </span>
    );
}

export const DocumentsTab = ({
    entityType,
    entityId,
    fetchDocuments: fetchDocsFn,
    uploadDocument: uploadDocFn,
    getSignedUrl: getSignedUrlFn,
    deleteDocument: deleteDocFn,
}: DocumentsTabProps) => {
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('outro');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = getDocumentCategories(entityType);

    // --- Fetch documents ---
    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const docs = await fetchDocsFn(entityId);
            setDocuments(docs);
        } catch (err) {
            console.error('[DocumentsTab] fetch error:', err);
            toast.error('Erro ao carregar documentos.');
        } finally {
            setLoading(false);
        }
    }, [entityId, fetchDocsFn]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    // --- Upload ---
    const handleUpload = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', selectedCategory);

                await uploadDocFn(entityId, formData);
                successCount++;
            } catch (err: any) {
                toast.error(`Erro ao enviar "${file.name}": ${err.message}`);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
            await loadDocuments();
        }
        setUploading(false);
    };

    // --- Download ---
    const handleDownload = async (doc: EntityDocument) => {
        try {
            const signedUrl = await getSignedUrlFn(doc.id);
            window.open(signedUrl, '_blank');
        } catch (err: any) {
            toast.error(`Erro ao baixar: ${err.message}`);
        }
    };

    // --- Delete ---
    const handleDelete = async (doc: EntityDocument) => {
        try {
            setDeletingId(doc.id);
            await deleteDocFn(doc.id);
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            toast.success(`"${doc.name}" excluído.`);
        } catch (err: any) {
            toast.error(`Erro ao excluir: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    // --- Drag & Drop ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    // --- Filtered list ---
    const filteredDocs = filter === 'all' ? documents : documents.filter((d) => d.category === filter);

    return (
        <div className="h-full flex flex-col p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Documentos</h3>
                    <p className="text-sm text-muted-foreground">
                        {entityType === 'account' ? 'Documentos da empresa' : 'Arquivos anexados à oportunidade'}
                        {documents.length > 0 && (
                            <span className="ml-1 text-xs font-bold text-muted-foreground/60">
                                ({documents.length})
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                        className="h-9 rounded-lg border border-border bg-card text-xs font-bold px-2 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-wide shadow-sm"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploading ? 'Enviando...' : 'Upload'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.csv,.txt"
                        onChange={(e) => {
                            if (e.target.files) handleUpload(e.target.files);
                            e.target.value = '';
                        }}
                    />
                </div>
            </div>

            {/* Dropzone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer
                    transition-all duration-300 group
                    ${isDragging
                        ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg'
                        : 'border-border hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10'
                    }
                `}
            >
                <div className={`
                    h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                    ${isDragging
                        ? 'bg-primary/20 scale-110'
                        : 'bg-muted group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:scale-110'
                    }
                `}>
                    {uploading ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                        <HardDrive className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    )}
                </div>
                <p className="text-sm font-bold text-foreground">
                    {isDragging ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, Excel, PowerPoint, Imagens (Máx. 25 MB)
                </p>
            </div>

            {/* Category Filter */}
            {documents.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'all'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        Todos ({documents.length})
                    </button>
                    {categories.map((cat) => {
                        const count = documents.filter((d) => d.category === cat.value).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setFilter(cat.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === cat.value
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {cat.label} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {/* File List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Nenhum documento encontrado</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        {filter !== 'all'
                            ? 'Não há documentos nessa categoria. Tente "Todos".'
                            : 'Arraste arquivos para a área acima ou clique em "Upload" para começar.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredDocs.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-card border border-border rounded-xl p-3 flex items-center justify-between hover:bg-muted/30 dark:hover:bg-muted/10 transition-all group"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-10 w-10 bg-muted/50 dark:bg-muted/20 rounded-lg flex items-center justify-center shrink-0">
                                    {getFileIcon(doc.file_type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                            {doc.name}
                                        </p>
                                        {doc.source_name && (
                                            <span className="px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 shrink-0">
                                                {doc.source_name}
                                            </span>
                                        )}
                                        {getCategoryBadge(doc.category, entityType)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span className="opacity-40">•</span>
                                        <span>
                                            {new Date(doc.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleDownload(doc)}
                                    title="Baixar"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    title="Excluir"
                                >
                                    {deletingId === doc.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
