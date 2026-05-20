import { BookOpen, Highlighter, StickyNote } from 'lucide-react';
import type { HighlightColor } from '../../classes/AnnotationEngine';
import { HIGHLIGHT_COLORS } from '../../classes/AnnotationEngine';
import type { PendingSelection } from '../../classes/AnnotationEngine';

const COLOR_STYLES: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-300 ring-yellow-500',
  green: 'bg-green-300 ring-green-500',
  blue: 'bg-blue-300 ring-blue-500',
};

interface SelectionActionMenuProps {
  selection: PendingSelection;
  onHighlight: (color: HighlightColor) => void;
  onLookUp: () => void;
  onAddNote: () => void;
  onClose: () => void;
}

export function SelectionActionMenu({
  selection,
  onHighlight,
  onLookUp,
  onAddNote,
  onClose,
}: SelectionActionMenuProps) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 cursor-default"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="absolute z-40 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        style={{
          left: selection.menuPosition.x,
          top: selection.menuPosition.y,
          transform: 'translate(-50%, -100%)',
        }}
        role="toolbar"
        aria-label="Selection actions"
      >
        <div className="flex items-center gap-1 px-1">
          <Highlighter className="h-4 w-4 text-slate-500" aria-hidden />
          <span className="text-xs font-medium text-slate-600">Highlight</span>
        </div>
        <div className="flex gap-2 px-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={`Highlight ${color}`}
              onClick={() => onHighlight(color)}
              className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ${COLOR_STYLES[color]}`}
              aria-label={`Highlight ${color}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onLookUp}
          className="flex min-h-tap items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Look up
        </button>
        <button
          type="button"
          onClick={onAddNote}
          className="flex min-h-tap items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          <StickyNote className="h-4 w-4" aria-hidden />
          Add note
        </button>
      </div>
    </>
  );
}
