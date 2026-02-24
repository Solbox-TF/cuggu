# 2026-02-20 작업 종합 리뷰

**리뷰 날짜**: 2026-02-22
**리뷰 방법**: 4개 병렬 에이전트 (코드 품질 / 보안 / 아키텍처 / 성능)
**대상**: 커밋 13개, 기능 10개, 코드베이스 감사 문서 1건

---

## 1. 계획 vs 실행 — 달성도 분석

**계획 문서**: `docs/diary/2026-02-20_daily-plan.md`

| 단계 | 계획 | 커밋 | 판정 |
|------|------|------|------|
| **0단계** S3 orphan 정리 | `cuggu-5no` P2 | `f6c4fd4` | **DONE** |
| **1-1** 방명록 | `cuggu-s2k` P1 | `e4be18b` (DB+API+뷰+에디터+비속어필터) | **DONE** |
| **1-2** 엔딩 섹션 | `cuggu-erp` P2 | `ab528ac` | **DONE** |
| **1-3** 콘텐츠 톤 | `cuggu-nvr` P2 | `c257da9` + `2ad14fb` | **DONE** |
| **2-1** 커스텀 OG 이미지 | `cuggu-bpa` P2 | `436e528` | **DONE** |
| **2-2** 카카오 OG 캐시 | `cuggu-fwh` P2 | `436e528` → `afe38a2` 전환 | **DONE** |
| **3-1** 모바일 반응형 | `cuggu-bq5` | `d145048` | **DONE** |
| **3-2** 갤러리 레이아웃 | `cuggu-3f3` | `0b622b1` (3종 추가) | **DONE** |
| **3-3** 폰트 시스템 | `cuggu-4rv` | `6561354` (순환참조 버그픽스만) | **PARTIAL** |
| **3-4** UI 전반 점검 | 신규 | `5fdbac5` (에디터 탭 상태표시) | **PARTIAL** |

**목표 달성률: 0~2단계 100%, 3단계 ~60%**

계획에서 "0단계+1단계 확실히 끝내기, 2단계까지 가면 좋은 날"이라고 했고, 실제로 3단계까지 밀어붙임.

**계획 외 추가 산출물:**
- 코드베이스 감사 리포트 (`docs/research/codebase-audit-2026-02-20.md`) — 44개 이슈 식별
- 에디터 탭 활성/비활성 상태 표시 (`5fdbac5`)
- Redis Date 역직렬화 버그 수정 (`c0a3a28`)

### 1-1. 세부 스코프 대조

#### 0-1. 갤러리 S3 orphan 정리

| 스코프 | 판정 | 비고 |
|--------|------|------|
| 이미지 삭제 시 S3 파일도 정리 | **DONE** | PUT 핸들러에서 Set 비교로 삭제 감지 후 fire-and-forget S3 삭제. `extractS3Key`/`deleteFromS3`를 `lib/ai/s3.ts`로 추출해 cron cleanup과 공유 |

#### 1-1. 방명록 (`cuggu-s2k`)

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| `guestbook_entries` 테이블 (name, message, invitationId, isHidden, createdAt) | **DONE** | `db/schema.ts:255-275`. 추가로 `isPrivate` 필드도 구현 (계획에 없던 기능) |
| API: `POST/GET /api/invitations/[id]/guestbook` | **DONE+** | POST/GET 외에 PATCH(숨김 토글), DELETE도 구현. 계획 초과 |
| 인증 불필요, IP 레이트리밋 (분당 3회) | **DONE** | `rateLimit('ratelimit:guestbook:${ip}:${id}', 3, 60)` |
| 주인이 부적절한 메시지 숨김 가능 | **DONE** | `guestbook/[entryId]/route.ts` PATCH에서 `isHidden` 토글 |
| 최신순 정렬, 페이지네이션 (10개씩) | **DONE** | `orderBy: [desc(createdAt)]`, 기본 limit=10, 커서 페이지네이션(`limit+1` 패턴) |
| 공개 뷰 | **DONE** | `GuestbookSection.tsx` — 작성 폼 + 메시지 목록 + 비공개 옵션 + 더보기 |
| 에디터에서 on/off 토글 | **DONE** | `GuestbookTab.tsx` + `enabledSections.guestbook` |

