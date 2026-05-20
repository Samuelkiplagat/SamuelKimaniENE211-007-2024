import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AnnotationNoteModalProps {
  selectedText: string;
  onSave: (note: string) => void | Promise<void>;
  onClose: () => void;
}

export function AnnotationNoteModal({
  selectedText,
  onSave,
  onClose,
}: AnnotationNoteModalProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-dialog-title"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="note-dialog-title"
            className="text-lg font-semibold text-slate-900"
          >
            Add note
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap min-w-tap items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 line-clamp-2 rounded-lg bg-slate-100 px-3 py-2 text-sm italic text-slate-700">
          &ldquo;{selectedText}&rdquo;
        </p>

        <label className="block text-sm font-medium text-slate-700" htmlFor="note-input">
          Your note
        </label>
        <textarea
          id="note-input"
          ref={inputRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          placeholder="Write a note about this passage…"
        />

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-tap flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="min-h-tap flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </form>
    </div>
  );
}
