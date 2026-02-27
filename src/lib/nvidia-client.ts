import { OpenAI } from "openai";

// Initialize OpenAI client with NVIDIA endpoint
const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: "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"
});

export { openai };

// Example usage for image processing
export async function processImageWithNVIDIA(imageBase64: string, mimeType: string = 'image/jpeg') {
  try {
    const stream = await openai.chat.completions.create({
      model: "minimaxai/minimax-m2.5",
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
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("NVIDIA image processing error:", error);
    throw error;
  }
}

// Example usage for text generation
export async function generateTextWithNVIDIA(prompt: string, systemPrompt?: string) {
  try {
    const stream = await openai.chat.completions.create({
      model: "minimaxai/minimax-m2.5",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("NVIDIA text generation error:", error);
    throw error;
  }
}
