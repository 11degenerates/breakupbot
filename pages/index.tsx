import React, { useState, useEffect, useCallback } from 'react';

const TONES = [
  "Petty",
  "Cold",
  "Poetic",
  "Cosmic",
  "Mean",
  "Country Song",
  "Legalese",
  "Therapist Voice",
  "Inspirational Coach",
  "Scranton Breakup",
  "TikTok Breakup",
  "Verbose & Vicious",
  "Surprise Me",
] as const;
type Tone = typeof TONES[number];

// ---------- Cooldown & tries (10-minute lock after 3 attempts) ----------
const DEFAULT_MAX_TRIES = 3;
const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

type TriesState = { count: number; cooldownUntil?: number };

function useCooldownTries(opts?: {
  maxTries?: number;
  cooldownMs?: number;
  storageKey?: string;
}) {
  const maxTries = opts?.maxTries ?? DEFAULT_MAX_TRIES;
  const cooldownMs = opts?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const storageKey = opts?.storageKey ?? "bb_tries_v2";

  const [count, setCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(undefined);
  const [nowTick, setNowTick] = useState(Date.now());

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { count: 0 } as TriesState;
      const t = JSON.parse(raw) as TriesState;
      if (t.cooldownUntil && Date.now() >= t.cooldownUntil) return { count: 0 };
      return t;
    } catch {
      return { count: 0 };
    }
  }, [storageKey]);

  const save = useCallback((t: TriesState) => {
    localStorage.setItem(storageKey, JSON.stringify(t));
  }, [storageKey]);

  useEffect(() => {
    const t = load();
    setCount(t.count || 0);
    setCooldownUntil(t.cooldownUntil);
  }, [load]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const inCooldown = !!cooldownUntil && Date.now() < cooldownUntil;
  const remainingMs = inCooldown ? Math.max(0, cooldownUntil! - nowTick) : 0;

  function msToMMSS(ms: number) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  }

  function noteAttempt() {
    const next = Math.min(maxTries, (count || 0) + 1);
    let nextCooldown = cooldownUntil;
    if (next >= maxTries) nextCooldown = Date.now() + cooldownMs;
    setCount(next);
    setCooldownUntil(nextCooldown);
    save({ count: next, cooldownUntil: nextCooldown });
  }

  function reset() {
    setCount(0);
    setCooldownUntil(undefined);
    save({ count: 0 });
  }

  return {
    tries: count,
    maxTries,
    inCooldown,
    remainingText: inCooldown ? msToMMSS(remainingMs) : "",
    noteAttempt,
    reset,
  };
}
// -----------------------------------------------------------------------

export default function Compose() {
  const [breakerName, setBreakerName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [durationText, setDurationText] = useState("");
  const [tone, setTone] = useState<Tone>(TONES[0]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // cooldown / tries hook
  const {
    tries,
    maxTries,
    inCooldown,
    remainingText,
    noteAttempt,
    reset
  } = useCooldownTries({ maxTries: 3, cooldownMs: 10 * 60 * 1000, storageKey: "bb_tries_v2" });

  async function onGenerateClick() {
    if (inCooldown) return; // blocked during cooldown
    try {
      setLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakerName, recipientName, durationText, tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDraft(data.text);
      // count this attempt (success or fail)
      noteAttempt();
    } catch (e: any) {
      noteAttempt();
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
    reset();
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="h1">BreakupBot <span className="badge">link & reply</span></h1>
          <p className="sub">
            Pick a tone, generate, approve, share a link. The recipient can reply with their own AI-crafted message.
          </p>
          <p className="sub" style={{ marginTop: -6 }}>
            Tries: {tries}/{maxTries}
            {inCooldown ? <> · cooldown: try again in {remainingText}</> : null}
          </p>
        </div>

        <div className="controls">
          <div className="grid">
            <input
              className="input"
              placeholder="Your name (optional)"
              value={breakerName}
              onChange={e => setBreakerName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Recipient's name"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
            />
          </div>

          <input
            className="input"
            placeholder="How long together? (e.g., 2 years, 3 months)"
            value={durationText}
            onChange={e => setDurationText(e.target.value)}
          />

          <select
            className="input"
            value={tone}
            onChange={e => setTone(e.target.value as Tone)}
          >
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={onGenerateClick} disabled={loading || inCooldown}>
              Generate
            </button>
            <button className="btn" onClick={approve} disabled={!draft}>
              Approve &amp; Create Link
            </button>
            <button className="btn" onClick={resetTries}>
              Reset Tries
            </button>
          </div>

          <div className="notice">
            {tries >= maxTries || inCooldown ? (
              <>
                You’ve had three chances. If none worked, maybe you’re the problem.
                {' '}
                But don’t panic — you can try again in 10 minutes. Try to actually end it properly next time.
                {inCooldown ? ` (${remainingText})` : null}
              </>
            ) : (
              <>Retries: {tries}/{maxTries}</>
            )}
          </div>
        </div>

        <div className="controls">
          <div className="pre" style={{ width: '100%', minHeight: 120 }}>
            {draft || "Your draft will appear here..."}
          </div>
        </div>

        {shareUrl && (
          <div className="controls">
            <div className="copy">
              <b>Share link:</b>
              <input className="input" value={shareUrl} readOnly style={{ maxWidth: 480 }} />
              <button className="btn" onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy</button>
            </div>
            <p className="sub">Send this to the recipient. When they open it, they’ll see your message and can reply.</p>
          </div>
        )}

        <div className="footer">© 11 Degenerates — for entertainment only. Powered by OpenAI.</div>
      </div>
    </div>
  );
}
