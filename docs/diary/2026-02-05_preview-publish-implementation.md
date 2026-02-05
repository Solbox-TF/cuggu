# 공개 청첩장 미리보기 + 발행 기능 구현

**날짜**: 2026-02-05
**작업자**: JYK
**커밋**: `a6ed105` (develop)
**상태**: 구현 완료, DB 마이그레이션 대기

---

## 작업한 내용

### Phase 0: DB 스키마 확장
- `invitations` 테이블에 `extended_data JSONB DEFAULT '{}'` 컬럼 추가 (`db/schema.ts`)
- `ExtendedDataSchema` Zod 스키마 생성 (`schemas/invitation.ts`)
  - groom/bride 확장정보, venue 상세, content.notice, gallery.coverImage, settings 전부 포함
  - 모든 필드 optional → 하위 호환
- `UpdateInvitationSchema`에 `extendedData` 필드 추가
- PUT API에서 extendedData deep merge 로직 구현 (기존 데이터 보존)

### Phase 1: DB↔Invitation 변환 유틸
- `lib/invitation-utils.ts` 신규 생성
- `dbRecordToInvitation(row)` — DB flat + JSONB → 프론트엔드 nested Invitation
- `invitationToDbUpdate(data)` — nested → flat 컬럼 + extendedData 분리 (아직 API에 미적용, 준비만)
- `resolveTemplateId(row)` — templateId가 단순 문자열이면 그대로, cuid2면 template.category 사용

### Phase 2: 공개 청첩장 페이지
- `app/inv/[id]/page.tsx` — Server Component
  - `generateMetadata()` — OG 태그 (카카오톡 공유 미리보기)
  - 상태별 접근 제어: PUBLISHED=공개, DRAFT=본인만, EXPIRED=만료안내, DELETED=404
  - 조회수 자동 증가 (PUBLISHED, fire-and-forget SQL increment)
  - 비밀번호 보호 체크 (쿠키 기반)
- `app/inv/[id]/InvitationView.tsx` — Client Component, 템플릿 선택+렌더링
- `app/inv/[id]/PasswordGate.tsx` — Client Component, 비밀번호 입력 폼

### Phase 3: 발행 + UI
- `components/ui/Toast.tsx` — Context 기반 ToastProvider + useToast() hook
  - Framer Motion 애니메이션, success/error/info, 3초 자동 닫힘
- `components/editor/TopBar.tsx` — 전면 재작성
  - DRAFT: "발행하기" 버튼 (필수 필드 검증 → PUT status:PUBLISHED → URL 복사 + 토스트)
  - PUBLISHED: "공유" 버튼 (URL 복사) + "발행됨" 뱃지
  - 기존 alert() → 토스트로 교체
- `app/editor/[id]/layout.tsx` — ToastProvider 래핑
- `app/editor/[id]/page.tsx` — updateInvitation prop 전달

---

## 왜 했는지 (맥락)

편집기는 완성도 높은데 "완성 후 뭘 해야 하지?"가 없었음:
1. "새 탭에서 보기" 버튼이 2곳(TopBar, PreviewPanel)에 있는데 둘 다 404
2. DRAFT→PUBLISHED 전환 UI가 없어서 사용자가 청첩장을 공유할 수 없음
3. 편집기에서 입력한 부모님 이름, 계좌, 설정 등이 DB에 저장 안 됨 (Zustand에만)

이 3개가 합쳐져서 "편집은 되는데 실제로 쓸 수 없는" 상태였음. MVP 출시 전 반드시 필요한 기능.

---

## 논의/아이디어/고민

### 1. 확장 데이터 저장 방식 (JSONB vs 개별 컬럼)
- backend-architect: JSONB 1개 추천 (마이그레이션 최소화, Zod 1:1 매핑)
- backend-risk-guard: 덮어쓰기 사고 우려, 하이브리드 추천
- **결론**: JSONB — 확장 필드에 WHERE 검색 없음, 1인 개발에서 마이그레이션 부담 > DB 제약 이점
- deep merge로 덮어쓰기 방지, Zod safeParse로 읽기 방어

### 2. DRAFT 미리보기 접근 제어
- 토큰 방식 (30분 만료 URL) vs 로그인 체크
- **결론**: 로그인 체크 — 핸드폰에서 카카오 로그인하면 바로 확인 가능, 구현 단순

### 3. 발행 상태에서만 공개?
- 처음엔 "PUBLISHED만 공개" 제안
- 사용자: "내 핸드폰에서 직접 보고 싶은데?" → DRAFT도 본인은 볼 수 있게
- **결론**: DRAFT=본인 로그인 시 미리보기, PUBLISHED=누구나 공개

### 4. 결제 플로우
- "구매하기" 기능을 어디에 넣을지 논의
- 무료 플랜도 발행 가능 (프리미엄은 부가 기능)
- **결론**: 결제는 별도 작업. 미리보기+발행 먼저 완성

---

## 결정된 내용

