# AI 스타일 프롬프트 업그레이드 계획

## 목표
1. 기존 5개 스타일 → 새 10개 컨셉으로 교체
2. 모델 선택을 "고급 옵션"으로 노출

---

## 스타일 변경 내역

### 기존 (5개)
| ID | 한글명 | 프롬프트 |
|----|--------|----------|
| CLASSIC | 클래식 | elegant traditional Korean wedding hanbok... |
| MODERN | 모던 | contemporary wedding dress, minimalist... |
| VINTAGE | 빈티지 | vintage wedding attire, warm sepia tones... |
| ROMANTIC | 로맨틱 | romantic wedding scene, soft focus... |
| CINEMATIC | 시네마틱 | cinematic wedding portrait, dramatic... |

### 신규 (10개)
| ID | 한글명 | 영문명 | 설명 |
|----|--------|--------|------|
| CLASSIC_STUDIO | 클래식 스튜디오 | Classic & Elegant Studio | 정석적인 스튜디오 화보 |
| OUTDOOR_GARDEN | 야외 가든 | Lush Outdoor Garden | 자연광 정원 로맨스 |
| SUNSET_BEACH | 해변 일몰 | Sunset Beach | 열대 해변 석양 |
| TRADITIONAL_HANBOK | 전통 한복 | Traditional Korean Hanbok | 고궁/한옥 배경 혼례복 |
| VINTAGE_CINEMATIC | 빈티지 영화 | Vintage Cinematic Retro | 50-60년대 필름 감성 |
| LUXURY_HOTEL | 럭셔리 호텔 | Glamorous Hotel | 샹들리에 호텔 볼룸 |
| CITY_LIFESTYLE | 도시 스냅 | Candid City Lifestyle | 도심 스트릿 스냅 |
| ENCHANTED_FOREST | 동화 숲 | Fairytale Forest | 몽환적인 숲속 요정 |
| BLACK_AND_WHITE | 흑백 포트릿 | Black & White Portrait | 시대초월 흑백 감성 |
| MINIMALIST_GALLERY | 미니멀리즘 | Minimalist Gallery | 갤러리 아트 스타일 |

---

## 수정 대상 파일

### Phase 1: 타입 및 프롬프트
| 파일 | 변경 내용 |
|------|-----------|
| `types/ai.ts` | AIStyle 타입 10개로 교체, AI_STYLES 배열 업데이트 |
| `lib/ai/replicate.ts` | STYLE_PROMPTS를 ai-prompt.md 기반으로 교체 |

### Phase 2: UI 변경
| 파일 | 변경 내용 |
|------|-----------|
| `components/editor/tabs/gallery/AIPhotoGenerator.tsx` | 고급 설정 섹션 추가 (모델 선택) |
| `app/dashboard/ai-photos/components/StyleSelector.tsx` | 10개 스타일 그리드 레이아웃 조정 |

### Phase 3: DB 마이그레이션
| 파일 | 변경 내용 |
|------|-----------|
| `db/schema.ts` | aiStyleEnum에 새 10개 값 추가 |
| 마이그레이션 SQL | 기존 데이터 매핑 |

---

## DB 마이그레이션 전략

PostgreSQL enum은 값 추가는 가능하지만 삭제는 까다로움.
→ 기존 5개 유지 + 새 10개 추가 후 데이터 매핑

### 매핑 규칙
| 기존 | → | 신규 |
|------|---|------|
| CLASSIC | → | CLASSIC_STUDIO |
| MODERN | → | MINIMALIST_GALLERY |
| VINTAGE | → | VINTAGE_CINEMATIC |
| ROMANTIC | → | OUTDOOR_GARDEN |
| CINEMATIC | → | LUXURY_HOTEL |

### 마이그레이션 SQL
```sql
-- 1. 새 enum 값 추가
ALTER TYPE ai_style ADD VALUE 'CLASSIC_STUDIO';
ALTER TYPE ai_style ADD VALUE 'OUTDOOR_GARDEN';
ALTER TYPE ai_style ADD VALUE 'SUNSET_BEACH';
ALTER TYPE ai_style ADD VALUE 'TRADITIONAL_HANBOK';
ALTER TYPE ai_style ADD VALUE 'VINTAGE_CINEMATIC';
ALTER TYPE ai_style ADD VALUE 'LUXURY_HOTEL';
ALTER TYPE ai_style ADD VALUE 'CITY_LIFESTYLE';
ALTER TYPE ai_style ADD VALUE 'ENCHANTED_FOREST';
ALTER TYPE ai_style ADD VALUE 'BLACK_AND_WHITE';
ALTER TYPE ai_style ADD VALUE 'MINIMALIST_GALLERY';

-- 2. 기존 데이터 매핑
UPDATE ai_generations SET style = 'CLASSIC_STUDIO' WHERE style = 'CLASSIC';
UPDATE ai_generations SET style = 'MINIMALIST_GALLERY' WHERE style = 'MODERN';
UPDATE ai_generations SET style = 'VINTAGE_CINEMATIC' WHERE style = 'VINTAGE';
UPDATE ai_generations SET style = 'OUTDOOR_GARDEN' WHERE style = 'ROMANTIC';
UPDATE ai_generations SET style = 'LUXURY_HOTEL' WHERE style = 'CINEMATIC';
```

---

## 고급 설정 UI (모델 선택)

### 현재
- flux-pro 고정 (개발 모드에서만 변경 가능)

### 변경 후
```
┌─────────────────────────────────────┐
│ 이미지 업로드                        │
│ 스타일 선택 (10개 그리드)            │
│                                      │
│ ▶ 고급 설정                          │  ← 클릭하면 펼침
│ ┌─────────────────────────────────┐ │
│ │ AI 모델 선택                     │ │
│ │ ○ Flux Pro (추천) - $0.04/장    │ │
│ │ ○ Flux Dev - $0.025/장          │ │
│ │ ○ PhotoMaker - $0.0095/장       │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [AI 사진 생성 (1 크레딧)]            │
└─────────────────────────────────────┘
```

---

## 검증 방법

1. **타입 체크**: `pnpm tsc --noEmit`
2. **UI 확인**: 에디터 > 갤러리 탭 > AI 웨딩 사진
   - 10개 스타일 표시 확인
   - 고급 설정 토글 동작 확인
   - 모델 선택 동작 확인
3. **생성 테스트**: 실제 이미지 업로드 후 새 스타일로 생성
4. **DB 확인**: 새 생성 기록에 새 스타일 값 저장 확인

---

## 참조 파일
- `docs/ai-prompt.md` - 새 프롬프트 원본 (10가지 컨셉)
- `lib/ai/models.ts` - AI 모델 정의 (Flux Pro/Dev, PhotoMaker)
- `lib/ai/replicate.ts` - 현재 프롬프트 및 생성 로직
