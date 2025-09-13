import type { NextApiRequest, NextApiResponse } from 'next';
import { generateBreakup } from '../../lib/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { breakerName, recipientName, durationText, tone } = req.body || {};
    if (!tone) return res.status(400).json({ error: 'Missing tone' });
    const text = await generateBreakup({ breakerName, recipientName, durationText, tone });
    return res.status(200).json({ text });
  } catch (e:any) {
    return res.status(500).json({ error: e.message || 'OpenAI error' });
  }
}
