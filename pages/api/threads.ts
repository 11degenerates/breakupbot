// pages/api/threads.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type ThreadBody = {
  breakerName?: string;
  recipientName: string;
  durationText?: string;
  tone: string;
  messageText: string;
};

// TEMP storage so links work in one deployment (use a real DB later)
const mem = (globalThis as any).__BB_MEM__ || new Map<string, any>();
(globalThis as any).__BB_MEM__ = mem;

function baseUrlFromReq(req: NextApiRequest) {
  // Prefer explicit env; otherwise infer from headers (Vercel-friendly)
  const fromEnv = process.env.SITE_URL?.trim();
  if (fromEnv) return fromEnv;

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.headers["x-forwarded-protocol"] as string) ||
    "https";
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "localhost:3000";
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { breakerName, recipientName, durationText, tone, messageText } = req.body as ThreadBody;

    if (!recipientName || !tone || !messageText) {
      return res.status(400).json({ error: "Missing required fields: recipientName, tone, messageText" });
    }

    const id = crypto.randomUUID();

    // store the payload for the read page
    mem.set(id, {
      id,
      breakerName: breakerName || null,
      recipientName,
      durationText: durationText || null,
      tone,
      messageText,
      createdAt: Date.now(),
    });

    const base = baseUrlFromReq(req);
    // Build a fully-qualified URL safely
 // inside handler after you create `id` and `base`
const readUrl = new URL(`/read/${encodeURIComponent(id)}`, base).toString();
return res.status(200).json({ id, readUrl });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
