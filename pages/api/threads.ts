import type { NextApiRequest, NextApiResponse } from 'next';
import { putThread, Thread } from '../../lib/kv';
import { makeSlug } from '../../utils/slug';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { breakerName, recipientName, durationText, tone, messageText } = req.body || {};
    if (!messageText) return res.status(400).json({ error: 'Missing message' });
    const slug = makeSlug(11);
    const thread: Thread = {
      id: crypto.randomUUID(),
      slug,
      breakerName,
      recipientName,
      durationText,
      tone,
      messageText,
      createdAt: Date.now(),
      views: 0,
      replyCount: 0,
      status: "open",
      messages: []
    };
    await putThread(thread);
    const base = process.env.SITE_URL || 'http://localhost:3000';
    return res.status(200).json({
      readUrl: `${base}/m/${slug}`,
      threadUrl: `${base}/t/${slug}`
    });
  } catch (e:any) {
    return res.status(500).json({ error: e.message || 'Error' });
  }
}
