CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cat" text DEFAULT '' NOT NULL,
	"e" text DEFAULT '',
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"old_price" numeric(10, 2),
	"img" text DEFAULT '',
	"hit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"surname" text DEFAULT '',
	"phone" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '',
	"address" text DEFAULT '',
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pay_method" text DEFAULT 'cash' NOT NULL,
	"lang" text DEFAULT 'lv' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customer_id" text,
	"customer_phone" text,
	"ready_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"provider_charge_id" text,
	"telegram_id" bigint,
	"source" text DEFAULT 'web' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promos" (
	"id" text PRIMARY KEY NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subtitle" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"img" text DEFAULT '',
	"link" text DEFAULT '',
	"theme" text DEFAULT 'red' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"video" text DEFAULT '',
	"badge" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_id_menu_id_key" UNIQUE("order_id","menu_id"),
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_data" (
	"id" text PRIMARY KEY NOT NULL,
	"phone_norm" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"telegram_id" bigint,
	"lang" text DEFAULT 'ru',
	"points" integer DEFAULT 0 NOT NULL,
	"referred_by" bigint,
	CONSTRAINT "users_data_phone_norm_key" UNIQUE("phone_norm")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_menu_cat" ON "menu_items" USING btree ("cat");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_created" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_custid" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_source" ON "orders" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promos_active" ON "promos" USING btree ("active","sort");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_menu" ON "reviews" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_created" ON "reviews" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_phone_norm" ON "users_data" USING btree ("phone_norm");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_telegram_id" ON "users_data" USING btree ("telegram_id") WHERE telegram_id IS NOT NULL;