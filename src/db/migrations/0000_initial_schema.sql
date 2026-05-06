CREATE TYPE "public"."calendar_system" AS ENUM('solar', 'lunar');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."fortune_category" AS ENUM('general', 'love', 'money', 'career', 'health', 'study');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'on_trial', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."tarot_spread" AS ENUM('single', 'three', 'celtic');--> statement-breakpoint
-- 주의: "auth"."users" 는 Supabase 가 관리하므로 우리가 생성하지 않는다.
-- 외래키 ALTER 문은 실제 auth.users 테이블을 참조한다.
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"token_input" integer,
	"token_output" integer,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT '새로운 문답' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compatibility_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"partner_name" text NOT NULL,
	"partner_birth_date" date NOT NULL,
	"partner_birth_time" time,
	"partner_calendar_system" "calendar_system" DEFAULT 'solar' NOT NULL,
	"partner_gender" "gender" NOT NULL,
	"partner_mbti" text,
	"score" integer NOT NULL,
	"summary" text NOT NULL,
	"detail" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_fortunes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fortune_date" date NOT NULL,
	"category" "fortune_category" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"score" integer NOT NULL,
	"lucky_color" text,
	"lucky_number" integer,
	"lucky_direction" text,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_fortunes_user_date_category_uniq" UNIQUE("user_id","fortune_date","category")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"birth_date" date NOT NULL,
	"birth_time" time,
	"calendar_system" "calendar_system" DEFAULT 'solar' NOT NULL,
	"gender" "gender" NOT NULL,
	"mbti" text,
	"birth_place" text,
	"saju_pillars" jsonb,
	"five_elements" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ls_order_id" text NOT NULL,
	"product_key" text NOT NULL,
	"amount" integer NOT NULL,
	"status" "purchase_status" NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_ls_order_id_unique" UNIQUE("ls_order_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ls_subscription_id" text NOT NULL,
	"ls_customer_id" text NOT NULL,
	"ls_variant_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_starts_at" timestamp with time zone,
	"current_period_ends_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"ended_at" timestamp with time zone,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_ls_subscription_id_unique" UNIQUE("ls_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tarot_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"spread_type" "tarot_spread" NOT NULL,
	"question" text,
	"cards" jsonb NOT NULL,
	"interpretation" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"fortune_count" integer DEFAULT 0 NOT NULL,
	"tarot_count" integer DEFAULT 0 NOT NULL,
	"chat_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_quotas_user_date_uniq" UNIQUE("user_id","usage_date")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_name" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"raw" jsonb,
	CONSTRAINT "webhook_events_provider_event_uniq" UNIQUE("provider","event_id")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_readings" ADD CONSTRAINT "compatibility_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_fortunes" ADD CONSTRAINT "daily_fortunes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_quotas" ADD CONSTRAINT "usage_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_sessions_user_recent_idx" ON "chat_sessions" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "compatibility_readings_user_created_idx" ON "compatibility_readings" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "daily_fortunes_user_date_idx" ON "daily_fortunes" USING btree ("user_id","fortune_date");--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tarot_readings_user_created_idx" ON "tarot_readings" USING btree ("user_id","created_at");