-- AlterTable
ALTER TABLE "Client" ADD COLUMN "customId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_customId_key" ON "Client"("customId");
