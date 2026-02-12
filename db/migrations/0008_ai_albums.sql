-- AI Albums table for album v2 feature
CREATE TYPE "public"."ai_album_status" AS ENUM('draft', 'completed', 'applied');

CREATE TABLE "ai_albums" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"invitation_id" varchar(128),
	"name" varchar(255) DEFAULT 'My Album' NOT NULL,
	"snap_type" varchar(32),
	"images" jsonb DEFAULT '[]'::jsonb,
	"status" "ai_album_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "ai_generations" ADD COLUMN "album_id" varchar(128);

ALTER TABLE "ai_albums" ADD CONSTRAINT "ai_albums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_albums" ADD CONSTRAINT "ai_albums_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "ai_albums_user_id_idx" ON "ai_albums" USING btree ("user_id");

ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_album_id_ai_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."ai_albums"("id") ON DELETE set null ON UPDATE no action;
