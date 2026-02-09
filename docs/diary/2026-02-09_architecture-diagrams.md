# 2026-02-09 | 아키텍처 다이어그램 작성 (Mermaid)

> 브랜치: feat/ai-theme-generation
> 커밋: 미커밋 (문서 작업)

---

## 작업한 내용

### 작업 1: AI 테마 생성 프로세스 다이어그램

AI 테마 생성 기능의 전체 흐름을 Mermaid flowchart로 시각화.

**다이어그램 구조 (7개 서브그래프):**
- UI Layer — TemplateTab.tsx 프롬프트 입력 + 생성 버튼
- API Gateway — 인증 → Rate Limit(10회/시간) → Zod 검증 → 크레딧 차감
- AI Generation — Claude Sonnet 4.5 + tool_use(create_wedding_theme) 패턴
- Validation — Safelist 검증(~5000+ 허용 클래스)
- State & Persistence — Zustand 스토어 → 2초 디바운스 DB 자동저장
- Preview — BaseTemplate에 customTheme 전달 → 실시간 미리보기

**핵심 발견:**
- 생성 파이프라인: 프롬프트 → Claude API(tool_use) → Zod 파싱 → Safelist 검증 → 3단계 검증 레이어
- Safelist 구성: 빌트인 테마 추출 + 웨딩 팔레트 확장(23색×11단계) + 유틸리티 = ~5000+ 클래스
- 에러 시 크레딧 환불, Safelist 위반은 422로 거부

### 작업 2: AI 이미지 생성 프로세스 다이어그램

AI 사진 생성 기능의 전체 흐름을 Mermaid flowchart로 시각화.

**다이어그램 구조 (8개 서브그래프):**
- UI Layer — 사진 업로드 + 스타일(10종) + 모델 선택
- API Gateway — 인증 → Rate Limit(5회/10분) → Zod/Magic Number 검증 → 크레딧 차감(atomic SQL)
- Pre-flight — S3 원본 업로드 → Azure Face API 얼굴 감지(정확히 1명)
- AI Generation Loop(×4) — 멀티 프로바이더(Replicate/OpenAI/Gemini) → SSE 스트리밍
- 완료 처리 — DB 저장 → 잔여 크레딧 조회 → SSE done 이벤트
- 갤러리 통합 — 선택한 AI 사진 → invitation.galleryImages에 추가
- 에러 및 환불 — 실패 시 크레딧 환불 + status FAILED 기록
- S3 + CloudFront — ai-originals/ + ai-generated/ 분리 저장

**핵심 발견:**
- 테마 생성과 달리 SSE(Server-Sent Events) 스트리밍으로 4장을 하나씩 실시간 전달
- 멀티 프로바이더 추상화: Replicate(URL 반환→S3 복사), OpenAI/Gemini(Base64→S3 업로드)
- 6개 모델 지원: Flux Pro/Dev, PhotoMaker, GPT Image 1, DALL-E 3, Gemini Flash
- 크레딧 차감은 SQL WHERE 절로 race condition 방지

### 작업 3: ERD 다이어그램

전체 DB 스키마 11개 테이블을 Mermaid erDiagram으로 시각화.

**테이블 목록:**
| 테이블 | 역할 | 주요 관계 |
|--------|------|-----------|
| users | 사용자 (인증, 크레딧) | 모든 테이블의 중심 |
| templates | 빌트인 템플릿 | invitations에서 참조 |
| invitations | 청첩장 | users, templates FK + rsvps, aiThemes 1:N |
| rsvps | 참석 응답 | invitations FK |
| ai_generations | AI 이미지 생성 이력 | users FK |
| ai_themes | AI 테마 생성 이력 | users, invitations FK |
| payments | 결제 내역 | users FK |
| ai_model_settings | AI 모델 관리 (Admin) | 독립 |
| app_settings | 범용 설정 | 독립 |
| accounts | NextAuth OAuth | users FK |
| sessions | NextAuth 세션 | users FK |

---

## 왜 했는지 (맥락)

- AI 테마 생성 + AI 이미지 생성 두 핵심 기능의 아키텍처가 복잡해져서, 시각적 문서화 필요
- 향후 온보딩, 디버깅, 확장 시 참고용 레퍼런스
- ERD는 현재 스키마의 스냅샷으로, 앞으로 테이블 추가 시 갱신 기준점

## 논의/고민

### Mermaid 버전 호환성 이슈
- `&` 연산자 (병렬 연결): Mermaid 10.3+ 전용 → 구버전 환경에서 파싱 에러
- `direction LR` (subgraph 내부 방향): 구버전 불안정
- 노드 텍스트 내 리터럴 줄바꿈: 파싱 깨짐
- **해결**: `&` → 개별 화살표 분리, `direction LR` 제거, style 구문 제거로 호환성 확보

## 결정된 내용

- Mermaid 다이어그램은 최신 문법 기준으로 작성하되, `&` 연산자는 호환성 이슈로 사용 자제
- ERD는 db/schema.ts 기준으로 작성, 변경 시 함께 갱신

## 느낀 점/발견

- AI 테마 생성은 Claude tool_use + 3단계 검증(Zod→Safelist→타입) 구조가 견고함
- AI 이미지 생성은 멀티 프로바이더 추상화 + SSE 스트리밍이 핵심 차별점
- 두 기능 모두 크레딧 시스템이 실패 시 환불로 일관되게 동작
- Mermaid 버전 차이로 인한 호환성 이슈가 예상보다 까다로움

## 남은 것/미정

- [ ] 결제(Toss) 흐름 다이어그램 (payments 테이블 연동)
- [ ] 공개 청첩장 뷰 흐름 다이어그램 (inv/[id]/ 라우트)
- [ ] 다이어그램을 docs/architecture/ 에 별도 정리할지 여부

## 다음 액션

- 필요 시 다이어그램을 Notion/Wiki로 옮겨서 팀 공유
- 신규 기능 구현 시 해당 흐름도 추가 작성
