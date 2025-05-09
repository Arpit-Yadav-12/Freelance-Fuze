-- DropIndex
DROP INDEX "User_clerkId_idx";

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
