// pages/read/[id].tsx
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

type Thread = {
  id: string;
  breakerName: string | null;
  recipientName: string;
  durationText: string | null;
  tone: string;
  messageText: string;
  createdAt: number;
};

export default function ReadPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/threads/${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Message not found");
        }
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Link not found</h1>
          <p className="sub">
            This message may have expired or the link is invalid.
          </p>
          <p className="sub" style={{ marginTop: 12 }}>
            Want to make your own?{" "}
            <a href="/">Go to itsbreakupbot.com</a>
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
        <div
          className="pre"
          style={{ whiteSpace: "pre-wrap", marginTop: 12 }}
        >
          {data.messageText}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {data.breakerName ? `—${data.breakerName}` : "—BreakupBot"}
        </p>

        <p className="sub" style={{ marginTop: 20 }}>
          Want to respond?{" "}
          <a href="/">Generate your own at itsbreakupbot.com</a>.
        </p>

        <div className="footer">
          © 11 Degenerates — for entertainment only.
        </div>
      </div>
    </div>
  );
}
