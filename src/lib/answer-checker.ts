 import { lovableChatCompletion } from "./lovable-ai";

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
    const raw = await lovableChatCompletion([
      {
        role: "system",
        content:
          "You are grading a student's answer. Return ONLY valid JSON with keys: " +
          "isCorrect (boolean), feedback (string), matchPercentage (0-100 number).",
      },
      {
        role: "user",
        content:
          `QUESTION:\n${question}\n\nCORRECT ANSWER:\n${correctAnswer}\n\nSTUDENT ANSWER:\n${userAnswer}`,
      },
    ]);

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      if (
        typeof parsed?.isCorrect === "boolean" &&
        typeof parsed?.feedback === "string" &&
        typeof parsed?.matchPercentage === "number"
      ) {
        return {
          isCorrect: parsed.isCorrect,
          feedback: parsed.feedback,
          matchPercentage: Math.max(0, Math.min(100, Math.round(parsed.matchPercentage))),
        };
      }
    } catch {
      // fall through
    }

    const local = localAnswerCheck(userAnswer, correctAnswer);
    return {
      isCorrect: local.isCorrect,
      feedback: local.isCorrect ? "Correct!" : "Not quite right.",
      matchPercentage: Math.round(local.matchRatio * 100),
      fallback: true,
    };
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