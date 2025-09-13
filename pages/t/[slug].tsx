import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { getThread, Thread } from '../../lib/kv';

const RECIPIENT_TONES = ["Devastated", "Sarcastic", "Unbothered", "Legalese", "Therapist Voice", "Surprise Me"];

type Props = { thread: Thread | null };

export default function ThreadView({ thread }: Props) {
  const [tone, setTone] = useState(RECIPIENT_TONES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (!thread) return <div className="container"><p>Thread not found or expired.</p></div>;

  async function reply() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/reply?slug=${thread.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setOk(true);
      location.href = `/t/${thread.slug}`; // refresh to show updated thread
    } catch(e:any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="h1">Thread</h1>
          <p className="sub">Original message + replies.</p>
        </div>
        <div className="controls">
          <div style={{width:'100%'}}>
            <div className="pre"><b>Original:</b>\n\n{thread.messageText}</div>
            {thread.messages?.length ? (
              <div style={{marginTop:12}} className="pre">
                <b>Replies:</b>\n\n
                {thread.messages.map(m => `— ${m.role} (${m.tone}) @ ${new Date(m.createdAt).toLocaleString()}:\n${m.text}\n\n`)}
              </div>
            ) : <p className="sub">No replies yet.</p>}
          </div>
        </div>
        <div className="controls">
          <select className="input" value={tone} onChange={e=>setTone(e.target.value)}>
            {RECIPIENT_TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn" onClick={reply} disabled={loading}>Reply with BreakupBot</button>
          {error && <p className="sub" style={{color:'#ff9aa9'}}>{error}</p>}
          {ok && <p className="sub">Reply sent.</p>}
        </div>
        <div className="footer">© 11 Degenerates — for entertainment only.</div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = String(params?.slug || "");
  const thread = await getThread(slug);
  return { props: { thread } };
};
