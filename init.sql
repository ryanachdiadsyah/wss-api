-- Table: "User"
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Table: "WhatsAppSession"
CREATE TABLE "WhatsAppSession" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    "sessionId" TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_whatsapp_user_id ON "WhatsAppSession"(user_id);
CREATE INDEX idx_whatsapp_sessionId ON "WhatsAppSession"("sessionId");

-- Table: "Message"
CREATE TABLE "Message" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "messageId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    jid TEXT NOT NULL,
    content JSONB NOT NULL,
    status TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_session FOREIGN KEY ("sessionId") REFERENCES "WhatsAppSession"("sessionId") ON DELETE CASCADE,
    CONSTRAINT uq_message_session UNIQUE ("messageId", "sessionId")
);

CREATE INDEX idx_message_sessionId ON "Message"("sessionId");
CREATE INDEX idx_message_jid ON "Message"(jid);

-- Table: "Webhook"
CREATE TABLE "Webhook" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    events TEXT[] NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_webhook_session FOREIGN KEY ("sessionId") REFERENCES "WhatsAppSession"("sessionId") ON DELETE CASCADE
);

CREATE INDEX idx_webhook_sessionId ON "Webhook"("sessionId");
