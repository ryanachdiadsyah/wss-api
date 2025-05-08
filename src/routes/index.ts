import { Router } from 'express';
import sessionRoutes from './session.routes';
import messageRoutes from './message.routes';
import webhookRoutes from './webhook.routes';
import authRoutes from './auth.routes';
import { verifyApiKey } from '../controllers/auth.controller';

const router = Router();

// Auth routes (unprotected)
router.use('/auth', authRoutes);

// Protected routes
router.use('/sessions', verifyApiKey, sessionRoutes);
router.use('/messages', verifyApiKey, messageRoutes);
router.use('/webhooks', verifyApiKey, webhookRoutes);

export default router;
