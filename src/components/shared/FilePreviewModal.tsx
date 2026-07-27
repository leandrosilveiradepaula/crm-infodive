'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, FileSpreadsheet, FileArchive, Presentation, File as FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileType: string;
    fileSizeStr: string;
    signedUrlProvider: () => Promise<string>;
}

export function FilePreviewModal({
    isOpen,
    onClose,
    fileName,
    fileType,
    fileSizeStr,
    signedUrlProvider,
}: FilePreviewModalProps) {
    const [signedUrl, setSignedUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!isOpen) {
            setSignedUrl('');
            setError('');
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError('');

        signedUrlProvider()
            .then((url) => {
                if (isMounted) {
                    setSignedUrl(url);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error('[FilePreviewModal] Error generating signed URL:', err);
                    setError('Não foi possível carregar a visualização do arquivo.');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, signedUrlProvider]);

    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';
    const isText = fileType.startsWith('text/');

    const canPreview = isImage || isPdf || isText;

    const renderPreview = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] h-full">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-4 font-bold">Carregando visualização...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-6">
                    <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                        <X className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">Você ainda pode fazer o download do arquivo diretamente.</p>
                    <Button onClick={() => window.open(signedUrl, '_blank')} className="mt-4" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Arquivo
                    </Button>
                </div>
            );
        }

        if (isImage) {
            return (
                <div className="flex items-center justify-center bg-zinc-950/5 dark:bg-zinc-950/20 rounded-xl overflow-hidden min-h-[400px] max-h-[70vh] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={signedUrl}
                        alt={fileName}
                        className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md select-none transition-transform"
                    />
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-border/50 bg-background shadow-inner">
                    <iframe
                        src={`${signedUrl}#toolbar=0`}
                        title={fileName}
                        className="w-full h-full border-none"
                    />
                </div>
            );
        }

        if (isText) {
            return (
                <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-border/50 bg-muted/30 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                    <iframe
                        src={signedUrl}
                        title={fileName}
                        className="w-full h-full border-none bg-transparent"
                    />
                </div>
            );
        }

        // Fallback para tipos de arquivos não suportados diretamente
        const getLargeIcon = () => {
            if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv')
                return <FileSpreadsheet className="w-16 h-16 text-emerald-500" />;
            if (fileType.includes('presentation') || fileType.includes('powerpoint'))
                return <Presentation className="w-16 h-16 text-orange-500" />;
            if (fileType.includes('word'))
                return <FileText className="w-16 h-16 text-blue-500" />;
            if (fileType.includes('zip') || fileType.includes('rar'))
                return <FileArchive className="w-16 h-16 text-yellow-600" />;
            return <FileIcon className="w-16 h-16 text-muted-foreground/80" />;
        };

        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-8 bg-muted/10 dark:bg-muted/5 rounded-2xl border border-border/50 border-dashed">
                <div className="p-4 bg-background dark:bg-card rounded-2xl shadow-sm border border-border/40 mb-4 animate-pulse">
                    {getLargeIcon()}
                </div>
                <h4 className="text-base font-bold text-foreground max-w-md truncate">{fileName}</h4>
                <p className="text-xs text-muted-foreground font-mono mt-1">{fileSizeStr}</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-3">
                    Visualização direta não disponível para este formato. Clique no botão abaixo para baixar.
                </p>
                <Button onClick={() => window.open(signedUrl, '_blank')} className="mt-6 font-bold shadow-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download do Arquivo
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] p-6 gap-4 flex flex-col max-h-[90vh]">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 pr-6">
                        <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            {isImage ? (
                                <ImageIcon className="w-5 h-5 text-primary" />
                            ) : (
                                <FileText className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-base font-bold text-foreground truncate select-all">
                                {fileName}
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {fileSizeStr} • {fileType}
                            </p>
                        </div>
                    </div>
                    {/* Botão de download no topo do modal caso a visualização seja compatível */}
                    {canPreview && !loading && !error && (
                        <Button
                            onClick={() => window.open(signedUrl, '_blank')}
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 mr-4 font-bold text-xs"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download
                        </Button>
                    )}
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    {renderPreview()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