**계획 초과 구현:**
- `isPrivate` (작성자가 비공개로 작성 가능) — 계획에 없었음
- DELETE API (소유자가 방명록 항목 삭제 가능) — 계획에 없었음
- 비속어 필터 2단계 (로컬 한글 자모 분해 + OpenAI Moderation API) — 계획에 없었음, 큰 추가 작업
- 대시보드 방명록 관리 페이지 (`guestbook/page.tsx`) — 계획에 없었음
- 모바일 에디터 탭 (`MobileGuestbookTab.tsx`) — 계획에 없었음

#### 1-2. 엔딩 섹션 (`cuggu-erp`)

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| 푸터 바로 위에 전체 너비 사진 + 마무리 문구 | **DONE** | `EndingSection.tsx` — fade-in 애니메이션, 전체너비 이미지 |
| `ending: { photo?, message? }` 데이터 | **DONE** (필드명 변경) | `{ imageUrl?: string, message?: string }` — `photo` → `imageUrl`로 변경 |
| 예시 문구 제공 | **DONE** | `EndingTab.tsx:91-96`에 4개 예시 문구 |
| 고정 위치 (reorderable 아님) | **DONE** | `BaseTemplate.tsx`에서 guestbook과 footer 사이 고정 위치 |

**계획 초과 구현:**
- 엔딩 이미지 전용 업로드 API (`/api/upload/ending`) + Sharp 최적화
- 6개 테마에 `endingImageClass`/`endingMessageClass` 기본값 추가
- 방명록 테마 컬러 적용 (하드코딩 pink → 테마 활용)
- `PreviewPanel`/`MobilePreviewOverlay`에 `extendedData` 전달 누락 수정

#### 1-3. 콘텐츠 톤 개선 (`cuggu-nvr`)

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| 인사말 3개 → 15~20개 | **DONE** | 17개 (격식 4 + 캐주얼 4 + 계절 4 + 종교 3 + 유머 2) |
| 카테고리 (격식/캐주얼/종교/유머/계절) | **DONE** | `lib/copy/greeting-examples.ts`에 5개 카테고리 + 카테고리 탭 UI (`GreetingTab`, `MobileGreetingTab`) |
| 플레이스홀더 변경 ("신랑" → 안내 텍스트) | **DONE** | `BasicInfoTab`, `VenueTab`, `AccountTab` 등 placeholder 교체 (`c257da9`) |
| 에러 톤 개선 | **PARTIAL** | 일부 에러 메시지 톤 변경됨. 하지만 "필수 정보를 입력해주세요" → "조금만 더 채워주세요" 수준의 전면 개선은 확인 어려움 |
| 발행 성공: 감성적 축하 메시지 | **NOT CONFIRMED** | `TopBar.tsx:56-60`에서 발행 성공 시 공유 모달을 열지만, 별도 축하 toast/메시지가 없음. 공유 모달 내부에서 처리될 수 있으나 명확한 감성 축하 메시지 미확인 |
| 만료 페이지 톤 개선 | **NOT CONFIRMED** | 만료 페이지 코드 변경 확인 안 됨. 커밋 diff에 만료 관련 파일 없음 |
| 비밀번호 게이트 톤 개선 | **DONE** | `PasswordGate.tsx` 커밋 `c257da9`에서 8줄 변경 확인 |

**미완료 항목:**
- 발행 성공 감성적 축하 메시지 — 스코프에 있었으나 구현 미확인
- 만료 페이지 톤 — 스코프에 있었으나 변경 없음

#### 2-1. 커스텀 OG 이미지 (`cuggu-bpa`)

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| `share: { ogImage?, ogTitle? }` 에디터 설정 | **DONE+** | `ogDescription`까지 추가 (계획보다 확장). `SettingsTab`에 공유 미리보기 설정 UI |
| `generateMetadata()` 커스텀 값 우선 적용 | **DONE** | `page.tsx:37-50`에서 `share.ogTitle` → `share.ogDescription` → `share.ogImage` 우선 적용 |

