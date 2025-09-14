export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;

  // Build a robust base URL: prefer env, otherwise infer from request headers
  const hdrs = context.req.headers;
  const proto =
    (hdrs["x-forwarded-proto"] as string) ||
    (hdrs["x-forwarded-protocol"] as string) ||
    "https";
  const host =
    (hdrs["x-forwarded-host"] as string) ||
    (hdrs.host as string) ||
    "localhost:3000";

  const base = (process.env.SITE_URL?.trim() || `${proto}://${host}`).replace(/\/+$/,"");
  const url = `${base}/api/threads/${encodeURIComponent(String(id))}`;

  try {
    const res = await fetch(url);
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
  } catch {
    return { props: { messageText: null, breakerName: null, recipientName: null, tone: null, durationText: null } };
  }
};
