/**
 * Wikipedia Fallback Handler for Supabase Functions
 * This module provides utilities for Supabase edge functions to fallback to Wikipedia
 */

export interface WikipediaFallbackOptions {
    timeout?: number;
    retries?: number;
}

const getWikipediaApi = (lang: string = "en") => `https://${lang}.wikipedia.org/w/api.php`;
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 1;

/**
 * Search Wikipedia from server-side code
 */
export async function searchWikipediaServer(
    query: string,
    limit: number = 1,
    options: WikipediaFallbackOptions & { language?: string } = {}
): Promise<string[]> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const wikipediaApi = getWikipediaApi(options.language);

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

        const response = await fetch(`${wikipediaApi}?${params}`, {
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
    options: WikipediaFallbackOptions & { language?: string } = {}
): Promise<string> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const wikipediaApi = getWikipediaApi(options.language);

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

        const response = await fetch(`${wikipediaApi}?${params}`, {
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
    options: WikipediaFallbackOptions & { language?: string } = {}
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
    difficulty?: string,
    language: string = "en"
): string {
    const header = `# ${source}\n\n`;

    const translations: Record<string, any> = {
        "en": {
            question: `What is ${source}?`,
            hint: "Information from Wikipedia",
            concept_def: "Information sourced from Wikipedia.",
            ws_question: `Based on Wikipedia, what are the key aspects of ${source}?`,
            ws_explanation: "This information comes from the Wikipedia introduction.",
            sp_activities: ["Read full Wikipedia article", "Identify key subtopics"],
            sp_description: "Initial overview of the topic using Wikipedia content.",
            cn_cue: "What is it?",
            cn_summary: `Overview of ${source} from Wikipedia.`
        },
        "zh": {
            question: `${source}是什么？`,
            hint: "来自维基百科的信息",
            concept_def: "信息源自维基百科。",
            ws_question: `根据维基百科，${source}的关键方面是什么？`,
            ws_explanation: "此信息来自维基百科简介。",
            sp_activities: ["阅读完整的维基百科文章", "确定关键子主题"],
            sp_description: "使用维基百科内容对该主题进行初步概述。",
            cn_cue: "它是什么？",
            cn_summary: `来自维基百科的${source}概述。`
        },
        "fr": {
            question: `Qu'est-ce que ${source} ?`,
            hint: "Informations de Wikipédia",
            concept_def: "Informations provenant de Wikipédia.",
            ws_question: `Selon Wikipédia, quels sont les aspects clés de ${source} ?`,
            ws_explanation: "Ces informations proviennent de l'introduction de Wikipédia.",
            sp_activities: ["Lire l'article complet sur Wikipédia", "Identifier les sous-thèmes clés"],
            sp_description: "Aperçu initial du sujet à l'aide du contenu de Wikipédia.",
            cn_cue: "Qu'est-ce que c'est ?",
            cn_summary: `Aperçu de ${source} à partir de Wikipédia.`
        },
        "es": {
            question: `¿Qué es ${source}?`,
            hint: "Información de Wikipedia",
            concept_def: "Información extraída de Wikipedia.",
            ws_question: `Según Wikipedia, ¿cuáles son los aspectos clave de ${source}?`,
            ws_explanation: "Esta información proviene de la introducción de Wikipedia.",
            sp_activities: ["Leer el artículo completo de Wikipedia", "Identificar subtemas clave"],
            sp_description: "Resumen inicial del tema utilizando contenido de Wikipedia.",
            cn_cue: "¿Qué es?",
            cn_summary: `Resumen de ${source} de Wikipedia.`
        },
        "hi": {
            question: `${source} क्या है?`,
            hint: "विकिपीडिया से जानकारी",
            concept_def: "जानकारी विकिपीडिया से ली गई है।",
            ws_question: `विकिपीडिया के अनुसार, ${source} के प्रमुख पहलू क्या हैं?`,
            ws_explanation: "यह जानकारी विकिपीडिया प्रस्तावना से आती है।",
            sp_activities: ["पूरा विकिपीडिया लेख पढ़ें", "प्रमुख उप-विषयों की पहचान करें"],
            sp_description: "विकिपीडिया सामग्री का उपयोग करके विषय का प्रारंभिक अवलोकन।",
            cn_cue: "यह क्या है?",
            cn_summary: `विकिपीडिया से ${source} का अवलोकन।`
        }
    };

    const lang = language || "en";
    const t = translations[lang] || translations["en"];

    switch (action) {
        case "summarize":
            return header + content.substring(0, 300) + "...";

        case "explain-concept":
            return header + content;

        case "generate-flashcards":
        case "vocabulary-cards":
            return JSON.stringify([
                {
                    question: t.question,
                    answer: content.substring(0, 200) + "...",
                    hint: t.hint,
                },
            ]);

        case "generate-concepts":
            return JSON.stringify([
                {
                    concept: source,
                    definition: content.substring(0, 300) + "...",
                    example: t.concept_def
                }
            ]);

        case "worksheet":
        case "practice-problems":
            return JSON.stringify([
                {
                    id: "q1",
                    type: "short-answer",
                    question: t.ws_question,
                    correctAnswer: content.substring(0, 200) + "...",
                    explanation: t.ws_explanation,
                    points: 5
                }
            ]);

        case "create-study-plan":
            return JSON.stringify([
                {
                    day: 1,
                    topic: source,
                    activities: t.sp_activities,
                    difficulty: 3,
                    timeMinutes: 30,
                    description: t.sp_description
                }
            ]);

        case "mind-map":
            return source + "\n- " + content.substring(0, 150) + "...";

        case "create-cornell-notes":
            return JSON.stringify({
                topic: source,
                mainIdeas: [
                    { cue: t.cn_cue, note: content.substring(0, 300) + "..." }
                ],
                summary: t.cn_summary
            });

        default:
            return header + content;
    }
}
