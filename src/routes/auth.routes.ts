import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Login to get authentication token
 */
router.post('/login', login);

export default router;
