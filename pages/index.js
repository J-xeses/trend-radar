import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

/* ─── Design Tokens ─── */
const T = {
  bg:"#070710", s:"#0e0e1a", s2:"#12121f", c:"#181828", ch:"#1e1e30",
  ca:"#22223a", b:"#ffffff0a", ba:"#ffffff18", bg2:"#ffffff28",
  ac:"#818cf8", acd:"#818cf812", acb:"#818cf830",
  g:"#34d399", gd:"#34d39912", gb:"#34d39930",
  am:"#fbbf24", amd:"#fbbf2412", amb:"#fbbf2430",
  r:"#f87171", rd:"#f8717112", rb:"#f8717130",
  cy:"#22d3ee", cyd:"#22d3ee12", cyb:"#22d3ee30",
  ro:"#fb7185", rod:"#fb718512",
  t:"#eeeef8", ts:"#8888aa", tm:"#55557a",
  m:"'JetBrains Mono','SF Mono',monospace",
  f:"'Inter',-apple-system,sans-serif"
};

const SRC = {
  hackernews:  { l:"HackerNews",   i:"Y", c:"#ff6600", b:"#ff660020" },
  reddit:      { l:"Reddit",       i:"R", c:"#ff4500", b:"#ff450020" },
  google_kr:   { l:"Google KR",    i:"🇰🇷", c:"#4285f4", b:"#4285f420" },
  google_us:   { l:"Google US",    i:"🇺🇸", c:"#34a853", b:"#34a85320" },
  google_gl:   { l:"글로벌",        i:"🌍", c:"#ea4335", b:"#ea433520" },
  naver:       { l:"네이버뉴스",    i:"N", c:"#03c75a", b:"#03c75a20" },
  producthunt: { l:"ProductHunt",  i:"P", c:"#da552f", b:"#da552f20" },
  github:      { l:"GitHub",       i:"G", c:"#a78bfa", b:"#a78bfa20" },
  youtube_kr:  { l:"유튜브 급상승", i:"▶", c:"#ff0000", b:"#ff000020" },
  youtube_ch:  { l:"유튜브 채널",   i:"📺", c:"#ff4444", b:"#ff444420" },
};

const CATS = [
  { id:"all",     l:"전체",    i:"◎" },
  { id:"ai",      l:"AI/ML",  i:"⬡" },
  { id:"tech",    l:"테크",    i:"◇" },
  { id:"biz",     l:"비즈니스",i:"△" },
  { id:"life",    l:"라이프",  i:"○" },
  { id:"career",  l:"커리어",  i:"◆" },
  { id:"product", l:"신제품",  i:"★" },
];

const STAGES = [
  { id:"discovered", l:"발견",    c:T.cy,  i:"🔍" },
  { id:"analyzing",  l:"분석중",  c:T.am,  i:"🔬" },
  { id:"scripting",  l:"대본작성",c:T.ac,  i:"✍️" },
  { id:"producing",  l:"제작중",  c:T.ro,  i:"🎬" },
  { id:"published",  l:"발행완료",c:T.g,   i:"✅" },
];

const HEAT = {
  explosive:{ l:"🔥 폭발", c:T.r },
  rising:   { l:"📈 상승", c:T.am },
  steady:   { l:"→ 안정", c:T.g },
  cooling:  { l:"↘ 하락", c:T.tm },
};

/* ─── Helpers ─── */
function timeAgo(ts) {
  const m = Math.floor((Date.now()-ts)/60000);
  if (m<60) return `${m}분 전`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}시간 전`;
  return `${Math.floor(h/24)}일 전`;
}
function classify(title) {
  const t = title.toLowerCase();
  if (/\bai\b|artificial|llm|gpt|claude|gemini|openai|anthropic|machine learning|neural|transformer|diffusion|agent|챗봇|인공지능|딥러닝|자동화|노코드/.test(t)) return "ai";
  if (/startup|founder|funding|vc|스타트업|투자|유니콘|부업|수익|월급|돈버는|재테크/.test(t)) return "biz";
  if (/career|job|hire|salary|이직|채용|연봉|퇴사|취업|직장인|회사|업무|생산성|효율/.test(t)) return "career";
  if (/건강|운동|다이어트|루틴|습관|명상|수면|여행|맛집|자기계발|성장|독서/.test(t)) return "life";
  if (/product|app|tool|saas|launch|ship|앱|툴|서비스/.test(t)) return "product";
  return "tech";
}
function scoreItem(item) {
  const age = (Date.now()-item.time)/3600000;
  const rec = Math.max(0, 100-age*2);
  let eng = 50;
  if (item.source==="hackernews") eng = Math.min(100, item.score/5+item.comments/2);
  else if (item.source==="reddit") eng = Math.min(100, item.score/50+item.comments/3);
  else if (item.source?.startsWith("google_")) eng = Math.min(100, item.traffic?item.traffic/5000*100:60);
  else if (item.source==="producthunt") eng = Math.min(100,(item.score||50)/3);
  else if (item.source==="github") eng = Math.min(100,(item.score||0)/10+50);
  else if (item.source==="youtube_kr") eng = Math.min(100,(item.score||60)+10); // 급상승 보정
  else if (item.source==="youtube_ch") eng = Math.min(100,(item.score||65));
  return Math.max(5, Math.min(100, Math.round(eng*0.6+rec*0.4)));
}
function heatOf(s, a) {
  if (s>=85&&a<6) return "explosive";
  if (s>=65) return "rising";
  if (s>=40) return "steady";
  return "cooling";
}

/* ─── API Fetchers ─── */
async function fetchHN() {
  try {
    const [a,b] = await Promise.all([
      fetch("https://hacker-news.firebaseio.com/v0/topstories.json"),
      fetch("https://hacker-news.firebaseio.com/v0/beststories.json")
    ]);
    const [t,be] = await Promise.all([a.json(),b.json()]);
    const ids = [...new Set([...t.slice(0,15),...be.slice(0,10)])].slice(0,20);
    const items = await Promise.all(ids.map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json())));
    return items.filter(s=>s?.title).map(s=>({ id:`hn-${s.id}`,title:s.title,url:s.url||`https://news.ycombinator.com/item?id=${s.id}`,score:s.score||0,comments:s.descendants||0,source:"hackernews",time:s.time*1000,author:s.by }));
  } catch { return []; }
}
async function fetchRD() {
  const subs = ["artificial","MachineLearning","technology","productivity","SideProject","selfimprovement"];
  try {
    const res = await Promise.all(subs.map(s=>fetch(`https://www.reddit.com/r/${s}/hot.json?limit=5`).then(r=>r.json()).then(d=>(d?.data?.children||[]).map(c=>c.data)).catch(()=>[])));
    return res.flat().filter(p=>p?.title&&!p.stickied).map(p=>({ id:`rd-${p.id}`,title:p.title,url:`https://reddit.com${p.permalink}`,score:p.score||0,comments:p.num_comments||0,source:"reddit",time:(p.created_utc||0)*1000,author:p.author,sub:p.subreddit }));
  } catch { return []; }
}
async function fetchGT(geo, srcId) {
  try {
    const res = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text,"text/xml");
    const items = xml.querySelectorAll("item");
    const r = [];
    items.forEach((item,i)=>{
      if (i>=15) return;
      const title = item.querySelector("title")?.textContent||"";
      const traffic = item.querySelector("ht\\:approx_traffic,approx_traffic")?.textContent||"";
      const link = item.querySelector("link")?.textContent||"";
      const pubDate = item.querySelector("pubDate")?.textContent||"";
      const trafficNum = parseInt(traffic.replace(/[^0-9]/g,""))||0;
      r.push({ id:`g${geo||"gl"}-${i}-${Date.now()}`,title,url:link||`https://trends.google.com/trending?geo=${geo}`,score:Math.min(100,Math.round(trafficNum/5000*100))||50,comments:0,source:srcId,time:pubDate?new Date(pubDate).getTime():Date.now(),traffic:trafficNum });
    });
    return r;
  } catch { return []; }
}
async function fetchNaver() {
  try {
    const res = await fetch(`https://news.google.com/rss/search?q=site:news.naver.com+AI+OR+인공지능+OR+테크+OR+자기계발&hl=ko&gl=KR&ceid=KR:ko`);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text,"text/xml");
    const items = xml.querySelectorAll("item");
    const r = [];
    items.forEach((item,i)=>{
      if (i>=15) return;
      const title = item.querySelector("title")?.textContent||"";
      const link = item.querySelector("link")?.textContent||"";
      const pubDate = item.querySelector("pubDate")?.textContent||"";
      r.push({ id:`nv-${i}-${Date.now()}`,title:title.replace(/ - .*$/,"").trim(),url:link||"https://news.naver.com",score:0,comments:0,source:"naver",time:pubDate?new Date(pubDate).getTime():Date.now() });
    });
    return r.filter((v,i,a)=>a.findIndex(t2=>t2.title===v.title)===i).slice(0,15);
  } catch { return []; }
}
async function fetchPH() {
  try {
    const res = await fetch("https://www.producthunt.com/feed");
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text,"text/xml");
    const items = xml.querySelectorAll("item");
    const r = [];
    items.forEach((item,i)=>{
      if (i>=12) return;
      const title = item.querySelector("title")?.textContent||"";
      const link = item.querySelector("link")?.textContent||"";
      const pubDate = item.querySelector("pubDate")?.textContent||"";
      const desc = item.querySelector("description")?.textContent||"";
      r.push({ id:`ph-${i}-${Date.now()}`,title,url:link||"https://www.producthunt.com",score:50,comments:0,source:"producthunt",time:pubDate?new Date(pubDate).getTime():Date.now(),tagline:desc.replace(/<[^>]*>/g,"").slice(0,100) });
    });
    return r;
  } catch { return []; }
}
async function fetchGH() {
  try {
    const res = await fetch("https://github.com/trending?since=daily&spoken_language_code=en");
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text,"text/html");
    const repos = doc.querySelectorAll("article.Box-row");
    const r = [];
    repos.forEach((repo,i)=>{
      if (i>=10) return;
      const nameEl = repo.querySelector("h2 a");
      const name = nameEl?.textContent?.trim().replace(/\s+/g," ")||"";
      const href = nameEl?.getAttribute("href")||"";
      const desc = repo.querySelector("p")?.textContent?.trim()||"";
      const starsText = repo.querySelector("[href$='/stargazers']")?.textContent?.trim()||"0";
      const stars = parseInt(starsText.replace(/,/g,""))||0;
      r.push({ id:`gh-${i}-${Date.now()}`,title:`${name}: ${desc}`.slice(0,120),url:`https://github.com${href}`,score:stars,comments:0,source:"github",time:Date.now()-i*3600000,stars });
    });
    return r;
  } catch { return []; }
}

/* ─── YouTube Fetchers ─── */

// 방법2: 유튜브 급상승 트렌딩 (한국) — RSS/Trending 페이지 파싱
async function fetchYTTrending() {
  try {
    // 유튜브 트렌딩 RSS (공개 엔드포인트)
    const urls = [
      "https://www.youtube.com/feeds/videos.xml?chart=0&gl=KR&hl=ko", // 급상승 KR
    ];
    const res = await fetch(urls[0]);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text,"text/xml");
    const entries = xml.querySelectorAll("entry");
    const r = [];
    entries.forEach((entry,i)=>{
      if (i>=15) return;
      const title = entry.querySelector("title")?.textContent||"";
      const videoId = entry.querySelector("videoId")?.textContent||
                      entry.querySelector("id")?.textContent?.split(":").pop()||"";
      const published = entry.querySelector("published")?.textContent||"";
      const viewCount = parseInt(entry.querySelector("statistics")?.getAttribute("views")||"0")||0;
      const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "https://www.youtube.com";
      r.push({
        id:`ytk-${i}-${Date.now()}`,
        title,
        url,
        score: Math.min(100, Math.round(viewCount/10000))||60,
        comments:0,
        source:"youtube_kr",
        time: published ? new Date(published).getTime() : Date.now()-i*3600000,
        tagline:"🇰🇷 유튜브 급상승"
      });
    });
    return r.filter(v=>v.title);
  } catch { return []; }
}

