/**
 * Hook for handling Study AI with Wikipedia fallback
 */

import { useState, useCallback } from "react";
import { callStudyAIWithFallback, type StudyAction, type AIModel, type AIExpertise } from "@/lib/study-api";
import { useToast } from "./use-toast";

export interface FallbackState {
  loading: boolean;
  data: string | null;
  error: string | null;
  source: "primary" | "wikipedia" | "error" | null;
  fallbackUsed: boolean;
}

export function useStudyAIWithFallback() {
  const [state, setState] = useState<FallbackState>({
    loading: false,
    data: null,
    error: null,
    source: null,
    fallbackUsed: false,
  });

  const { toast } = useToast();

  const call = useCallback(
    async (
      action: StudyAction,
      content?: string,
      topic?: string,
      difficulty?: string,
      gradeLevel?: string,
      model?: AIModel,
      expertise?: AIExpertise
    ) => {
      setState({
        loading: true,
        data: null,
        error: null,
        source: null,
        fallbackUsed: false,
      });

      try {
        const { result, source, fallback } = await callStudyAIWithFallback(
          action,
          content,
          topic,
          difficulty,
          gradeLevel,
          model,
          expertise
        );

        if (source === "error") {
          throw new Error("Could not retrieve content from any source");
        }

        if (fallback && source === "wikipedia") {
          toast({
            title: "Using Wikipedia Data",
            description: "Main server unavailable. Showing information from Wikipedia.",
            variant: "default",
          });
        }

        setState({
          loading: false,
          data: result,
          error: null,
          source,
          fallbackUsed: fallback,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch study content";
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        setState({
          loading: false,
          data: null,
          error: errorMessage,
          source: "error",
          fallbackUsed: true,
        });

        throw err;
      }
    },
    [toast]
  );

  return {
    ...state,
    call,
  };
}
