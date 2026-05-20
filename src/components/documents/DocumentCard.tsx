import { ChevronRight, FileText, Pencil, Trash2 } from 'lucide-react';
import type { DocumentRecord } from '../../db';
import { formatDate, formatFileSize } from '../../utils/format';

interface DocumentCardProps {
  document: DocumentRecord;
  onOpen: (id: string) => void;
  onRename: (document: DocumentRecord) => void;
  onDelete?: (id: string) => void;
  showLastOpened?: boolean;
}

export function DocumentCard({
  document,
  onOpen,
  onRename,
  onDelete,
  showLastOpened = false,
}: DocumentCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onOpen(document.id)}
        className="flex min-h-tap w-full items-center gap-3 rounded-t-2xl px-4 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {document.displayName}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {formatFileSize(document.size)}
            {' · '}
            {showLastOpened && document.lastOpenedAt
              ? `Opened ${formatDate(document.lastOpenedAt)}`
              : `Added ${formatDate(document.importDate)}`}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      </button>

      <div className="flex border-t border-slate-100">
        <button
          type="button"
          onClick={() => onRename(document)}
          className="flex min-h-tap flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Rename
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(document.id)}
            className="flex min-h-tap flex-1 items-center justify-center gap-1.5 border-l border-slate-100 py-3 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
