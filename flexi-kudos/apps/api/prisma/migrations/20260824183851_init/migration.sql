-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudos" (
    "id" UUID NOT NULL,
    "giver_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_handle_key" ON "members"("handle");

-- CreateIndex
CREATE INDEX "idx_members_active_name" ON "members"("is_active", "full_name");

-- CreateIndex
CREATE INDEX "idx_kudos_feed" ON "kudos"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_kudos_giver" ON "kudos"("giver_id");

-- CreateIndex
CREATE INDEX "idx_kudos_receiver" ON "kudos"("receiver_id");

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