// 방법1: 한국 유튜브 채널 RSS 피드 수집 (채널명 RSS에서 자동 추출)
async function fetchYTChannels() {
  const channelIds = [
    "UCYM3qUEffEx-u48OG-6BRbg",
    "UCtfGLmp6xMwvPoYpI-A5Kdg",
    "UCqZrIjDRZimf_QkuAkNw4DA",
    "UCQ2DWm5Md16Dc3xRwwhVE7Q",
    "UCriq8I8GEESkQq0svX19oCw",
    "UCwwEoblY3HEXs8bs3hoOn0A",
    "UCz-NbRVGyEmU1CLxPEhgxmA",
    "UCNHhTJTUoHa_LZwl3Js-8pQ",
  ];
  const results = [];
  await Promise.all(channelIds.map(async(cid)=>{
    try {
      const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text,"text/xml");
      // 채널 이름 RSS에서 자동 추출
      const chName = xml.querySelector("author name")?.textContent ||
                     xml.querySelector("feed > title")?.textContent ||
                     `채널(${cid.slice(2,8)})`;
      const entries = xml.querySelectorAll("entry");
      entries.forEach((entry,i)=>{
        if (i>=3) return;
        const title = entry.querySelector("title")?.textContent||"";
        const videoId = entry.querySelector("videoId")?.textContent||"";
        const published = entry.querySelector("published")?.textContent||"";
        const viewCount = parseInt(entry.querySelector("statistics")?.getAttribute("views")||"0")||0;
        if (!title) return;
        results.push({
          id:`ytch-${cid.slice(2,8)}-${i}-${Date.now()}`,
          title:`[${chName}] ${title}`,
          url: videoId?`https://www.youtube.com/watch?v=${videoId}`:`https://www.youtube.com/channel/${cid}`,
          score: Math.min(95, 60+Math.min(35,Math.round(viewCount/50000))),
          comments:0,
          source:"youtube_ch",
          time: published?new Date(published).getTime():Date.now()-i*7200000,
          tagline:`📺 ${chName}`
        });
      });
    } catch {}
  }));
  return results;
}

/* ─── UI Components ─── */
const Pill = ({ children, color=T.ts, bg }) => (
  <span style={{ fontSize:11,fontWeight:700,letterSpacing:".03em",padding:"3px 8px",borderRadius:5,background:bg||`${color}18`,color,fontFamily:T.m,whiteSpace:"nowrap" }}>
    {children}
  </span>
);

const ScoreBadge = ({ score }) => {
  const color = score>=80?T.r:score>=60?T.am:T.g;
  return (
    <div style={{ width:52,height:52,borderRadius:12,background:`${color}15`,border:`2px solid ${color}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      <div style={{ fontSize:20,fontWeight:900,color,fontFamily:T.m,lineHeight:1 }}>{score}</div>
      <div style={{ fontSize:8,color:`${color}80`,fontFamily:T.m,marginTop:1 }}>점수</div>
    </div>
  );
};

const Bar = ({ pct, color=T.ac }) => (
  <div style={{ width:"100%",height:3,background:`${color}15`,borderRadius:3,overflow:"hidden" }}>
    <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .8s cubic-bezier(.4,0,.2,1)" }} />
  </div>
);

const Spin = ({ s=16, c=T.ac }) => (
  <div style={{ width:s,height:s,border:`2px solid ${c}25`,borderTopColor:c,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0 }} />
);

const WorkflowStep = ({ label, icon, active, done }) => (
  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1 }}>
    <div style={{ width:38,height:38,borderRadius:10,background:done?T.gd:active?T.acd:T.c,border:`2px solid ${done?T.g:active?T.ac:T.ba}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,transition:"all .3s",boxShadow:active?`0 0 12px ${T.ac}40`:done?`0 0 12px ${T.g}30`:"none" }}>
      {icon}
    </div>
    <div style={{ fontSize:10,fontWeight:700,color:done?T.g:active?T.ac:T.tm,textAlign:"center",fontFamily:T.m }}>{label}</div>
  </div>
);

/* ─── API Key Modal ─── */
const ApiKeyModal = ({ onSave, onSkip }) => {
  const [key, setKey] = useState("");
  const valid = key.length > 20;
  return (
    <div style={{ position:"fixed",inset:0,background:"#00000095",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:T.s,border:`1px solid ${T.ba}`,borderRadius:18,padding:30,maxWidth:440,width:"100%",animation:"fadeUp .3s ease" }}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#4285f420",border:"1px solid #4285f440",borderRadius:10,padding:"8px 16px" }}>
            <span style={{ fontSize:20 }}>🔷</span>
            <span style={{ fontSize:14,fontWeight:800,color:"#4285f4" }}>Google Gemini API</span>
            <span style={{ fontSize:11,background:T.gd,border:`1px solid ${T.gb}`,color:T.g,padding:"2px 7px",borderRadius:5,fontFamily:T.m,fontWeight:700 }}>무료</span>
          </div>
        </div>
        <div style={{ fontSize:17,fontWeight:800,marginBottom:8,textAlign:"center" }}>API Key 설정</div>
        <div style={{ fontSize:13,color:T.ts,lineHeight:1.8,marginBottom:20,textAlign:"center" }}>
          OpenRouter (Llama 3.3 70B) — <span style={{ color:T.g,fontWeight:700 }}>무료로 AI 분석 & 대본 생성</span><br/>
          신용카드 없이 Google 계정만으로 발급 가능해요.
        </div>
        <div style={{ background:T.c,borderRadius:10,padding:14,marginBottom:16,fontSize:12,lineHeight:2,color:T.ts }}>
          <div style={{ color:T.t,fontWeight:700,marginBottom:4 }}>🚀 API Key 무료 발급 (1분)</div>
          <div>1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color:"#4285f4" }}>aistudio.google.com/apikey</a> 접속</div>
          <div>2. Google 계정으로 로그인</div>
          <div>3. <b style={{ color:T.t }}>"Create API Key"</b> 클릭 → 복사</div>
          <div>4. 아래에 붙여넣기 후 저장</div>
        </div>
        <input
          value={key}
          onChange={e=>setKey(e.target.value)}
          placeholder="AIzaSy..."
          type="password"
          style={{ width:"100%",background:T.c,border:`1px solid ${valid?T.gb:T.ba}`,borderRadius:9,padding:"12px 14px",color:T.t,fontSize:13,fontFamily:T.m,marginBottom:12,boxSizing:"border-box",transition:"border .2s" }}
        />
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onSkip} style={{ flex:1,padding:12,borderRadius:9,background:"transparent",border:`1px solid ${T.ba}`,color:T.ts,fontSize:13,fontWeight:600,cursor:"pointer" }}>나중에</button>
          <button onClick={()=>valid&&onSave(key)} style={{ flex:2,padding:12,borderRadius:9,background:valid?"#4285f4":T.c,border:"none",color:valid?"#fff":T.tm,fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed",transition:"all .2s" }}>
            ✅ 저장 후 시작
          </button>
        </div>
        <div style={{ fontSize:10,color:T.tm,textAlign:"center",marginTop:10 }}>키는 브라우저에만 저장 · 외부 전송 없음</div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
export default function TrendRadarV5() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [tab, setTab] = useState("trends");
  const [cat, setCat] = useState("all");
  const [srcF, setSrcF] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [aL, setAL] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [sL, setSL] = useState(false);
  const [script, setScript] = useState(null);
  const [pipe, setPipe] = useState(()=>{
    try{
      const saved = typeof window!=="undefined"?localStorage.getItem("tr_pipeline"):null;
      return saved?JSON.parse(saved):[];
    }catch{return [];}
  });
  const [auto, setAuto] = useState(true);
  const [fStatus, setFStatus] = useState({});
  const [apiKey, setApiKey] = useState(()=>typeof window!=="undefined"?localStorage.getItem("tr_claude_key")||"":"");
  const [showApiModal, setShowApiModal] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [apiError, setApiError] = useState("");
  // 유튜브 벤치마킹
  const [ytKeyword, setYtKeyword] = useState("");
  const [ytVideos, setYtVideos] = useState([
    {id:1,title:"",channel:"",views:"",likes:"",uploadDate:""},
    {id:2,title:"",channel:"",views:"",likes:"",uploadDate:""},
    {id:3,title:"",channel:"",views:"",likes:"",uploadDate:""},
  ]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResult, setYtResult] = useState(null);
  const [ytError, setYtError] = useState("");
  // 교차 분석
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossResult, setCrossResult] = useState(null);
  const [crossError, setCrossError] = useState("");
  // 채널 분석
  const [chTab, setChTab] = useState(0);
  const [channels, setChannels] = useState([
    {id:1,name:"",url:"",subscribers:"",topics:"",recentVideos:[{title:"",views:"",date:""},{title:"",views:"",date:""},{title:"",views:"",date:""}]},
    {id:2,name:"",url:"",subscribers:"",topics:"",recentVideos:[{title:"",views:"",date:""},{title:"",views:"",date:""},{title:"",views:"",date:""}]},
    {id:3,name:"",url:"",subscribers:"",topics:"",recentVideos:[{title:"",views:"",date:""},{title:"",views:"",date:""},{title:"",views:"",date:""}]},
  ]);
  const [chLoading, setChLoading] = useState(false);
  const [chResults, setChResults] = useState({});
  const [chError, setChError] = useState("");
  // 드라마 프롬프트 생성
  const [dramaLoading, setDramaLoading] = useState(false);
  const [dramaResult, setDramaResult] = useState(null);
  const [dramaError, setDramaError] = useState("");
  const [dramaVideo, setDramaVideo] = useState(null);
  const [showDramaModal, setShowDramaModal] = useState(false);
  const [dramaStyle, setDramaStyle] = useState("shortform"); // shortform | longform | vlog | tutorial | interview
  const timer = useRef(null);
  const analysisRef = useRef(null);

  const fetchAll = useCallback(async(showL=true)=>{
    if(showL) setLoading(true);
    const st={};
    const mk=(k,r)=>{st[k]={ok:r.length>0,n:r.length};};
    const [hn,rd,gKR,gUS,gGL,nv,ph,gh,ytKR,ytCH] = await Promise.all([
      fetchHN().then(r=>{mk("hackernews",r);return r;}),
      fetchRD().then(r=>{mk("reddit",r);return r;}),
      fetchGT("KR","google_kr").then(r=>{mk("google_kr",r);return r;}),
      fetchGT("US","google_us").then(r=>{mk("google_us",r);return r;}),
      fetchGT("","google_gl").then(r=>{mk("google_gl",r);return r;}),
      fetchNaver().then(r=>{mk("naver",r);return r;}),
      fetchPH().then(r=>{mk("producthunt",r);return r;}),
      fetchGH().then(r=>{mk("github",r);return r;}),
      fetchYTTrending().then(r=>{mk("youtube_kr",r);return r;}),
      fetchYTChannels().then(r=>{mk("youtube_ch",r);return r;}),
    ]);
    const all=[...hn,...rd,...gKR,...gUS,...gGL,...nv,...ph,...gh,...ytKR,...ytCH];
    const scored=all.map(item=>{
      const age=(Date.now()-item.time)/3600000;
      const ts2=scoreItem(item);
      return{...item,trendScore:ts2,category:classify(item.title),heat:heatOf(ts2,age),ageLabel:timeAgo(item.time)};
    }).sort((a,b)=>b.trendScore-a.trendScore);
    setTrends(scored);
    setLastRefresh(new Date());
    setFStatus(st);
    setLoading(false);
    setWorkflowStep(1);
  },[]);

  useEffect(()=>{fetchAll();return()=>clearInterval(timer.current);},[]);
  useEffect(()=>{
    try{localStorage.setItem("tr_pipeline",JSON.stringify(pipe));}catch{}
  },[pipe]);
  useEffect(()=>{
    clearInterval(timer.current);
    if(auto) timer.current=setInterval(()=>fetchAll(false),5*60*1000);
    return()=>clearInterval(timer.current);
  },[auto,fetchAll]);

  const filtered = trends.filter(t2=>{
    if(cat!=="all"&&t2.category!==cat) return false;
    if(srcF!=="all"&&t2.source!==srcF) return false;
    if(q&&!t2.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats={
    total:trends.length,
    exp:trends.filter(t2=>t2.heat==="explosive").length,
    rise:trends.filter(t2=>t2.heat==="rising").length,
    src:Object.keys(fStatus).filter(k=>fStatus[k]?.ok).length,
    ytOk:!!(fStatus.youtube_kr?.ok||fStatus.youtube_ch?.ok),
  };

  /* ── AI 분석 — 서버 API 경유 ── */
  const analyze = useCallback(async(trend)=>{
    if(!apiKey){setShowApiModal(true);return;}
    setSel(trend);setAL(true);setAnalysis(null);setScript(null);setApiError("");
    setWorkflowStep(2);
    setTimeout(()=>analysisRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"analyze",trend,apiKey}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"분석 실패");
      setAnalysis(data.result||JSON.parse(data.raw||"{}"));
      setWorkflowStep(2);
    }catch(e){
      setAnalysis({error:true});
      setApiError(e.message||"분석 실패");
    }
    setAL(false);
  },[apiKey]);

  /* ── 대본 생성 — 서버 API 경유 ── */
  const genScript = useCallback(async(v)=>{
    if(!apiKey){setShowApiModal(true);return;}
    setSL(true);setScript(null);setApiError("");
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"script",video:v,apiKey}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"대본 생성 실패");
      setScript(data.result||JSON.parse(data.raw||"{}"));
    }catch(e){
      setScript({error:true});
      setApiError(e.message||"대본 생성 실패");
    }
    setSL(false);
  },[apiKey]);

  /* ── 유튜브 벤치마킹 분석 ── */
  /* ── 교차 분석 — 트렌드 vs 유튜브 핵심 기능 ── */
  const runCrossAnalysis = useCallback(async()=>{
    if(!apiKey){setShowApiModal(true);return;}
    if(!analysis||!ytResult){
      setCrossError("트렌드 AI 분석과 유튜브 벤치마킹 분석을 모두 완료해야 합니다.");
      return;
    }
    setCrossLoading(true);setCrossResult(null);setCrossError("");
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:"cross_analysis",
          trendAnalysis:{...analysis, title:sel?.title||"", tags:analysis.tags||[]},
          ytAnalysis:{...ytResult, keyword:ytKeyword},
          apiKey
        }),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"교차 분석 실패");
      setCrossResult(data.result||JSON.parse(data.raw||"{}"));
      setWorkflowStep(4);
      setTab("pipeline");
    }catch(e){
      setCrossError(e.message||"교차 분석 실패");
    }
    setCrossLoading(false);
  },[apiKey,analysis,ytResult,ytKeyword,sel]);

  /* ── 채널 분석 ── */
  const analyzeChannel = useCallback(async(idx)=>{
    if(!apiKey){setShowApiModal(true);return;}
    const ch = channels[idx];
    if(!ch.name.trim()){setChError("채널명을 입력해주세요.");return;}
    setChLoading(true);setChError("");
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"channel_analysis",channel:ch,apiKey}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"채널 분석 실패");
      setChResults(prev=>({...prev,[idx]:data.result||{}}));
      setWorkflowStep(4);
    }catch(e){
      setChError(e.message||"채널 분석 실패");
    }
    setChLoading(false);
  },[apiKey,channels]);

  /* ── 드라마 프롬프트 생성 ── */
  const genDramaPrompt = useCallback(async(v)=>{
    if(!apiKey){setShowApiModal(true);return;}
    setDramaLoading(true);setDramaResult(null);setDramaError("");
    setDramaVideo(v);setShowDramaModal(true);
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:"drama_prompt",
          video:{...v, angle:analysis?.angle||""},
          style:dramaStyle,
          apiKey
        }),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"드라마 프롬프트 생성 실패");
      setDramaResult(data.result||{});
    }catch(e){
      setDramaError(e.message||"생성 실패");
    }
    setDramaLoading(false);
  },[apiKey,analysis]);

  const benchmarkYoutube = useCallback(async()=>{
    if(!apiKey){setShowApiModal(true);return;}
    const validVideos = ytVideos.filter(v=>v.title.trim());
    if(!ytKeyword.trim()||validVideos.length<1){
      setYtError("키워드와 영상 정보를 최소 1개 이상 입력해주세요.");
      return;
    }
    setYtLoading(true);setYtResult(null);setYtError("");
    try{
      const res = await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"youtube_benchmark",keyword:ytKeyword,videos:validVideos,apiKey}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"벤치마킹 분석 실패");
      setYtResult(data.result||JSON.parse(data.raw||"{}"));
      setWorkflowStep(3);
      setTab("cross");
    }catch(e){
      setYtError(e.message||"분석 실패");
    }
    setYtLoading(false);
  },[apiKey,ytKeyword,ytVideos]);

  const addPipe=(trend,v)=>{
    setPipe(p=>[...p,{id:Date.now(),trend:trend.title,video:v.title,format:v.format,stage:"discovered",added:new Date().toLocaleString("ko-KR"),score:trend.trendScore}]);
    setWorkflowStep(4);
  };
  const moveStage=(id,st2)=>setPipe(p=>p.map(i=>i.id===id?{...i,stage:st2}:i));
  const rmPipe=(id)=>setPipe(p=>p.filter(i=>i.id!==id));
  const saveApiKey=(key)=>{localStorage.setItem("tr_claude_key",key);setApiKey(key);setShowApiModal(false);};

  return(<>
    <Head>
      <title>Trend Radar v5 — AI 콘텐츠 파이프라인</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    </Head>
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.f}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes liveDot{0%,100%{box-shadow:0 0 0 0 ${T.g}60}50%{box-shadow:0 0 0 7px ${T.g}00}}
        *{box-sizing:border-box;margin:0;scrollbar-width:thin;scrollbar-color:${T.ba} transparent}
        input:focus,button:focus{outline:none}
        body{margin:0;background:${T.bg}}
        button:hover{filter:brightness(1.1)}
        a{color:inherit;text-decoration:none}
      `}</style>

      {showApiModal&&<ApiKeyModal onSave={saveApiKey} onSkip={()=>setShowApiModal(false)}/>}

      {/* ══ 드라마 프롬프트 모달 ══ */}
      {showDramaModal&&(
        <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
          <div style={{background:T.s,border:`1px solid ${T.ro}40`,borderRadius:18,width:"100%",maxWidth:560,animation:"fadeUp .3s ease",marginTop:20}}>

            {/* 헤더 */}
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.ro}15,transparent)`}}>
              <span style={{fontSize:22}}>🎬</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:T.t}}>AI 영상 제작 프롬프트</div>
                <div style={{fontSize:11,color:T.ts,marginTop:2}}>Gems · Vrew · CapCut · Veo 등 어떤 도구에도 사용 가능</div>
              </div>
              <button onClick={()=>setShowDramaModal(false)} style={{width:28,height:28,borderRadius:7,background:T.c,border:`1px solid ${T.b}`,color:T.ts,cursor:"pointer",fontSize:14}}>✕</button>
            </div>

            <div style={{padding:16}}>

              {/* ── 스타일 선택 탭 ── */}
              {!dramaResult&&!dramaLoading&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:8}}>영상 스타일 선택</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[
                      {id:"shortform", icon:"⚡", label:"숏폼", desc:"60초 · 9컷 임팩트"},
                      {id:"longform",  icon:"🎞️", label:"롱폼", desc:"10분 · 깊이있는 스토리"},
                      {id:"vlog",      icon:"📹", label:"브이로그", desc:"일상 · 자연스러운 연출"},
                      {id:"tutorial",  icon:"📚", label:"튜토리얼", desc:"단계별 · 교육 콘텐츠"},
                      {id:"interview", icon:"🎙️", label:"인터뷰", desc:"대화 · 인사이트 전달"},
                      {id:"drama",     icon:"🎭", label:"드라마", desc:"PSA · 감성 스토리텔링"},
                    ].map(s=>(
                      <button key={s.id} onClick={()=>setDramaStyle(s.id)}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:`2px solid ${dramaStyle===s.id?T.ro+"80":T.b}`,background:dramaStyle===s.id?`${T.ro}12`:T.c,cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                        <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:dramaStyle===s.id?T.ro:T.t}}>{s.label}</div>
                          <div style={{fontSize:10,color:T.ts}}>{s.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={()=>{
                      setDramaLoading(true);setDramaResult(null);setDramaError("");
                      fetch("/api/analyze",{
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({type:"drama_prompt",video:{...dramaVideo,angle:analysis?.angle||""},style:dramaStyle,apiKey}),
                      }).then(r=>r.json()).then(data=>{
                        if(data.error) throw new Error(data.error);
                        setDramaResult(data.result||{});
                      }).catch(e=>setDramaError(e.message||"생성 실패"))
                      .finally(()=>setDramaLoading(false));
                    }}
                    style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${T.ro},${T.ac})`,border:"none",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",marginTop:12}}>
                    🎬 {["shortform","longform","vlog","tutorial","interview","drama"].includes(dramaStyle)
                      ? {shortform:"숏폼",longform:"롱폼",vlog:"브이로그",tutorial:"튜토리얼",interview:"인터뷰",drama:"드라마"}[dramaStyle]
                      : ""} 프롬프트 생성 시작!
                  </button>
                </div>
              )}

              {dramaLoading&&(
                <div style={{textAlign:"center",padding:40}}>
                  <Spin s={32} c={T.ro}/>
                  <div style={{marginTop:14,fontSize:14,fontWeight:700,color:T.t,animation:"pulse 1.5s infinite"}}>9컷 스토리보드 생성중...</div>
                  <div style={{marginTop:6,fontSize:11,color:T.ts}}>이미지 · 영상 프롬프트까지 자동 생성돼요</div>
                </div>
              )}
              {dramaError&&<div style={{padding:12,background:T.rd,borderRadius:9,fontSize:12,color:T.r}}>{dramaError}</div>}

              {dramaResult&&!dramaLoading&&(()=>{
                const r = dramaResult;

                // 이미지 프롬프트 모아서 텍스트 생성
                const imagePrompts = (r.cuts||[]).map((c,i)=>`Cut ${c.cut||i+1}: ${c.image_prompt||""}`).join('
');
                const videoPrompts = (r.cuts||[]).map((c,i)=>`Cut ${c.cut||i+1}: ${c.video_prompt||""}`).join('
');
                const fullScript = [
                  `🎬 ${dramaVideo?.title||""}`,
                  `📖 로그라인: ${r.logline||""}`,
                  `💡 핵심 메시지: ${r.core_message||""}`,
                  ``,
                  `=== 등장인물 ===`,
                  ...(r.characters||[]).map(c=>`• ${c.name} (${c.age}) — ${c.personality}`),
                  ``,
                  `=== 9컷 스토리보드 ===`,
                  ...(r.cuts||[]).map(c=>`[Cut ${c.cut}] ${c.scene}
