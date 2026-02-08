import { callStudyAIWithFallback, parseFlashcards, parseQuiz } from "./study-api";
import type { Flashcard } from "./study-api";

export interface StudyTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  defaultTitle: string;
  action: "generate-flashcards" | "generate-quiz" | "create-study-plan";
  defaultCount?: number;
  difficulty?: string;
  gradeLevel?: string;
}

export const STUDY_TEMPLATES: StudyTemplate[] = [
  {
    id: "exam-revision",
    name: "Exam Revision — Flashcards",
    description: "Generate a focused set of flashcards emphasizing high-yield concepts for quick review.",
    preview: "High-yield questions covering core concepts",
    defaultTitle: "Exam Revision: {{topic}}",
    action: "generate-flashcards",
    defaultCount: 18,
    difficulty: "hard",
  },
  {
    id: "weekly-plan",
    name: "Weekly Study Plan",
    description: "Create a compact 7-day study plan as a set of study prompts you can follow each day.",
    preview: "Day-by-day plan with short daily activities",
    defaultTitle: "Weekly Study Plan: {{topic}}",
    action: "create-study-plan",
    defaultCount: 7,
    difficulty: "easy",
  },
  {
    id: "focused-test",
    name: "Focused Practice Test",
    description: "Generate a short practice test (multiple choice) targeting weak areas and convert each question to flashcards.",
    preview: "10 mixed-difficulty multiple-choice questions",
    defaultTitle: "Focused Practice Test: {{topic}}",
    action: "generate-quiz",
    defaultCount: 10,
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
): Promise<{ title: string; flashcards: Flashcard[] }> {
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

  if (template.action === "generate-quiz") {
    const ai = await callStudyAIWithFallback(
      "generate-quiz",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    const quiz = parseQuiz(ai.result);
    if (quiz.length > 0) {
      const flashcards = quiz.map((q) => ({
        question: `${q.question}\nOptions: ${q.options.join(" / ")}`,
        answer: `${q.options[q.correctAnswer]} — ${q.explanation}`,
        hint: "Practice by explaining why the correct option is best",
      }));
      return { title, flashcards };
    }

    return {
      title,
      flashcards: [
        { question: `Practice question about ${topic || "this topic"}`, answer: "Answer explanation...", hint: "Try eliminating wrong options" },
      ],
    };
  }

  // create-study-plan -> convert to multiple flashcards (one card per major section)
  if (template.action === "create-study-plan") {
    const ai = await callStudyAIWithFallback(
      "create-study-plan",
      undefined,
      topic,
      template.difficulty,
      gradeLevel
    );

    const text = ai.result || "";
    // Split into chunks by double newlines as a heuristic
    const chunks = text.split(/\n\s*\n/).filter(Boolean).slice(0, template.defaultCount || 7);
    const flashcards = chunks.map((chunk, i) => ({
      question: `Day ${i + 1}: What is the plan?`,
      answer: chunk.trim(),
      hint: "Follow the suggested activity for this day",
    }));

    if (flashcards.length > 0) return { title, flashcards };

    // Fallback
    return {
      title,
      flashcards: [
        { question: "Weekly study plan overview", answer: "1) Review core ideas 2) Practice problems 3) Self-test", hint: "Spread tasks over the week" },
      ],
    };
  }

  throw new Error("Unsupported template action");
}
