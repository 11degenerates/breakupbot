import type { NextApiRequest, NextApiResponse } from 'next';
import { getThread, putThread } from '../../lib/kv';
import { generateBreakup } from '../../lib/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const slug = String(req.query.slug || '');
    const { tone } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'Missing slug' });
    if (!tone) return res.status(400).json({ error: 'Missing tone' });
    const thread = await getThread(slug);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const replyText = await generateBreakup({
      tone,
      recipientName: thread.breakerName || "—",
      breakerName: thread.recipientName || "",
      durationText: thread.durationText || ""
    });

    thread.messages.push({
      id: crypto.randomUUID(),
      role: "recipient",
      tone,
      text: replyText,
      createdAt: Date.now()
    });
    thread.replyCount = (thread.replyCount || 0) + 1;
    await putThread(thread);
    return res.status(200).json({ ok: true });
  } catch (e:any) {
    return res.status(500).json({ error: e.message || 'Error' });
  }
}
