CREATE TYPE "public"."ai_generation_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ai_style" AS ENUM('CLASSIC', 'MODERN', 'VINTAGE', 'ROMANTIC', 'CINEMATIC');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('ATTENDING', 'NOT_ATTENDING', 'MAYBE');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('DRAFT', 'PUBLISHED', 'EXPIRED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."meal_option" AS ENUM('ADULT', 'CHILD', 'VEGETARIAN', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('TOSS', 'KAKAO_PAY', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('PREMIUM_UPGRADE', 'AI_CREDITS', 'AI_CREDITS_BUNDLE');--> statement-breakpoint
CREATE TYPE "public"."premium_plan" AS ENUM('FREE', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('CLASSIC', 'MODERN', 'VINTAGE', 'FLORAL', 'MINIMAL');--> statement-breakpoint
CREATE TYPE "public"."template_tier" AS ENUM('FREE', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "accounts_provider_account_idx" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"original_url" varchar(500) NOT NULL,
	"style" "ai_style" NOT NULL,
	"generated_urls" text[],
	"selected_url" varchar(500),
	"status" "ai_generation_status" DEFAULT 'PENDING' NOT NULL,
	"credits_used" integer DEFAULT 1 NOT NULL,
	"cost" real NOT NULL,
	"replicate_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"template_id" varchar(128) NOT NULL,
	"groom_name" varchar(255) NOT NULL,
	"bride_name" varchar(255) NOT NULL,
	"wedding_date" timestamp NOT NULL,
	"venue_name" varchar(255) NOT NULL,
	"venue_address" varchar(500),
	"intro_message" text,
	"gallery_images" text[],
	"ai_photo_url" varchar(500),
	"is_password_protected" boolean DEFAULT false NOT NULL,
	"password_hash" varchar(255),
	"view_count" integer DEFAULT 0 NOT NULL,
	"status" "invitation_status" DEFAULT 'DRAFT' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"type" "payment_type" NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" integer NOT NULL,
	"credits_granted" integer,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"order_id" varchar(255),
	"payment_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"invitation_id" varchar(128) NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_phone" varchar(500),
	"guest_email" varchar(500),
	"attendance" "attendance_status" NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"meal_option" "meal_option",
	"message" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "template_category" NOT NULL,
	"tier" "template_tier" DEFAULT 'FREE' NOT NULL,
	"thumbnail" varchar(500) NOT NULL,
	"config" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"premium_plan" "premium_plan" DEFAULT 'FREE' NOT NULL,
	"ai_credits" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_generations_user_status_idx" ON "ai_generations" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "invitations_user_id_idx" ON "invitations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_status_expires_idx" ON "invitations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "payments_user_status_idx" ON "payments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "rsvps_invitation_id_idx" ON "rsvps" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_tier_active_idx" ON "templates" USING btree ("tier","is_active");