/*
  Warnings:

  - You are about to drop the column `price` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTime` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Service` table. All the data in the column will be lost.
  - Added the required column `packageId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_userId_fkey";

-- DropIndex
DROP INDEX "Review_orderId_key";

-- DropIndex
DROP INDEX "User_id_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "price",
ADD COLUMN     "packageId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "avatar",
DROP COLUMN "category",
DROP COLUMN "education",
DROP COLUMN "experience",
DROP COLUMN "hourlyRate",
DROP COLUMN "portfolio",
DROP COLUMN "skills",
DROP COLUMN "title",
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "orderId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "deliveryTime",
DROP COLUMN "price";

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "deliveryTime" INTEGER NOT NULL,
    "features" TEXT[],
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
