-- Migration: Create pgmq extension and text_jobs queue
-- Description: Sets up the PostgreSQL Message Queue extension and creates the text_jobs queue
-- for job processing

-- Enable pgmq extension
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create the text_jobs queue (creates pgmq_public schema)
SELECT pgmq.create('text_jobs');

-- Grant permissions to expose via PostgREST (for public schema access)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq_public') THEN
    GRANT USAGE ON SCHEMA pgmq_public TO authenticated, anon;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pgmq_public TO authenticated, anon;
  END IF;
END $$;
