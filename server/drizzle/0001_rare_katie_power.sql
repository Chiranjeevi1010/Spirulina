ALTER TABLE "production" ALTER COLUMN "dryer_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "production" ALTER COLUMN "powder_output_kg" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "production" ALTER COLUMN "powder_output_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "production" ADD COLUMN "wet_output_kg" numeric(10, 3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "production" ADD COLUMN "output_type" varchar(20) DEFAULT 'powder' NOT NULL;