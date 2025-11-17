/*
  Warnings:

  - The `improvedText` column on the `Conversion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CV" ADD COLUMN     "improvedText" TEXT;

-- AlterTable
ALTER TABLE "Conversion" DROP COLUMN "improvedText",
ADD COLUMN     "improvedText" JSONB;