**계획 초과 구현:**
- `ogDescription` 필드 추가 (계획은 `ogTitle`만)
- OG 이미지 전용 업로드 API (`/api/upload/og-image`)
- `ShareModal`에 커스텀 OG 값 반영

#### 2-2. 카카오 OG 캐시 초기화 (`cuggu-fwh`)

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| 카카오 스크래퍼 API 호출 | **방향 전환** | 처음 스크래핑 API로 구현(`436e528`) → **같은 날** 불안정하여 URL 버전 파라미터 방식으로 전환(`afe38a2`) |
| 발행/수정 시 자동 호출 | **DONE** (방식 변경) | URL에 `?v={updatedAt}` 파라미터 자동 추가 → 카카오 캐시 자연 우회 |
| 에디터에서 수동 버튼 | **제거** | 수동 갱신 버튼 → 자동 갱신 안내 텍스트로 대체. URL 파라미터 방식이므로 수동 버튼 불필요 |

**판정:** 계획과 구현 방식이 다르지만, 문제를 더 안정적으로 해결. 올바른 방향 전환.

#### 3단계: UI 전반 다듬기 ("시간 되면")

| 스코프 항목 | 판정 | 실제 구현 |
|-------------|------|-----------|
| 3-1. 모바일 반응형 검증 | **DONE** | 에디터 탭 7개 + MobileTopBar/MobileTabBar/ShareBar. 360~390px 뷰포트 최적화, 터치 타겟 WCAG 2.5.5 |
| 3-2. 갤러리 슬라이드 레이아웃 | **DONE+** | 3종 추가 (carousel/filmstrip/highlight). embla-carousel 도입. 에디터 UI에 레이아웃 선택기 추가 |
| 3-3. 폰트 선택 시스템 | **PARTIAL** | 순환 참조 버그 수정만. 폰트 선택 시스템 자체는 미구현 |
| 3-4. 에디터/대시보드/공개뷰 UI 점검 | **PARTIAL** | 에디터 탭 활성/비활성 상태 표시 추가. 전체 UI 점검은 미완료 |

#### 보류 항목 준수 여부

| 항목 | 판정 | 비고 |
|------|------|------|
| 결제 체인 (PortOne 6개) | **준수** | 20일 커밋에 결제 관련 없음 |
| NextAuth sessions 분리 | **준수** | 건드리지 않음 |
| Sentry / CDN / 성능 | **준수** | 건드리지 않음 |
| 스마트스토어 외부 설정 | **준수** | 19일에 구현 완료, 20일에는 안 건드림 |
| AI 서비스 분리 | **준수** | 건드리지 않음 |

### 1-2. 종합 평가

**계획 준수 점수: 85/100**

- 0~2단계 핵심 스코프: 거의 완벽 이행 (95%)
- 3단계 ("시간 되면"): 2/4 완료, 2/4 부분 (예상 범위 내)
- 보류 항목: 100% 준수 — 유혹에 빠지지 않고 "제품 품질 집중" 방향 유지
- 계획 대비 초과 구현 많음 (비속어 필터, 대시보드 관리 페이지, OG description 등)
- 콘텐츠 톤 일부 미완료 (발행 성공 축하 메시지, 만료 페이지)

**감점 요인:**
- 1-3 콘텐츠 톤에서 "발행 성공 감성 메시지"와 "만료 페이지 톤"이 누락된 것 (-5점)
- 계획 초과 구현이 많아 계획 자체의 예측 정확도가 낮았던 점 — 비속어 필터, 대시보드 관리 같은 큰 작업이 스코프에 없었는데 추가됨. 이건 좋은 판단이었지만 계획 단계에서 예측했어야 함 (-5점)
- 코드베이스 감사가 계획에 없었음 — 생산적이었지만 P0 이슈를 발견하고도 수정 안 한 게 문제 (-5점)

---

## 2. 크로스커팅 이슈 — 4명 리뷰어 중복 지적

### CRITICAL — 3~4명 동시 지적