${c.dialogue?"대사: "+c.dialogue:""}`),
                ].join('
');

                return (
                  <div>
                    {/* 스타일 배지 + 다시 선택 */}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <span style={{fontSize:11,padding:"4px 10px",borderRadius:12,background:`${T.ro}15`,border:`1px solid ${T.ro}40`,color:T.ro,fontWeight:700}}>
                        { {shortform:"⚡ 숏폼",longform:"🎞️ 롱폼",vlog:"📹 브이로그",tutorial:"📚 튜토리얼",interview:"🎙️ 인터뷰",drama:"🎭 드라마"}[r.style||dramaStyle] || "🎬 영상" }
                      </span>
                      <button onClick={()=>{setDramaResult(null);setDramaError("");}}
                        style={{marginLeft:"auto",fontSize:10,padding:"4px 10px",borderRadius:8,background:T.c,border:`1px solid ${T.b}`,color:T.ts,cursor:"pointer"}}>
                        ↩ 스타일 다시 선택
                      </button>
                    </div>

                    {/* 로그라인 */}
                    <div style={{background:`${T.ro}0a`,border:`1px solid ${T.ro}30`,borderRadius:10,padding:12,marginBottom:12}}>
                      <div style={{fontSize:10,color:T.ro,fontFamily:T.m,fontWeight:700,marginBottom:4}}>📖 로그라인</div>
                      <div style={{fontSize:13,fontWeight:700,lineHeight:1.6}}>{r.logline}</div>
                    </div>

                    {/* 핵심 메시지 */}
                    {r.core_message&&(
                      <div style={{background:T.c,borderRadius:9,padding:10,marginBottom:12}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:3}}>💡 핵심 메시지</div>
                        <div style={{fontSize:12,color:T.t}}>{r.core_message}</div>
                      </div>
                    )}

                    {/* 등장인물 */}
                    {(r.characters||[]).length>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>👥 등장인물</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {r.characters.map((c,i)=>(
                            <div key={i} style={{background:T.c,borderRadius:8,padding:"8px 10px",flex:1,minWidth:120}}>
                              <div style={{fontSize:12,fontWeight:700,color:T.t}}>{c.name} <span style={{color:T.ts,fontWeight:400}}>({c.age})</span></div>
                              <div style={{fontSize:10,color:T.ts,marginTop:2}}>{c.personality}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 9컷 스토리보드 */}
                    <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>🎬 9컷 스토리보드</div>
                    {(r.cuts||[]).map((c,i)=>(
                      <div key={i} style={{background:T.c,borderRadius:8,padding:10,marginBottom:5,borderLeft:`3px solid ${T.ro}50`}}>
                        <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                          <span style={{fontSize:10,fontWeight:800,color:T.ro,fontFamily:T.m,flexShrink:0,marginTop:1}}>Cut {c.cut}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,color:T.t,lineHeight:1.5}}>{c.scene}</div>
                            {c.dialogue&&<div style={{fontSize:11,color:T.cy,fontStyle:"italic",marginTop:3}}>"{c.dialogue}"</div>}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 편집 가이드 */}
                    {r.editing_guide&&(
                      <div style={{background:T.c,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:8}}>🛠️ 제작 가이드</div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {r.editing_guide.vrew&&<div style={{fontSize:11}}><span style={{color:"#818cf8",fontWeight:700}}>Vrew:</span> {r.editing_guide.vrew}</div>}
                          {r.editing_guide.capcut&&<div style={{fontSize:11}}><span style={{color:"#00d4aa",fontWeight:700}}>CapCut:</span> {r.editing_guide.capcut}</div>}
                          {r.editing_guide.subtitle_style&&<div style={{fontSize:11}}><span style={{color:T.am,fontWeight:700}}>자막:</span> {r.editing_guide.subtitle_style}</div>}
                        </div>
                      </div>
                    )}

                    {/* 제작 도구별 복사 버튼 */}
                    <div style={{marginTop:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.t,marginBottom:8}}>📋 도구별 복사</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        <button onClick={()=>navigator.clipboard.writeText(fullScript).then(()=>alert("✅ 전체 대본이 복사됐어요!
Gems에 붙여넣기 하세요."))}
                          style={{padding:"9px",borderRadius:8,background:"#4285f410",border:"1px solid #4285f440",color:"#4285f4",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          💎 Gems용 복사
                        </button>
                        <button onClick={()=>navigator.clipboard.writeText(imagePrompts).then(()=>alert("✅ 이미지 프롬프트 복사!
Imagen/Midjourney에 붙여넣기 하세요."))}
                          style={{padding:"9px",borderRadius:8,background:"#ff660010",border:"1px solid #ff660040",color:"#ff8800",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          🖼️ 이미지 프롬프트
                        </button>
                        <button onClick={()=>navigator.clipboard.writeText(videoPrompts).then(()=>alert("✅ 영상 프롬프트 복사!
Veo/Runway에 붙여넣기 하세요."))}
                          style={{padding:"9px",borderRadius:8,background:"#00d4aa10",border:"1px solid #00d4aa40",color:"#00d4aa",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          🎬 Veo/Runway용
                        </button>
                        <button onClick={()=>navigator.clipboard.writeText(fullScript).then(()=>alert("✅ 대본 복사!
Vrew에 붙여넣기 하세요."))}
                          style={{padding:"9px",borderRadius:8,background:"#5b5bd610",border:"1px solid #5b5bd640",color:"#818cf8",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          ✂️ Vrew용 복사
                        </button>
                      </div>

                      {/* 도구 바로가기 */}
                      <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>
                        {[
                          {label:"Gemini Gems",url:"https://gemini.google.com/gems",color:"#4285f4"},
                          {label:"Vrew",url:"https://vrew.ai",color:"#818cf8"},
                          {label:"CapCut",url:"https://capcut.com",color:"#00d4aa"},
                          {label:"YouTube Studio",url:"https://studio.youtube.com",color:"#ff4444"},
                        ].map(t=>(
                          <a key={t.label} href={t.url} target="_blank" rel="noreferrer"
                            style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:700,textDecoration:"none",background:`${t.color}10`,border:`1px solid ${t.color}30`,color:t.color}}>
                            {t.label} →
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{padding:"14px 20px",borderBottom:`1px solid ${T.b}`,background:`${T.s}ee`,backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${T.ac},${T.cy})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#fff",boxShadow:`0 0 18px ${T.ac}40`}}>T</div>
          <div>
            <div style={{fontSize:16,fontWeight:900,letterSpacing:"-0.04em",display:"flex",alignItems:"center",gap:8}}>
              TREND RADAR
              <span style={{fontSize:11,fontFamily:T.m,color:T.r,fontWeight:700,background:T.rd,padding:"2px 6px",borderRadius:4}}>v6</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:T.g,fontFamily:T.m,fontWeight:700}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:T.g,animation:"liveDot 2s infinite",display:"inline-block"}}/>LIVE
              </span>
            </div>
            <div style={{fontSize:11,color:T.ts,fontFamily:T.m,marginTop:1}}>
              {lastRefresh?`갱신 ${lastRefresh.toLocaleTimeString("ko-KR")} · ${stats.total}개 · ${stats.src}/10 소스`:"데이터 수집중..."}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setShowApiModal(true)} style={{padding:"6px 12px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",border:`1px solid ${apiKey?T.gb:T.amb}`,background:apiKey?T.gd:T.amd,color:apiKey?T.g:T.am}}>
            {apiKey?"🟢 Claude 연결됨":"🟣 API 설정"}
          </button>
          <button onClick={()=>setAuto(!auto)} style={{padding:"6px 12px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",border:`1px solid ${auto?T.gb:T.ba}`,background:auto?T.gd:"transparent",color:auto?T.g:T.ts}}>
            {auto?"⏱ 자동갱신":"⏸ 수동"}
          </button>
          <button onClick={()=>fetchAll()} disabled={loading} style={{padding:"6px 14px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,opacity:loading?.5:1}}>
            {loading?"수집중...":"↻ 수집"}
          </button>
        </div>
      </header>

      {/* ── Workflow Bar ── */}
      <div style={{padding:"14px 20px",background:T.s,borderBottom:`1px solid ${T.b}`}}>
        <div style={{fontSize:10,fontFamily:T.m,color:T.tm,marginBottom:10,fontWeight:600,letterSpacing:".08em"}}>WORKFLOW — 콘텐츠 제작 파이프라인</div>
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          <WorkflowStep label="수집" icon="📡" active={workflowStep===0} done={workflowStep>0}/>
          <div style={{color:T.tm,fontSize:12,paddingBottom:16,flexShrink:0}}>›</div>
          <WorkflowStep label="AI분석" icon="🤖" active={workflowStep===1} done={workflowStep>1}/>
          <div style={{color:T.tm,fontSize:12,paddingBottom:16,flexShrink:0}}>›</div>
          <WorkflowStep label="유튜브" icon="📺" active={workflowStep===2} done={workflowStep>2}/>
          <div style={{color:T.tm,fontSize:12,paddingBottom:16,flexShrink:0}}>›</div>
          <WorkflowStep label="교차분석" icon="⚡" active={workflowStep===3} done={workflowStep>3}/>
          <div style={{color:T.tm,fontSize:12,paddingBottom:16,flexShrink:0}}>›</div>
          <WorkflowStep label="채널분석" icon="📊" active={workflowStep===4} done={workflowStep>4}/>
          <div style={{color:T.tm,fontSize:12,paddingBottom:16,flexShrink:0}}>›</div>
          <WorkflowStep label="파이프라인" icon="📋" active={workflowStep===5} done={false}/>
        </div>
        <div style={{fontSize:11,marginTop:8,textAlign:"center",fontWeight:600,
          color:workflowStep===0?T.ts:workflowStep===1?T.ac:workflowStep===2?T.cy:workflowStep===3?T.r:workflowStep===4?T.ro:T.g,
          animation:workflowStep===1||workflowStep===3?"pulse 1.5s infinite":"none"}}>
          {workflowStep===0&&"👆 트렌드 카드 클릭 → AI 분석 시작"}
          {workflowStep===1&&"🤖 Claude가 콘텐츠 기회를 분석중..."}
          {workflowStep===2&&"📺 유튜브 탭 → 경쟁 영상 분석하세요"}
          {workflowStep===3&&"⚡ 교차분석 탭 → 블루오션 각도를 찾으세요!"}
          {workflowStep===4&&"📊 채널분석 탭 → 경쟁 채널을 분석하세요"}
          {workflowStep===5&&"📋 파이프라인에 추가됐어요! 제작을 시작하세요 🎬"}
        </div>
      </div>

      {/* ── Source Status ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",borderBottom:`1px solid ${T.b}`,background:T.s2}}>
        {Object.entries(SRC).map(([k,v])=>{
          const st2=fStatus[k];
          return(
            <div key={k} onClick={()=>setSrcF(srcF===k?"all":k)}
              style={{padding:"10px 4px",borderRight:`1px solid ${T.b}`,textAlign:"center",cursor:"pointer",background:srcF===k?v.b:"transparent",transition:"all .2s"}}>
              <div style={{fontSize:18}}>{v.i}</div>
              <div style={{fontSize:16,fontFamily:T.m,fontWeight:800,color:st2?.ok?T.g:loading?T.am:T.r,marginTop:2}}>{st2?st2.n:"—"}</div>
              <div style={{fontSize:9,color:T.tm,fontFamily:T.m,marginTop:1}}>{v.l}</div>
            </div>
          );
        })}
      </div>

      {/* ── Stats Bar ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.b}`}}>
        {[{l:"전체 수집",v:stats.total,c:T.t},{l:"🔥 폭발",v:stats.exp,c:T.r},{l:"📈 상승",v:stats.rise,c:T.am},{l:"활성 소스",v:`${stats.src}/10`,c:T.ac}].map((s2,i)=>(
          <div key={i} style={{padding:"14px 10px",textAlign:"center",borderRight:i<3?`1px solid ${T.b}`:"none"}}>
            <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600}}>{s2.l}</div>
            <div style={{fontSize:28,fontWeight:900,color:s2.c,fontFamily:T.m,lineHeight:1.1,marginTop:4}}>{s2.v}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.b}`,background:T.s,overflowX:"auto"}}>
        {[
          {id:"trends",   l:"🔍 트렌드",      n:filtered.length},
          {id:"youtube",  l:"📺 유튜브",       n:null},
          {id:"cross",    l:"⚡ 교차분석",     n:null, hot:!!(analysis&&ytResult)},
          {id:"channel",  l:"📊 채널분석",     n:null},
          {id:"pipeline", l:"📋 파이프라인",   n:pipe.length},
        ].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{flex:"1 0 auto",padding:"12px 8px",background:"transparent",border:"none",borderBottom:tab===tb.id?`2px solid ${tb.id==="cross"?T.r:T.ac}`:"2px solid transparent",color:tab===tb.id?T.t:T.tm,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s",position:"relative",whiteSpace:"nowrap"}}>
            {tb.l}
            {tb.n!==null&&<span style={{fontFamily:T.m,fontSize:10,background:tab===tb.id?T.acd:T.c,padding:"1px 6px",borderRadius:10,marginLeft:3}}>{tb.n}</span>}
            {tb.hot&&<span style={{position:"absolute",top:6,right:4,width:7,height:7,borderRadius:"50%",background:T.r,animation:"pulse 1s infinite"}}/>}
          </button>
        ))}
      </div>

      {/* ══ TRENDS TAB ══ */}
      {tab==="trends"&&<div>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.b}`}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 키워드 검색..."
            style={{width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:9,padding:"10px 14px",color:T.t,fontSize:13}}/>
        </div>
        <div style={{display:"flex",gap:5,padding:"8px 16px",overflowX:"auto",borderBottom:`1px solid ${T.b}`}}>
          {CATS.map(c2=>(
            <button key={c2.id} onClick={()=>setCat(c2.id)}
              style={{padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:cat===c2.id?T.ac:T.c,color:cat===c2.id?"#fff":T.ts,whiteSpace:"nowrap",transition:"all .2s"}}>
              {c2.i} {c2.l}
            </button>
          ))}
        </div>

        {loading&&!trends.length&&(
          <div style={{padding:60,textAlign:"center"}}>
            <Spin s={32}/>
            <div style={{marginTop:16,fontSize:14,color:T.ts,animation:"pulse 1.5s infinite"}}>8개 소스에서 실시간 수집중...</div>
          </div>
        )}

        <div style={{padding:"10px 14px"}}>
          {filtered.slice(0,50).map((t2,idx)=>{
            const src=SRC[t2.source]||{};
            const ht=HEAT[t2.heat]||{};
            const isSel=sel?.id===t2.id;
            return(
              <div key={t2.id}
                style={{background:isSel?`linear-gradient(135deg,${T.ca},${T.c})`:T.c,border:`1px solid ${isSel?T.acb:T.b}`,borderLeft:`3px solid ${isSel?T.ac:ht.c||T.b}`,borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:"pointer",transition:"all .15s",animation:`fadeUp .3s ease ${idx*.012}s both`,boxShadow:isSel?`0 4px 20px ${T.ac}20`:"none"}}
                onClick={()=>analyze(t2)}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <ScoreBadge score={t2.trendScore}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:7,flexWrap:"wrap"}}>
                      <Pill color={ht.c}>{ht.l}</Pill>
                      <Pill color={src.c} bg={src.b}>{src.i} {src.l}</Pill>
                      {t2.sub&&<Pill color={T.tm}>r/{t2.sub}</Pill>}
                      {t2.traffic>0&&<Pill color={T.am}>{t2.traffic.toLocaleString()}+ 검색</Pill>}
                      {t2.stars>0&&<Pill color={T.am}>★{t2.stars.toLocaleString()}</Pill>}
                      <span style={{fontSize:10,color:T.tm,fontFamily:T.m,marginLeft:"auto"}}>{t2.ageLabel}</span>
                    </div>
                    <div style={{fontSize:15,fontWeight:700,lineHeight:1.5,marginBottom:6}}>{t2.title}</div>
                    {t2.tagline&&<div style={{fontSize:11,color:T.ts,marginBottom:6}}>{t2.tagline}</div>}
                    <Bar pct={t2.trendScore} color={t2.trendScore>=80?T.r:t2.trendScore>=55?T.am:T.g}/>
                    <div style={{display:"flex",gap:12,marginTop:6,fontSize:11,fontFamily:T.m,color:T.tm}}>
                      {t2.score>0&&<span>▲ {t2.score.toLocaleString()}</span>}
                      {t2.comments>0&&<span>💬 {t2.comments.toLocaleString()}</span>}
                      <span style={{marginLeft:"auto",color:T.ac,fontWeight:600}}>클릭 → AI 분석 시작</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading&&!filtered.length&&(
            <div style={{textAlign:"center",padding:48,color:T.tm}}>해당 조건에 맞는 트렌드가 없습니다</div>
          )}
        </div>

        {/* ── Analysis Panel ── */}
        {(aL||analysis)&&sel&&(
          <div ref={analysisRef} style={{margin:"0 14px 14px",background:T.s2,border:`1px solid ${T.acb}`,borderRadius:14,overflow:"hidden",animation:"fadeUp .25s ease"}}>
            <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.acd},transparent)`}}>
              <span style={{fontSize:22}}>🤖</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800}}>AI 콘텐츠 분석 <span style={{fontSize:10,color:"#4285f4",fontFamily:T.m,fontWeight:700,background:"#4285f415",padding:"2px 6px",borderRadius:4}}>Gemini</span></div>
                <div style={{fontSize:11,color:T.ts,fontFamily:T.m,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.title}</div>
              </div>
              {aL&&<Spin/>}
              <button onClick={()=>{setSel(null);setAnalysis(null);setScript(null);}} style={{width:28,height:28,borderRadius:7,background:T.c,border:`1px solid ${T.b}`,color:T.ts,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            {aL&&<div style={{padding:48,textAlign:"center"}}><Spin s={24}/><div style={{marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite"}}>Gemini가 분석중...</div></div>}
            {apiError&&<div style={{padding:16,margin:14,background:T.rd,borderRadius:9,fontSize:12,color:T.r}}>⚠️ {apiError}</div>}
            {analysis&&!analysis.error&&<div style={{padding:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                {[{l:"기회점수",v:`${analysis.opportunity}/10`,c:T.ac},{l:"경쟁강도",v:analysis.competition,c:T.t},{l:"시급성",v:analysis.urgency,c:analysis.urgency==="즉시"?T.r:T.am}].map((s2,i)=>(
                  <div key={i} style={{background:T.c,borderRadius:10,padding:"14px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600}}>{s2.l}</div>
                    <div style={{fontSize:20,fontWeight:900,color:s2.c,fontFamily:T.m,marginTop:4}}>{s2.v}</div>
                  </div>
                ))}
              </div>
              {analysis.summary_ko&&<div style={{background:T.c,borderRadius:10,padding:14,marginBottom:10}}><div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>📊 분석 요약</div><div style={{fontSize:13,lineHeight:1.7}}>{analysis.summary_ko}</div></div>}
              {analysis.angle&&<div style={{background:`${T.ac}0c`,border:`1px solid ${T.acb}`,borderRadius:10,padding:12,marginBottom:10}}><div style={{fontSize:10,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:4}}>💡 채널 앵글</div><div style={{fontSize:13,lineHeight:1.6}}>{analysis.angle}</div></div>}
              {analysis.best_time&&<div style={{background:T.amd,border:`1px solid ${T.amb}`,borderRadius:10,padding:12,marginBottom:14,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:18}}>⏰</span><div><div style={{fontSize:10,color:T.am,fontFamily:T.m,fontWeight:700}}>업로드 타이밍</div><div style={{fontSize:13,marginTop:2}}>{analysis.best_time}</div></div></div>}
              <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:700,marginBottom:8,letterSpacing:".05em"}}>🎬 영상 아이디어</div>
              {(analysis.videos||[]).map((v,i)=>(
                <div key={i} style={{background:T.c,border:`1px solid ${T.b}`,borderRadius:10,padding:14,marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:800,marginBottom:8}}>{v.title}</div>
                  <div style={{display:"flex",gap:5,marginBottom:12}}><Pill>{v.format}</Pill><Pill color={T.g}>예상 {v.views}</Pill></div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button onClick={e=>{e.stopPropagation();addPipe(sel,v);}} style={{flex:1,padding:"8px",borderRadius:8,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:11,fontWeight:700,cursor:"pointer"}}>📋 파이프라인</button>
                    <button onClick={e=>{e.stopPropagation();genScript(v);}} style={{flex:1,padding:"8px",borderRadius:8,background:T.gd,border:`1px solid ${T.gb}`,color:T.g,fontSize:11,fontWeight:700,cursor:"pointer"}}>✍️ 대본 생성</button>
                    <button onClick={e=>{e.stopPropagation();genDramaPrompt(v);}} style={{flex:1,padding:"8px",borderRadius:8,background:`${T.ro}15`,border:`1px solid ${T.ro}40`,color:T.ro,fontSize:11,fontWeight:700,cursor:"pointer"}}>🎬 드라마 프롬프트</button>
                  </div>
                </div>
              ))}
              {analysis.tags&&(
                <div style={{marginTop:12}}>
                  <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>🏷️ 검색 태그</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{analysis.tags.map((tg,i)=><Pill key={i} color={T.ac} bg={T.acd}>{tg}</Pill>)}</div>
                </div>
              )}
              {/* 유튜브 벤치마킹 연결 버튼 */}
              <div style={{marginTop:14,background:`${T.cy}08`,border:`1px solid ${T.cyb}`,borderRadius:10,padding:12}}>
                <div style={{fontSize:11,color:T.cy,fontFamily:T.m,fontWeight:700,marginBottom:6}}>📺 다음 단계 — 유튜브 벤치마킹</div>
                <div style={{fontSize:11,color:T.ts,marginBottom:10,lineHeight:1.6}}>
                  아래 키워드로 유튜브를 검색하고, 상위 영상 정보를 벤치마킹 탭에 입력하면 경쟁 분석이 완성돼요.
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {/* 트렌드 제목에서 핵심 키워드 추출 */}
                  {sel&&[
                    sel.title.split(/[\s:–\-|]+/).slice(0,3).join(" "),
                    ...(analysis.tags||[]).slice(0,2).map(t=>t.replace("#",""))
                  ].filter((k,i,a)=>k&&a.indexOf(k)===i).slice(0,3).map((kw,i)=>(
                    <button key={i} onClick={()=>{
                      setYtKeyword(kw);
                      setTab("youtube");
                    }} style={{padding:"5px 12px",borderRadius:16,fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${T.cyb}`,background:T.cyd,color:T.cy}}>
                      🔍 "{kw}"
                    </button>
                  ))}
                </div>
                <button onClick={()=>{
                  if(sel) setYtKeyword(sel.title.split(/[\s:–\-|]+/).slice(0,3).join(" "));
                  setTab("youtube");
                }} style={{width:"100%",padding:"9px",borderRadius:8,background:T.cyd,border:`1px solid ${T.cyb}`,color:T.cy,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  📺 유튜브 벤치마킹 탭으로 이동 →
                </button>
              </div>
            </div>}
          </div>
        )}

        {/* ── Script Panel ── */}
        {(sL||script)&&(
          <div style={{margin:"0 14px 14px",background:T.s2,border:`1px solid ${T.gb}`,borderRadius:14,overflow:"hidden",animation:"fadeUp .25s ease"}}>
            <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.gd},transparent)`}}>
              <span style={{fontSize:22}}>✍️</span>
              <div style={{fontSize:14,fontWeight:800}}>AI 대본 초안</div>
              {sL&&<div style={{marginLeft:"auto"}}><Spin c={T.g}/></div>}
            </div>
            {sL&&<div style={{padding:48,textAlign:"center"}}><Spin s={24} c={T.g}/><div style={{marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite"}}>대본 생성중...</div></div>}
            {script&&!script.error&&<div style={{padding:16}}>
              {script.hook&&<div style={{background:`${T.ac}0c`,border:`1px solid ${T.acb}`,borderRadius:10,padding:14,marginBottom:12}}><div style={{fontSize:10,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:6}}>🎯 오프닝 후킹 (15초)</div><div style={{fontSize:14,lineHeight:1.7,fontStyle:"italic"}}>"{script.hook}"</div></div>}
              {(script.sections||[]).map((sec,i)=>(
                <div key={i} style={{display:"flex",gap:12,marginBottom:6,padding:"12px 14px",background:T.c,borderRadius:9,border:`1px solid ${T.b}`}}>
                  <div style={{flexShrink:0,minWidth:52}}>
                    <div style={{fontSize:11,color:T.ac,fontFamily:T.m,fontWeight:700}}>{sec.ts}</div>
                    <div style={{fontSize:12,fontWeight:800,marginTop:2}}>{sec.name}</div>
                  </div>
                  <div style={{fontSize:12,color:T.ts,lineHeight:1.6,borderLeft:`2px solid ${T.b}`,paddingLeft:12}}>{sec.desc}</div>
                </div>
              ))}
              {script.desc&&<div style={{background:T.c,borderRadius:9,padding:12,marginTop:10}}><div style={{fontSize:10,color:T.tm,fontFamily:T.m,fontWeight:600,marginBottom:4}}>📝 영상 설명문</div><div style={{fontSize:12,lineHeight:1.6,color:T.ts}}>{script.desc}</div></div>}

              {/* ── 범용 프롬프트 생성기 & 제작 도구 연결 ── */}
              {(()=>{
                // 공통 대본 텍스트 생성 함수
                const makeScriptText = () => [
                  `영상 주제: ${sel?.title||""}`,
                  `채널 앵글: ${analysis?.angle||""}`,
                  ``,
                  `[오프닝 후킹 - 15초]`,
                  `"${script.hook||""}"`,
                  ``,
                  `[영상 구성]`,
                  ...(script.sections||[]).map(s=>`${s.ts} ${s.name}: ${s.desc}`),
                  ``,
                  `[영상 설명문]`,
                  script.desc||"",
                  ``,
                  `[SEO 키워드]`,
                  (script.seo||[]).join(", ")
                ].join("
");

                // 도구별 프롬프트 생성
                const prompts = {
                  gems: `# 역할
