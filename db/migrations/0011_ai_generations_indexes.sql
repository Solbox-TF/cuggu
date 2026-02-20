-- AI generations 누락 인덱스 추가
-- albumId: 앨범별 생성 이력 조회 (N+1 → 단일 쿼리)
-- jobId: Job 완료 시 생성 건 조회

CREATE INDEX IF NOT EXISTS "ai_generations_album_id_idx" ON "ai_generations" ("album_id");
CREATE INDEX IF NOT EXISTS "ai_generations_job_id_idx" ON "ai_generations" ("job_id");
