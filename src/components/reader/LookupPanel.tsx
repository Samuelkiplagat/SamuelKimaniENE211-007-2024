import { BookMarked, BookOpen, Loader2, X } from 'lucide-react';
import type { LookupResult } from '../../classes/VocabManager';

interface LookupPanelProps {
  query: string;
  result: LookupResult | null;
  loading: boolean;
  error: string | null;
  saving?: boolean;
  saved?: boolean;
  onSave?: () => void;
  onClose: () => void;
}

export function LookupPanel({
  query,
  result,
  loading,
  error,
  saving = false,
  saved = false,
  onSave,
  onClose,
}: LookupPanelProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl px-2 pb-2 safe-bottom"
      role="dialog"
      aria-label="Word lookup"
      aria-busy={loading || saving}
    >
      <div className="max-h-[min(70vh,28rem)] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-600" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">
              {loading ? 'Looking up…' : result?.word ?? query}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap min-w-tap items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close lookup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Fetching definition…
            </div>
          )}

          {error && !loading && (
            <p className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {result && !loading && !error && (
            <div className="space-y-4">
              {(result.phonetic || result.partOfSpeech) && (
                <p className="text-sm text-slate-600">
                  {result.phonetic && (
                    <span className="font-mono">{result.phonetic}</span>
                  )}
                  {result.phonetic && result.partOfSpeech && (
                    <span className="mx-2 text-slate-300">·</span>
                  )}
                  {result.partOfSpeech && (
                    <span className="italic">{result.partOfSpeech}</span>
                  )}
                </p>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Definition
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">
                  {result.definition}
                </p>
              </div>

              {result.wikipediaSummary ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Wikipedia
                    {result.wikipediaTitle ? (
                      <span className="ml-1 font-normal normal-case text-slate-400">
                        ({result.wikipediaTitle})
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {result.wikipediaSummary}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No Wikipedia summary available for this word.
                </p>
              )}

              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || saved}
                  className="flex min-h-tap w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  <BookMarked className="h-5 w-5" aria-hidden />
                  {saved
                    ? 'Saved to library'
                    : saving
                      ? 'Saving…'
                      : 'Save to Library'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
