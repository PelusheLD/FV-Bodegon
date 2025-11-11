ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_confirmed";
ALTER TABLE "orders" ADD COLUMN "payment_status" text NOT NULL DEFAULT 'pending';

