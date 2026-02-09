CREATE TYPE "ai_theme_status" AS ENUM ('completed', 'safelist_failed');

CREATE TABLE "ai_themes" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "user_id" varchar(128) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invitation_id" varchar(128) REFERENCES "invitations"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL,
  "theme" jsonb NOT NULL,
  "status" "ai_theme_status" DEFAULT 'completed' NOT NULL,
  "fail_reason" text,
  "credits_used" integer DEFAULT 1 NOT NULL,
  "input_tokens" integer,
  "output_tokens" integer,
  "cost" real,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "ai_themes_user_id_idx" ON "ai_themes" ("user_id");
CREATE INDEX "ai_themes_invitation_id_idx" ON "ai_themes" ("invitation_id");
