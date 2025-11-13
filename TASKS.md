# production_queue Implementation Tasks

## Phase 1: Project Setup

- [x] 1.1 Initialize npm project with `package.json`
- [x] 1.2 Install Vite + React dependencies
- [x] 1.3 Install Vercel CLI for local development
- [x] 1.4 Initialize Supabase CLI and link to project
- [x] 1.5 Create base directory structure (`/api`, `/src`, `/supabase/functions`, `/supabase/sql`)
- [x] 1.6 Configure `vercel.json` for API routes and build settings
- [x] 1.7 Create `.gitignore` for node_modules, .env, .vercel, etc.

## Phase 2: Supabase Configuration

- [x] 2.1 Enable pgmq extension in Supabase Dashboard
- [x] 2.2 Create `text_jobs` queue in Supabase Dashboard
- [x] 2.3 Enable "Expose Queues via PostgREST" to create `pgmq_public` schema
- [x] 2.4 Verify queue is accessible via PostgREST API
- [x] 2.5 Set up local Supabase environment with `supabase start`
- [x] 2.6 Configure local queue for development testing

## Phase 3: Database Schema

- [x] 3.1 Create a migration file for supabase to create jobd table schema
- [x] 3.2 Add status check constraint: `('queued','processing','completed','error')`
- [x] 3.3 Verify schema with local Supabase instance
- [x] 3.4 Create optional `webhook_events` table for debugging
- [x] 3.5 Verify schema with local Supabase instance
- [x] 3.6 Verify tables created with proper indexes and constraints

## Phase 4: Shared Backend Infrastructure

- [x] 4.1 Create `api/_supabaseClient.ts` with server-side Supabase client
- [x] 4.2 Configure client to use service role key from environment
- [x] 4.3 Add helper functions for database operations if needed
- [x] 4.4 Add TypeScript types for Job model

## Phase 5: Vercel API Routes

### Submit Job Endpoint
- [ ] 5.1 Create `api/jobs/submit.ts` file
- [ ] 5.2 Implement POST handler for job submission
- [ ] 5.3 Validate input text (non-empty, length limits)
- [ ] 5.4 Insert new job record with status='queued'
- [ ] 5.5 Enqueue message to `text_jobs` queue with `{ jobId }`
- [ ] 5.6 Return response with `{ jobId, status: 'queued' }`
- [ ] 5.7 Add error handling and proper HTTP status codes

### Get Job Endpoint
- [ ] 5.8 Create `api/jobs/[id].ts` file
- [ ] 5.9 Implement GET handler to retrieve job by ID
- [ ] 5.10 Query jobs table for job details
- [ ] 5.11 Return job status, result, and metadata
- [ ] 5.12 Handle 404 for non-existent jobs
- [ ] 5.13 Add error handling

### Webhook Receiver Endpoint
- [ ] 5.14 Create `api/hooks/job-status.ts` file
- [ ] 5.15 Implement POST handler for webhook payload
- [ ] 5.16 Validate webhook secret if configured
- [ ] 5.17 Parse incoming webhook payload
- [ ] 5.18 Optionally store payload in `webhook_events` table
- [ ] 5.19 Return 200 OK response
- [ ] 5.20 Add logging for debugging

## Phase 6: Supabase Edge Function

- [ ] 6.1 Create `supabase/functions/text_jobs_worker/index.ts`
- [ ] 6.2 Set up Deno imports for Supabase client
- [ ] 6.3 Implement queue message reading from `pgmq_public.read`
- [ ] 6.4 Parse message payload to extract `jobId`
- [ ] 6.5 Load job from database by ID
- [ ] 6.6 Update job status to 'processing'
- [ ] 6.7 Implement text processing logic (e.g., uppercase transformation)
- [ ] 6.8 Update job with result and status='completed'
- [ ] 6.9 Handle errors and set status='error' with error_message
- [ ] 6.10 Delete processed message from queue
- [ ] 6.11 Add logging and error handling
- [ ] 6.12 Deploy edge function to Supabase: `supabase functions deploy text_jobs_worker`
- [ ] 6.13 Set up cron trigger or manual invocation schedule

## Phase 7: Frontend Implementation

