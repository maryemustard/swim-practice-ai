-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stage" TEXT,
    "name" TEXT NOT NULL,
    "videoUrl" TEXT,
    "cues" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
