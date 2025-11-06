ALTER TABLE "site_settings" ALTER COLUMN "latitude" SET DATA TYPE numeric(18, 15);--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "latitude" SET DEFAULT '9.552533674221890';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "longitude" SET DATA TYPE numeric(19, 15);--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "longitude" SET DEFAULT '-69.205197603437410';