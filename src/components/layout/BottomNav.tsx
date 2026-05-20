import { Files, Clock, BookMarked, Settings } from 'lucide-react';
import type { TabId } from '../../hooks/useActiveTab';

interface BottomNavProps {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Files }[] = [
  { id: 'files', label: 'Files', icon: Files },
  { id: 'recents', label: 'Recents', icon: Clock },
  { id: 'library', label: 'Library', icon: BookMarked },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ activeTab, onSelect }: BottomNavProps) {
  return (
    <nav
      className="safe-bottom sticky bottom-0 z-20 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg justify-around px-2 py-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-tap w-full min-w-tap flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
