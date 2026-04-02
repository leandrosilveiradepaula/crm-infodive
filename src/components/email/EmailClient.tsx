'use client';

import { useState, useEffect } from 'react';
import { EmailSidebar } from './EmailSidebar';
import { EmailList } from './EmailList';
import { EmailDetail } from './EmailDetail';
import { ContactSuggestionsWidget } from './ContactSuggestionsWidget';
import { ComposeEmailModal } from './ComposeEmailModal';
import { cn } from '@/lib/utils';
import { ConnectEmailButton } from '@/components/settings/ConnectEmailButton';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function EmailClient() {
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/email/sync');
            if (res.status === 401) {
                setError('needs_auth');
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao sincronizar emails');
            }
            const data = await res.json();
            setEmails(data.emails || []);
        } catch (err: any) {
            console.error('Error fetching emails:', err);
            setError(err.message);
            toast.error('Erro ao carregar emails: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedFolder === 'inbox') {
            fetchEmails();
        } else {
            // Mock empty state for other folders for now
            setEmails([]);
            setLoading(false);
        }
    }, [selectedFolder]);

    const filteredEmails = emails; // API currently only returns inbox, so no client-side filtering needed yet
    const selectedEmail = emails.find(email => email.id === selectedEmailId);

    const handleCompose = () => {
        setIsComposing(true);
    };

    if (error === 'needs_auth') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-card border border-border rounded-xl p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-10 w-10 text-primary dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Conecte sua conta Office 365</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Para visualizar e enviar emails diretamente do CRM, você precisa conectar sua conta Microsoft.
                    </p>
                </div>
                <ConnectEmailButton />
            </div>
        );
    }

    return (
        <div className="flex bg-card rounded-xl border border-border overflow-hidden h-[calc(100vh-8rem)] shadow-sm">
            {/* Sidebar */}
            <div className="hidden md:block">
                <EmailSidebar
                    selectedFolder={selectedFolder}
                    onSelectFolder={(folder) => {
                        setSelectedFolder(folder);
                        setSelectedEmailId(null);
                    }}
                    onCompose={handleCompose}
                />
            </div>

            {/* Email List */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 flex flex-col border-r border-border transition-all duration-300 relative",
                selectedEmailId ? "hidden md:flex" : "flex"
            )}>
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : null}

                {/* IA Suggestions - compact banner above email list */}
                {selectedFolder === 'inbox' && !loading && (
                    <div className="px-3 pt-3">
                        <ContactSuggestionsWidget />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <EmailList
                        emails={filteredEmails}
                        selectedEmailId={selectedEmailId}
                        onSelectEmail={setSelectedEmailId}
                    />
                </div>
            </div>

            {/* Email Detail */}
            <div className={cn(
                "flex-1 bg-background transition-all duration-300",
                !selectedEmailId ? "hidden md:block" : "block fixed inset-0 z-50 md:static"
            )}>
                <EmailDetail
                    email={selectedEmail}
                    onBack={() => setSelectedEmailId(null)}
                />
            </div>

            <ComposeEmailModal
                isOpen={isComposing}
                onClose={() => setIsComposing(false)}
            />
        </div>
    );
}
