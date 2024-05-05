/*
  Warnings:

  - You are about to drop the column `congregation` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `hasParticipants` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Session` table. All the data in the column will be lost.
  - Added the required column `identifier` to the `Convent` table without a default value. This is not possible if the table is not empty.
  - Made the column `image` on table `Convent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Session_name_idx";

-- AlterTable
ALTER TABLE "Convent" ADD COLUMN     "identifier" TEXT NOT NULL,
ALTER COLUMN "image" SET NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "congregation",
DROP COLUMN "hasParticipants",
DROP COLUMN "name";

-- CreateTable
CREATE TABLE "Publisher" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "congregation" TEXT NOT NULL,
    "circuit" TEXT NOT NULL,
    "circuitSection" TEXT NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPublisher" (
    "sessionId" INTEGER NOT NULL,
    "publisherId" INTEGER NOT NULL,

    CONSTRAINT "SessionPublisher_pkey" PRIMARY KEY ("sessionId","publisherId")
);

-- CreateIndex
CREATE INDEX "Publisher_name_idx" ON "Publisher"("name");

-- AddForeignKey
ALTER TABLE "SessionPublisher" ADD CONSTRAINT "SessionPublisher_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPublisher" ADD CONSTRAINT "SessionPublisher_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
