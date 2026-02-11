import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export function useStudySessions() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching study sessions:", error);
      setLoading(false);
      return;
    }

    const sessions = data || [];
    const totalSessions = sessions.length;
    const totalCardsStudied = sessions.reduce((sum, s) => sum + s.cards_studied, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate streak (consecutive days with sessions)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakDays = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasSession = sessions.some(
        (s) => s.completed_at.split("T")[0] === dateStr
      );
      
      if (hasSession) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If no session today, check if yesterday had one (streak still counts)
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStats({
      totalSessions,
      totalCardsStudied,
      totalCorrect,
      averageAccuracy,
      streakDays,
      recentSessions: sessions.slice(0, 10),
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
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

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        deck_id: deckId || null,
        session_type: sessionType,
        cards_studied: cardsStudied,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        duration_seconds: durationSeconds || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording session:", error);
      return null;
    }

    await fetchStats();
    return data;
  };

  return {
    stats,
    loading,
    recordSession,
    refetch: fetchStats,
  };
}
