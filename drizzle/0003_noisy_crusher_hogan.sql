CREATE TYPE "public"."task_type" AS ENUM('code', 'design', 'marketing', 'content', 'document', 'meeting', 'research', 'ops', 'support', 'bug', 'feature', 'other');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "legal_documents" ADD COLUMN "content_base64" text;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD COLUMN "body_html" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "progress_mode" text DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "signatures" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "signatures" ADD COLUMN "pdf_hash" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_type" "task_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_user_idx" ON "api_tokens" USING btree ("user_id");