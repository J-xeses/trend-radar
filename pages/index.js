import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ---
const Ic = ({ n, s=16, c="currentColor" }) => {
  const icons = {
    trend:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    youtube: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={c} stroke="none"/></svg>,
    zap:     <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    pipe:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    search:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    chevron: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
    x:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    key:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    plus:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    globe:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    music:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  };
  return icons[n] || null;
};

// ---
const C = {
  bg:  "#07070e", bg1: "#0d0d1a", bg2: "#131320", bg3: "#191928", bg4: "#202033",
  ac:  "#7c6ff7", ac2: "#a78bfa", acd: "rgba(124,111,247,.12)", acb: "rgba(124,111,247,.28)",
  r:   "#f05252", rd:  "rgba(240,82,82,.12)",  rb: "rgba(240,82,82,.3)",
  g:   "#10c98a", gd:  "rgba(16,201,138,.1)",  gb: "rgba(16,201,138,.28)",
  am:  "#f59e0b", amd: "rgba(245,158,11,.1)",  amb: "rgba(245,158,11,.28)",
  cy:  "#0ea5e9", cyd: "rgba(14,165,233,.1)",  cyb: "rgba(14,165,233,.28)",
  ro:  "#f472b6", rod: "rgba(244,114,182,.1)", rob: "rgba(244,114,182,.28)",
  t:   "#f0f0ff", ts:  "#a0a0c8", tm: "#58586e", tb: "#2e2e48",
  b:   "rgba(255,255,255,.07)", b2: "rgba(255,255,255,.13)",
  m:   "'IBM Plex Mono', monospace",
  f:   "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
};

// ---
const SRC_GROUPS = [
  { id:"all",    label:"전체",    icon:"🌐", color:C.ac,  sources:[] },
  { id:"video",  label:"영상",    icon:"📺", color:"#ff4444",
    sources:[
      { id:"youtube_kr",  label:"유튜브 급상승",     icon:"▶", color:"#ff4444" },
      { id:"youtube_ent", label:"유튜브 엔터 급상승", icon:"▶", color:"#ff8888" },
      { id:"youtube_ch",  label:"유튜브 채널",       icon:"📺", color:"#ff6666" },
    ]
  },
  { id:"buzz",   label:"화제·이슈", icon:"🔥", color:C.ro,
    sources:[
      { id:"signal_kr",   label:"실시간 검색어(커뮤니티)", icon:"🔎", color:C.ro },
      { id:"signal_news", label:"실시간 톱기사",          icon:"📌", color:C.r  },
      { id:"news_ent",    label:"연예 뉴스",              icon:"🎬", color:"#f472b6" },
      { id:"news_viral",  label:"화제·밈 뉴스",           icon:"💥", color:"#f59e0b" },
      { id:"reddit_fun",  label:"Reddit 흥미글",          icon:"R", color:"#ff4500" },
    ]
  },
  { id:"tech",   label:"테크",    icon:"💻", color:C.cy,
    sources:[
      { id:"hackernews",  label:"HackerNews", icon:"Y", color:"#ff6600" },
      { id:"github",      label:"GitHub",     icon:"G", color:"#a78bfa" },
      { id:"producthunt", label:"ProductHunt",icon:"P", color:"#da552f" },
      { id:"reddit_tech", label:"Reddit 테크", icon:"R", color:"#ff4500" },
    ]
  },
  { id:"news",   label:"뉴스",    icon:"📰", color:C.am,
    sources:[
      { id:"naver_news", label:"네이버뉴스(키 필요)", icon:"N", color:"#03c75a" },
    ]
  },
  { id:"trends", label:"실시간 검색 트렌드",  icon:"📊", color:C.g,
    sources:[
      { id:"google_kr",     label:"Google KR", icon:"🇰🇷", color:C.g  },
      { id:"google_us",     label:"Google US", icon:"🇺🇸", color:C.cy },
      { id:"google_global", label:"글로벌",     icon:"🌍", color:C.ac },
    ]
  },
  { id:"niche",  label:"니치 바이럴 클립", icon:"🧩", color:"#38bdf8",
    sources:[
      { id:"niche_techinvent", label:"이색 테크·발명",   icon:"🔧", color:"#38bdf8" },
      { id:"niche_mystery",    label:"미스터리·미제사건", icon:"🕵️", color:"#818cf8" },
      { id:"niche_craft",      label:"해외 바이럴·장인", icon:"🛠️", color:"#fbbf24" },
      { id:"niche_psych",      label:"심리·행동실험",    icon:"🧠", color:"#f472b6" },
      { id:"niche_trivia",     label:"틈새 상식·역발상", icon:"💡", color:"#34d399" },
      { id:"niche_factcheck",  label:"팩트체크·탐사",    icon:"🔍", color:"#60a5fa" },
    ]
  },
];

// 니치 바이럴 클립 큐레이션 — 카테고리별 유튜브 검색 키워드(영어, 글로벌 소스 타게팅) +
// 리딧 서브레딧 매핑(서브레딧 이름으로 들어온 글을 어느 카테고리로 분류할지)
const NICHE_CATEGORIES = [
  { id:"niche_techinvent", label:"이색 테크·발명",
    ytQuery: "weird invention OR clever gadget OR genius invention shorts",
    subs: ["gadgets","DIY"] },
  { id:"niche_mystery", label:"미스터리·미제사건",
    ytQuery: "unsolved mystery OR mystery explained OR strange disappearance shorts",
    subs: ["UnresolvedMysteries","creepy"] },
  { id:"niche_craft", label:"해외 바이럴·장인",
    ytQuery: "satisfying craftsmanship OR amazing skill viral OR traditional craftsman shorts",
    subs: ["oddlysatisfying","educationalgifs","BeAmazed"] },
  { id:"niche_psych", label:"심리·행동실험",
    ytQuery: "psychology experiment OR social experiment reveals OR human behavior experiment shorts",
    subs: ["psychology","AskScienceDiscussion"] },
  { id:"niche_trivia", label:"틈새 상식·역발상",
    ytQuery: "mind blowing fact OR did you know fact OR counterintuitive fact shorts",
    subs: ["todayilearned","Showerthoughts","interestingasfuck"] },
  { id:"niche_factcheck", label:"팩트체크·탐사",
    ytQuery: "debunked myth OR truth behind OR investigation reveals truth shorts",
    subs: ["nottheonion","explainlikeimfive"] },
];
const SUB_TO_NICHE = {};
NICHE_CATEGORIES.forEach(c => c.subs.forEach(s => { SUB_TO_NICHE[s.toLowerCase()] = c.id; }));

// ---
const REGIONS = [
  { id:"KR", label:"🇰🇷 한국",   lang:"ko" },
  { id:"US", label:"🇺🇸 미국",   lang:"en" },
  { id:"JP", label:"🇯🇵 일본",   lang:"ja" },
  { id:"GB", label:"🇬🇧 영국",   lang:"en" },
  { id:"all",label:"🌍 전세계", lang:""   },
];

// ---
const PERIODS = [
  { id:"live", label:"실시간" },
  { id:"24h",  label:"24시간" },
  { id:"7d",   label:"7일"   },
  { id:"30d",  label:"30일"  },
  { id:"all",  label:"전체"  },
];

// ---
const CATS = [
  { id:"buzz",  e:"🔥", n:"화제·이슈",    color:"#f05252",
    keywords:["화제","이슈","논란","충격","발칵","공개","폭로","근황","깜짝","반전","급상승","실검"],
    subs:["실시간 이슈","커뮤니티 화제","논란·사건","공개·발표","밈·유머"] },
  { id:"ent",   e:"🎬", n:"엔터·연예",    color:"#f472b6",
    keywords:["브이로그","일상","예능","드라마","영화","음악","연예","아이돌","배우","가수","컴백","앨범"],
    subs:["브이로그","예능·클립","드라마·영화","음악·아이돌","유머·밈","반려동물"] },
  { id:"sport", e:"⚽", n:"스포츠·게임",  color:"#34d399",
    keywords:["스포츠","게임","운동","헬스","축구","야구","e스포츠"],
    subs:["축구","야구·농구","헬스·운동","게임","e스포츠","격투기"] },
  { id:"life",  e:"🌍", n:"여행·라이프",  color:"#60a5fa",
    keywords:["여행","맛집","뷰티","패션","라이프","요리","인테리어"],
    subs:["해외여행","국내여행","맛집","뷰티·패션","인테리어","요리"] },
  { id:"ai",    e:"🤖", n:"AI·자기계발",  color:"#a78bfa",
    keywords:["AI","ChatGPT","GPT","Claude","Gemini","인공지능","자동화","생산성","자기계발","노션"],
    subs:["AI 툴 활용","업무 자동화","직장인 꿀팁","커리어·성장","자기계발","노션·툴","프롬프트"] },
  { id:"tech",  e:"💻", n:"테크·IT",      color:"#0ea5e9",
    keywords:["기술","IT","프로그래밍","개발","앱","소프트웨어","스타트업","사이버"],
    subs:["가젯 리뷰","프로그래밍·개발","스타트업","앱·서비스","사이버보안","과학기술"] },
  { id:"money", e:"💰", n:"재테크·경제",  color:"#f59e0b",
    keywords:["투자","주식","부동산","재테크","경제","금융","ETF","코인","암호화폐"],
    subs:["주식·ETF","부동산","암호화폐","경제 뉴스","절약·재무","사업·창업"] },
  { id:"edu",   e:"📚", n:"교육·지식",    color:"#10c98a",
    keywords:["교육","학습","지식","공부","역사","과학","상식","잡학"],
    subs:["생활상식","잡학지식","역사","과학","언어 공부","독서"] },
];

// ---
const HEATS = [
  { id:"all",  label:"전체",    color:C.ts  },
  { id:"fire", label:"🔥 폭발", color:C.r   },
  { id:"rise", label:"📈 상승", color:C.am  },
  { id:"star", label:"⭐ 안정", color:C.g   },
  { id:"new",  label:"🆕 신규", color:C.cy  },
];

// ---
const ACTION_TABS = [
  { id:"list",    label:"트렌드 목록",     icon:"trend",   color:C.ac,   desc:"수집된 트렌드를 탐색하세요"    },
  { id:"analyze", label:"AI 분석",         icon:"zap",     color:C.ro,   desc:"Claude가 콘텐츠 기회를 분석"  },
  { id:"youtube", label:"유튜브 벤치마킹", icon:"youtube", icon2:"📺",   color:"#ff4444", desc:"경쟁 영상 패턴 분석" },
  { id:"cross",   label:"교차분석",        icon:"zap",     color:C.am,   desc:"AI분석 × 유튜브 최종전략"     },
  { id:"pipeline",label:"파이프라인",      icon:"pipe",    color:C.g,    desc:"콘텐츠 제작 관리"              },
  { id:"issues",  label:"이슈 후보",       icon:"globe",   color:"#38bdf8", desc:"전세계 이슈 1차 분석·제작 가능성 추적" },
  { id:"bgm",     label:"BGM 레이더",      icon:"music",   color:C.cy,   desc:"트렌드 무드에 맞는 무료 BGM 검색" },
];

// ---
const BGM_MOODS = [
  { id:"BGM_EMO",  label:"감성"    },
  { id:"BGM_INFO", label:"정보전달" },
  { id:"BGM_HOOK", label:"훅"      },
  { id:"BGM_CALM", label:"차분"    },
];

// ---
function calcScore(item) {
  let s = item.score || 50;
  if (item.source === "youtube_kr") s = Math.min(100, s + 15);
  return Math.round(s);
}
function getHeat(item) {
  const s = calcScore(item);
  if (s >= 85) return "fire";
  if (s >= 65) return "rise";
  if (s >= 45) return "star";
  return "new";
}
function getCat(item) {
  const text = (item.title + " " + (item.description||"")).toLowerCase();
  for (const cat of CATS)
    if (cat.keywords.some(k => text.includes(k.toLowerCase()))) return cat.id;
  return "other";
}
function timeAgo(t) {
  if (!t) return "";
  const d = (Date.now() - new Date(t)) / 1000;
  if (d < 3600)  return `${Math.floor(d/60)}분 전`;
  if (d < 86400) return `${Math.floor(d/3600)}시간 전`;
  return `${Math.floor(d/86400)}일 전`;
}

// ---
// SearchBox: 컴포넌트 외부 정의 - 부모 리렌더와 완전 분리
function SearchBox({keyword, setKeyword}) {
    const [val, setVal] = useState(keyword);
    const apply = () => setKeyword(val.trim());
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:9,
        background:C.bg3, border:`1px solid ${C.b}`,
        borderRadius:12, padding:"9px 12px", marginBottom:8,
      }}>
        <button onClick={apply} style={{background:"none",padding:2,flexShrink:0,cursor:"pointer"}}>
          <Ic n="search" s={14} c={val?C.ac2:C.tm}/>
        </button>
        <input
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter"&&!e.nativeEvent.isComposing){
              e.preventDefault();
              apply();
            }
          }}
          placeholder="키워드 검색... (Enter)"
          style={{background:"none",flex:1,fontSize:13,color:C.t,border:"none",outline:"none"}}
        />
        {val && (
          <button onClick={()=>{setVal("");setKeyword("");}}
            style={{background:"none",color:C.tm,padding:2,flexShrink:0}}>
            <Ic n="x" s={12} c={C.tm}/>
          </button>
        )}
      </div>
    );
  }

