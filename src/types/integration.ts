export interface Integration {
    id: string;
    name: string;
    provider: 'ibm_cloud' | 'lenovo' | 'whatsapp' | 'slack' | 'google' | string;
    status: 'connected' | 'disconnected' | 'error';
    configJson: any;
    lastSync: string | null;
}

export interface ApiKey {
    id: string;
    name: string;
    token_prefix: string;
    status: 'active' | 'revoked';
    created_at: string;
    last_used_at?: string;
}

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive' | 'failed';
    secret?: string;
    created_at: string;
    last_triggered: string | null;
}
