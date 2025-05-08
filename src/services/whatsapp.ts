import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  WASocket,
  isJidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { prisma } from '../index';
import fs from 'fs';
import path from 'path';
import pino, { Logger } from 'pino';
import { sendWebhookEvent } from './webhook';

// Logger
const logger: Logger = pino({ level: 'warn' });

// Session directory
const SESSION_DIR = process.env.SESSION_DIRECTORY || './sessions';

// Map to store active WhatsApp sessions
const sessions = new Map<string, {
  socket: WASocket;
  qrCode?: string;
  isConnected: boolean;
}>();

/**
 * Initialize WhatsApp sessions from database
 */
export const initializeWhatsAppSessions = async (): Promise<void> => {

  try {
    // Create sessions directory if it doesn't exist
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }



    // Get all sessions from database
    const dbSessions = await prisma.whatsAppSession.findMany();

    
    // Initialize each session
    for (const session of dbSessions) {
      try {
        await createWhatsAppSocket(session.sessionId);
        console.log(`Session ${session.sessionId} initialized`);
      } catch (error) {
        console.error(`Failed to initialize session ${session.sessionId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error initializing WhatsApp sessions:', error);
    throw error;
  }
};

/**
 * Create a new WhatsApp session
 */
export const createWhatsAppSession = async (sessionId: string) => {
  try {
    // Create a new session in the database
    const session = await prisma.whatsAppSession.create({
      data: {
        sessionId,
        data: JSON.stringify({})
      }
    });

    // Create WhatsApp socket
    await createWhatsAppSocket(sessionId);

    return session;
  } catch (error) {
    console.error(`Error creating WhatsApp session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get a WhatsApp session by ID
 */
export const getWhatsAppSession = async (sessionId: string) => {
  try {
    // Get session from database
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return null;
    }

    // Get session from memory
    const activeSession = sessions.get(sessionId);

    return {
      ...session,
      isConnected: activeSession?.isConnected || false
    };
  } catch (error) {
    console.error(`Error getting WhatsApp session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Delete a WhatsApp session
 */
export const deleteWhatsAppSession = async (sessionId: string) => {
  try {
    // Close socket if it exists
    const session = sessions.get(sessionId);
    if (session) {
      session.socket.end(undefined);
      sessions.delete(sessionId);
    }

    // Delete session directory
    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // First delete all associated messages
    await prisma.message.deleteMany({
      where: { sessionId }
    });

    // Then delete all associated webhooks
    await prisma.webhook.deleteMany({
      where: { sessionId }
    });

    // Finally delete session from database
    await prisma.whatsAppSession.delete({
      where: { sessionId }
    });

    return true;
  } catch (error) {
    console.error(`Error deleting WhatsApp session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get QR code for a WhatsApp session
 */
export const getSessionQRCode = async (sessionId: string): Promise<string | null> => {
  console.log(`Getting QR code for session ${sessionId}`);
  const session = sessions.get(sessionId);
  
  if (!session) {
    console.log(`Session ${sessionId} not found in memory`);
    return null;
  }
  
  if (!session.qrCode) {
    console.log(`No QR code available for session ${sessionId}`);
    return null;
  }
  
  console.log(`QR code found for session ${sessionId}`);
  return session.qrCode;
};

/**
 * Create a WhatsApp socket
 */
const createWhatsAppSocket = async (sessionId: string): Promise<WASocket> => {

  // Session folder path
  const sessionFolder = path.join(SESSION_DIR, sessionId);

  // Create folder if it doesn't exist
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  // Get auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  // Fetch latest version
  const { version } = await fetchLatestBaileysVersion();


  // Create socket
  const socket = makeWASocket({
    version,
    logger: logger as any,
    qrTimeout: 0,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as any)
    },
    // browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: true
  });
  // console.log("socket", socket)

  // Store session in memory
  sessions.set(sessionId, {
    socket,
    isConnected: false
  });

  // Handle connection events
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Update QR code
    if (qr) {
      console.log(`QR code received for session ${sessionId}:`, qr.substring(0, 50) + '...');
      
      // Atualizar a sessão no Map
      const session = sessions.get(sessionId);
      if (session) {
        session.qrCode = qr;
        sessions.set(sessionId, session);
        console.log(`QR code stored for session ${sessionId}`);
      } else {
        console.error(`Session ${sessionId} not found in memory when trying to store QR code`);
        // Tentar recriar a sessão no Map
        sessions.set(sessionId, {
          socket,
          qrCode: qr,
          isConnected: false
        });
        console.log(`Created new session entry for ${sessionId} with QR code`);
      }

      // Send webhook event
      await sendWebhookEvent(sessionId, 'qr.update', { qr });
    }

    // Handle connection state changes
    if (connection === 'open') {
      console.log(`Session ${sessionId} connected`);

      const session = sessions.get(sessionId);
      if (session) {
        session.isConnected = true;
        session.qrCode = undefined;
        sessions.set(sessionId, session);
      }

      // Send webhook event
      await sendWebhookEvent(sessionId, 'connection.open', {});
    } else if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      // Reconnect if not logged out
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`Session ${sessionId} disconnected, reconnecting...`);
        await createWhatsAppSocket(sessionId);
      } else {
        console.log(`Session ${sessionId} logged out`);

        // Delete session
        await deleteWhatsAppSession(sessionId);

        // Send webhook event
        await sendWebhookEvent(sessionId, 'connection.logout', {});
      }
    }
  });

  // Handle credential updates
  socket.ev.on('creds.update', saveCreds);

  // Handle messages
  socket.ev.on('messages.upsert', async (m) => {
    // Only process new messages
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      // Skip messages from self
      if (!msg.key.fromMe && isJidUser(msg.key.remoteJid || '')) {
        // Store message in database
        try {
          await prisma.message.create({
            data: {
              messageId: msg.key.id || '',
              sessionId,
              jid: msg.key.remoteJid || '',
              content: JSON.stringify(msg),
              status: 'received'
            }
          });
        } catch (error) {
          console.error('Error storing message:', error);
        }

        // Send webhook event
        await sendWebhookEvent(sessionId, 'messages.received', { message: msg });
      }
    }
  });

  return socket;
};

/**
 * Send a text message
 */
export const sendTextMessage = async (
  sessionId: string,
  jid: string,
  text: string,
  options: any = {}
) => {
  try {
    const session = sessions.get(sessionId);

    if (!session || !session.isConnected) {
      throw new Error('Session not connected');
    }

    const msg = await session.socket.sendMessage(jid, { text }, options);

    // Store message in database
    if (msg)
      await prisma.message.create({
        data: {
          messageId: msg.key.id || '',
          sessionId,
          jid,
          content: JSON.stringify(msg),
          status: 'sent'
        }
      });

    return msg;
  } catch (error) {
    console.error(`Error sending text message in session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Send a media message
 */
export const sendMediaMessage = async (
  sessionId: string,
  jid: string,
  media: any,
  caption?: string,
  options: any = {}
) => {
  try {
    const session = sessions.get(sessionId);

    if (!session || !session.isConnected) {
      throw new Error('Session not connected');
    }

    const msg = await session.socket.sendMessage(jid, {
      ...media,
      caption
    }, options);

    // Store message in database

    if (msg)
      await prisma.message.create({
        data: {
          messageId: msg.key.id || '',
          sessionId,
          jid,
          content: JSON.stringify(msg),
          status: 'sent'
        }
      });

    return msg;
  } catch (error) {
    console.error(`Error sending media message in session ${sessionId}:`, error);
    throw error;
  }
};
