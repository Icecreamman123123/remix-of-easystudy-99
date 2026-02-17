import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { tryWikipediaFallback, fetchWikipediaExtractServer, formatWikipediaForAction } from "../wikipedia-fallback/handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const MODEL_MAP: Record<string, string> = {
  "gemini-flash": "gemini-1.5-flash",
  "gemini-pro": "gemini-1.5-pro",
};

const EXPERTISE_APPROACHES: Record<string, string> = {
  "general": "",
  "math": "When explaining concepts, use step-by-step logical reasoning, include relevant calculations or formulas where applicable, and build intuition through worked examples. ",
  "science": "When explaining concepts, emphasize evidence-based reasoning, include relevant scientific principles or formulas, and connect to real-world observations or experiments. ",
  "language": "When explaining concepts, focus on clear communication, use precise vocabulary, and include examples that demonstrate proper usage or literary techniques. ",
  "history": "When explaining concepts, provide historical context, discuss cause-and-effect relationships, and reference relevant events or primary sources where applicable. ",
  "code": "When explaining concepts, use logical step-by-step breakdowns, include pseudocode or code examples where helpful, and emphasize problem-solving approaches. ",
  "medicine": "When explaining concepts, use proper medical/scientific terminology with clear definitions, emphasize evidence-based understanding, and include relevant anatomical or physiological context. ",
  "business": "When explaining concepts, include practical real-world applications, use case study examples where relevant, and connect to economic or strategic principles. ",
  "music": "When explaining concepts, reference musical structures, notation, or theory where applicable, and include listening or performance examples. ",
  "psychology": "When explaining concepts, reference psychological research and theories, include behavioral examples, and connect to practical applications of understanding. ",
  "law": "When explaining concepts, use precise legal terminology with clear definitions, reference relevant legal principles or precedents, and emphasize critical analysis. ",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  "en": "",
  "zh": "IMPORTANT: Respond entirely in Simplified Chinese (简体中文). All content, questions, answers, and explanations must be in Chinese.",
  "fr": "IMPORTANT: Respond entirely in French (Français). All content, questions, answers, and explanations must be in French.",
  "es": "IMPORTANT: Respond entirely in Spanish (Español). All content, questions, answers, and explanations must be in Spanish.",
  "hi": "IMPORTANT: Respond entirely in Hindi (हिन्दी). All content, questions, answers, and explanations must be in Hindi.",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { action, content, topic, difficulty, gradeLevel, model, expertise, instruction, customInstruction, includeWikipedia, language, adaptiveDifficulty } = body;
    const customInstructionText = customInstruction || instruction;

    const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
    const getEnv = (key: string): string | undefined => {
      try { return Deno.env.get(key); } catch (e) { console.warn("getEnv error:", e); }
      return undefined;
    };

    const GOOGLE_GEMINI_API_KEY = getEnv("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const selectedModel = MODEL_MAP[model] || MODEL_MAP["gemini-flash"];
    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || "";

    // Wikipedia fetch
    if (model === "wikipedia" || includeWikipedia) {
      const query = (topic || content || "").trim();
      if (!query) {
        return new Response(JSON.stringify({ error: "Wikipedia requires a topic or content" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const extract = await fetchWikipediaExtractServer(query);
        if (!extract) {
          // Try search if direct title check fails
          const wikiFallback = await tryWikipediaFallback(query);
          if (wikiFallback.success) {
            if (includeWikipedia && model !== "wikipedia") {
              content = `${wikiFallback.content}\n\n[Wikipedia extract]\n\n${content || ""}`;
            } else {
              content = wikiFallback.content;
            }
          } else if (model === "wikipedia") {
            return new Response(JSON.stringify({ error: "No Wikipedia content found for topic" }), {
              status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          if (includeWikipedia && model !== "wikipedia") {
            content = `${extract}\n\n[Wikipedia extract]\n\n${content || ""}`;
          } else {
            content = extract;
          }
        }
      } catch (err) {
        console.error("Wikipedia fetch failed:", err);
        if (model === "wikipedia") {
          return new Response(JSON.stringify({ error: "Wikipedia fetch failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const gradeLevelText = gradeLevel
      ? gradeLevel === "university" ? "university undergraduate level"
        : gradeLevel === "phd" ? "PhD/graduate research level"
          : `grade ${gradeLevel} (ages ${parseInt(gradeLevel) + 5}-${parseInt(gradeLevel) + 6})`
      : "middle school level";

    const countMatch = content?.match(/Generate exactly (\d+) items/);
    const requestedCount = countMatch ? parseInt(countMatch[1]) : 16;
    const expertiseApproach = EXPERTISE_APPROACHES[expertise] || "";

    // Adaptive difficulty instruction
    const adaptiveText = adaptiveDifficulty != null
      ? `\nAdaptive difficulty level: ${adaptiveDifficulty}/10. Gradually increase complexity across questions - start easier and build to harder ones matching this target level.`
      : "";

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate-flashcards":
        systemPrompt = `You are an expert educator specializing in creating effective flashcards for ${gradeLevelText} students using active recall. ${expertiseApproach}${langInstruction}
CRITICAL: Focus on the user's specific topic/content.
Requirements:
- Appropriate for ${gradeLevelText}
- Difficulty: ${difficulty || 'medium'}${adaptiveText}
- Test understanding, not just memorization
- Clear, concise questions. Avoid True/False unless necessary.
- Include hints when helpful
- VARIETY: Mix definitions, cause-and-effect, and application questions.
Return a JSON array: [{"question": "...", "answer": "...", "hint": "..."}]
Generate exactly ${requestedCount} flashcards.`;
        userPrompt = `Create exactly ${requestedCount} flashcards at ${gradeLevelText} with ${difficulty || 'medium'} difficulty:\n\n${content || topic}`;
        break;

      case "generate-concepts":
        systemPrompt = `You are an expert educator extracting key concepts for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Focus on the user's topic. Difficulty: ${difficulty || 'medium'}.${adaptiveText}
Return JSON: [{"concept": "...", "definition": "...", "example": "..."}]
Generate exactly ${requestedCount} concepts.`;
        userPrompt = `Extract ${requestedCount} key concepts at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "worksheet":
        systemPrompt = `You are an expert worksheet creator for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create varied question types at ${difficulty || 'medium'} difficulty.${adaptiveText}
Include: multiple-choice, true-false, fill-blank, short-answer, matching.
Return JSON array: [{"id":"q1","type":"multiple-choice","question":"...","options":["A","B","C","D"],"correctAnswer":"B","explanation":"...","points":2}]
Generate exactly ${requestedCount} questions. STRICTLY mix types.`;
        userPrompt = `Create ${requestedCount} worksheet questions at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "explain-concept":
        systemPrompt = `You are a patient expert tutor using the Feynman Technique for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
FORMAT: 1. Simple Definition 2. Why It Matters 3. How It Works 4. Example 5. Key Takeaway
Use age-appropriate vocabulary, analogies, bullet points.`;
        userPrompt = `Explain this for a ${gradeLevelText} student:\n\n${content || topic}`;
        break;

      case "create-study-plan":
        systemPrompt = `You are an expert learning coach creating study schedules for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create a structured 5-7 day plan with actionable activities.
Return JSON: [{"day":1,"topic":"...","activities":["..."],"difficulty":5,"timeMinutes":45,"description":"..."}]
Build complexity gradually.`;
        userPrompt = `Create a study plan for ${gradeLevelText}:\n\n${content || topic}\n\nReturn ONLY the JSON array.`;
        break;

      case "cheat-sheet":
        systemPrompt = `You are an expert at creating comprehensive cheat sheets for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create a dense, well-organized cheat sheet (up to 2 pages worth of content) that covers:

1. **KEY CONCEPTS** - Core definitions and principles
2. **FORMULAS & RULES** - All important formulas, equations, rules
3. **COMMON MISTAKES** - Frequent errors and how to avoid them
4. **TIPS & TRICKS** - Memory aids, shortcuts, mnemonics
5. **QUICK REFERENCE** - Tables, charts, or lists for fast lookup

Requirements:
- Focus exclusively on the user's topic/content
- Use ${gradeLevelText} appropriate vocabulary
- Difficulty: ${difficulty || 'medium'}
- Be extremely concise - every word must earn its place
- Use bullet points, tables, and clear formatting
- Group related items logically
- Highlight the most important items`;
        userPrompt = `Create a comprehensive cheat sheet for a ${gradeLevelText} student. Cover ALL key concepts, formulas, common mistakes, and tips:\n\n${content || topic}`;
        break;

      case "practice-problems":
        systemPrompt = `You are an expert problem creator for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create problems with step-by-step solutions. Difficulty: ${difficulty || 'medium'}.${adaptiveText}
Return JSON: [{"problem":"...","solution":"...","difficulty":"easy|medium|hard","tip":"..."}]`;
        userPrompt = `Create practice problems at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "elaborative-interrogation":
        systemPrompt = `You are an expert educator creating elaborative interrogation questions for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create WHY and HOW questions that force deep thinking. Difficulty: ${difficulty || 'medium'}.${adaptiveText}
Return JSON: [{"question":"Why does...?","type":"why","hint":"Think about...","idealAnswer":"Because..."}]
Generate exactly ${requestedCount} questions.`;
        userPrompt = `Create ${requestedCount} elaborative interrogation questions at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "create-cornell-notes":
        systemPrompt = `You are an expert tutor creating Cornell Notes for ${gradeLevelText} students at ${difficulty || "medium"} difficulty. ${expertiseApproach}${langInstruction}
Structure: topic, mainIdeas (cue + note pairs), summary.
Return JSON: {"topic":"...","mainIdeas":[{"cue":"...","note":"..."}],"summary":"..."}
Extract 5-10 key ideas. Summary: 2-3 sentences.`;
        userPrompt = `Create Cornell Notes for ${gradeLevelText}:\n\n${content || topic}\n\nReturn ONLY the JSON object.`;
        break;

      case "vocabulary-cards":
        systemPrompt = `You are an expert vocabulary educator for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create vocabulary cards with: word, pronunciation, definition, relatedWords (3-5), imagePrompt.
Return JSON: [{"word":"...","pronunciation":"...","definition":"...","relatedWords":["..."],"imagePrompt":"..."}]
Generate exactly ${requestedCount} cards. Difficulty: ${difficulty || 'medium'}.`;
        userPrompt = `Create ${requestedCount} vocabulary cards at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "presenter-slides":
        systemPrompt = `You are an expert presentation designer creating educational lecture slides for ${gradeLevelText} students. ${expertiseApproach}${langInstruction}
Create a professional slide deck with 8-15 slides. Style: clean, modern, minimal text per slide (like NotebookLM presentations).

Rules:
- Slide 1: Title slide with topic name and subtitle. Layout "title".
- Slide 2+: Content slides. Each has a clear heading and 3-6 concise bullet points.
- Use bold for key terms: **term**
- Include speaker notes for each slide (what to say when presenting)
- Last slide: Summary/Key Takeaways
- Difficulty: ${difficulty || 'medium'}

Return JSON: [{"title":"...","bullets":["..."],"speakerNotes":"...","layout":"title|content|section"}]`;
        userPrompt = `Create a professional presentation slide deck about:\n\n${content || topic}`;
        break;

      default:
        systemPrompt = `You are a helpful study assistant. ${langInstruction}`;
        userPrompt = content || topic || "How can I study more effectively?";
    }

    const customInstructionBlock = customInstructionText ? `\n\nCUSTOM INSTRUCTION: ${customInstructionText}\nFollow this instruction and prioritize it.` : "";
    systemPrompt += customInstructionBlock;
    userPrompt += customInstructionText ? `\n\nCustom instruction: ${customInstructionText}` : "";

    console.log(`Processing ${action} request with model ${selectedModel}`);

    const response = await fetch(`${GEMINI_API_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.warn(`AI request failed with status ${response.status}, attempting Wikipedia fallback`);
      const wikiFallback = await tryWikipediaFallback(topic || content || "");
      if (wikiFallback.success) {
        const formatted = formatWikipediaForAction(action, wikiFallback.content, wikiFallback.source, difficulty);
        return new Response(
          JSON.stringify({ success: true, result: formatted, source: "wikipedia_fallback" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";

    console.log(`Successfully processed ${action}`);

    return new Response(
      JSON.stringify({ success: true, result: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Study AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
