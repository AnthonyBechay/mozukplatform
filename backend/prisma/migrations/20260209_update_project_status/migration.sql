-- AlterEnum
ALTER TYPE "ProjectStatus" RENAME VALUE 'INCOMPLETE' TO 'ON_GOING';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'ON_GOING';
