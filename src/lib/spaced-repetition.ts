/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm
 * 
 * Quality ratings:
 * 0 - Complete failure, no memory
 * 1 - Incorrect, but upon seeing the answer, remembered
 * 2 - Incorrect, but the correct answer seemed easy to recall
 * 3 - Correct with difficulty
 * 4 - Correct with some hesitation
 * 5 - Correct with no difficulty
 */

export interface CardReviewData {
  easeFactor: number; // EF >= 1.3
  interval: number; // days
  repetitions: number;
  nextReviewDate: Date;
}

export interface ReviewResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate the next review date based on SM-2 algorithm
 */
export function calculateNextReview(
  quality: number, // 0-5
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): ReviewResult {
  // Ensure quality is within bounds
  quality = Math.max(0, Math.min(5, Math.round(quality)));
  
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Calculate new ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor doesn't go below 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Convert a simple correct/incorrect to SM-2 quality rating
 */
export function booleanToQuality(correct: boolean, hesitation: 'none' | 'some' | 'much' = 'none'): number {
  if (!correct) {
    return hesitation === 'much' ? 0 : hesitation === 'some' ? 1 : 2;
  }
  return hesitation === 'much' ? 3 : hesitation === 'some' ? 4 : 5;
}

/**
 * Get cards due for review
 */
export function isDueForReview(nextReviewAt: Date | string | null): boolean {
  if (!nextReviewAt) return true;
  const reviewDate = typeof nextReviewAt === 'string' ? new Date(nextReviewAt) : nextReviewAt;
  return reviewDate <= new Date();
}

/**
 * Priority sort for cards - due cards first, then by how overdue they are
 */
export function sortByReviewPriority<T extends { next_review_at: string | null }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const dateA = a.next_review_at ? new Date(a.next_review_at) : new Date(0);
    const dateB = b.next_review_at ? new Date(b.next_review_at) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Get human-readable time until next review
 */
export function getTimeUntilReview(nextReviewAt: Date | string | null): string {
  if (!nextReviewAt) return 'Ready to review';
  
  const reviewDate = typeof nextReviewAt === 'string' ? new Date(nextReviewAt) : nextReviewAt;
  const now = new Date();
  const diff = reviewDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ready to review';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
  return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
}
