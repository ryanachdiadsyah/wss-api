-- Create tables based on Prisma schema
CREATE TABLE IF NOT EXISTS "WhatsAppSession" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppSession_sessionId_key" ON "WhatsAppSession"("sessionId");

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "jid" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Message_messageId_key" ON "Message"("messageId");
CREATE INDEX IF NOT EXISTS "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX IF NOT EXISTS "Message_jid_idx" ON "Message"("jid");

CREATE TABLE IF NOT EXISTS "Webhook" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "events" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Webhook_sessionId_idx" ON "Webhook"("sessionId");

-- Add foreign key constraints
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "WhatsAppSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "WhatsAppSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;