| # | 이슈 | 지적한 리뷰어 | 수정 난이도 |
|---|------|--------------|------------|
| **C1** | `GuestbookSection.tsx:53` — `useState`로 fetch 실행 (useEffect 아님). Strict Mode에서 이중 호출, React contract 위반 | Quality, Architecture, Performance | **1분** |
| **C2** | 비속어 필터 `'ㅗ'` 단독 패턴 — false positive. 정상 자모 입력도 차단 | Quality, Architecture | **5분** |
| **C3** | 커서 페이지네이션 `new Date(cursor)` — Invalid Date 방어 없음 + 복합 커서 미사용 (같은 밀리초에 항목 누락 가능) | Quality, Architecture, Security | **30분** |

### HIGH — 2~3명 동시 지적

| # | 이슈 | 지적한 리뷰어 |
|---|------|--------------|
| **H1** | `extendedData as any` 20곳+ — Drizzle 스키마에 `$type<ExtendedData>()` 미적용으로 타입 안전성 전멸 | Quality, Architecture |
| **H2** | `ending/route.ts` + `og-image/route.ts` 복사-붙여넣기 (100줄 동일) | Quality, Architecture, Performance |
| **H3** | OG 이미지에 `optimizeForGallery()` 사용 — 1200x630 OG 규격 아닌 갤러리용 리사이즈 적용 | Quality, Architecture, Performance |
| **H4** | 소유자 방명록 조회 — 페이지네이션 없이 전체 로드 + JS 집계 | Quality, Architecture, Performance |
| **H5** | OpenAI Moderation API fail open — 장애 시 비속어 필터 완전 무력화 | Quality, Security |
| **H6** | 신규 기능 10개 테스트 **0건** | Architecture |
| **H7** | 업로드 API rate limit 없음 — S3 비용/CPU 소진 공격 가능 | Security |
| **H8** | IP 스푸핑으로 rate limit 우회 가능 (`x-forwarded-for` 첫 번째 값 신뢰) | Security |
| **H9** | 방명록 GET에서 PUBLISHED 상태 미확인 — DRAFT 청첩장 방명록 비인증 조회 가능 | Security |

---

## 3. 코드 품질 리뷰 (Quality Reviewer)

### CRITICAL

**1. `GuestbookSection.tsx:53` — useState를 useEffect 대신 사용**

```tsx
// 현재 (위험)
useState(() => {
  fetchEntries();
});

// 수정
useEffect(() => {
  fetchEntries();
}, [fetchEntries]);
```

`useState`에 콜백을 넘기면 lazy initializer로 동작. side effect(fetch) 실행은 React contract 위반. Strict Mode에서 두 번 호출됨.

**2. `GuestbookSection.tsx:101-112` — Optimistic UI 업데이트 시 `created` undefined 가능성**

서버 POST 응답에서 `const [created] = ...` destructuring인데, 빈 배열이 반환되면 `created`가 `undefined`가 되어 `result.data.id`에서 런타임 에러 발생. 서버에서 `created` 존재 여부 체크 필요.

**3. `profanity-filter.ts:96` — 초성 'ㅗ' 단독 패턴이 정상 텍스트를 오탐**

```ts
const ABBREVIATION_PATTERNS = [
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅗ', ...
];
```

단일 자모 `ㅗ`를 패턴으로 쓰면 자모를 직접 입력하는 합법적 케이스(`ㅗㅜㅑ` 감탄사 등)도 비속어로 차단. 최소 `ㅗㅗ` 이상으로 변경 필요.

### HIGH

**4. `guestbook/route.ts:52` — `extendedData`에 대한 `as any` 캐스팅으로 타입 안전성 소실**

프로젝트에 `ExtendedDataSchema`가 이미 존재하고 `schemas/invitation.ts:208`에 타입 정의가 있음. Zod `safeParse`를 사용하는 기존 패턴을 따르면 타입 안전하게 접근 가능.

**5. `upload/ending/route.ts` + `upload/og-image/route.ts` — 100줄 코드 중복**

인증, FormData 파싱, 소유권 확인, MIME 검증, 크기 검증, 바이너리 검증, 최적화, S3 업로드 — 전부 동일. S3 prefix만 다름.

**6. `upload/og-image/route.ts:102` — OG 이미지에 갤러리용 최적화 함수 사용**

```ts
const optimized = await optimizeForGallery(buffer);
```

