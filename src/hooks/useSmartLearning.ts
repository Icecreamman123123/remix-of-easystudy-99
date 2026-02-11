import { useState, useCallback } from "react";
import { lovableChatCompletion } from "@/lib/lovable-ai";

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
      const raw = await lovableChatCompletion(
        [
          {
            role: "system",
            content:
              "You are a study coach. Return ONLY valid JSON with keys: weakAreas (string[]), recommendations (string[]), focusTopics (string[]), studyTips (string[]).",
          },
          {
            role: "user",
            content: JSON.stringify({ wrongAnswers, topic }),
          },
        ],
        { model: "google/gemini-2.5-flash", temperature: 0.4, maxTokens: 1024 }
      );

      const data = JSON.parse(raw) as SmartLearningInsight;
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
      const text = await lovableChatCompletion(
        [
          {
            role: "system",
            content:
              "Generate a focused practice test in plain text with an answer key at the end.",
          },
          {
            role: "user",
            content: JSON.stringify({ topic, wrongAnswers, insights }),
          },
        ],
        { model: "google/gemini-2.5-flash", temperature: 0.5, maxTokens: 2048 }
      );
      return text || null;
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
