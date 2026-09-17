-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PokerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "breakMin" INTEGER NOT NULL DEFAULT 0,
    "game" TEXT NOT NULL DEFAULT 'NLH',
    "stakes" TEXT,
    "venue" TEXT,
    "buyIn" REAL NOT NULL DEFAULT 0,
    "cashOut" REAL NOT NULL DEFAULT 0,
    "tips" REAL NOT NULL DEFAULT 0,
    "fees" REAL NOT NULL DEFAULT 0,
    "prize" REAL NOT NULL DEFAULT 0,
    "placement" INTEGER,
    "fieldSize" INTEGER,
    "net" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PokerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionBreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    CONSTRAINT "SessionBreak_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PokerSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PokerSession_userId_startedAt_idx" ON "PokerSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PokerSession_userId_status_idx" ON "PokerSession"("userId", "status");
