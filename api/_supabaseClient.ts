import { createClient } from '@supabase/supabase-js';

/**
 * TypeScript types for Job model
 */
export type JobStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface Job {
  id: string;
  text_input: string;
  status: JobStatus;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface WebhookEvent {
  id: string;
  job_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: string;
}

/**
 * Initialize server-side Supabase client with service role key
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper function to create a new job
 * Inserts job record and enqueues message to pgmq_public.text_jobs queue
 */
export async function createJob(textInput: string): Promise<Job> {
  const supabase = createSupabaseClient();

  // Insert job record with status='queued'
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      text_input: textInput,
      status: 'queued',
    })
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`);
  }

  if (!job) {
    throw new Error('Job creation returned no data');
  }

  // Enqueue message to text_jobs queue with jobId
  const { error: queueError } = await supabase.rpc('pgmq_public.send', {
    queue_name: 'text_jobs',
    msg: JSON.stringify({ jobId: job.id }),
  });

  if (queueError) {
    throw new Error(`Failed to enqueue job: ${queueError.message}`);
  }

  return job;
}

/**
 * Helper function to get job by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  return data;
}

/**
 * Helper function to update job status and result
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'result' | 'error_message' | 'processed_at'>>,
): Promise<Job> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }

  if (!data) {
    throw new Error('Job update returned no data');
  }

  return data;
}

/**
 * Helper function to save webhook event (optional, for debugging)
 */
export async function saveWebhookEvent(
  jobId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<WebhookEvent> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('webhook_events')
    .insert({
      job_id: jobId,
      event_type: eventType,
      payload,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save webhook event: ${error.message}`);
  }

  if (!data) {
    throw new Error('Webhook event save returned no data');
  }

  return data;
}
