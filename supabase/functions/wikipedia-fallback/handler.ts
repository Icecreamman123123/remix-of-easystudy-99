/**
 * Wikipedia Fallback Handler for Supabase Functions
 * This module provides utilities for Supabase edge functions to fallback to Wikipedia
 */

export interface WikipediaFallbackOptions {
    timeout?: number;
    retries?: number;
}

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 1;

/**
 * Search Wikipedia from server-side code
 */
export async function searchWikipediaServer(
    query: string,
    limit: number = 1,
    options: WikipediaFallbackOptions = {}
): Promise<string[]> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    try {
        const params = new URLSearchParams({
            action: "query",
            format: "json",
            srsearch: query,
            srwhat: "text",
            srprop: "snippet",
            srlimit: limit.toString(),
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
            signal: controller.signal,
            headers: {
                "User-Agent": "EasierStudying/1.0 (Educational App)",
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Wikipedia API returned ${response.status}`);
        }

        const data = (await response.json()) as {
            query?: {
                search?: Array<{ title: string }>;
            };
        };
        const results = data.query?.search || [];
        return results.map((r) => r.title);
    } catch (error) {
        console.error("Wikipedia search failed:", error);
        return [];
    }
}

/**
 * Fetch Wikipedia extract for a specific page
 */
export async function fetchWikipediaExtractServer(
    pageTitle: string,
    options: WikipediaFallbackOptions = {}
): Promise<string> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    try {
        const params = new URLSearchParams({
            action: "query",
            format: "json",
            titles: pageTitle,
            prop: "extracts",
            explaintext: "true",
            exintro: "true",
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
            signal: controller.signal,
            headers: {
                "User-Agent": "EasierStudying/1.0 (Educational App)",
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Wikipedia API returned ${response.status}`);
        }

        const data = (await response.json()) as {
            query?: {
                pages?: Record<
                    string,
                    {
                        extract?: string;
                    }
                >;
            };
        };
        const pages = data.query?.pages || {};
        const pageContent = Object.values(pages)[0];

        return pageContent?.extract || "";
    } catch (error) {
        console.error("Wikipedia extract failed:", error);
        return "";
    }
}

/**
 * Try to fetch from Wikipedia with retry logic
 */
export async function tryWikipediaFallback(
    topic: string,
    options: WikipediaFallbackOptions = {}
): Promise<{
    success: boolean;
    content: string;
    source: string;
}> {
    const retries = options.retries || DEFAULT_RETRIES;

    for (let i = 0; i <= retries; i++) {
        try {
            const results = await searchWikipediaServer(topic, 1, options);

            if (results.length === 0) {
                continue;
            }

            const extract = await fetchWikipediaExtractServer(results[0], options);

            if (extract) {
                return {
                    success: true,
                    content: extract,
                    source: results[0],
                };
            }
        } catch (error) {
            console.warn(`Wikipedia fallback attempt ${i + 1} failed:`, error);

            if (i < retries) {
                // Wait a bit before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }

    return {
        success: false,
        content: "",
        source: "",
    };
}

/**
 * Format Wikipedia content for different action types
 */
export function formatWikipediaForAction(
    action: string,
    content: string,
    source: string,
    difficulty?: string
): string {
    const header = `# ${source}\n\n`;

    switch (action) {
        case "summarize":
            // Take first 300 characters for summary
            return header + content.substring(0, 300) + "...";

        case "explain-concept":
            return header + content;

        case "generate-flashcards":
            return JSON.stringify([
                {
                    question: `What is ${source}?`,
                    answer: content.substring(0, 200) + "...",
                    hint: "Information from Wikipedia",
                },
            ]);

        case "mind-map":
            return source + "\n- " + content.substring(0, 150) + "...";

        default:
            return header + content;
    }
}