`optimizeForGallery`는 `1200px inside`로 리사이징. OG 이미지는 1200x630px (고정 비율)이어야 카카오/페이스북 미리보기 정상 표시. OG 전용 최적화 함수 필요.

**7. `guestbook/route.ts:181` — 커서 페이지네이션에서 잘못된 cursor 값 방어 없음**

```ts
if (cursor) {
  conditions.push(lt(guestbookEntries.createdAt, new Date(cursor)));
}
```

`new Date('invalid-string')`은 `Invalid Date` 반환. 파싱 후 `isNaN(date.getTime())` 체크 추가 필요.

**8. `guestbook/[entryId]/route.ts` — PATCH와 DELETE 인증+소유권 확인 로직 40줄 완전 중복**

### MEDIUM

**9. `GuestbookSection.tsx:45-46` — fetch 실패 시 silent fail**

```tsx
} catch {
  // silent fail
}
```

네트워크 문제 시 사용자는 빈 화면만 보게 됨.

**10. `profanity-filter.ts:77` — "꺼져", "닥쳐" 부분 매칭으로 "닥쳐오는 행복" 차단**

자모 분해 후 `includes`로 검사하므로 부분 문자열 매칭. 단어 경계 고려 필요.

**11. `profanity-filter.server.ts:57-61` — OpenAI Moderation API 실패 시 항상 통과**

API 키 만료나 장기 장애 시 비속어 필터가 완전히 무력화. 연속 실패 카운팅 또는 알림 필요.

**12. `EndingTab.tsx:38` — updateEnding deps 배열에 중복 + stale closure 가능성**

**13. `GalleryCarousel.tsx:73` — `accentColor.replace('text-', 'bg-')` 문자열 치환 취약**

**14. `GalleryHighlight.tsx:14` — images 비었을 때 방어 코드 없음**

**15. `guestbook/route.ts:141-146` — 소유자 조회 시 페이지네이션 없이 전체 entries 로드**

### 긍정적 평가

- 방명록 API 3단 방어 (Rate limit → 로컬 필터 → AI) 잘 설계됨
- IDOR 방지: entryId + invitationId AND 조건 확인
- 커서 페이지네이션 `limit + 1` 패턴 정석적, DB 인덱스 적절
- 한글 자모 분해 유니코드 연산 정확
- 카카오 OG 캐시 URL 파라미터 방식 전환 안정적
- Redis Date 역직렬화 `toISO` 헬퍼 깔끔

---

## 4. 보안 리뷰 (Security Reviewer)

**전체 위험 수준: MEDIUM** (CRITICAL 0, HIGH 3, MEDIUM 4, LOW 3)

### HIGH

**1. IP 스푸핑을 통한 Rate Limit 우회**

`lib/rate-limit.ts:54-58` — `x-forwarded-for` 첫 번째 값을 신뢰. Vercel은 마지막 값에 실제 IP를 append하므로, 첫 번째 값을 쓰면 공격자가 위조 가능. 방명록 스팸 무제한 작성 + OpenAI API 비용 무제한 발생.

```typescript
// 수정 — Vercel 환경에서는 마지막 값이 실제 클라이언트 IP
const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
const real = ips[ips.length - 1];
```

**2. 이미지 업로드 엔드포인트에 Rate Limit 없음**

`upload/ending/route.ts`, `upload/og-image/route.ts` — 인증 확인만 있고 rate limit 없음. 인증된 공격자가 루프로 10MB 파일 반복 업로드 시 S3 비용 + Sharp CPU 소진.

**3. OpenAI Moderation API 실패 시 무조건 통과 (Fail Open)**

`profanity-filter.server.ts:57-60` — 로컬 필터는 한국어/영어만 커버. AI 필터 없이 다국어 비속어 완전 통과.

### MEDIUM

**4. 커서 페이지네이션 — 비검증 날짜 입력** (`guestbook/route.ts:181`)

**5. 비밀번호 평문 클라이언트 노출** — `SettingsTab.tsx:425`에서 `invitation.settings?.password` 평문 로드. DB 스키마와 API 응답 추가 확인 필요.

