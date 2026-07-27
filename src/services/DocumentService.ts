import { createAdminClient } from '@/lib/supabase/admin';
import type { EntityDocument, DocumentCategory, EntityType } from '@/types/document';

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
        if (!table) throw new Error(`Tipo de entidade inválido: ${entityType}`);

        const { data } = await supabase
            .from(table)
            .select('id')
            .eq('id', entityId)
            .eq('organization_id', organizationId)
            .single();

        if (!data) throw new Error('Entidade não encontrada ou acesso negado.');
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

        if (entityType === 'account') {
            // Query 1: Account documents
            const { data: accDocs } = await supabase
                .from('documents')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('entity_type', 'account')
                .eq('entity_id', entityId);

            // Query 2: Deals for this account
            const { data: deals } = await supabase
                .from('deals')
                .select('id, title')
                .eq('account_id', entityId)
                .eq('organization_id', organizationId);
            
            let dealDocs: EntityDocument[] = [];
            const dealIds = deals ? deals.map(d => d.id) : [];
            const dealMap = new Map((deals || []).map(d => [d.id, d.title]));

            // Query 3: Documents for these deals
            if (dealIds.length > 0) {
                const { data: dDocs } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .eq('entity_type', 'deal')
                    .in('entity_id', dealIds);
                if (dDocs) dealDocs = dDocs as EntityDocument[];
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

            if (error) {
                console.error('[DocumentService] getDocuments error:', error);
                return [];
            }

            return (data ?? []) as EntityDocument[];
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
            parent_id?: string | null;
            quote_id?: string | null;
        }
    ): Promise<EntityDocument> {
        // --- Validation ---
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw new Error(`Arquivo muito grande. Máximo permitido: 25 MB`);
        }

        const supabase = createAdminClient();

        // Validate entity ownership
        await this.validateEntityOwnership(supabase, organizationId, entityType, entityId);

        // Fetch version if parent_id is provided
        let version = 1;
        if (meta.parent_id) {
            const { data: versions, error: versionError } = await supabase
                .from('documents')
                .select('version')
                .or(`id.eq.${meta.parent_id},parent_id.eq.${meta.parent_id}`)
                .order('version', { ascending: false })
                .limit(1);

            if (!versionError && versions && versions.length > 0) {
                version = versions[0].version + 1;
            }
        }

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
            console.error('[DocumentService] storage upload error:', storageError);
            throw new Error(`Erro ao enviar arquivo: ${storageError.message}`);
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
                    parent_id: meta.parent_id ?? null,
                    version: version,
                    quote_id: meta.quote_id ?? null,
                },
            ])
            .select()
            .single();

        if (dbError) {
            // Best-effort cleanup: remove the uploaded file
            await supabase.storage.from(BUCKET).remove([filePath]);
            console.error('[DocumentService] db insert error:', dbError);
            throw new Error(`Erro ao salvar metadados: ${dbError.message}`);
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
            throw new Error(`Erro ao gerar link de download: ${error?.message}`);
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

        // Remove from Storage
        await supabase.storage.from(BUCKET).remove([doc.file_path]);

        // Remove from DB
        const { error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('organization_id', organizationId);

        if (dbError) {
            throw new Error(`Erro ao excluir documento: ${dbError.message}`);
        }
    }
}
