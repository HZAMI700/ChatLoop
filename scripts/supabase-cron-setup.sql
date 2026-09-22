-- ==============================================================================
-- OpenReply Supabase Setup Script: Extensions, pgmq Queue, and pg_cron Scheduler
-- ==============================================================================
-- Run this script in the Supabase SQL Editor for your project.
--
-- BEFORE RUNNING:
-- Replace YOUR_VERCEL_APP_URL with your production Vercel URL (e.g., https://my-openreply.vercel.app)
-- Replace YOUR_OPENREPLY_WORKER_SECRET with the secret set in OPENREPLY_WORKER_SECRET on Vercel.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;

-- 2. Create the Outgoing Instagram Job Queue in pgmq
SELECT pgmq.create('instagram_dm_queue');

-- 3. Configure Scheduled Jobs with pg_cron & pg_net
--
-- Set your parameters below:
DO $$
DECLARE
  v_app_url text := 'YOUR_VERCEL_APP_URL'; -- No trailing slash, e.g. 'https://my-openreply.vercel.app'
  v_secret  text := 'YOUR_OPENREPLY_WORKER_SECRET';
BEGIN
  -- Unschedule existing jobs if re-running
  PERFORM cron.unschedule('openreply-worker');
  PERFORM cron.unschedule('openreply-reconcile-comments');
  PERFORM cron.unschedule('openreply-refresh-tokens');
  PERFORM cron.unschedule('openreply-snapshot-followers');
  PERFORM cron.unschedule('openreply-attach-next-reel');

  -- Schedule 1: Worker Queue Drain (every 1 minute)
  -- Reads and processes pending comment, postback, and message jobs on Vercel
  PERFORM cron.schedule(
    'openreply-worker',
    '* * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L || '/api/internal/worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-openreply-worker-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_app_url,
      v_secret
    )
  );

  -- Schedule 2: Comment Reconciliation (every 5 minutes)
  -- Safety net sweep for missed comments and binding pending reels
  PERFORM cron.schedule(
    'openreply-reconcile-comments',
    '*/5 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L || '/api/internal/reconcile-comments',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-openreply-worker-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_app_url,
      v_secret
    )
  );

  -- Schedule 3: Token Refresh & Usage Reset (daily at 05:00 UTC)
  -- Refreshes long-lived tokens expiring within 10 days
  PERFORM cron.schedule(
    'openreply-refresh-tokens',
    '0 5 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L || '/api/internal/refresh-tokens',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-openreply-worker-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_app_url,
      v_secret
    )
  );

  -- Schedule 4: Follower Snapshots (daily at 07:00 UTC)
  -- Records daily follower count history for accounts
  PERFORM cron.schedule(
    'openreply-snapshot-followers',
    '0 7 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L || '/api/internal/snapshot-followers',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-openreply-worker-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_app_url,
      v_secret
    )
  );

  -- Schedule 5: Next Reel Attachment (every 15 minutes)
  -- Binds campaigns with pending next reel to published reels
  PERFORM cron.schedule(
    'openreply-attach-next-reel',
    '*/15 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L || '/api/internal/attach-next-reel',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-openreply-worker-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      v_app_url,
      v_secret
    )
  );

  RAISE NOTICE 'OpenReply Supabase pgmq queue and cron jobs configured successfully!';
END $$;
