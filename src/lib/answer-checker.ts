 import { lovableChatCompletion } from "@/lib/lovable-ai";

export interface AnswerCheckResult {
  isCorrect: boolean;
  feedback: string;
  matchPercentage: number;
  fallback?: boolean;
}

// Local fuzzy matching for immediate feedback
export function localAnswerCheck(
  userAnswer: string,
  correctAnswer: string
): { isCorrect: boolean; matchRatio: number } {
  const normalizedUser = userAnswer.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/[^\w\s]/g, "");

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, matchRatio: 1 };
  }

  // Contains match
  if (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect)) {
    return { isCorrect: true, matchRatio: 0.9 };
  }

  // Word-based matching
  const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 2);
  const correctWords = normalizedCorrect.split(/\s+/).filter(w => w.length > 2);
  
  if (correctWords.length === 0) {
    return { isCorrect: normalizedUser.length > 0, matchRatio: 0.5 };
  }

  const matchedWords = userWords.filter((w) =>
    correctWords.some((cw) => cw.includes(w) || w.includes(cw))
  );
  const matchRatio = matchedWords.length / Math.max(correctWords.length, 1);

  return { isCorrect: matchRatio >= 0.6, matchRatio };
}

// AI-powered answer checking (async, for more accurate evaluation)
export async function checkAnswerWithAI(
  userAnswer: string,
  correctAnswer: string,
  question: string
): Promise<AnswerCheckResult> {
  try {
    const raw = await lovableChatCompletion(
      [
        {
          role: "system",
          content:
            "You are grading a student's answer. Return ONLY valid JSON with keys: isCorrect (boolean), feedback (string), matchPercentage (number 0-100).",
        },
        {
          role: "user",
          content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nStudent answer: ${userAnswer}`,
        },
      ],
      { model: "google/gemini-2.5-flash", temperature: 0.2, maxTokens: 512 }
    );

    const parsed = JSON.parse(raw);
    if (typeof parsed?.isCorrect === "boolean" && typeof parsed?.feedback === "string") {
      return {
        isCorrect: parsed.isCorrect,
        feedback: parsed.feedback,
        matchPercentage: Number.isFinite(parsed.matchPercentage) ? parsed.matchPercentage : 0,
      };
    }
    throw new Error("Invalid AI answer-check response");
  } catch (error) {
    console.error("AI answer check failed:", error);
    const local = localAnswerCheck(userAnswer, correctAnswer);
    return {
      isCorrect: local.isCorrect,
      feedback: local.isCorrect ? "Correct!" : "Not quite right.",
      matchPercentage: Math.round(local.matchRatio * 100),
      fallback: true,
    };
  }
}