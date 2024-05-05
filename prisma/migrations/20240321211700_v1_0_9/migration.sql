/*
  Warnings:

  - Added the required column `conventType` to the `Convent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConventType" AS ENUM ('REGIONAL', 'CIRCUIT', 'PIONEER_MEETING', 'KMS');

-- AlterTable
ALTER TABLE "Convent" ADD COLUMN     "conventType" "ConventType" NOT NULL;

-- CreateTable
CREATE TABLE "ConventCircuit" (
    "id" SERIAL NOT NULL,
    "conventId" INTEGER NOT NULL,
    "circuit" TEXT NOT NULL,
    "section" TEXT,

    CONSTRAINT "ConventCircuit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConventCircuit_conventId_circuit_section_key" ON "ConventCircuit"("conventId", "circuit", "section");

-- AddForeignKey
ALTER TABLE "ConventCircuit" ADD CONSTRAINT "ConventCircuit_conventId_fkey" FOREIGN KEY ("conventId") REFERENCES "Convent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
