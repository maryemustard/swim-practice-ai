-- CreateTable
CREATE TABLE "TeamEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'meet',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Practice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "focus" TEXT,
    "content" TEXT NOT NULL,
    "intervals" TEXT,
    "source" TEXT NOT NULL DEFAULT 'template',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Practice_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Practice" ("content", "createdAt", "focus", "groupId", "id", "intervals", "source") SELECT "content", "createdAt", "focus", "groupId", "id", "intervals", "source" FROM "Practice";
DROP TABLE "Practice";
ALTER TABLE "new_Practice" RENAME TO "Practice";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
