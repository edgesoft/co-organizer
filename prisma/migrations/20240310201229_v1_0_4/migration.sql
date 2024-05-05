/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_identifier_key" ON "Session"("identifier");

-- CreateIndex
CREATE INDEX "Session_name_idx" ON "Session"("name");

-- CreateIndex
CREATE INDEX "Session_theme_idx" ON "Session"("theme");
