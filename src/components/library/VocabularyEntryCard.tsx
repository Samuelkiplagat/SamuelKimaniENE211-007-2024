import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { VocabularyRecord } from '../../db';
import { formatDate } from '../../utils/format';

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

interface VocabularyEntryCardProps {
  entry: VocabularyRecord;
  onDelete: (id: string) => void;
}

export function VocabularyEntryCard({
  entry,
  onDelete,
}: VocabularyEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-tap w-full items-start gap-3 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold capitalize text-slate-900">
            {entry.word}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {truncate(entry.definition, 120)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {entry.sourceDocumentName || 'Unknown document'}
            {' · '}
            {formatDate(entry.dateAdded)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
          {(entry.phonetic || entry.partOfSpeech) && (
            <p className="mb-3 text-slate-600">
              {entry.phonetic && (
                <span className="font-mono">{entry.phonetic}</span>
              )}
              {entry.phonetic && entry.partOfSpeech && (
                <span className="mx-2 text-slate-300">·</span>
              )}
              {entry.partOfSpeech && (
                <span className="italic">{entry.partOfSpeech}</span>
              )}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500">
                Definition
              </h3>
              <p className="mt-1 leading-relaxed">{entry.definition}</p>
            </div>

            {entry.contextSentence && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  Context
                </h3>
                <p className="mt-1 italic leading-relaxed text-slate-600">
                  &ldquo;{entry.contextSentence}&rdquo;
                </p>
              </div>
            )}

            {entry.exampleSentence && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  Example
                </h3>
                <p className="mt-1 leading-relaxed">{entry.exampleSentence}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="mt-4 flex min-h-tap items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
