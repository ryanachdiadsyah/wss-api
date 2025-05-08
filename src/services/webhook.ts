import axios from 'axios';
import { prisma } from '../index';

/**
 * Send an event to all registered webhooks for a session
 */
export const sendWebhookEvent = async (
  sessionId: string,
  event: string,
  data: any
): Promise<void> => {
  try {
    // Get all webhooks for the session that are subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        sessionId,
        events: {
          has: event
        }
      }
    });

    // If no webhooks, return
    if (webhooks.length === 0) {
      return;
    }

    // Send event to all webhooks
    const payload = {
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      data
    };

    const promises = webhooks.map(webhook => 
      axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WA-Baileys-API'
        },
        timeout: 10000 // 10 seconds timeout
      }).catch(error => {
        console.error(`Error sending webhook to ${webhook.url}:`, error.message);
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error(`Error sending webhook event ${event} for session ${sessionId}:`, error);
  }
};
