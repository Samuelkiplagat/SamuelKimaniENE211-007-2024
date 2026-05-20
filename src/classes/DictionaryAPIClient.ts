export interface DictionaryResult {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
}

export class DictionaryNotFoundError extends Error {
  constructor(word: string) {
    super(`No definition found for "${word}".`);
    this.name = 'DictionaryNotFoundError';
  }
}

interface DictionaryApiEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}

/**
 * Client for Free Dictionary API (dictionaryapi.dev).
 */
export class DictionaryAPIClient {
  private readonly baseUrl =
    'https://api.dictionaryapi.dev/api/v2/entries/en';

  /** Fetch definition, phonetic, and part of speech. */
  async lookup(word: string): Promise<DictionaryResult> {
    const encoded = encodeURIComponent(word);
    const response = await fetch(`${this.baseUrl}/${encoded}`);

    if (response.status === 404) {
      throw new DictionaryNotFoundError(word);
    }

    if (!response.ok) {
      throw new Error(`Dictionary lookup failed (${response.status})`);
    }

    const entries = (await response.json()) as DictionaryApiEntry[];
    const entry = entries[0];
    if (!entry) {
      throw new DictionaryNotFoundError(word);
    }

    const meaning = entry.meanings?.find(
      (m) => m.definitions && m.definitions.length > 0,
    );
    const def = meaning?.definitions?.[0];

    if (!def?.definition) {
      throw new DictionaryNotFoundError(word);
    }

    const phonetic =
      entry.phonetic ??
      entry.phonetics?.find((p) => p.text)?.text;

    return {
      word: entry.word,
      phonetic,
      partOfSpeech: meaning?.partOfSpeech,
      definition: def.definition,
    };
  }
}
