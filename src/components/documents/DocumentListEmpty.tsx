import type { LucideIcon } from 'lucide-react';

interface DocumentListEmptyProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function DocumentListEmpty({
  icon: Icon,
  title,
  description,
}: DocumentListEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
