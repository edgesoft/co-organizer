-- CreateTable
CREATE TABLE "UserConvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "conventId" INTEGER NOT NULL,

    CONSTRAINT "UserConvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserConvent_userId_conventId_key" ON "UserConvent"("userId", "conventId");

-- AddForeignKey
ALTER TABLE "UserConvent" ADD CONSTRAINT "UserConvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConvent" ADD CONSTRAINT "UserConvent_conventId_fkey" FOREIGN KEY ("conventId") REFERENCES "Convent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
