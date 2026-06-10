import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── 아이콘 ───────────────────────────────────────────────────
const Ic = ({ n, s=14, c="currentColor" }) => {
  const d = {
    trend:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    youtube:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={c} stroke="none"/></svg>,
    zap:      <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    bar:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    list:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    search:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    refresh:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    chevron:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
    plus:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    key:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    fire:     <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2C9 7 7 9.5 9 13c-2-1-3-3-3-3S4 14 6 17c1 1.5 3 3 6 3s6-2 6-5c0-4-3-6-3-6s1 4-1 5c-1-3-2-5-2-7z"/></svg>,
    pipe:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  };
  return d[n] || null;
};

// ─── 색상 테마 ────────────────────────────────────────────────
const T = {
  bg:  "#08080f", bg1: "#0f0f1a", bg2: "#151522", bg3: "#1c1c2e", bg4: "#232336",
  ac:  "#7c6ff7", ac2: "#a78bfa", acd: "rgba(124,111,247,.12)", acb: "rgba(124,111,247,.3)",
  r:   "#f05252", rd:  "rgba(240,82,82,.12)",   rb: "rgba(240,82,82,.3)",
  g:   "#10c98a", gd:  "rgba(16,201,138,.1)",   gb: "rgba(16,201,138,.25)",
  am:  "#f59e0b", amd: "rgba(245,158,11,.1)",   amb: "rgba(245,158,11,.25)",
  cy:  "#0ea5e9", cyd: "rgba(14,165,233,.1)",   cyb: "rgba(14,165,233,.25)",
  ro:  "#f472b6", rod: "rgba(244,114,182,.1)",  rob: "rgba(244,114,182,.25)",
  t:   "#ffffff", ts:  "#b0b0d0", tm:  "#60607a", tb: "#38385a",
  b:   "rgba(255,255,255,.07)", b2: "rgba(255,255,255,.12)",
  m:   "'IBM Plex Mono', monospace",
  f:   "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
};

// ─── 소스 정의 ────────────────────────────────────────────────
const SRC_GROUPS = [
  {
    id: "all",    label: "전체",    icon: "🌐",  color: T.ac,
    sources: []
  },
  {
    id: "video",  label: "영상",    icon: "📺",  color: "#ff4444",
    sources: [
      { id: "youtube_kr", label: "유튜브 급상승", icon: "▶", color: "#ff4444" },
      { id: "youtube_ch", label: "유튜브 채널",   icon: "📺", color: "#ff6666" },
    ]
  },
  {
    id: "tech",   label: "테크",    icon: "💻",  color: T.cy,
    sources: [
      { id: "hackernews",    label: "HackerNews",  icon: "Y", color: "#ff6600" },
      { id: "github",        label: "GitHub",       icon: "G", color: "#a78bfa" },
      { id: "producthunt",   label: "ProductHunt",  icon: "P", color: "#da552f" },
    ]
  },
  {
    id: "news",   label: "뉴스",    icon: "📰",  color: T.am,
    sources: [
      { id: "naver_news", label: "네이버뉴스", icon: "N", color: "#03c75a" },
      { id: "reddit",     label: "Reddit",     icon: "R", color: "#ff4500" },
    ]
  },
  {
    id: "trends", label: "트렌드",  icon: "📊",  color: T.g,
    sources: [
      { id: "google_kr",     label: "Google KR",   icon: "🇰🇷", color: T.g },
      { id: "google_us",     label: "Google US",   icon: "🇺🇸", color: T.cy },
      { id: "google_global", label: "글로벌",       icon: "🌍", color: T.ac },
    ]
  },
];

// ─── 카테고리 정의 ────────────────────────────────────────────
const CATS = [
  {
    id:"ai",  e:"🤖", n:"AI·자기계발",   color:"#a78bfa",
    keywords:["AI","ChatGPT","GPT","Claude","Gemini","인공지능","자동화","생산성","자기계발"],
    subs:["AI 툴 활용","업무 자동화","직장인 꿀팁","커리어·성장","자기계발","노션·툴","프롬프트"]
  },
  {
    id:"tech", e:"💻", n:"테크·IT",      color:"#0ea5e9",
    keywords:["기술","IT","프로그래밍","개발","앱","소프트웨어","하드웨어"],
    subs:["가젯 리뷰","프로그래밍·개발","스타트업","앱·서비스","사이버보안","과학기술"]
  },
  {
    id:"money", e:"💰", n:"재테크·경제", color:"#f59e0b",
    keywords:["투자","주식","부동산","재테크","경제","금융","ETF"],
    subs:["주식·ETF","부동산","암호화폐","경제 뉴스","절약·재무","사업·창업"]
  },
  {
    id:"edu",  e:"📚", n:"교육·지식",    color:"#10c98a",
    keywords:["교육","학습","지식","공부","역사","과학"],
    subs:["생활상식","잡학지식","역사","과학","언어 공부","독서"]
  },
  {
    id:"ent",  e:"🎬", n:"엔터·일상",    color:"#f472b6",
    keywords:["브이로그","일상","예능","드라마","영화","음악"],
    subs:["브이로그","예능·클립","드라마·영화","음악","유머·밈","반려동물"]
  },
  {
    id:"sport", e:"⚽", n:"스포츠·게임", color:"#10c98a",
    keywords:["스포츠","게임","운동","헬스","축구","야구"],
    subs:["축구","야구·농구","헬스·운동","게임","e스포츠","격투기"]
  },
  {
    id:"life", e:"🌍", n:"여행·라이프",  color:"#0ea5e9",
    keywords:["여행","맛집","뷰티","패션","라이프","요리"],
    subs:["해외여행","국내여행","맛집","뷰티·패션","인테리어","요리"]
  },
];

