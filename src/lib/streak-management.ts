/**
 * Daily Streak Management
 * Handles user study streaks and milestone tracking
 */
import { getSessions } from "@/lib/storage-simple";

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  daysActive: number;
  lastStudyDate: Date | null;
}

/**
 * Get user's current streak information
 */
export async function getUserStreak(userId: string): Promise<DailyStreak | null> {
  void userId;

  const sessions = getSessions();
  const days = new Set(
    sessions
      .map((s) => s.completedAt)
      .filter(Boolean)
      .map((d) => new Date(d).toISOString().slice(0, 10))
  );

  const sortedDays = Array.from(days).sort();
  if (sortedDays.length === 0) return null;

  let current = 1;
  let longest = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const next = new Date(sortedDays[i]);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  const last = sortedDays[sortedDays.length - 1];
  const today = new Date().toISOString().slice(0, 10);
  const studiedToday = last === today;

  const streak: DailyStreak = {
    id: `streak_local`,
    user_id: "local",
    current_streak: studiedToday ? current : 0,
    longest_streak: longest,
    last_study_date: last,
    created_at: new Date(sortedDays[0]).toISOString(),
    updated_at: new Date().toISOString(),
  };

  return streak;
}

/**
 * Initialize streak for new user
 */
export async function initializeUserStreak(userId: string): Promise<DailyStreak | null> {
  void userId;
  return getUserStreak("local");
}

/**
 * Get formatted streak statistics
 */
export async function getStreakStats(userId: string): Promise<StreakStats> {
  const streak = await getUserStreak(userId);

  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    daysActive: Math.max(0, ((streak?.longest_streak || 0) * 1)),
    lastStudyDate: streak?.last_study_date ? new Date(streak.last_study_date) : null,
  };
}

/**
 * Check if user studied today
 */
export async function getStreakStatus(userId: string): Promise<{
  studiedToday: boolean;
  studying: boolean;
  currentStreak: number;
}> {
  const streak = await getUserStreak(userId);

  if (!streak) {
    return {
      studiedToday: false,
      studying: false,
      currentStreak: 0,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const studiedToday = streak.last_study_date === today;

  return {
    studiedToday,
    studying: studiedToday,
    currentStreak: streak.current_streak || 0,
  };
}

/**
 * Calculate days until streak resets (if user hasn't studied today)
 */
export function getDaysUntilStreakReset(lastStudyDate: Date | null): number {
  if (!lastStudyDate) return 0;

  const now = new Date();
  const lastDate = new Date(lastStudyDate);

  // Reset happens at midnight the next day after last study
  const nextReset = new Date(lastDate);
  nextReset.setDate(nextReset.getDate() + 2); // 2 days after last study
  nextReset.setHours(0, 0, 0, 0);

  const hoursUntilReset = (nextReset.getTime() - now.getTime()) / (1000 * 60 * 60);
  return Math.ceil(Math.max(0, hoursUntilReset / 24));
}

/**
 * Get streak milestone messages
 */
export function getStreakMilestoneMessage(streakDays: number): string {
  if (streakDays === 0) return "Start your study streak!";
  if (streakDays === 1) return "🔥 You just started! Keep it going!";
  if (streakDays === 7) return "🎯 Week Warrior! 7 days of studying!";
  if (streakDays === 14) return "⚡ Two weeks strong!";
  if (streakDays === 30) return "⭐ Month Master! 30-day streak!";
  if (streakDays === 60) return "👏 Two months! You're committed!";
  if (streakDays === 100) return "👑 Century Champion! 100 days!";
  if (streakDays % 10 === 0) return `🚀 ${streakDays} days! Keep going!`;
  return `🔥 ${streakDays}-day streak!`;
}
