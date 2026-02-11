import { useState, useCallback, useEffect } from "react";

export interface GamificationStats {
  points: number;
  level: number;
  nextLevelPoints: number;
  totalSessions: number;
  accuracy: number;
  streak: number;
}

const DEFAULT_STATS: GamificationStats = {
  points: 0,
  level: 1,
  nextLevelPoints: 100,
  totalSessions: 0,
  accuracy: 0,
  streak: 0,
};

const POINTS_PER_LEVEL = 100;

export function useGamificationStats() {
  const [stats, setStats] = useState<GamificationStats>(DEFAULT_STATS);

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem("userGameStats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error("Error loading gamification stats:", error);
      }
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userGameStats", JSON.stringify(stats));
  }, [stats]);

  const addPoints = useCallback((points: number) => {
    setStats((prev) => {
      let newPoints = prev.points + points;
      let newLevel = prev.level;
      let nextLevelPoints = prev.nextLevelPoints;

      // Check for level up
      while (newPoints >= nextLevelPoints) {
        newPoints -= nextLevelPoints;
        newLevel += 1;
        nextLevelPoints = POINTS_PER_LEVEL * newLevel;
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        nextLevelPoints,
      };
    });
  }, []);

  const recordSession = useCallback(
    (accuracy: number, duration: number) => {
      // Calculate points based on accuracy and duration
      const basePoints = Math.round(accuracy);
      const durationBonus = Math.min(duration / 60, 10); // Max 10 bonus points
      const totalPoints = basePoints + durationBonus;

      setStats((prev) => ({
        ...prev,
        totalSessions: prev.totalSessions + 1,
        accuracy: (prev.accuracy * prev.totalSessions + accuracy) / (prev.totalSessions + 1),
      }));

      addPoints(totalPoints);
    },
    [addPoints]
  );

  const updateStreak = useCallback((newStreak: number) => {
    setStats((prev) => ({
      ...prev,
      streak: newStreak,
    }));
  }, []);

  const resetStats = useCallback(() => {
    setStats(DEFAULT_STATS);
    localStorage.removeItem("userGameStats");
  }, []);

  return {
    stats,
    addPoints,
    recordSession,
    updateStreak,
    resetStats,
  };
}