export default function TrendRadar() {
  //
  const sidebarRef = useRef(null);
  const srcListRef = useRef(null); // "콘텐츠 유형"(SRC_GROUPS) 자체 스크롤 영역 — 그룹이 많아지고 하위소스가 펼쳐져도 카테고리 영역을 밀어내지 않도록
  const catsListRef = useRef(null); // "카테고리"(CATS) 스크롤 영역
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fStatus, setFStatus]   = useState({});
  const [lastFetch, setLastFetch] = useState(null);

  //
  const [region, setRegion]     = useState("KR");
  const [period, setPeriod]     = useState("24h");
  const [srcGroup, setSrcGroup] = useState("all");
  const [srcDetail, setSrcDetail] = useState(null);
  const [openSrc, setOpenSrc]   = useState({});
  const [catId, setCatId]       = useState("all");
  const [openCats, setOpenCats] = useState({});
  const [heat, setHeat]         = useState("all");
  const [sortBy, setSortBy]     = useState("score");
  const [keyword, setKeyword]   = useState("");


  //
  const [actionTab, setActionTab] = useState("list");
  const [selItem, setSelItem]     = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [ytKeyword, setYtKeyword] = useState("");
  const [ytVideos, setYtVideos]   = useState([]);
  const [ytResult, setYtResult]   = useState(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [crossResult, setCrossResult] = useState(null);
  const [crossLoading, setCrossLoading] = useState(false);
  const [pipe, setPipe]           = useState([]);
  const [issues, setIssues]       = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueFilter, setIssueFilter]     = useState("all"); // all|new|reviewing|adopted|produced|dropped
  const [issueAnalyzing, setIssueAnalyzing] = useState({}); // {id:true}
  const [bgmMood, setBgmMood]         = useState("BGM_EMO");
  const [bgmKeywords, setBgmKeywords] = useState("");
  const [bgmResults, setBgmResults]   = useState([]);
  const [bgmLoading, setBgmLoading]   = useState(false);
  const [bgmStatus, setBgmStatus]     = useState("");
  const [bgmDownloading, setBgmDownloading] = useState({}); // {idx: "loading"|"done"|"error"}

  //
  const [apiKey, setApiKey]       = useState(""); // SSR과 항상 일치하도록 빈 값으로 시작, 마운트 후 useEffect에서 localStorage 값 반영 (hydration mismatch 방지)
  const [showApiModal, setShowApiModal] = useState(false);
  const [translations, setTranslations] = useState({}); // {itemId: "한글요약"}
  const [translating, setTranslating]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tr_claude_key");
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (k) => {
    setApiKey(k);
    if (typeof window !== "undefined") localStorage.setItem("tr_claude_key", k);
    setShowApiModal(false);
  };

  // ---
  const fetchAll = useCallback(async () => {
    // snapshot current region
    const currentRegion = region;
    setLoading(true);
    const all = [], st = {};

    const ytRegion = currentRegion === "all" ? "US" : currentRegion;

    await Promise.allSettled([

      // 1. YouTube trending (via API)
      fetch(`/api/youtube?type=trending&region=${ytRegion}`)
        .then(r => r.json())
        .then(d => {
          try {
            const xml = new DOMParser().parseFromString(d.xml||"","text/xml");
            const entries = Array.from(xml.querySelectorAll("entry"));
            if (!entries.length) throw new Error("YouTube RSS entries empty");
            const parsed = entries.slice(0,25).map((e,i) => {
              const linkEl = e.querySelector("link");
              const href = linkEl?.getAttribute("href") || linkEl?.textContent || "";
              return {
                id:`yt_${Date.now()}_${i}`, source:"youtube_kr",
                title: e.querySelector("title")?.textContent||"",
                url:   href,
                score: Math.max(20, 90 - i*2.5),
                time:  e.querySelector("published")?.textContent||"",
                extra: {
                  channel: e.querySelector("author name")?.textContent||"",
                  views: e.querySelector("statistics")?.getAttribute("views")||"0",
                }
              };
            });
            all.push(...parsed);
            st.youtube_kr = { ok:true, n:parsed.length };
          } catch(e) { st.youtube_kr = { ok:false, n:0, err:e.message }; }
        }).catch(e => { st.youtube_kr = { ok:false, n:0, err:e.message }; }),

      // 1b. YouTube 엔터테인먼트 카테고리 급상승 (categoryId=24)
      fetch(`/api/youtube?type=trending&region=${ytRegion}&category=24`)
        .then(r => r.json())
        .then(d => {
          try {
            const xml = new DOMParser().parseFromString(d.xml||"","text/xml");
            const entries = Array.from(xml.querySelectorAll("entry"));
            if (!entries.length) throw new Error("YouTube 엔터 RSS entries empty");
            const parsed = entries.slice(0,25).map((e,i) => {
              const linkEl = e.querySelector("link");
              const href = linkEl?.getAttribute("href") || linkEl?.textContent || "";
              return {
                id:`ytent_${Date.now()}_${i}`, source:"youtube_ent",
                title: e.querySelector("title")?.textContent||"",
                url:   href,
                score: Math.max(20, 90 - i*2.5),
                time:  e.querySelector("published")?.textContent||"",
                extra: {
                  channel: e.querySelector("author name")?.textContent||"",
                  views: e.querySelector("statistics")?.getAttribute("views")||"0",
                }
              };
            });
            all.push(...parsed);
            st.youtube_ent = { ok:true, n:parsed.length };
          } catch(e) { st.youtube_ent = { ok:false, n:0, err:e.message }; }
        }).catch(e => { st.youtube_ent = { ok:false, n:0, err:e.message }; }),

      // 2. HackerNews top stories
      fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
        .then(r => r.json())
        .then(async ids => {
          const top = (ids||[]).slice(0, 20);
          const stories = await Promise.all(
            top.map(id =>
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                .then(r=>r.json()).catch(()=>null)
            )
          );
          const parsed = stories.filter(s=>s&&s.title&&s.type==='story').map(s => ({
            id:`hn_${s.id}`, source:"hackernews",
            title: s.title,
            url:   s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            score: Math.min(100, Math.round((s.score||0)/25)),
            time:  new Date((s.time||0)*1000).toISOString(),
            extra: { points:s.score, comments:s.descendants||0 }
          }));
          all.push(...parsed);
          st.hackernews = { ok:true, n:parsed.length };
        }).catch(e => { st.hackernews = { ok:false, n:0, err:e.message }; }),

      // 3. Reddit — 테크 (server-side API)
      fetch("/api/reddit?flavor=tech")
        .then(r=>r.json())
        .then(d => {
          const posts = d?.posts||[];
          const parsed = posts.map(p => ({
            id:`rd_${p.id}`, source:"reddit_tech",
            title: p.title,
            url:   p.url,
            score: p.score,
            time:  p.time,
            extra: { upvotes:p.upvotes, comments:p.comments, sub:p.subreddit }
          }));
          all.push(...parsed);
          st.reddit_tech = { ok:true, n:parsed.length };
        }).catch(e => { st.reddit_tech = { ok:false, n:0, err:e.message }; }),

      // 3b. Reddit — 흥미/화제 (교양·기술보다 SNS에서 바로 공감되는 소재)
      fetch("/api/reddit?flavor=fun")
        .then(r=>r.json())
        .then(d => {
          const posts = d?.posts||[];
          const parsed = posts.map(p => ({
            id:`rdf_${p.id}`, source:"reddit_fun",
            title: p.title,
            url:   p.url,
            score: p.score,
            time:  p.time,
            extra: { upvotes:p.upvotes, comments:p.comments, sub:p.subreddit }
          }));
          all.push(...parsed);
          st.reddit_fun = { ok:true, n:parsed.length };
        }).catch(e => { st.reddit_fun = { ok:false, n:0, err:e.message }; }),

      // 4. GitHub trending repos
      fetch("https://api.github.com/search/repositories?q=pushed:>2025-06-01+stars:>50&sort=updated&order=desc&per_page=20", {
        headers: { "Accept": "application/vnd.github.v3+json" }
      }).then(r=>r.json())
        .then(d => {
          const repos = d?.items||[];
          const parsed = repos.map(r => ({
            id:`gh_${r.id}`, source:"github",
            title: `${r.full_name} — ${r.description||"GitHub 트렌딩"}`,
            url:   r.html_url,
            score: Math.min(100, Math.round(Math.log10((r.stargazers_count||1)+1)*25)),
            time:  r.updated_at||new Date().toISOString(),
            extra: { stars:r.stargazers_count, lang:r.language, forks:r.forks_count }
          }));
          all.push(...parsed);
          st.github = { ok:true, n:parsed.length };
        }).catch(e => { st.github = { ok:false, n:0, err:e.message }; }),

      // 5. ProductHunt RSS
      fetch("/api/producthunt")
        .then(r=>r.json())
        .then(d => {
          const items2 = d?.items||[];
          const parsed = items2
            .filter(item => item.title)
            .map((item,i) => ({
              id:`ph_${i}_${Date.now()}`, source:"producthunt",
              title: item.title,
              url:   item.url || item.link || "",
              score: Math.max(30, 80 - i*3),
              time:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              extra: { tagline: item.description||"" }
            }));
          all.push(...parsed);
          st.producthunt = { ok:true, n:parsed.length };
        }).catch(e => { st.producthunt = { ok:false, n:0, err:e.message }; }),

      // 6. 시그널(signal.bz) — 국내 커뮤니티/포털 실시간 검색어 + 톱기사 (네이버 실검 폐지 이후 대체 소스)
      fetch("/api/signal")
        .then(r=>r.json())
        .then(d => {
          const kwParsed = (d?.keywords||[]).map(k => ({
            id:`sigkw_${k.rank}_${d.fetchedAt||Date.now()}`, source:"signal_kr",
            title: k.keyword,
            url:   `https://search.naver.com/search.naver?query=${encodeURIComponent(k.keyword)}`,
            score: Math.max(20, 100 - (k.rank-1)*8),
            time:  new Date(d.fetchedAt||Date.now()).toISOString(),
            extra: { rank:k.rank, state:k.state },
          }));
          const artParsed = (d?.articles||[]).map((a,i) => ({
            id: a.id, source:"signal_news",
            title: a.title,
            url:   a.url,
            score: Math.max(20, 95 - i*5),
            time:  new Date(d.fetchedAt||Date.now()).toISOString(),
            extra: { desc:a.desc },
          }));
          all.push(...kwParsed, ...artParsed);
          st.signal_kr   = { ok:true, n:kwParsed.length };
          st.signal_news = { ok:true, n:artParsed.length };
          // 톱기사는 desc에 이미 맥락이 있어 AI 호출 없이 바로 "한 줄 설명"으로 재사용
          const preseed = {};
          artParsed.forEach(a => { if (a.extra.desc) preseed[a.title] = a.extra.desc.slice(0,70); });
          if (Object.keys(preseed).length) setTranslations(prev => ({ ...preseed, ...prev }));
        }).catch(e => { st.signal_kr = { ok:false, n:0, err:e.message }; st.signal_news = { ok:false, n:0, err:e.message }; }),

      // 7. Google 뉴스 — 연예
      fetch("/api/googlenews?topic=entertainment")
        .then(r=>r.json())
        .then(d => {
          const parsed = (d?.items||[]).map((it,i) => ({
            id:`gne_${i}_${Date.now()}`, source:"news_ent",
            title: it.title,
            url:   it.url,
            score: Math.max(25, 85 - i*3),
            time:  it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
            extra: { press: it.source },
          }));
          all.push(...parsed);
          st.news_ent = { ok:true, n:parsed.length };
        }).catch(e => { st.news_ent = { ok:false, n:0, err:e.message }; }),

      // 8. Google 뉴스 — 화제·밈·논란
      fetch("/api/googlenews?topic=viral")
        .then(r=>r.json())
        .then(d => {
          const parsed = (d?.items||[]).map((it,i) => ({
            id:`gnv_${i}_${Date.now()}`, source:"news_viral",
            title: it.title,
            url:   it.url,
            score: Math.max(25, 88 - i*3),
            time:  it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
            extra: { press: it.source },
          }));
          all.push(...parsed);
          st.news_viral = { ok:true, n:parsed.length };
        }).catch(e => { st.news_viral = { ok:false, n:0, err:e.message }; }),

      // 9. Google Trends 실시간 검색어 — KR / US / 글로벌(GB+JP 병합)
      ...["KR","US","GB,JP"].map((geo, gi) => {
        const srcId = gi===0 ? "google_kr" : gi===1 ? "google_us" : "google_global";
        return fetch(`/api/googletrends?geo=${encodeURIComponent(geo)}`)
          .then(r=>r.json())
          .then(d => {
            const parsed = (d?.items||[]).map((it,i) => ({
              id:`${srcId}_${i}_${Date.now()}`, source:srcId,
              title: it.title,
              url:   it.newsUrl || "https://trends.google.com/trending?geo=" + geo.split(",")[0],
              score: Math.max(20, 90 - i*4),
              time:  it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
              extra: { traffic: it.traffic, newsTitle: it.newsTitle },
            }));
            all.push(...parsed);
            st[srcId] = { ok:true, n:parsed.length };
          }).catch(e => { st[srcId] = { ok:false, n:0, err:e.message }; });
      }),

      // 10. 네이버 뉴스 (선택: NAVER_CLIENT_ID/SECRET 설정 시에만 데이터 채워짐)
      fetch("/api/naver?q=" + encodeURIComponent("연예 화제"))
        .then(r=>r.json())
        .then(d => {
          const parsed = (d?.items||[]).map((it,i) => ({
            id:`nv_${i}_${Date.now()}`, source:"naver_news",
            title: it.title,
            url:   it.url,
            score: Math.max(25, 80 - i*3),
            time:  it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
            extra: { desc: it.desc },
          }));
          all.push(...parsed);
          st.naver_news = d.error && !parsed.length ? { ok:false, n:0, err:d.error } : { ok:true, n:parsed.length };
        }).catch(e => { st.naver_news = { ok:false, n:0, err:e.message }; }),

      // 11. 니치 바이럴 클립 — 유튜브 쇼츠 검색, 카테고리별 (영어 키워드로 글로벌 소스 타게팅)
      // ⚠️ search.list는 quota 100단위/호출 — 6개 호출 = 새로고침 1회당 600단위 (일일 1만 기준 넉넉함)
      ...NICHE_CATEGORIES.map(cat =>
        fetch(`/api/youtube?type=search&q=${encodeURIComponent(cat.ytQuery)}&region=US&lang=en&dur=short`)
          .then(r => r.json())
          .then(d => {
            const videos = (d?.videos || []).filter(v => v.isShorts);
            const parsed = videos.map((v, i) => {
              const hrs = v.publishedAtFull ? Math.max(1, (Date.now() - new Date(v.publishedAtFull).getTime()) / 3600000) : 24;
              const velocity = Math.round(v.viewCount / hrs);
              return {
                id: `${cat.id}_yt_${v.id}_${Date.now()}_${i}`, source: cat.id,
                title: v.title, url: v.url,
                score: Math.max(20, 90 - i * 4),
                time: v.publishedAtFull || new Date().toISOString(),
                extra: { platform: "유튜브", channel: v.channel, viewCount: v.viewCount, velocity, category: cat.label },
              };
            });
            all.push(...parsed);
            st[cat.id] = { ok: true, n: (st[cat.id]?.n || 0) + parsed.length };
          }).catch(e => { st[cat.id] = { ok: false, n: 0, err: e.message }; })
      ),

      // 12. 니치 바이럴 클립 — Reddit (14개 서브레딧 한 번에 수집 후 서브레딧별로 카테고리 재분류)
      fetch("/api/reddit?flavor=niche")
        .then(r => r.json())
        .then(d => {
          const posts = d?.posts || [];
          posts.forEach((p, i) => {
            const nicheId = SUB_TO_NICHE[(p.subreddit || "").toLowerCase()];
            if (!nicheId) return; // 매핑 안 된 서브레딧은 스킵
            const hrs = Math.max(1, (Date.now() - new Date(p.time).getTime()) / 3600000);
            const velocity = Math.round((p.upvotes || 0) / hrs);
            const cat = NICHE_CATEGORIES.find(c => c.id === nicheId);
            all.push({
              id: `${nicheId}_rd_${p.id}`, source: nicheId,
              title: p.title, url: p.url,
              score: p.score,
              time: p.time,
              extra: { platform: "Reddit", upvotes: p.upvotes, comments: p.comments, sub: p.subreddit, velocity, category: cat?.label },
            });
            st[nicheId] = { ok: true, n: (st[nicheId]?.n || 0) + 1 };
          });
        }).catch(e => { NICHE_CATEGORIES.forEach(c => { if (!st[c.id]) st[c.id] = { ok:false, n:0, err:e.message }; }); }),

    ]);

    setItems(all);
    setFStatus(st);
    setLastFetch(new Date());
    setLoading(false);
  }, [region]);

  useEffect(() => { fetchAll(); }, [region]);

  // 영어 비율이 높은 제목인지 판별 (한글 거의 없으면 영어로 간주)
  const isEnglishTitle = (title) => {
    const korean = (title.match(/[\uAC00-\uD7AF]/g) || []).length;
    const alpha = (title.match(/[A-Za-z]/g) || []).length;
    return alpha > 5 && korean < 2;
  };
  // 맥락 없이는 이해하기 어려운 항목 — 외국어 제목이거나, 국내 실시간 검색어처럼
  // 짧고 단서가 없는 한글 키워드. 둘 다 "한글 요약 주석"이 필요하다.
  const CRYPTIC_SOURCES = ["signal_kr", "google_kr", "google_global"];
  const needsAnnotation = (item) => isEnglishTitle(item.title) || CRYPTIC_SOURCES.includes(item.source);

  // 번역/요약 대상 항목 일괄 처리 (items 갱신 시) — 서버에 ANTHROPIC_API_KEY가 설정돼 있으면
  // 브라우저에 키를 따로 저장하지 않아도 동작한다(apiKey는 있으면 우선 사용, 없으면 서버 키로 폴백).
  // 요약은 "제목" 기준으로 저장한다 — 항목 id는 수집할 때마다 바뀌어서 id로 저장하면 새로고침마다
  // 같은 제목을 다시 번역(비용 낭비)했음. 브라우저에도 보관해 재방문 시 재번역하지 않는다.
  const TR_CACHE_KEY = "tr_title_summaries_v1";
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(TR_CACHE_KEY) || "{}");
      if (cached && typeof cached === "object") setTranslations(prev => ({ ...cached, ...prev }));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const entries = Object.entries(translations).slice(-1500); // 오래된 것부터 버려 용량 제한
      localStorage.setItem(TR_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }, [translations]);

  useEffect(() => {
    if (items.length === 0) return;
    const seen = new Set();
    const targets = items.filter(it => {
      if (!needsAnnotation(it) || translations[it.title] || seen.has(it.title)) return false;
      seen.add(it.title);
      return true;
    });
    if (targets.length === 0) return;

    let cancelled = false;
    (async () => {
      setTranslating(true);
      // 15개씩 묶어 최대 4개 요청을 동시에 — 순차 30개 묶음은 묶음당 25~28초라 전체 3분가량 걸렸음(실측)
      const BATCH = 15, CONCURRENCY = 4;
      const chunks = [];
      for (let i = 0; i < targets.length; i += BATCH) chunks.push(targets.slice(i, i + BATCH));
      let next = 0, failed = false;
      const worker = async () => {
        while (!cancelled && !failed && next < chunks.length) {
          const ci = next++;
          const batch = chunks[ci].map((it, k) => ({ id: `t${ci}_${k}`, title: it.title, context: it.extra?.newsTitle || undefined }));
          try {
            const r = await fetch("/api/analyze", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "translate_titles", items: batch, apiKey })
            });
            const d = await r.json();
            if (!r.ok) { failed = true; return; } // 키 없음/오류면 더 보내지 않음
            const byId = Object.fromEntries(batch.map(b => [b.id, b.title]));
            const map = {};
            (d.result || []).forEach(x => { if (byId[x.id] && x.summary_ko) map[byId[x.id]] = x.summary_ko; });
            if (!cancelled) setTranslations(prev => ({ ...prev, ...map }));
          } catch { failed = true; return; }
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));
      if (!cancelled) setTranslating(false);
    })();
    return () => { cancelled = true; setTranslating(false); };
  }, [items, apiKey]);

  // ---
  // period filter
  const periodMs = {
    "live": 1  * 60 * 60 * 1000,      //
    "24h":  24 * 60 * 60 * 1000,      //
    "7d":   7  * 24 * 60 * 60 * 1000, //
    "30d":  30 * 24 * 60 * 60 * 1000, //
    "all":  null,                       //
  };

  const filtered = items.filter(item => {
    //
    if (srcDetail && item.source !== srcDetail) return false;
    if (srcGroup !== "all" && !srcDetail) {
      const grp = SRC_GROUPS.find(g=>g.id===srcGroup);
      if (grp && !grp.sources.find(s=>s.id===item.source)) return false;
    }
    //
    const ms = periodMs[period];
    // 니치 바이럴 클립은 "이미 다뤄진 소재도 재구성 재료"라 업로드 시점으로 거르지 않는다(급상승 여부는 ⚡속도로 판단)
    const isNiche = item.source.startsWith("niche_");
    if (ms && item.time && !isNiche) {
      const diff = Date.now() - new Date(item.time).getTime();
      if (diff > ms) return false;
    }
    //
    if (catId !== "all") {
      // catId가 대카테고리 id(ai, tech...)인지 서브카테고리 문자열인지 확인
      const parentCat = CATS.find(c => c.id === catId);
      if (parentCat) {
        // 대카테고리 선택 -> getCat 결과와 직접 비교
        if (getCat(item) !== catId) return false;
      } else {
        // 서브카테고리 선택 -> 해당 서브를 포함하는 대카테고리로 매칭 + 키워드 포함 검사
        const owner = CATS.find(c => c.subs.includes(catId));
        if (!owner || getCat(item) !== owner.id) return false;
      }
    }
    //
    if (heat !== "all")  { if (getHeat(item) !== heat) return false; }
    //
    if (keyword.trim()) {
      if (!item.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    }
    return true;
  }).sort((a,b) => {
    if (sortBy==="score")  return calcScore(b)-calcScore(a);
    if (sortBy==="recent") return new Date(b.time)-new Date(a.time);
    if (sortBy==="heat") {
      const o={fire:3,rise:2,star:1,new:0};
      return (o[getHeat(b)]||0)-(o[getHeat(a)]||0);
    }
    return 0;
  });

  const srcCounts = {};
  items.forEach(i => { srcCounts[i.source]=(srcCounts[i.source]||0)+1; });
  const totalFire = items.filter(i=>getHeat(i)==="fire").length;
  const totalRise = items.filter(i=>getHeat(i)==="rise").length;

  // ---
  const doAnalyze = useCallback(async (item) => {
    if (!apiKey) { setShowApiModal(true); return; }
    setSelItem(item); setAnalysis(null); setAnalysisLoading(true);
    setActionTab("analyze");
    try {
      const res = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({type:"analyze",trend:item,apiKey})
      });
      const d = await res.json();
      setAnalysis(d.result ? {...d.result,title:item.title} : {error:d.error||"분석 실패"});
      if (d.result?.videos?.[0]) setYtKeyword(d.result.videos[0].title||item.title);
      if (d.result) setPipe(p => p.map(x => x.id===item.id ? {...x, aiDone:true} : x));
    } catch(e) { setAnalysis({error:e.message}); }
    setAnalysisLoading(false);
  }, [apiKey]);

  const doYoutubeBench = useCallback(async (keywordOverride) => {
    if (!apiKey) { setShowApiModal(true); return; }
    const kw = (keywordOverride || ytKeyword || "").trim();
    if (!kw) return;
    setYtLoading(true); setYtResult(null); setActionTab("youtube");
    try {
      // 1. YouTube Data API로 실제 영상 검색
      const ytRegionNow = region === "all" ? "US" : region;
      const searchRes = await fetch(
        `/api/youtube?type=search&q=${encodeURIComponent(kw)}&region=${ytRegionNow}`
      );
      const searchData = await searchRes.json();
      const videos = searchData.videos || [];

      // 2. Claude로 패턴 분석
      const res = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type:"youtube_benchmark",
          keyword:kw,
          videos: videos.slice(0,10).map(v=>({
            title:v.title,
            channel:v.channel,
            views:v.views,
            uploadDate:v.publishedAt,
          })),
          apiKey
        })
      });
      const d = await res.json();
      setYtResult(d.result
        ? {...d.result, keyword:kw, videos}
        : {error:d.error, videos}
      );
      if (d.result && selItem) setPipe(p => p.map(x => x.id===selItem.id ? {...x, ytDone:true} : x));
    } catch(e) { setYtResult({error:e.message}); }
    setYtLoading(false);
  }, [apiKey, ytKeyword, region, selItem]);

  const doCross = useCallback(async () => {
    if (!apiKey || !analysis || !ytResult) return;
    setCrossLoading(true); setCrossResult(null); setActionTab("cross");
    try {
      const res = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({type:"cross_analysis",trendAnalysis:analysis,ytAnalysis:ytResult,apiKey})
      });
      const d = await res.json();
      setCrossResult(d.result||{error:d.error});
      if (d.result && selItem) setPipe(p => p.map(x => x.id===selItem.id ? {...x, crossDone:true} : x));
    } catch(e) { setCrossResult({error:e.message}); }
    setCrossLoading(false);
  }, [apiKey, analysis, ytResult, selItem]);

  // BGM 레이더 — yeori-studio 프록시(localhost:3001)의 Chosic 검색/다운로드 엔드포인트 호출
  const doBgmSearch = useCallback(async () => {
    setBgmLoading(true); setBgmStatus("검색 중..."); setBgmResults([]);
    try {
      const res = await fetch("http://localhost:3001/api/bgm-search", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          mood: bgmMood,
          keywords: bgmKeywords.split(",").map(s=>s.trim()).filter(Boolean),
          source: "chosic",
        })
      });
      const d = await res.json();
      if (d.error) {
        setBgmStatus(`❌ ${d.error}`);
      } else {
        setBgmResults(d.results || []);
        setBgmStatus(d.message || `${(d.results||[]).length}건 검색됨`);
      }
    } catch(e) {
      setBgmStatus(`❌ 검색 실패: ${e.message} (yeori-studio 프록시 서버가 켜져 있는지 확인하세요)`);
    }
    setBgmLoading(false);
  }, [bgmMood, bgmKeywords]);

  const doBgmDownload = useCallback(async (item, idx) => {
    setBgmDownloading(s => ({...s, [idx]:"loading"}));
    try {
      const filename = (item.title||"bgm").replace(/[\\/:*?"<>|]/g,"").trim() + ".mp3";
      const res = await fetch("http://localhost:3001/api/bgm-download", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ url: item.downloadUrl||item.url, mood: bgmMood, filename })
      });
      const d = await res.json();
      setBgmDownloading(s => ({...s, [idx]: d.success ? "done" : "error"}));
    } catch {
      setBgmDownloading(s => ({...s, [idx]:"error"}));
    }
  }, [bgmMood]);

  const addToPipe = useCallback((item) => {
    setPipe(p => {
      if (p.find(x=>x.id===item.id)) return p;
      return [...p, {
        id:item.id, trend:item.title, source:item.source,
        stage:"발굴됨", score:calcScore(item),
        added:new Date().toLocaleString("ko-KR"),
        origItem:item, aiDone:false, ytDone:false, crossDone:false, sentToPool:false,
      }];
    });
    setActionTab("pipeline");
  }, []);

  // ─── 이슈 후보 파이프라인 (후보풀 대체 — 1차 분석 + 상태 추적) ───
  const loadIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const res = await fetch("/api/issues");
      const d = await res.json();
      setIssues(d.items || []);
    } catch {}
    setIssuesLoading(false);
  }, []);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const addToIssuePool = useCallback(async (item) => {
    try {
      const res = await fetch("/api/issues", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title, url: item.url || "", source: item.source,
          country: item.extra?.country || "",
          extra: item.extra || {},
        })
      });
      const d = await res.json();
      if (d.item) {
        setIssues(prev => {
          const exists = prev.find(x => x.id === d.item.id);
          return exists ? prev.map(x => x.id===d.item.id ? d.item : x) : [d.item, ...prev];
        });
      }
      setActionTab("issues");
    } catch {}
  }, []);

  const updateIssueStatus = useCallback(async (id, status) => {
    setIssues(prev => prev.map(x => x.id===id ? { ...x, status } : x));
    try {
      await fetch("/api/issues", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch {}
  }, []);

  const assessIssue = useCallback(async (issueItem) => {
    setIssueAnalyzing(s => ({ ...s, [issueItem.id]: true }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assess_clip",
          issue: {
            title: issueItem.title, source: issueItem.source, url: issueItem.url,
            category: issueItem.extra?.category || "",
          },
          apiKey,
        })
      });
      const d = await res.json();
      if (d.result) {
        const analysis = { ...d.result, analyzedAt: new Date().toISOString() };
        const nextStatus = issueItem.status === "new" ? "reviewing" : issueItem.status;
        setIssues(prev => prev.map(x => x.id===issueItem.id ? { ...x, analysis, status: nextStatus } : x));
        fetch("/api/issues", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: issueItem.id, analysis, status: nextStatus })
        }).catch(() => {});
      }
    } catch {}
    setIssueAnalyzing(s => { const n = { ...s }; delete n[issueItem.id]; return n; });
  }, [apiKey]);

  // 파이프라인 카드의 "후보풀로 전송" 버튼 -- yeori-studio proxy.js를 거쳐
  // content_matrix_v3.html 사이드바의 "🔥 트렌드 분석" 목록에 전달한다.
  // (TREND RADAR와 content_matrix_v3.html은 origin이 달라 localStorage 직접
  // 공유가 안 되므로, 서버 저장을 거치는 게 유일한 방법)
  const sendToCandidatePool = useCallback(async (pipeItem) => {
    const isCurrent = selItem?.id === pipeItem.id;
    const topic = (isCurrent && analysis?.summary_ko) || crossResult?.why_win || "";
    try {
      const res = await fetch("http://localhost:3001/api/trend-to-candidate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          id: pipeItem.id, title: pipeItem.trend, source: pipeItem.source, score: pipeItem.score,
          keyword: pipeItem.origItem?.title || pipeItem.trend, topic,
          steps: { ai: pipeItem.aiDone, youtube: pipeItem.ytDone, cross: pipeItem.crossDone },
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "전송 실패");
      setPipe(p => p.map(x => x.id===pipeItem.id ? {...x, sentToPool:true} : x));
    } catch (e) {
      alert("후보풀 전송 실패: " + e.message + "\n(yeori-studio proxy.js가 localhost:3001에서 실행 중인지 확인해주세요)");
    }
  }, [selItem, analysis, crossResult]);

  // ─── CSS ─────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes dot{0%,100%{box-shadow:0 0 0 0 rgba(16,201,138,.5)}50%{box-shadow:0 0 0 5px transparent}}
    *{box-sizing:border-box;margin:0;scrollbar-width:thin;scrollbar-color:${C.tb} transparent}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:${C.tb};border-radius:4px}
    body{background:${C.bg};color:${C.t};font-family:${C.f};-webkit-font-smoothing:antialiased}
    input,button{font-family:${C.f};border:none;outline:none}
    button{cursor:pointer;transition:all .15s}

    /* sidebar item */
    .sbi{display:flex;align-items:center;gap:11px;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:600;color:${C.ts};cursor:pointer;transition:all .15s;position:relative;user-select:none;border:1px solid ${C.b};background:${C.bg2};width:100%;text-align:left;margin-bottom:3px}
    .sbi:hover{background:${C.bg3};border-color:${C.b2};color:${C.t}}
    .sbi.on{font-weight:700;border-color:transparent}
    .sbi.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:22px;border-radius:0 3px 3px 0}

    /* source sub item */
    .src-sub{display:flex;align-items:center;gap:9px;padding:9px 12px 9px 32px;border-radius:9px;font-size:13px;font-weight:500;color:${C.tm};cursor:pointer;transition:all .2s;border:1px solid transparent;margin-bottom:3px}
    .src-sub:hover{background:rgba(167,139,250,.12);border-color:rgba(167,139,250,.3);color:#ffffff;font-weight:700}
    .src-sub.on{font-weight:700;background:${C.bg3};border-color:${C.b};color:${C.ts}}

    /* category */
    .cat-main{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:600;color:${C.ts};cursor:pointer;transition:all .15s;user-select:none;border:1px solid ${C.b};background:${C.bg2};margin-bottom:3px}
    .cat-main:hover{background:${C.bg3};border-color:${C.b2};color:${C.t}}
    .cat-main.on{font-weight:700;border-color:transparent}
    .cat-sub{padding:9px 12px 9px 40px;border-radius:9px;font-size:13px;color:${C.tm};cursor:pointer;transition:all .2s;border:1px solid transparent;margin-bottom:3px}
    .cat-sub:hover{background:rgba(167,139,250,.12);border-color:rgba(167,139,250,.3);color:#ffffff;font-weight:700}
    .cat-sub.on{font-weight:700;color:${C.t}}

    /* pill button */
    .pill{padding:7px 14px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid ${C.b};background:${C.bg2};color:${C.tm};cursor:pointer;transition:all .15s;white-space:nowrap}
    .pill:hover{background:${C.bg3};border-color:${C.b2};color:${C.ts}}
    .pill.on{border-color:transparent}

    /* section label */
    .sec-lbl{font-size:10px;font-weight:800;letter-spacing:.12em;color:${C.tm};padding:0 4px;margin:16px 0 8px;display:flex;align-items:center;gap:8px}
    .sec-lbl:first-child{margin-top:4px}
    .sec-lbl-bar{flex:1;height:1px;background:${C.b}}

    /* trend card */
    .tc{background:${C.bg2};border:1px solid ${C.b};border-left:3px solid transparent;border-radius:14px;padding:16px 18px;cursor:pointer;transition:all .18s;animation:fadeUp .25s ease both}
    .tc:hover{background:${C.bg3};border-color:${C.b2};transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.45)}

    /* action card */
    .act-card{border-radius:16px;padding:20px 22px;cursor:pointer;transition:all .18s;border:2px solid transparent;flex:1;min-width:0}
    .act-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.4)}
    .act-card.on{transform:translateY(-2px)}

    /* skeleton */
    .skel{border-radius:10px;background:linear-gradient(90deg,${C.bg2} 25%,${C.bg3} 50%,${C.bg2} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
  `;

  // ---

  const Sidebar = () => (
    <aside ref={sidebarRef} style={{
      width:320, flexShrink:0,
      borderRight:`1px solid ${C.b}`,
      background:C.bg1,
      position:"sticky", top:56,
      height:"calc(100vh - 56px)",
      overflowY:"hidden",
      display:"flex", flexDirection:"column",
      padding:0,
    }}>
    {/* fixed top - region, period, source */}
    <div style={{flexShrink:0, padding:"14px 12px 0"}}>

      
      <SearchBox keyword={keyword} setKeyword={setKeyword}/>

      
      <div className="sec-lbl">📍 지역<div className="sec-lbl-bar"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"0 2px",marginBottom:4}}>
        {REGIONS.map(r=>(
          <button key={r.id} className={`pill${region===r.id?" on":""}`}
            onClick={()=>setRegion(r.id)}
            style={region===r.id?{background:C.acd,borderColor:C.acb,color:C.ac2}:{}}>
            {r.label}
          </button>
        ))}
      </div>

      
      <div className="sec-lbl">📅 기간<div className="sec-lbl-bar"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,padding:"0 2px",marginBottom:4}}>
        {PERIODS.map(p=>(
          <button key={p.id} className={`pill${period===p.id?" on":""}`}
            onClick={()=>setPeriod(p.id)}
            style={period===p.id?{background:C.acd,borderColor:C.acb,color:C.ac2}:{}}>
            {p.label}
          </button>
        ))}
      </div>

      
      <div className="sec-lbl">📺 콘텐츠 유형<div className="sec-lbl-bar"/></div>
      <div ref={srcListRef} style={{maxHeight:260, overflowY:"auto", paddingRight:3, marginBottom:4}}>
      {SRC_GROUPS.map(grp=>{
        const n = grp.id==="all"
          ? items.length
          : grp.sources.reduce((s,src)=>s+(srcCounts[src.id]||0),0);
        const isOn = srcGroup===grp.id && !srcDetail;
        const isOpen = openSrc[grp.id];
        return (
          <div key={grp.id}>
            <button className={`sbi${isOn?" on":""}`}
              onClick={()=>{
                setSrcGroup(grp.id); setSrcDetail(null);
                if (grp.sources.length) {
                  const isOpen = openSrc[grp.id];
                  const list = srcListRef.current;
                  const savedScroll = list ? list.scrollTop : 0;
                  setOpenSrc({[grp.id]: !isOpen});
                  setTimeout(()=>{ if(list) list.scrollTop = savedScroll; }, 0);
                }
              }}
              style={{
                color: isOn ? grp.color : C.ts,
                background: isOn ? `${grp.color}18` : C.bg2,
                borderColor: isOn ? grp.color+"40" : C.b,
              }}
            >
              {isOn && <div style={{
                position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",
                width:2,height:20,background:grp.color,borderRadius:"0 3px 3px 0"
              }}/>}
              <span style={{fontSize:16}}>{grp.icon}</span>
              <span style={{flex:1}}>{grp.label}</span>
              <span style={{
                fontSize:9,fontFamily:C.m,padding:"2px 7px",borderRadius:20,
                background:isOn?`${grp.color}20`:"rgba(255,255,255,.07)",
                color:isOn?grp.color:C.tm,
              }}>{n}</span>
              {grp.sources.length>0 && (
                <span style={{
                  fontSize:9,color:C.tm,transition:"transform .2s",
                  display:"inline-block",
                  transform:isOpen?"rotate(0deg)":"rotate(-90deg)"
                }}>▼</span>
              )}
            </button>
            {isOpen && grp.sources.map(src=>{
              const sn = srcCounts[src.id]||0;
              const isSubOn = srcDetail===src.id;
              return (
                <div key={src.id}
                  className={`src-sub${isSubOn?" on":""}`}
                  onClick={()=>setSrcDetail(isSubOn?null:src.id)}
                  style={{color:isSubOn?src.color:C.tm}}
                >
                  <span style={{fontSize:11,fontFamily:C.m,fontWeight:800,color:src.color,width:16,textAlign:"center",flexShrink:0}}>{src.icon}</span>
                  <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{src.label}</span>
                  <span style={{
                    fontSize:9,fontFamily:C.m,padding:"1px 6px",borderRadius:20,
                    background:isSubOn?`${src.color}20`:"rgba(255,255,255,.07)",
                    color:isSubOn?src.color:C.tm,
                  }}>{sn}</span>
                </div>
              );
            })}
          </div>
        );
      })}
      </div>

    </div>{/* /fixed top */}

    {/* scrollable - category, heat, sort */}
    <div ref={catsListRef} style={{flex:1, overflowY:"auto", padding:"0 12px 24px"}}>
      
      <div className="sec-lbl">📁 카테고리<div className="sec-lbl-bar"/></div>
      
      <div className={`cat-main${catId==="all"?" on":""}`}
        onClick={()=>{setCatId("all");setOpenCats({});}}
        style={{color:catId==="all"?C.ac2:C.ts, background:catId==="all"?C.acd:C.bg2, borderColor:catId==="all"?C.acb:C.b}}>
        <span style={{fontSize:16}}>🌐</span>
        <span style={{flex:1}}>전체</span>
        <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>{items.length}</span>
      </div>
      {CATS.map(cat=>{
        const isOn = catId===cat.id;
        const isOpen = openCats[cat.id];
        const n = items.filter(i=>getCat(i)===cat.id).length;
        return (
          <div key={cat.id}>
            <div className={`cat-main${isOn?" on":""}`}
              onClick={()=>{
                const isCurrentlyOpen = openCats[cat.id];
                // 스크롤 고정: 카테고리 스크롤 영역 기준(ref로 직접 지정 — querySelector는 콘텐츠 유형 쪽 스크롤 영역과 혼동될 수 있음)
                const scrollable = catsListRef.current;
                const savedScroll = scrollable ? scrollable.scrollTop : 0;
                setOpenCats({[cat.id]: !isCurrentlyOpen});
                setCatId(cat.id);
                setTimeout(()=>{ if(scrollable) scrollable.scrollTop = savedScroll; }, 0);
              }}
              style={{color:isOn?cat.color:C.ts, background:isOn?`${cat.color}12`:undefined}}
            >
              <span style={{fontSize:15}}>{cat.e}</span>
              <span style={{flex:1,fontSize:12}}>{cat.n}</span>
              <span style={{fontSize:9,fontFamily:C.m,color:C.tm,marginRight:2}}>{n}</span>
              <span style={{
                fontSize:9,color:C.tm,transition:"transform .2s",display:"inline-block",
                transform:isOpen?"rotate(0deg)":"rotate(-90deg)"
              }}>▼</span>
            </div>
            {isOpen && cat.subs.map(sub=>(
              <div key={sub}
                className={`cat-sub${catId===sub?" on":""}`}
                onClick={e=>{e.stopPropagation();setCatId(sub);}}
                style={{color:catId===sub?cat.color:C.tm}}
              >{sub}</div>
            ))}
          </div>
        );
      })}

      
      <div className="sec-lbl">🔥 열기<div className="sec-lbl-bar"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"0 2px"}}>
        {HEATS.map(h=>(
          <button key={h.id} className={`pill${heat===h.id?" on":""}`}
            onClick={()=>setHeat(h.id)}
            style={heat===h.id?{background:`${h.color}15`,borderColor:`${h.color}35`,color:h.color}:{}}>
            {h.label}
          </button>
        ))}
      </div>

      
      <div className="sec-lbl">📊 정렬<div className="sec-lbl-bar"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,padding:"0 2px"}}>
        {[{id:"score",l:"트렌드점수"},{id:"recent",l:"최신순"},{id:"heat",l:"열기순"}].map(s=>(
          <button key={s.id} className={`pill${sortBy===s.id?" on":""}`}
            onClick={()=>setSortBy(s.id)}
            style={sortBy===s.id?{background:C.acd,borderColor:C.acb,color:C.ac2}:{}}>
            {s.l}
          </button>
        ))}
      </div>

    </div>{/* /scrollable area */}
    </aside>
  );


  // ---
  const ActionBar = () => (
    <div style={{
      display:"flex",gap:10,padding:"18px 22px 14px",
      borderBottom:`1px solid ${C.b}`,
      background:C.bg1,
    }}>
      {ACTION_TABS.map(at=>{
        const isOn = actionTab===at.id;
        const badges = {
          list:    filtered.length,
          analyze: analysis?1:null,
          youtube: ytResult?1:null,
          cross:   crossResult?1:null,
          pipeline:pipe.length||null,
          bgm:     bgmResults.length||null,
        };
        const badge = badges[at.id];
        return (
          <div key={at.id} className={`act-card${isOn?" on":""}`}
            onClick={()=>setActionTab(at.id)}
            style={{
              background: isOn ? `${at.color}15` : C.bg2,
              border: `2px solid ${isOn ? at.color+"50" : C.b}`,
              boxShadow: isOn ? `0 0 24px ${at.color}20` : "none",
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{
                width:36,height:36,borderRadius:10,
                background: isOn ? `${at.color}20` : C.bg3,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,
              }}>
                <Ic n={at.icon} s={16} c={isOn?at.color:C.tm}/>
              </div>
              {badge!=null && (
                <span style={{
                  fontSize:9,fontFamily:C.m,fontWeight:800,
                  padding:"2px 7px",borderRadius:20,
                  background:`${at.color}20`,color:at.color,
                  border:`1px solid ${at.color}30`,
                  marginLeft:"auto",
                }}>{badge}</span>
              )}
            </div>
            <div style={{
              fontSize:12,fontWeight:700,
              color:isOn?at.color:C.ts,
              marginBottom:3,lineHeight:1.3,
            }}>{at.label}</div>
            <div style={{
              fontSize:10,color:C.tm,lineHeight:1.4,
            }}>{at.desc}</div>
          </div>
        );
      })}
    </div>
  );

  // ---
  const ListPanel = () => {
    const heatStyle = {
      fire:{color:C.r,  bg:C.rd,  border:C.rb,  label:"🔥 폭발"},
      rise:{color:C.am, bg:C.amd, border:C.amb, label:"📈 상승"},
      star:{color:C.g,  bg:C.gd,  border:C.gb,  label:"⭐ 안정"},
      new: {color:C.cy, bg:C.cyd, border:C.cyb, label:"🆕 신규"},
    };
    return (
      <div style={{padding:"16px 22px",display:"flex",flexDirection:"column",gap:9}}>
        
        <div style={{
          display:"flex",alignItems:"center",gap:8,
          padding:"10px 14px",
          background:C.bg2,border:`1px solid ${C.b}`,
          borderRadius:12,marginBottom:4,flexWrap:"wrap",
        }}>
          <span style={{fontSize:13,fontWeight:700,color:C.t}}>검색결과</span>
          {srcGroup!=="all"&&<span style={{
            fontSize:11,padding:"2px 9px",borderRadius:20,
            background:`${SRC_GROUPS.find(g=>g.id===srcGroup)?.color}15`,
            color:SRC_GROUPS.find(g=>g.id===srcGroup)?.color,
          }}>{SRC_GROUPS.find(g=>g.id===srcGroup)?.icon} {SRC_GROUPS.find(g=>g.id===srcGroup)?.label}</span>}
          {catId!=="all"&&<span style={{
            fontSize:11,padding:"2px 9px",borderRadius:20,
            background:C.acd,color:C.ac2,
          }}>{CATS.find(c=>c.id===catId)?.e} {CATS.find(c=>c.id===catId)?.n||catId}</span>}
          {heat!=="all"&&<span style={{
            fontSize:11,padding:"2px 9px",borderRadius:20,
            background:heatStyle[heat]?.bg,color:heatStyle[heat]?.color,
          }}>{heatStyle[heat]?.label}</span>}
          <span style={{marginLeft:"auto",fontSize:12,fontFamily:C.m,fontWeight:800,color:C.ac}}>
            {filtered.length}개
          </span>
        </div>

        
        {loading && filtered.length===0 && [1,2,3,4,5].map(i=>(
          <div key={i} className="skel" style={{height:150}}/>
        ))}

        
        {!loading && filtered.length===0 && (
          <div style={{textAlign:"center",padding:"70px 20px"}}>
            <div style={{fontSize:48,marginBottom:14,opacity:.35}}>📡</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>
              {items.length===0?"데이터 수집 중...":"조건에 맞는 트렌드가 없어요"}
            </div>
            <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
              {items.length===0?"소스에서 트렌드를 가져오는 중이에요":"필터 조건을 바꿔서 탐색해보세요"}
            </div>
          </div>
        )}

        
        {filtered.map((item,idx)=>{
          const score = calcScore(item);
          const h = getHeat(item);
          const hs = heatStyle[h];
          const srcInfo = SRC_GROUPS.flatMap(g=>g.sources).find(s=>s.id===item.source)
            || {color:C.tm,icon:"·",label:item.source};

          return (
            <div key={item.id} className="tc"
              onClick={()=>window.open(item.url,"_blank")}
              style={{borderLeftColor:hs.color,animationDelay:`${idx*.035}s`}}
            >
              
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,flexWrap:"wrap"}}>
                <span style={{
                  fontSize:10,fontFamily:C.m,fontWeight:800,
                  padding:"2px 8px",borderRadius:20,
                  background:`${srcInfo.color}15`,color:srcInfo.color,
                  border:`1px solid ${srcInfo.color}25`,
                }}>{srcInfo.icon} {srcInfo.label}</span>
                <span style={{
                  fontSize:10,fontFamily:C.m,fontWeight:700,
                  padding:"2px 8px",borderRadius:20,
                  background:hs.bg,color:hs.color,border:`1px solid ${hs.border}`,
                }}>{hs.label}</span>
                <span style={{marginLeft:"auto",fontSize:10,fontFamily:C.m,color:C.tm}}>
                  {timeAgo(item.time)}
                </span>
              </div>

              
              <div style={{
                fontSize:15,fontWeight:700,lineHeight:1.55,
                color:C.t,marginBottom:translations[item.title]?4:12,letterSpacing:"-.02em",
              }}>{item.title}</div>

              {translations[item.title] && (
                <div style={{
                  fontSize:12.5,fontWeight:500,lineHeight:1.5,
                  color:C.ac2,marginBottom:12,
                  display:"flex",alignItems:"flex-start",gap:5,
                }}>
                  <span style={{flexShrink:0,opacity:.7}}>💬</span>
                  <span>{translations[item.title]}</span>
                </div>
              )}
              {!translations[item.title] && translating && needsAnnotation(item) && (
                <div style={{
                  fontSize:11,color:C.tm,marginBottom:12,
                  display:"flex",alignItems:"center",gap:5,
                }}>
                  <span className="skel" style={{display:"inline-block",width:80,height:11,borderRadius:4}}/>
                  <span>한글 요약 생성 중...</span>
                </div>
              )}

              
              <div style={{marginBottom:12}}>
                <div style={{
                  height:3,borderRadius:3,
                  background:"rgba(255,255,255,.06)",overflow:"hidden",marginBottom:5,
                }}>
                  <div style={{
                    height:"100%",borderRadius:3,width:`${score}%`,
                    background:`linear-gradient(90deg,${hs.color},${hs.color}70)`,
                    transition:"width .6s ease",
                  }}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>트렌드 점수</span>
                  <span style={{fontSize:11,fontFamily:C.m,fontWeight:800,color:hs.color}}>{score}</span>
                </div>
              </div>

              
              <div style={{display:"flex",gap:6}}>
                {[
                  {l:"🤖 AI분석",    fn:e=>{e.stopPropagation();doAnalyze(item);},
                   bg:C.acd, bc:C.acb, tc:C.ac2},
                  {l:"📺 벤치마킹",  fn:e=>{e.stopPropagation();setYtKeyword(item.title);setActionTab("youtube");},
                   bg:"rgba(255,68,68,.1)", bc:"rgba(255,68,68,.25)", tc:"#ff8080"},
                  {l:"📋 파이프라인",fn:e=>{e.stopPropagation();addToPipe(item);},
                   bg:C.gd, bc:C.gb, tc:C.g},
                  {l:"🎬 클립후보",  fn:e=>{e.stopPropagation();addToIssuePool(item);},
                   bg:"rgba(56,189,248,.1)", bc:"rgba(56,189,248,.3)", tc:"#38bdf8"},
                ].map(btn=>(
                  <button key={btn.l} onClick={btn.fn}
                    style={{
                      flex:1,padding:"7px 4px",borderRadius:9,
                      background:btn.bg,border:`1px solid ${btn.bc}`,
                      color:btn.tc,fontSize:11,fontWeight:700,
                    }}
                  >{btn.l}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---
  const AnalyzePanel = () => (
    <div style={{padding:"22px"}}>
      {!selItem && !analysisLoading && (
        <div style={{textAlign:"center",padding:"70px 20px"}}>
          <div style={{fontSize:48,marginBottom:14,opacity:.35}}>🤖</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>AI 분석 준비</div>
          <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
            트렌드 목록에서 카드의<br/>
            <strong style={{color:C.ac2}}>🤖 AI분석</strong> 버튼을 누르면<br/>
            Claude가 콘텐츠 기회를 분석해드려요
          </div>
        </div>
      )}

      {(analysisLoading || selItem) && (
        <div>
          {selItem && (
            <div style={{
              background:C.bg2,border:`1px solid ${C.b}`,
              borderRadius:14,padding:"14px 18px",marginBottom:16,
            }}>
              <div style={{fontSize:11,color:C.tm,marginBottom:5,fontFamily:C.m}}>분석 대상</div>
              <div style={{fontSize:14,fontWeight:700,color:C.t,lineHeight:1.5}}>{selItem.title}</div>
            </div>
          )}

          {analysisLoading ? (
            <div style={{
              display:"flex",alignItems:"center",gap:14,
              padding:"24px 20px",background:C.bg2,
              border:`1px solid ${C.acb}`,borderRadius:14,
            }}>
              <div style={{
                width:22,height:22,border:`2px solid ${C.b}`,
                borderTopColor:C.ac,borderRadius:"50%",
                animation:"spin .7s linear infinite",flexShrink:0,
              }}/>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:3}}>Claude 분석 중...</div>
                <div style={{fontSize:11,color:C.tm}}>콘텐츠 기회를 파악하고 있어요</div>
              </div>
            </div>
          ) : analysis?.error ? (
            <div style={{
              padding:"16px 18px",background:C.rd,border:`1px solid ${C.rb}`,
              borderRadius:12,color:C.r,fontSize:13,
            }}>{analysis.error}</div>
          ) : analysis ? (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {l:"기회점수",   v:`${analysis.opportunity}/10`, c:C.ac},
                  {l:"경쟁강도",   v:analysis.competition, c:analysis.competition==="높음"?C.r:analysis.competition==="중간"?C.am:C.g},
                  {l:"긴급성",     v:analysis.urgency, c:analysis.urgency?.includes("긴급")?C.r:C.am},
                ].map(s=>(
                  <div key={s.l} style={{
                    background:C.bg2,border:`1px solid ${C.b}`,
                    borderRadius:12,padding:"14px 16px",
                  }}>
                    <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:6}}>{s.l}</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:C.m,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              
              {analysis.summary_ko && (
                <div style={{
                  background:C.bg2,border:`1px solid ${C.b}`,
                  borderRadius:12,padding:"14px 18px",
                }}>
                  <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:8}}>요약</div>
                  <div style={{fontSize:13,color:C.ts,lineHeight:1.75}}>{analysis.summary_ko}</div>
                </div>
              )}
              
              {analysis.angle && (
                <div style={{
                  background:C.acd,border:`1px solid ${C.acb}`,
                  borderRadius:12,padding:"14px 18px",
                }}>
                  <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:6}}>🎯 내 채널 각도</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.ac2}}>{analysis.angle}</div>
                </div>
              )}
              
              {analysis.videos?.length>0 && (
                <div style={{background:C.bg2,border:`1px solid ${C.b}`,borderRadius:12,padding:"14px 18px"}}>
                  <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:10}}>추천 영상 아이디어</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {analysis.videos.map((v,i)=>(
                      <div key={i} style={{
                        display:"flex",gap:10,alignItems:"center",
                        background:C.bg3,borderRadius:10,padding:"10px 12px",
                      }}>
                        <span style={{
                          fontSize:9,fontFamily:C.m,fontWeight:700,
                          padding:"2px 8px",borderRadius:12,
                          background:C.acd,color:C.ac2,flexShrink:0,
                        }}>{v.format}</span>
                        <span style={{fontSize:13,color:C.t,flex:1,lineHeight:1.4}}>{v.title}</span>
                        <span style={{fontSize:10,fontFamily:C.m,color:C.g,flexShrink:0}}>{v.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setActionTab("youtube");}}
                  style={{
                    flex:1,padding:"12px",borderRadius:12,
                    background:"rgba(255,68,68,.12)",border:"1px solid rgba(255,68,68,.3)",
                    color:"#ff8080",fontSize:13,fontWeight:700,
                  }}>📺 유튜브 벤치마킹 →</button>
                <button onClick={()=>addToPipe(selItem)}
                  style={{
                    padding:"12px 18px",borderRadius:12,
                    background:C.gd,border:`1px solid ${C.gb}`,
                    color:C.g,fontSize:13,fontWeight:700,
                  }}>📋 파이프라인 추가</button>
              </div>
            </div>
          ):null}
        </div>
      )}
    </div>
  );

  // ---
  const YoutubePanel = () => (
    <div style={{padding:"22px",display:"flex",flexDirection:"column",gap:14}}>

      {/* 키워드 입력 */}
      <div style={{
        background:C.bg2,border:`1px solid ${C.b}`,
        borderRadius:14,padding:"18px 20px",
      }}>
        <div style={{fontSize:11,fontFamily:C.m,color:C.tm,marginBottom:10}}>
          유튜브 벤치마킹 — 키워드로 경쟁 영상 분석
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            value={ytKeyword} onChange={e=>setYtKeyword(e.target.value)}
            
            placeholder="분석할 키워드 입력... (예: ChatGPT 엑셀)"
            style={{
              flex:1,background:C.bg3,border:`1px solid ${C.b}`,
              borderRadius:10,padding:"10px 14px",
              color:C.t,fontSize:14,
            }}
          />
          <button onClick={()=>doYoutubeBench()} disabled={ytLoading||!ytKeyword.trim()}
            style={{
              padding:"10px 22px",borderRadius:10,
              background:"linear-gradient(135deg,#ff4444,#ff6666)",
              color:"#fff",fontSize:13,fontWeight:700,
              opacity:ytLoading||!ytKeyword.trim()?.5:1,whiteSpace:"nowrap",
            }}>
            {ytLoading?"분석중...":"🔴 검색"}
          </button>
        </div>
        {analysis && (
          <div style={{
            marginTop:10,fontSize:11,color:C.tm,
            display:"flex",alignItems:"center",gap:6,
          }}>
            <Ic n="check" s={11} c={C.g}/>
            AI분석 키워드 자동 설정 — 수정 후 검색 가능
          </div>
        )}
      </div>

      {/* 로딩 */}
      {ytLoading && (
        <div style={{
          display:"flex",alignItems:"center",gap:14,
          padding:"24px 20px",background:C.bg2,
          border:"1px solid rgba(255,68,68,.25)",borderRadius:14,
        }}>
          <div style={{
            width:22,height:22,border:`2px solid ${C.b}`,
            borderTopColor:"#ff4444",borderRadius:"50%",
            animation:"spin .7s linear infinite",flexShrink:0,
          }}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:3}}>
              "{ytKeyword}" 경쟁 영상 분석 중...
            </div>
            <div style={{fontSize:11,color:C.tm}}>
              YouTube 검색 + Claude 패턴 분석
            </div>
          </div>
        </div>
      )}

      {/* 에러 */}
      {ytResult?.error && (
        <div style={{padding:"16px 18px",background:C.rd,border:`1px solid ${C.rb}`,borderRadius:12,color:C.r,fontSize:13}}>
          {ytResult.error}
        </div>
      )}

      {/* 결과 */}
      {ytResult && !ytResult.error && (
        <div style={{display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .3s ease"}}>

          {/* 검색된 영상 카드들 */}
          {ytResult.videos?.length>0 && (
            <div style={{background:C.bg2,border:`1px solid ${C.b}`,borderRadius:14,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontFamily:C.m,color:C.tm,marginBottom:12}}>
                경쟁 영상 {ytResult.videos.length}개
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {ytResult.videos.map((v,i)=>(
                  <div key={i}
                    onClick={()=>window.open(v.url,"_blank")}
                    style={{
                      display:"flex",gap:12,alignItems:"center",
                      background:C.bg3,borderRadius:10,padding:"10px 12px",
                      cursor:"pointer",transition:"all .15s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg4}
                    onMouseLeave={e=>e.currentTarget.style.background=C.bg3}
                  >
                    {/* 썸네일 */}
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt={v.title}
                        style={{width:80,height:45,objectFit:"cover",borderRadius:6,flexShrink:0}}
                      />
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{
                        fontSize:12,fontWeight:600,color:C.t,
                        marginBottom:4,lineHeight:1.4,
                        overflow:"hidden",display:"-webkit-box",
                        WebkitLineClamp:2,WebkitBoxOrient:"vertical",
                      }}>{v.title}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:C.tm}}>{v.channel}</span>
                        {v.views && <span style={{fontSize:10,fontFamily:C.m,color:C.am}}>👁 {v.views}</span>}
                        {v.publishedAt && <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>{v.publishedAt}</span>}
                      </div>
                    </div>
                    <span style={{
                      fontSize:9,fontFamily:C.m,padding:"2px 7px",borderRadius:20,
                      background:`${v.isShorts?"rgba(255,68,68,.15)":C.acd}`,
                      color:v.isShorts?"#ff8080":C.ac2,flexShrink:0,
                    }}>{v.isShorts?"Shorts":"롱폼"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claude 분석 결과 */}
          {ytResult.title_patterns?.length>0 && (
            <div style={{background:C.bg2,border:`1px solid ${C.b}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontFamily:C.m,color:C.tm,marginBottom:10}}>제목 패턴</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {ytResult.title_patterns.map((p,i)=>(
                  <div key={i} style={{
                    display:"flex",gap:10,alignItems:"center",
                    background:C.bg3,borderRadius:9,padding:"9px 12px",
                  }}>
                    <span style={{fontSize:10,fontFamily:C.m,color:C.tm,flexShrink:0}}>0{i+1}</span>
                    <span style={{fontSize:13,color:C.ts}}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빈틈 + 각도 */}
          {(ytResult.gap||ytResult.my_angle) && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {ytResult.gap && (
                <div style={{background:C.gd,border:`1px solid ${C.gb}`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:6}}>🟢 경쟁 빈틈</div>
                  <div style={{fontSize:13,color:C.g,fontWeight:600,lineHeight:1.5}}>{ytResult.gap}</div>
                </div>
              )}
              {ytResult.my_angle && (
                <div style={{background:C.acd,border:`1px solid ${C.acb}`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:6}}>🎯 내 채널 각도</div>
                  <div style={{fontSize:13,color:C.ac2,fontWeight:600,lineHeight:1.5}}>{ytResult.my_angle}</div>
                </div>
              )}
            </div>
          )}

          {/* 추천 제목 */}
          {ytResult.recommended_title && (
            <div style={{background:C.bg2,border:`1px solid ${C.acb}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:8}}>추천 영상 제목</div>
              <div style={{fontSize:17,fontWeight:800,color:C.t,lineHeight:1.5,marginBottom:8}}>
                "{ytResult.recommended_title}"
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {ytResult.estimated_views && (
                  <span style={{fontSize:11,fontFamily:C.m,padding:"3px 9px",borderRadius:20,background:C.gd,color:C.g}}>
                    예상 {ytResult.estimated_views}
                  </span>
                )}
                {ytResult.best_upload_time && (
                  <span style={{fontSize:11,fontFamily:C.m,padding:"3px 9px",borderRadius:20,background:C.acd,color:C.ac2}}>
                    ⏰ {ytResult.best_upload_time}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 교차분석 버튼 */}
          {analysis && (
            <button onClick={doCross} style={{
              padding:"13px",borderRadius:12,
              background:C.amd,border:`1px solid ${C.amb}`,
              color:C.am,fontSize:14,fontWeight:700,
            }}>⚡ 교차분석으로 최종 전략 도출 →</button>
          )}
        </div>
      )}
    </div>
  );

  const CrossPanel = () => (
    <div style={{padding:"22px",display:"flex",flexDirection:"column",gap:14}}>
      {!analysis || !ytResult ? (
        <div style={{textAlign:"center",padding:"70px 20px"}}>
          <div style={{fontSize:48,marginBottom:14,opacity:.35}}>⚡</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>교차분석 준비</div>
          <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
            AI분석과 유튜브 벤치마킹을<br/>모두 완료한 후 교차분석이 가능해요
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16}}>
            <span style={{
              fontSize:11,padding:"4px 12px",borderRadius:20,
              background:analysis?C.gd:C.rd,
              border:`1px solid ${analysis?C.gb:C.rb}`,
              color:analysis?C.g:C.r,
            }}>{analysis?"✓ AI분석":"✗ AI분석"}</span>
            <span style={{
              fontSize:11,padding:"4px 12px",borderRadius:20,
              background:ytResult?C.gd:C.rd,
              border:`1px solid ${ytResult?C.gb:C.rb}`,
              color:ytResult?C.g:C.r,
            }}>{ytResult?"✓ 유튜브분석":"✗ 유튜브분석"}</span>
          </div>
        </div>
      ) : crossLoading ? (
        <div style={{
          display:"flex",alignItems:"center",gap:14,
          padding:"24px 20px",background:C.bg2,
          border:`1px solid ${C.amb}`,borderRadius:14,
        }}>
          <div style={{
            width:22,height:22,border:`2px solid ${C.b}`,
            borderTopColor:C.am,borderRadius:"50%",
            animation:"spin .7s linear infinite",flexShrink:0,
          }}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.t,marginBottom:3}}>교차분석 중...</div>
            <div style={{fontSize:11,color:C.tm}}>최적 콘텐츠 전략을 도출하고 있어요</div>
          </div>
        </div>
      ) : !crossResult ? (
        <button onClick={doCross}
          style={{
            padding:"14px",borderRadius:12,
            background:C.amd,border:`1px solid ${C.amb}`,
            color:C.am,fontSize:14,fontWeight:700,
          }}>⚡ 교차분석 시작</button>
      ) : crossResult.error ? (
        <div style={{padding:"16px 18px",background:C.rd,border:`1px solid ${C.rb}`,borderRadius:12,color:C.r}}>{crossResult.error}</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeUp .3s ease"}}>
          
          <div style={{
            background:`linear-gradient(135deg,${C.amd},${C.acd})`,
            border:`1px solid ${C.amb}`,borderRadius:16,padding:"20px 22px",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{
                fontSize:36,fontWeight:800,fontFamily:C.m,
                color:C.am,lineHeight:1,
              }}>{crossResult.score}<span style={{fontSize:16,color:C.tm}}>/10</span></div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:C.t,marginBottom:4}}>{crossResult.verdict}</div>
                <div style={{fontSize:11,color:C.tm}}>{crossResult.upload_timing}</div>
              </div>
            </div>
          </div>
          
          {crossResult.final_title && (
            <div style={{background:C.bg2,border:`1px solid ${C.acb}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:8}}>🏆 최종 추천 제목</div>
              <div style={{fontSize:17,fontWeight:800,color:C.t,lineHeight:1.5}}>{crossResult.final_title}</div>
              <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                {crossResult.final_format && (
                  <span style={{fontSize:10,fontFamily:C.m,padding:"2px 8px",borderRadius:20,background:C.acd,color:C.ac2}}>
                    {crossResult.final_format}
                  </span>
                )}
                {crossResult.estimated_views && (
                  <span style={{fontSize:10,fontFamily:C.m,padding:"2px 8px",borderRadius:20,background:C.gd,color:C.g}}>
                    예상 {crossResult.estimated_views}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {crossResult.blue_ocean && (
            <div style={{background:C.gd,border:`1px solid ${C.gb}`,borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontSize:10,fontFamily:C.m,color:C.tm,marginBottom:6}}>🌊 블루오션 전략</div>
              <div style={{fontSize:13,color:C.g,lineHeight:1.6}}>{crossResult.blue_ocean}</div>
            </div>
          )}
          
          {selItem && (
            <button onClick={()=>addToPipe(selItem)}
              style={{
                padding:"13px",borderRadius:12,
                background:C.gd,border:`1px solid ${C.gb}`,
                color:C.g,fontSize:14,fontWeight:700,
              }}>📋 파이프라인에 추가 →</button>
          )}
        </div>
      )}
    </div>
  );

  // ---
  const PipelinePanel = () => (
    <div style={{padding:"22px"}}>
      <div style={{
        display:"flex",alignItems:"center",gap:10,marginBottom:16,
      }}>
        <span style={{fontSize:16,fontWeight:800,color:C.t}}>콘텐츠 파이프라인</span>
        <span style={{
          fontSize:10,fontFamily:C.m,padding:"2px 9px",borderRadius:20,
          background:C.gd,border:`1px solid ${C.gb}`,color:C.g,
        }}>{pipe.length}개</span>
      </div>
      {pipe.length===0 ? (
        <div style={{textAlign:"center",padding:"70px 20px"}}>
          <div style={{fontSize:48,marginBottom:14,opacity:.35}}>📋</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>파이프라인이 비어있어요</div>
          <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
            트렌드 카드에서 📋 버튼을 눌러<br/>콘텐츠를 추가해보세요
          </div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {pipe.map((item,i)=>(
            <div key={item.id} style={{
              background:C.bg2,border:`1px solid ${C.b}`,
              borderRadius:14,padding:"16px 18px",
              animation:"fadeUp .25s ease both",
              animationDelay:`${i*.04}s`,
            }}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{
                  width:40,height:40,borderRadius:10,
                  background:C.acd,border:`1px solid ${C.acb}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,flexShrink:0,
                }}>📋</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.t,marginBottom:7,lineHeight:1.4}}>
                    {item.trend}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{
                      fontSize:10,fontFamily:C.m,padding:"2px 8px",
                      borderRadius:20,background:C.acd,color:C.ac2,border:`1px solid ${C.acb}`,
                    }}>{item.stage}</span>
                    <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>{item.added}</span>
                    <span style={{
                      fontSize:10,fontFamily:C.m,padding:"2px 8px",
                      borderRadius:20,background:C.rd,color:C.r,marginLeft:"auto",
                    }}>점수 {item.score}</span>
                  </div>
                </div>
                <button onClick={()=>setPipe(p=>p.filter(x=>x.id!==item.id))}
                  style={{background:"none",color:C.tm,padding:4,flexShrink:0}}>
                  <Ic n="x" s={13}/>
                </button>
              </div>
              <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
                {[
                  {l:"AI분석", done:item.aiDone, fn:()=>doAnalyze(item.origItem||{id:item.id,title:item.trend,source:item.source})},
                  {l:"유튜브", done:item.ytDone, fn:()=>{ setSelItem(item.origItem||{id:item.id,title:item.trend}); doYoutubeBench(item.trend); }},
                  {l:"교차분석", done:item.crossDone, fn:doCross},
                ].map(btn=>(
                  <button key={btn.l} onClick={btn.fn} style={{
                    padding:"6px 11px",borderRadius:9,fontSize:11,fontWeight:700,
                    background:btn.done?C.acd:C.bg3, border:`1px solid ${btn.done?C.acb:C.b}`,
                    color:btn.done?C.ac2:C.ts,
                  }}>{btn.done?"✅":""}{btn.l}</button>
                ))}
                <button onClick={()=>sendToCandidatePool(item)} disabled={item.sentToPool} style={{
                  padding:"6px 11px",borderRadius:9,fontSize:11,fontWeight:700,
                  background:item.sentToPool?C.bg3:C.gd, border:`1px solid ${item.sentToPool?C.b:C.gb}`,
                  color:item.sentToPool?C.tm:C.g, cursor:item.sentToPool?"default":"pointer",
                }}>{item.sentToPool?"✓ 전송됨":"→ 후보풀로 전송"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── 이슈 후보 파이프라인 — 세계 이슈 쇼츠 채널용 "발굴→1차분석→상태추적" ───
  const ISSUE_STATUS = [
    { id:"new",       label:"신규",   color:C.ts },
    { id:"reviewing", label:"검토중", color:C.am },
    { id:"adopted",   label:"채택",   color:C.g  },
    { id:"produced",  label:"제작완료", color:C.ac2 },
    { id:"dropped",   label:"드랍",   color:C.tm },
  ];
  const IssuesPanel = () => {
    const visible = issueFilter==="all" ? issues : issues.filter(x=>x.status===issueFilter);
    return (
      <div style={{padding:"22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <span style={{fontSize:16,fontWeight:800,color:C.t}}>이슈 후보</span>
          <span style={{
            fontSize:10,fontFamily:C.m,padding:"2px 9px",borderRadius:20,
            background:"rgba(56,189,248,.12)",border:"1px solid rgba(56,189,248,.3)",color:"#38bdf8",
          }}>{issues.length}개</span>
          <button onClick={loadIssues} style={{
            marginLeft:"auto",fontSize:10,fontFamily:C.m,color:C.tm,
            background:"none",padding:"4px 8px",
          }}>{issuesLoading?"새로고침 중...":"↻ 새로고침"}</button>
        </div>
        <div style={{fontSize:11.5,color:C.tm,lineHeight:1.7,marginBottom:14}}>
          "니치 바이럴 클립" 그룹(유튜브 쇼츠·Reddit, 이색테크·미스터리·장인·심리실험·틈새상식·팩트체크)에서
          🎬 클립후보 버튼으로 등록 → "1차 분석"으로 3초 후킹·시청지속 비결·재구성 앵글을 뽑아보고 →
          상태를 바꿔가며 추적하세요. (로컬 실행 중에만 저장됩니다 — <code style={{color:C.ts}}>npm run dev</code>)
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[{id:"all",label:"전체",color:C.ts}, ...ISSUE_STATUS].map(s=>(
            <button key={s.id} onClick={()=>setIssueFilter(s.id)} style={{
              padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:700,
              background:issueFilter===s.id?`${s.color}20`:C.bg2,
              border:`1px solid ${issueFilter===s.id?s.color+"50":C.b}`,
              color:issueFilter===s.id?s.color:C.tm,
            }}>{s.label} {s.id==="all"?issues.length:issues.filter(x=>x.status===s.id).length}</button>
          ))}
        </div>

        {visible.length===0 ? (
          <div style={{textAlign:"center",padding:"70px 20px"}}>
            <div style={{fontSize:48,marginBottom:14,opacity:.35}}>🌍</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>이슈 후보가 비어있어요</div>
            <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
              트렌드 목록(니치 바이럴 클립 그룹 추천)에서 🎬 클립후보 버튼을 눌러보세요
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {visible.map((item,i)=>{
              const st = ISSUE_STATUS.find(s=>s.id===item.status) || ISSUE_STATUS[0];
              const a = item.analysis;
              return (
                <div key={item.id} style={{
                  background:C.bg2,border:`1px solid ${C.b}`,borderRadius:14,padding:"16px 18px",
                  animation:"fadeUp .25s ease both", animationDelay:`${i*.03}s`,
                }}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.t,marginBottom:7,lineHeight:1.4}}>
                        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"none"}}>{item.title}</a> : item.title}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>
                          {item.extra?.platform || item.source}{item.extra?.category ? ` · ${item.extra.category}` : ""}
                        </span>
                        {item.extra?.viewCount != null && <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>👁 {item.extra.viewCount.toLocaleString()}</span>}
                        {item.extra?.velocity != null && <span style={{fontSize:10,fontFamily:C.m,color:C.am}}>⚡ {item.extra.velocity.toLocaleString()}/h</span>}
                        <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>{timeAgo(item.lastSeenAt)}</span>
                        {item.seenCount>1 && <span style={{fontSize:10,fontFamily:C.m,color:C.tm}}>{item.seenCount}회 재등장</span>}
                      </div>
                    </div>
                    <select value={item.status} onChange={e=>updateIssueStatus(item.id, e.target.value)} style={{
                      fontSize:11,fontFamily:C.m,fontWeight:700,padding:"5px 8px",borderRadius:8,
                      background:`${st.color}18`,border:`1px solid ${st.color}50`,color:st.color,flexShrink:0,
                    }}>
                      {ISSUE_STATUS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>

                  {a ? (
                    <div style={{marginTop:12,background:C.bg3,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:12.5,color:C.t,lineHeight:1.6,marginBottom:10}}>💬 {a.summary_ko}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        <span style={{
                          fontSize:10,fontFamily:C.m,fontWeight:800,padding:"2px 8px",borderRadius:20,
                          background: a.recommended?`${C.g}18`:`${C.r}18`, border:`1px solid ${a.recommended?C.g:C.r}40`,
                          color: a.recommended?C.g:C.r,
                        }}>{a.recommended ? "✅ 추천" : "⚠️ 비추천"}</span>
                      </div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.6,marginBottom:4}}><strong style={{color:C.tm}}>⚡3초 후킹:</strong> {a.hook_point}</div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.6,marginBottom:4}}><strong style={{color:C.tm}}>👀 시청지속:</strong> {a.retention_secret}</div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.6,marginBottom:4}}><strong style={{color:C.tm}}>🔁 재구성 앵글:</strong> {a.remix_angle}</div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.6,marginBottom:4}}><strong style={{color:C.tm}}>🆕 신선도:</strong> {a.freshness_note}</div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.6}}><strong style={{color:C.tm}}>종합:</strong> {a.verdict}</div>
                    </div>
                  ) : null}

                  <div style={{display:"flex",gap:6,marginTop:12}}>
                    <button onClick={()=>assessIssue(item)} disabled={issueAnalyzing[item.id]} style={{
                      flex:1,padding:"8px",borderRadius:9,fontSize:11,fontWeight:700,
                      background:C.acd,border:`1px solid ${C.acb}`,color:C.ac2,
                      opacity:issueAnalyzing[item.id]?.6:1,
                    }}>{issueAnalyzing[item.id]?"분석 중...":a?"🔁 재분석":"🤖 1차 분석"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---
  const BgmPanel = () => {
    const trendChips = filtered.slice(0, 10).map(i=>i.title).filter(Boolean);
    return (
      <div style={{padding:"22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:800,color:C.t}}>BGM 레이더</span>
          <span style={{
            fontSize:10,fontFamily:C.m,padding:"2px 9px",borderRadius:20,
            background:C.cyd,border:`1px solid ${C.cyb}`,color:C.cy,
          }}>Chosic 무료 CC BY</span>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.tm,marginBottom:8}}>분위기 코드</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {BGM_MOODS.map(m=>(
            <button key={m.id} onClick={()=>setBgmMood(m.id)}
              style={{
                padding:"7px 12px",borderRadius:9,fontSize:12,fontWeight:700,
                background: bgmMood===m.id ? C.acd : C.bg2,
                border:`1px solid ${bgmMood===m.id ? C.acb : C.b}`,
                color: bgmMood===m.id ? C.ac2 : C.ts,
              }}>{m.id} · {m.label}</button>
          ))}
        </div>

        {trendChips.length>0 && (
          <>
            <div style={{fontSize:11,fontWeight:700,color:C.tm,marginBottom:8}}>현재 수집된 트렌드 키워드</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {trendChips.map((t,i)=>(
                <span key={i} onClick={()=>setBgmKeywords(t)} title={t}
                  style={{
                    padding:"5px 10px",borderRadius:20,fontSize:11,color:C.ts,
                    background:C.bg2,border:`1px solid ${C.b}`,cursor:"pointer",
                    maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  }}>{t}</span>
              ))}
            </div>
          </>
        )}

        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input value={bgmKeywords} onChange={e=>setBgmKeywords(e.target.value)}
            placeholder="검색 키워드 (쉼표로 구분)"
            style={{
              flex:1,padding:"9px 12px",borderRadius:9,fontSize:13,
              background:C.bg2,border:`1px solid ${C.b}`,color:C.t,
            }}/>
          <button onClick={doBgmSearch} disabled={bgmLoading}
            style={{
              padding:"9px 18px",borderRadius:9,fontSize:13,fontWeight:800,
              background:C.acd,border:`1px solid ${C.acb}`,color:C.ac2,
              opacity:bgmLoading?.5:1,
            }}>{bgmLoading?"검색 중...":"🔍 BGM 검색"}</button>
        </div>

        {bgmStatus && <div style={{fontSize:12,color:C.tm,marginBottom:12}}>{bgmStatus}</div>}

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {bgmResults.map((item,i)=>{
            const dlState = bgmDownloading[i];
            return (
              <div key={i} style={{
                background:C.bg2,border:`1px solid ${C.b}`,borderRadius:14,padding:"14px 16px",
              }}>
                <div style={{fontSize:14,fontWeight:700,color:C.t}}>{item.title}</div>
                {item.artist && <div style={{fontSize:11,color:C.tm,marginTop:2}}>{item.artist}</div>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                  <span style={{fontSize:10,fontFamily:C.m,padding:"3px 8px",borderRadius:6,background:C.bg3,color:C.ts}}>BPM: {item.bpm || "—"}</span>
                  <span style={{fontSize:10,fontFamily:C.m,padding:"3px 8px",borderRadius:6,background:C.bg3,color:C.ts}}>분위기: {item.mood || "—"}</span>
                  <span style={{fontSize:10,fontFamily:C.m,padding:"3px 8px",borderRadius:6,background:C.bg3,color:C.ts}}>길이: {item.duration || "—"}</span>
                </div>
                <div style={{fontSize:10,color:C.tm,marginTop:8,lineHeight:1.5}}>{item.license}</div>
                {item.previewUrl && <audio controls preload="none" src={item.previewUrl} style={{width:"100%",height:32,marginTop:8}}/>}
                <button onClick={()=>doBgmDownload(item,i)} disabled={dlState==="loading"}
                  style={{
                    width:"100%",marginTop:8,padding:"8px",borderRadius:8,fontSize:12,fontWeight:700,
                    background:C.bg3,border:`1px solid ${C.b}`,color:C.t,
                  }}>
                  {dlState==="loading" ? "⏳ 다운로드 중..." : dlState==="done" ? "✅ 저장됨" : dlState==="error" ? "❌ 실패 (재시도)" : "⬇ 다운로드"}
                </button>
              </div>
            );
          })}
          {!bgmLoading && bgmResults.length===0 && (
            <div style={{textAlign:"center",padding:"70px 20px"}}>
              <div style={{fontSize:48,marginBottom:14,opacity:.35}}>🎵</div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>분위기를 고르고 검색해보세요</div>
              <div style={{fontSize:13,color:C.tm,lineHeight:1.8}}>
                위 트렌드 키워드 칩을 누르면 검색어에 자동으로 채워져요
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---
  return (
    <>
      <Head>
        <title>TREND RADAR v8</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div style={{minHeight:"100vh",background:C.bg,display:"grid",gridTemplateRows:"56px 1fr"}}>

        
        <header style={{
          display:"flex",alignItems:"center",padding:"0 22px",gap:16,
          borderBottom:`1px solid ${C.b}`,
          background:"rgba(7,7,14,.96)",backdropFilter:"blur(20px)",
          position:"sticky",top:0,zIndex:100,
        }}>
          
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{
              width:36,height:36,borderRadius:10,
              background:`linear-gradient(135deg,${C.ac},#c084fc)`,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              <Ic n="trend" s={18} c="#fff"/>
            </div>
            <span style={{fontSize:18,fontWeight:800,letterSpacing:"-.04em",color:C.t}}>
              TREND RADAR
            </span>
            <span style={{
              fontSize:9,fontFamily:C.m,fontWeight:700,
              padding:"2px 7px",borderRadius:20,
              background:C.acd,color:C.ac2,border:`1px solid ${C.acb}`,
            }}>v8</span>
            <span style={{
              display:"flex",alignItems:"center",gap:5,
              fontSize:9,fontFamily:C.m,fontWeight:700,
              padding:"2px 9px",borderRadius:20,
              background:C.gd,color:C.g,border:`1px solid ${C.gb}`,
            }}>
              <span style={{
                width:5,height:5,borderRadius:"50%",background:C.g,
                animation:"dot 2s infinite",
              }}/>LIVE
            </span>
          </div>

          
          <div style={{
            flex:1,display:"flex",alignItems:"center",gap:18,
            fontSize:12,fontFamily:C.m,color:C.tm,
          }}>
            {lastFetch&&<span>갱신 {lastFetch.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</span>}
            <span>총 <strong style={{color:C.t}}>{items.length}</strong>개</span>
            {totalFire>0&&<span style={{color:C.r}}>🔥 <strong>{totalFire}</strong></span>}
            {totalRise>0&&<span style={{color:C.am}}>📈 <strong>{totalRise}</strong></span>}
            {/* source status badges — 화제·이슈 소스를 우선 노출, 나머지는 사이드바에서 확인 */}
            {[
              {id:"youtube_kr",  icon:"▶",  color:"#ff4444"},
              {id:"youtube_ent", icon:"▶",  color:"#ff8888"},
              {id:"signal_kr",   icon:"🔎", color:C.ro},
              {id:"signal_news", icon:"📌", color:C.r},
              {id:"news_ent",    icon:"🎬", color:"#f472b6"},
              {id:"news_viral",  icon:"💥", color:"#f59e0b"},
              {id:"reddit_fun",  icon:"R",  color:"#ff4500"},
              {id:"niche_mystery",    icon:"🕵️", color:"#818cf8"},
              {id:"niche_trivia",     icon:"💡", color:"#34d399"},
              {id:"google_kr",   icon:"🇰🇷", color:C.g},
            ].map(src => {
              const st = fStatus[src.id];
              return (
                <span key={src.id} title={st?.err||src.id} style={{
                  fontSize:9, fontFamily:C.m, fontWeight:800,
                  padding:"2px 6px", borderRadius:12,
                  background: st?.ok ? `${src.color}20` : "rgba(255,255,255,.06)",
                  color: st?.ok ? src.color : C.tb,
                  border: `1px solid ${st?.ok ? src.color+"40" : "transparent"}`,
                  cursor:"default",
                }}>
                  {src.icon}{st?.ok ? ` ${st.n}` : " —"}
                </span>
              );
            })}
            {/* 한글 요약 주석 기능 상태 — 조용히 꺼져있던 걸 다시 눈에 보이게 */}
            {Object.keys(translations).length > 0 ? (
              <span title="한글 요약 주석이 달린 항목 수" style={{
                fontSize:9, fontFamily:C.m, fontWeight:800,
                padding:"2px 6px", borderRadius:12,
                background:C.acd, color:C.ac2, border:`1px solid ${C.acb}`,
              }}>💬 {Object.keys(translations).length}</span>
            ) : items.length > 0 && !translating && (
              <span title="Claude API 키가 없어 한글 요약 주석이 비활성 상태입니다. 상단 'API 키 설정'을 누르거나, 서버에 ANTHROPIC_API_KEY를 설정하세요." style={{
                fontSize:9, fontFamily:C.m, fontWeight:700,
                padding:"2px 6px", borderRadius:12,
                background:"rgba(255,255,255,.06)", color:C.tb,
              }}>💬 비활성</span>
            )}
          </div>

          
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>setShowApiModal(true)}
              style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"6px 13px",borderRadius:20,
                border:`1px solid ${apiKey?C.gb:C.b}`,
                background:apiKey?C.gd:"transparent",
                color:apiKey?C.g:C.tm,
                fontSize:11,fontFamily:C.m,fontWeight:700,
              }}>
              <Ic n="key" s={11} c={apiKey?C.g:C.tm}/>
              {apiKey?"Claude 연결됨":"API 키 설정"}
            </button>
            <button onClick={fetchAll} disabled={loading}
              style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"6px 15px",borderRadius:20,
                border:`1px solid ${C.acb}`,background:C.acd,
                color:C.ac2,fontSize:11,fontFamily:C.m,fontWeight:700,
                opacity:loading?.5:1,
              }}>
              <Ic n="refresh" s={11} c={C.ac2}/>
              {loading?"수집중...":"↻ 수집"}
            </button>
          </div>
        </header>

        
        <div style={{display:"flex",overflow:"hidden"}}>
          {/* 함수 호출로 렌더 — <Sidebar/>처럼 쓰면 부모 렌더마다 새 컴포넌트 타입이 돼서 통째로 재마운트되고
              스크롤 위치가 맨 위로 초기화된다(클릭할 때마다 목록이 튀던 원인). 이 함수들 안에서는 훅을 쓰지 말 것. */}
          {Sidebar()}
          <main style={{
            flex:1,overflowY:"auto",minWidth:0,
            height:"calc(100vh - 56px)",
            display:"flex",flexDirection:"column",
          }}>

            {ActionBar()}

            <div style={{flex:1,overflowY:"auto"}}>
              {actionTab==="list"     && ListPanel()}
              {actionTab==="analyze"  && AnalyzePanel()}
              {actionTab==="youtube"  && YoutubePanel()}
              {actionTab==="cross"    && CrossPanel()}
              {actionTab==="pipeline" && PipelinePanel()}
              {actionTab==="issues"   && IssuesPanel()}
              {actionTab==="bgm"      && BgmPanel()}
            </div>
          </main>
        </div>
      </div>

      
      {showApiModal && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.75)",
          backdropFilter:"blur(8px)",zIndex:200,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}
          onClick={e=>e.target===e.currentTarget&&setShowApiModal(false)}
        >
          <div style={{
            background:C.bg2,border:`1px solid ${C.b}`,
            borderRadius:20,padding:30,width:"100%",maxWidth:430,
            animation:"fadeUp .3s ease",
          }}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:8}}>🔑 Claude API 키</div>
            <div style={{fontSize:13,color:C.tm,marginBottom:18,lineHeight:1.7}}>
              AI 분석·한글 요약 주석 기능에 사용됩니다.<br/>
              키는 브라우저 로컬에만 저장됩니다.<br/>
              <span style={{color:C.tb}}>※ 서버에 ANTHROPIC_API_KEY를 설정해두면 이 키 없이도 한글 요약 주석은 자동으로 동작합니다.</span>
            </div>
            <input
              type="password" id="apiKeyInput"
              defaultValue={apiKey}
              placeholder="sk-ant-..."
              style={{
                width:"100%",padding:"11px 14px",
                background:C.bg3,border:`1px solid ${C.b}`,
                borderRadius:12,color:C.t,fontSize:14,marginBottom:14,
              }}
            />
            <div style={{display:"flex",gap:8}}>
              <button
                onClick={()=>{
                  const v=document.getElementById("apiKeyInput").value.trim();
                  if(v) saveApiKey(v);
                }}
                style={{
                  flex:1,padding:"11px",borderRadius:12,
                  background:`linear-gradient(135deg,${C.ac},#c084fc)`,
                  color:"#fff",fontSize:14,fontWeight:700,
                }}>저장</button>
              <button onClick={()=>setShowApiModal(false)}
                style={{
                  padding:"11px 18px",borderRadius:12,
                  background:C.bg3,border:`1px solid ${C.b}`,
                  color:C.tm,fontSize:14,
                }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
