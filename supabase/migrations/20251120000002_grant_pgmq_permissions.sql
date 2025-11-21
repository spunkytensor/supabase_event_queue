-- Grant permissions for pgmq schema
GRANT USAGE ON SCHEMA pgmq TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pgmq TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pgmq TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO anon, authenticated, service_role;

-- Ensure wrapper functions are security definer to run with creator privileges (postgres)
-- This is safer than granting broad pgmq access if we only want specific operations
CREATE OR REPLACE FUNCTION public.read_queue_messages(queue_name text, vt integer, limit_n integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq, extensions
AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT * FROM pgmq.read(queue_name, vt, limit_n)
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_queue_message(queue_name text, msg_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq, extensions
AS $$
BEGIN
  PERFORM pgmq.delete(queue_name, msg_id);
  RETURN true;
END;
$$;
