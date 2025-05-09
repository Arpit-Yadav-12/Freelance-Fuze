/*
  Warnings:

  - Made the column `averageRating` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "category" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "skills" TEXT[],
ALTER COLUMN "averageRating" SET NOT NULL;
