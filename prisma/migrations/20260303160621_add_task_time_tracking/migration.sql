-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "activeTimerStartedAt" TIMESTAMP(3),
ADD COLUMN     "totalTrackedSeconds" INTEGER NOT NULL DEFAULT 0;
