ALTER TABLE "orders" ADD COLUMN "total_in_bolivares" numeric(10, 2);
ALTER TABLE "orders" ADD COLUMN "payment_bank" text;
ALTER TABLE "orders" ADD COLUMN "payment_ci" text;
ALTER TABLE "orders" ADD COLUMN "payment_phone" text;
ALTER TABLE "orders" ADD COLUMN "payment_confirmed" boolean NOT NULL DEFAULT false;

