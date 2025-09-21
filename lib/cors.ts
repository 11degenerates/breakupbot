// lib/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED = new Set([
  "https://imthebreakupbot.com",
  "https://www.imthebreakupbot.com",
  "https://itsbreakupbot.com",
  "https://www.itsbreakupbot.com",
  "http://localhost:3000",
]);

function pickOrigin(req: NextApiRequest) {
  const o = req.headers.origin || "";
  return ALLOWED.has(o) ? o : "";
}

export function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = pickOrigin(req);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true; // caller should return early
  }
  return false;
}
