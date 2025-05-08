import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Register a new webhook
 */
export const registerWebhook = async (req: Request, res: Response) => {
  try {
    const { sessionId, url, events } = req.body;

    if (!sessionId || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required parameters: sessionId, url, events (array)' 
      });
    }

    // Check if session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if webhook already exists
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        sessionId,
        url
      }
    });

    if (existingWebhook) {
      return res.status(409).json({ 
        error: 'Webhook already exists for this session and URL',
        webhookId: existingWebhook.id
      });
    }

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        sessionId,
        url,
        events
      }
    });
    
    return res.status(201).json({ 
      message: 'Webhook registered successfully',
      webhook
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    return res.status(500).json({ error: 'Failed to register webhook' });
  }
};

/**
 * Get all webhooks for a session
 */
export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Check if session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId: sessionId as string }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get webhooks
    const webhooks = await prisma.webhook.findMany({
      where: { sessionId: sessionId as string }
    });
    
    return res.status(200).json({ webhooks });
  } catch (error) {
    console.error('Error getting webhooks:', error);
    return res.status(500).json({ error: 'Failed to get webhooks' });
  }
};

/**
 * Update a webhook
 */
export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const { url, events } = req.body;

    if ((!url && !events) || (events && (!Array.isArray(events) || events.length === 0))) {
      return res.status(400).json({ 
        error: 'At least one of url or events (array) must be provided' 
      });
    }

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(url && { url }),
        ...(events && { events })
      }
    });
    
    return res.status(200).json({ 
      message: 'Webhook updated successfully',
      webhook: updatedWebhook
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({ error: 'Failed to update webhook' });
  }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId }
    });
    
    return res.status(200).json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
};
