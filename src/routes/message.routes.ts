import { Router } from 'express';
import { 
  sendTextMessage, 
  sendMediaMessage, 
  getMessages,
  getMessageById
} from '../controllers/message.controller';

const router = Router();

/**
 * @route POST /api/messages/text
 * @desc Send a text message
 */
router.post('/text', sendTextMessage);

/**
 * @route POST /api/messages/media
 * @desc Send a media message (image, video, document, etc.)
 */
router.post('/media', sendMediaMessage);

/**
 * @route GET /api/messages
 * @desc Get messages for a specific session and JID
 */
router.get('/', getMessages);

/**
 * @route GET /api/messages/:messageId
 * @desc Get a message by ID
 */
router.get('/:messageId', getMessageById);

export default router;
