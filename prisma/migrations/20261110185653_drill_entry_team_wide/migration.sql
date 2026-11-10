-- AlterTable: add teamId as nullable first so we can backfill existing rows
ALTER TABLE "DrillEntry" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "groupId" DROP NOT NULL;

-- Backfill: every existing DrillEntry is group-scoped, so pull its teamId
-- from that group.
UPDATE "DrillEntry"
SET "teamId" = "Group"."teamId"
FROM "Group"
WHERE "DrillEntry"."groupId" = "Group"."id";

-- Now that every row has a teamId, enforce it going forward.
ALTER TABLE "DrillEntry" ALTER COLUMN "teamId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DrillEntry" ADD CONSTRAINT "DrillEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
