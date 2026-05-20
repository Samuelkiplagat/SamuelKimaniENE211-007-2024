import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-dvh flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"
            aria-hidden
          >
            <BookOpen className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              LexiRead
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              PDF reader &amp; vocabulary learning
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}
