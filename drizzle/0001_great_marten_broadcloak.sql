ALTER TYPE "public"."entity_type" ADD VALUE 'repository' BEFORE 'ticket';--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'legal';--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'social_account';--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'team_member';--> statement-breakpoint
CREATE TABLE "content_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content_type" text NOT NULL,
	"status" text DEFAULT 'idea' NOT NULL,
	"scheduled_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'otro' NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"storage_provider" "storage_provider" DEFAULT 'neon' NOT NULL,
	"drive_file_id" text,
	"url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"type" text DEFAULT 'otro' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"owner" text NOT NULL,
	"repo_name" text NOT NULL,
	"description" text,
	"language" text,
	"language_color" text,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pushed_at" timestamp,
	"readme_content" text,
	"saved_reason" text NOT NULL,
	"implementation_status" text DEFAULT 'pendiente' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"handle" text NOT NULL,
	"email" text,
	"password_encrypted" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'team'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('team', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'team'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "knowledge_notes" ALTER COLUMN "type" SET DEFAULT 'note';--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "type" SET DEFAULT 'otro';--> statement-breakpoint
ALTER TABLE "agenda_events" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "agenda_events" ADD COLUMN "meet_link" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "content_base64" text;--> statement-breakpoint
ALTER TABLE "finances" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "finances" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "knowledge_notes" ADD COLUMN "idea_status" text DEFAULT 'semilla';--> statement-breakpoint
ALTER TABLE "knowledge_notes" ADD COLUMN "next_step" text;--> statement-breakpoint
ALTER TABLE "knowledge_notes" ADD COLUMN "related_project_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "content_plan" ADD CONSTRAINT "content_plan_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_notes" ADD CONSTRAINT "knowledge_notes_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;