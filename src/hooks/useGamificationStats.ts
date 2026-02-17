import { useState, useCallback, useEffect } from "react";

export interface GamificationStats {
  points: number;
  level: number;
  nextLevelPoints: number;
  totalSessions: number;
  accuracy: number;
  streak: number;
  toolsUsed: number;
  correctAnswers: number;
}

const DEFAULT_STATS: GamificationStats = {
  points: 0,
  level: 1,
  nextLevelPoints: 100,
  totalSessions: 0,
  accuracy: 0,
  streak: 0,
  toolsUsed: 0,
  correctAnswers: 0,
};

const POINTS_PER_LEVEL = 100;

export function useGamificationStats() {
  const [stats, setStats] = useState<GamificationStats>(DEFAULT_STATS);
  const [velocity, setVelocity] = useState(0);

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem("userGameStats");
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats({
          ...DEFAULT_STATS,
          ...parsed
        });
      } catch (error) {
        console.error("Error loading gamification stats:", error);
      }
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userGameStats", JSON.stringify(stats));
  }, [stats]);

  // Update Velocity every minute
  useEffect(() => {
    const calculateVelocity = () => {
      // Velocity = (Tools Used * 10) + (Correct Answers * 2) normalized
      const toolWeight = stats.toolsUsed * 10;
      const answerWeight = stats.correctAnswers * 2;
      const rawVelocity = (toolWeight + answerWeight) / Math.max(1, stats.totalSessions);
      
      // Add a bit of "decay" or randomness to make it feel alive
      const jitter = Math.random() * 5 - 2.5;
      const newVelocity = Math.max(0, Math.min(100, Math.round(rawVelocity + jitter)));
      setVelocity(newVelocity);
    };

    calculateVelocity();
    const interval = setInterval(calculateVelocity, 60000);
    return () => clearInterval(interval);
  }, [stats.toolsUsed, stats.correctAnswers, stats.totalSessions]);

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

  const incrementToolsUsed = useCallback(() => {
    setStats(prev => ({ ...prev, toolsUsed: prev.toolsUsed + 1 }));
    addPoints(5); // Small bonus for using a tool
  }, [addPoints]);

  const incrementCorrectAnswers = useCallback((count: number = 1) => {
    setStats(prev => ({ ...prev, correctAnswers: prev.correctAnswers + count }));
    addPoints(count * 2); // Points for correct answers
  }, [addPoints]);

  const recordSession = useCallback(
    (accuracy: number, duration: number) => {
      const basePoints = Math.round(accuracy);
      const durationBonus = Math.min(duration / 60, 10);
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
    velocity,
    addPoints,
    recordSession,
    updateStreak,
    incrementToolsUsed,
    incrementCorrectAnswers,
    resetStats,
  };
}
