# Supabase Queue Setup Guide

This guide walks through the initial Supabase configuration required to set up the pgmq (PostgreSQL Message Queue) extension and create the `text_jobs` queue.

## Prerequisites

- Supabase project created at https://supabase.com
- Access to Supabase Dashboard with admin privileges
- Supabase CLI installed locally (`npm install -g @supabase/cli`)

## Phase 2: Supabase Configuration

### Step 2.1: Enable pgmq Extension in Supabase Dashboard

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Run the following SQL to enable the pgmq extension:

```sql
CREATE EXTENSION IF NOT EXISTS pgmq;
```

5. Click **Run** to execute
6. Verify the extension is created (should see success message)

**Troubleshooting**: If you receive a "permission denied" error, ensure your account has database admin privileges.

---

### Step 2.2: Create `text_jobs` Queue in Supabase Dashboard

1. In the **SQL Editor**, click **+ New Query**
2. Run the following SQL to create the message queue:

```sql
SELECT pgmq.create('text_jobs');
```

3. Click **Run** to execute
4. You should see output: `(1 row) create` with result similar to `text_jobs`

**What this does**: Creates a pgmq queue named `text_jobs` with default settings (no visibility timeout, no retention).

---

### Step 2.3: Enable "Expose Queues via PostgREST" to Create `pgmq_public` Schema

1. Go to the **Database** section in the left sidebar
2. Click **Extensions**
3. Search for **pgmq** in the extensions list
4. Find the pgmq extension row and look for an **"Expose via PostgREST"** toggle or option
5. Enable the toggle to expose queue tables via PostgREST API

**Alternative approach** (if toggle not available):
1. In **SQL Editor**, run:

```sql
GRANT USAGE ON SCHEMA pgmq_public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pgmq_public TO authenticated, anon;
```

2. This grants public access to queue operations via PostgREST

**Result**: A `pgmq_public` schema is created containing queue-related tables accessible via REST API.

---

### Step 2.4: Verify Queue is Accessible via PostgREST API

1. Get your Supabase project URL and anon key from **Settings → API**
2. Test queue accessibility using curl or Postman:

```bash
curl -X GET "https://YOUR_PROJECT_ID.supabase.co/rest/v1/pgmq_public.text_jobs?limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

3. You should receive a JSON response (likely empty array `[]` if no messages)

**Expected responses**:
- `200 OK` with `[]` - Queue is accessible and empty ✓
- `401 Unauthorized` - API key is invalid
- `404 Not Found` - Schema or table doesn't exist

**Success**: If you see status 200, the queue is properly configured and accessible via PostgREST.

---

## Next Steps

Once these steps are complete:
1. Proceed to **Step 2.5**: Set up local Supabase environment with `supabase start`
2. Proceed to **Step 2.6**: Configure local queue for development testing

See [Local Development Setup](#local-development-setup) below.

---

## Local Development Setup

### Step 2.5: Set Up Local Supabase Environment

1. Ensure Supabase CLI is installed:

```bash
npm install -g @supabase/cli
```

2. Navigate to your project root and link to your Supabase project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

3. Start the local Supabase stack:

```bash
supabase start
```

This starts:
- PostgreSQL database locally
- Supabase API server
- pgmq extension (auto-enabled if created in cloud)

**Expected output**:
```
Started Supabase local development server.
Local URL:        http://localhost:54321
Supabase CLI:     v1.x.x
```

---

### Step 2.6: Configure Local Queue for Development Testing

1. Once local Supabase is running, access the SQL Editor at **http://localhost:54321** (via Supabase Dashboard)

2. Create the pgmq extension locally:

```sql
CREATE EXTENSION IF NOT EXISTS pgmq;
```

3. Create the `text_jobs` queue:

```sql
SELECT pgmq.create('text_jobs');
```

4. Verify queue exists by querying:

```sql
SELECT * FROM pgmq.q_text_jobs;
```

You should see the queue table structure (likely empty).

5. Test enqueuing a message:

```sql
SELECT pgmq.send('text_jobs', '{"jobId": "test-123"}');
```

6. Verify message was enqueued:

```sql
SELECT * FROM pgmq.q_text_jobs;
```

You should see one row with your message.

**Success Criteria**:
- ✓ pgmq extension is created
- ✓ text_jobs queue exists and shows in query results
- ✓ Can send test message to queue
- ✓ Can read message from queue

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `CREATE EXTENSION` fails with permission denied | Ensure you're using a superuser account or contact Supabase support |
| Queue not visible in PostgREST API | Run GRANT commands from Step 2.3 or enable "Expose via PostgREST" toggle |
| `supabase start` fails | Ensure Docker is running and Supabase CLI is up to date (`supabase upgrade`) |
| Local queue doesn't persist | Use `supabase db push` to sync your schema to local instance |

---

## References

- [pgmq Documentation](https://github.com/tembo-io/pgmq)
- [Supabase Extensions Guide](https://supabase.com/docs/guides/database/extensions)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
