'use client';

import {
    Reply,
    ReplyAll,
    Forward,
    MoreVertical,
    Trash2,
    Archive,
    Star,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EmailDetailProps {
    email: any; // Using any for now to simplify, will type properly later
    onBack?: () => void;
}

export function EmailDetail({ email, onBack }: EmailDetailProps) {
    if (!email) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground bg-background">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">📧</span>
                    </div>
                    <p>Selecione um email para ler</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    {onBack && ( // For mobile view
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                            <span className="sr-only">Voltar</span>
                            ←
                        </Button>
                    )}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Archive className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Arquivar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Star className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como lido</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button variant="outline" size="sm" className="gap-2 text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100">
                        <Sparkles className="h-4 w-4" />
                        Gerar Resposta IA
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">
                        {format(email.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content using ScrollArea equivalent div */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight">{email.subject}</h1>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={email.sender.avatar} />
                                <AvatarFallback>{email.sender.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-sm">
                                    {email.sender.name}
                                    <span className="text-muted-foreground font-normal ml-2 text-xs">&lt;{email.sender.email}&gt;</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Para: <span className="text-foreground">Eu</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Email Body */}
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                    {email.body}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-4">
                    <Button variant="outline" className="gap-2">
                        <Reply className="h-4 w-4" /> Responder
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <ReplyAll className="h-4 w-4" /> Responder a todos
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Forward className="h-4 w-4" /> Encaminhar
                    </Button>
                </div>
            </div>
        </div>
    );
}
