import { Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentListEmpty } from '../components/documents/DocumentListEmpty';
import { RenameDocumentModal } from '../components/documents/RenameDocumentModal';
import { useAppServices } from '../context/AppServicesContext';
import type { DocumentRecord } from '../db';

interface RecentsPageProps {
  onOpenDocument: (documentId: string) => void;
  /** Increment to reload after returning from reader. */
  refreshToken?: number;
}

export function RecentsPage({ onOpenDocument, refreshToken = 0 }: RecentsPageProps) {
  const { fileManager } = useAppServices();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameTarget, setRenameTarget] = useState<DocumentRecord | null>(null);

  const loadRecents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fileManager.getRecents(10);
      setDocuments(list);
    } finally {
      setLoading(false);
    }
  }, [fileManager]);

  useEffect(() => {
    void loadRecents();
  }, [loadRecents, refreshToken]);

  const handleRename = async (displayName: string) => {
    if (!renameTarget) return;
    await fileManager.renameDocument(renameTarget.id, displayName);
    await loadRecents();
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-600">Loading recents…</p>
      ) : documents.length === 0 ? (
        <DocumentListEmpty
          icon={Clock}
          title="Nothing recent yet"
          description="Open a PDF from Files and it will appear here."
        />
      ) : (
        <ul className="space-y-3" aria-label="Recently opened PDFs">
          {documents.map((doc) => (
            <li key={doc.id}>
              <DocumentCard
                document={doc}
                onOpen={onOpenDocument}
                onRename={setRenameTarget}
                showLastOpened
              />
            </li>
          ))}
        </ul>
      )}

      {renameTarget && (
        <RenameDocumentModal
          currentName={renameTarget.displayName}
          onSave={handleRename}
          onClose={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}
