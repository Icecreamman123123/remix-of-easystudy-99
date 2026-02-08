import { supabase } from "@/integrations/supabase/client";
import { searchWikipedia, fetchStudyContentWithFallback } from "./wikipedia-fallback";

export type StudyAction = 
  | "generate-flashcards"
  | "generate-quiz"
  | "explain-concept"
  | "create-study-plan"
  | "summarize"
  | "practice-problems"
  | "practice-test"
  | "mind-map"
  | "study-runner"
  | "worksheet"
  | "generate-concepts"
   | "matching-game"
   | "speed-challenge"
   | "elaborative-interrogation";

export type AIModel =
  | "gemini-flash"
  | "gemini-pro"
  | "gemini-3-pro"
  | "gemini-2.5-flash"
  | "gemini-flash-lite"
  | "gpt-5-nano"
  | "gpt-5-mini"
  | "gpt-5"
  | "gpt-5.2"
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

export async function callStudyAI(
  action: StudyAction,
  content?: string,
  topic?: string,
  difficulty?: string,
  gradeLevel?: string,
  model?: AIModel,
  expertise?: AIExpertise,
  includeWikipedia?: boolean
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("study-ai", {
    body: { action, content, topic, difficulty, gradeLevel, model, expertise, includeWikipedia },
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
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

export function parseConcepts(response: string): Concept[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

export function parseQuiz(response: string): QuizQuestion[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

export function parsePracticeProblems(response: string): PracticeProblem[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
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
  expertise?: AIExpertise
): Promise<{ result: string; fallback: boolean; source: "primary" | "wikipedia" | "error" }> {
  try {
    // Try primary API
    const result = await callStudyAI(action, content, topic, difficulty, gradeLevel, model, expertise);
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
        gradeLevel
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
  gradeLevel?: string
): string {
  const baseContent = `# ${wikiResult.title}\n\n${wikiResult.extract}\n\n**Source:** Wikipedia\n**Learn more:** ${wikiResult.url}`;

  switch (action) {
    case "generate-flashcards":
      return `[{"question": "What is ${wikiResult.title}?", "answer": "${wikiResult.extract.substring(0, 200)}...", "hint": "See the Wikipedia article"}]`;
    
    case "explain-concept":
      return baseContent;
    
    case "summarize":
      return `${wikiResult.title}\n\n${wikiResult.extract.substring(0, 300)}...`;
    
    case "mind-map":
      return `${wikiResult.title}\n- Definition: ${wikiResult.extract.substring(0, 100)}...`;
    
    default:
      return baseContent;
  }
}

