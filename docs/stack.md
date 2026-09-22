# Stack

Everything OpenReply needs to run, in one place: the application libraries, the
runtime architecture, and the services this instance is deployed on.
For the step-by-step setup, see [setup.md](setup.md).

## Application

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Language | TypeScript 5 |
| ORM / DB | Prisma 7 with the `@prisma/adapter-pg` driver, Supabase PostgreSQL |
| Queue | Supabase Queues (pgmq) with PostgreSQL durable job state |
| Scheduling | Supabase pg_cron → Vercel serverless endpoints |
| Auth | Auth.js / NextAuth 5 (email magic links) |
| Email | Resend (login links) |
| Validation | Zod 4 |
| Charts | Recharts 3 |
| Styling | Tailwind CSS 4 |
| Tests | Vitest 4 |
| Instagram | Official Meta Graph API (Instagram Login) |

## Runtime — serverless, one datastore

- **Web app + API** (`npm run dev` / `npm start`): Next.js. Serves the dashboard,
  the OAuth callback, and the incoming webhook. Runs on Vercel.
- **Worker endpoints** (`/api/internal/worker`, etc.): Vercel serverless functions
  triggered by Supabase pg_cron every minute. Process the send queue, send DMs,
  run the polling reconciler, and perform follow-gate checks. No always-on
  process needed.
- **Supabase PostgreSQL**: campaigns, DM logs, accounts, sessions, tracked links,
  click events, durable job queue (pgmq + QueueJobState table), rate limiting,
  and heartbeats.

The web app and the worker endpoints share the same `DATABASE_URL` and
`ENCRYPTION_KEY`. The web app stores the encrypted Instagram token; the worker
endpoints decrypt it to send. Different keys mean every send fails to decrypt.

## Reference deployment

| Piece | Service | Free tier |
| --- | --- | --- |
| Web app + worker | Vercel (Hobby) | Free |
| PostgreSQL + queue + cron | Supabase | Free (500 MB, pg_cron, pgmq) |
| Login email | Resend | Free (3k emails/mo) |
| Instagram API | Meta app with Instagram Login | Free |

## Environment variables

Names only — values live in `.env` (gitignored) or the host's env settings, never
in the repo. Full descriptions are in [setup.md](setup.md#environment-variables).

`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`,
`OPENREPLY_WORKER_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `META_GRAPH_API_VERSION`,
`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_APP_SECRET`,
`WEBHOOK_VERIFY_TOKEN`.
