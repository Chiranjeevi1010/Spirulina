CREATE TABLE IF NOT EXISTS "whatsapp_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "whatsapp_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer,
	"customer_id" integer NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"message_type" varchar(30) NOT NULL,
	"wa_message_id" varchar(100),
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"error_message" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
