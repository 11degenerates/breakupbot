export async function generateBreakup(input: {
  breakerName?: string;
  recipientName?: string;
  durationText?: string;
  tone: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Hard guardrails: edgy but no hate/harassment
  const banned = [
    "I hope you can take a moment",
    "with an open heart",
    "it's not about blaming",
    "I appreciate the time",
    "Sincerely,",
    "I wish you the best",
    "new beginnings",
    "this is about growth",
    "we’ve grown apart",
    "I’m grateful for",
    "thank you for",
  ].join(" | ");

  const toneGuide = [
    "- Petty: playful jabs, eye-roll energy, witty digs; never hateful.",
    "- Cold: clipped, minimal empathy, decisive; no warmth.",
    "- Poetic: lyrical imagery and metaphor; short lines allowed.",
    "- Cosmic: fate/time/entropy jokes; zoom out to the universe.",
    "- Mean: sharp sarcasm and bite; cut without slurs or cruelty toward protected classes.",
    "- Country Song: story vibe, plainspoken, a hint of twang; no phony dialect.",
    "- Legalese: faux-contract voice; clauses, hereby/whereas, termination language.",
    "- Therapist Voice: boundary-forward but still snarky; no soft clichés.",
    "- Inspirational Coach: hype, clarity, forward focus, a little roast.",
    "- Scranton Breakup: dry, mock-corporate/blue-collar sarcasm.",
    "- TikTok Breakup: short punchy lines, internet cadence, side-eye humor.",
    "- Verbose & Vicious: ornate flourish + biting wit (no slurs).",
    "- Surprise Me: pick the best fit above."
  ].join("\n");

  const system = [
    "You are BreakupBot: sarcastic, funny, emotionally distant.",
    "Write a breakup that **pushes the line** (snarky/mean/funny) without hate or doxxing.",
    "",
    "Style rules:",
    "• LENGTH: 7–10 sentences, one dense paragraph (~140–220 words).",
    "• Include a punchy opener and a mic-drop closing line.",
    "• Obey the chosen Tone exactly (see Tone Guide). If 'Surprise Me', pick the best fit.",
    "• No therapy clichés. No ‘Sincerely’. No Hallmark vibes. No apologies unless mocking.",
    "• Avoid these phrases entirely: " + banned,
    "• No slurs, bigotry, threats, sexual content, or personal data.",
    "• Keep it sendable but savage: witty, specific, memorable.",
    "",
    "Tone Guide:",
    toneGuide,
    "",
    "If output is under 6 sentences, KEEP WRITING until the length rule is met."
  ].join("\n");

  // Few-shot examples to steer away from polite tone:
  const examplePettyUser = "Write a breakup. Tone: Petty. Recipient: Taylor. Relationship length: 8 months. Sign as: —";
  const examplePettyAssistant =
    "Taylor, consider this the unsubscribe link you’ve been ignoring. Eight months in and your greatest hits were ‘forgot my wallet’ and ‘what’s your Netflix password?’ I’m retiring from carrying conversations, plans, and your sense of time. You treat effort like a limited edition drop and somehow never check out. I want chemistry, not customer service. So congrats: you’re free to ghost in peace, and I’m free to stop pretending that ‘busy’ is a personality. Keep the hoodies; I’m keeping my Saturdays. Door’s closed—try the knob labeled ‘self-awareness’ on your way out.";

  const exampleLegalUser = "Write a breakup. Tone: Legalese. Recipient: Jordan. Relationship length: 2 years. Sign as: —";
  const exampleLegalAssistant =
    "WHEREAS, the undersigned (me) and Jordan (you) entered into a Relationship Agreement circa two years ago; and WHEREAS, recurring defects have been observed in punctuality, accountability, and dishwashing; NOW, THEREFORE, be it resolved that this agreement is terminated effective immediately, for cause. Consider this notice final; no cure period will be granted. All shared memes revert to the original sender, and custody of the Spotify queue transfers to me in perpetuity. Future communications shall be limited to logistics and the return of the air fryer. Kindly acknowledge receipt by not texting at 2:11 a.m. again.";

  const user = [
    "Write a breakup message.",
    `Recipient: ${input.recipientName || "—"}`,
    `Relationship length: ${input.durationText || "—"}`,
    `Tone: ${input.tone}`,
    input.breakerName ? `Sign as: ${input.breakerName}` : ""
  ].join("\n");

  const payload = {
    model,
    temperature: 0.95,
    top_p: 0.9,
    presence_penalty: 0.3,
    max_output_tokens: 450,
    input: [
      { role: "system", content: system },
      { role: "user", content: examplePettyUser },
      { role: "assistant", content: examplePettyAssistant },
      { role: "user", content: exampleLegalUser },
      { role: "assistant", content: exampleLegalAssistant },
      { role: "user", content: user }
    ]
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data: any = null;
  try { data = await res.json(); } catch { throw new Error("OpenAI returned a non-JSON response."); }
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    throw new Error(`OpenAI error: ${res.status} ${msg}`);
  }

  const fromOutputArray = () => {
    if (!Array.isArray(data.output)) return "";
    try {
      return data.output
        .map((part: any) =>
          Array.isArray(part?.content)
            ? part.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
            : ""
        )
        .join("\n")
        .trim();
    } catch { return ""; }
  };

  const text =
    (typeof data.output_text === "string" && data.output_text.trim()) ||
    fromOutputArray() ||
    (data.choices && data.choices[0]?.message?.content) ||
    "";

  return (text || "The model did not return any text. Please try again.").trim();
}
