-- CreateTable
CREATE TABLE "CV" (
    "id" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "ipAddress" TEXT,
    "country" TEXT,
    "region" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversion" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "extractedText" TEXT,
    "improvedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "CV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
