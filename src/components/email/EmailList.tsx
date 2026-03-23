'use client';

import {
    Search,
    MoreHorizontal,
    Star,
    Paperclip
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Email {
    id: string;
    sender: {
        name: string;
        email: string;
        avatar?: string;
    };
    subject: string;
    preview: string;
    date: Date;
    read: boolean;
    labels: string[];
    hasAttachment?: boolean;
    isStarred?: boolean;
}

interface EmailListProps {
    emails: Email[];
    selectedEmailId: string | null;
    onSelectEmail: (id: string) => void;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
    return (
        <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background/50">
            {/* Header / Search */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar..."
                        className="pl-9 bg-accent/50 border-transparent focus:bg-background transition-colors"
                    />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Email List */}
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                    {emails.map((email) => (
                        <button
                            key={email.id}
                            onClick={() => onSelectEmail(email.id)}
                            className={cn(
                                "flex flex-col gap-2 p-3 rounded-lg border text-left transition-all hover:bg-accent/50",
                                selectedEmailId === email.id
                                    ? "bg-accent border-primary/20 shadow-sm"
                                    : "bg-card border-transparent hover:border-border"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={cn(
                                    "font-semibold text-sm truncate pr-2",
                                    !email.read && "text-foreground"
                                )}>
                                    {email.sender.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(email.date, { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span className={cn(
                                    "text-xs truncate font-medium",
                                    !email.read ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {email.subject}
                                </span>
                                {email.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {email.preview}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                                {email.labels.map(label => (
                                    <Badge key={label} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                        {label}
                                    </Badge>
                                ))}
                                {email.isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-auto" />}
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
