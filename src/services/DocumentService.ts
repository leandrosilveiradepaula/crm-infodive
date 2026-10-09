import { createAdminClient } from '../lib/supabase/admin';
import type { EntityDocument, DocumentCategory, EntityType } from '../types/document';

const BUCKET = 'documents';
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/csv',
];

/** Maps entity types to their parent table for ownership validation */
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
    deal: 'deals',
    account: 'accounts',
    contact: 'contacts',
};

export class DocumentService {
    /**
     * Validate that the entity belongs to the organization.
     * Required because the documents table uses polymorphic references (no FK).
     */
    private static async validateEntityOwnership(
        supabase: ReturnType<typeof createAdminClient>,
        organizationId: string,
        entityType: EntityType,
        entityId: string
    ): Promise<void> {
        const table = ENTITY_TABLE_MAP[entityType];
        if (!table) throw new Error('Tipo de entidade inválido.');

        const { data, error } = await supabase
            .from(table)
            .select('id')
            .eq('id', entityId)
            .eq('organization_id', organizationId)
            .single();

        if (error || !data) throw new Error('Entidade não encontrada ou acesso negado.');
    }

    /**
     * List all documents for an entity, scoped to the organization.
     */
    static async getDocuments(
        userId: string,
        organizationId: string,
        entityType: EntityType,
        entityId: string
    ): Promise<EntityDocument[]> {
        const supabase = createAdminClient();
        await this.validateEntityOwnership(supabase, organizationId, entityType, entityId);

        if (entityType === 'account') {
            // Query 1: Account documents
            const { data: accDocs, error: accountDocumentsError } = await supabase
                .from('documents')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('entity_type', 'account')
                .eq('entity_id', entityId);
            if (accountDocumentsError || !accDocs) throw new Error('Não foi possível carregar os documentos.');

            // Query 2: Deals for this account
            const { data: deals, error: dealsError } = await supabase
                .from('deals')
                .select('id, title')
                .eq('account_id', entityId)
                .eq('organization_id', organizationId);
            if (dealsError || !deals) throw new Error('Não foi possível carregar os documentos.');

            let dealDocs: EntityDocument[] = [];
            const dealIds = deals ? deals.map(d => d.id) : [];
            const dealMap = new Map((deals || []).map(d => [d.id, d.title]));

            // Query 3: Documents for these deals
            if (dealIds.length > 0) {
                const { data: dDocs, error: dealDocumentsError } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .eq('entity_type', 'deal')
                    .in('entity_id', dealIds);
                if (dealDocumentsError || !dDocs) throw new Error('Não foi possível carregar os documentos.');
                dealDocs = dDocs as EntityDocument[];
            }
            
            // Merge and sort desc
            const allDocs = [...(accDocs || []), ...dealDocs].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) as EntityDocument[];

            return allDocs.map(doc => ({
                ...doc,
                source_name: doc.entity_type === 'deal' ? `Oportunidade: ${dealMap.get(doc.entity_id) || 'Desconhecida'}` : 'Vínculo: Cadastro'
            }));
            
        } else {
            // Standard fetch for other entities (deals, contacts)
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false });

            if (error || !data) {
                console.error('[DocumentService] documents fetch failed');
                throw new Error('Não foi possível carregar os documentos.');
            }

            return data as EntityDocument[];
        }
    }

    /**
     * Upload a file to Storage and save metadata in the documents table.
     */
    static async uploadDocument(
        userId: string,
        organizationId: string,
        entityType: EntityType,
        entityId: string,
        file: {
            name: string;
            type: string;
            size: number;
            arrayBuffer: ArrayBuffer;
        },
        meta: {
            category?: DocumentCategory;
            description?: string;
        }
    ): Promise<EntityDocument> {
        // --- Validation ---
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error('Tipo de arquivo não permitido.');
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw new Error(`Arquivo muito grande. Máximo permitido: 25 MB`);
        }

        const supabase = createAdminClient();

        // Validate entity ownership
        await this.validateEntityOwnership(supabase, organizationId, entityType, entityId);

        // Unique path: documents/{orgId}/{entityType}/{entityId}/{uuid}-{name}
        const uuid = crypto.randomUUID();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${organizationId}/${entityType}/${entityId}/${uuid}-${safeFileName}`;

        // --- Upload to Storage ---
        const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, file.arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (storageError) {
            console.error('[DocumentService] storage upload failed');
            throw new Error('Não foi possível enviar o documento.');
        }

        // --- Save metadata in DB ---
        const { data, error: dbError } = await supabase
            .from('documents')
            .insert([
                {
                    organization_id: organizationId,
                    entity_type: entityType,
                    entity_id: entityId,
                    created_by: userId,
                    name: file.name,
                    description: meta.description ?? null,
                    file_path: filePath,
                    file_type: file.type,
                    file_size: file.size,
                    category: meta.category ?? 'outro',
                },
            ])
            .select()
            .single();

        if (dbError || !data) {
            // Best-effort cleanup: do not report upload success without metadata.
            const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([filePath]);
            if (cleanupError) console.error('[DocumentService] failed to clean up orphaned storage object');
            console.error('[DocumentService] document metadata insert failed');
            throw new Error('Não foi possível salvar o documento.');
        }

        return data as EntityDocument;
    }

    /**
     * Generate a short-lived signed URL (5 min) for a document.
     */
    static async getSignedUrl(
        userId: string,
        organizationId: string,
        documentId: string
    ): Promise<string> {
        const supabase = createAdminClient();

        // Validate ownership
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', documentId)
            .eq('organization_id', organizationId)
            .single();

        if (docError || !doc) {
            throw new Error('Documento não encontrado ou acesso negado.');
        }

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(doc.file_path, 300);

        if (error || !data?.signedUrl) {
            throw new Error('Não foi possível gerar o link do documento.');
        }

        return data.signedUrl;
    }

    /**
     * Delete a document: removes from Storage and DB.
     */
    static async deleteDocument(
        userId: string,
        organizationId: string,
        documentId: string
    ): Promise<void> {
        const supabase = createAdminClient();

        // Validate ownership and get file_path
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', documentId)
            .eq('organization_id', organizationId)
            .single();

        if (docError || !doc) {
            throw new Error('Documento não encontrado ou acesso negado.');
        }

        // Do not delete metadata if storage removal did not succeed.
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.file_path]);
        if (storageError) throw new Error('Não foi possível excluir o arquivo do documento.');

        const { data: deleted, error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (dbError || !deleted) {
            throw new Error('Não foi possível excluir o documento.');
        }
    }
}
