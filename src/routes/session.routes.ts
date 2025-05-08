import { Router } from 'express';
import { 
  createSession, 
  getSession, 
  getAllSessions, 
  deleteSession, 
  getSessionQR 
} from '../controllers/session.controller';

const router = Router();

/**
 * @route POST /api/sessions
 * @desc Create a new WhatsApp session
 */
router.post('/', createSession);

/**
 * @route GET /api/sessions
 * @desc Get all WhatsApp sessions
 */
router.get('/', getAllSessions);

/**
 * @route GET /api/sessions/:sessionId
 * @desc Get a WhatsApp session by ID
 */
router.get('/:sessionId', getSession);

/**
 * @route GET /api/sessions/:sessionId/qr
 * @desc Get QR code for a WhatsApp session
 */
router.get('/:sessionId/qr', getSessionQR);

/**
 * @route DELETE /api/sessions/:sessionId
 * @desc Delete a WhatsApp session
 */
router.delete('/:sessionId', deleteSession);

export default router;
