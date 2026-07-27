'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FileText, Download, Trash2, Upload, HardDrive, FileSpreadsheet,
    File as FileIcon, Image as ImageIcon, Loader2, FolderOpen,
    FileArchive, Presentation, History, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

import type { EntityDocument, DocumentCategory, EntityType } from '@/types/document';
import { getDocumentCategories } from '@/types/document';
import { Button } from '@/components/ui/button';
import { FilePreviewModal } from './FilePreviewModal';

interface DocumentsTabProps {
    entityType: EntityType;
    entityId: string;
    fetchDocuments: (entityId: string) => Promise<EntityDocument[]>;
    uploadDocument: (entityId: string, formData: FormData) => Promise<EntityDocument>;
    getSignedUrl: (documentId: string) => Promise<string>;
    deleteDocument: (documentId: string) => Promise<boolean>;
    dealQuotes?: { id: string; title: string }[];
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
        configuracao: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
        precos_aprovados: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
        proposta: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
        espelho_nf: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
        pedido: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
        outro: { bg: 'bg-muted', text: 'text-muted-foreground' },
    };
    const categories = getDocumentCategories(entityType);
    const label = categories.find((c) => c.value === category)?.label ?? category;
    const colors = map[category] ?? map.outro;
    return (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
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
    dealQuotes,
}: DocumentsTabProps) => {
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('outro');
    const [isDraggingOverId, setIsDraggingOverId] = useState<string | 'general' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Versioning and Preview states
    const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});
    const [uploadingParentId, setUploadingParentId] = useState<string | null>(null);
    const [uploadingQuoteId, setUploadingQuoteId] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

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
    const handleUpload = async (files: FileList | File[], parentIdOverride?: string | null, quoteIdOverride?: string | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;
        const parentId = parentIdOverride !== undefined ? parentIdOverride : uploadingParentId;
        const quoteId = quoteIdOverride !== undefined ? quoteIdOverride : uploadingQuoteId;

        // Inherit parent category if uploading a version
        const parentDoc = parentId ? documents.find(d => d.id === parentId) : null;
        const categoryToUse = parentDoc ? parentDoc.category : selectedCategory;

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', categoryToUse);
                if (parentId) {
                    formData.append('parent_id', parentId);
                }
                if (quoteId) {
                    formData.append('quote_id', quoteId);
                }

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
        setUploadingParentId(null);
        setUploadingQuoteId(null);
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
    const handleDragOver = (e: React.DragEvent, id: string | 'general') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverId(id);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverId(null);
    };
    const handleDrop = (e: React.DragEvent, id: string | 'general') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverId(null);
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files, null, id === 'general' ? null : id);
        }
    };

    // --- Version Grouping Logic ---
    const chains: Record<string, EntityDocument[]> = {};
    documents.forEach((doc) => {
        const rootId = doc.parent_id || doc.id;
        if (!chains[rootId]) chains[rootId] = [];
        chains[rootId].push(doc);
    });

    const documentChains = Object.values(chains).map((chain) => {
        const sorted = [...chain].sort((a, b) => b.version - a.version);
        return {
            latest: sorted[0],
            history: sorted.slice(1),
        };
    });

    const filteredChains = filter === 'all'
        ? documentChains
        : documentChains.filter((c) => c.latest.category === filter);

    const toggleChain = (rootId: string) => {
        setExpandedChains((prev) => ({ ...prev, [rootId]: !prev[rootId] }));
    };

    const handleUploadVersionClick = (doc: EntityDocument) => {
        const rootId = doc.parent_id || doc.id;
        setUploadingParentId(rootId);
        fileInputRef.current?.click();
    };

    // Helper to count unique chains for categories
    const countChainByCategory = (catValue: DocumentCategory) => {
        return documentChains.filter(c => c.latest.category === catValue).length;
    };

    const renderDocumentRow = (doc: EntityDocument, isVersion = false, hasHistory = false, historyCount = 0, rootId = '') => {
        return (
            <div
                className={`
                    bg-card border border-border rounded-xl p-3 flex items-center justify-between transition-all group
                    ${isVersion 
                        ? 'bg-muted/10 dark:bg-muted/5 border-dashed border-l-2 ml-8 mt-1.5 pl-4 py-2 text-xs' 
                        : 'hover:bg-muted/30 dark:hover:bg-muted/10'
                    }
                `}
            >
                <div 
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                >
                    <div className={`
                        ${isVersion ? 'h-8 w-8' : 'h-10 w-10'}
                        bg-muted/50 dark:bg-muted/20 rounded-lg flex items-center justify-center shrink-0
                    `}>
                        {getFileIcon(doc.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className={`
                                font-bold text-foreground truncate group-hover:text-primary transition-colors
                                ${isVersion ? 'text-xs' : 'text-sm'}
                            `}>
                                {doc.name}
                            </p>
                            {doc.source_name && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 shrink-0">
                                    {doc.source_name}
                                </span>
                            )}
                            {!isVersion && getCategoryBadge(doc.category, entityType)}
                            {isVersion && (
                                <span className="px-1 py-0.2 rounded bg-muted text-[8px] font-mono font-bold text-muted-foreground uppercase">
                                    Versão {doc.version}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span className="opacity-40">•</span>
                            <span>
                                {new Date(doc.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                    {/* Collapsible history activator */}
                    {hasHistory && !isVersion && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-[10px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => toggleChain(rootId)}
                            title="Ver histórico de versões"
                        >
                            <History className="w-3.5 h-3.5 mr-1" />
                            v{doc.version} ({historyCount})
                            {expandedChains[rootId] ? (
                                <ChevronUp className="w-3 h-3 ml-1" />
                            ) : (
                                <ChevronDown className="w-3 h-3 ml-1" />
                            )}
                        </Button>
                    )}

                    {/* Upload new version */}
                    {!isVersion && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleUploadVersionClick(doc)}
                            title="Subir nova versão"
                        >
                            <Upload className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Download */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleDownload(doc)}
                        title="Baixar"
                    >
                        <Download className="w-4 h-4" />
                    </Button>

                    {/* Delete */}
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
        );
    };

    return (
        <div className="h-full flex flex-col p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Documentos</h3>
                    <p className="text-sm text-muted-foreground">
                        {entityType === 'account' ? 'Documentos da empresa' : 'Arquivos anexados à oportunidade'}
                        {documentChains.length > 0 && (
                            <span className="ml-1 text-xs font-bold text-muted-foreground/60">
                                ({documentChains.length} arquivos)
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
                        onClick={() => {
                            setUploadingParentId(null);
                            setUploadingQuoteId(null);
                            fileInputRef.current?.click();
                        }}
                        disabled={uploading}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-wide shadow-sm"
                    >
                        {uploading && !uploadingParentId && !uploadingQuoteId ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploading && !uploadingParentId && !uploadingQuoteId ? 'Enviando...' : 'Upload Geral'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.csv,.txt"
                        onChange={(e) => {
                            if (e.target.files) handleUpload(e.target.files);
                            e.target.value = '';
                        }}
                    />
                </div>
            </div>

            {/* Category Filter */}
            {documentChains.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'all'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        Todos ({documentChains.length})
                    </button>
                    {categories.map((cat) => {
                        const count = countChainByCategory(cat.value);
                        if (count === 0) return null;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setFilter(cat.value)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === cat.value
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

            {/* Smart Folders */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-8 pb-8">
                    {(() => {
                        const folders = dealQuotes && dealQuotes.length > 0
                            ? [
                                { id: 'general', name: 'Arquivos Gerais', isGeneral: true },
                                ...dealQuotes.map(q => ({ id: q.id, name: `Opção: ${q.title}`, isGeneral: false }))
                            ]
                            : [{ id: 'general', name: 'Documentos', isGeneral: true }];

                        return folders.map(folder => {
                            const folderChains = filteredChains.filter(c => 
                                folder.isGeneral ? !c.latest.quote_id : c.latest.quote_id === folder.id
                            );
                            
                            // Don't hide empty folders so users can drop files into them
                            const isDraggingThis = isDraggingOverId === folder.id;

                            return (
                                <div key={folder.id} className="flex flex-col space-y-3" id={`folder-${folder.id}`}>
                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                                            {folder.name}
                                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {folderChains.length}
                                            </span>
                                        </h4>
                                        {dealQuotes && dealQuotes.length > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-xs font-bold text-muted-foreground hover:text-primary"
                                                onClick={() => {
                                                    setUploadingParentId(null);
                                                    setUploadingQuoteId(folder.isGeneral ? null : folder.id);
                                                    fileInputRef.current?.click();
                                                }}
                                            >
                                                <Upload className="w-3.5 h-3.5 mr-1.5" /> Anexar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Dropzone for this folder */}
                                    <div
                                        onDragOver={(e) => handleDragOver(e, folder.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, folder.id)}
                                        onClick={() => {
                                            if (!uploading) {
                                                setUploadingParentId(null);
                                                setUploadingQuoteId(folder.isGeneral ? null : folder.id);
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        className={`
                                            border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                                            ${isDraggingThis
                                                ? 'border-primary bg-primary/10 py-6 scale-[1.01] shadow-sm'
                                                : 'border-transparent hover:border-primary/40 hover:bg-muted/30 py-3'
                                            }
                                            ${folderChains.length === 0 && !isDraggingThis ? 'border-border/50 py-8 bg-muted/10' : ''}
                                        `}
                                    >
                                        {folderChains.length === 0 || isDraggingThis ? (
                                            <>
                                                <HardDrive className={`w-5 h-5 mb-2 transition-colors ${isDraggingThis ? 'text-primary' : 'text-muted-foreground/60'}`} />
                                                <p className="text-xs font-bold text-foreground">
                                                    {isDraggingThis ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para fazer upload'}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                                                Arraste novos arquivos aqui
                                            </p>
                                        )}
                                    </div>

                                    {/* File List for this folder */}
                                    {folderChains.length > 0 && (
                                        <div className="space-y-2">
                                            {folderChains.map((chain) => {
                                                const rootId = chain.latest.parent_id || chain.latest.id;
                                                const hasHistory = chain.history.length > 0;
                                                const isExpanded = !!expandedChains[rootId];

                                                return (
                                                    <div key={chain.latest.id} className="flex flex-col">
                                                        {renderDocumentRow(
                                                            chain.latest,
                                                            false,
                                                            hasHistory,
                                                            chain.history.length,
                                                            rootId
                                                        )}
                                                        
                                                        {hasHistory && isExpanded && (
                                                            <div className="flex flex-col space-y-1">
                                                                {chain.history.map((histDoc) => 
                                                                    renderDocumentRow(histDoc, true, false, 0, rootId)
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {/* Lightbox / Previewer Modal */}
            <FilePreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                fileName={previewDoc?.name || ''}
                fileType={previewDoc?.file_type || ''}
                fileSizeStr={previewDoc ? formatFileSize(previewDoc.file_size) : ''}
                signedUrlProvider={async () => {
                    if (!previewDoc) return '';
                    return await getSignedUrlFn(previewDoc.id);
                }}
            />
        </div>
    );
};
