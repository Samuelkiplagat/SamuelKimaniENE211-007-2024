/** First English word token from selected text (lowercase). */
export function normalizeLookupWord(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/[a-zA-Z][a-zA-Z'-]*/);
  return (match ? match[0] : trimmed.split(/\s+/)[0] ?? '').toLowerCase();
}
