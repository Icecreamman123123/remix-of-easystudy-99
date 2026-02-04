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
    const { action, content, topic, difficulty, gradeLevel, model, expertise } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Select model (default to gemini-flash)
    const selectedModel = MODEL_MAP[model] || MODEL_MAP["gemini-flash"];

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
- Use clear, concise questions
- Have specific, accurate answers
- Include hints when helpful

Return a JSON array of flashcards with this structure: [{"question": "...", "answer": "...", "hint": "..."}]
IMPORTANT: Generate exactly ${requestedCount} flashcards about the user's topic.`;
        userPrompt = `Create exactly ${requestedCount} flashcards at ${gradeLevelText} with ${difficulty || 'medium'} difficulty. Focus ONLY on this specific topic/content - cover it thoroughly:\n\n${content || topic}`;
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

Return a JSON array with this structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]
The correctAnswer is the index (0-3) of the correct option.
IMPORTANT: Generate exactly ${requestedCount} questions about the user's topic.`;
        userPrompt = `Create a quiz with ${requestedCount} questions at ${gradeLevelText}. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
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
- Use at least 3 different question types
- Assign 1-3 points based on difficulty
- Make questions appropriate for ${gradeLevelText}`;
        userPrompt = `Create a comprehensive worksheet with ${requestedCount} varied questions at ${gradeLevelText}. Focus ONLY on this specific topic/content:\n\n${content || topic}`;
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
        systemPrompt = `You are an expert learning coach who creates structured weekly study schedules for ${gradeLevelText} students. ${expertiseApproach}

CRITICAL: Your PRIMARY focus is creating a study plan for the user's specific topic/content.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

# 📚 Study Schedule: [User's Topic Name]

## Weekly Overview
Brief 1-2 sentence overview of what will be covered about this specific topic.

## Study Schedule

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| Morning (30min) | [Topic-specific activity] | [Topic-specific activity] | [Topic-specific activity] | [Topic-specific activity] | Review all |
| Afternoon (30min) | [Topic-specific activity] | Quiz yourself | [Topic-specific activity] | Mixed practice | Self-test |

## Daily Goals

### Week 1: Foundation
- **Monday**: [Specific goal for this topic]
- **Tuesday**: [Specific goal for this topic]
- **Wednesday**: [Specific goal for this topic]
- **Thursday**: [Specific goal for this topic]
- **Friday**: [Specific goal for this topic]

### Week 2: Reinforcement
- **Monday**: [Specific goal for this topic]
- **Tuesday**: [Specific goal for this topic]
- **Wednesday**: [Specific goal for this topic]
- **Thursday**: [Specific goal for this topic]
- **Friday**: [Specific goal for this topic]

## Review Checkpoints
- [ ] End of Week 1: Can explain basic concepts of this topic
- [ ] End of Week 2: Can solve practice problems about this topic
- [ ] Final: Ready for assessment on this topic

## Study Tips
1. [Specific tip for this topic]
2. [Specific tip for this topic]
3. [Specific tip for this topic]

IMPORTANT:
- All activities must relate to the user's specific topic
- Use appropriate session lengths for ${gradeLevelText} (shorter for younger students)
- Make goals specific and achievable
- Include variety in study methods
- Build complexity gradually`;
        userPrompt = `Create a well-organized weekly study schedule for a ${gradeLevelText} student. Focus the entire plan on this specific topic:\n\n${content || topic}\n\nInclude a table-based weekly schedule with specific daily activities related to this topic.`;
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

      default:
        systemPrompt = "You are a helpful study assistant. Help students learn effectively. Focus on the specific topic they provide.";
        userPrompt = content || topic || "How can I study more effectively?";
    }

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
