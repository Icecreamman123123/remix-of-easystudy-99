import { useEffect, useState } from "react";
import { getSessions, saveSession } from "@/lib/storage-simple";
import { useAuth } from "./useAuth-simple";

export interface StudySession {
  id: string;
  deck_id: string | null;
  session_type: string;
  cards_studied: number;
  correct_answers: number;
  total_questions: number;
  duration_seconds: number | null;
  completed_at: string;
}

export interface StudyStats {
  totalSessions: number;
  totalCardsStudied: number;
  totalCorrect: number;
  averageAccuracy: number;
  streakDays: number;
  recentSessions: StudySession[];
}

type StoredSession = {
  id: string;
  deckId?: string;
  sessionType: string;
  cardsStudied: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds?: number;
  completedAt: string;
};

function toSessionView(s: StoredSession): StudySession {
  return {
    id: s.id,
    deck_id: s.deckId || null,
    session_type: s.sessionType,
    cards_studied: s.cardsStudied,
    correct_answers: s.correctAnswers,
    total_questions: s.totalQuestions,
    duration_seconds: typeof s.durationSeconds === "number" ? s.durationSeconds : null,
    completed_at: s.completedAt,
  };
}

function calculateStreak(sessionList: StudySession[]): number {
  if (sessionList.length === 0) return 0;

  const days = new Set(sessionList.map((s) => s.completed_at.split("T")[0]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (days.has(key)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

export function useStudySessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const stored = (getSessions() as unknown as StoredSession[]) || [];
      const mapped = stored.map(toSessionView).sort((a, b) => b.completed_at.localeCompare(a.completed_at));
      setSessions(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const recordSession = async (
    sessionType: string,
    cardsStudied: number,
    correctAnswers: number,
    totalQuestions: number,
    durationSeconds?: number,
    deckId?: string
  ) => {
    if (!user) return null;

    try {
      const created = saveSession({
        deckId,
        sessionType,
        cardsStudied,
        correctAnswers,
        totalQuestions,
        durationSeconds,
      } as any) as unknown as StoredSession;

      await fetchSessions();
      return toSessionView(created);
    } catch (error) {
      console.error("Error recording session:", error);
      return null;
    }
  };

  const getStats = (): StudyStats | null => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalCardsStudied = sessions.reduce((sum, s) => sum + s.cards_studied, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const streakDays = calculateStreak(sessions);

    return {
      totalSessions,
      totalCardsStudied,
      totalCorrect,
      averageAccuracy,
      streakDays,
      recentSessions: sessions.slice(0, 10),
    };
  };

  return {
    stats: getStats(),
    loading,
    recordSession,
    refetch: fetchSessions,
  };
}
