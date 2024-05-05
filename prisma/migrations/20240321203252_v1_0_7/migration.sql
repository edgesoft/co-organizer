/*
  Warnings:

  - Made the column `conventId` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_conventId_fkey";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "conventId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_conventId_fkey" FOREIGN KEY ("conventId") REFERENCES "Convent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
