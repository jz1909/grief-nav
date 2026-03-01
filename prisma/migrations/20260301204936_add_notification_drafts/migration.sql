-- CreateTable
CREATE TABLE "NotificationDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sentAt" DATETIME
);

-- CreateIndex
CREATE INDEX "NotificationDraft_userId_idx" ON "NotificationDraft"("userId");

-- CreateIndex
CREATE INDEX "NotificationDraft_status_idx" ON "NotificationDraft"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDraft_userId_contactId_key" ON "NotificationDraft"("userId", "contactId");
