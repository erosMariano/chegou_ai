-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PORTER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('RECEIVED', 'NOTIFIED', 'NOTIFICATION_FAILED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "block" VARCHAR(20) NOT NULL DEFAULT 'UNICO',
    "number" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "document_last4" VARCHAR(4),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "user_agent" VARCHAR(255),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PORTER',
    "unit_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "registered_by_user_id" UUID NOT NULL,
    "delivered_to_resident_id" UUID,
    "recipient_name_raw" VARCHAR(150) NOT NULL,
    "tracking_code" VARCHAR(100),
    "carrier" VARCHAR(80),
    "pickup_pin_hash" VARCHAR(255) NOT NULL,
    "pickup_qr_token" UUID NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'RECEIVED',
    "ai_confidence_score" DECIMAL(3,2),
    "version" INTEGER NOT NULL DEFAULT 1,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_events" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_unit_block_number" ON "units"("block", "number");

-- CreateIndex
CREATE INDEX "idx_residents_unit_id" ON "residents"("unit_id");

-- CreateIndex
CREATE INDEX "idx_residents_email" ON "residents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "idx_push_subs_resident_valid" ON "push_subscriptions"("resident_id", "is_valid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "packages_pickup_qr_token_key" ON "packages"("pickup_qr_token");

-- CreateIndex
CREATE INDEX "idx_packages_unit_status" ON "packages"("unit_id", "status");

-- CreateIndex
CREATE INDEX "idx_packages_tracking_code" ON "packages"("tracking_code");

-- CreateIndex
CREATE INDEX "idx_package_events_package_id" ON "package_events"("package_id", "created_at");

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_registered_by_user_id_fkey" FOREIGN KEY ("registered_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_delivered_to_resident_id_fkey" FOREIGN KEY ("delivered_to_resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_events" ADD CONSTRAINT "package_events_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_events" ADD CONSTRAINT "package_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
