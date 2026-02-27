-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
