-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'evm',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "usd_amount" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "chain" TEXT NOT NULL,
    "required_amount_native" TEXT NOT NULL,
    "receive_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tx_hash" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_periods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "source_invoice_id" TEXT NOT NULL,

    CONSTRAINT "subscription_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'courtyard',
    "chain" TEXT NOT NULL DEFAULT 'evm',
    "address" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets_raw" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "token_uri" TEXT,
    "raw_metadata" JSONB,
    "last_indexed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slabs" (
    "id" TEXT NOT NULL,
    "asset_raw_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'courtyard',
    "cert_number" TEXT,
    "grader" TEXT,
    "grade" TEXT,
    "set_name" TEXT,
    "card_name" TEXT,
    "card_number" TEXT,
    "variant" TEXT,
    "image_url" TEXT,
    "fingerprint_text" TEXT,
    "parse_status" TEXT NOT NULL DEFAULT 'fail',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "slab_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'alt',
    "market_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "retrieved_at" TIMESTAMP(3) NOT NULL,
    "raw_response" JSONB,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_snapshots_daily" (
    "id" TEXT NOT NULL,
    "slab_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "market_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "price_snapshots_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_references" (
    "id" TEXT NOT NULL,
    "set_name" TEXT NOT NULL,
    "total_cards" INTEGER NOT NULL,
    "release_year" INTEGER,
    "generation" TEXT,

    CONSTRAINT "set_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_progress" (
    "id" TEXT NOT NULL,
    "tracked_address_id" TEXT NOT NULL,
    "set_name" TEXT NOT NULL,
    "owned_count" INTEGER NOT NULL,
    "total_cards" INTEGER NOT NULL,
    "completion_pct" DECIMAL(5,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "set_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_wallet_address_chain_key" ON "auth_identities"("wallet_address", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_periods_source_invoice_id_key" ON "subscription_periods"("source_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_addresses_address_platform_key" ON "tracked_addresses"("address", "platform");

-- CreateIndex
CREATE INDEX "assets_raw_owner_address_idx" ON "assets_raw"("owner_address");

-- CreateIndex
CREATE UNIQUE INDEX "assets_raw_contract_address_token_id_key" ON "assets_raw"("contract_address", "token_id");

-- CreateIndex
CREATE UNIQUE INDEX "slabs_asset_raw_id_key" ON "slabs"("asset_raw_id");

-- CreateIndex
CREATE INDEX "slabs_cert_number_idx" ON "slabs"("cert_number");

-- CreateIndex
CREATE INDEX "slabs_set_name_idx" ON "slabs"("set_name");

-- CreateIndex
CREATE INDEX "slabs_platform_idx" ON "slabs"("platform");

-- CreateIndex
CREATE INDEX "prices_slab_id_retrieved_at_idx" ON "prices"("slab_id", "retrieved_at");

-- CreateIndex
CREATE UNIQUE INDEX "price_snapshots_daily_slab_id_date_key" ON "price_snapshots_daily"("slab_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "set_references_set_name_key" ON "set_references"("set_name");

-- CreateIndex
CREATE UNIQUE INDEX "set_progress_tracked_address_id_set_name_key" ON "set_progress"("tracked_address_id", "set_name");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_source_invoice_id_fkey" FOREIGN KEY ("source_invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_addresses" ADD CONSTRAINT "tracked_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_asset_raw_id_fkey" FOREIGN KEY ("asset_raw_id") REFERENCES "assets_raw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_slab_id_fkey" FOREIGN KEY ("slab_id") REFERENCES "slabs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_snapshots_daily" ADD CONSTRAINT "price_snapshots_daily_slab_id_fkey" FOREIGN KEY ("slab_id") REFERENCES "slabs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_progress" ADD CONSTRAINT "set_progress_tracked_address_id_fkey" FOREIGN KEY ("tracked_address_id") REFERENCES "tracked_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
