# BreakupBot Starter (Neo)

A tiny Next.js app that:
- Generates a breakup message with tones (Petty, Mean, Scranton Breakup, Verbose & Vicious, Surprise Me)
- Creates a shareable **read link** `/m/:slug`
- Lets the recipient **reply**; thread lives at `/t/:slug`
- Simple storage via **Vercel KV (Upstash)**

## Quickstart

1. **Install deps**
```bash
npm i
```

2. **Copy env**
```bash
cp .env.example .env.local
```

3. **Add keys in `.env.local`**
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o-mini` (or your preferred model)
- `SITE_URL=http://localhost:3000`

4. **Run**
```bash
npm run dev
```

Then open http://localhost:3000

## Deploy to Vercel

- Create a new project in Vercel and import this repo
- Add **Vercel KV** to the project (one click)
- Add env vars (`OPENAI_*`, `SITE_URL`)
- Map your subdomain (e.g., `app.itsbreakupbot.com`) to the Vercel project
- In Carrd, embed `https://app.itsbreakupbot.com/` in an iframe to make it feel native.

## Notes
- For production, update `SITE_URL` to your live domain.
- Threads are stored as JSON at keys `thread:{slug}` in KV.
- Basic retry limiter is client-side (localStorage). You can add a server-side cap if desired.
