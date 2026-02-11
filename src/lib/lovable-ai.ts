export type LovableRole = "system" | "user" | "assistant";

export interface LovableMessage {
  role: LovableRole;
  content: string;
}

export interface LovableChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function getLovableApiKey(): string {
  const key = import.meta.env.VITE_LOVABLE_API_KEY;
  if (!key) {
    throw new Error("Missing VITE_LOVABLE_API_KEY");
  }
  return key;
}

export async function lovableChatCompletion(
  messages: LovableMessage[],
  opts: LovableChatOptions = {}
): Promise<string> {
  const apiKey = getLovableApiKey();

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || "google/gemini-2.5-flash",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Lovable AI request failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}
