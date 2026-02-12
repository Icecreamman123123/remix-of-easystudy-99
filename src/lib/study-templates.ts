import { callStudyAIWithFallback, parseFlashcards } from "./study-api";
import type { Flashcard } from "./study-api";

export interface StudyTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  defaultTitle: string;
  action: "generate-flashcards" | "cheat-sheet" | "create-study-plan" | "create-cornell-notes";
  defaultCount?: number;
  difficulty?: string;
  gradeLevel?: string;
}

export const STUDY_TEMPLATES: StudyTemplate[] = [
  // === FLASHCARD TEMPLATES ===
  {
    id: "exam-revision",
    name: "🎯 Exam Revision",
    description: "High-yield flashcards emphasizing core concepts for quick exam review.",
    preview: "Focused on frequently tested material",
    defaultTitle: "Exam Revision: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 20,
    difficulty: "hard",
  },
  {
    id: "vocabulary-builder",
    name: "📚 Vocabulary Builder",
    description: "Learn key terms and definitions with context and examples.",
    preview: "Term → Definition with usage examples",
    defaultTitle: "Vocabulary: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 15,
    difficulty: "medium",
  },
  {
    id: "concept-deep-dive",
    name: "🔬 Concept Deep Dive",
    description: "Explore concepts in depth with detailed explanations and connections.",
    preview: "Why and how questions for deeper understanding",
    defaultTitle: "Deep Dive: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 12,
    difficulty: "hard",
  },
  {
    id: "quick-review",
    name: "⚡ Quick Review",
    description: "Short, simple cards for rapid review before class or tests.",
    preview: "Brief Q&A pairs for fast recall",
    defaultTitle: "Quick Review: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 10,
    difficulty: "easy",
  },
  {
    id: "case-study",
    name: "📋 Case Study Analysis",
    description: "Real-world scenarios and case-based learning questions.",
    preview: "Apply concepts to practical situations",
    defaultTitle: "Case Studies: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 8,
    difficulty: "hard",
  },
  {
    id: "compare-contrast",
    name: "⚖️ Compare & Contrast",
    description: "Cards that compare similar concepts to avoid confusion.",
    preview: "A vs B format to clarify differences",
    defaultTitle: "Comparisons: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 10,
    difficulty: "medium",
  },
  {
    id: "timeline-events",
    name: "📅 Timeline & Events",
    description: "Chronological events, dates, and historical sequences.",
    preview: "When did X happen? What came next?",
    defaultTitle: "Timeline: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 15,
    difficulty: "medium",
  },
  {
    id: "formulas-equations",
    name: "🔢 Formulas & Equations",
    description: "Math and science formulas with application examples.",
    preview: "Formula cards with when/how to use",
    defaultTitle: "Formulas: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 12,
    difficulty: "medium",
  },
  {
    id: "real-world-application",
    name: "🌍 Real-World Application",
    description: "How concepts apply to everyday life and careers.",
    preview: "Practical uses and examples",
    defaultTitle: "Applications: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 10,
    difficulty: "medium",
  },

  // === QUIZ TEMPLATES ===
  {
    id: "focused-test",
    name: "📝 Practice Test",
    description: "Mixed-difficulty multiple choice questions converted to study cards.",
    preview: "10 questions with explanations",
    defaultTitle: "Practice Test: {{topic}}",
    action: "generate-quiz",
    defaultCount: 10,
    difficulty: "medium",
  },
  {
    id: "challenge-quiz",
    name: "🏆 Challenge Quiz",
    description: "Difficult questions to test advanced understanding.",
    preview: "Expert-level multiple choice",
    defaultTitle: "Challenge: {{topic}}",
    action: "generate-quiz",
    defaultCount: 8,
    difficulty: "hard",
  },

  // === STUDY PLAN TEMPLATES ===
  {
    id: "weekly-plan",
    name: "📆 Weekly Study Plan",
    description: "7-day structured study schedule with daily activities.",
    preview: "Day-by-day plan for the week",
    defaultTitle: "Weekly Plan: {{topic}}",
    action: "create-study-plan",
    defaultCount: 7,
    difficulty: "medium",
  },
  {
    id: "cramming-session",
    name: "🚀 Last-Minute Cram",
    description: "Intensive 3-day plan for urgent exam preparation.",
    preview: "High-intensity review strategy",
    defaultTitle: "Cram Session: {{topic}}",
    action: "create-study-plan",
    defaultCount: 3,
    difficulty: "hard",
  },
  {
    id: "monthly-mastery",
    name: "📈 Monthly Mastery",
    description: "Long-term 4-week plan for thorough topic mastery.",
    preview: "Week-by-week deep learning",
    defaultTitle: "Monthly Plan: {{topic}}",
    action: "create-study-plan",
    defaultCount: 4,
    difficulty: "medium",
  },
  // === CORNELL NOTES TEMPLATE ===
  {
    id: "cornell-notes",
    name: "📝 Cornell Notes",
    description: "Structured notes with cues, main points, and summary method.",
    preview: "Cues | Notes | Summary layout",
    defaultTitle: "Cornell Notes: {{topic}}",
    action: "create-cornell-notes",
    defaultCount: 1, // One document
    difficulty: "medium",
  },
];

/**
 * Generate flashcards for a template. Returns title and flashcard list.
 */
export async function generateTemplateDeck(
  templateId: string,
  topic?: string,
  gradeLevel?: string
): Promise<{ title: string; flashcards: Flashcard[]; rawResult?: string }> {
  const template = STUDY_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error("Unknown template");

  const title = template.defaultTitle.replace("{{topic}}", topic || "Untitled");

  // Use Study AI with fallback where possible
  if (template.action === "generate-flashcards") {
    const ai = await callStudyAIWithFallback(
      "generate-flashcards",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    const cards = parseFlashcards(ai.result);
    if (cards.length > 0) return { title, flashcards: cards };

    // Fallback minimal cards if AI fails
    return {
      title,
      flashcards: [
        { question: `What is ${topic || "this topic"}?`, answer: "Summary of topic...", hint: "See summary" },
        { question: `List one key concept of ${topic || "this topic"}.`, answer: "A key concept is...", hint: "Think of the main idea" },
      ],
    };
  }

  if (template.action === "cheat-sheet") {
    const ai = await callStudyAIWithFallback(
      "cheat-sheet",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    return { title, flashcards: [], rawResult: ai.result };
  }

  // create-study-plan -> convert to multiple flashcards (one card per major section)
  if (template.action === "create-study-plan") {
    // Check if we have a saved plan in the payload (from "Save Plan to Templates")
    const payload = (template as any).payload;
    if (payload && payload.plan && Array.isArray(payload.plan)) {
      // We have a strict JSON plan, let's return it as the raw result
      // The ResultsViewer will parse it using parseStudyPlan
      return {
        title,
        flashcards: [], // Not used for study plan
        rawResult: JSON.stringify(payload.plan)
      };
    }

    const ai = await callStudyAIWithFallback(
      "create-study-plan",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    const text = ai.result || "";

    // For study plans, we return the raw text/JSON to be parsed by results viewer
    // We only create flashcards as a fallback or for other views
    return { title, flashcards: [], rawResult: text };
  }

  if (template.action === "create-cornell-notes") {
    const ai = await callStudyAIWithFallback(
      "create-cornell-notes",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    return { title, flashcards: [], rawResult: ai.result };
  }

  throw new Error("Unsupported template action");
}
