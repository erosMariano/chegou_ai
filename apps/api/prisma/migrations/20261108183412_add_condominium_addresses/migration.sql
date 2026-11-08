-- CreateTable
CREATE TABLE "condominiums" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(18),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "condominiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominium_addresses" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "street" VARCHAR(200) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "neighborhood" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,
    "address_aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "condominium_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_condominium_addresses_condominium_id" ON "condominium_addresses"("condominium_id");

-- AddForeignKey
ALTER TABLE "condominium_addresses" ADD CONSTRAINT "condominium_addresses_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
