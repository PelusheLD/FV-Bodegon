ALTER TABLE "site_settings" ALTER COLUMN "latitude" SET DATA TYPE numeric(10, 6);--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "latitude" SET DEFAULT '9.552534';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "longitude" SET DATA TYPE numeric(11, 6);--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "longitude" SET DEFAULT '-69.205198';