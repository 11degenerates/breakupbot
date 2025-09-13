import Redis from "ioredis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Vercel KV (Upstash) has a REST interface; ioredis can speak it via 'rediss' URLs,
// but the REST pair is easier to use with fetch. We'll implement minimal helpers.

type ThreadMessage = {
  id: string;
  role: "breaker" | "recipient";
  tone: string;
  text: string;
  createdAt: number;
};

export type Thread = {
  id: string;
  slug: string;
  breakerName?: string;
  recipientName?: string;
  durationText?: string;
  tone: string;
  messageText: string;
  createdAt: number;
  views: number;
  replyCount: number;
  status: "open" | "locked" | "expired";
  messages: ThreadMessage[];
};

// Minimal KV using Upstash REST API
async function kvGet<T=any>(key: string): Promise<T | null> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
  });
  const data = await res.json();
  if (data.result == null) return null;
  try { return JSON.parse(data.result); } catch { return data.result; }
}

async function kvSet(key: string, value: any): Promise<void> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
  });
  await res.json();
}

export async function getThread(slug: string): Promise<Thread | null> {
  return await kvGet<Thread>(`thread:${slug}`);
}

export async function putThread(thread: Thread): Promise<void> {
  await kvSet(`thread:${thread.slug}`, thread);
}
