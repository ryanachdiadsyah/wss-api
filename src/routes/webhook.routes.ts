import { Router } from 'express';
import { 
  registerWebhook, 
  getWebhooks, 
  deleteWebhook, 
  updateWebhook 
} from '../controllers/webhook.controller';

const router = Router();

/**
 * @route POST /api/webhooks
 * @desc Register a new webhook
 */
router.post('/', registerWebhook);

/**
 * @route GET /api/webhooks
 * @desc Get all webhooks for a session
 */
router.get('/', getWebhooks);

/**
 * @route PUT /api/webhooks/:webhookId
 * @desc Update a webhook
 */
router.put('/:webhookId', updateWebhook);

/**
 * @route DELETE /api/webhooks/:webhookId
 * @desc Delete a webhook
 */
router.delete('/:webhookId', deleteWebhook);

export default router;
