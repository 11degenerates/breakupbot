import type { NextApiRequest, NextApiResponse } from "next";

type Row = {
  id: string;
  breakerName: string | null;
  recipientName: string;
  durationText: string | null;
  tone: string;
  messageText: string;
  createdAt: number;
};

const mem: Map<string, Row> = (globalThis as any).__BB_MEM__ || new Map<string, Row>();
(globalThis as any).__BB_MEM__ = mem;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (typeof id !== "string" || !id.trim()) return res.status(400).json({ error: "Bad id" });

  const row = mem.get(id);
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.status(200).json(row);
}

