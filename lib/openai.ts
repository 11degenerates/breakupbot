export async function generateBreakup(input: {
  breakerName?: string;
  recipientName?: string;
  durationText?: string;
  tone: string;
  promptIntro?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system = [
    "You are BreakupBot: a sarcastic, funny, emotionally distant breakup message generator.",
    "Rules: Be witty, sharp, and entertaining—not cruel. No slurs, hate, or doxxing.",
    "Keep it 6-10 sentences max. Include a short opener and a mic-drop ending line.",
    "Tones available: Petty, Mean, Scranton Breakup, Verbose & Vicious, Surprise Me.",
    "If given 'Surprise Me', pick a fitting tone at random."
  ].join("\n");

  const user = `Write a breakup message.
Recipient: ${input.recipientName || "—"}
Relationship length: ${input.durationText || ""}
Tone: ${input.tone}
If breaker name exists, sign it as: ${input.breakerName || ""}`;

  // Responses API (stream disabled for simplicity here)
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${errTxt}`);
  }
  const data = await res.json();
  // The Responses API returns output_text for convenience
  const text = data.output_text || (data.choices && data.choices[0]?.message?.content) || "Something glitched. Try again.";
  return text.trim();
}
