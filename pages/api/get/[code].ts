// pages/api/get/[code].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { store } from "@/lib/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing or invalid code" });
    }

    const msg = await store.get(code);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json(msg);
  } catch (e: any) {
    return res.status(500).json({ error: "Internal error", detail: String(e?.message || e) });
  }
}

