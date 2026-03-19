-- CreateEnum
CREATE TYPE "DutyInterval" AS ENUM ('I0800_1200', 'I1200_1600', 'I1600_2000');

-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('GRASS', 'SHRUB', 'TREE');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "displayName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duty" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "interval" "DutyInterval" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Duty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantRecord" (
    "id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "type" "PlantType" NOT NULL,
    "endangered" BOOLEAN NOT NULL DEFAULT false,
    "detectionTime" TIMESTAMP(3) NOT NULL,
    "gpsLat" DECIMAL(9,6) NOT NULL,
    "gpsLng" DECIMAL(9,6) NOT NULL,
    "dutyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_approvedAt_idx" ON "User"("approvedAt");

-- CreateIndex
CREATE INDEX "Zone_name_idx" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Duty_date_interval_employeeId_key" ON "Duty"("date", "interval", "employeeId");

-- CreateIndex
CREATE INDEX "Duty_date_interval_idx" ON "Duty"("date", "interval");

-- CreateIndex
CREATE INDEX "Duty_employeeId_idx" ON "Duty"("employeeId");

-- CreateIndex
CREATE INDEX "Duty_zoneId_idx" ON "Duty"("zoneId");

-- CreateIndex
CREATE INDEX "PlantRecord_dutyId_detectionTime_idx" ON "PlantRecord"("dutyId", "detectionTime");

-- CreateIndex
CREATE INDEX "PlantRecord_type_idx" ON "PlantRecord"("type");

-- CreateIndex
CREATE INDEX "PlantRecord_endangered_idx" ON "PlantRecord"("endangered");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantRecord" ADD CONSTRAINT "PlantRecord_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantRecord" ADD CONSTRAINT "PlantRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

