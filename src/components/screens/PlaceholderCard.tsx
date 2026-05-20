import type { LucideIcon } from 'lucide-react';

interface PlaceholderCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

export function PlaceholderCard({
  icon: Icon,
  title,
  description,
  phase,
}: PlaceholderCardProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby={`screen-${title.replace(/\s/g, '-')}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2
        id={`screen-${title.replace(/\s/g, '-')}`}
        className="text-xl font-semibold text-slate-900"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <p className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        Coming in {phase}
      </p>
    </section>
  );
}
