# production_queue Demo PRD

## 1. Project Overview

Demonstration of Supabase Queues, Supabase Edge Functions, and Database
Webhooks using a Vercel Vite frontend. Project name:
**production_queue**.

## 2. Core User Flow

1.  User submits text via frontend.
2.  Vercel backend endpoint `/api/jobs/submit`:
    -   Inserts job into `jobs` table.
    -   Enqueues message into Supabase Queue `text_jobs`.
3.  Edge Function `text_jobs_worker`:
    -   Consumes queue message.
    -   Processes text.
    -   Updates job status.
4.  Database Webhook triggers on `jobs.status = 'completed'` and POSTs
    to `/api/hooks/job-status`.
5.  Frontend polls `/api/jobs/:id` for results.

## 3. System Architecture

-   **Frontend**: Vite + React on Vercel.
-   **Backend**: Vercel Functions (`/api/jobs/submit`, `/api/jobs/[id]`,
    `/api/hooks/job-status`).
-   **Supabase**:
    -   `jobs` table
    -   Queue `text_jobs`
    -   Edge Function `text_jobs_worker`
    -   Database webhook on `jobs` table

## 4. Data Model

### jobs Table

    id uuid PK default gen_random_uuid()
    input_text text not null
    status text not null ('queued','processing','completed','error')
    result text
    error_message text
    created_at timestamptz default now()
    updated_at timestamptz default now()

## 5. Supabase Setup Steps

1.  Enable **Queues (pgmq)** in Integrations.
2.  Create queue **text_jobs**.
3.  Create `jobs` table via SQL.
4.  Optional: create webhook_events table.
5.  Create database webhook → `/api/hooks/job-status`.
6.  Deploy Edge Function `text_jobs_worker`.

## 6. Vercel Backend Endpoints

### `/api/jobs/submit`

-   Validates text.
-   Inserts job.
-   Enqueues `{ jobId }`.

### `/api/jobs/[id]`

-   Returns job state & results.

### `/api/hooks/job-status`

-   Receives webhook payload.
-   Optional: stores payload.

## 7. Edge Function: text_jobs_worker

-   Reads from `text_jobs` via `pgmq_public.read`.
-   Marks job as `processing`.
-   Performs transformation (uppercase example).
-   Marks job as `completed` or `error`.
-   Deletes queue message.

## 8. Frontend Requirements

-   Input text box
-   Submit button
-   Status box
-   Results box
-   Polls `/api/jobs/:id` every 2 sec

## 9. Environment Variables

    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    SUPABASE_WEBHOOK_SECRET
    SAVE_WEBHOOK_EVENTS (optional)

## 10. Acceptance Criteria

-   Queue messages processed correctly.
-   Edge function updates job status.
-   Webhook fires on completion.
-   UI reflects lifecycle states accurately.