**6. `copyToS3` SSRF 잠재 위험** — `lib/ai/s3.ts:88-101`에서 URL 검증 없이 `fetch`. 허용 호스트 목록 검증 추가 필요.

**7. 방명록 GET에서 PUBLISHED 상태 확인 누락** — DRAFT/PRIVATE 청첩장 방명록 비인증 조회 가능.

### 긍정적 평가

- Drizzle ORM 파라미터 바인딩으로 SQL Injection 방어
- 이미지 Magic Number + MIME 이중 검증
- IDOR 방어 (entryId + invitationId 조합)
- Sharp 재인코딩으로 EXIF 메타데이터 제거
- Lua 스크립트로 Redis INCR + EXPIRE 원자성 보장

---

## 5. 아키텍처 리뷰 (Architecture Reviewer)

### CRITICAL

**C-1. GuestbookSection의 useState 오용** (위 코드 품질과 동일)

**C-2. 커서 페이지네이션 정확성 — 복합 커서 미사용**

`paginationIdx` 복합 인덱스 `(invitationId, createdAt, id)`를 이미 만들어뒀는데, 실제 쿼리에서는 `id`를 커서 조건에 포함하지 않음. 같은 밀리초에 두 항목 생성 시 하나를 건너뛸 수 있음.

### HIGH

**H-1. extendedData 타입 안전성 부재 — 기술 부채 확산**

Drizzle 스키마 `db/schema.ts:197`에서 `.$type<Record<string, unknown>>()`로 되어 있어 모든 곳에서 `as any` 캐스팅 필요. `.$type<ExtendedData>()`로 변경하면 20곳+ 캐스팅 제거 가능.

**H-2. 업로드 API 라우트 복사-붙여넣기** (위와 동일)

**H-3. 신규 기능 전체 테스트 부재** — 10개 기능, 테스트 0건.

**H-4. 비속어 필터 `'ㅗ'` false positive** (위와 동일)

### 아키텍처 결정별 평가

| 결정 | 판정 | 근거 |
|------|------|------|
| guestbook_entries 별도 테이블 | **적절** | RSVP와 생명주기 다름, 복합 인덱스 올바르게 설계 |
| ending을 ExtendedData에 저장 | **적절** | 별도 테이블은 과도. 이미지 URL + 메시지 2개 필드로 JSONB 적합 |
| 비속어 필터 2단계 (로컬+AI) | **적절하나 결함** | 아키텍처 맞지만 `'ㅗ'` false positive 수정 필요 |
| 갤러리 8종 레이아웃 | **과도할 수 있음** | 사용자가 8종을 다 쓸지 의문. 3-4종으로 시작해 데이터로 확장 판단이 나았을 수 있음 |
| 카카오 OG: 스크래핑 → URL 파라미터 전환 | **올바른 판단** | 외부 API 의존성 제거. 같은 날 방향 전환한 것 좋음 |
| 콘텐츠 톤 상수 추출 (`lib/copy/`) | **적절** | 향후 i18n/A/B 테스트에 유리 |

### 속도 vs 품질: 70점

**잘한 것:**
- 기존 패턴 일관 준수 (Zod, 인증, 소유권 검증, Rate limiting)
- 방명록 테이블 설계 꼼꼼 (인덱스, cascade, 비공개/숨김 분리)
- 카카오 OG 전략 같은 날 수정한 판단력
- 갤러리 비Grid 레이아웃 별도 컴포넌트 분리

**속도에 밀려 놓친 것:**
- 테스트 0건
- `useState` 오용 같은 분명한 버그가 리뷰 없이 통과
- 업로드 라우트 복사-붙여넣기
- `extendedData` 근본 해결 대신 `as any` 계속 추가

**3개월 후 가장 큰 리스크:**
1. `extendedData`에 필드 계속 추가되면서 `as any` 30개, 40개로 증가 → 런타임 타입 불일치 버그
2. 테스트 없어 리팩터링 불가능 → 복사-붙여넣기 코드 더 확산
3. 비속어 필터 false positive로 실사용자 불만

---

## 6. 성능 리뷰 (Performance Reviewer)

### CRITICAL

