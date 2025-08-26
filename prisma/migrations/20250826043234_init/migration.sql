-- CreateTable
CREATE TABLE "public"."PayLinkToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "orderName" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "PayLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayLinkToken_tokenHash_key" ON "public"."PayLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PayLinkToken_expiresAt_idx" ON "public"."PayLinkToken"("expiresAt");
