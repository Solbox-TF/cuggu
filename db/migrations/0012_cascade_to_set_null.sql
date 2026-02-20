-- AI 관련 테이블의 users FK를 CASCADE DELETE → SET NULL로 변경
-- 유저 삭제 시 AI 생성 이력/비용 데이터 보존 + S3 고아 파일 방지

-- ai_generations.user_id
ALTER TABLE "ai_generations" DROP CONSTRAINT IF EXISTS "ai_generations_user_id_users_id_fk";
ALTER TABLE "ai_generations" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ai_albums.user_id
ALTER TABLE "ai_albums" DROP CONSTRAINT IF EXISTS "ai_albums_user_id_users_id_fk";
ALTER TABLE "ai_albums" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "ai_albums" ADD CONSTRAINT "ai_albums_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ai_reference_photos.user_id
ALTER TABLE "ai_reference_photos" DROP CONSTRAINT IF EXISTS "ai_reference_photos_user_id_users_id_fk";
ALTER TABLE "ai_reference_photos" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "ai_reference_photos" ADD CONSTRAINT "ai_reference_photos_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ai_generation_jobs.user_id
ALTER TABLE "ai_generation_jobs" DROP CONSTRAINT IF EXISTS "ai_generation_jobs_user_id_users_id_fk";
ALTER TABLE "ai_generation_jobs" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ai_themes.user_id + invitation_id
ALTER TABLE "ai_themes" DROP CONSTRAINT IF EXISTS "ai_themes_user_id_users_id_fk";
ALTER TABLE "ai_themes" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "ai_themes" ADD CONSTRAINT "ai_themes_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "ai_themes" DROP CONSTRAINT IF EXISTS "ai_themes_invitation_id_invitations_id_fk";
ALTER TABLE "ai_themes" ADD CONSTRAINT "ai_themes_invitation_id_invitations_id_fk"
  FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE SET NULL;
