import type { VocabularyRecord } from '../db';
import { deriveContextSentence } from '../utils/contextSentence';
import { normalizeLookupWord } from '../utils/word';
import type { DataStore } from './DataStore';
import {
  DictionaryAPIClient,
  DictionaryNotFoundError,
} from './DictionaryAPIClient';
import type { SearchController } from './SearchController';
import type { WikipediaAPIClient } from './WikipediaAPIClient';

export interface LookupResult {
  word: string;
  definition: string;
  phonetic?: string;
  partOfSpeech?: string;
  wikipediaSummary?: string;
  wikipediaTitle?: string;
}

export interface VocabSaveInput {
  word: string;
  definition: string;
  phonetic?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  contextSentence: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
}

export { DictionaryNotFoundError };

const DEFAULT_REVIEW_HOURS = 24;

/**
 * Coordinates vocabulary lookup, library, and save/delete.
 */
export class VocabManager {
  constructor(
    private readonly dataStore: DataStore,
    private readonly dictionaryClient: DictionaryAPIClient,
    private readonly wikipediaClient: WikipediaAPIClient,
    private readonly searchController: SearchController,
  ) {}

  /** Look up a word via dictionary + Wikipedia (parallel). */
  async lookupWord(text: string): Promise<LookupResult> {
    const word = normalizeLookupWord(text);
    if (!word) {
      throw new Error('Select a word to look up.');
    }

    const [dictOutcome, wikiOutcome] = await Promise.allSettled([
      this.dictionaryClient.lookup(word),
      this.wikipediaClient.lookup(word),
    ]);

    if (dictOutcome.status === 'rejected') {
      if (dictOutcome.reason instanceof DictionaryNotFoundError) {
        throw dictOutcome.reason;
      }
      throw dictOutcome.reason instanceof Error
        ? dictOutcome.reason
        : new Error('Dictionary lookup failed.');
    }

    const dict = dictOutcome.value;
    const wiki =
      wikiOutcome.status === 'fulfilled' ? wikiOutcome.value : null;

    return {
      word: dict.word,
      definition: dict.definition,
      phonetic: dict.phonetic,
      partOfSpeech: dict.partOfSpeech,
      wikipediaSummary: wiki?.extract,
      wikipediaTitle: wiki?.title,
    };
  }

  /** Save entry to vocabulary library (word stored lowercase). */
  async saveEntry(input: VocabSaveInput): Promise<string> {
    await this.dataStore.init();

    const word = normalizeLookupWord(input.word) || input.word.trim().toLowerCase();
    if (!word) {
      throw new Error('Cannot save an empty word.');
    }

    const now = Date.now();
    const contextSentence = input.contextSentence.trim()
      ? input.contextSentence.trim()
      : deriveContextSentence(word, input.contextSentence);

    const record = await this.dataStore.putVocabulary({
      word,
      definition: input.definition,
      phonetic: input.phonetic,
      partOfSpeech: input.partOfSpeech,
      exampleSentence: input.exampleSentence,
      contextSentence,
      sourceDocumentId: input.sourceDocumentId,
      sourceDocumentName: input.sourceDocumentName,
      dateAdded: now,
      reviewIntervalHours: DEFAULT_REVIEW_HOURS,
      nextReviewAt: now + DEFAULT_REVIEW_HOURS * 60 * 60 * 1000,
    });

    return record.id;
  }

  /** All saved entries, newest first. */
  async listEntries(): Promise<VocabularyRecord[]> {
    await this.dataStore.init();
    return this.dataStore.getAllVocabulary();
  }

  /** Filter entries by word or definition (in-memory). */
  async searchEntries(query: string): Promise<VocabularyRecord[]> {
    const all = await this.listEntries();
    return this.searchController.filterVocabulary(all, query);
  }

  /** Remove a vocabulary entry. */
  async deleteEntry(id: string): Promise<void> {
    await this.dataStore.init();
    await this.dataStore.deleteVocabulary(id);
  }
}
