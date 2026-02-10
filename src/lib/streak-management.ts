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
  try {
    const stored = (getSessions() as any[]) || [];
    const dayKeys = stored
      .map((s) => (s.completedAt || s.completed_at || "").split("T")[0])
      .filter(Boolean);

    if (dayKeys.length === 0) return null;

    const days = new Set(dayKeys);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (days.has(key)) current++;
      else {
        if (i === 0) continue;
        break;
      }
    }

    const last_study_date = dayKeys.sort().at(-1) || null;
    const now = new Date().toISOString();

    return {
      id: `local_${userId}`,
      user_id: userId,
      current_streak: current,
      longest_streak: current,
      last_study_date,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.error("Error fetching user streak:", error);
    return null;
  }
}

/**
 * Initialize streak for new user
 */
export async function initializeUserStreak(userId: string): Promise<DailyStreak | null> {
  const now = new Date().toISOString();
  return {
    id: `local_${userId}`,
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_study_date: null,
    created_at: now,
    updated_at: now,
  };
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
