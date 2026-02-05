 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { userAnswer, correctAnswer, question } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const prompt = `You are an answer checker for educational content. Compare the user's answer to the correct answer and determine if it's correct.
 
 Question: "${question}"
 Correct Answer: "${correctAnswer}"
 User's Answer: "${userAnswer}"
 
 Evaluate if the user's answer is semantically correct. Consider:
 - Synonyms and paraphrasing are acceptable
 - Minor spelling errors should be forgiven
 - The core concept must be correct
 - Partial answers that capture the main idea are acceptable
 
 Respond with ONLY a JSON object (no markdown, no code blocks):
 {
   "isCorrect": true/false,
   "feedback": "Brief explanation of why it's correct/incorrect",
   "matchPercentage": 0-100
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
       // Fallback to basic string matching
       const normalizedUser = userAnswer.toLowerCase().trim();
       const normalizedCorrect = correctAnswer.toLowerCase().trim();
       const isCorrect = normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect);
       return new Response(JSON.stringify({
         isCorrect,
         feedback: isCorrect ? "Correct!" : "Not quite right.",
         matchPercentage: isCorrect ? 100 : 0,
         fallback: true
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const data = await response.json();
     const content = data.choices?.[0]?.message?.content || "{}";
     
     // Parse the JSON response
     let result;
     try {
       // Remove any markdown code blocks if present
       const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
       result = JSON.parse(cleanContent);
     } catch {
       // Fallback parsing
       const isCorrect = content.toLowerCase().includes('"iscorrect": true') || 
                         content.toLowerCase().includes('"iscorrect":true');
       result = {
         isCorrect,
         feedback: isCorrect ? "Correct!" : "Not quite right.",
         matchPercentage: isCorrect ? 100 : 0
       };
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("Check answer error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });