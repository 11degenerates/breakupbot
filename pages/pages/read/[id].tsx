import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

type Props = {
  messageText: string | null;
  breakerName: string | null;
  recipientName: string | null;
  tone: string | null;
  durationText: string | null;
};

export default function ReadPage({ messageText, breakerName, recipientName, tone, durationText }: Props) {
  const router = useRouter();

  if (!messageText) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Link not found</h1>
          <p className="sub">This breakup message might have expired or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">💔 You’ve been dumped</h1>
        <p className="sub">Delivered with style by BreakupBot.com</p>
        <div className="pre" style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
          {messageText}
        </div>
        <div className="meta" style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>
          {breakerName ? `— ${breakerName}` : "— BreakupBot"}
        </div>
        <div className="footer" style={{ marginTop: "2rem" }}>
          <p>
            Tone: <b>{tone || "Unknown"}</b> • Together: <b>{durationText || "Unknown"}</b>
          </p>
        </div>
      </div>
    </div>
  );
}

// This runs on the server for every read/[id] request
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;

  try {
    const res = await fetch(`${process.env.SITE_URL}/api/threads/${id}`);
    if (!res.ok) {
      return { props: { messageText: null, breakerName: null, recipientName: null, tone: null, durationText: null } };
    }
    const data = await res.json();

    return {
      props: {
        messageText: data.messageText || null,
        breakerName: data.breakerName || null,
        recipientName: data.recipientName || null,
        tone: data.tone || null,
        durationText: data.durationText || null,
      },
    };
  } catch (e) {
    return { props: { messageText: null, breakerName: null, recipientName: null, tone: null, durationText: null } };
  }
};