// 열기 필터
const HEAT_OPTS = [
  { id:"all",  label:"전체",   icon:"",   color:T.ts },
  { id:"fire", label:"🔥 폭발", icon:"🔥", color:T.r  },
  { id:"rise", label:"📈 상승", icon:"📈", color:T.am },
  { id:"star", label:"⭐ 안정", icon:"⭐", color:T.g  },
  { id:"new",  label:"🆕 신규", icon:"🆕", color:T.cy },
];

// 기간 필터
const PERIOD_OPTS = [
  { id:"live", label:"실시간" },
  { id:"24h",  label:"24h"   },
  { id:"7d",   label:"7일"   },
  { id:"30d",  label:"30일"  },
];

// 정렬
const SORT_OPTS = [
  { id:"score",  label:"트렌드점수" },
  { id:"recent", label:"최신순"     },
  { id:"heat",   label:"열기순"     },
];


// ─── 트렌드 점수 계산 ─────────────────────────────────────────
function calcScore(item) {
  const src = item.source || "";
  let base = item.score || 50;
  if (src === "youtube_kr") base = Math.min(100, base + 15);
  else if (src === "hackernews") base = Math.min(100, base + 5);
  return Math.round(base);
}

function getHeat(item) {
  const s = calcScore(item);
  if (s >= 85) return "fire";
  if (s >= 65) return "rise";
  if (s >= 45) return "star";
  return "new";
}

