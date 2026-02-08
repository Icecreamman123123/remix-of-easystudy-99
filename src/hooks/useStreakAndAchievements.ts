/**
 * React Hook for managing streaks and achievement notifications
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { getUserStreak, getStreakStatus, getDaysUntilStreakReset } from "@/lib/streak-management";
import { getUserAchievements, getAchievementProgress, getNextMilestones } from "@/lib/achievement-system";
import { useToast } from "./use-toast";

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
        const streak = await getUserStreak(user.id);
        const status = await getStreakStatus(user.id);

        if (streak && !status.studiedToday && streak.last_study_date) {
          const daysUntilReset = getDaysUntilStreakReset(new Date(streak.last_study_date));
          setStreakData({
            currentStreak: streak.current_streak,
            longestStreak: streak.longest_streak,
            studiedToday: status.studiedToday,
            daysUntilReset,
          });
        } else {
          setStreakData({
            currentStreak: streak?.current_streak || 0,
            longestStreak: streak?.longest_streak || 0,
            studiedToday: status.studiedToday,
          });
        }

        // Show streak notification if it's about to reset
        if (
          streak &&
          !status.studiedToday &&
          streak.last_study_date &&
          streak.current_streak > 0
        ) {
          const daysUntilReset = getDaysUntilStreakReset(new Date(streak.last_study_date));
          if (daysUntilReset <= 1) {
            toast({
              title: "Your streak is about to reset!",
              description: `Study today to keep your ${streak.current_streak}-day streak alive! ⏰`,
              variant: "default",
            });
          }
        }
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
        const [earned, progress, nextMilestones] = await Promise.all([
          getUserAchievements(user.id),
          getAchievementProgress(user.id),
          getNextMilestones(user.id),
        ]);

        setAchievements({
          earned,
          progress,
          nextMilestones,
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
        const streak = await getUserStreak(user.id);
        const status = await getStreakStatus(user.id);
        const earnedAchievements = await getUserAchievements(user.id);
        const progress = await getAchievementProgress(user.id);
        const nextMilestones = await getNextMilestones(user.id);

        setStreakData({
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          studiedToday: status.studiedToday,
        });

        setAchievements({
          earned: earnedAchievements,
          progress,
          nextMilestones,
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
