-- CreateEnum
CREATE TYPE "ProjectTag" AS ENUM ('MOZUK_MARINE', 'MOZUK', 'MISC');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('COMPLETE_SOLVED', 'COMPLETE_NOT_SOLVED', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "projectId" TEXT,
ADD COLUMN "projectDate" TIMESTAMP(3),
ADD COLUMN "projectLocation" TEXT,
ADD COLUMN "projectTag" "ProjectTag" NOT NULL DEFAULT 'MISC';

-- AlterTable: Migrate existing status values and change to enum
-- First, update existing records to use new enum values
UPDATE "Project" SET "status" = 'INCOMPLETE' WHERE "status" = 'active';
UPDATE "Project" SET "status" = 'COMPLETE_SOLVED' WHERE "status" = 'completed';
UPDATE "Project" SET "status" = 'INCOMPLETE' WHERE "status" = 'on-hold';

-- Change column type to enum
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus" USING "status"::text::"ProjectStatus";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'INCOMPLETE';

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectId_key" ON "Project"("projectId");