function getCatMatch(item) {
  const text = (item.title + " " + (item.description || "")).toLowerCase();
  for (const cat of CATS) {
    if (cat.keywords.some(k => text.includes(k.toLowerCase()))) return cat.id;
  }
  return "other";
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function TrendRadar() {

  // 상태
  const [tab, setTab]         = useState("trends");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [fStatus, setFStatus] = useState({});
  const [apiKey, setApiKey]   = useState(() => typeof window !== "undefined" ? localStorage.getItem("tr_claude_key") || "" : "");
  const [showApiModal, setShowApiModal] = useState(false);
  const [pipe, setPipe]       = useState([]);

  // 필터 상태
  const [srcGroup, setSrcGroup]   = useState("all");
  const [srcDetail, setSrcDetail] = useState(null);
  const [catId, setCatId]         = useState("all");
  const [openCats, setOpenCats]   = useState({});
  const [heat, setHeat]           = useState("all");
  const [period, setPeriod]       = useState("24h");
  const [sortBy, setSortBy]       = useState("score");
  const [keyword, setKeyword]     = useState("");

  // 유튜브 탭
  const [ytKeyword, setYtKeyword] = useState("");
  const [ytVideos, setYtVideos]   = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResult, setYtResult]   = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [crossResult, setCrossResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sel, setSel]             = useState(null);

  // 채널분석
  const [chInput, setChInput]     = useState("");
  const [chResult, setChResult]   = useState(null);
  const [chLoading, setChLoading] = useState(false);

  // API 키 저장
  const saveApiKey = useCallback((k) => {
    setApiKey(k);
    if (typeof window !== "undefined") localStorage.setItem("tr_claude_key", k);
    setShowApiModal(false);
  }, []);

  // ─── 데이터 수집 ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = [];
    const status = {};

    const sources = [
      { id:"youtube_kr",     url:"/api/youtube?type=trending" },
      { id:"hackernews",     url:"https://hacker-news.firebaseio.com/v0/topstories.json" },
      { id:"reddit",         url:"https://www.reddit.com/r/technology.json?limit=20" },
      { id:"producthunt",    url:"https://www.producthunt.com/feed" },
      { id:"github",         url:"https://api.github.com/search/repositories?q=stars:>1000&sort=updated&per_page=20" },
      { id:"naver_news",     url:"/api/naver?type=news" },
      { id:"google_kr",      url:"/api/trends?region=KR" },
      { id:"google_us",      url:"/api/trends?region=US" },
    ];

    await Promise.allSettled(sources.map(async (src) => {
      try {
        const res = await fetch(src.url);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const parsed = parseSource(src.id, data);
        results.push(...parsed);
        status[src.id] = { ok: true, n: parsed.length };
      } catch (e) {
        status[src.id] = { ok: false, n: 0, err: e.message };
      }
    }));

    setItems(results);
    setFStatus(status);
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  function parseSource(srcId, data) {
    if (srcId === "youtube_kr") {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.xml || "", "text/xml");
        const entries = Array.from(xml.querySelectorAll("entry"));
        return entries.slice(0, 25).map((e, i) => ({
          id: `yt_${i}_${Date.now()}`,
          source: "youtube_kr",
          title: e.querySelector("title")?.textContent || "",
          url: e.querySelector("link")?.getAttribute("href") || "",
          score: Math.max(20, 90 - i * 2),
          heat: i < 3 ? "fire" : i < 8 ? "rise" : "star",
          time: e.querySelector("published")?.textContent || "",
          extra: {
            views: e.querySelector("statistics")?.getAttribute("views") || "0",
            channel: e.querySelector("author name")?.textContent || "",
          }
        }));
      } catch { return []; }
    }

    if (srcId === "hackernews") {
      const ids = Array.isArray(data) ? data.slice(0, 20) : [];
      return ids.map((id, i) => ({
        id: `hn_${id}`,
        source: "hackernews",
        title: `HN #${id}`,
        url: `https://news.ycombinator.com/item?id=${id}`,
        score: Math.max(20, 80 - i * 3),
        heat: i < 3 ? "fire" : "rise",
        time: new Date().toISOString(),
      }));
    }

    if (srcId === "reddit") {
      const posts = data?.data?.children || [];
      return posts.slice(0, 15).map((p, i) => ({
        id: `rd_${p.data?.id}`,
        source: "reddit",
        title: p.data?.title || "",
        url: `https://reddit.com${p.data?.permalink}`,
        score: Math.min(100, Math.round((p.data?.score || 0) / 100)),
        heat: (p.data?.score || 0) > 5000 ? "fire" : "rise",
        time: new Date((p.data?.created_utc || 0) * 1000).toISOString(),
        extra: { upvotes: p.data?.score, comments: p.data?.num_comments }
      }));
    }

    if (srcId === "github") {
      const repos = data?.items || [];
      return repos.slice(0, 15).map((r, i) => ({
        id: `gh_${r.id}`,
        source: "github",
        title: `${r.full_name} — ${r.description || ""}`,
        url: r.html_url,
        score: Math.min(100, Math.round(r.stargazers_count / 1000)),
        heat: r.stargazers_count > 10000 ? "fire" : "rise",
        time: r.updated_at,
        extra: { stars: r.stargazers_count, lang: r.language }
      }));
    }

    return [];
  }

  useEffect(() => { fetchAll(); }, []);

  // ─── 필터링 ───────────────────────────────────────────────
  const filtered = items.filter(item => {
    // 소스 필터
    if (srcDetail) {
      if (item.source !== srcDetail) return false;
    } else if (srcGroup !== "all") {
      const grp = SRC_GROUPS.find(g => g.id === srcGroup);
      if (grp && !grp.sources.find(s => s.id === item.source)) return false;
    }

    // 카테고리 필터
    if (catId !== "all") {
      if (getCatMatch(item) !== catId) return false;
    }

    // 열기 필터
    if (heat !== "all") {
      if (getHeat(item) !== heat) return false;
    }

    // 키워드 필터
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      if (!item.title.toLowerCase().includes(kw)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "score")  return calcScore(b) - calcScore(a);
    if (sortBy === "recent") return new Date(b.time) - new Date(a.time);
    if (sortBy === "heat") {
      const hOrder = { fire:3, rise:2, star:1, new:0 };
      return (hOrder[getHeat(b)]||0) - (hOrder[getHeat(a)]||0);
    }
    return 0;
  });

  // 소스별 카운트
  const srcCounts = {};
  items.forEach(item => {
    srcCounts[item.source] = (srcCounts[item.source] || 0) + 1;
  });

  const totalFire = items.filter(i => getHeat(i) === "fire").length;
  const totalRise = items.filter(i => getHeat(i) === "rise").length;


  // ─── AI 분석 ──────────────────────────────────────────────
  const analyze = useCallback(async (trend) => {
    if (!apiKey) { setShowApiModal(true); return; }
    setAnalysisLoading(true); setSel(trend); setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", trend, apiKey }),
      });
      const d = await res.json();
      if (d.result) setAnalysis({ ...d.result, title: trend.title });
      else setAnalysis({ error: d.error || "분석 실패" });
    } catch (e) {
      setAnalysis({ error: e.message });
    }
    setAnalysisLoading(false);
  }, [apiKey]);

  const addToPipe = useCallback((trend) => {
    setPipe(p => {
      if (p.find(x => x.id === trend.id)) return p;
      return [...p, {
        id: trend.id,
        trend: trend.title,
        source: trend.source,
        stage: "발굴됨",
        score: calcScore(trend),
        added: new Date().toLocaleString("ko-KR"),
      }];
    });
    setTab("pipeline");
  }, []);

  // ─── CSS ─────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}}
    @keyframes liveDot{0%,100%{box-shadow:0 0 0 0 ${T.g}60}50%{box-shadow:0 0 0 6px transparent}}

    *{box-sizing:border-box;margin:0;scrollbar-width:thin;scrollbar-color:${T.tb} transparent}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:${T.tb};border-radius:4px}
    body{background:${T.bg};color:${T.t};font-family:${T.f};-webkit-font-smoothing:antialiased}
    input,textarea{font-family:${T.f};outline:none}
    button{cursor:pointer;font-family:${T.f};border:none;transition:all .15s}

    /* 사이드바 아이템 */
    .sb-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;font-size:12px;font-weight:600;color:${T.ts};cursor:pointer;transition:all .15s;position:relative;user-select:none}
    .sb-item:hover{background:rgba(255,255,255,.04);color:${T.t}}
    .sb-item.active{font-weight:700}
    .sb-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:2px;height:20px;border-radius:0 2px 2px 0}

    /* 소스 그룹 버튼 */
    .src-btn{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;font-size:12px;font-weight:600;color:${T.ts};cursor:pointer;transition:all .15s;border:1px solid transparent;background:none;width:100%}
    .src-btn:hover{background:rgba(255,255,255,.04);color:${T.t}}
    .src-btn.active{font-weight:700}

    /* 소스 세부 */
    .src-sub{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 28px;border-radius:8px;font-size:11px;font-weight:500;color:${T.tm};cursor:pointer;transition:all .15s}
    .src-sub:hover{background:rgba(255,255,255,.04);color:${T.ts}}
    .src-sub.active{font-weight:700}

    /* 카테고리 트리 */
    .cat-main{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;font-size:12px;font-weight:600;color:${T.ts};cursor:pointer;transition:all .15s}
    .cat-main:hover{background:rgba(255,255,255,.04);color:${T.t}}
    .cat-main.active{font-weight:700}
    .cat-sub-item{padding:5px 10px 5px 36px;border-radius:8px;font-size:11px;color:${T.tm};cursor:pointer;transition:all .15s}
    .cat-sub-item:hover{background:rgba(255,255,255,.04);color:${T.ts}}
    .cat-sub-item.active{font-weight:600}

    /* 필 버튼 */
    .pill{padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid ${T.b};background:none;color:${T.tm};cursor:pointer;transition:all .15s;white-space:nowrap}
    .pill:hover{border-color:${T.b2};color:${T.ts}}
    .pill.active{border-color:transparent;color:#fff}

    /* 트렌드 카드 */
    .trend-card{background:${T.bg2};border:1px solid ${T.b};border-left:3px solid transparent;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .18s;animation:fadeUp .25s ease both}
    .trend-card:hover{background:${T.bg3};border-color:${T.b2};transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.4)}

    /* 섹션 타이틀 */
    .sec-title{font-size:10px;font-weight:800;letter-spacing:.1em;color:${T.tm};padding:0 4px;margin:16px 0 8px;display:flex;align-items:center;gap:8px}
    .sec-title:first-child{margin-top:0}
    .sec-title-bar{flex:1;height:1px;background:${T.b}}

    .skeleton{background:linear-gradient(90deg,${T.bg2} 25%,${T.bg3} 50%,${T.bg2} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
  `;


  // ─── 사이드바 렌더 ────────────────────────────────────────
  const Sidebar = () => {
    const activeGroup = SRC_GROUPS.find(g => g.id === srcGroup);

    return (
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: `1px solid ${T.b}`,
        background: T.bg1,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 52,
        height: "calc(100vh - 52px)",
        overflowY: "auto",
        padding: "14px 10px",
        gap: 1,
      }}>

        {/* 검색창 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.bg3, border: `1px solid ${T.b}`,
          borderRadius: 10, padding: "8px 10px", marginBottom: 4,
        }}>
          <Ic n="search" s={13} c={T.tm}/>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="키워드 검색..."
            style={{
              background: "none", border: "none", flex: 1,
              fontSize: 12, color: T.t,
              "::placeholder": { color: T.tm }
            }}
          />
          {keyword && (
            <button onClick={() => setKeyword("")}
              style={{ background: "none", color: T.tm, padding: 2 }}>
              <Ic n="x" s={11} c={T.tm}/>
            </button>
          )}
        </div>

        {/* 탐색 모드 */}
        <div className="sec-title">탐색 모드<div className="sec-title-bar"/></div>
        {[
          { id:"trends",   l:"트렌드 분석",   ic:"trend",   n: filtered.length,  c: T.ac  },
          { id:"youtube",  l:"유튜브 벤치마킹",ic:"youtube", n: null,             c:"#ff4444" },
          { id:"cross",    l:"교차분석",       ic:"zap",     n: null,             c: T.r, hot:!!(analysis&&ytResult) },
          { id:"channel",  l:"채널분석",       ic:"bar",     n: null,             c: T.ro  },
          { id:"pipeline", l:"파이프라인",     ic:"pipe",    n: pipe.length||null,c: T.g   },
        ].map(it => (
          <div key={it.id}
            className={`sb-item${tab===it.id?" active":""}`}
            onClick={() => setTab(it.id)}
            style={{
              color: tab===it.id ? it.c : T.ts,
              background: tab===it.id ? `${it.c}12` : undefined,
            }}
          >
            {tab===it.id && (
              <div style={{
                position:"absolute", left:0, top:"50%",
                transform:"translateY(-50%)",
                width:2, height:18, background:it.c,
                borderRadius:"0 2px 2px 0"
              }}/>
            )}
            <Ic n={it.ic} s={13} c={tab===it.id ? it.c : T.tm}/>
            <span style={{flex:1}}>{it.l}</span>
            {it.n != null && (
              <span style={{
                fontSize:9, fontFamily:T.m, padding:"1px 6px",
                borderRadius:20,
                background: tab===it.id ? `${it.c}20` : "rgba(255,255,255,.07)",
                color: tab===it.id ? it.c : T.tm,
              }}>{it.n}</span>
            )}
            {it.hot && <span style={{width:5,height:5,borderRadius:"50%",background:T.r,animation:"pulse 1s infinite"}}/>}
          </div>
        ))}

        {/* 소스 필터 — 대분류 */}
        <div className="sec-title" style={{marginTop:8}}>소스<div className="sec-title-bar"/></div>
        {SRC_GROUPS.map(grp => {
          const grpCount = grp.id === "all"
            ? items.length
            : grp.sources.reduce((s, src) => s + (srcCounts[src.id]||0), 0);
          const isActive = srcGroup === grp.id && !srcDetail;

          return (
            <div key={grp.id}>
              <button
                className={`src-btn${isActive?" active":""}`}
                onClick={() => { setSrcGroup(grp.id); setSrcDetail(null); }}
                style={{
                  color: isActive ? grp.color : T.ts,
                  background: isActive ? `${grp.color}12` : undefined,
                  borderColor: isActive ? `${grp.color}30` : "transparent",
                }}
              >
                <span style={{fontSize:14}}>{grp.icon}</span>
                <span style={{flex:1, textAlign:"left"}}>{grp.label}</span>
                <span style={{
                  fontSize:9, fontFamily:T.m, padding:"1px 6px",
                  borderRadius:20,
                  background: isActive ? `${grp.color}20` : "rgba(255,255,255,.07)",
                  color: isActive ? grp.color : T.tm,
                }}>{grpCount}</span>
                {grp.sources.length > 0 && (
                  <span style={{
                    fontSize:9, color:T.tm, transition:"transform .2s",
                    transform: srcGroup===grp.id ? "rotate(0deg)" : "rotate(-90deg)",
                  }}>▼</span>
                )}
              </button>

              {/* 중분류 — 선택된 그룹만 펼침 */}
              {srcGroup === grp.id && grp.sources.map(src => {
                const n = srcCounts[src.id] || 0;
                const isDetailActive = srcDetail === src.id;
                return (
                  <div key={src.id}
                    className={`src-sub${isDetailActive?" active":""}`}
                    onClick={() => setSrcDetail(isDetailActive ? null : src.id)}
                    style={{ color: isDetailActive ? src.color : T.tm }}
                  >
                    <span style={{
                      fontSize:10, fontFamily:T.m, fontWeight:800,
                      color:src.color, width:14, textAlign:"center", flexShrink:0
                    }}>{src.icon}</span>
                    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {src.label}
                    </span>
                    <span style={{
                      fontSize:8, fontFamily:T.m, padding:"1px 5px",
                      borderRadius:20,
                      background: isDetailActive ? `${src.color}20` : "rgba(255,255,255,.07)",
                      color: isDetailActive ? src.color : T.tm,
                    }}>{n}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 카테고리 필터 */}
        <div className="sec-title" style={{marginTop:8}}>카테고리<div className="sec-title-bar"/></div>

        {/* 전체 */}
        <div
          className={`cat-main${catId==="all"?" active":""}`}
          onClick={() => { setCatId("all"); setOpenCats({}); }}
          style={{ color: catId==="all" ? T.ac : T.ts,
                   background: catId==="all" ? T.acd : undefined }}
        >
          <span style={{fontSize:14}}>🌐</span>
          <span style={{flex:1}}>전체</span>
          <span style={{fontSize:9,fontFamily:T.m,color:T.tm}}>{items.length}</span>
        </div>

        {CATS.map(cat => {
          const isOpen = openCats[cat.id];
          const isActive = catId === cat.id;
          const catCount = items.filter(i => getCatMatch(i) === cat.id).length;

          return (
            <div key={cat.id}>
              <div
                className={`cat-main${isActive?" active":""}`}
                onClick={() => {
                  setCatId(cat.id);
                  setOpenCats(prev => ({...prev, [cat.id]: !prev[cat.id]}));
                }}
                style={{
                  color: isActive ? cat.color : T.ts,
                  background: isActive ? `${cat.color}12` : undefined,
                }}
              >
                <span style={{fontSize:13}}>{cat.e}</span>
                <span style={{flex:1,fontSize:11}}>{cat.n}</span>
                <span style={{fontSize:9,fontFamily:T.m,color:T.tm,marginRight:2}}>{catCount}</span>
                <span style={{
                  fontSize:9, color:T.tm, transition:"transform .2s",
                  transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                }}>▼</span>
              </div>

              {isOpen && (
                <div>
                  {cat.subs.map(sub => (
                    <div key={sub}
                      className={`cat-sub-item${catId===sub?" active":""}`}
                      onClick={e => { e.stopPropagation(); setCatId(sub); }}
                      style={{ color: catId===sub ? cat.color : T.tm }}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 열기 필터 */}
        <div className="sec-title" style={{marginTop:8}}>열기<div className="sec-title-bar"/></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"0 2px"}}>
          {HEAT_OPTS.map(h => (
            <button key={h.id}
              className={`pill${heat===h.id?" active":""}`}
              onClick={() => setHeat(h.id)}
              style={heat===h.id ? {
                background:`${h.color}20`,
                borderColor:`${h.color}40`,
                color: h.color,
              } : {}}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* 기간 필터 */}
        <div className="sec-title" style={{marginTop:8}}>기간<div className="sec-title-bar"/></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"0 2px"}}>
          {PERIOD_OPTS.map(p => (
            <button key={p.id}
              className={`pill${period===p.id?" active":""}`}
              onClick={() => setPeriod(p.id)}
              style={period===p.id ? {
                background: T.acd, borderColor: T.acb, color: T.ac2,
              } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="sec-title" style={{marginTop:8}}>정렬<div className="sec-title-bar"/></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"0 2px"}}>
          {SORT_OPTS.map(s => (
            <button key={s.id}
              className={`pill${sortBy===s.id?" active":""}`}
              onClick={() => setSortBy(s.id)}
              style={sortBy===s.id ? {
                background: T.acd, borderColor: T.acb, color: T.ac2,
              } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>

      </aside>
    );
  };


  // ─── 트렌드 카드 ──────────────────────────────────────────
  const TrendCard = ({ item, idx }) => {
    const score = calcScore(item);
    const h = getHeat(item);
    const heatStyle = {
      fire: { color: T.r,  bg: T.rd,  border: T.rb,  label:"🔥 폭발" },
      rise: { color: T.am, bg: T.amd, border: T.amb, label:"📈 상승" },
      star: { color: T.g,  bg: T.gd,  border: T.gb,  label:"⭐ 안정" },
      new:  { color: T.cy, bg: T.cyd, border: T.cyb, label:"🆕 신규" },
    }[h] || { color:T.ts, bg:"transparent", border:T.b, label:"" };

    const srcInfo = Object.values(SRC_GROUPS)
      .flatMap(g => g.sources)
      .find(s => s.id === item.source) || { color:T.tm, icon:"·", label:item.source };

    const timeAgo = item.time ? (() => {
      const diff = (Date.now() - new Date(item.time)) / 1000;
      if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
      return `${Math.floor(diff/86400)}일 전`;
    })() : "";

    return (
      <div
        className="trend-card"
        onClick={() => window.open(item.url, "_blank")}
        style={{
          borderLeftColor: heatStyle.color,
          animationDelay: `${idx * 0.04}s`,
        }}
      >
        {/* 상단: 소스 + 열기 + 시간 */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{
            fontSize:9, fontFamily:T.m, fontWeight:800,
            padding:"2px 7px", borderRadius:20,
            background:`${srcInfo.color}15`,
            color:srcInfo.color, border:`1px solid ${srcInfo.color}30`,
          }}>
            {srcInfo.icon} {srcInfo.label}
          </span>
          <span style={{
            fontSize:9, fontFamily:T.m, fontWeight:700,
            padding:"2px 7px", borderRadius:20,
            background:heatStyle.bg, color:heatStyle.color,
            border:`1px solid ${heatStyle.border}`,
          }}>
            {heatStyle.label}
          </span>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:T.m,color:T.tm}}>{timeAgo}</span>
        </div>

        {/* 제목 */}
        <div style={{
          fontSize:14, fontWeight:700, lineHeight:1.5,
          color:T.t, marginBottom:10,
          letterSpacing:"-0.02em",
        }}>
          {item.title}
        </div>

        {/* 점수 바 */}
        <div style={{marginBottom:10}}>
          <div style={{
            height:3, borderRadius:3, background:"rgba(255,255,255,.06)",
            overflow:"hidden", marginBottom:4,
          }}>
            <div style={{
              height:"100%", borderRadius:3,
              width:`${score}%`,
              background:`linear-gradient(90deg, ${heatStyle.color}, ${heatStyle.color}80)`,
              transition:"width .6s ease",
            }}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:9,fontFamily:T.m,color:T.tm}}>트렌드 점수</span>
            <span style={{fontSize:10,fontFamily:T.m,fontWeight:700,color:heatStyle.color}}>{score}</span>
          </div>
        </div>

        {/* 액션 버튼 3개 */}
        <div style={{display:"flex",gap:5}}>
          <button
            onClick={e => { e.stopPropagation(); analyze(item); }}
            style={{
              flex:1, padding:"6px 4px", borderRadius:8,
              background:T.acd, border:`1px solid ${T.acb}`,
              color:T.ac2, fontSize:10, fontWeight:700,
            }}
          >
            🤖 AI분석
          </button>
          <button
            onClick={e => { e.stopPropagation(); setYtKeyword(item.title); setTab("youtube"); }}
            style={{
              flex:1, padding:"6px 4px", borderRadius:8,
              background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.25)",
              color:"#ff8080", fontSize:10, fontWeight:700,
            }}
          >
            📺 벤치마킹
          </button>
          <button
            onClick={e => { e.stopPropagation(); addToPipe(item); }}
            style={{
              flex:1, padding:"6px 4px", borderRadius:8,
              background:T.gd, border:`1px solid ${T.gb}`,
              color:T.g, fontSize:10, fontWeight:700,
            }}
          >
            📋 파이프라인
          </button>
        </div>
      </div>
    );
  };

  // ─── 트렌드 탭 콘텐츠 ────────────────────────────────────
  const TrendsTab = () => (
    <div style={{padding:"16px 20px"}}>
      {/* 검색 결과 요약 */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        marginBottom:14, flexWrap:"wrap",
      }}>
        <span style={{fontSize:13, fontWeight:700, color:T.t}}>
          검색결과
        </span>
        {srcGroup !== "all" && (
          <span style={{
            fontSize:10, padding:"2px 8px", borderRadius:20,
            background:`${SRC_GROUPS.find(g=>g.id===srcGroup)?.color}15`,
            color:SRC_GROUPS.find(g=>g.id===srcGroup)?.color,
          }}>
            {SRC_GROUPS.find(g=>g.id===srcGroup)?.icon} {SRC_GROUPS.find(g=>g.id===srcGroup)?.label}
          </span>
        )}
        {catId !== "all" && (
          <span style={{
            fontSize:10, padding:"2px 8px", borderRadius:20,
            background:T.acd, color:T.ac2,
          }}>
            {CATS.find(c=>c.id===catId)?.e} {CATS.find(c=>c.id===catId)?.n || catId}
          </span>
        )}
        {heat !== "all" && (
          <span style={{
            fontSize:10, padding:"2px 8px", borderRadius:20,
            background:T.rd, color:T.r,
          }}>
            {HEAT_OPTS.find(h=>h.id===heat)?.label}
          </span>
        )}
        <span style={{
          marginLeft:"auto", fontSize:11, fontFamily:T.m,
          fontWeight:700, color:T.ac,
        }}>
          {filtered.length}개
        </span>
        {lastFetch && (
          <span style={{fontSize:9,fontFamily:T.m,color:T.tm}}>
            갱신 {lastFetch.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}
          </span>
        )}
      </div>

      {/* AI 분석 결과 패널 */}
      {sel && (
        <div style={{
          background:T.bg2, border:`1px solid ${T.acb}`,
          borderRadius:14, padding:"16px 18px",
          marginBottom:16, animation:"fadeUp .3s ease",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:16}}>🤖</span>
            <span style={{fontSize:13,fontWeight:700,color:T.t,flex:1}}>AI 분석</span>
            <span style={{fontSize:11,color:T.tm,flex:1}}>{sel.title?.substring(0,40)}...</span>
            <button onClick={() => { setSel(null); setAnalysis(null); }}
              style={{background:"none",color:T.tm,padding:4}}>
              <Ic n="x" s={13}/>
            </button>
          </div>

          {analysisLoading ? (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              <div style={{
                width:16,height:16,border:`2px solid ${T.b}`,
                borderTopColor:T.ac,borderRadius:"50%",
                animation:"spin .7s linear infinite"
              }}/>
              <span style={{fontSize:12,color:T.tm}}>Claude가 분석 중...</span>
            </div>
          ) : analysis?.error ? (
            <div style={{fontSize:12,color:T.r}}>{analysis.error}</div>
          ) : analysis ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              <div style={{background:T.bg3,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:4}}>기회점수</div>
                <div style={{fontSize:22,fontWeight:800,fontFamily:T.m,color:T.ac}}>{analysis.opportunity}<span style={{fontSize:11,color:T.tm}}>/10</span></div>
              </div>
              <div style={{background:T.bg3,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:4}}>경쟁강도</div>
                <div style={{fontSize:15,fontWeight:700,color:analysis.competition==="높음"?T.r:analysis.competition==="중간"?T.am:T.g}}>{analysis.competition}</div>
              </div>
              <div style={{background:T.bg3,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:4}}>긴급성</div>
                <div style={{fontSize:14,fontWeight:700,color:analysis.urgency?.includes("긴급")?T.r:T.am}}>{analysis.urgency}</div>
              </div>
              {analysis.summary_ko && (
                <div style={{gridColumn:"1/-1",background:T.bg3,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:6}}>요약</div>
                  <div style={{fontSize:12,color:T.ts,lineHeight:1.6}}>{analysis.summary_ko}</div>
                </div>
              )}
              {analysis.angle && (
                <div style={{gridColumn:"1/-1",background:T.acd,border:`1px solid ${T.acb}`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:4}}>🎯 내 채널 각도</div>
                  <div style={{fontSize:12,color:T.ac2,fontWeight:600}}>{analysis.angle}</div>
                </div>
              )}
              {analysis.videos?.length > 0 && (
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:9,fontFamily:T.m,color:T.tm,marginBottom:8}}>추천 영상 아이디어</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {analysis.videos.map((v,i) => (
                      <div key={i} style={{
                        display:"flex",gap:8,alignItems:"center",
                        background:T.bg3,borderRadius:8,padding:"8px 10px",
                      }}>
                        <span style={{
                          fontSize:8,fontFamily:T.m,fontWeight:700,
                          padding:"2px 7px",borderRadius:12,
                          background:T.acd,color:T.ac2,flexShrink:0
                        }}>{v.format}</span>
                        <span style={{fontSize:12,color:T.t,flex:1}}>{v.title}</span>
                        <span style={{fontSize:9,fontFamily:T.m,color:T.g,flexShrink:0}}>{v.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && filtered.length === 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{height:140}}/>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && filtered.length === 0 && (
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📡</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>
            {items.length === 0 ? "데이터 수집 중..." : "조건에 맞는 트렌드가 없어요"}
          </div>
          <div style={{fontSize:12,color:T.tm,lineHeight:1.7}}>
            {items.length === 0
              ? "소스에서 트렌드를 가져오고 있어요"
              : "필터 조건을 바꿔서 다시 탐색해보세요"}
          </div>
        </div>
      )}

      {/* 트렌드 카드 목록 */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((item, idx) => (
          <TrendCard key={item.id} item={item} idx={idx}/>
        ))}
      </div>
    </div>
  );


  // ─── 파이프라인 탭 ────────────────────────────────────────
  const PipelineTab = () => {
    const STAGES = ["발굴됨","AI분석완료","벤치마킹완료","교차분석완료","제작중","완료"];
    return (
      <div style={{padding:"16px 20px"}}>
        <div style={{
          display:"flex",alignItems:"center",gap:10,marginBottom:16,
        }}>
          <span style={{fontSize:15,fontWeight:800,color:T.t}}>콘텐츠 파이프라인</span>
          <span style={{
            fontSize:9,fontFamily:T.m,padding:"2px 8px",borderRadius:20,
            background:T.gd,border:`1px solid ${T.gb}`,color:T.g,
          }}>{pipe.length}개</span>
        </div>

        {pipe.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📋</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>파이프라인이 비어있어요</div>
            <div style={{fontSize:12,color:T.tm,lineHeight:1.7}}>
              트렌드 카드에서 📋 파이프라인 버튼을 눌러<br/>콘텐츠를 추가해보세요
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pipe.map((item,i) => (
              <div key={item.id} style={{
                background:T.bg2, border:`1px solid ${T.b}`,
                borderRadius:12, padding:"14px 16px",
                animation:"fadeUp .25s ease both",
                animationDelay:`${i*.04}s`,
              }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{
                    width:36,height:36,borderRadius:8,
                    background:T.acd,border:`1px solid ${T.acb}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:16,flexShrink:0,
                  }}>📋</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{
                      fontSize:13,fontWeight:700,color:T.t,
                      marginBottom:6,lineHeight:1.4,
                    }}>{item.trend}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{
                        fontSize:9,fontFamily:T.m,padding:"2px 7px",
                        borderRadius:20,background:T.acd,
                        color:T.ac2,border:`1px solid ${T.acb}`,
                      }}>{item.stage}</span>
                      <span style={{fontSize:9,fontFamily:T.m,color:T.tm}}>
                        {item.added}
                      </span>
                      <span style={{
                        fontSize:9,fontFamily:T.m,padding:"2px 7px",
                        borderRadius:20,background:T.rd,color:T.r,
                        marginLeft:"auto",
                      }}>점수 {item.score}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPipe(p => p.filter(x => x.id !== item.id))}
                    style={{background:"none",color:T.tm,padding:4,flexShrink:0}}
                  >
                    <Ic n="x" s={13}/>
                  </button>
                </div>
                <div style={{
                  display:"flex",gap:4,marginTop:10,flexWrap:"wrap",
                }}>
                  {["🤖 AI분석","📺 유튜브","⚡ 교차분석","🎬 대본생성"].map(btn => (
                    <button key={btn} style={{
                      padding:"5px 10px",borderRadius:8,fontSize:10,fontWeight:700,
                      background:T.bg3,border:`1px solid ${T.b}`,
                      color:T.ts,
                    }}>{btn}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── 메인 렌더 ────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>TREND RADAR v7 — AI 콘텐츠 파이프라인</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
      </Head>

      <style>{css}</style>

      <div style={{
        minHeight:"100vh",background:T.bg,
        display:"grid",gridTemplateRows:"52px 1fr",
      }}>

        {/* ── 헤더 ── */}
        <header style={{
          display:"flex",alignItems:"center",
          padding:"0 20px",gap:16,
          borderBottom:`1px solid ${T.b}`,
          background:"rgba(8,8,15,.97)",
          backdropFilter:"blur(20px)",
          position:"sticky",top:0,zIndex:100,
        }}>
          {/* 로고 */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{
              width:30,height:30,borderRadius:8,
              background:`linear-gradient(135deg,${T.ac},#c084fc)`,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              <Ic n="trend" s={15} c="#fff"/>
            </div>
            <span style={{
              fontSize:14,fontWeight:800,letterSpacing:"-.04em",color:T.t
            }}>TREND RADAR</span>
            <span style={{
              fontSize:9,fontFamily:T.m,fontWeight:700,
              padding:"2px 7px",borderRadius:20,
              background:T.acd,color:T.ac2,
              border:`1px solid ${T.acb}`,
            }}>v7</span>
            <span style={{
              display:"flex",alignItems:"center",gap:5,
              fontSize:9,fontFamily:T.m,fontWeight:700,
              padding:"2px 8px",borderRadius:20,
              background:T.gd,color:T.g,
              border:`1px solid ${T.gb}`,
            }}>
              <span style={{
                width:5,height:5,borderRadius:"50%",
                background:T.g,animation:"liveDot 2s infinite",
              }}/>
              LIVE
            </span>
          </div>

          {/* 중앙 통계 */}
          <div style={{
            flex:1,display:"flex",alignItems:"center",gap:16,
            fontSize:11,fontFamily:T.m,color:T.tm,
          }}>
            {lastFetch && (
              <span>
                갱신 {lastFetch.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}
              </span>
            )}
            <span style={{color:T.ts}}>
              총 <strong style={{color:T.t}}>{items.length}</strong>개
            </span>
            {totalFire > 0 && (
              <span style={{color:T.r}}>🔥 <strong>{totalFire}</strong></span>
            )}
            {totalRise > 0 && (
              <span style={{color:T.am}}>📈 <strong>{totalRise}</strong></span>
            )}
            <span style={{color:T.tm}}>
              <strong style={{color:T.ts}}>
                {Object.values(fStatus).filter(s=>s.ok).length}
              </strong>/{Object.keys(fStatus).length} 소스
            </span>
          </div>

          {/* 우측 버튼 */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <button
              onClick={() => setShowApiModal(true)}
              style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"5px 12px",borderRadius:20,
                border:`1px solid ${apiKey?T.gb:T.b}`,
                background: apiKey?T.gd:"transparent",
                color: apiKey?T.g:T.tm,
                fontSize:10,fontFamily:T.m,fontWeight:700,
              }}
            >
              <Ic n="key" s={11} c={apiKey?T.g:T.tm}/>
              {apiKey ? "Claude 연결됨" : "API 키 설정"}
            </button>
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"5px 14px",borderRadius:20,
                border:`1px solid ${T.acb}`,
                background:T.acd,color:T.ac2,
                fontSize:10,fontFamily:T.m,fontWeight:700,
                opacity:loading?.5:1,
              }}
            >
              <Ic n="refresh" s={11} c={T.ac2}/>
              {loading ? "수집중..." : "수집"}
            </button>
          </div>
        </header>

        {/* ── 바디 ── */}
        <div style={{display:"flex",overflow:"hidden"}}>

          <Sidebar/>

          {/* 콘텐츠 영역 */}
          <main style={{
            flex:1,overflowY:"auto",minWidth:0,
            height:"calc(100vh - 52px)",
          }}>
            {tab === "trends"   && <TrendsTab/>}
            {tab === "youtube"  && (
              <div style={{padding:"16px 20px",textAlign:"center",paddingTop:60}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📺</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>유튜브 벤치마킹</div>
                <div style={{fontSize:12,color:T.tm}}>트렌드 카드에서 📺 벤치마킹 버튼을 누르면 자동으로 키워드가 설정됩니다</div>
              </div>
            )}
            {tab === "cross"    && (
              <div style={{padding:"16px 20px",textAlign:"center",paddingTop:60}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.4}}>⚡</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>교차분석</div>
                <div style={{fontSize:12,color:T.tm}}>AI분석과 유튜브 벤치마킹 후 교차분석이 활성화됩니다</div>
              </div>
            )}
            {tab === "channel"  && (
              <div style={{padding:"16px 20px",textAlign:"center",paddingTop:60}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📊</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>채널분석</div>
                <div style={{fontSize:12,color:T.tm}}>경쟁 채널을 분석해드립니다</div>
              </div>
            )}
            {tab === "pipeline" && <PipelineTab/>}
          </main>
        </div>
      </div>

      {/* API 키 모달 */}
      {showApiModal && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.7)",
          backdropFilter:"blur(8px)",zIndex:200,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}
          onClick={e => e.target===e.currentTarget && setShowApiModal(false)}
        >
          <div style={{
            background:T.bg2,border:`1px solid ${T.b}`,
            borderRadius:18,padding:28,width:"100%",maxWidth:420,
            animation:"fadeUp .3s ease",
          }}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>🔑 Claude API 키</div>
            <div style={{fontSize:12,color:T.tm,marginBottom:16,lineHeight:1.7}}>
              AI 분석 기능에 사용됩니다.<br/>
              키는 브라우저에만 저장되며 서버로 전송되지 않아요.
            </div>
            <input
              type="password"
              defaultValue={apiKey}
              id="apiKeyInput"
              placeholder="sk-ant-..."
              style={{
                width:"100%",padding:"10px 14px",
                background:T.bg3,border:`1px solid ${T.b}`,
                borderRadius:10,color:T.t,fontSize:13,
                marginBottom:12,
              }}
            />
            <div style={{display:"flex",gap:8}}>
              <button
                onClick={() => {
                  const val = document.getElementById("apiKeyInput").value.trim();
                  if (val) saveApiKey(val);
                }}
                style={{
                  flex:1,padding:"10px",borderRadius:10,
                  background:`linear-gradient(135deg,${T.ac},#c084fc)`,
                  color:"#fff",fontSize:13,fontWeight:700,
                }}
              >저장</button>
              <button
                onClick={() => setShowApiModal(false)}
                style={{
                  padding:"10px 16px",borderRadius:10,
                  background:T.bg3,border:`1px solid ${T.b}`,
                  color:T.tm,fontSize:13,
                }}
              >취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
