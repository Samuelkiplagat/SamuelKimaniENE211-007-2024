import { BookMarked, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { VocabularyEntryCard } from '../components/library/VocabularyEntryCard';
import { DocumentListEmpty } from '../components/documents/DocumentListEmpty';
import { useAppServices } from '../context/AppServicesContext';
import type { VocabularyRecord } from '../db';

export function LibraryPage() {
  const { vocabManager } = useAppServices();
  const [entries, setEntries] = useState<VocabularyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const list = searchQuery.trim()
        ? await vocabManager.searchEntries(searchQuery)
        : await vocabManager.listEntries();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, [vocabManager, searchQuery]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleDelete = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    const label = entry?.word ?? 'this word';
    if (!window.confirm(`Remove "${label}" from your library?`)) return;
    await vocabManager.deleteEntry(id);
    await loadEntries();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search vocabulary…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-tap w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          aria-label="Search saved words"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-600">Loading library…</p>
      ) : entries.length === 0 ? (
        <DocumentListEmpty
          icon={BookMarked}
          title={searchQuery ? 'No matches' : 'Library is empty'}
          description={
            searchQuery
              ? 'Try another search term.'
              : 'Look up a word while reading and tap Save to Library.'
          }
        />
      ) : (
        <ul className="space-y-3" aria-label="Saved vocabulary">
          {entries.map((entry) => (
            <li key={entry.id}>
              <VocabularyEntryCard entry={entry} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