당신은 한국 직장인 20-40대를 위한 AI × 자기계발 유튜브 채널의 영상 제작 전문가입니다.

# 작업 지시
아래 대본 초안을 바탕으로 다음을 생성해주세요:
1. PSA(공익광고) 스타일의 9컷 스토리보드
2. 각 컷별 이미지 생성 프롬프트 (영어)
3. 각 컷별 영상 생성 프롬프트 (Veo용)

# 핵심 규칙
- 밝고 따뜻한 톤 유지 (햇빛이 비치는 장면 선호)
- 한국적 정서와 직장인 공감대 반영
- 이미지 프롬프트: 텍스트/자막 지시 절대 금지
- 영상 프롬프트: "Strictly NO background music. Clean voices and natural ambient SFX only."

# 대본 초안
${makeScriptText()}`,

                  vrew: `# Vrew AI 영상 제작 지시

아래 대본을 Vrew에서 영상으로 제작합니다.

## 영상 기본 설정
- 형식: 유튜브 롱폼 (16:9)
- 톤: 밝고 따뜻한 한국 직장인 라이프스타일
- 자막: 자동 생성 후 검토

## 대본
${makeScriptText()}

## 제작 체크리스트
□ 오프닝 후킹 영상 (0-15초)
□ 각 섹션별 B-roll 영상
□ 자막 스타일 통일
□ BGM 추가 (저작권 무료)
□ 엔딩 CTA 화면`,

                  capcut: `# CapCut 편집 가이드