| 항목 | 결정 |
|------|------|
| 확장 데이터 저장 | JSONB 1개 (`extended_data`) |
| DRAFT 접근 | 본인 로그인 = 미리보기 가능 |
| 공개 페이지 아키텍처 | Server Component + Client Island |
| 발행 검증 | 신랑/신부 이름, 예식날짜, 예식장이름 |
| 토스트 | Context + Framer Motion (자체 구현) |
| 결제 | 별도 작업 (이번 스코프 밖) |

---

## 느낀 점/난이도/발견

### 난이도: 중간
- 코드 자체는 단순한데 **설계 결정이 많았음** (JSONB vs 컬럼, 접근 제어, 발행 플로우)
- 기존 코드 파악에 시간 소요 (DB flat↔프론트 nested 불일치 발견)

### 발견
- **DB와 프론트 스키마 불일치가 심각했음**: DB는 `groomName` flat, 프론트는 `groom.name` nested. GET API가 flat으로 반환하는데 편집기는 nested를 기대. 기존에도 에디터 리로드 시 데이터가 깨졌을 가능성 높음
- **risk guard 에이전트의 코드 읽기 정확도 문제**: PUT API에 Zod 검증이 있는데 "없다"고 분석, accountInfo JSONB 컬럼이 없는데 "있다"고 분석. 에이전트 결과는 교차 검증 필수
- **extendedData deep merge가 핵심**: 단순 덮어쓰기하면 탭별 저장 시 데이터 유실. 최상위 키별로 merge 해야 안전

### 기술적 인사이트
- Next.js 16 `generateMetadata`에서 async params 패턴: `const { id } = await params`
- Server Component에서 `auth()` + `cookies()` 조합으로 로그인/쿠키 동시 체크 가능
- 조회수 증가: `sql\`viewCount + 1\`` fire-and-forget (렌더링 안 막음)

---

## 남은 것/미정

### 즉시 필요
- [ ] `drizzle-kit generate && drizzle-kit migrate` — DB 마이그레이션 실행
- [ ] 편집기 각 탭에서 extendedData를 실제로 보내도록 수정 (BasicInfoTab, AccountTab, VenueTab, SettingsTab, GreetingTab)
- [ ] PUT API의 수동 매핑 코드를 `invitationToDbUpdate()` 유틸로 교체
- [ ] GET API 응답을 `dbRecordToInvitation()` 으로 변환해서 반환 (편집기 리로드 시 데이터 정합성)

### 미정
- [ ] 발행 취소 (PUBLISHED → DRAFT) — 사용자 피드백 후 결정
- [ ] 카카오톡 OG 캐시 초기화 API
- [ ] nanoid URL (보안 강화)

---

## 다음 액션

1. **DB 마이그레이션 실행** — extended_data 컬럼 생성
2. **편집기 탭→extendedData 연결** — 각 탭에서 저장 시 extendedData에 포함
3. **GET API 변환 적용** — dbRecordToInvitation으로 응답 정규화
4. 실제 디바이스(핸드폰) 테스트

---

## 서랍메모

### CLAUDE.md 업데이트 필요
- 구현 현황에 "공개 청첩장 뷰" ✅로 변경
- extended_data JSONB 설계 결정 추가

### 코드 패턴
- JSONB deep merge 패턴: `{ ...existing.groom, ...data.groom }` — 2레벨까지만 merge, 3레벨 이상은 덮어쓰기
- `dbRecordToInvitation()`은 공개 페이지와 편집기 양쪽에서 사용 가능 → 단일 진실의 원천

### risk guard 에이전트 사용 시 주의
- 코드를 직접 읽지 않고 추측하는 경우 있음 (hallucination)
- 결과물은 반드시 실제 코드와 교차 검증할 것

---

## 내 질문 평가 및 피드백

### 사용자 질문/피드백 흐름
1. "미리보기 기능 추가해줘" → 명확한 요구
2. "state에만 저장하고 db에는 저장하지 않아서 그런가?" → **핵심 문제 정확히 짚음**
3. "json string은 포맷 에러나서 버그 발생할수도 있잖아" → 합리적 우려, 실제 리스크 분석으로 해소
4. "DBA랑 backend agents 사용해서 분석해보고 알려줘" → 멀티 관점 분석 요청
5. "발행된 상태여야만 볼 수 있게 해야돼" → 보안 관점
6. "내 핸드폰에서 직접보고싶을거 아냐" → UX 관점 반전, 최종 결정으로 이어짐
7. "구매하기 같은 기능이 없잖아? 어디서 할까" → 비즈니스 모델 관점 (스코프 분리로 결론)

**평가**: 설계 과정에서 보안(DRAFT 접근), UX(핸드폰 미리보기), 비즈니스(결제 플로우)를 순차적으로 짚어가면서 요구사항을 구체화함. "발행만" → "본인은 DRAFT도" 로 바뀐 건 실사용 시나리오를 고려한 좋은 피드백이었음.
