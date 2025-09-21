// pages/read.tsx
export default function ReadPage() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>You have a BreakupBot message.</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>This is the new, permanent lookup page.</p>

      <label htmlFor="code" style={{ display: "block", fontSize: 14, opacity: 0.8, marginBottom: 6 }}>
        Enter your code
      </label>
      <input
        id="code"
        placeholder="e.g., 3742"
        disabled
        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ccc", fontSize: 18 }}
      />
      <small style={{ display: "block", marginTop: 8, opacity: 0.7 }}>
        (We’ll wire this input in the next step.)
      </small>
    </main>
  );
}
