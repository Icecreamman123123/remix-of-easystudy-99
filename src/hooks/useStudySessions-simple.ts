import { useState, useEffect } from "react";
import { StudySession, saveSession, getSessions } from "@/lib/storage-simple";
import { useAuth } from "./useAuth-simple";

export interface StudyStats {
  totalSessions: number;
  totalCardsStudied: number;
  averageAccuracy: number;
  streakDays: number;
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = () => {
    setLoading(true);
    try {
      const allSessions = getSessions();
      // Filter by user if logged in
      const userSessions = user ? allSessions : allSessions.slice(0, 10); // Show limited sessions for demo
      setSessions(userSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const recordSession = async (sessionData: {
    deckId?: string;
    sessionType: string;
    cardsStudied: number;
    correctAnswers: number;
    totalQuestions: number;
    durationSeconds?: number;
  }) => {
    try {
      const newSession = saveSession(sessionData);
      await fetchSessions();
      return newSession;
    } catch (error) {
      console.error("Error recording session:", error);
      return null;
    }
  };

  const getStats = (): StudyStats | null => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalCardsStudied = sessions.reduce((sum, session) => sum + session.cardsStudied, 0);
    const totalCorrect = sessions.reduce((sum, session) => sum + session.correctAnswers, 0);
    const totalQuestions = sessions.reduce((sum, session) => sum + session.totalQuestions, 0);
    
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    // Simple streak calculation (consecutive days with sessions)
    const streakDays = calculateStreak(sessions);

    return {
      totalSessions,
      totalCardsStudied,
      averageAccuracy,
      streakDays
    };
  };

  const calculateStreak = (sessionList: StudySession[]): number => {
    if (sessionList.length === 0) return 0;

    const today = new Date();
    const sortedSessions = sessionList
      .map(s => new Date(s.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);

    for (const sessionDate of sortedSessions) {
      const sessionDay = new Date(sessionDate);
      sessionDay.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - sessionDay.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate = new Date(sessionDay);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  return {
    sessions,
    loading,
    fetchSessions,
    recordSession,
    stats: getStats()
  };
}
