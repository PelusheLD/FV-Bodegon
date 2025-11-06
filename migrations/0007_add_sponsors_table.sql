-- Migración para crear la tabla de sponsors
-- Ejecuta este script en tu base de datos PostgreSQL

CREATE TABLE IF NOT EXISTS "sponsors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"website_url" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Índice para mejorar el rendimiento de las consultas por orden
CREATE INDEX IF NOT EXISTS "sponsors_order_idx" ON "sponsors" ("order");

-- Índice para mejorar el rendimiento de las consultas por estado habilitado
CREATE INDEX IF NOT EXISTS "sponsors_enabled_idx" ON "sponsors" ("enabled");

