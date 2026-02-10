# 2026-02-10 백로그 3관점 리뷰 + Phase 0 보안/버그 수정

## 작업한 내용

### 1. 에이전트 팀 백로그 분석 (3관점)
44건 오픈 이슈를 세 에이전트가 동시에 코드베이스를 탐색하며 분석:
- **UX Analyst**: 사용자 여정 단계별 빈 구멍, 전환율 킬러, RSVP 유령 기능 발견
- **Tech Architect**: 코드 기반 기술 부채 (Credentials 보안 구멍, DB 풀링, extendedData deep merge), 확장성 병목
- **Devil's Advocate (PM)**: 스코프 크리프 진단, YAGNI 위반, 킬 리스트 TOP 10, MVP 재정의

### 2. 백로그 우선순위 조정 (20건)
- **신규 생성 5건**: Credentials 보안(P0), DB 풀링(P1), RSVP 하객 폼(P1), 공개 페이지 캐싱(P1), 기본값 placeholder(P1)
- **승격 3건**: NextAuth 분리 P2→P1, 방명록 P2→P1, 바이럴CTA P2→P1
- **강등 12건**: 폰트선택 P1→P2, 엔딩섹션 P1→P2, OG이미지 P1→P2, AI분리 P1→P4, NestJS/다크모드/BGM/동영상 등 8건 P4

### 3. Phase 0 실행 (보안 + 버그 5건)
| 커밋 | 이슈 | 내용 |
|------|------|------|
| af09a07 | cuggu-a2w (P0) | Credentials 프로바이더 제거 — 비밀번호 검증 없이 이메일만으로 로그인 가능하던 보안 구멍 |
| 79b859a | cuggu-66m (P1) | DB 커넥션 풀링 — Supabase Pooler(6543) 이미 사용 중이었으나 클라이언트 제한(max=3, idle=20s) 추가 |
| 8914935 | cuggu-5r8 (P1) | transportation 저장 버그 — 코드 추적 결과 이미 수정됨, 디버그 로그 4건 정리 |
| 55bd13c | cuggu-k4w (P1) | extendedData 전송 — invitationToDbUpdate에 enabledSections 매핑 누락 수정 |
| 9dcd244 | cuggu-j1v (P1) | 자동저장 실패 알림 — saveError 상태 + 5초 자동재시도(3회) + TopBar 에러 표시 |

## 왜 했는지

- 44건 백로그가 1인 개발자에게 비현실적. 방향성 정리가 급했음
- 세 관점 교차 검증으로 편향 제거: UX는 "방명록이 급하다", Tech는 "보안부터", PM은 "절반 버려라"
- 봄 결혼 시즌(4~6월)까지 2달. 3월 초 MVP 런칭 필요. Phase 0(보안/안정성) → Phase 1(카카오 공유) 순서

## 논의/아이디어/고민

### 3관점 충돌과 판단
- **NextAuth 분리(cuggu-9xi)**: Tech "시한폭탄 P1" vs PM "문제 생길 때 하자" → Tech 손 들어줌 (인증 깨지면 전부 끝)
- **방명록(cuggu-s2k)**: UX "한국 필수 P1" vs PM "LATER" → UX 손 들어줌 (경쟁사 전부 있음)
- **AI 서비스 분리(cuggu-ssa)**: Tech "P2 가능" vs PM "삭제" → PM 손 들어줌 (YAGNI)

### 발견된 숨은 이슈
- **RSVP 유령 기능**: 에디터에서 켤 수 있지만 공개 페이지에 폼 없음. 백로그에도 없었음
- **기본값 혼란**: "신랑"/"예식장"이 placeholder가 아닌 실제 데이터로 저장
- **extendedData deep merge 1-depth 한계**: 2-depth 이상 객체 덮어쓰기 가능성
- **크레딧 차감 비트랜잭션**: 중간 크래시 시 환불 안 됨 (TODO 주석만 있음)

### cuggu-5r8 삽질
transportation 버그를 코드 추적으로 30분+ 분석했지만 현재 코드에서는 정상 동작. 이전에 이미 수정된 것으로 추정. 디버그 로그만 정리하고 닫음.

## 결정된 내용

### 실행 로드맵 (Phase별)
- **Phase 0** ✅: 보안 패치 + 버그 3건 (완료)
- **Phase 1** (다음): 카카오톡 SDK → 발행 검증 → 공유 모달 → 모바일 에디터
- **Phase 2**: 공개 페이지 캐싱 → D-Day 달력 → 바이럴 CTA → NextAuth 분리
- **Phase 3+**: 방명록, 갤러리 S3, 콘텐츠 톤 개선

### 킬/강등 기준
- P4(실질적 동결): 다크모드, NestJS, BGM, 동영상 임베드, 소셜 로그인 확장, 성능 테스트 등
- "트래픽이 실제로 생기면 다시 논의" 원칙

## 느낀 점/난이도/발견

- 에이전트 팀 구성으로 다관점 분석이 실제로 유용했음. 특히 PM의 "44건 미쳤다" 지적이 핵심
- 경쟁사 비교(바른손 100+종 vs Cuggu 5~7종)가 현실 직시에 도움
- Phase 0 작업 자체는 간단했지만 (보안 패치 5분, DB 풀링 이미 적용됨), 분석 → 의사결정 → 우선순위 조정이 가장 가치 있는 시간 투자
- transportation 버그 추적에서 extendedData 양방향 변환 로직의 복잡성 재확인. 이 구조는 장기적으로 리팩터링 대상

## 남은 것/미정

- [ ] Phase 1 시작: 카카오톡 SDK 공유 (cuggu-jl6) — 서비스 존재 이유
- [ ] cuggu-rci: 기본값 placeholder 전환 (신규 P1 버그)
- [ ] cuggu-7m8: RSVP 하객 폼 (신규 P1)
- [ ] cuggu-qyp: 공개 페이지 캐싱 (신규 P1)
- [ ] worktree cuggu-posthog 아직 남아있음 — 필요한지 확인

## 다음 액션

1. **Phase 1 착수**: cuggu-jl6 카카오톡 SDK 공유 (P0, 서비스 런칭 전제조건)
2. cuggu-6oh 발행 전 실시간 필드 검증
3. cuggu-9ck 발행 성공 공유 모달
4. cuggu-iji 모바일 에디터 반응형 마무리

## 서랍메모

- `invitationToDbUpdate()` + deep merge 패턴이 fragile함. 새 필드 추가할 때마다 3곳(Zod 스키마, toDbUpdate, toInvitation) 수정해야 함. 장기적으로 extendedData를 flat 컬럼으로 마이그레이션하거나, 양방향 변환을 자동화하는 것이 좋겠음
- `ExtendedDataSchema.safeParse()` 실패 시 ALL 데이터 유실 → `passthrough()` 적용 검토
- 크레딧 차감 트랜잭션 미적용 건은 결제 시스템 구현 시 함께 해결