## 영상 정보
주제: ${sel?.title||""}
타겟: 한국 직장인 20-40대

## 편집 순서
${(script.sections||[]).map((s,i)=>`${i+1}. [${s.ts}] ${s.name}
   - ${s.desc}
   - 추천 효과: 자연스러운 컷 편집`).join("
")}

## 썸네일 키워드
${(script.seo||[]).join(" | ")}

## CapCut 추천 설정
- 화면비: 16:9
- 색감: 따뜻한 톤 (노출 +5, 채도 +10)
- 자막: 굵은 흰색 + 검정 테두리`,

                  imagen: `# Gemini Imagen 캐릭터 레퍼런스 생성

## 주인공 설정
채널: AI × 자기계발 (한국 직장인 대상)
영상 주제: ${sel?.title||""}

## 이미지 생성 프롬프트
A professional Korean office worker in their 30s, wearing smart casual business attire, neutral calm expression, in a bright modern Korean office with warm sunlight streaming in. Hyper-realistic, 8K ultra-high resolution, cinematic film grain, zero AI plasticky texture. --ar 16:9

## 6패널 레이아웃 요청
위 이미지를 기반으로 6패널 캐릭터 레퍼런스 시트를 생성해주세요:
- 상단: 정면/45도 클로즈업
- 중간: 전신 앞/뒤 (세로 패널)
- 하단: 90도 측면/반대 45도`
                };

                const [activePT, setActivePT] = React.useState(null);
                const [copied, setCopied] = React.useState(false);

                const copyPrompt = (type) => {
                  navigator.clipboard.writeText(prompts[type]).then(()=>{
                    setCopied(type);
                    setTimeout(()=>setCopied(false), 2000);
                  });
                };

                const TOOLS = [
                  {id:"gems", icon:"💎", name:"Gemini Gems", desc:"9컷 스토리보드 + 이미지/영상 프롬프트", color:"#4285f4", url:"https://gemini.google.com/gems"},
                  {id:"vrew", icon:"🎬", name:"Vrew", desc:"AI 영상편집 + 자막 자동생성", color:"#818cf8", url:"https://vrew.ai"},
                  {id:"capcut", icon:"✂️", name:"CapCut", desc:"편집 가이드 + 효과 설정", color:"#00d4aa", url:"https://www.capcut.com"},
                  {id:"imagen", icon:"🖼️", name:"Imagen/Veo", desc:"캐릭터 레퍼런스 + 영상생성", color:"#fb7185", url:"https://aitestkitchen.withgoogle.com"},
                ];

                return (
                  <div style={{marginTop:16}}>
                    {/* 헤더 */}
                    <div style={{background:`${T.am}08`,border:`1px solid ${T.amb}`,borderRadius:12,padding:14,marginBottom:10}}>
                      <div style={{fontSize:12,fontWeight:800,color:T.am,marginBottom:4}}>🚀 제작 도구 프롬프트 생성기</div>
                      <div style={{fontSize:11,color:T.ts,lineHeight:1.6}}>
                        도구를 선택하면 해당 도구에 최적화된 프롬프트가 자동 생성돼요.<br/>
                        복사 후 원하는 도구에 붙여넣기하면 바로 사용 가능해요!
                      </div>
                    </div>

                    {/* 도구 선택 버튼 */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                      {TOOLS.map(tool=>(
                        <button key={tool.id} onClick={()=>setActivePT(activePT===tool.id?null:tool.id)}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:9,
                            background:activePT===tool.id?`${tool.color}20`:`${tool.color}08`,
                            border:`1px solid ${activePT===tool.id?tool.color:tool.color+"30"}`,
                            cursor:"pointer",transition:"all .2s",textAlign:"left"}}>
                          <span style={{fontSize:18,flexShrink:0}}>{tool.icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:tool.color}}>{tool.name}</div>
                            <div style={{fontSize:10,color:T.ts,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tool.desc}</div>
                          </div>
                          <span style={{color:tool.color,fontSize:11,flexShrink:0}}>{activePT===tool.id?"▼":"→"}</span>
                        </button>
                      ))}
                    </div>

                    {/* 프롬프트 미리보기 + 복사 */}
                    {activePT&&(()=>{
                      const tool = TOOLS.find(t=>t.id===activePT);
                      return (
                        <div style={{background:T.c,border:`1px solid ${tool.color}30`,borderRadius:10,padding:12,marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <div style={{fontSize:11,fontWeight:700,color:tool.color}}>{tool.icon} {tool.name} 프롬프트</div>
                            <a href={tool.url} target="_blank" rel="noreferrer"
                              style={{fontSize:10,color:tool.color,textDecoration:"none",background:`${tool.color}10`,padding:"3px 8px",borderRadius:5,border:`1px solid ${tool.color}30`}}>
                              도구 열기 →
                            </a>
                          </div>
                          <div style={{background:T.s2,borderRadius:7,padding:10,maxHeight:160,overflowY:"auto",marginBottom:8}}>
                            <pre style={{fontSize:10,color:T.ts,lineHeight:1.6,margin:0,whiteSpace:"pre-wrap",fontFamily:T.m}}>{prompts[activePT]}</pre>
                          </div>
                          <button onClick={()=>copyPrompt(activePT)}
                            style={{width:"100%",padding:"9px",borderRadius:8,
                              background:copied===activePT?T.gd:`${tool.color}15`,
                              border:`1px solid ${copied===activePT?T.gb:tool.color+"40"}`,
                              color:copied===activePT?T.g:tool.color,
                              fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
                            {copied===activePT?"✅ 복사됨! 도구에 붙여넣기 하세요":"📋 프롬프트 복사"}
                          </button>
                        </div>
                      );
                    })()}

                    {/* YouTube Studio 바로가기 */}
                    <a href="https://studio.youtube.com" target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:9,background:"#ff000008",border:"1px solid #ff000030",textDecoration:"none"}}>
                      <span style={{fontSize:16}}>📺</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#ff4444"}}>YouTube Studio</div>
                        <div style={{fontSize:10,color:T.ts}}>완성된 영상 업로드 + 채널 관리</div>
                      </div>
                      <span style={{marginLeft:"auto",color:"#ff4444",fontSize:11}}>→</span>
                    </a>
                  </div>
                );
              })()}
            </div>}
          </div>
        )}
      </div>}

      {/* ══ YOUTUBE BENCHMARKING TAB ══ */}
      {tab==="youtube"&&(
        <div style={{padding:16,animation:"fadeUp .3s ease"}}>

          {/* 키워드 + 유튜브 바로가기 */}
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <input
                value={ytKeyword}
                onChange={e=>setYtKeyword(e.target.value)}
                placeholder="분석 키워드 입력..."
                style={{flex:1,background:T.c,border:`1px solid ${ytKeyword?T.cyb:T.b}`,borderRadius:9,padding:"10px 14px",color:T.t,fontSize:13,boxSizing:"border-box"}}
              />
              {ytKeyword&&(
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ytKeyword)}&sp=EgIIBQ%253D%253D`}
                  target="_blank" rel="noreferrer"
                  style={{flexShrink:0,padding:"10px 14px",borderRadius:9,background:T.cyd,border:`1px solid ${T.cyb}`,color:T.cy,fontSize:12,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>
                  🔴 유튜브 검색 →
                </a>
              )}
            </div>
            {!ytKeyword&&<div style={{fontSize:11,color:T.tm,fontFamily:T.m}}>💡 트렌드 탭 AI 분석 후 키워드 버튼 클릭 → 자동 입력</div>}
            {ytKeyword&&<div style={{fontSize:10,color:T.tm}}>(최근 1개월 · 조회수순으로 열려요)</div>}
          </div>

          {/* 빠른 입력 안내 */}
          <div style={{background:`${T.am}08`,border:`1px solid ${T.amb}`,borderRadius:10,padding:12,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.am,marginBottom:6}}>⚡ 빠른 입력 방법</div>
            <div style={{fontSize:11,color:T.ts,lineHeight:1.9}}>
              유튜브에서 영상 제목 복사 → 아래 각 칸에 붙여넣기<br/>
              <span style={{color:T.t}}>제목만 입력해도 분석 가능</span> · 채널/조회수는 선택사항이에요
            </div>
          </div>

          {/* 영상 입력 폼 — 간소화 버전 */}
          {ytVideos.map((v,i)=>(
            <div key={v.id} style={{background:T.c,border:`1px solid ${v.title?T.acb:T.b}`,borderRadius:10,padding:10,marginBottom:6,transition:"border .2s"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:v.title?6:0}}>
                <span style={{fontSize:10,fontWeight:700,color:v.title?T.ac:T.tm,fontFamily:T.m,flexShrink:0,width:16}}>{i+1}</span>
                <input
                  value={v.title}
                  onChange={e=>setYtVideos(prev=>prev.map((p,j)=>j===i?{...p,title:e.target.value}:p))}
                  placeholder={`영상 제목 ${i+1} (제목만 입력해도 OK)`}
                  style={{flex:1,background:T.s2,border:`1px solid ${T.b}`,borderRadius:7,padding:"8px 10px",color:T.t,fontSize:12,boxSizing:"border-box"}}
                />
                {v.title&&<button onClick={()=>setYtVideos(prev=>prev.map((p,j)=>j===i?{...p,title:"",channel:"",views:"",likes:"",uploadDate:""}:p))}
                  style={{flexShrink:0,width:24,height:24,borderRadius:5,background:"transparent",border:"none",color:T.tm,cursor:"pointer",fontSize:12}}>✕</button>}
              </div>
              {v.title&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,paddingLeft:24}}>
                  <input value={v.channel}
                    onChange={e=>setYtVideos(prev=>prev.map((p,j)=>j===i?{...p,channel:e.target.value}:p))}
                    placeholder="채널명 (선택)"
                    style={{background:T.s2,border:`1px solid ${T.b}`,borderRadius:6,padding:"6px 8px",color:T.t,fontSize:11,boxSizing:"border-box"}}/>
                  <input value={v.views}
                    onChange={e=>setYtVideos(prev=>prev.map((p,j)=>j===i?{...p,views:e.target.value}:p))}
                    placeholder="조회수 (선택)"
                    style={{background:T.s2,border:`1px solid ${T.b}`,borderRadius:6,padding:"6px 8px",color:T.t,fontSize:11,boxSizing:"border-box"}}/>
                  <input value={v.uploadDate}
                    onChange={e=>setYtVideos(prev=>prev.map((p,j)=>j===i?{...p,uploadDate:e.target.value}:p))}
                    placeholder="날짜 (선택)"
                    style={{background:T.s2,border:`1px solid ${T.b}`,borderRadius:6,padding:"6px 8px",color:T.t,fontSize:11,boxSizing:"border-box"}}/>
                </div>
              )}
            </div>
          ))}


          {/* 영상 추가 버튼 */}

          {ytVideos.length < 5 && (
            <button
              onClick={()=>setYtVideos(prev=>[...prev,{id:Date.now(),title:"",channel:"",views:"",likes:"",uploadDate:""}])}
              style={{width:"100%",padding:"9px",borderRadius:9,background:"transparent",border:`1px dashed ${T.ba}`,color:T.ts,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>
              + 영상 추가
            </button>
          )}

          {/* 에러 */}
          {ytError&&<div style={{padding:12,background:T.rd,borderRadius:9,fontSize:12,color:T.r,marginBottom:12}}>⚠️ {ytError}</div>}

          {/* 분석 버튼 */}
          <button
            onClick={benchmarkYoutube}
            disabled={ytLoading}
            style={{width:"100%",padding:"13px",borderRadius:10,background:ytLoading?T.c:`linear-gradient(135deg,${T.cy},${T.ac})`,border:"none",color:ytLoading?T.ts:"#fff",fontSize:14,fontWeight:800,cursor:ytLoading?"not-allowed":"pointer",marginBottom:16}}>
            {ytLoading?"🔍 AI 분석중...":"📺 유튜브 벤치마킹 분석 시작"}
          </button>

          {/* 로딩 */}
          {ytLoading&&(
            <div style={{textAlign:"center",padding:32}}>
              <Spin s={28} c={T.cy}/>
              <div style={{marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite"}}>Claude가 영상 패턴을 분석중...</div>
            </div>
          )}

          {/* 결과 */}
          {ytResult&&!ytLoading&&(
            <div style={{animation:"fadeUp .3s ease"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.cy,fontFamily:T.m,marginBottom:10,letterSpacing:".05em"}}>📊 벤치마킹 분석 결과</div>

              {/* 제목 패턴 */}
              {ytResult.title_patterns&&(
                <div style={{background:T.c,borderRadius:10,padding:14,marginBottom:10}}>
                  <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:8}}>🎯 제목 패턴</div>
                  {ytResult.title_patterns.map((p,i)=>(
                    <div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:i<ytResult.title_patterns.length-1?`1px solid ${T.b}`:"none",color:T.t}}>
                      <span style={{color:T.ac,fontFamily:T.m,fontSize:10,marginRight:6}}>{i+1}</span>{p}
                    </div>
                  ))}
                </div>
              )}

              {/* 후킹 방식 + 공통 구성 */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {ytResult.hook_styles&&(
                  <div style={{background:T.c,borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>⚡ 후킹 방식</div>
                    {ytResult.hook_styles.map((h,i)=>(
                      <div key={i} style={{fontSize:11,color:T.t,padding:"3px 0"}}>{h}</div>
                    ))}
                  </div>
                )}
                {ytResult.thumbnail_keywords&&(
                  <div style={{background:T.c,borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>🖼️ 썸네일 키워드</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {ytResult.thumbnail_keywords.map((k,i)=>(
                        <span key={i} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:T.acd,color:T.ac,fontWeight:600}}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 왜 인기있나 */}
              {ytResult.why_popular&&(
                <div style={{background:T.c,borderRadius:10,padding:14,marginBottom:10}}>
                  <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>🔥 조회수 높은 이유</div>
                  <div style={{fontSize:12,lineHeight:1.7,color:T.t}}>{ytResult.why_popular}</div>
                </div>
              )}

              {/* 차별화 각도 + 내 채널 각도 */}
              <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8,marginBottom:10}}>
                {ytResult.gap&&(
                  <div style={{background:`${T.g}0c`,border:`1px solid ${T.gb}`,borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,color:T.g,fontFamily:T.m,fontWeight:700,marginBottom:4}}>💡 차별화 빈틈</div>
                    <div style={{fontSize:12,lineHeight:1.6}}>{ytResult.gap}</div>
                  </div>
                )}
                {ytResult.my_angle&&(
                  <div style={{background:`${T.ac}0c`,border:`1px solid ${T.acb}`,borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:4}}>🎬 내 채널 활용 각도</div>
                    <div style={{fontSize:12,lineHeight:1.6}}>{ytResult.my_angle}</div>
                  </div>
                )}
              </div>

              {/* 추천 제목 + 업로드 타이밍 */}
              <div style={{background:T.s2,border:`1px solid ${T.cyb}`,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{fontSize:11,color:T.cy,fontFamily:T.m,fontWeight:700,marginBottom:6}}>✨ AI 추천</div>
                {ytResult.recommended_title&&(
                  <div style={{fontSize:14,fontWeight:800,color:T.t,marginBottom:8}}>"{ytResult.recommended_title}"</div>
                )}
                <div style={{display:"flex",gap:12,fontSize:11,color:T.ts}}>
                  {ytResult.best_upload_time&&<span>⏰ {ytResult.best_upload_time}</span>}
                  {ytResult.estimated_views&&<span>👁️ 예상 {ytResult.estimated_views}</span>}
                </div>
              </div>

              {/* 파이프라인 추가 버튼 */}
              {ytResult.recommended_title&&(
                <button
                  onClick={()=>{
                    setPipe(p=>[...p,{id:Date.now(),trend:`[벤치마킹] ${ytKeyword}`,video:ytResult.recommended_title,format:"롱폼",stage:"discovered",added:new Date().toLocaleString("ko-KR"),score:90}]);
                    setTab("pipeline");
                  }}
                  style={{width:"100%",padding:"11px",borderRadius:9,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  📋 추천 영상 파이프라인에 추가
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ CROSS ANALYSIS TAB ══ */}
      {tab==="cross"&&(
        <div style={{padding:16,animation:"fadeUp .3s ease"}}>

          {/* 준비 상태 표시 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            <div style={{background:analysis?T.gd:T.c,border:`1px solid ${analysis?T.gb:T.b}`,borderRadius:10,padding:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>{analysis?"✅":"⏳"}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:analysis?T.g:T.ts}}>트렌드 AI 분석</div>
                <div style={{fontSize:10,color:T.tm,marginTop:2}}>{analysis?`"${sel?.title?.slice(0,20)}..."`: "트렌드 탭에서 분석 필요"}</div>
              </div>
            </div>
            <div style={{background:ytResult?T.gd:T.c,border:`1px solid ${ytResult?T.gb:T.b}`,borderRadius:10,padding:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>{ytResult?"✅":"⏳"}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:ytResult?T.g:T.ts}}>유튜브 벤치마킹</div>
                <div style={{fontSize:10,color:T.tm,marginTop:2}}>{ytResult?`"${ytKeyword}"`: "유튜브 탭에서 분석 필요"}</div>
              </div>
            </div>
          </div>

          {/* 준비 안 됐을 때 가이드 */}
          {(!analysis||!ytResult)&&(
            <div style={{background:T.c,borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>⚡</div>
              <div style={{fontSize:14,fontWeight:800,marginBottom:8}}>교차 분석 준비 중</div>
              <div style={{fontSize:12,color:T.ts,lineHeight:1.8,marginBottom:16}}>
                두 가지 분석이 모두 완료되어야 교차 분석이 가능해요.
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {!analysis&&(
                  <button onClick={()=>setTab("trends")} style={{padding:"10px",borderRadius:8,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    1️⃣ 트렌드 탭 → 트렌드 클릭 → AI 분석
                  </button>
                )}
                {!ytResult&&(
                  <button onClick={()=>setTab("youtube")} style={{padding:"10px",borderRadius:8,background:T.cyd,border:`1px solid ${T.cyb}`,color:T.cy,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    2️⃣ 유튜브 탭 → 영상 정보 입력 → 벤치마킹 분석
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 교차 분석 실행 버튼 */}
          {analysis&&ytResult&&!crossResult&&(
            <div style={{background:`linear-gradient(135deg,${T.rd},${T.acd})`,borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.t,marginBottom:4}}>🎯 두 분석 완료! 교차 분석 준비됨</div>
              <div style={{fontSize:11,color:T.ts,marginBottom:14,lineHeight:1.6}}>
                트렌드 신호 × 유튜브 패턴을 교차 비교하여<br/>
                블루오션 각도와 최종 영상 전략을 도출합니다.
              </div>
              <button onClick={runCrossAnalysis} disabled={crossLoading}
                style={{width:"100%",padding:"14px",borderRadius:10,background:crossLoading?T.c:`linear-gradient(135deg,${T.r},${T.ac})`,border:"none",color:crossLoading?T.ts:"#fff",fontSize:15,fontWeight:900,cursor:crossLoading?"not-allowed":"pointer",letterSpacing:"-.01em"}}>
                {crossLoading?"⚡ 교차 분석중...":"⚡ 트렌드 × 유튜브 교차 분석 시작!"}
              </button>
            </div>
          )}

          {/* 로딩 */}
          {crossLoading&&(
            <div style={{textAlign:"center",padding:40}}>
              <Spin s={32} c={T.r}/>
              <div style={{marginTop:14,fontSize:14,fontWeight:700,color:T.t,animation:"pulse 1.5s infinite"}}>트렌드 × 유튜브 교차 분석중...</div>
              <div style={{marginTop:6,fontSize:11,color:T.ts}}>블루오션 각도를 찾고 있어요</div>
            </div>
          )}

          {/* 에러 */}
          {crossError&&<div style={{padding:12,background:T.rd,borderRadius:9,fontSize:12,color:T.r,marginBottom:12}}>⚠️ {crossError}</div>}

          {/* 교차 분석 결과 */}
          {crossResult&&!crossLoading&&(
            <div style={{animation:"fadeUp .3s ease"}}>

              {/* 종합 점수 */}
              <div style={{background:`linear-gradient(135deg,${T.s2},${T.c})`,border:`2px solid ${crossResult.score>=8?T.r:crossResult.score>=6?T.am:T.g}`,borderRadius:14,padding:18,marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6}}>종합 콘텐츠 기회 점수</div>
                <div style={{fontSize:52,fontWeight:900,fontFamily:T.m,color:crossResult.score>=8?T.r:crossResult.score>=6?T.am:T.g,lineHeight:1}}>{crossResult.score}</div>
                <div style={{fontSize:11,color:T.ts,fontFamily:T.m,marginTop:2}}>/ 10</div>
                {crossResult.verdict&&<div style={{fontSize:15,fontWeight:800,color:T.t,marginTop:10,padding:"6px 16px",background:crossResult.score>=8?T.rd:T.amd,borderRadius:20,display:"inline-block"}}>{crossResult.verdict}</div>}
              </div>

              {/* 공통 키워드 */}
              {crossResult.common_keywords&&(
                <div style={{background:T.c,borderRadius:10,padding:14,marginBottom:10}}>
                  <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:8}}>🔗 트렌드 × 유튜브 공통 키워드</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {crossResult.common_keywords.map((k,i)=>(
                      <span key={i} style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:16,background:`linear-gradient(135deg,${T.acd},${T.cyd})`,border:`1px solid ${T.acb}`,color:T.t}}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 블루오션 각도 — 핵심! */}
              {crossResult.blue_ocean&&(
                <div style={{background:`${T.g}0a`,border:`2px solid ${T.gb}`,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{fontSize:11,color:T.g,fontFamily:T.m,fontWeight:800,marginBottom:6}}>🌊 블루오션 각도 발견!</div>
                  <div style={{fontSize:13,lineHeight:1.7,fontWeight:600}}>{crossResult.blue_ocean}</div>
                </div>
              )}

              {/* 최종 영상 제목 */}
              {crossResult.final_title&&(
                <div style={{background:`${T.r}0a`,border:`1px solid ${T.rb}`,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{fontSize:10,color:T.r,fontFamily:T.m,fontWeight:700,marginBottom:6}}>🎬 최종 확정 영상 제목</div>
                  <div style={{fontSize:16,fontWeight:900,color:T.t,marginBottom:8}}>"{crossResult.final_title}"</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {crossResult.final_format&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:T.acd,color:T.ac,fontWeight:700}}>{crossResult.final_format}</span>}
                    {crossResult.upload_timing&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:T.amd,color:T.am,fontWeight:700}}>⏰ {crossResult.upload_timing}</span>}
                    {crossResult.estimated_views&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:T.gd,color:T.g,fontWeight:700}}>👁️ {crossResult.estimated_views}</span>}
                  </div>
                </div>
              )}

              {/* 이길 이유 + 리스크 */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {crossResult.why_win&&(
                  <div style={{background:T.c,borderRadius:10,padding:12}}>
                    <div style={{fontSize:10,color:T.g,fontFamily:T.m,fontWeight:700,marginBottom:5}}>✅ 잘 될 이유</div>
                    <div style={{fontSize:11,lineHeight:1.6,color:T.t}}>{crossResult.why_win}</div>
                  </div>
                )}
                {crossResult.risk&&(
                  <div style={{background:T.c,borderRadius:10,padding:12}}>
                    <div style={{fontSize:10,color:T.am,fontFamily:T.m,fontWeight:700,marginBottom:5}}>⚠️ 주의할 점</div>
                    <div style={{fontSize:11,lineHeight:1.6,color:T.t}}>{crossResult.risk}</div>
                  </div>
                )}
              </div>

              {/* 썸네일 컨셉 + 후킹 */}
              {(crossResult.thumbnail_concept||crossResult.hook_idea)&&(
                <div style={{background:T.c,borderRadius:10,padding:14,marginBottom:14}}>
                  {crossResult.thumbnail_concept&&(
                    <div style={{marginBottom:crossResult.hook_idea?10:0}}>
                      <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>🖼️ 썸네일 컨셉</div>
                      <div style={{fontSize:12,lineHeight:1.6}}>{crossResult.thumbnail_concept}</div>
                    </div>
                  )}
                  {crossResult.hook_idea&&(
                    <div style={{borderTop:crossResult.thumbnail_concept?`1px solid ${T.b}`:"none",paddingTop:crossResult.thumbnail_concept?10:0}}>
                      <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>🎯 오프닝 후킹 아이디어</div>
                      <div style={{fontSize:12,lineHeight:1.6,fontStyle:"italic",color:T.cy}}>"{crossResult.hook_idea}"</div>
                    </div>
                  )}
                </div>
              )}

              {/* 파이프라인 추가 */}
              {crossResult.final_title&&(
                <button onClick={()=>{
                  setPipe(p=>[...p,{id:Date.now(),trend:`[교차분석] ${sel?.title?.slice(0,30)||ytKeyword}`,video:crossResult.final_title,format:crossResult.final_format||"롱폼",stage:"discovered",added:new Date().toLocaleString("ko-KR"),score:crossResult.score*10}]);
                  setWorkflowStep(5);
                }} style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${T.acd},${T.gd})`,border:`1px solid ${T.acb}`,color:T.t,fontSize:14,fontWeight:800,cursor:"pointer"}}>
                  📋 최종 영상 파이프라인에 추가 →
                </button>
              )}

              {/* 다음 단계 안내 */}
              <div style={{background:`${T.ro}08`,border:`1px solid ${T.ro}30`,borderRadius:10,padding:14,marginTop:10}}>
                <div style={{fontSize:12,fontWeight:800,color:T.t,marginBottom:4}}>📊 다음 단계 — 채널 분석 추천</div>
                <div style={{fontSize:11,color:T.ts,lineHeight:1.7,marginBottom:10}}>
                  교차분석이 완료됐어요! 경쟁 채널을 분석하면 더 정확한 차별화 전략을 세울 수 있어요.
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <button onClick={()=>{setWorkflowStep(4);setTab("channel");}}
                    style={{padding:"10px",borderRadius:8,background:`${T.ro}15`,border:`1px solid ${T.ro}40`,color:T.ro,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    📊 채널분석 시작 →
                  </button>
                  <button onClick={()=>{setWorkflowStep(5);setTab("pipeline");}}
                    style={{padding:"10px",borderRadius:8,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    📋 파이프라인 바로가기
                  </button>
                </div>
              </div>

              {/* 다시 분석 */}
              <button onClick={()=>{setCrossResult(null);setCrossError("");}}
                style={{width:"100%",padding:"9px",borderRadius:8,background:"transparent",border:`1px solid ${T.ba}`,color:T.ts,fontSize:11,fontWeight:600,cursor:"pointer",marginTop:8}}>
                ↻ 다시 분석
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ CHANNEL ANALYSIS TAB ══ */}
      {tab==="channel"&&(
        <div style={{padding:16,animation:"fadeUp .3s ease"}}>

          {/* 안내 배너 */}
          <div style={{background:`${T.ro}0a`,border:`1px solid ${T.rod}`,borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>📊</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.ro,marginBottom:3}}>채널 분석 모듈</div>
              <div style={{fontSize:12,color:T.ts,lineHeight:1.7}}>
                경쟁/벤치마킹 채널을 등록하고 AI로 강점·빈틈·차별화 전략을 분석해요.<br/>
                채널 방문 → 최근 영상 3개 정보 입력 → 분석 시작!
              </div>
            </div>
          </div>

          {/* 채널 선택 탭 */}
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {channels.map((ch,i)=>(
              <button key={i} onClick={()=>setChTab(i)}
                style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${chTab===i?T.ro+"60":T.b}`,background:chTab===i?`${T.ro}10`:T.c,color:chTab===i?T.ro:T.ts,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
                {ch.name||`채널 ${i+1}`}
                {chResults[i]&&<span style={{marginLeft:4,fontSize:10,color:T.g}}>✓</span>}
              </button>
            ))}
            {channels.length<5&&(
              <button onClick={()=>setChannels(prev=>[...prev,{id:Date.now(),name:"",url:"",subscribers:"",topics:"",recentVideos:[{title:"",views:"",date:""},{title:"",views:"",date:""},{title:"",views:"",date:""}]}])}
                style={{padding:"8px 12px",borderRadius:8,border:`1px dashed ${T.ba}`,background:"transparent",color:T.tm,fontSize:12,cursor:"pointer"}}>
                +
              </button>
            )}
          </div>

          {/* 채널 입력 폼 */}
          {channels.map((ch,i)=>i===chTab&&(
            <div key={i}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>채널명 *</div>
                  <input value={ch.name} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,name:e.target.value}:c))}
                    placeholder="예: EO Korea"
                    style={{width:"100%",background:T.c,border:`1px solid ${ch.name?T.ro+"50":T.b}`,borderRadius:8,padding:"9px 12px",color:T.t,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>구독자 수</div>
                  <input value={ch.subscribers} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,subscribers:e.target.value}:c))}
                    placeholder="예: 52만"
                    style={{width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:8,padding:"9px 12px",color:T.t,fontSize:13,boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>채널 URL (선택)</div>
                <input value={ch.url} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,url:e.target.value}:c))}
                  placeholder="https://youtube.com/@채널명"
                  style={{width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:8,padding:"9px 12px",color:T.t,fontSize:13,boxSizing:"border-box"}}/>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>주요 주제</div>
                <input value={ch.topics} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,topics:e.target.value}:c))}
                  placeholder="예: AI툴 리뷰, 직장인 생산성, ChatGPT 활용"
                  style={{width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:8,padding:"9px 12px",color:T.t,fontSize:13,boxSizing:"border-box"}}/>
              </div>

              {/* 최근 영상 입력 */}
              <div style={{fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:700,marginBottom:8,letterSpacing:".04em"}}>
                최근 인기 영상 (채널 방문 후 입력)
              </div>
              {ch.recentVideos.map((v,vi)=>(
                <div key={vi} style={{background:T.c,border:`1px solid ${T.b}`,borderRadius:9,padding:10,marginBottom:6}}>
                  <div style={{fontSize:10,color:T.ro,fontFamily:T.m,fontWeight:700,marginBottom:6}}>영상 {vi+1}</div>
                  <input value={v.title} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,recentVideos:c.recentVideos.map((rv,rj)=>rj===vi?{...rv,title:e.target.value}:rv)}:c))}
                    placeholder="영상 제목"
                    style={{width:"100%",background:T.s2,border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 10px",color:T.t,fontSize:12,marginBottom:5,boxSizing:"border-box"}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    <input value={v.views} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,recentVideos:c.recentVideos.map((rv,rj)=>rj===vi?{...rv,views:e.target.value}:rv)}:c))}
                      placeholder="조회수 (예: 24만)"
                      style={{background:T.s2,border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 10px",color:T.t,fontSize:12,boxSizing:"border-box"}}/>
                    <input value={v.date} onChange={e=>setChannels(prev=>prev.map((c,j)=>j===i?{...c,recentVideos:c.recentVideos.map((rv,rj)=>rj===vi?{...rv,date:e.target.value}:rv)}:c))}
                      placeholder="업로드 (예: 3일 전)"
                      style={{background:T.s2,border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 10px",color:T.t,fontSize:12,boxSizing:"border-box"}}/>
                  </div>
                </div>
              ))}

              {chError&&<div style={{padding:10,background:T.rd,borderRadius:8,fontSize:12,color:T.r,marginBottom:10}}>⚠️ {chError}</div>}

              {/* 분석 버튼 */}
              <button onClick={()=>analyzeChannel(i)} disabled={chLoading}
                style={{width:"100%",padding:"13px",borderRadius:10,background:chLoading?T.c:`linear-gradient(135deg,${T.ro},${T.ac})`,border:"none",color:chLoading?T.ts:"#fff",fontSize:14,fontWeight:800,cursor:chLoading?"not-allowed":"pointer",marginBottom:16}}>
                {chLoading?"📊 분석중...":"📊 채널 AI 분석 시작"}
              </button>

              {/* 분석 결과 */}
              {chLoading&&(
                <div style={{textAlign:"center",padding:32}}>
                  <Spin s={28} c={T.ro}/>
                  <div style={{marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite"}}>Claude가 채널을 분석중...</div>
                </div>
              )}
              {chResults[i]&&!chLoading&&(()=>{
                const r = chResults[i];
                return (
                  <div style={{animation:"fadeUp .3s ease"}}>
                    {/* 헤더 */}
                    <div style={{background:`${T.ro}0a`,border:`1px solid ${T.ro}30`,borderRadius:12,padding:14,marginBottom:12,display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.t}}>{ch.name}</div>
                        <div style={{fontSize:11,color:T.ro,marginTop:3,fontWeight:600}}>{r.channel_type}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m}}>위협도</div>
                        <div style={{fontSize:13,fontWeight:800,color:r.threat_level==="높음"?T.r:r.threat_level==="보통"?T.am:T.g}}>{r.threat_level}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m}}>협업</div>
                        <div style={{fontSize:13,fontWeight:800,color:r.collab_potential==="높음"?T.g:r.collab_potential==="보통"?T.am:T.ts}}>{r.collab_potential}</div>
                      </div>
                    </div>

                    {/* 강점 / 약점 */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                      <div style={{background:T.c,borderRadius:10,padding:12}}>
                        <div style={{fontSize:10,color:T.g,fontFamily:T.m,fontWeight:700,marginBottom:6}}>💪 강점</div>
                        {(r.strengths||[]).map((s,si)=><div key={si} style={{fontSize:11,color:T.t,padding:"3px 0",borderBottom:si<r.strengths.length-1?`1px solid ${T.b}`:"none"}}>• {s}</div>)}
                      </div>
                      <div style={{background:T.c,borderRadius:10,padding:12}}>
                        <div style={{fontSize:10,color:T.am,fontFamily:T.m,fontWeight:700,marginBottom:6}}>🕳️ 빈틈</div>
                        {(r.weaknesses||[]).map((s,si)=><div key={si} style={{fontSize:11,color:T.t,padding:"3px 0",borderBottom:si<r.weaknesses.length-1?`1px solid ${T.b}`:"none"}}>• {s}</div>)}
                      </div>
                    </div>

                    {/* 다루지 않는 주제 */}
                    {r.missing_topics&&(
                      <div style={{background:`${T.g}0a`,border:`1px solid ${T.gb}`,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{fontSize:10,color:T.g,fontFamily:T.m,fontWeight:700,marginBottom:6}}>🌊 이 채널이 다루지 않는 주제 (블루오션!)</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {r.missing_topics.map((t,ti)=><span key={ti} style={{fontSize:11,padding:"3px 10px",borderRadius:12,background:T.gd,color:T.g,fontWeight:600}}>{t}</span>)}
                        </div>
                      </div>
                    )}

                    {/* 차별화 전략 */}
                    {r.my_differentiation&&(
                      <div style={{background:`${T.ac}0a`,border:`1px solid ${T.acb}`,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{fontSize:10,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:4}}>🎯 내 채널 차별화 전략</div>
                        <div style={{fontSize:12,lineHeight:1.7}}>{r.my_differentiation}</div>
                      </div>
                    )}

                    {/* 배울 점 / 피할 점 */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                      {r.learn_from&&<div style={{background:T.c,borderRadius:10,padding:12}}><div style={{fontSize:10,color:T.cy,fontFamily:T.m,fontWeight:700,marginBottom:4}}>📚 배울 점</div><div style={{fontSize:11,lineHeight:1.6}}>{r.learn_from}</div></div>}
                      {r.avoid&&<div style={{background:T.c,borderRadius:10,padding:12}}><div style={{fontSize:10,color:T.r,fontFamily:T.m,fontWeight:700,marginBottom:4}}>⚠️ 피할 점</div><div style={{fontSize:11,lineHeight:1.6}}>{r.avoid}</div></div>}
                    </div>

                    {/* 제목 공식 */}
                    {r.title_formula&&(
                      <div style={{background:T.c,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>📝 제목 공식</div>
                        <div style={{fontSize:12,color:T.am,fontWeight:600}}>{r.title_formula}</div>
                      </div>
                    )}

                    {/* 종합 평가 */}
                    {r.overall&&(
                      <div style={{background:T.s2,border:`1px solid ${T.ba}`,borderRadius:10,padding:12,marginBottom:12}}>
                        <div style={{fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:4}}>📋 종합 평가</div>
                        <div style={{fontSize:12,lineHeight:1.7,color:T.t}}>{r.overall}</div>
                      </div>
                    )}

                    {/* 다음 단계 버튼 */}
                    <div style={{display:"grid",gridTemplateColumns:analysis?"1fr 1fr":"1fr",gap:8,marginTop:4}}>
                      {analysis&&(
                        <button onClick={()=>setTab("cross")}
                          style={{padding:"10px",borderRadius:9,background:`${T.r}0a`,border:`1px solid ${T.rb}`,color:T.r,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          ⚡ 교차분석으로 →
                        </button>
                      )}
                      <button onClick={()=>{setWorkflowStep(5);setTab("pipeline");}}
                        style={{padding:"10px",borderRadius:9,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        📋 파이프라인으로 →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ══ PIPELINE TAB ══ */}
      {tab==="pipeline"&&(
        <div style={{padding:16,animation:"fadeUp .3s ease"}}>
          {!pipe.length?(
            <div style={{textAlign:"center",padding:40,color:T.tm}}>
              <div style={{fontSize:44,marginBottom:12}}>📋</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8,color:T.t}}>파이프라인이 비어있어요</div>
              <div style={{fontSize:12,color:T.ts,lineHeight:1.9,marginBottom:20}}>
                아래 단계를 순서대로 진행하면 자동으로 채워져요!
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:320,margin:"0 auto",textAlign:"left"}}>
                {[
                  {step:"1",icon:"🔍",label:"트렌드 탭",desc:"트렌드 카드 클릭 → AI 분석",tab:"trends",color:T.ac},
                  {step:"2",icon:"📺",label:"유튜브 탭",desc:"키워드 검색 → 영상 정보 입력",tab:"youtube",color:T.cy},
                  {step:"3",icon:"⚡",label:"교차분석 탭",desc:"블루오션 각도 발견",tab:"cross",color:T.r},
                  {step:"4",icon:"📊",label:"채널분석 탭",desc:"경쟁 채널 파악 (선택)",tab:"channel",color:T.ro},
                ].map(s=>(
                  <button key={s.step} onClick={()=>setTab(s.tab)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:T.c,border:`1px solid ${s.color}20`,cursor:"pointer",textAlign:"left"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:s.color}}>{s.step}. {s.label}</div>
                      <div style={{fontSize:11,color:T.ts}}>{s.desc}</div>
                    </div>
                    <span style={{marginLeft:"auto",color:s.color,fontSize:12}}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:20}}>
                {STAGES.map(s2=>{
                  const cnt=pipe.filter(p=>p.stage===s2.id).length;
                  return(
                    <div key={s2.id} style={{background:T.c,border:`1px solid ${cnt>0?s2.c+"40":T.b}`,borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
                      <div style={{fontSize:20}}>{s2.i}</div>
                      <div style={{fontSize:11,fontWeight:700,color:s2.c,fontFamily:T.m,marginTop:4}}>{s2.l}</div>
                      <div style={{fontSize:24,fontWeight:900,color:cnt>0?s2.c:T.tm,fontFamily:T.m}}>{cnt}</div>
                    </div>
                  );
                })}
              </div>
              {STAGES.map(stage=>{
                const items=pipe.filter(p=>p.stage===stage.id);
                if(!items.length) return null;
                return(
                  <div key={stage.id} style={{marginBottom:18}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 14px",background:T.s2,borderRadius:9,border:`1px solid ${stage.c}20`}}>
                      <span style={{fontSize:18}}>{stage.i}</span>
                      <span style={{fontSize:14,fontWeight:800,color:stage.c}}>{stage.l}</span>
                      <span style={{fontSize:11,color:T.tm,fontFamily:T.m}}>({items.length}개)</span>
                    </div>
                    {items.map(item=>(
                      <div key={item.id} style={{background:T.c,border:`1px solid ${T.b}`,borderLeft:`3px solid ${stage.c}`,borderRadius:10,padding:14,marginBottom:8}}>
                        <div style={{fontSize:14,fontWeight:800,marginBottom:4}}>{item.video}</div>
                        <div style={{fontSize:11,color:T.ts,marginBottom:10}}>원본: {item.trend.slice(0,50)}...</div>
                        <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                          <Pill>{item.format}</Pill>
                          <Pill color={T.am}>트렌드 {item.score}점</Pill>
                          <Pill color={T.tm}>{item.added}</Pill>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {STAGES.filter(s2=>s2.id!==stage.id).map(s2=>(
                            <button key={s2.id} onClick={()=>moveStage(item.id,s2.id)} style={{padding:"6px 10px",borderRadius:6,background:`${s2.c}12`,border:`1px solid ${s2.c}30`,color:s2.c,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.m}}>
                              {s2.i} {s2.l}
                            </button>
                          ))}
                          <button onClick={()=>rmPipe(item.id)} style={{padding:"6px 10px",borderRadius:6,background:T.rd,border:`1px solid ${T.rb}`,color:T.r,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.m,marginLeft:"auto"}}>✕ 삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <div style={{padding:"20px 16px",borderTop:`1px solid ${T.b}`,textAlign:"center",marginTop:8}}>
        <div style={{fontSize:10,color:T.tm,fontFamily:T.m,lineHeight:2}}>
          TREND RADAR v5.0 · Powered by <span style={{color:"#4285f4"}}>Google OpenRouter (Llama 3.3 70B)</span> (무료)<br/>
          HackerNews · Reddit · Google Trends KR/US/Global · 네이버뉴스 · ProductHunt · GitHub Trending
        </div>
      </div>
    </div>
  </>);
}
