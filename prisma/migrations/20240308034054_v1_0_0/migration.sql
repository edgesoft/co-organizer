-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TALK', 'CHAIR_MAN_ROOM', 'CHECKING_SPEAKERS', 'MUSIC', 'PRAYER', 'CHAIR_MAN', 'PODIUM_PRACTICE');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('RECEIVED_ASSIGNMENT', 'PRACTICE_DONE', 'PODIUM_PRACTICE_DONE', 'REGISTERED_ON_FIRST_DAY', 'REGISTERED_ON_SPEAKING_DAY', 'REGISTERED_30_MINUTES_BEFORE_SPEAKING');

-- CreateTable
CREATE TABLE "Convent" (
    "id" SERIAL NOT NULL,
    "theme" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,

    CONSTRAINT "Convent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSession" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startHour" INTEGER NOT NULL,
    "stopHour" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "stopMinutes" INTEGER NOT NULL,

    CONSTRAINT "GroupSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startHour" INTEGER NOT NULL,
    "stopHour" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "stopMinutes" INTEGER NOT NULL,
    "name" TEXT,
    "congregation" TEXT,
    "theme" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "hasParticipants" BOOLEAN NOT NULL,
    "participants" TEXT,
    "conventId" INTEGER,
    "groupSessionId" INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionStep" (
    "id" SERIAL NOT NULL,
    "stepType" "StepType" NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "SessionStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_conventId_fkey" FOREIGN KEY ("conventId") REFERENCES "Convent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_groupSessionId_fkey" FOREIGN KEY ("groupSessionId") REFERENCES "GroupSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStep" ADD CONSTRAINT "SessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
