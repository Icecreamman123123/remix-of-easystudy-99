import { supabase } from "@/integrations/supabase/client";

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
   | "speed-challenge";

export type AIModel =
  | "gemini-flash"
  | "gemini-pro"
  | "gemini-3-pro"
  | "gemini-2.5-flash"
  | "gemini-flash-lite"
  | "gpt-5-nano"
  | "gpt-5-mini"
  | "gpt-5"
  | "gpt-5.2";

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
  expertise?: AIExpertise
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("study-ai", {
    body: { action, content, topic, difficulty, gradeLevel, model, expertise },
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
