// pages/read/[id].tsx
import React from "react";
import { useRouter } from "next/router";

type Thread = {
  id?: string;
  breakerName: string | null;
  recipientName: string;
  durationText: string | null;
  tone: string;
  messageText: string;
  createdAt?: number;
};

export default function ReadPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = React.useState<Thread | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id || typeof id !== "string") return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/threads/${encodeURIComponent(id)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Not found");
        setData(json);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Error");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Link not found</h1>
          <p className="sub">This message may have expired or the link is invalid.</p>
          <p className="sub" style={{ marginTop: 12 }}>
            Want to make your own? <a href="/">Go to itsbreakupbot.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">A message for {data.recipientName}</h1>
        <p className="sub">
          Tone: {data.tone}
          {data.durationText ? ` · Together: ${data.durationText}` : ""}
        </p>
        <div className="pre" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
          {data.messageText}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {data.breakerName ? `—${data.breakerName}` : "—BreakupBot"}
        </p>

        <p className="sub" style={{ marginTop: 20 }}>
          Want to respond? <a href="/">Generate your own at itsbreakupbot.com</a>.
        </p>

        <div className="footer">© 11 Degenerates — for entertainment only.</div>
      </div>
    </div>
  );
}
