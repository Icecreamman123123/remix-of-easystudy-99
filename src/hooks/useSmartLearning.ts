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
      const raw = await lovableChatCompletion([
        {
          role: "system",
          content:
            "You are a study coach. Return ONLY valid JSON with keys: " +
            "weakAreas (string[]), recommendations (string[]), focusTopics (string[]), studyTips (string[]).",
        },
        {
          role: "user",
          content: JSON.stringify({ action: "analyze", topic, wrongAnswers }),
        },
      ]);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      const data: SmartLearningInsight = {
        weakAreas: Array.isArray(parsed?.weakAreas) ? parsed.weakAreas : [],
        recommendations: Array.isArray(parsed?.recommendations) ? parsed.recommendations : [],
        focusTopics: Array.isArray(parsed?.focusTopics) ? parsed.focusTopics : [],
        studyTips: Array.isArray(parsed?.studyTips) ? parsed.studyTips : [],
      };

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
      const content = await lovableChatCompletion([
        {
          role: "system",
          content:
            "Generate a focused practice test in markdown. Include questions and an answer key at the end.",
        },
        {
          role: "user",
          content: JSON.stringify({ action: "generate-focused-test", topic, wrongAnswers, insights }),
        },
      ]);

      return content;
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
