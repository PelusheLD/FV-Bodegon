CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"ley_seca" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"measurement_type" text NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_address" text,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category_id" varchar NOT NULL,
	"image_url" text,
	"measurement_type" text DEFAULT 'unit' NOT NULL,
	"external_code" text,
	"stock" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" text NOT NULL,
	"site_description" text NOT NULL,
	"hero_title" text,
	"contact_phone" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_address" text NOT NULL,
	"facebook_url" text,
	"instagram_url" text,
	"twitter_url" text,
	"tax_percentage" numeric(5, 2) DEFAULT '16.00' NOT NULL,
	"enable_carousel_1" boolean DEFAULT true NOT NULL,
	"enable_carousel_2" boolean DEFAULT true NOT NULL,
	"enable_carousel_3" boolean DEFAULT true NOT NULL,
	"carousel_title_1" text,
	"carousel_subtitle_1" text,
	"carousel_description_1" text,
	"carousel_image_1" text,
	"carousel_background_1" text,
	"carousel_button_1" text,
	"carousel_url_1" text,
	"carousel_title_2" text,
	"carousel_subtitle_2" text,
	"carousel_description_2" text,
	"carousel_image_2" text,
	"carousel_background_2" text,
	"carousel_button_2" text,
	"carousel_url_2" text,
	"carousel_title_3" text,
	"carousel_subtitle_3" text,
	"carousel_description_3" text,
	"carousel_image_3" text,
	"carousel_background_3" text,
	"carousel_button_3" text,
	"carousel_url_3" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;