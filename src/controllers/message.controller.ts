import { Request, Response } from 'express';
import { prisma } from '../index';
import { sendTextMessage as sendTextMessageService, sendMediaMessage as sendMediaMessageService } from '../services/whatsapp';

/**
 * Send a text message
 */
export const sendTextMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId, jid, text, options } = req.body;

    if (!sessionId || !jid || !text) {
      return res.status(400).json({ 
        error: 'Missing required parameters: sessionId, jid, text' 
      });
    }

    // Check if session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Send message
    const message = await sendTextMessageService(sessionId, jid, text, options);
    
    return res.status(200).json({ 
      message: 'Message sent successfully',
      data: message ? {
        id: message.key.id,
        timestamp: message.messageTimestamp
      } : null
    });
  } catch (error: any) {
    console.error('Error sending text message:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message
    });
  }
};

/**
 * Send a media message
 */
export const sendMediaMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId, jid, media, caption, options } = req.body;

    if (!sessionId || !jid || !media) {
      return res.status(400).json({ 
        error: 'Missing required parameters: sessionId, jid, media' 
      });
    }

    // Check if session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Send message
    const message = await sendMediaMessageService(sessionId, jid, media, caption, options);
    
    return res.status(200).json({ 
      message: 'Media message sent successfully',
      data: message ? {
        id: message.key.id,
        timestamp: message.messageTimestamp
      } : null
    });
  } catch (error: any) {
    console.error('Error sending media message:', error);
    return res.status(500).json({ 
      error: 'Failed to send media message',
      message: error.message
    });
  }
};

/**
 * Get messages for a specific session and JID
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { sessionId, jid, limit = 20, offset = 0 } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Build query
    const query: any = {
      where: {
        sessionId: sessionId as string
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    };

    // Add JID filter if provided
    if (jid) {
      query.where.jid = jid as string;
    }

    // Get messages
    const messages = await prisma.message.findMany(query);
    const total = await prisma.message.count({ where: query.where });
    
    return res.status(200).json({ 
      messages: messages.map(msg => ({
        ...msg,
        content: JSON.parse(msg.content)
      })),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * Get a message by ID
 */
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { messageId }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.status(200).json({ 
      message: {
        ...message,
        content: JSON.parse(message.content)
      }
    });
  } catch (error) {
    console.error('Error getting message:', error);
    return res.status(500).json({ error: 'Failed to get message' });
  }
};
