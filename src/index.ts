import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { initializeWhatsAppSessions } from './services/whatsapp';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0'; 

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Serve the frontend for any other route
app.get('*', (req, res) => {
  // Serve login page for login route
  if (req.path === '/login' || req.path === '/login.html') {
    res.sendFile(path.join(__dirname, '../public/login.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Start server
const server = app.listen(port, host, async () => {
  console.log(`Server running on http://${host}:${port}`);
  
  try {
    // Check authentication configuration
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      console.warn('Authentication not properly configured. Please set ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET in .env file.');
    } else {
      console.log('Authentication configured successfully');
    }
    
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database');
    
    // Initialize WhatsApp sessions
    await initializeWhatsAppSessions();
    console.log('WhatsApp sessions initialized');
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  });
});

export default app;
