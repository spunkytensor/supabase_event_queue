# Supabase Event Queue Demo - Agent Guide

## Documentation
- **PRD.md** - Product requirements and system architecture details
- **TASKS.md** - Comprehensive task breakdown by phase for implementation

## Commands
- **Dev**: `npm install && vercel dev` (requires Supabase running: `supabase start`)
- **Deploy Edge Function**: `supabase functions deploy text_jobs_worker --project-ref <project-ref>`
- **Test Edge Function**: `supabase functions invoke text_jobs_worker`

## Architecture
- **Frontend**: Vite + React (deployed to Vercel)
- **Backend**: Vercel API routes in `/api` directory
- **Database**: Supabase PostgreSQL with `jobs` table and optional `webhook_events` table
- **Queue**: Supabase Queue `text_jobs` (pgmq extension)
- **Worker**: Edge Function `text_jobs_worker` in `/supabase/functions/text_jobs_worker/`
- **Flow**: User submits → Job queued → Edge function processes → Webhook notifies → UI polls status

## Code Structure
- `api/jobs/submit.ts` - POST endpoint to create jobs and enqueue messages
- `api/jobs/[id].ts` - GET endpoint to retrieve job status
- `api/hooks/job-status.ts` - POST webhook receiver for job updates
- `api/_supabaseClient.ts` - Shared server-side Supabase client
- `supabase/functions/text_jobs_worker/index.ts` - Queue consumer/processor
- `supabase/sql/create_jobs.sql` - Database schema
- `src/App.tsx` - Main UI component with text input, status display, results

## Code Style
- Use TypeScript for all API routes and Edge Functions
- Job statuses: `'queued' | 'processing' | 'completed' | 'error'`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_WEBHOOK_SECRET`, `SAVE_WEBHOOK_EVENTS`

## Task Management
- Mark tasks as completed in any referenced task list (TASKS.md, todo list, etc.) after finishing the work
- Update task status immediately to maintain an accurate project state
- Document which tasks are blocked, in-progress, or completed
