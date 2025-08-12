
-- Bingo Vibe Marketing Command Center
-- Database Schema for Vercel Postgres Deployment
-- Generated from Prisma Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "cuid";

-- Create enums
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER');
CREATE TYPE "Platform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK');
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'IMAGE', 'TEXT', 'STORY', 'REEL', 'SHORT');
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');
CREATE TYPE "PostStatus" AS ENUM ('SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OutreachStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'REPLIED', 'INTERESTED', 'DECLINED', 'COLLABORATED');
CREATE TYPE "EventType" AS ENUM ('CONTENT_CREATION', 'PUBLISHING', 'CAMPAIGN_LAUNCH', 'REVIEW', 'SEASONAL');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_NEEDED');

-- Note: This schema will be applied via Prisma migration
-- Run: npx prisma db push --force-reset
-- Then: npx prisma db seed

-- This file is for reference. Actual deployment uses Prisma commands.
