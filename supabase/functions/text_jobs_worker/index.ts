import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

/**
 * TypeScript types for Job model
 */
type JobStatus = 'queued' | 'processing' | 'completed' | 'error';

interface Job {
  id: string;
  text_input: string;
  status: JobStatus;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

interface QueueMessage {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: {
    jobId: string;
  };
}

/**
 * Initialize Supabase client for edge function
 */
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
 * Process text by converting to uppercase (example transformation)
 */
function processText(input: string): string {
  return input.toUpperCase();
}

/**
 * Main handler: reads queue messages, processes jobs, updates database
 */
Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  try {
    const supabase = createSupabaseClient();

    console.log('[text_jobs_worker] Starting job processing...');

    // Read one message from the text_jobs queue
    const { data: messages, error: readError } = await supabase.rpc(
      'pgmq_public.read',
      {
        queue_name: 'text_jobs',
        vt: 300, // Visibility timeout: 5 minutes
        limit: 1,
      },
    );

    if (readError) {
      console.error('[text_jobs_worker] Failed to read from queue:', readError);
      return new Response(
        JSON.stringify({ error: 'Failed to read from queue', details: readError }),
        { status: 500 },
      );
    }

    // Check if any messages were read
    if (!messages || messages.length === 0) {
      console.log('[text_jobs_worker] No messages in queue');
      return new Response(JSON.stringify({ message: 'No messages in queue' }), {
        status: 200,
      });
    }

    const message = messages[0] as QueueMessage;
    const msgId = message.msg_id;
    const jobId = message.message.jobId;

    console.log(`[text_jobs_worker] Processing message ${msgId} for job ${jobId}`);

    // Load job from database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error(`[text_jobs_worker] Failed to load job ${jobId}:`, jobError);

      // Delete message from queue even if job not found
      await deleteQueueMessage(supabase, msgId);

      return new Response(
        JSON.stringify({ error: 'Job not found', jobId }),
        { status: 404 },
      );
    }

    if (!job) {
      console.error(`[text_jobs_worker] Job ${jobId} not found`);

      // Delete message from queue
      await deleteQueueMessage(supabase, msgId);

      return new Response(
        JSON.stringify({ error: 'Job not found', jobId }),
        { status: 404 },
      );
    }

    // Update job status to 'processing'
    console.log(`[text_jobs_worker] Updating job ${jobId} to processing`);
    const { error: updateProcessingError } = await supabase
      .from('jobs')
      .update({
        status: 'processing' as JobStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateProcessingError) {
      console.error(
        `[text_jobs_worker] Failed to update job to processing:`,
        updateProcessingError,
      );

      // Delete message from queue
      await deleteQueueMessage(supabase, msgId);

      return new Response(
        JSON.stringify({
          error: 'Failed to update job status',
          details: updateProcessingError,
        }),
        { status: 500 },
      );
    }

    // Process the text
    let result: string;
    let errorMessage: string | null = null;

    try {
      console.log(
        `[text_jobs_worker] Processing text input: "${job.text_input.substring(0, 50)}..."`
      );
      result = processText(job.text_input);
      console.log(`[text_jobs_worker] Processing complete. Result: "${result.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[text_jobs_worker] Processing error:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = '';
    }

    // Update job with result and final status
    const finalStatus = errorMessage ? 'error' : 'completed';
    console.log(`[text_jobs_worker] Updating job ${jobId} to ${finalStatus}`);

    const updatePayload: Record<string, unknown> = {
      status: finalStatus,
      result: errorMessage ? null : result,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updatePayload.error_message = errorMessage;
    }

    const { error: updateFinalError } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId);

    if (updateFinalError) {
      console.error(
        `[text_jobs_worker] Failed to update job with result:`,
        updateFinalError,
      );

      // Still delete message from queue to avoid infinite loop
      await deleteQueueMessage(supabase, msgId);

      return new Response(
        JSON.stringify({
          error: 'Failed to save job result',
          details: updateFinalError,
        }),
        { status: 500 },
      );
    }

    // Delete processed message from queue
    console.log(`[text_jobs_worker] Deleting message ${msgId} from queue`);
    await deleteQueueMessage(supabase, msgId);

    console.log(`[text_jobs_worker] Successfully processed job ${jobId}`);

    return new Response(
      JSON.stringify({
        message: 'Job processed successfully',
        jobId,
        msgId,
        status: finalStatus,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('[text_jobs_worker] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 },
    );
  }
});

/**
 * Helper function to delete a message from the queue
 */
async function deleteQueueMessage(supabase: any, msgId: number): Promise<void> {
  try {
    const { error } = await supabase.rpc('pgmq_public.delete', {
      queue_name: 'text_jobs',
      msg_id: msgId,
    });

    if (error) {
      console.error(`[text_jobs_worker] Failed to delete message ${msgId}:`, error);
    } else {
      console.log(`[text_jobs_worker] Successfully deleted message ${msgId}`);
    }
  } catch (error) {
    console.error(`[text_jobs_worker] Error deleting message ${msgId}:`, error);
  }
}
