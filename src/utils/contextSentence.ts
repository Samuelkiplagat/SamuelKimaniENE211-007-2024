/**
 * Best-effort context sentence from PDF selection text.
 * Uses full selection when short; otherwise extracts the sentence around the word.
 */
export function deriveContextSentence(
  word: string,
  selectionText: string,
): string {
  const text = selectionText.trim();
  if (!text) return word;

  if (text.length <= 280) return text;

  const lower = text.toLowerCase();
  const needle = word.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) {
    return text.length > 280 ? `${text.slice(0, 277)}…` : text;
  }

  const before = text.slice(0, idx);
  const after = text.slice(idx + word.length);

  const start =
    Math.max(
      before.lastIndexOf('. ') + 2,
      before.lastIndexOf('! ') + 2,
      before.lastIndexOf('? ') + 2,
      before.lastIndexOf('\n') + 1,
      0,
    ) || 0;

  let end = text.length;
  for (const sep of ['. ', '! ', '? ', '\n']) {
    const pos = after.indexOf(sep);
    if (pos !== -1) {
      end = Math.min(end, idx + word.length + pos + sep.trim().length);
    }
  }

  const sentence = text.slice(start, end).trim();
  if (sentence.length > 0 && sentence.length <= 400) return sentence;

  const windowStart = Math.max(0, idx - 120);
  const windowEnd = Math.min(text.length, idx + word.length + 120);
  const excerpt = text.slice(windowStart, windowEnd).trim();
  return excerpt.length > 280 ? `${excerpt.slice(0, 277)}…` : excerpt;
}
