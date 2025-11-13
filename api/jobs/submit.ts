import { VercelRequest, VercelResponse } from '@vercel/node';
import { createJob } from '../_supabaseClient';

/**
 * POST /api/jobs/submit
 * Submits a new job for processing
 * 
 * Request body:
 * {
 *   text: string (required, non-empty, max 10000 chars)
 * }
 * 
 * Response (201):
 * {
 *   jobId: string,
 *   status: 'queued'
 * }
 * 
 * Error responses:
 * - 400: Invalid input (missing text, empty, too long)
 * - 500: Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    // Validate input text
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text must be a string' });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    if (trimmedText.length > 10000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 10000 characters' });
    }

    // Create job (inserts to DB and enqueues message)
    const job = await createJob(trimmedText);

    return res.status(201).json({
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    return res.status(500).json({ error: 'Failed to submit job' });
  }
}
