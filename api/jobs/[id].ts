import { VercelRequest, VercelResponse } from '@vercel/node';
import { getJob } from '../_supabaseClient';

/**
 * GET /api/jobs/[id]
 * Retrieves the status and details of a job
 * 
 * Query params:
 * - id (required): UUID of the job
 * 
 * Response (200):
 * {
 *   id: string,
 *   text_input: string,
 *   status: 'queued' | 'processing' | 'completed' | 'error',
 *   result: string | null,
 *   error_message: string | null,
 *   created_at: string,
 *   updated_at: string,
 *   processed_at: string | null
 * }
 * 
 * Error responses:
 * - 404: Job not found
 * - 500: Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Fetch job by ID
    const job = await getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
}
