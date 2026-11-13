# 🔍 TREND RADAR v4.1 — AI 콘텐츠 파이프라인

실시간 트렌드를 수집·분석하고, AI로 유튜브 콘텐츠 기회를 발견하는 대시보드입니다.
v4.1부터 엔터·화제·실시간 이슈 중심으로 소스를 확장하고, 맥락 없는 제목/키워드에
한글 요약 주석을 다시 달아줍니다(Claude Fable 5.2 사용).

## 📡 연결된 실시간 소스

| 소스 | 데이터 | API 비용 |
|------|--------|----------|
| 유튜브 급상승 / 엔터 급상승 | 국내 유튜브 트렌딩 (전체 + 엔터테인먼트 카테고리) | 무료 (YOUTUBE_API_KEY) |
| 시그널(signal.bz) 실시간 검색어 | 국내 커뮤니티/포털 실시간 화제 키워드 (네이버 실검 폐지 후 대체) | 무료 |
| 시그널 실시간 톱기사 | 네이트 등 포털 톱기사 (요약 포함) | 무료 |
| Google 뉴스 — 연예 | "연예" 키워드 국내 뉴스 | 무료 |
| Google 뉴스 — 화제·밈 | "화제/이슈/밈/논란" 국내 뉴스 | 무료 |
| Google Trends 🇰🇷 🇺🇸 🌍 | 실시간 급상승 검색어 (KR/US/GB+JP 병합) | 무료 |
| Reddit 흥미글 | popculture, entertainment, interestingasfuck 등 | 무료 |
| Reddit 테크 | AI, ML, 생산성, 테크 커뮤니티 | 무료 |
| HackerNews | 실리콘밸리 IT 트렌드 | 무료 |
| GitHub Trending | 오늘의 인기 오픈소스 프로젝트 | 무료 |
| Product Hunt | 신규 AI/테크 제품 런칭 | 무료 |
| 네이버 뉴스 | 국내 뉴스 검색 | 무료 (NAVER_CLIENT_ID/SECRET 필요, 없으면 비활성) |

## 💬 한글 요약 주석 (부활 + 확장)

영어 제목(해외 소스)뿐 아니라, 국내 실시간 검색어처럼 맥락 없는 짧은 한글 키워드도
Claude(Fable 5.2)가 "왜 화제인지" 한 줄로 설명해 카드 제목 아래에 표시합니다.

- 브라우저에서 우상단 "API 키 설정"으로 Claude API 키를 입력하면 바로 동작합니다.
- 또는 Vercel 프로젝트 환경변수에 `ANTHROPIC_API_KEY`를 설정해두면, 브라우저 키 없이도
  모든 방문자에게 자동으로 동작합니다(권장). 이렇게 하면 브라우저 로컬 저장소가
  지워져도(기기 변경, 캐시 삭제 등) 기능이 조용히 꺼지지 않습니다.
- 헤더의 💬 배지로 현재 활성 상태(요약 건수 또는 "비활성")를 바로 확인할 수 있습니다.

## 🚀 Vercel 배포 방법 (5분)

### 1단계: GitHub 저장소 만들기
1. [github.com](https://github.com)에 로그인
2. 우측 상단 `+` → `New repository` 클릭
3. 이름: `trend-radar` 입력
4. `Create repository` 클릭
5. 이 폴더의 모든 파일을 업로드 (드래그 앤 드롭)

### 2단계: Vercel 배포
1. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인
2. `Add New Project` 클릭
3. `trend-radar` 저장소 선택 → `Import`
4. Framework: `Next.js` 자동 감지됨
5. `Deploy` 클릭 → 2~3분 대기

### 3단계: 완료!
- `https://trend-radar-xxxxx.vercel.app` 주소가 생성됩니다
- PC, 스마트폰 어디서든 24시간 접속 가능
- 코드를 GitHub에서 수정하면 Vercel이 자동으로 재배포합니다

## 📁 파일 구조

```
trend-radar/
├── pages/
│   └── index.js          ← 메인 대시보드 (여기에 모든 코드)
├── public/               ← 정적 파일 (비어있음)
├── package.json          ← 프로젝트 설정
├── next.config.js        ← Next.js 설정
└── README.md             ← 이 파일
```

## 🔧 로컬에서 실행하기 (선택사항)

```bash
npm install
npm run dev
# http://localhost:3000 에서 확인
```

## 💡 기능

- **5분 자동 갱신** — 켜두면 자동으로 새 데이터 수집
- **소스별/카테고리별 필터링** — 관심 분야만 빠르게 확인
- **AI 콘텐츠 분석** — 트렌드 클릭 → Claude가 기회점수, 영상 아이디어, 업로드 타이밍 분석
- **AI 대본 생성** — 영상 아이디어에서 바로 대본 구조 생성
- **제작 파이프라인** — 발견 → 분석 → 대본 → 제작 → 발행 단계 관리

<!-- deploy: 2026-06-11T09:20:19.513203 -->
