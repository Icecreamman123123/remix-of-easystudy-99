import { supabase } from "@/integrations/supabase/client";
import { searchWikipedia, fetchStudyContentWithFallback } from "./wikipedia-fallback";

export type StudyAction =
  | "generate-flashcards"
  | "explain-concept"
  | "create-study-plan"
  | "cheat-sheet"
  | "practice-problems"
  | "practice-test"
  | "mind-map"
  | "study-runner"
  | "worksheet"
  | "generate-concepts"
  | "matching-game"
  | "speed-challenge"
  | "elaborative-interrogation"
  | "create-cornell-notes"
  | "vocabulary-cards"
  | "presenter-slides";

export type AIModel =
  | "gemini-flash"
  | "gemini-pro"
  | "wikipedia"; // Use Wikipedia API as source content

export type AIExpertise =
  | "general"
  | "math"
  | "science"
  | "language"
  | "history"
  | "code"
  | "medicine"
  | "business"
  | "music"
  | "psychology"
  | "law";

export interface Flashcard {
  question: string;
  answer: string;
  hint?: string;
}

export interface Concept {
  concept: string;
  definition: string;
  example?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface PracticeProblem {
  problem: string;
  solution: string;
  difficulty: "easy" | "medium" | "hard";
  tip?: string;
}

export interface WorksheetQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "short-answer" | "matching";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface CornellNoteItem {
  cue: string;
  note: string;
}

export interface CornellNotesData {
  topic: string;
  mainIdeas: CornellNoteItem[];
  summary: string;
}

export async function callStudyAI(
  action: StudyAction,
  content?: string,
  topic?: string,
  difficulty?: string,
  gradeLevel?: string,
  model?: AIModel,
  expertise?: AIExpertise,
  includeWikipedia?: boolean,
  language?: string,
  adaptiveDifficulty?: number
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("study-ai", {
    body: { action, content, topic, difficulty, gradeLevel, model, expertise, includeWikipedia, language, adaptiveDifficulty },
  });

  if (error) {
    throw new Error(error.message || "Failed to call study AI");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

export function parseFlashcards(response: string): Flashcard[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate each flashcard has required properties
      const valid = parsed.filter((item: unknown): item is Flashcard => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.question === 'string' &&
          typeof obj.answer === 'string' &&
          obj.question.trim().length > 0 &&
          obj.answer.trim().length > 0;
      });
      if (valid.length < parsed.length) {
        console.warn(`parseFlashcards: Filtered out ${parsed.length - valid.length} invalid flashcards`);
      }
      return valid;
    }
    return [];
  } catch (e) {
    console.error('parseFlashcards: Failed to parse response', e);
    return [];
  }
}

export function parseConcepts(response: string): Concept[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate each concept has required properties
      const valid = parsed.filter((item: unknown): item is Concept => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.concept === 'string' &&
          typeof obj.definition === 'string' &&
          obj.concept.trim().length > 0 &&
          obj.definition.trim().length > 0;
      });
      if (valid.length < parsed.length) {
        console.warn(`parseConcepts: Filtered out ${parsed.length - valid.length} invalid concepts`);
      }
      return valid;
    }
    return [];
  } catch (e) {
    console.error('parseConcepts: Failed to parse response', e);
    return [];
  }
}

export function parseQuiz(response: string): QuizQuestion[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate each quiz question has required properties
      const valid = parsed.filter((item: unknown): item is QuizQuestion => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.question === 'string' &&
          Array.isArray(obj.options) &&
          obj.options.length >= 2 &&
          typeof obj.correctAnswer === 'number' &&
          obj.correctAnswer >= 0 &&
          obj.correctAnswer < obj.options.length;
      });
      if (valid.length < parsed.length) {
        console.warn(`parseQuiz: Filtered out ${parsed.length - valid.length} invalid questions`);
      }
      return valid;
    }
    return [];
  } catch (e) {
    console.error('parseQuiz: Failed to parse response', e);
    return [];
  }
}

export function parsePracticeProblems(response: string): PracticeProblem[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate each problem has required properties
      const valid = parsed.filter((item: unknown): item is PracticeProblem => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.problem === 'string' &&
          typeof obj.solution === 'string' &&
          obj.problem.trim().length > 0 &&
          obj.solution.trim().length > 0;
      });
      if (valid.length < parsed.length) {
        console.warn(`parsePracticeProblems: Filtered out ${parsed.length - valid.length} invalid problems`);
      }
      return valid;
    }
    return [];
  } catch (e) {
    console.error('parsePracticeProblems: Failed to parse response', e);
    return [];
  }
}

