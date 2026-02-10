/**
 * React Hook for managing streaks and achievement notifications
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth-simple";
import { useToast } from "./use-toast";
import { getSessions } from "@/lib/storage-simple";

export function useStreakAndAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [streakLoading, setStreakLoading] = useState(true);
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    longestStreak: number;
    studiedToday: boolean;
    daysUntilReset?: number;
  } | null>(null);

  const [achievementLoading, setAchievementLoading] = useState(true);
  const [achievements, setAchievements] = useState<{
    earned: any[];
    progress: any;
    nextMilestones: any[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStreakData = async () => {
      setStreakLoading(true);
      try {
        const stored = (getSessions() as any[]) || [];
        const days = new Set(stored.map((s) => (s.completedAt || s.completed_at || "").split("T")[0]).filter(Boolean));
        const todayKey = new Date().toISOString().split("T")[0];
        const studiedToday = days.has(todayKey);

        let currentStreak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          if (days.has(key)) currentStreak++;
          else {
            if (i === 0) continue;
            break;
          }
        }

        // Approximate longest streak from history (simple: current streak as longest)
        const longestStreak = currentStreak;
        setStreakData({ currentStreak, longestStreak, studiedToday });
      } catch (error) {
        console.error("Error fetching streak data:", error);
        // Set default data on error so UI doesn't stick on loading
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          studiedToday: false,
        });
      } finally {
        setStreakLoading(false);
      }
    };

    const fetchAchievements = async () => {
      setAchievementLoading(true);
      try {
        setAchievements({
          earned: [],
          progress: {
            completedCount: 0,
            totalCount: 0,
            percentComplete: 0,
            categories: {
              streak: { completed: 0, total: 0 },
              cards: { completed: 0, total: 0 },
              accuracy: { completed: 0, total: 0 },
              social: { completed: 0, total: 0 },
            },
          },
          nextMilestones: [],
        });
      } catch (error) {
        console.error("Error fetching achievements:", error);
        // Set default data on error
        setAchievements({
          earned: [],
          progress: {
            completedCount: 0,
            totalCount: 0,
            percentComplete: 0,
            categories: {
              streak: { completed: 0, total: 0 },
              cards: { completed: 0, total: 0 },
              accuracy: { completed: 0, total: 0 },
              social: { completed: 0, total: 0 }
            }
          },
          nextMilestones: [],
        });
      } finally {
        setAchievementLoading(false);
      }
    };

    // Fetch both on mount and every 5 minutes
    fetchStreakData();
    fetchAchievements();

    const streakInterval = setInterval(fetchStreakData, 5 * 60 * 1000);
    const achievementInterval = setInterval(fetchAchievements, 5 * 60 * 1000);

    return () => {
      clearInterval(streakInterval);
      clearInterval(achievementInterval);
    };
  }, [user, toast]);

  return {
    streakLoading,
    streakData,
    achievementLoading,
    achievements,
    refetch: async () => {
      if (!user) return;
      setStreakLoading(true);
      setAchievementLoading(true);

      try {
        setStreakData({ currentStreak: 0, longestStreak: 0, studiedToday: false });
        setAchievements({
          earned: [],
          progress: {
            completedCount: 0,
            totalCount: 0,
            percentComplete: 0,
            categories: {
              streak: { completed: 0, total: 0 },
              cards: { completed: 0, total: 0 },
              accuracy: { completed: 0, total: 0 },
              social: { completed: 0, total: 0 },
            },
          },
          nextMilestones: [],
        });
      } catch (error) {
        console.error("Error refetching data:", error);
      } finally {
        setStreakLoading(false);
        setAchievementLoading(false);
      }
    },
  };
}
