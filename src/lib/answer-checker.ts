 import { supabase } from "@/integrations/supabase/client";
 
 export interface AnswerCheckResult {
   isCorrect: boolean;
   feedback: string;
   matchPercentage: number;
   fallback?: boolean;
 }
 
 // Local fuzzy matching for immediate feedback
 export function localAnswerCheck(
   userAnswer: string,
   correctAnswer: string
 ): { isCorrect: boolean; matchRatio: number } {
   const normalizedUser = userAnswer.toLowerCase().trim().replace(/[^\w\s]/g, "");
   const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/[^\w\s]/g, "");
 
   // Exact match
   if (normalizedUser === normalizedCorrect) {
     return { isCorrect: true, matchRatio: 1 };
   }
 
   // Contains match
   if (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect)) {
     return { isCorrect: true, matchRatio: 0.9 };
   }
 
   // Word-based matching
   const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 2);
   const correctWords = normalizedCorrect.split(/\s+/).filter(w => w.length > 2);
   
   if (correctWords.length === 0) {
     return { isCorrect: normalizedUser.length > 0, matchRatio: 0.5 };
   }
 
   const matchedWords = userWords.filter((w) =>
     correctWords.some((cw) => cw.includes(w) || w.includes(cw))
   );
   const matchRatio = matchedWords.length / Math.max(correctWords.length, 1);
 
   return { isCorrect: matchRatio >= 0.6, matchRatio };
 }
 
 // AI-powered answer checking (async, for more accurate evaluation)
 export async function checkAnswerWithAI(
   userAnswer: string,
   correctAnswer: string,
   question: string
 ): Promise<AnswerCheckResult> {
   try {
     const { data, error } = await supabase.functions.invoke("check-answer", {
       body: { userAnswer, correctAnswer, question },
     });
 
     if (error) {
       console.error("AI answer check error:", error);
       // Fallback to local check
       const local = localAnswerCheck(userAnswer, correctAnswer);
       return {
         isCorrect: local.isCorrect,
         feedback: local.isCorrect ? "Correct!" : "Not quite right.",
         matchPercentage: Math.round(local.matchRatio * 100),
         fallback: true,
       };
     }
 
     return data;
   } catch (error) {
     console.error("AI answer check failed:", error);
     const local = localAnswerCheck(userAnswer, correctAnswer);
     return {
       isCorrect: local.isCorrect,
       feedback: local.isCorrect ? "Correct!" : "Not quite right.",
       matchPercentage: Math.round(local.matchRatio * 100),
       fallback: true,
     };
   }
 }