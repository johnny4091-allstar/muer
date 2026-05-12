-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CommandType" AS ENUM ('MESSAGE', 'CLEAR_CACHE', 'RESTART', 'FORCE_UPDATE', 'TERMINATE', 'WIPE', 'PUSH_SETTINGS');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('STUCK_PLAYER', 'PLAYBACK_FAILED', 'NUCLEAR_RECOVERY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('QUEUED', 'SENDING', 'DONE');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'RECORDING', 'DONE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('CHANNEL', 'MOVIE', 'SERIES');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('QUEUED', 'BUILDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Reseller" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XtreamConfig" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "panelUrl" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XtreamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "model" TEXT,
    "appVersion" TEXT,
    "ipAddress" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" "CommandType" NOT NULL,
    "payload" JSONB,
    "status" "CommandStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "errorType" "ErrorType" NOT NULL,
    "streamUrl" TEXT,
    "recoveryStatus" TEXT,
    "raw" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetAll" BOOLEAN NOT NULL DEFAULT true,
    "targetIds" TEXT[],
    "status" "BroadcastStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastDelivery" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "BroadcastDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetSettings" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "bufferSize" INTEGER NOT NULL DEFAULT 3000,
    "epgRefreshInterval" INTEGER NOT NULL DEFAULT 3600,
    "playbackOptions" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpgEntry" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "poster" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpgEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DvrSchedule" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "episodeInfo" TEXT,
    "airDate" TIMESTAMP(3),
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DvrSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DvrRecording" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DvrRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DvrQuota" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "quotaBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "usedBytes" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DvrQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "itemType" "FavoriteType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnsEntry" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "targetIp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DnsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionConfig" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "masterVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "autoUpdate" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionPin" (
    "id" TEXT NOT NULL,
    "versionConfigId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pinnedVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionPin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppBuild" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "logoPath" TEXT,
    "splashPath" TEXT,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "downloadUrl" TEXT,
    "buildLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AppBuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebPlayerDeployment" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "vpsIp" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "label" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastHeartbeat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebPlayerDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_email_key" ON "Reseller"("email");

-- CreateIndex
CREATE UNIQUE INDEX "XtreamConfig_resellerId_key" ON "XtreamConfig"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceCommand_deviceId_status_idx" ON "DeviceCommand"("deviceId", "status");

-- CreateIndex
CREATE INDEX "ErrorLog_deviceId_idx" ON "ErrorLog"("deviceId");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_broadcastId_idx" ON "BroadcastDelivery"("broadcastId");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_deviceId_idx" ON "BroadcastDelivery"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FleetSettings_resellerId_key" ON "FleetSettings"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "EpgEntry_channelId_resellerId_startTime_key" ON "EpgEntry"("channelId", "resellerId", "startTime");

-- CreateIndex
CREATE INDEX "EpgEntry_channelId_resellerId_startTime_idx" ON "EpgEntry"("channelId", "resellerId", "startTime");

-- CreateIndex
CREATE INDEX "EpgEntry_resellerId_startTime_idx" ON "EpgEntry"("resellerId", "startTime");

-- CreateIndex
CREATE INDEX "DvrSchedule_deviceId_idx" ON "DvrSchedule"("deviceId");

-- CreateIndex
CREATE INDEX "DvrSchedule_status_startTime_idx" ON "DvrSchedule"("status", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "DvrRecording_scheduleId_key" ON "DvrRecording"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "DvrQuota_deviceId_key" ON "DvrQuota"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_deviceId_itemType_itemId_key" ON "Favorite"("deviceId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "Favorite_deviceId_idx" ON "Favorite"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DnsEntry_subdomain_key" ON "DnsEntry"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "VersionConfig_resellerId_key" ON "VersionConfig"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionPin_versionConfigId_deviceId_key" ON "VersionPin"("versionConfigId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "WebPlayerDeployment_instanceId_key" ON "WebPlayerDeployment"("instanceId");

-- AddForeignKey
ALTER TABLE "XtreamConfig" ADD CONSTRAINT "XtreamConfig_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetSettings" ADD CONSTRAINT "FleetSettings_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DvrSchedule" ADD CONSTRAINT "DvrSchedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DvrRecording" ADD CONSTRAINT "DvrRecording_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DvrSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DvrQuota" ADD CONSTRAINT "DvrQuota_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnsEntry" ADD CONSTRAINT "DnsEntry_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionConfig" ADD CONSTRAINT "VersionConfig_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionPin" ADD CONSTRAINT "VersionPin_versionConfigId_fkey" FOREIGN KEY ("versionConfigId") REFERENCES "VersionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppBuild" ADD CONSTRAINT "AppBuild_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebPlayerDeployment" ADD CONSTRAINT "WebPlayerDeployment_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
