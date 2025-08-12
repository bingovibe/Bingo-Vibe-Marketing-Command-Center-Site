
-- CreateEnum for outreach status
CREATE TYPE "OutreachStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'REPLIED', 'INTERESTED', 'DECLINED', 'COLLABORATED');

-- CreateTable for Influencer
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "niche" TEXT,
    "location" TEXT,
    "contactInfo" JSONB,
    "tags" TEXT[],
    "notes" TEXT,
    "rating" INTEGER DEFAULT 0,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "lastContactDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable for OutreachEmail
CREATE TABLE "OutreachEmail" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable for OutreachTemplate
CREATE TABLE "OutreachTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "variables" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_email_userId_key" ON "Influencer"("email", "userId");
CREATE INDEX "Influencer_userId_idx" ON "Influencer"("userId");
CREATE INDEX "Influencer_platform_idx" ON "Influencer"("platform");
CREATE INDEX "Influencer_followerCount_idx" ON "Influencer"("followerCount");

CREATE INDEX "OutreachEmail_influencerId_idx" ON "OutreachEmail"("influencerId");
CREATE INDEX "OutreachEmail_campaignId_idx" ON "OutreachEmail"("campaignId");
CREATE INDEX "OutreachEmail_userId_idx" ON "OutreachEmail"("userId");
CREATE INDEX "OutreachEmail_status_idx" ON "OutreachEmail"("status");

CREATE INDEX "OutreachTemplate_userId_idx" ON "OutreachTemplate"("userId");

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutreachTemplate" ADD CONSTRAINT "OutreachTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
