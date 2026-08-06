-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SERVICE_OPEN', 'CATEGORY_OPEN', 'SEARCH', 'SESSION_TIMEOUT', 'SESSION_RESET', 'LANGUAGE_CHANGE', 'FONT_SIZE_CHANGE', 'HOME_RETURN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE_SERVICE', 'UPDATE_SERVICE', 'DELETE_SERVICE', 'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY', 'CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN', 'UPDATE_SETTINGS');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "login" VARCHAR(80) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "titleRu" VARCHAR(160) NOT NULL,
    "titleKz" VARCHAR(160) NOT NULL,
    "descriptionRu" VARCHAR(600) NOT NULL,
    "descriptionKz" VARCHAR(600) NOT NULL,
    "icon" VARCHAR(60) NOT NULL DEFAULT 'Folder',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "titleRu" VARCHAR(220) NOT NULL,
    "titleKz" VARCHAR(220) NOT NULL,
    "shortDescriptionRu" VARCHAR(800) NOT NULL,
    "shortDescriptionKz" VARCHAR(800) NOT NULL,
    "fullDescriptionRu" TEXT NOT NULL,
    "fullDescriptionKz" TEXT NOT NULL,
    "targetAudienceRu" TEXT NOT NULL,
    "targetAudienceKz" TEXT NOT NULL,
    "requiredDocumentsRu" JSONB NOT NULL,
    "requiredDocumentsKz" JSONB NOT NULL,
    "requiredDataRu" JSONB NOT NULL,
    "requiredDataKz" JSONB NOT NULL,
    "conditionsRu" TEXT NOT NULL,
    "conditionsKz" TEXT NOT NULL,
    "stepsRu" JSONB NOT NULL,
    "stepsKz" JSONB NOT NULL,
    "processingTimeRu" VARCHAR(300) NOT NULL,
    "processingTimeKz" VARCHAR(300) NOT NULL,
    "costRu" VARCHAR(300) NOT NULL,
    "costKz" VARCHAR(300) NOT NULL,
    "resultRu" TEXT NOT NULL,
    "resultKz" TEXT NOT NULL,
    "rejectionReasonsRu" JSONB NOT NULL,
    "rejectionReasonsKz" JSONB NOT NULL,
    "contactsRu" VARCHAR(500) NOT NULL,
    "contactsKz" VARCHAR(500) NOT NULL,
    "officeAddressRu" VARCHAR(500) NOT NULL,
    "officeAddressKz" VARCHAR(500) NOT NULL,
    "workingHoursRu" VARCHAR(500) NOT NULL,
    "workingHoursKz" VARCHAR(500) NOT NULL,
    "keywordsRu" VARCHAR(1000) NOT NULL,
    "keywordsKz" VARCHAR(1000) NOT NULL,
    "icon" VARCHAR(60) NOT NULL DEFAULT 'FileText',
    "categoryId" INTEGER NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "organizationNameRu" VARCHAR(240) NOT NULL,
    "organizationNameKz" VARCHAR(240) NOT NULL,
    "contactPhone" VARCHAR(80) NOT NULL,
    "addressRu" VARCHAR(500) NOT NULL,
    "addressKz" VARCHAR(500) NOT NULL,
    "workingHoursRu" VARCHAR(300) NOT NULL,
    "workingHoursKz" VARCHAR(300) NOT NULL,
    "inactivitySeconds" INTEGER NOT NULL DEFAULT 60,
    "warningSeconds" INTEGER NOT NULL DEFAULT 10,
    "defaultLanguage" VARCHAR(2) NOT NULL DEFAULT 'ru',
    "showCurrentTime" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessageRu" VARCHAR(500) NOT NULL,
    "maintenanceMessageKz" VARCHAR(500) NOT NULL,
    "popularServicesCount" INTEGER NOT NULL DEFAULT 6,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "serviceId" INTEGER,
    "categoryId" INTEGER,
    "searchQuery" VARCHAR(120),
    "sessionId" VARCHAR(80) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(80),
    "entityId" VARCHAR(80),
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" VARCHAR(80),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_login_key" ON "AdminUser"("login");

-- CreateIndex
CREATE INDEX "AdminUser_login_idx" ON "AdminUser"("login");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "AdminUser_createdAt_idx" ON "AdminUser"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isPublished_idx" ON "Category"("isPublished");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Category_createdAt_idx" ON "Category"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_slug_idx" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_isPublished_idx" ON "Service"("isPublished");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Service_isPopular_idx" ON "Service"("isPopular");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "Service"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_serviceId_idx" ON "AnalyticsEvent"("serviceId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_categoryId_idx" ON "AnalyticsEvent"("categoryId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_idx" ON "AuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
