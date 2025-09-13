import { useState, useEffect } from 'react';

const TONES = ["Petty", "Mean", "Scranton Breakup", "Verbose & Vicious", "Surprise Me"];

export default function Compose() {
  const [breakerName, setBreakerName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [durationText, setDurationText] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [draft, setDraft] = useState("");
  const [tries, setTries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const MAX_TRIES = 3;

  useEffect(() => {
    const t = Number(localStorage.getItem('bb_retries') || '0');
    setTries(t);
  }, []);

  async function generate() {
    if (tries >= MAX_TRIES) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakerName, recipientName, durationText, tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDraft(data.text);
      const nextTries = (Number(localStorage.getItem('bb_retries') || '0') + 1);
      localStorage.setItem('bb_retries', String(nextTries));
      setTries(nextTries);
    } catch (e:any) {
      alert(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!draft) return;
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breakerName, recipientName, durationText, tone, messageText: draft })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Error'); return; }
    setShareUrl(data.readUrl);
  }

  function resetTries() {
    localStorage.removeItem('bb_retries');
    setTries(0);
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="h1">BreakupBot <span className="badge">link & reply</span></h1>
          <p className="sub">Pick a tone, generate, approve, share a link. The recipient can reply with their own AI-crafted message.</p>
        </div>
        <div className="controls">
          <div className="grid">
            <input className="input" placeholder="Your name (optional)" value={breakerName} onChange={e=>setBreakerName(e.target.value)} />
            <input className="input" placeholder="Recipient's name" value={recipientName} onChange={e=>setRecipientName(e.target.value)} />
          </div>
          <input className="input" placeholder="How long together? (e.g., 2 years, 3 months)" value={durationText} onChange={e=>setDurationText(e.target.value)} />
          <select className="input" value={tone} onChange={e=>setTone(e.target.value)}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn" onClick={generate} disabled={loading || tries>=MAX_TRIES}>Generate</button>
            <button className="btn" onClick={approve} disabled={!draft}>Approve & Create Link</button>
            <button className="btn" onClick={resetTries}>Reset Tries</button>
          </div>
          <div className="notice">Retries: {tries}/{MAX_TRIES} {tries>=MAX_TRIES && "— You’ve had three chances. If none worked, maybe you’re the problem."}</div>
        </div>
        <div className="controls">
          <div className="pre" style={{width:'100%', minHeight:120}}>{draft || "Your draft will appear here..."}</div>
        </div>
        {shareUrl && (
          <div className="controls">
            <div className="copy">
              <b>Share link:</b>
              <input className="input" value={shareUrl} readOnly style={{maxWidth:480}}/>
              <button className="btn" onClick={()=>navigator.clipboard.writeText(shareUrl)}>Copy</button>
            </div>
            <p className="sub">Send this to the recipient. When they open it, they’ll see your message and can reply.</p>
          </div>
        )}
        <div className="footer">© 11 Degenerates — for entertainment only. Powered by OpenAI.</div>
      </div>
    </div>
  );
}
