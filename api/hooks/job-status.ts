import { VercelRequest, VercelResponse } from '@vercel/node';
import { saveWebhookEvent } from '../_supabaseClient';

/**
 * POST /api/hooks/job-status
 * Webhook receiver for job status updates from Supabase
 * 
 * Triggered by database webhook on jobs table UPDATE event
 * 
 * Request body (from Supabase webhook):
 * {
 *   type: string,
 *   record: { ... job data ... },
 *   old_record: { ... previous job data ... },
 *   created_at: string,
 *   schema: string,
 *   table: string,
 *   "x-webhook-id": string,
 *   "x-webhook-signature": string,
 *   "x-webhook-timestamp": string
 * }
 * 
 * Response (200):
 * {
 *   success: true
 * }
 * 
 * Error responses:
 * - 401: Invalid webhook secret
 * - 500: Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    // Validate webhook secret if configured
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'] as string;
      if (!signature || signature !== webhookSecret) {
        console.warn('Invalid webhook signature received');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Parse incoming webhook payload
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Missing webhook payload' });
    }

    console.log('Webhook received for job update:', {
      type: payload.type,
      table: payload.table,
      jobId: payload.record?.id,
      status: payload.record?.status,
    });

    // Optionally save webhook event to database (for debugging)
    const saveEvents = process.env.SAVE_WEBHOOK_EVENTS === 'true';
    if (saveEvents && payload.record?.id) {
      try {
        await saveWebhookEvent(payload.record.id, payload.type || 'UPDATE', payload);
        console.log('Webhook event saved to database');
      } catch (eventError) {
        // Log error but don't fail the webhook response
        console.error('Failed to save webhook event:', eventError);
      }
    }

    // Return 200 OK to acknowledge webhook receipt
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
}
