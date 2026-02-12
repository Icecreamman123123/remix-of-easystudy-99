// @ts-ignore - Deno module resolution, not compatible with TypeScript compiler
 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req: Request) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
    try {
       const body = await req.json();
       const { messages, topic, gradeLevel, difficulty, instruction, customInstruction, language, sourceContext } = body;
       const customInstructionText = customInstruction || instruction;

       // Validate messages
       if (!messages || !Array.isArray(messages)) {
         return new Response(
           JSON.stringify({ error: "messages must be an array" }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }

      // Deno environment access
      const getEnv = (key: string): string | undefined => {
        try {
          return Deno.env.get(key);
        } catch (e) {
          console.warn("getEnv error:", e);
        }
        return undefined;
      };

      const LOVABLE_API_KEY = getEnv("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
  
      const gradeLevelText = gradeLevel 
        ? gradeLevel === "university" 
          ? "university undergraduate level" 
          : gradeLevel === "phd" 
            ? "PhD/graduate research level"
            : `grade ${gradeLevel} (ages ${parseInt(gradeLevel) + 5}-${parseInt(gradeLevel) + 6})`
        : "middle school level";

      const LANGUAGE_MAP: Record<string, string> = {
        "en": "",
        "zh": "\n\nIMPORTANT: Respond entirely in Simplified Chinese (简体中文).",
        "fr": "\n\nIMPORTANT: Respond entirely in French (Français).",
        "es": "\n\nIMPORTANT: Respond entirely in Spanish (Español).",
        "hi": "\n\nIMPORTANT: Respond entirely in Hindi (हिन्दी).",
      };
      const langInstruction = LANGUAGE_MAP[language] || "";

      // Build source context section
      const sourceSection = sourceContext 
        ? `\n\nSOURCE MATERIAL (prioritize this content when answering questions):\n---\n${sourceContext}\n---\nWhen the user asks questions, PRIMARILY use the above source material to answer. Only supplement with your general knowledge if the source material doesn't cover the question.`
        : "";
  
      let systemPrompt = `You are a helpful, knowledgeable study assistant helping a ${gradeLevelText} student learn about: ${topic || "their studies"}.${sourceSection}
  
  IMPORTANT GUIDELINES:
  - Focus your answers on the topic: "${topic || "the student's questions"}"
  - Use vocabulary and explanations appropriate for ${gradeLevelText}
  - Be encouraging and supportive
  - Give clear, concise answers
  - Use examples and analogies that are relatable
  - If asked about something off-topic, gently redirect back to the study topic
  - Format your responses with markdown for better readability
  - Break down complex concepts into digestible parts
  - Encourage critical thinking by asking follow-up questions when appropriate${langInstruction}
  
  You are here to help them understand and master this subject!`;

    // Append difficulty context and custom instruction if provided
    if (difficulty) {
      systemPrompt += `\n\nAdjust explanations to the following difficulty level: ${difficulty}.`;
    }

    if (customInstructionText) {
      systemPrompt += `\n\nCUSTOM INSTRUCTION: ${customInstructionText}\nFollow this instruction and prioritize it when appropriate.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           ...messages,
         ],
         stream: true,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error(`AI request failed: ${response.status}`);
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("Study chat error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });