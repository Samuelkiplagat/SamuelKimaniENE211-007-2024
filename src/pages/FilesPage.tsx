import { FolderOpen, Search, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentListEmpty } from '../components/documents/DocumentListEmpty';
import { RenameDocumentModal } from '../components/documents/RenameDocumentModal';
import { useAppServices } from '../context/AppServicesContext';
import { useSettings } from '../context/SettingsContext';
import type { DocumentSort } from '../classes/FileManager';
import type { DefaultSortOrder, DocumentRecord } from '../db';

const SORT_OPTIONS: { value: DocumentSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'size-desc', label: 'Largest first' },
];

interface FilesPageProps {
  onOpenDocument: (documentId: string) => void;
}

export function FilesPage({ onOpenDocument }: FilesPageProps) {
  const { fileManager, searchController } = useAppServices();
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [sort, setSort] = useState<DefaultSortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentRecord | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fileManager.listDocuments(sort);
      setDocuments(list);
    } finally {
      setLoading(false);
    }
  }, [fileManager, sort]);

  useEffect(() => {
    if (settings) {
      setSort(settings.defaultSortOrder);
    }
  }, [settings?.defaultSortOrder, settings]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const filtered = searchController.filterDocuments(documents, searchQuery);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      window.alert('Please choose a PDF file.');
      return;
    }
    setImporting(true);
    try {
      await fileManager.importPdf(file);
      await loadDocuments();
    } catch (err) {
      console.error(err);
      window.alert('Could not import PDF. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleRename = async (displayName: string) => {
    if (!renameTarget) return;
    await fileManager.renameDocument(renameTarget.id, displayName);
    await loadDocuments();
  };

  const handleDelete = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    const name = doc?.displayName ?? 'this file';
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fileManager.deleteDocument(id);
    await loadDocuments();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => void handleImport(e)}
      />

      <button
        type="button"
        disabled={importing}
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-tap w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <Upload className="h-5 w-5" aria-hidden />
        {importing ? 'Importing…' : 'Import PDF'}
      </button>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search files…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-tap w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label="Search files by name"
          />
        </div>
        <label className="sr-only" htmlFor="files-sort">
          Sort files
        </label>
        <select
          id="files-sort"
          value={sort}
          onChange={(e) => {
            const value = e.target.value as DefaultSortOrder;
            setSort(value);
            void updateSettings({ defaultSortOrder: value });
          }}
          className="min-h-tap shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-600">Loading files…</p>
      ) : filtered.length === 0 ? (
        <DocumentListEmpty
          icon={FolderOpen}
          title={searchQuery ? 'No matches' : 'No PDFs yet'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Tap Import PDF to add your first document.'
          }
        />
      ) : (
        <ul className="space-y-3" aria-label="PDF files">
          {filtered.map((doc) => (
            <li key={doc.id}>
              <DocumentCard
                document={doc}
                onOpen={onOpenDocument}
                onRename={setRenameTarget}
                onDelete={handleDelete}
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
