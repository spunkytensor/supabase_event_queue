-- Enable the pg_net extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger the worker
CREATE OR REPLACE FUNCTION public.trigger_job_worker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Fire and forget request to the worker
  -- LOCAL DEV URL: We use host.docker.internal
  -- Note: In production, this URL needs to be updated to the real Edge Function URL
  PERFORM net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/text_jobs_worker',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_worker_on_job_insert ON public.jobs;
CREATE TRIGGER trigger_worker_on_job_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_job_worker();
