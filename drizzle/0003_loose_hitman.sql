CREATE TYPE "public"."ai_action_type" AS ENUM('create_task', 'update_task', 'delete_task', 'create_invoice', 'update_invoice', 'send_document', 'update_deal_stage', 'create_project', 'add_milestone', 'update_milestone', 'send_message', 'provision_portal', 'rotate_credential', 'execute_playbook', 'modify_budget');--> statement-breakpoint
CREATE TYPE "public"."ai_approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('sin_contactar', 'contactado', 'pendiente', 'interesado', 'propuesta_enviada', 'pendiente_anticipo_50', 'cliente_activo', 'pausado', 'perdido');--> statement-breakpoint
CREATE TYPE "public"."entity_relation_type" AS ENUM('depends_on', 'blocks', 'relates_to', 'duplicates', 'parent_of', 'child_of', 'references', 'member_of', 'has_member');--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'published' BEFORE 'sent';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'void';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'issued' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'partially_paid' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'disputed' BEFORE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'canceled';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'waived';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'blocked';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'archived';--> statement-breakpoint
CREATE TABLE "ai_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_type" "ai_action_type" NOT NULL,
	"status" "ai_approval_status" DEFAULT 'pending' NOT NULL,
	"description" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"proposed_changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requested_by_id" uuid,
	"requested_by_name" text,
	"approved_by_id" uuid,
	"approved_by_name" text,
	"approved_at" timestamp with time zone,
	"rejected_by_id" uuid,
	"rejected_by_name" text,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"expires_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"execution_result" jsonb,
	"client_id" uuid,
	"project_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"priority" text DEFAULT 'normal' NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"project_id" uuid,
	"label" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"frequency" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"next_invoice_date" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text DEFAULT 'primary' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"confirmation_context" text NOT NULL,
	"snapshot_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "entity_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"relation_type" "entity_relation_type" DEFAULT 'relates_to' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_activity_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"actor_type" text NOT NULL,
	"actor_name" text,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_name" text,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_macros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_satisfaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"project_id" uuid,
	"client_id" uuid,
	"user_id" uuid,
	"duration_minutes" integer NOT NULL,
	"description" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "stage" SET DEFAULT 'sin_contactar'::"public"."deal_stage";--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "stage" SET DATA TYPE "public"."deal_stage" USING "stage"::"public"."deal_stage";--> statement-breakpoint
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_schedules" ADD CONSTRAINT "billing_schedules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_schedules" ADD CONSTRAINT "billing_schedules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."file_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_feed" ADD CONSTRAINT "portal_activity_feed_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_feed" ADD CONSTRAINT "portal_activity_feed_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_availability" ADD CONSTRAINT "team_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_satisfaction" ADD CONSTRAINT "ticket_satisfaction_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_approvals_status_idx" ON "ai_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_approvals_requested_by_idx" ON "ai_approvals" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "ai_approvals_client_idx" ON "ai_approvals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ai_approvals_project_idx" ON "ai_approvals" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "ai_approvals_entity_idx" ON "ai_approvals" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ai_approvals_pending_priority_idx" ON "ai_approvals" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "billing_schedules_client_idx" ON "billing_schedules" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "billing_schedules_next_date_idx" ON "billing_schedules" USING btree ("next_invoice_date");--> statement-breakpoint
CREATE INDEX "client_contacts_client_idx" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_signatures_doc_idx" ON "document_signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "email_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_sent_at_idx" ON "email_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "entity_relations_source_idx" ON "entity_relations" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "entity_relations_target_idx" ON "entity_relations" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_relations_unique_idx" ON "entity_relations" USING btree ("source_type","source_id","target_type","target_id","relation_type");--> statement-breakpoint
CREATE INDEX "file_folders_parent_idx" ON "file_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "file_shares_token_idx" ON "file_shares" USING btree ("token");--> statement-breakpoint
CREATE INDEX "kb_category_idx" ON "kb_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "kb_created_at_idx" ON "kb_articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "portal_feed_client_idx" ON "portal_activity_feed" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_feed_project_idx" ON "portal_activity_feed" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "portal_feed_entity_idx" ON "portal_activity_feed" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "portal_feed_created_at_idx" ON "portal_activity_feed" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "response_macros_category_idx" ON "response_macros" USING btree ("category");--> statement-breakpoint
CREATE INDEX "team_availability_user_idx" ON "team_availability" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_satisfaction_ticket_idx" ON "ticket_satisfaction" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "time_entries_task_idx" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_entries_logged_at_idx" ON "time_entries" USING btree ("logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_settings_category_key_idx" ON "workspace_settings" USING btree ("category","key");