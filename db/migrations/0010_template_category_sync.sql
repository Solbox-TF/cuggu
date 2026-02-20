-- 템플릿 카테고리 enum 동기화: ELEGANT, NATURAL 추가 / VINTAGE 제거
-- 실제 사용 중인 컴포넌트: classic, modern, floral, minimal, elegant, natural

-- 새 값 추가
ALTER TYPE "template_category" ADD VALUE IF NOT EXISTS 'ELEGANT';
ALTER TYPE "template_category" ADD VALUE IF NOT EXISTS 'NATURAL';

-- 주의: PostgreSQL에서 enum 값 제거는 직접 불가.
-- VINTAGE를 사용하는 행이 없다면, 새 enum 타입으로 교체하는 방법이 있지만
-- 현재는 VINTAGE를 남겨두고 (사용하지 않지만 호환성 유지) ELEGANT, NATURAL만 추가한다.
-- 추후 VINTAGE 데이터가 없음이 확인되면 enum 재생성으로 제거 가능.
