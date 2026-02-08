-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'REPORT', 'OTHERS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('SUBMITTED', 'NOT_SUBMITTED');

-- AlterTable: Remove old file-related columns and add new document tracking columns
ALTER TABLE "Document" DROP COLUMN "name",
DROP COLUMN "filename",
DROP COLUMN "mimetype",
DROP COLUMN "size";

ALTER TABLE "Document" ADD COLUMN "documentId" TEXT,
ADD COLUMN "documentName" TEXT NOT NULL DEFAULT 'Untitled Document',
ADD COLUMN "documentDate" TIMESTAMP(3),
ADD COLUMN "documentType" "DocumentType" NOT NULL DEFAULT 'OTHERS',
ADD COLUMN "documentStatus" "DocumentStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ADD COLUMN "amount" DOUBLE PRECISION,
ADD COLUMN "paid" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentId_key" ON "Document"("documentId");

-- Remove default after initial migration
ALTER TABLE "Document" ALTER COLUMN "documentName" DROP DEFAULT;
