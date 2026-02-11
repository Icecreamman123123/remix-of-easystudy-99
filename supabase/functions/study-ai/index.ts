// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model mapping - all available Lovable AI models
const MODEL_MAP: Record<string, string> = {
  // Fast & Efficient
  "gemini-flash-lite": "google/gemini-2.5-flash-lite",
  "gpt-5-nano": "openai/gpt-5-nano",
  // Balanced
  "gemini-flash": "google/gemini-3-flash-preview",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gpt-5-mini": "openai/gpt-5-mini",
  // Most Capable
  "gemini-pro": "google/gemini-2.5-pro",
  "gemini-3-pro": "google/gemini-3-pro-preview",
  "gpt-5": "openai/gpt-5",
  "gpt-5.2": "openai/gpt-5.2",
};

// Expertise teaching approach hints (NOT topic overrides - the user's topic is ALWAYS primary)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { action, content, topic, difficulty, gradeLevel, model, expertise, instruction, customInstruction, includeWikipedia } = body;
    const customInstructionText = customInstruction || instruction;

    // Deno environment access
    const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
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

    // Select model (default to gemini-flash)
    const selectedModel = MODEL_MAP[model] || MODEL_MAP["gemini-flash"];

    // If user selected Wikipedia as the 'model', or requested to include Wikipedia content, fetch a Wikipedia extract for the topic/content
    if (model === "wikipedia" || includeWikipedia) {
      const query = (topic || content || "").trim();
      if (!query) {
        return new Response(JSON.stringify({ error: "Wikipedia requires a topic or content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const params = new URLSearchParams({
          action: "query",
          prop: "extracts",
          exintro: "1",
          explaintext: "1",
          redirects: "1",
          format: "json",
          titles: query,
        });
        const wikiResp = await fetch(`${WIKIPEDIA_API}?${params}`);
        if (!wikiResp.ok) {
          console.error("Wikipedia API error:", wikiResp.status);
          throw new Error("Wikipedia API error");
        }
        const wikiJson = await wikiResp.json();
        const pages = wikiJson.query?.pages;
        const page = pages ? Object.values(pages)[0] as { extract?: string } : null;
        const extract = page?.extract || "";
        if (!extract) {
          return new Response(JSON.stringify({ error: "No Wikipedia extract found for topic" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // If includeWikipedia is true, we prepend the extract to existing content so AI gets the extra context
        if (includeWikipedia && model !== "wikipedia") {
          content = `${extract}\n\n[Wikipedia extract]\n\n${content || ""}`;
        } else {
          // Model === 'wikipedia' retains previous behavior: replace content with extract
          content = extract;
        }
      } catch (err) {
        console.error("Wikipedia fetch failed:", err);
        return new Response(JSON.stringify({ error: "Wikipedia fetch failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Format grade level for prompts
    const gradeLevelText = gradeLevel
      ? gradeLevel === "university"
        ? "university undergraduate level"
        : gradeLevel === "phd"
          ? "PhD/graduate research level"
          : `grade ${gradeLevel} (ages ${parseInt(gradeLevel) + 5}-${parseInt(gradeLevel) + 6})`
      : "middle school level";

    // Extract question count from instructions if present
    const countMatch = content?.match(/Generate exactly (\d+) items/);
    const requestedCount = countMatch ? parseInt(countMatch[1]) : 16;

    // Get expertise prefix if applicable
    const expertiseApproach = EXPERTISE_APPROACHES[expertise] || "";

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate-flashcards":
        systemPrompt = `You are an expert educator specializing in creating effective flashcards for ${gradeLevelText} students using the principle of active recall. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is the user's specific topic/content. Create flashcards that thoroughly cover what they want to study.

Requirements:
- Focus exclusively on the topic/content provided by the user
- Are appropriate for ${gradeLevelText} comprehension and vocabulary
- Difficulty: ${difficulty || 'medium'} - adjust question complexity accordingly
- Test understanding, not just memorization
- Use clear, concise questions. Avoid "True/False" or "Yes/No" questions unless absolutely necessary for the concept.
- Answers must be distinct and accurate.
- Include hints when helpful
- VARIETY: Mix definitions, cause-and-effect, and application questions.

Return a JSON array of flashcards with this structure: [{"question": "...", "answer": "...", "hint": "..."}]
IMPORTANT: Generate exactly ${requestedCount} flashcards about the user's topic.`;
        userPrompt = `Create exactly ${requestedCount} high-quality active recall flashcards at ${gradeLevelText} with ${difficulty || 'medium'} difficulty. Focus ONLY on this specific topic/content - cover it thoroughly:\n\n${content || topic}`;
        break;

      case "generate-concepts":
        systemPrompt = `You are an expert educator specializing in extracting and explaining key concepts for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is the user's specific topic/content. Extract concepts that are directly relevant to what they want to study.

Requirements:
- Focus exclusively on concepts from the topic/content provided
- Are appropriate for ${gradeLevelText} comprehension and vocabulary
- Difficulty: ${difficulty || 'medium'} - adjust complexity accordingly
- Focus on the core concept, not questions
- Provide clear, concise definitions
- Include practical examples when helpful

Return a JSON array of concepts with this structure: [{"concept": "...", "definition": "...", "example": "..."}]
IMPORTANT: Generate exactly ${requestedCount} concepts from the user's topic.`;
        userPrompt = `Extract exactly ${requestedCount} key concepts at ${gradeLevelText} with ${difficulty || 'medium'} difficulty. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
        break;

      case "generate-quiz":
        systemPrompt = `You are an expert test creator for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is the user's specific topic/content. Create quiz questions that test understanding of what they want to study.

Requirements:
- Focus exclusively on the topic/content provided by the user
- Test understanding at the ${difficulty || 'medium'} difficulty level appropriate for ${gradeLevelText}
- Create varied question types with age-appropriate vocabulary
- DISTRACTORS: Ensure wrong answers (distractors) are plausible and common misconceptions, not obviously wrong answers.
- Avoid "All of the above" or "None of the above" unless used sparingly and effectively.

Return a JSON array with this structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]
The correctAnswer is the index (0-3) of the correct option.
IMPORTANT: Generate exactly ${requestedCount} questions about the user's topic.`;
        userPrompt = `Create a high-quality quiz with ${requestedCount} questions at ${gradeLevelText}. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
        break;

      case "worksheet":
        systemPrompt = `You are an expert worksheet creator for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is the user's specific topic/content. Create worksheet questions that thoroughly cover what they want to study.

Create a comprehensive worksheet with VARIED question types at ${difficulty || 'medium'} difficulty level. Include a MIX of:
- Multiple choice questions (type: "multiple-choice", options: ["A", "B", "C", "D"], correctAnswer: "B")
- True/False questions (type: "true-false", correctAnswer: "True" or "False")
- Fill in the blank (type: "fill-blank", correctAnswer: "answer word")
- Short answer (type: "short-answer", correctAnswer: "expected answer")
- Matching/Select all that apply (type: "matching", options: ["A", "B", "C", "D"], correctAnswer: ["A", "C"])

Return a JSON array with this structure:
[{
  "id": "q1",
  "type": "multiple-choice",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "B",
  "explanation": "...",
  "points": 2
}]

IMPORTANT: 
- Generate exactly ${requestedCount} questions about the user's topic
- STRICTLY mix the question types. Do NOT output only multiple choice.
- Assign 1-3 points based on difficulty
- Make questions appropriate for ${gradeLevelText}
- For "fill-blank", ensure the blank is a single key term.`;
        userPrompt = `Create a comprehensive, varied worksheet with ${requestedCount} questions at ${gradeLevelText}. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
        break;

      case "explain-concept":
        systemPrompt = `You are a patient, expert tutor who explains concepts to ${gradeLevelText} students using the Feynman Technique. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is explaining the user's specific topic/content thoroughly and clearly.

FORMAT:
1. **Simple Definition** - One clear sentence explaining what it is
2. **Why It Matters** - Brief real-world relevance for this age group
3. **How It Works** - Step-by-step breakdown with simple analogies
4. **Example** - A concrete, relatable example
5. **Key Takeaway** - The one thing to remember

RULES:
- Focus on explaining the specific topic/content the user provided
- Use vocabulary appropriate for ${gradeLevelText}
- Use analogies and examples they can relate to
- Keep sentences short and clear
- Use bullet points and numbered lists
- Include visual descriptions when helpful
- Make it engaging and memorable`;
        userPrompt = `Explain this concept clearly and thoroughly for a ${gradeLevelText} student. Focus on this specific topic:\n\n${content || topic}`;
        break;

      case "create-study-plan":
        systemPrompt = `You are an expert learning coach who creates structured study schedules for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is creating a study plan for the user's specific topic/content.

Requirements:
- Create a structured study plan with specific activities
- Focus exclusively on the topic/content provided
- Assign a difficulty level (1-10) to each session based on complexity
- Estimate time in minutes for each session
- Activities must be ACTIONABLE (e.g., "Read pages 10-15 about X", "Complete 3 practice problems on Y"). Avoid generic "Study" or "Read".

Return a JSON array with this structure:
[
  {
    "day": 1,
    "topic": "Sub-topic name",
    "activities": ["Activity 1", "Activity 2"],
    "difficulty": 5, // 1-10 intensity
    "timeMinutes": 45,
    "description": "Brief description of goals"
  }
]

IMPORTANT:
- Generate a 5-7 day plan
- Build complexity gradually (start with lower difficulty)
- Include specific, actionable activities`;
        userPrompt = `Create a structured study plan for a ${gradeLevelText} student. Focus the entire plan on this specific topic:\n\n${content || topic}\n\nReturn ONLY the JSON array.`;
        break;

      case "summarize":
        systemPrompt = `You are an expert at creating concise, memorable summaries appropriate for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is summarizing the user's specific content thoroughly.

Requirements:
- Summarize the specific content provided, not generic information
- Use vocabulary and concepts suitable for ${gradeLevelText}
- Highlight key concepts from the content
- Use bullet points for clarity
- Include important definitions explained at this level
- Note connections between ideas
Keep it concise but comprehensive and age-appropriate.`;
        userPrompt = `Summarize this specific content for a ${gradeLevelText} student. Focus on what's actually in this content:\n\n${content}`;
        break;

      case "practice-problems":
        systemPrompt = `You are an expert problem creator for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is creating practice problems about the user's specific topic/content.

Requirements:
- Create problems directly related to the topic/content provided
- Problems should be appropriate for ${gradeLevelText}
- Include varying difficulty suitable for this level
- Provide step-by-step solutions with age-appropriate explanations
- Include common mistake warnings

Return JSON: [{"problem": "...", "solution": "...", "difficulty": "easy|medium|hard", "tip": "..."}]`;
        userPrompt = `Create practice problems at ${gradeLevelText}. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
        break;

      case "elaborative-interrogation":
        systemPrompt = `You are an expert educator creating "elaborative interrogation" questions for ${gradeLevelText} students. ${expertiseApproach}
 
 CRITICAL: Elaborative interrogation is a proven study technique where learners answer "WHY" and "HOW" questions to deepen understanding.
 
 Your PRIMARY focus is the user's specific topic/content. Create questions that force deep thinking about:
 - WHY things work the way they do
 - HOW processes or concepts function
 - WHY certain relationships exist
 - HOW different parts connect
 
 Requirements:
 - Focus exclusively on the topic/content provided by the user
 - Questions must be appropriate for ${gradeLevelText}
 - Difficulty: ${difficulty || 'medium'} - adjust complexity accordingly
 - Mix of "why" and "how" questions
 - Each question should require explanation, not just recall
 - Hints should guide thinking without giving the answer
 - Ideal answers should be thorough but appropriate for the grade level
 
 Return a JSON array with this structure:
 [{"question": "Why does...?", "type": "why", "hint": "Think about...", "idealAnswer": "Because..."}]
 
 IMPORTANT: Generate exactly ${requestedCount} elaborative questions about the user's topic.`;
        userPrompt = `Create exactly ${requestedCount} elaborative interrogation questions at ${gradeLevelText} with ${difficulty || 'medium'} difficulty. Include a mix of "why" and "how" questions. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
      case "create-cornell-notes":
        systemPrompt = `You are an expert academic tutor who creates perfect Cornell Notes for ${gradeLevelText} students at a ${difficulty || "medium"} difficulty level. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is creating structured Cornell Notes for the user's specific topic/content.

Cornell Notes Structure:
1. **Topic**: The main subject.
2. **Main Ideas / Cues**: Key questions, keywords, or big ideas (Left column).
3. **Notes / Details**: Detailed explanations, definitions, and supporting facts corresponding to the cues (Right column).
4. **Summary**: A concise summary of the entire topic (Bottom section).

Requirements:
- Focus exclusively on the topic/content provided
- Extract 5-10 key main ideas/cues
- Notes must be detailed and informative, using bullet points where appropriate
- Summary must synthesized the core message in 2-3 sentences
- Appropriate vocabulary for ${gradeLevelText}
- Complexity should match ${difficulty || "medium"} level (Easy: simple terms; Expert: deep analysis)
- IF the user provides specific instructions in the content (e.g., "Focus on dates", "Use simple language"), PRIORITIZE them.

Return a JSON object with this structure:
{
  "topic": "The Topic Name",
  "mainIdeas": [
    { "cue": "What is X?", "note": "X is..." },
    { "cue": "Key Principle", "note": "The principle states that..." }
  ],
  "summary": "This topic covers..."
}`;
        userPrompt = `Create structured Cornell Notes for a ${gradeLevelText} student at ${difficulty || "medium"} difficulty. Focus ONLY on this specific topic/content:\n\n${content || topic}\n\nPAY ATTENTION to any "[Instructions: ...]" block if present.\n\nReturn ONLY the JSON object.`;
        break;

      case "vocabulary-cards":
        systemPrompt = `You are an expert vocabulary educator for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Create detailed vocabulary cards for key terms from the user's topic/content.

Each vocabulary card must include:
1. **word**: The vocabulary term (capitalized)
2. **pronunciation**: Phonetic pronunciation with syllable breaks (e.g., "Ee-co-sys-tem")
3. **definition**: A clear, grade-appropriate definition
4. **relatedWords**: 3-5 related/associated words that connect to this term
5. **imagePrompt**: A brief description of what illustration would represent this word

Requirements:
- Focus on the most important vocabulary from the topic
- Definitions must be clear and appropriate for ${gradeLevelText}
- Related words should help build conceptual connections
- Difficulty: ${difficulty || 'medium'}

Return a JSON array:
[{
  "word": "ECOSYSTEM",
  "pronunciation": "Ee-co-sys-tem",
  "definition": "All of the living and nonliving things interacting in an area.",
  "relatedWords": ["Nature", "Community", "Forest", "Habitat", "Biome"],
  "imagePrompt": "trees, animals, sun, and water in a forest scene"
}]

IMPORTANT: Generate exactly ${requestedCount} vocabulary cards.`;
        userPrompt = `Create exactly ${requestedCount} vocabulary cards at ${gradeLevelText} with ${difficulty || 'medium'} difficulty. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
        break;

      default:
        systemPrompt = "You are a helpful study assistant. Help students learn effectively. Focus on the specific topic they provide.";
        userPrompt = content || topic || "How can I study more effectively?";
    }

    const customInstructionBlock = customInstructionText ? `\n\nCUSTOM INSTRUCTION: ${customInstructionText}\nCRITICAL: When provided, follow this custom instruction and prioritize it along with the topic, difficulty, and grade level.` : "";

    systemPrompt += customInstructionBlock;
    userPrompt += customInstructionText ? `\n\nCustom instruction: ${customInstructionText}` : "";

    console.log(`Processing ${action} request with model ${selectedModel}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
