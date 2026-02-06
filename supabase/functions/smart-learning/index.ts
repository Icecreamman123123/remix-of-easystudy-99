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
    const { wrongAnswers, insights, topic, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

Analyze the student's mistakes and identify patterns. Respond with ONLY a JSON object (no markdown):
{
  "weakAreas": ["list of 2-4 specific concepts or areas the student struggles with"],
  "recommendations": ["list of 2-3 specific actions to improve"],
  "focusTopics": ["list of 1-3 subtopics to focus on"],
  "studyTips": ["list of 2-3 study strategies tailored to their weaknesses"]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
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

Generate 5-8 flashcard-style questions that specifically target these weak areas.
Focus on the concepts the student struggled with, but phrase questions differently.

Respond with ONLY a JSON array (no markdown):
[
  {"question": "question text", "answer": "correct answer", "hint": "optional hint"},
  ...
]`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error("AI generation failed");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";

      return new Response(JSON.stringify({ content }), {
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
