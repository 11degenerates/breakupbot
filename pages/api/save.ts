// pages/api/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { store, MessageRow } from "@/lib/store";
import { makeCode } from "@/lib/code";
import { applyCors } from "@/lib/cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return; // OPTIONS handled

  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { breakerName, recipientName, durationText, tone, messageText } = req.body || {};
    if (!recipientName || !messageText || !tone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let code = makeCode();
    for (let i = 0; i < 3; i++) {
      const exists = await store.get(code);
      if (!exists) break;
      code = makeCode();
    }

    const row: MessageRow = {
      code,
      breakerName: breakerName ?? null,
      recipientName,
      durationText: durationText ?? null,
      tone,
      messageText,
      createdAt: Date.now(),
    };

    await store.put(row);
    return res.status(200).json({ code });
  } catch (e: any) {
    return res.status(500).json({ error: "Internal error", detail: String(e?.message || e) });
  }
}
