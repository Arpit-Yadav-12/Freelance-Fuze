/*
  Warnings:

  - A unique constraint covering the columns `[userId,orderId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Review_userId_serviceId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_orderId_key" ON "Review"("userId", "orderId");
