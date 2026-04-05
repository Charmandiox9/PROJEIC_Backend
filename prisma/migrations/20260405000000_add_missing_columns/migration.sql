-- Migration: add_missing_columns
-- Agrega todas las columnas y tablas que existen en el schema pero no en la migración inicial

-- ─── Nuevos ENUMs ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('PROJECT_INVITATION', 'TASK_ASSIGNED', 'COMMENTARY_MENTION', 'SYSTEM_ALERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectMode" AS ENUM ('CLASSIC', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ResultStatus" AS ENUM ('NOT_STARTED', 'STARTED', 'IN_REVIEW', 'VALIDATED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nuevo valor en ActivityEntity
DO $$ BEGIN
  ALTER TYPE "ActivityEntity" ADD VALUE IF NOT EXISTS 'EXPECTED_RESULT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nuevo valor en ProjectMethodology
DO $$ BEGIN
  ALTER TYPE "ProjectMethodology" ADD VALUE IF NOT EXISTS 'NONE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Columnas nuevas en projects ────────────────────────────────────────────

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "isInstitutional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mode" "ProjectMode" NOT NULL DEFAULT 'CLASSIC';

-- ─── Columna status en project_members ──────────────────────────────────────

ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "status" "MemberStatus" NOT NULL DEFAULT 'PENDING';

-- ─── Columna expectedResultId en tasks ──────────────────────────────────────

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "expectedResultId" TEXT;

-- ─── Nueva tabla: notifications ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);

-- ─── Nueva tabla: subjects ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "period" TEXT NOT NULL,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla de relación: _SubjectProfessors ────────────────────────────────────

CREATE TABLE IF NOT EXISTS "_SubjectProfessors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_SubjectProfessors_AB_unique" ON "_SubjectProfessors"("A", "B");
CREATE INDEX IF NOT EXISTS "_SubjectProfessors_B_index" ON "_SubjectProfessors"("B");

-- ─── Nueva tabla: expected_results ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "expected_results" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ResultStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expected_results_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla de relación: _ResultCollaborators ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "_ResultCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ResultCollaborators_AB_unique" ON "_ResultCollaborators"("A", "B");
CREATE INDEX IF NOT EXISTS "_ResultCollaborators_B_index" ON "_ResultCollaborators"("B");

-- ─── Nueva tabla: "Evidence" ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Evidence" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "fileKey" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedResultId" TEXT NOT NULL,
    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- ─── Nueva tabla: "StatusLog" ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StatusLog" (
    "id" TEXT NOT NULL,
    "expectedResultId" TEXT NOT NULL,
    "previousStatus" "ResultStatus" NOT NULL,
    "newStatus" "ResultStatus" NOT NULL,
    "reason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusLog_pkey" PRIMARY KEY ("id")
);

-- ─── Foreign Keys nuevas ──────────────────────────────────────────────────────

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "notifications" VALIDATE CONSTRAINT "notifications_userId_fkey";

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "projects" VALIDATE CONSTRAINT "projects_subjectId_fkey";

ALTER TABLE "expected_results"
  ADD CONSTRAINT "expected_results_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "expected_results" VALIDATE CONSTRAINT "expected_results_projectId_fkey";

ALTER TABLE "expected_results"
  ADD CONSTRAINT "expected_results_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "expected_results" VALIDATE CONSTRAINT "expected_results_ownerId_fkey";

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_expectedResultId_fkey"
  FOREIGN KEY ("expectedResultId") REFERENCES "expected_results"("id") ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "tasks" VALIDATE CONSTRAINT "tasks_expectedResultId_fkey";

ALTER TABLE "Evidence"
  ADD CONSTRAINT "Evidence_expectedResultId_fkey"
  FOREIGN KEY ("expectedResultId") REFERENCES "expected_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Evidence" VALIDATE CONSTRAINT "Evidence_expectedResultId_fkey";

ALTER TABLE "StatusLog"
  ADD CONSTRAINT "StatusLog_expectedResultId_fkey"
  FOREIGN KEY ("expectedResultId") REFERENCES "expected_results"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "StatusLog" VALIDATE CONSTRAINT "StatusLog_expectedResultId_fkey";

ALTER TABLE "_SubjectProfessors"
  ADD CONSTRAINT "_SubjectProfessors_A_fkey"
  FOREIGN KEY ("A") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "_SubjectProfessors"
  ADD CONSTRAINT "_SubjectProfessors_B_fkey"
  FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "_ResultCollaborators"
  ADD CONSTRAINT "_ResultCollaborators_A_fkey"
  FOREIGN KEY ("A") REFERENCES "expected_results"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "_ResultCollaborators"
  ADD CONSTRAINT "_ResultCollaborators_B_fkey"
  FOREIGN KEY ("B") REFERENCES "project_members"("id") ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
