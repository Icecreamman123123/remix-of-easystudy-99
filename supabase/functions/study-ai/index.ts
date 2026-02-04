import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model mapping
const MODEL_MAP: Record<string, string> = {
  "gemini-flash": "google/gemini-3-flash-preview",
  "gemini-pro": "google/gemini-2.5-pro",
  "gemini-3-pro": "google/gemini-3-pro-preview",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-flash-lite": "google/gemini-2.5-flash-lite",
  "gpt-5-nano": "openai/gpt-5-nano",
  "gpt-5-mini": "openai/gpt-5-mini",
  "gpt-5": "openai/gpt-5",
  "gpt-5.2": "openai/gpt-5.2",
  "gpt-4": "openai/gpt-5-mini", // GPT-4 equivalent mapped to GPT-5 Mini
  "claude-3": "google/gemini-2.5-pro", // Claude equivalent mapped to Gemini Pro
};

// Expertise system prompt prefixes
const EXPERTISE_PROMPTS: Record<string, string> = {
  "general": "",
  "math": "You are an expert mathematics tutor specializing in algebra, calculus, geometry, statistics, and mathematical problem-solving. Focus on step-by-step solutions, mathematical notation, and building mathematical intuition. ",
  "science": "You are an expert science educator specializing in physics, chemistry, biology, and earth sciences. Focus on scientific method, experiments, formulas, and real-world applications. ",
  "language": "You are an expert language arts tutor specializing in literature, writing, grammar, vocabulary, and literary analysis. Focus on clear writing, reading comprehension, and literary techniques. ",
  "history": "You are an expert history and social studies educator specializing in world history, geography, civics, and cultural studies. Focus on historical context, cause-and-effect relationships, and primary sources. ",
  "code": "You are an expert programming tutor specializing in computer science fundamentals, algorithms, data structures, and coding best practices. Focus on code examples, debugging, and computational thinking. ",
  "medicine": "You are an expert medical educator specializing in anatomy, physiology, pharmacology, and clinical sciences. Focus on medical terminology, diagnostic reasoning, and evidence-based medicine. ",
  "business": "You are an expert business educator specializing in economics, finance, marketing, and management. Focus on real-world case studies, financial concepts, and strategic thinking. ",
  "music": "You are an expert music educator specializing in music theory, composition, history, and performance. Focus on musical notation, ear training, and understanding musical structures. ",
  "psychology": "You are an expert psychology educator specializing in cognitive psychology, behavioral science, and mental health. Focus on research methods, psychological theories, and practical applications. ",
  "law": "You are an expert legal educator specializing in constitutional law, legal reasoning, and case analysis. Focus on legal terminology, precedent analysis, and critical thinking about legal issues. ",
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
    const expertisePrefix = EXPERTISE_PROMPTS[expertise] || "";
    
    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate-flashcards":
        systemPrompt = `${expertisePrefix}You are an expert educator specializing in creating effective flashcards for ${gradeLevelText} students using the principle of active recall. Create flashcards that:
- Are appropriate for ${gradeLevelText} comprehension and vocabulary
- Difficulty: ${difficulty || 'medium'} - adjust question complexity accordingly
- Test understanding, not just memorization
- Use clear, concise questions
- Have specific, accurate answers
- Include hints when helpful
Return a JSON array of flashcards with this structure: [{"question": "...", "answer": "...", "hint": "..."}]
IMPORTANT: Generate exactly ${requestedCount} flashcards.`;
        userPrompt = `Create exactly ${requestedCount} flashcards at ${gradeLevelText} with ${difficulty || 'medium'} difficulty covering the key concepts for this topic/content:\n\n${content || topic}`;
        break;

      case "generate-concepts":
        systemPrompt = `${expertisePrefix}You are an expert educator specializing in extracting and explaining key concepts for ${gradeLevelText} students. Create concept cards that:
- Are appropriate for ${gradeLevelText} comprehension and vocabulary
- Difficulty: ${difficulty || 'medium'} - adjust complexity accordingly
- Focus on the core concept, not questions
- Provide clear, concise definitions
- Include practical examples when helpful
Return a JSON array of concepts with this structure: [{"concept": "...", "definition": "...", "example": "..."}]
IMPORTANT: Generate exactly ${requestedCount} concepts.`;
        userPrompt = `Extract exactly ${requestedCount} key concepts at ${gradeLevelText} with ${difficulty || 'medium'} difficulty from this topic/content:\n\n${content || topic}`;
        break;

      case "generate-quiz":
        systemPrompt = `${expertisePrefix}You are an expert test creator for ${gradeLevelText} students. Generate a quiz that tests understanding at the ${difficulty || 'medium'} difficulty level appropriate for ${gradeLevelText}. Create varied question types with age-appropriate vocabulary.
Return a JSON array with this structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]
The correctAnswer is the index (0-3) of the correct option.
IMPORTANT: Generate exactly ${requestedCount} questions.`;
        userPrompt = `Create a quiz about this topic at ${gradeLevelText}:\n\n${content || topic}`;
        break;

      case "worksheet":
        systemPrompt = `${expertisePrefix}You are an expert worksheet creator for ${gradeLevelText} students. Create a comprehensive worksheet with VARIED question types at ${difficulty || 'medium'} difficulty level. Include a MIX of:
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
- Generate exactly ${requestedCount} questions
- Use at least 3 different question types
- Assign 1-3 points based on difficulty
- Make questions appropriate for ${gradeLevelText}`;
        userPrompt = `Create a comprehensive worksheet with ${requestedCount} varied questions at ${gradeLevelText} about:\n\n${content || topic}`;
        break;

      case "explain-concept":
        systemPrompt = `${expertisePrefix}You are a patient, expert tutor who explains concepts to ${gradeLevelText} students using the Feynman Technique. Your explanations should be:

FORMAT:
1. **Simple Definition** - One clear sentence explaining what it is
2. **Why It Matters** - Brief real-world relevance for this age group
3. **How It Works** - Step-by-step breakdown with simple analogies
4. **Example** - A concrete, relatable example
5. **Key Takeaway** - The one thing to remember

RULES:
- Use vocabulary appropriate for ${gradeLevelText}
- Use analogies and examples they can relate to
- Keep sentences short and clear
- Use bullet points and numbered lists
- Include visual descriptions when helpful
- Make it engaging and memorable`;
        userPrompt = `Explain this concept clearly for a ${gradeLevelText} student:\n\n${content || topic}`;
        break;

      case "create-study-plan":
        systemPrompt = `${expertisePrefix}You are an expert learning coach who creates structured weekly study schedules for ${gradeLevelText} students. Create a clean, organized study schedule in Markdown.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

# 📚 Study Schedule: [Topic Name]

## Weekly Overview
Brief 1-2 sentence overview of what will be covered.

## Study Schedule

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| Morning (30min) | Topic A: Review basics | Topic A: Practice | Topic B: Introduction | Topic B: Examples | Review all |
| Afternoon (30min) | Topic A: Examples | Quiz yourself | Topic B: Deep dive | Mixed practice | Self-test |

## Daily Goals

### Week 1: Foundation
- **Monday**: [Specific goal]
- **Tuesday**: [Specific goal]
- **Wednesday**: [Specific goal]
- **Thursday**: [Specific goal]
- **Friday**: [Specific goal]

### Week 2: Reinforcement
- **Monday**: [Specific goal]
- **Tuesday**: [Specific goal]
- **Wednesday**: [Specific goal]
- **Thursday**: [Specific goal]
- **Friday**: [Specific goal]

## Review Checkpoints
- [ ] End of Week 1: Can explain basic concepts
- [ ] End of Week 2: Can solve practice problems
- [ ] Final: Ready for assessment

## Study Tips
1. [Specific tip for this topic]
2. [Specific tip for this topic]
3. [Specific tip for this topic]

IMPORTANT:
- Use appropriate session lengths for ${gradeLevelText} (shorter for younger students)
- Make goals specific and achievable
- Include variety in study methods
- Build complexity gradually`;
        userPrompt = `Create a well-organized weekly study schedule for a ${gradeLevelText} student studying:\n\n${content || topic}\n\nInclude a table-based weekly schedule with specific daily activities.`;
        break;

      case "summarize":
        systemPrompt = `${expertisePrefix}You are an expert at creating concise, memorable summaries appropriate for ${gradeLevelText} students. Create a summary that:
- Uses vocabulary and concepts suitable for ${gradeLevelText}
- Highlights key concepts
- Uses bullet points for clarity
- Includes important definitions explained at this level
- Notes connections between ideas
Keep it concise but comprehensive and age-appropriate.`;
        userPrompt = `Summarize this content for a ${gradeLevelText} student:\n\n${content}`;
        break;

      case "practice-problems":
        systemPrompt = `${expertisePrefix}You are an expert problem creator for ${gradeLevelText} students. Generate practice problems that build understanding progressively and are appropriate for ${gradeLevelText}. Include:
- Problems of varying difficulty suitable for this level
- Step-by-step solutions with age-appropriate explanations
- Common mistake warnings
Return JSON: [{"problem": "...", "solution": "...", "difficulty": "easy|medium|hard", "tip": "..."}]`;
        userPrompt = `Create practice problems at ${gradeLevelText} for:\n\n${content || topic}`;
        break;

      default:
        systemPrompt = "You are a helpful study assistant. Help students learn effectively.";
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
