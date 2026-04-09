# 🔍 TREND RADAR v4.0 — AI 콘텐츠 파이프라인

실시간 트렌드를 수집·분석하고, AI로 유튜브 콘텐츠 기회를 발견하는 대시보드입니다.

## 📡 연결된 8개 실시간 소스

| 소스 | 데이터 | API 비용 |
|------|--------|----------|
| HackerNews | 실리콘밸리 IT 트렌드 | 무료 |
| Reddit | AI, ML, 생산성, 테크 커뮤니티 | 무료 |
| Google Trends 🇰🇷 | 한국 실시간 인기 검색어 | 무료 |
| Google Trends 🇺🇸 | 미국 실시간 인기 검색어 | 무료 |
| Google Trends 🌍 | 전세계 인기 검색어 | 무료 |
| 네이버 뉴스 | AI/테크/자기계발 국내 뉴스 | 무료 |
| Product Hunt | 신규 AI/테크 제품 런칭 | 무료 |
| GitHub Trending | 오늘의 인기 오픈소스 프로젝트 | 무료 |

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
