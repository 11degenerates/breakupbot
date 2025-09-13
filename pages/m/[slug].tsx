import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getThread, Thread } from '../../lib/kv';

type Props = { thread: Thread | null, url: string };

export default function Read({ thread, url }: Props) {
  if (!thread) return <div className="container"><p>Message not found or expired.</p></div>;
  const threadUrl = url.replace('/m/', '/t/');
  return (
    <div className="container">
      <Head><title>Breakup Message</title></Head>
      <div className="card">
        <div className="header">
          <h1 className="h1">You have a message</h1>
          <p className="sub">Sent via BreakupBot.</p>
        </div>
        <div className="controls">
          <div className="pre" style={{width:'100%'}}>{thread.messageText}</div>
        </div>
        <div className="controls">
          <a className="btn" href={`/t/${thread.slug}`}>Reply with BreakupBot</a>
        </div>
        <div className="footer">© 11 Degenerates</div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const slug = String(params?.slug || "");
  const thread = await getThread(slug);
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] || "http");
  const url = `${proto}://${host}/m/${slug}`;
  return { props: { thread, url } };
};