export function parseWorksheet(response: string): WorksheetQuestion[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      // Ensure each question has an id
      return questions.map((q: WorksheetQuestion, i: number) => ({
        ...q,
        id: q.id || `q-${i + 1}`,
        points: q.points || 1
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function parseCornellNotes(response: string): CornellNotesData | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/); // Match the outer JSON object
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (
        typeof parsed.topic === "string" && // Make topic optional check if needed, but safe to check
        Array.isArray(parsed.mainIdeas) &&
        typeof parsed.summary === "string"
      ) {
        return parsed as CornellNotesData;
      }
    }
    return null;
  } catch (e) {
    console.error("parseCornellNotes: Failed to parse response", e);
    return null;
  }
}
export interface StudyPlanItem {
  day: number;
  topic: string;
  activities: string[];
  difficulty: number;
  timeMinutes: number;
  description: string;
}

export function parseStudyPlan(response: string): StudyPlanItem[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any) => ({
        day: item.day || 1,
        topic: item.topic || "Study Session",
        activities: Array.isArray(item.activities) ? item.activities : [],
        difficulty: item.difficulty || 5,
        timeMinutes: item.timeMinutes || 30,
        description: item.description || ""
      }));
    }
    return [];
  } catch (e) {
    console.error('parseStudyPlan: Failed to parse response', e);
    return [];
  }
}

/**
 * Call Study AI with Wikipedia fallback support
 * Falls back to Wikipedia if the primary API is unavailable
 */
export async function callStudyAIWithFallback(
  action: StudyAction,
  content?: string,
  topic?: string,
  difficulty?: string,
  gradeLevel?: string,
  model?: AIModel,
  expertise?: AIExpertise,
  language: string = "en"
): Promise<{ result: string; fallback: boolean; source: "primary" | "wikipedia" | "error" }> {
  try {
    // Try primary API
    const result = await callStudyAI(action, content, topic, difficulty, gradeLevel, model, expertise, undefined, language);
    return { result, fallback: false, source: "primary" };
  } catch (error) {
    console.warn("Primary study AI failed, attempting Wikipedia fallback:", error);

    // For certain actions, attempt Wikipedia fallback
    const fallbackTopic = topic || content || "";

    if (!fallbackTopic) {
      return {
        result: "",
        fallback: true,
        source: "error"
      };
    }

    try {
      const wikiResults = await searchWikipedia(fallbackTopic, 1);

      if (wikiResults.length === 0) {
        return {
          result: "",
          fallback: true,
          source: "error"
        };
      }

      // Format Wikipedia data based on action type
      const formattedResult = formatWikipediaContentForAction(
        action,
        wikiResults[0],
        difficulty,
        gradeLevel,
        language
      );

      return { result: formattedResult, fallback: true, source: "wikipedia" };
    } catch (fallbackError) {
      console.error("Wikipedia fallback also failed:", fallbackError);
      return {
        result: "",
        fallback: true,
        source: "error"
      };
    }
  }
}

/**
 * Format Wikipedia content based on study action type
 */
function formatWikipediaContentForAction(
  action: StudyAction,
  wikiResult: Awaited<ReturnType<typeof searchWikipedia>>[0],
  difficulty?: string,
  gradeLevel?: string,
  language: string = "en"
): string {
  const baseContent = `# ${wikiResult.title}\n\n${wikiResult.extract}\n\n**Source:** Wikipedia\n**Learn more:** ${wikiResult.url}`;

  const translations: Record<string, any> = {
    "en": {
      q: `What is ${wikiResult.title}?`,
      h: "See the Wikipedia article",
      m: `${wikiResult.title}\n- Definition: ${wikiResult.extract.substring(0, 100)}...`
    },
    "zh": {
      q: `${wikiResult.title}是什么？`,
      h: "查看维基百科文章",
      m: `${wikiResult.title}\n- 定义: ${wikiResult.extract.substring(0, 100)}...`
    },
    "fr": {
      q: `Qu'est-ce que ${wikiResult.title} ?`,
      h: "Voir l'article Wikipédia",
      m: `${wikiResult.title}\n- Définition : ${wikiResult.extract.substring(0, 100)}...`
    },
    "es": {
      q: `¿Qué es ${wikiResult.title}?`,
      h: "Ver el artículo de Wikipedia",
      m: `${wikiResult.title}\n- Definición: ${wikiResult.extract.substring(0, 100)}...`
    },
    "hi": {
      q: `${wikiResult.title} क्या है?`,
      h: "विकिपीडिया लेख देखें",
      m: `${wikiResult.title}\n- परिभाषा: ${wikiResult.extract.substring(0, 100)}...`
    }
  };

  const t = translations[language] || translations["en"];

  switch (action) {
    case "generate-flashcards":
      return `[{"question": "${t.q}", "answer": "${wikiResult.extract.substring(0, 200)}...", "hint": "${t.h}"}]`;

    case "explain-concept":
      return baseContent;

    case "cheat-sheet":
      return `${wikiResult.title}\n\n${wikiResult.extract.substring(0, 300)}...`;

    case "mind-map":
      return t.m;

    default:
      return baseContent;
  }
}

