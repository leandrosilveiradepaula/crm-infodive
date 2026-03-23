
'use client';

import { Deal } from '@/types/deal';
import { DocumentsTab } from '@/components/shared/DocumentsTab';
import {
    getDealDocuments,
    uploadDealDocument,
    getDealDocumentSignedUrl,
    deleteDealDocument,
} from '@/app/(dashboard)/pipeline/actions';

interface FilesTabProps {
    deal: Deal;
}

export const FilesTab = ({ deal }: FilesTabProps) => {
    return (
        <DocumentsTab
            entityType="deal"
            entityId={deal.id}
            fetchDocuments={getDealDocuments}
            uploadDocument={uploadDealDocument}
            getSignedUrl={getDealDocumentSignedUrl}
            deleteDocument={deleteDealDocument}
        />
    );
};
