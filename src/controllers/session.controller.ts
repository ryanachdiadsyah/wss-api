import { Request, Response } from 'express';
import { prisma } from '../index';
import { 
  createWhatsAppSession, 
  getWhatsAppSession, 
  deleteWhatsAppSession, 
  getSessionQRCode 
} from '../services/whatsapp';

/**
 * Create a new WhatsApp session
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const apiKey = req.headers.authorization?.split(' ')[1];

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get User ID from API key
    const user = await prisma.users.findUnique({
      where: { api_key: apiKey }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check limit of sessions for the user
    const sessionCount = await prisma.whatsAppSession.count({
      where: { userId: user.id }
    });

    if (sessionCount >= user.maxSession) {
      return res.status(403).json({ error: 'Session limit reached' });
    }

    // Check if session already exists
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (existingSession) {
      return res.status(409).json({ error: 'Session already exists' });
    }

    const session = await createWhatsAppSession(sessionId, user.id);
    
    return res.status(201).json({ 
      message: 'Session created successfully',
      session: {
        id: session.id,
        sessionId: session.sessionId,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

/**
 * Get all WhatsApp sessions
 */
export const getAllSessions = async (req: Request, res: Response) => {
  try {

    const apiKey = req.headers.authorization?.split(' ')[1];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    // Get User ID from API key
    const user = await prisma.users.findUnique({
      where: { api_key: apiKey }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Get all sessions for the user
    const sessions = await prisma.whatsAppSession.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Get a WhatsApp session by ID
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await getWhatsAppSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({ 
      session: {
        id: session.id,
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isConnected: session.isConnected
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
};

/**
 * Get QR code for a WhatsApp session
 */
export const getSessionQR = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    console.log(`Retrieving QR code for session ${sessionId}`);

    const qrCode = await getSessionQRCode(sessionId);
    
    if (!qrCode) {
      console.log(`No QR code available for session ${sessionId}`);
      return res.status(404).json({ error: 'QR code not available or session already connected' });
    }

    console.log(`Returning QR code for session ${sessionId}`);
    return res.status(200).json({ qrCode });
  } catch (error) {
    console.error('Error getting session QR code:', error);
    return res.status(500).json({ error: 'Failed to get session QR code' });
  }
};

/**
 * Delete a WhatsApp session
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete WhatsApp session
    await deleteWhatsAppSession(sessionId);
    
    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};
