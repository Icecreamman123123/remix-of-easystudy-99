import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WrongAnswer {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  topic?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { wrongAnswers, insights, topic, action, difficulty, gradeLevel, instruction, customInstruction } = body;
    const customInstructionText = customInstruction || instruction;

    // Deno environment access
    const getEnv = (key: string): string | undefined => {
      try {
        return Deno.env.get(key);
      } catch (e) {
        console.warn("getEnv error:", e);
      }
      return undefined;
    };

    const GOOGLE_GEMINI_API_KEY = getEnv("GOOGLE_GEMINI_API_KEY");

    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    if (action === "analyze") {
      const prompt = `You are an educational AI analyzing a student's learning weaknesses.

The student got the following questions wrong:
${(wrongAnswers as WrongAnswer[]).map((w, i) => `
${i + 1}. Question: "${w.question}"
   Correct Answer: "${w.correctAnswer}"
   Student's Answer: "${w.userAnswer}"
`).join("")}

${topic ? `The study topic is: "${topic}"` : ""}
${gradeLevel ? `Target grade level: ${gradeLevel}` : ""}
${difficulty ? `Difficulty: ${difficulty}` : ""}
${customInstructionText ? `Custom instruction: ${customInstructionText}` : ""}

Take into account the target grade level and difficulty when analyzing mistakes. If a custom instruction is provided, prioritize it when making recommendations.

Analyze the student's mistakes and identify patterns. Respond with ONLY a JSON object (no markdown):
{
  "weakAreas": ["list of 2-4 specific concepts or areas the student struggles with"],
  "recommendations": ["list of 2-3 specific actions to improve"],
  "focusTopics": ["list of 1-3 subtopics to focus on"],
  "studyTips": ["list of 2-3 study strategies tailored to their weaknesses"]
}`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-1.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI analysis failed");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";

      // Parse the JSON response
      let result;
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        result = JSON.parse(cleanContent);
      } catch {
        result = {
          weakAreas: ["Review the questions you missed"],
          recommendations: ["Practice similar problems", "Study the core concepts"],
          focusTopics: topic ? [topic] : [],
          studyTips: ["Use active recall", "Space out your practice sessions"],
        };
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate-focused-test") {
      const weakAreas = insights?.weakAreas || wrongAnswers.map((w: WrongAnswer) => w.question);

      const prompt = `You are an educational AI generating a focused practice test.

The student needs to improve in these areas:
${weakAreas.map((area: string, i: number) => `${i + 1}. ${area}`).join("\n")}

${topic ? `The study topic is: "${topic}"` : ""}
${gradeLevel ? `Target grade level: ${gradeLevel}` : ""}
${difficulty ? `Difficulty: ${difficulty}` : ""}
${customInstructionText ? `Custom instruction: ${customInstructionText}` : ""}

Generate 5-8 flashcard-style questions that specifically target these weak areas.
Adjust question wording and complexity to be appropriate for the target grade level and difficulty.
If a custom instruction is provided, follow it when selecting and phrasing questions.
Focus on the concepts the student struggled with, but phrase questions differently.

Respond with ONLY a JSON array (no markdown):
[
  {"question": "question text", "answer": "correct answer", "hint": "optional hint"},
  ...
]`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-1.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";

      // Parse and standardize output
      let result;
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        result = JSON.parse(cleanContent);
        if (!Array.isArray(result)) {
          // If AI returned an object with a field, extract it
          result = result.questions || result.flashcards || result.items || [];
        }
      } catch {
        result = [];
      }

      return new Response(JSON.stringify({ content: JSON.stringify(result) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Smart learning error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
