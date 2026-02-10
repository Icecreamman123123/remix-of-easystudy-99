import { searchWikipedia, fetchStudyContentWithFallback } from "./wikipedia-fallback";
import { lovableChatCompletion } from "./lovable-ai";

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
  | "elaborative-interrogation"
  | "create-cornell-notes";

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

export interface CornellNoteItem {
  cue: string;
  note: string;
}

export interface CornellNotesData {
  topic: string;
  mainIdeas: CornellNoteItem[];
  summary: string;
}

 const MODEL_MAP: Record<Exclude<AIModel, "wikipedia">, string> = {
   "gemini-flash-lite": "google/gemini-2.5-flash-lite",
   "gemini-flash": "google/gemini-3-flash-preview",
   "gemini-2.5-flash": "google/gemini-2.5-flash",
   "gemini-pro": "google/gemini-2.5-pro",
   "gemini-3-pro": "google/gemini-3-pro-preview",
   "gpt-5-nano": "openai/gpt-5-nano",
   "gpt-5-mini": "openai/gpt-5-mini",
   "gpt-5": "openai/gpt-5",
   "gpt-5.2": "openai/gpt-5.2",
 };

 function buildPrompts(params: {
   action: StudyAction;
   content?: string;
   topic?: string;
   difficulty?: string;
   gradeLevel?: string;
   expertise?: AIExpertise;
 }) {
   const { action, content, topic, difficulty, gradeLevel, expertise } = params;

   const grade = gradeLevel ? `Target grade level: ${gradeLevel}. ` : "";
   const diff = difficulty ? `Difficulty: ${difficulty}. ` : "";
   const exp = expertise ? `Expertise focus: ${expertise}. ` : "";

   const systemBase =
     `You are an expert tutor. ${grade}${diff}${exp}` +
     "Follow the user's topic/content. When asked for structured output, output only valid JSON.";

   const userBase = content?.trim()
     ? `CONTENT:\n${content.trim()}`
     : topic?.trim()
       ? `TOPIC: ${topic.trim()}`
       : "";

   switch (action) {
     case "generate-flashcards":
       return {
         system: systemBase + " Generate flashcards as a JSON array of objects with keys: question, answer, hint (optional).",
         user: `${userBase}\n\nCreate 10-20 flashcards.`,
       };
     case "generate-quiz":
       return {
         system: systemBase + " Generate a multiple choice quiz as JSON array with keys: question, options (string[]), correctAnswer (number index), explanation.",
         user: `${userBase}\n\nCreate 8-12 questions.`,
       };
     case "practice-problems":
       return {
         system: systemBase + " Generate practice problems as JSON array with keys: problem, solution, difficulty (easy|medium|hard), tip (optional).",
         user: `${userBase}\n\nCreate 6-10 problems.`,
       };
     case "worksheet":
       return {
         system: systemBase + " Generate a worksheet as JSON array with keys: id, type, question, options(optional), correctAnswer, explanation, points.",
         user: `${userBase}\n\nCreate 8-15 questions.`,
       };
     case "create-study-plan":
       return {
         system: systemBase + " Create a study plan as JSON array with keys: day, topic, activities (string[]), difficulty (number 1-10), timeMinutes (number), description.",
         user: `${userBase}\n\nCreate a 7-day plan.`,
       };
     case "create-cornell-notes":
       return {
         system: systemBase + " Create Cornell notes as a JSON object with keys: topic, mainIdeas (array of {cue,note}), summary.",
         user: `${userBase}\n\nCreate Cornell notes.`,
       };
     case "mind-map":
       return {
         system: systemBase + " Create a concise mind map in markdown bullet format.",
         user: `${userBase}\n\nCreate a mind map.`,
       };
     case "summarize":
       return {
         system: systemBase + " Summarize concisely.",
         user: `${userBase}\n\nSummarize.`,
       };
     case "explain-concept":
       return {
         system: systemBase + " Explain clearly with examples.",
         user: `${userBase}\n\nExplain the concept.`,
       };
     case "practice-test":
       return {
         system: systemBase + " Generate a practice test as markdown with answers at the end.",
         user: `${userBase}\n\nCreate a practice test.`,
       };
     case "generate-concepts":
       return {
         system: systemBase + " Extract key concepts as JSON array with keys: concept, definition, example(optional).",
         user: `${userBase}\n\nList 10-20 key concepts.`,
       };
     case "study-runner":
     case "matching-game":
     case "speed-challenge":
     case "elaborative-interrogation":
       return {
         system: systemBase + " Provide a helpful, structured response appropriate for the requested study activity.",
         user: `${userBase}\n\nGenerate the activity content for: ${action}.`,
       };
     default:
       return {
         system: systemBase,
         user: userBase || "Help me study.",
       };
   }
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
  if (model === "wikipedia" || includeWikipedia) {
    const query = (topic || content || "").trim();
    if (!query) {
      throw new Error("Wikipedia requires a topic or content");
    }
    const results = await searchWikipedia(query, 1);
    if (results.length === 0) {
      return "";
    }
    const top = results[0];
    return `# ${top.title}\n\n${top.extract}\n\n**Source:** Wikipedia\n${top.url}`;
  }

  const prompts = buildPrompts({ action, content, topic, difficulty, gradeLevel, expertise });
  const selectedModel = (model ? MODEL_MAP[model as Exclude<AIModel, "wikipedia">] : undefined) || MODEL_MAP["gemini-flash"];

  const result = await lovableChatCompletion(
    [
      { role: "system", content: prompts.system },
      { role: "user", content: prompts.user },
    ],
    { model: selectedModel }
  );

  return result;
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

