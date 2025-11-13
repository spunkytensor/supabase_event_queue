-- Migration: Create pgmq extension and text_jobs queue
-- Description: Sets up the PostgreSQL Message Queue extension and creates the text_jobs queue
-- for job processing

-- Enable pgmq extension
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create the text_jobs queue
SELECT pgmq.create('text_jobs');

-- Grant permissions to expose via PostgREST (for public schema access)
GRANT USAGE ON SCHEMA pgmq_public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pgmq_public TO authenticated, anon;
