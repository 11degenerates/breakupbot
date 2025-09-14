export async function generateBreakup(input: {
  breakerName?: string;
  recipientName?: string;
  durationText?: string;
  tone: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const toneGuide = [
    "- Petty: small jabs, eye-roll energy; playful, not hateful.",
    "- Cold: minimal emotion, clinical phrasing, decisive.",
    "- Poetic: lyrical imagery, metaphor, short lines allowed.",
    "- Cosmic: big-universe perspective, fate/time/entropy themes.",
    "- Mean: sharp sarcasm; cut without slurs or harassment.",
    "- Country Song: a touch of twang, story vibe, no fake dialect.",
    "- Legalese: faux-contract language, clauses, hereby/whereas.",
    "- Therapist Voice: gentle I-statements, boundaries, validation.",
    "- Inspirational Coach: motivational tone, clarity, forward focus.",
    "- Scranton Breakup: dry, mock-corporate, blue-collar sarcasm.",
    "- TikTok Breakup: breezy, pop-internet cadence, short punchy lines.",
    "- Verbose & Vicious: long-winded flourish, biting wit (no slurs).",
    "- Surprise Me: you pick the best fit among the above."
  ].join("\n");

  const system = [
    "You are BreakupBot: a sarcastic, funny, emotionally distant breakup message generator.",
    "Rules:",
    "• Be witty, sharp, and entertaining — never hateful. No slurs, bigotry, doxxing, threats, or sexual content.",
    "• 6–10 sentences max. Keep momentum. Include a short opener and a mic-drop closer.",
    "• Honor the selected Tone precisely. If 'Surprise Me', choose the most fitting style from the guide.",
    "• You may reference the relationship length if given.",
    "• Optionally sign with the breaker’s name if provided.",
    "",
    "Tone Guide:",
    toneGuide
  ].join("\n");

  const user = [
    "Write a breakup message.",
    `Recipient: ${input.recipientName || "—"}`,
    `Relationship length: ${input.durationText || "—"}`,
    `Tone: ${input.tone}`,
    input.breakerName ? `Sign as: ${input.breakerName}` : ""
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error("OpenAI returned a non-JSON response.");
  }

  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    throw new Error(`OpenAI error: ${res.status} ${msg}`);
  }

  // Robust text extraction for the Responses API
  const fromOutputArray = () => {
    if (!Array.isArray(data.output)) return "";
    try {
      return data.output
        .map((part: any) =>
          Array.isArray(part?.content)
            ? part.content.map((c: any) => c?.text ?? "").join("")
            : ""
        )
        .join("\n")
        .trim();
    } catch {
      return "";
    }
  };

  const text =
    (typeof data.output_text === "string" && data.output_text.trim()) ||
    fromOutputArray() ||
    (data.choices && data.choices[0]?.message?.content) || // extra fallback
    "";

  return (text || "The model did not return any text. Please try again.").trim();
}
