import React, { useState, useEffect, useCallback } from "react";

/** ====== CONFIG ====== */
const BASE_URL = "https://itsbreakupbot.com"; // change if your domain differs

/** ====== ENCODED LINK HELPERS ====== */
function toBase64Utf8(s: string) {
  return btoa(
    encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function makeShareUrl({
  base = BASE_URL,
  recipientName,
  breakerName,
  durationText,
  tone,
  messageText,
}: {
  base?: string;
  recipientName: string;
  breakerName?: string | null;
  durationText?: string | null;
  tone: string;
  messageText: string;
}) {
  const payload = {
    recipientName,
    breakerName: breakerName || null,
    durationText: durationText || null,
    tone,
    messageText,
  };
  const d = toBase64Utf8(JSON.stringify(payload));
  return `${base.replace(/\/+$/, "")}/read?d=${d}`;
}

/** ====== TONES ====== */
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
type Tone = (typeof TONES)[number];

/** ====== COOLDOWN / TRIES HOOK ====== */
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
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(
    undefined
  );
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

  const save = useCallback(
    (t: TriesState) => {
      localStorage.setItem(storageKey, JSON.stringify(t));
    },
    [storageKey]
  );

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

/** ====== MAIN COMPONENT ====== */
export default function Compose() {
  const [breakerName, setBreakerName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [durationText, setDurationText] = useState("");
  const [tone, setTone] = useState<Tone>(TONES[0]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // cooldown / tries hook
  const { tries, maxTries, inCooldown, remainingText, noteAttempt, reset } =
    useCooldownTries({
      maxTries: 3,
      cooldownMs: 10 * 60 * 1000,
      storageKey: "bb_tries_v2",
    });

  async function onGenerateClick() {
    if (inCooldown) return; // blocked during cooldown
    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakerName, recipientName, durationText, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDraft(data.text);
      noteAttempt(); // count this attempt (success or fail)
    } catch (e: any) {
      noteAttempt();
      alert(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  /** Approve & Create Link — encoded URL (no backend needed) */
  async function approve() {
    if (!draft) return;
    const url = makeShareUrl({
      base: BASE_URL,
      recipientName,
      breakerName,
      durationText,
      tone,
      messageText: draft,
    });
    setShareUrl(url);
    setCopied(false);
  }

  function resetTries() {
    reset();
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="h1">
            BreakupBot <span className="badge">link &amp; reply</span>
          </h1>
          <p className="sub">
            Pick a tone, generate, approve, share a link. The recipient can
            reply with their own AI-crafted message.
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
              onChange={(e) => setBreakerName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Recipient's name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <input
            className="input"
            placeholder="How long together? (e.g., 2 years, 3 months)"
            value={durationText}
            onChange={(e) => setDurationText(e.target.value)}
          />

          <select
            className="input"
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                You’ve had three chances. If none worked, maybe you’re the
                problem. But don’t panic — you can try again in 10 minutes. Try
                to actually end it properly next time.
                {inCooldown ? ` (${remainingText})` : null}
              </>
            ) : (
              <>Retries: {tries}/{maxTries}</>
            )}
          </div>
        </div>

        <div className="controls">
          <div className="pre" style={{ width: "100%", minHeight: 120 }}>
            {draft || "Your draft will appear here..."}
          </div>
        </div>

        {shareUrl && (
          <div className="controls">
            <div className="copy" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <b>Share link:</b>
              <input
                className="input"
                value={shareUrl}
                readOnly
                style={{ maxWidth: 480 }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button className="btn" onClick={copyShareUrl}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="sub">
              Send this to the recipient. When they open it, they’ll see your message and can reply.
            </p>
          </div>
        )}

        <div className="footer">
          © 11 Degenerates — for entertainment only. Powered by OpenAI.
        </div>
      </div>
    </div>
  );
}
