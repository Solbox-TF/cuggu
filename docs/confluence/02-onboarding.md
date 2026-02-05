# 신규 입사자 온보딩 가이드

Cuggu 팀에 오신 것을 환영합니다!

---

## 첫 주 체크리스트

### Day 1: 계정 & 접근 권한
- [ ] 회사 이메일 계정 생성
- [ ] Slack 워크스페이스 참여
- [ ] GitHub 조직 초대 수락
- [ ] Confluence/Jira 접근 확인
- [ ] Figma 팀 초대 수락

### Day 2-3: 환경 설정
- [ ] 개발 환경 설정 완료 (아래 가이드 참조)
- [ ] 로컬에서 프로젝트 실행 확인
- [ ] 테스트 계정으로 서비스 사용해보기

### Day 4-5: 프로젝트 이해
- [ ] 아키텍처 문서 읽기
- [ ] 주요 코드베이스 탐색
- [ ] 첫 번째 간단한 태스크 완료

---

## 개발 환경 설정

### 필수 도구
```bash
# Node.js (v20 이상)
nvm install 20
nvm use 20

# pnpm (패키지 매니저)
npm install -g pnpm
```

### 프로젝트 클론 & 설치
```bash
git clone https://github.com/[org]/cuggu.git
cd cuggu
pnpm install
```

### 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일에 필요한 값 입력 (값은 팀 리드에게 요청)

### 로컬 실행
```bash
pnpm dev
```

http://localhost:3000 에서 확인

---

## 주요 문서 링크

| 문서 | 설명 |
|------|------|
| [아키텍처 개요](/wiki/architecture) | 시스템 전체 구조 |
| [코드 컨벤션](/wiki/code-convention) | 코딩 스타일 가이드 |
| [Git 워크플로우](/wiki/git-workflow) | 브랜치 전략, PR 규칙 |
| [API Reference](/wiki/api-reference) | API 엔드포인트 문서 |

---

## 커뮤니케이션 채널

| 채널 | 용도 |
|------|------|
| #general | 전체 공지 |
| #dev | 개발 관련 논의 |
| #design | 디자인 관련 논의 |
| #random | 자유로운 대화 |

---

## 질문이 있으면?

- 기술 관련: #dev 채널 또는 개발 리드
- 일반 문의: 팀 리드 또는 HR

> 모르는 건 부끄러운 게 아닙니다. 적극적으로 질문해주세요!
