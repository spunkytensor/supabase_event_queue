-- Create the Webhook to Vercel (on UPDATE of jobs)
CREATE OR REPLACE FUNCTION public.trigger_job_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger when status changes to 'completed' or 'error'
  IF (NEW.status = 'completed' OR NEW.status = 'error') AND (OLD.status != 'completed' AND OLD.status != 'error') THEN
    PERFORM net.http_post(
      url := 'http://host.docker.internal:3000/api/hooks/job-status',
      headers := '{"Content-Type": "application/json", "x-webhook-signature": "your-secret-value"}'::jsonb,
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'jobs',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD),
        'schema', 'public'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_job_status_webhook ON public.jobs;
CREATE TRIGGER trigger_job_status_webhook
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_job_status_webhook();
