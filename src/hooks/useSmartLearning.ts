import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WrongAnswer {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  topic?: string;
}

export interface SmartLearningInsight {
  weakAreas: string[];
  recommendations: string[];
  focusTopics: string[];
  studyTips: string[];
}

export function useSmartLearning() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [insights, setInsights] = useState<SmartLearningInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const recordWrongAnswer = useCallback((answer: WrongAnswer) => {
    setWrongAnswers((prev) => [...prev, answer]);
  }, []);

  const clearWrongAnswers = useCallback(() => {
    setWrongAnswers([]);
    setInsights(null);
  }, []);

  const analyzeWeaknesses = useCallback(async (topic?: string): Promise<SmartLearningInsight | null> => {
    if (wrongAnswers.length === 0) {
      return null;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-learning", {
        body: { 
          wrongAnswers,
          topic,
          action: "analyze"
        },
      });

      if (error) {
        console.error("Smart learning analysis error:", error);
        // Fallback insights
        const fallbackInsights: SmartLearningInsight = {
          weakAreas: wrongAnswers.slice(0, 3).map(w => w.question),
          recommendations: ["Review the questions you missed", "Practice similar problems"],
          focusTopics: topic ? [topic] : [],
          studyTips: ["Take breaks between study sessions", "Use active recall techniques"],
        };
        setInsights(fallbackInsights);
        return fallbackInsights;
      }

      setInsights(data);
      return data;
    } catch (error) {
      console.error("Smart learning failed:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [wrongAnswers]);

  const generateFocusedTest = useCallback(async (topic: string): Promise<string | null> => {
    if (wrongAnswers.length === 0 && !insights) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("smart-learning", {
        body: { 
          wrongAnswers,
          insights,
          topic,
          action: "generate-focused-test"
        },
      });

      if (error) {
        console.error("Generate focused test error:", error);
        return null;
      }

      return data.content;
    } catch (error) {
      console.error("Generate focused test failed:", error);
      return null;
    }
  }, [wrongAnswers, insights]);

  return {
    wrongAnswers,
    insights,
    isAnalyzing,
    recordWrongAnswer,
    clearWrongAnswers,
    analyzeWeaknesses,
    generateFocusedTest,
    hasWrongAnswers: wrongAnswers.length > 0,
  };
}
