type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function generateText(messages: ChatMessage[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey || !model) {
    throw new Error("AI is not configured. Set OPENROUTER_API_KEY and AI_MODEL.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "TripleOne Marketing OS",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });

  if (!response.ok) {
    throw new Error(`AI provider error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content as string;
}
