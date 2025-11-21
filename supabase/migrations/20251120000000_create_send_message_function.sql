-- Migration: Create send_message wrapper function
-- Description: Wraps pgmq.send to allow calling it via Supabase RPC

CREATE OR REPLACE FUNCTION public.send_message(queue_name text, msg jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT * INTO msg_id FROM pgmq.send(queue_name, msg);
  RETURN json_build_object('msg_id', msg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(text, jsonb) TO authenticated, anon;