**1. `GuestbookSection.tsx:53` — useState 오용** (위와 동일. 이중 fetch 가능)

### HIGH

**2. `guestbook/route.ts:143-171` — 소유자 경로에서 전체 rows 메모리 로드 + JS 집계**

```ts
const entries = await db.query.guestbookEntries.findMany({
  where: eq(guestbookEntries.invitationId, id),
  // limit 없음
});
let hiddenCount = 0;
for (const entry of entries) { if (entry.isHidden) hiddenCount++; }
```

DB에서 `COUNT(*) FILTER` 한 방으로 가능한 걸 JS 루프로 처리. entries 1,000+에서 메모리/속도 저하.

**3. GET 요청마다 COUNT 쿼리 별도 실행**

공개 뷰 GET마다 entries SELECT + COUNT SELECT = 2쿼리 순차 실행. 인덱스 없으면 full table scan.

**4. 모든 POST에 OpenAI Moderation API 동기 호출 (100~2000ms)**

로컬 필터 통과 후 OpenAI API를 동기 await. 정상 사용자도 매 글쓰기마다 레이턴시 체감. 타임아웃 `AbortSignal.timeout(2000)` 명시 또는 비동기 큐 처리 고려.

### MEDIUM

**5. `GallerySection.tsx:38` — renderLayout 매 렌더마다 재생성**

부모 리렌더 → embla 인스턴스 재생성 → autoplay 리셋 가능성.

**6. `GalleryCarousel.tsx:72` — accentColor 문자열 치환** (위와 동일)

**7. `GuestbookSection.tsx:67` — entries 배열 spread 누적** — O(n) 복사, 수백 건에서 느려질 수 있음.

**8. OG 이미지 최적화 규격 불일치** (위와 동일)

### 번들 사이즈

`embla-carousel-react` + `embla-carousel-autoplay` — gzip ~7-9KB. 모든 공개 뷰에 정적 import로 포함됨. carousel 선택 안 한 청첩장에도 로드됨. `dynamic()` import 고려.

---

## 7. 종합 — 즉시 조치 필요 항목

| 순위 | 이슈 | 예상 시간 | 근거 |
|------|------|----------|------|
| 1 | C1. `useState` → `useEffect` 수정 | 1분 | 버그 — 이중 fetch |
| 2 | C2. 비속어 필터 `'ㅗ'` 패턴 제거 | 5분 | false positive — 실사용자 차단 |
| 3 | H9. 방명록 GET PUBLISHED 체크 추가 | 5분 | DRAFT 방명록 비인증 노출 |
| 4 | C3. 커서 파라미터 유효성 검증 | 10분 | 500 에러 가능 |
| 5 | H5. Moderation fail open → fail closed | 10분 | 비속어 필터 무력화 방지 |
| 6 | H7. 업로드 API rate limit 추가 | 15분 | S3 비용 공격 방어 |
| 7 | H3. OG 이미지 전용 최적화 (1200x630) | 30분 | 카카오 공유 품질 |
| 8 | H1. Drizzle `$type<ExtendedData>()` 적용 | 1시간 | 전체 타입 안전성 회복 |
| 9 | H6. 비속어 필터 + OG 유틸 테스트 작성 | 2시간 | 회귀 방지 |
| 10 | H2. 업로드 API 공통 함수 추출 | 1시간 | 코드 중복 제거 |

---

## 8. 기존 감사 문서(P0) 미수정 지적

`docs/research/codebase-audit-2026-02-20.md`에서 같은 날 P0으로 식별한 6개 이슈가 아직 미수정:

1. **에디터 로드 실패 시 fake 데이터 자동저장** → 기존 데이터 손상 위험
2. **console.log에 개인정보 노출** (이름, 연락처, 주소)
3. **stream vs generate 크레딧 차감 순서 불일치**
4. **Job 완료 TOCTOU 레이스 컨디션**
5. **Zustand 스토어 타이머 누수**
6. **얕은 병합으로 중첩 객체 데이터 유실 가능**

P0을 보류하고 P2 기능(갤러리 레이아웃 확장)을 먼저 구현한 우선순위가 문제. 다음 작업 시 이 P0 항목들을 최우선으로 처리해야 함.
