/**
 * Wikipedia API Fallback Utility
 * Provides fallback data retrieval when main servers are down
 */

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

export interface WikipediaSearchResult {
  title: string;
  extract: string;
  url: string;
  pageId: number;
}

export interface WikipediaFallbackResponse {
  success: boolean;
  source: "primary" | "wikipedia";
  data: string;
  error?: string;
}

/**
 * Search Wikipedia for relevant information
 */
export async function searchWikipedia(
  query: string,
  limit: number = 1
): Promise<WikipediaSearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      srsearch: query,
      srwhat: "text",
      srprop: "snippet",
      srlimit: limit.toString(),
      origin: "*",
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      method: "GET",
      headers: {
        "User-Agent": "EasierStudying/1.0 (Educational App)",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia search failed with status ${response.status}`);
    }

    const data = await response.json() as {
      query?: {
        search?: Array<{
          title: string;
          snippet: string;
          pageid: number;
        }>;
      };
    };

    const searchResults = data.query?.search || [];

    // Fetch full extracts for each result
    const results = await Promise.all(
      searchResults.slice(0, limit).map(async (result) => {
        const extract = await fetchWikipediaExtract(result.title);
        return {
          title: result.title,
          extract: extract,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
          pageId: result.pageid,
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return [];
  }
}

/**
 * Fetch full extract from Wikipedia page
 */
export async function fetchWikipediaExtract(
  pageTitle: string
): Promise<string> {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      titles: pageTitle,
      prop: "extracts",
      explaintext: "true",
      exintro: "true",
      origin: "*",
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      method: "GET",
      headers: {
        "User-Agent": "EasierStudying/1.0 (Educational App)",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia extract failed with status ${response.status}`);
    }

    const data = await response.json() as {
      query?: {
        pages?: Record<string, {
          extract?: string;
          title?: string;
        }>;
      };
    };

    const pages = data.query?.pages || {};
    const pageContent = Object.values(pages)[0];

    return pageContent?.extract || "";
  } catch (error) {
    console.error("Wikipedia extract error:", error);
    return "";
  }
}

/**
 * Try primary API first, fall back to Wikipedia if it fails
 * Used for study content generation
 */
export async function fetchStudyContentWithFallback(
  query: string,
  primaryFetch: () => Promise<string>
): Promise<WikipediaFallbackResponse> {
  try {
    // Try primary source first
    const primaryData = await Promise.race([
      primaryFetch(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Primary API timeout")), 10000)
      ),
    ]);

    return {
      success: true,
      source: "primary",
      data: primaryData,
    };
  } catch (error) {
    console.warn("Primary API failed, falling back to Wikipedia:", error);

    try {
      const results = await searchWikipedia(query, 1);

      if (results.length === 0) {
        return {
          success: false,
          source: "wikipedia",
          data: "",
          error: "Wikipedia search returned no results",
        };
      }

      return {
        success: true,
        source: "wikipedia",
        data: `${results[0].title}\n\n${results[0].extract}`,
      };
    } catch (fallbackError) {
      return {
        success: false,
        source: "wikipedia",
        data: "",
        error: `Fallback failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
      };
    }
  }
}

/**
 * Get study recommendations from Wikipedia based on topic
 */
export async function getWikipediaStudyReferences(
  topic: string
): Promise<WikipediaSearchResult[]> {
  try {
    return await searchWikipedia(topic, 3);
  } catch (error) {
    console.error("Failed to get Wikipedia study references:", error);
    return [];
  }
}

/**
 * Check if primary API is available with a simple health check
 */
export async function checkApiAvailability(
  apiUrl: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(apiUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
