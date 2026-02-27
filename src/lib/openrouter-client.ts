import { OpenRouter } from "@openrouter/sdk";

// Initialize OpenRouter with your API key
const openrouter = new OpenRouter({
  apiKey: "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"
});

// Example usage for image processing
export async function processImageWithOpenRouter(imageBase64: string, mimeType: string = 'image/jpeg') {
  try {
    const stream = await openrouter.chat.send({
      model: "qwen/qwen3-vl-235b-a22b-thinking",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "What is in this image?"
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("OpenRouter image processing error:", error);
    throw error;
  }
}

// Example usage for text generation
export async function generateTextWithOpenRouter(prompt: string, systemPrompt?: string) {
  try {
    const stream = await openrouter.chat.send({
      model: "qwen/qwen3-vl-235b-a22b-thinking",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("OpenRouter text generation error:", error);
    throw error;
  }
}

export { openrouter };
