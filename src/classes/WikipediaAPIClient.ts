export interface WikipediaSummary {
  title: string;
  extract: string;
}

interface WikipediaApiResponse {
  title?: string;
  extract?: string;
  type?: string;
}

/**
 * Client for Wikipedia REST Summary API.
 */
export class WikipediaAPIClient {
  private readonly baseUrl =
    'https://en.wikipedia.org/api/rest_v1/page/summary';

  /** Fetch a short introductory summary; returns null if not found. */
  async lookup(word: string): Promise<WikipediaSummary | null> {
    const encoded = encodeURIComponent(word.charAt(0).toUpperCase() + word.slice(1));
    try {
      const response = await fetch(`${this.baseUrl}/${encoded}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as WikipediaApiResponse;

      if (!data.extract || data.type === 'disambiguation') {
        return null;
      }

      return {
        title: data.title ?? word,
        extract: data.extract,
      };
    } catch {
      return null;
    }
  }
}
