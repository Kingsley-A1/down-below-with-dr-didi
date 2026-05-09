-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "displayName" STRING NOT NULL,
    "passwordHash" STRING NOT NULL,
    "isActive" BOOL NOT NULL DEFAULT true,
    "emailVerified" BOOL NOT NULL DEFAULT false,
    "emailVerifyToken" STRING,
    "resetToken" STRING,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "userId" STRING,
ADD COLUMN "ipAddress" STRING,
ADD COLUMN "userAgent" STRING,
ADD COLUMN "success" BOOL NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
