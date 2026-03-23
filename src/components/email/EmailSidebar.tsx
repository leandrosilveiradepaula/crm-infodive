'use client';

import {
    Inbox,
    Send,
    File,
    Trash2,
    AlertCircle,
    Star,
    Tag,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EmailSidebarProps {
    selectedFolder: string;
    onSelectFolder: (folder: string) => void;
    onCompose: () => void;
}

export function EmailSidebar({ selectedFolder, onSelectFolder, onCompose }: EmailSidebarProps) {
    const folders = [
        { id: 'inbox', label: 'Inbox', icon: Inbox, count: 4 },
        { id: 'sent', label: 'Enviados', icon: Send, count: 0 },
        { id: 'drafts', label: 'Rascunhos', icon: File, count: 1 },
        { id: 'important', label: 'Importantes', icon: Star, count: 0 },
        { id: 'spam', label: 'Spam', icon: AlertCircle, count: 0 },
        { id: 'trash', label: 'Lixeira', icon: Trash2, count: 0 },
    ];

    const labels = [
        { id: 'personal', label: 'Pessoal', color: 'bg-green-500' },
        { id: 'work', label: 'Trabalho', color: 'bg-blue-500' },
        { id: 'finance', label: 'Financeiro', color: 'bg-yellow-500' },
    ];

    return (
        <div className="w-64 flex flex-col h-full border-r border-border bg-card/50">
            <div className="p-4">
                <Button
                    onClick={onCompose}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Mensagem
                </Button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 space-y-1">
                {folders.map((folder) => {
                    const Icon = folder.icon;
                    const isSelected = selectedFolder === folder.id;

                    return (
                        <button
                            key={folder.id}
                            onClick={() => onSelectFolder(folder.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                isSelected
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4" />
                                <span>{folder.label}</span>
                            </div>
                            {folder.count > 0 && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {folder.count}
                                </span>
                            )}
                        </button>
                    );
                })}

                <div className="pt-4 pb-2 px-3">
                    <Separator />
                </div>

                <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Marcadores
                </div>

                {labels.map((label) => (
                    <button
                        key={label.id}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-lg transition-colors"
                    >
                        <div className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white/10", label.color)} />
                        <span>{label.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
