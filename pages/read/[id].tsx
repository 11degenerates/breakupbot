// pages/read.tsx
import { useState } from "react";

export default function ReadPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/get/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lookup failed");

      setMessage(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      {!message && (
        <>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>You have a BreakupBot message.</h1>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="Enter your code"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #ccc", fontSize: 18 }}
              required
            />
            <button
              type="submit"
              disabled={loading || !code}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              {loading ? "Loading…" : "Open"}
            </button>
          </form>
          {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
        </>
      )}

      {message && (
        <article style={{ marginTop: 24, padding: 20, border: "1px solid #eee", borderRadius: 14, boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
          <h2>A message for {message.recipientName}</h2>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 12, fontSize: 18 }}>{message.messageText}</p>
          <p style={{ marginTop: 16, opacity: 0.8 }}>— {message.breakerName || "BreakupBot"}</p>

          <hr style={{ margin: "20px 0" }} />

          <a href="/" style={{ fontSize: 14, textDecoration: "none", border: "1px solid #111", padding: "8px 10px", borderRadius: 10 }}>
            Want to respond? Write your own.
          </a>
        </article>
      )}
    </main>
  );
}
