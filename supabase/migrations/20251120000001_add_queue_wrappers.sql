-- Wrapper function to read messages from queue via RPC
CREATE OR REPLACE FUNCTION public.read_queue_messages(queue_name text, vt integer, limit_n integer)
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the native pgmq.read function
  -- Note: pgmq.read returns setof record, so we need to handle that
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT * FROM pgmq.read(queue_name, vt, limit_n)
    ) t
  );
END;
$$;

-- Wrapper function to delete messages from queue via RPC
CREATE OR REPLACE FUNCTION public.delete_queue_message(queue_name text, msg_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the native pgmq.delete function
  PERFORM pgmq.delete(queue_name, msg_id);
  RETURN true;
END;
$$;

-- Grant access to these functions
GRANT EXECUTE ON FUNCTION public.read_queue_messages TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.delete_queue_message TO authenticated, service_role, anon;
