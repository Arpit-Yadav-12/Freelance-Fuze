-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "completedGigs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trophyLevel" TEXT NOT NULL DEFAULT 'none';
