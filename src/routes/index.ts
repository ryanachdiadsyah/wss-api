import { Router } from 'express';
import sessionRoutes from './session.routes';
import messageRoutes from './message.routes';
import webhookRoutes from './webhook.routes';
import authRoutes from './auth.routes';
import { verifyToken } from '../controllers/auth.controller';

const router = Router();

// Auth routes (unprotected)
router.use('/auth', authRoutes);

// Protected routes
router.use('/sessions', verifyToken, sessionRoutes);
router.use('/messages', verifyToken, messageRoutes);
router.use('/webhooks', verifyToken, webhookRoutes);

export default router;
