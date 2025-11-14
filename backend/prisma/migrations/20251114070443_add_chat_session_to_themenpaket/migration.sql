-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserThemenPaketProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "themenPaketId" TEXT NOT NULL,
    "chatSessionId" TEXT,
    "status" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "currentUnit" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "UserThemenPaketProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserThemenPaketProgress_themenPaketId_fkey" FOREIGN KEY ("themenPaketId") REFERENCES "ThemenPaket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserThemenPaketProgress_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserThemenPaketProgress" ("completedAt", "currentDay", "currentUnit", "id", "lastAccessedAt", "startedAt", "status", "themenPaketId", "userId") SELECT "completedAt", "currentDay", "currentUnit", "id", "lastAccessedAt", "startedAt", "status", "themenPaketId", "userId" FROM "UserThemenPaketProgress";
DROP TABLE "UserThemenPaketProgress";
ALTER TABLE "new_UserThemenPaketProgress" RENAME TO "UserThemenPaketProgress";
CREATE UNIQUE INDEX "UserThemenPaketProgress_chatSessionId_key" ON "UserThemenPaketProgress"("chatSessionId");
CREATE UNIQUE INDEX "UserThemenPaketProgress_userId_themenPaketId_key" ON "UserThemenPaketProgress"("userId", "themenPaketId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