- [ ] 7.1 Create `src/App.tsx` with main UI component
- [ ] 7.2 Create `src/main.tsx` React bootstrap
- [ ] 7.3 Add text input field for user text submission
- [ ] 7.4 Add submit button with click handler
- [ ] 7.5 Implement job submission to `/api/jobs/submit`
- [ ] 7.6 Add status display box showing current job state
- [ ] 7.7 Add results display box for processed output
- [ ] 7.8 Implement polling mechanism (every 2 seconds) to `/api/jobs/:id`
- [ ] 7.9 Update UI based on job status transitions
- [ ] 7.10 Stop polling when status is 'completed' or 'error'
- [ ] 7.11 Add loading states and error handling
- [ ] 7.12 Style UI for clean, simple appearance
- [ ] 7.13 Add TypeScript types for API responses

## Phase 8: Environment Configuration

### Local Development
- [ ] 8.1 Create `.env.local` file with Supabase credentials
- [ ] 8.2 Add `SUPABASE_URL` for local/remote Supabase
- [ ] 8.3 Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 8.4 Add `SUPABASE_WEBHOOK_SECRET` (optional)
- [ ] 8.5 Add `SAVE_WEBHOOK_EVENTS` flag (optional)
- [ ] 8.6 Add frontend env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` if needed

### Production Deployment
- [ ] 8.7 Configure Vercel environment variables in dashboard
- [ ] 8.8 Set `SUPABASE_URL` to production instance
- [ ] 8.9 Set `SUPABASE_SERVICE_ROLE_KEY` from Supabase settings
- [ ] 8.10 Set `SUPABASE_WEBHOOK_SECRET` to match webhook config
- [ ] 8.11 Set `SAVE_WEBHOOK_EVENTS=true` for debugging

## Phase 9: Database Webhook Configuration

- [ ] 9.1 Navigate to Supabase Dashboard → Database → Webhooks
- [ ] 9.2 Create new webhook
- [ ] 9.3 Set table to `jobs`
- [ ] 9.4 Set event to `UPDATE`
- [ ] 9.5 Set URL to `https://<vercel-domain>/api/hooks/job-status`
- [ ] 9.6 Add secret header (optional, matches `SUPABASE_WEBHOOK_SECRET`)
- [ ] 9.7 Test webhook delivery
- [ ] 9.8 Verify webhook fires on job completion

## Phase 10: Testing & Validation

### Local Testing
- [ ] 10.1 Start local Supabase: `supabase start`
- [ ] 10.2 Start Vercel dev server: `vercel dev`
- [ ] 10.3 Submit test job via UI
- [ ] 10.4 Manually invoke edge function: `supabase functions invoke text_jobs_worker`
- [ ] 10.5 Verify job status transitions: queued → processing → completed
- [ ] 10.6 Verify queue message is consumed and deleted
- [ ] 10.7 Verify UI updates correctly with polling

### Integration Testing
- [ ] 10.8 Test with multiple concurrent jobs
- [ ] 10.9 Test error handling (invalid input, processing failures)
- [ ] 10.10 Verify webhook payload delivery
- [ ] 10.11 Check webhook_events table for logged payloads
- [ ] 10.12 Test edge function error scenarios
- [ ] 10.13 Verify queue doesn't accumulate unprocessed messages

### Production Deployment
- [ ] 10.14 Deploy frontend to Vercel: `vercel --prod`
- [ ] 10.15 Deploy edge function to production Supabase
- [ ] 10.16 Configure production webhook URL
- [ ] 10.17 Run end-to-end test in production
- [ ] 10.18 Monitor logs for errors
- [ ] 10.19 Verify acceptance criteria from PRD

## Phase 11: Documentation & Polish

- [ ] 11.1 Update README.md with final setup instructions
- [ ] 11.2 Document environment variables with examples
- [ ] 11.3 Add troubleshooting section to README
- [ ] 11.4 Create step-by-step quickstart guide
- [ ] 11.5 Add architecture diagram (already in README)
- [ ] 11.6 Document known limitations or future enhancements
- [ ] 11.7 Add comments to complex code sections
- [ ] 11.8 Create CONTRIBUTING.md if needed

## Acceptance Criteria Checklist

- [ ] AC-1: Jobs transition through states: queued → processing → completed
- [ ] AC-2: Queue messages are properly consumed
- [ ] AC-3: Edge Function processes messages and updates jobs table
- [ ] AC-4: Webhook POSTs to Vercel when status='completed'
- [ ] AC-5: UI accurately displays status + processed result
- [ ] AC-6: No orphaned queue messages or stuck jobs
- [ ] AC-7: Error states handled gracefully
- [ ] AC-8: Production deployment fully functional
