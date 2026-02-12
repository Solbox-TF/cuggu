ALTER TABLE "ai_albums" ADD COLUMN IF NOT EXISTS "groups" jsonb DEFAULT '[]'::jsonb;
