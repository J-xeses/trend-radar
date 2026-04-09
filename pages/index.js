import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// Gemini 1.5 Flash — 무료 티어 1,500회/일, 신용카드 불필요
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

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
  if (/\bai\b|artificial|llm|gpt|claude|gemini|openai|anthropic|machine learning|neural|transformer|diffusion|agent|챗봇|인공지능|딥러닝/.test(t)) return "ai";
  if (/startup|founder|funding|vc|스타트업|투자|유니콘/.test(t)) return "biz";
  if (/career|job|hire|salary|이직|채용|연봉|퇴사|취업/.test(t)) return "career";
  if (/건강|운동|다이어트|루틴|습관|명상|수면|여행|맛집/.test(t)) return "life";
  if (/product|app|tool|saas|launch|ship/.test(t)) return "product";
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
  return Math.max(5, Math.min(100, Math.round(eng*0.6+rec*0.4)));
}
function heatOf(s, a) {
  if (s>=85&&a<6) return "explosive";
  if (s>=65) return "rising";
  if (s>=40) return "steady";
  return "cooling";
}

/* ─── Gemini API Call ─── */
async function callGemini(apiKey, prompt) {
  const res = await fetch(GEMINI_URL(apiKey), {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      contents:[{ parts:[{ text: prompt }] }],
      generationConfig:{ temperature:0.7, maxOutputTokens:1200 }
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const d = await res.json();
  const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return raw.replace(/```json|```/g,"").trim();
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
        {/* Gemini badge */}
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#4285f420",border:"1px solid #4285f440",borderRadius:10,padding:"8px 16px" }}>
            <span style={{ fontSize:20 }}>🔷</span>
            <span style={{ fontSize:14,fontWeight:800,color:"#4285f4" }}>Google Gemini API</span>
            <span style={{ fontSize:11,background:T.gd,border:`1px solid ${T.gb}`,color:T.g,padding:"2px 7px",borderRadius:5,fontFamily:T.m,fontWeight:700 }}>무료</span>
          </div>
        </div>

        <div style={{ fontSize:17,fontWeight:800,marginBottom:8,textAlign:"center" }}>API Key 설정</div>
        <div style={{ fontSize:13,color:T.ts,lineHeight:1.8,marginBottom:20,textAlign:"center" }}>
          Gemini 1.5 Flash는 <span style={{ color:T.g,fontWeight:700 }}>하루 1,500회 완전 무료</span>입니다.<br/>
          신용카드 없이 Google 계정만으로 발급 가능해요.
        </div>

        {/* 발급 방법 */}
        <div style={{ background:T.c,borderRadius:10,padding:14,marginBottom:16,fontSize:12,lineHeight:2,color:T.ts }}>
          <div style={{ color:T.t,fontWeight:700,marginBottom:4 }}>🚀 API Key 무료 발급 (1분)</div>
          <div>1. <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:"#4285f4" }}>aistudio.google.com</a> 접속</div>
          <div>2. Google 계정으로 로그인</div>
          <div>3. 상단 <b style={{ color:T.t }}>"Get API Key"</b> 클릭</div>
          <div>4. <b style={{ color:T.t }}>"Create API Key"</b> → 복사</div>
        </div>

        <input
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="AIzaSy..."
          type="password"
          style={{ width:"100%",background:T.c,border:`1px solid ${valid?T.gb:T.ba}`,borderRadius:9,padding:"12px 14px",color:T.t,fontSize:13,fontFamily:T.m,marginBottom:12,boxSizing:"border-box",transition:"border .2s" }}
        />
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onSkip} style={{ flex:1,padding:12,borderRadius:9,background:"transparent",border:`1px solid ${T.ba}`,color:T.ts,fontSize:13,fontWeight:600,cursor:"pointer" }}>
            나중에
          </button>
          <button onClick={() => valid && onSave(key)} style={{ flex:2,padding:12,borderRadius:9,background:valid?"#4285f4":T.c,border:"none",color:valid?"#fff":T.tm,fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed",transition:"all .2s" }}>
            ✅ 저장 후 시작
          </button>
        </div>
        <div style={{ fontSize:10,color:T.tm,textAlign:"center",marginTop:10 }}>
          키는 브라우저에만 저장 · 외부 전송 없음
        </div>
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
  const [pipe, setPipe] = useState([]);
  const [auto, setAuto] = useState(true);
  const [fStatus, setFStatus] = useState({});
  const [apiKey, setApiKey] = useState(() => typeof window!=="undefined" ? localStorage.getItem("tr_gemini_key")||"" : "");
  const [showApiModal, setShowApiModal] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [apiError, setApiError] = useState("");
  const timer = useRef(null);
  const analysisRef = useRef(null);

  const fetchAll = useCallback(async (showL=true) => {
    if (showL) setLoading(true);
    const st = {};
    const mk = (k,r) => { st[k]={ok:r.length>0,n:r.length}; };
    const [hn,rd,gKR,gUS,gGL,nv,ph,gh] = await Promise.all([
      fetchHN().then(r=>{mk("hackernews",r);return r;}),
      fetchRD().then(r=>{mk("reddit",r);return r;}),
      fetchGT("KR","google_kr").then(r=>{mk("google_kr",r);return r;}),
      fetchGT("US","google_us").then(r=>{mk("google_us",r);return r;}),
      fetchGT("","google_gl").then(r=>{mk("google_gl",r);return r;}),
      fetchNaver().then(r=>{mk("naver",r);return r;}),
      fetchPH().then(r=>{mk("producthunt",r);return r;}),
      fetchGH().then(r=>{mk("github",r);return r;}),
    ]);
    const all = [...hn,...rd,...gKR,...gUS,...gGL,...nv,...ph,...gh];
    const scored = all.map(item=>{
      const age=(Date.now()-item.time)/3600000;
      const ts2=scoreItem(item);
      return {...item,trendScore:ts2,category:classify(item.title),heat:heatOf(ts2,age),ageLabel:timeAgo(item.time)};
    }).sort((a,b)=>b.trendScore-a.trendScore);
    setTrends(scored);
    setLastRefresh(new Date());
    setFStatus(st);
    setLoading(false);
    setWorkflowStep(1);
  }, []);

  useEffect(()=>{ fetchAll(); return()=>clearInterval(timer.current); },[]);
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

  const stats = {
    total:trends.length,
    exp:trends.filter(t2=>t2.heat==="explosive").length,
    rise:trends.filter(t2=>t2.heat==="rising").length,
    src:Object.keys(fStatus).filter(k=>fStatus[k]?.ok).length,
  };

  /* ── AI 분석 (Gemini) ── */
  const analyze = useCallback(async (trend) => {
    if (!apiKey) { setShowApiModal(true); return; }
    setSel(trend); setAL(true); setAnalysis(null); setScript(null); setApiError("");
    setWorkflowStep(2);
    setTimeout(()=>analysisRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    try {
      const prompt = `당신은 "AI × 자기계발" 유튜브 채널 전략가입니다. 타겟: 20-40대 직장인 한국인.
아래 트렌드를 분석하여 유튜브 콘텐츠 기회를 평가하세요.
반드시 순수 JSON만 응답하세요. 마크다운 없이.

트렌드: "${trend.title}"
소스: ${trend.source}
트렌드점수: ${trend.trendScore}
열기: ${trend.heat}
${trend.tagline?`설명: ${trend.tagline}`:""}

응답 형식:
{"opportunity":숫자1-10,"competition":"낮음 또는 보통 또는 높음","urgency":"즉시 또는 1주내 또는 여유","summary_ko":"2-3문장 한국어 분석","angle":"채널 고유 앵글 한국어","videos":[{"title":"한국어 제목 40자이내","format":"숏폼 또는 롱폼 또는 튜토리얼 또는 분석","views":"예상조회수"},{"title":"...","format":"...","views":"..."},{"title":"...","format":"...","views":"..."}],"tags":["#태그1","#태그2","#태그3","#태그4","#태그5"],"best_time":"업로드 최적 타이밍 한국어"}`;

      const raw = await callGemini(apiKey, prompt);
      setAnalysis(JSON.parse(raw));
      setWorkflowStep(3);
    } catch(e) {
      setAnalysis({ error:true });
      setApiError(e.message||"분석 실패");
    }
    setAL(false);
  }, [apiKey]);

  /* ── 대본 생성 (Gemini) ── */
  const genScript = useCallback(async (v) => {
    if (!apiKey) { setShowApiModal(true); return; }
    setSL(true); setScript(null); setApiError("");
    try {
      const prompt = `한국어 유튜브 대본 작성가입니다.
영상 제목: "${v.title}" (형식: ${v.format})
순수 JSON만 응답. 마크다운 없이.

{"hook":"15초 오프닝 한국어","sections":[{"ts":"0:00","name":"후킹","desc":"내용 설명 한국어"},{"ts":"0:15","name":"문제제기","desc":"내용 설명 한국어"},{"ts":"2:00","name":"핵심내용","desc":"내용 설명 한국어"},{"ts":"6:00","name":"실전적용","desc":"내용 설명 한국어"},{"ts":"8:00","name":"CTA","desc":"내용 설명 한국어"}],"seo":["키워드1","키워드2","키워드3","키워드4","키워드5"],"desc":"2문장 영상설명 한국어"}`;

      const raw = await callGemini(apiKey, prompt);
      setScript(JSON.parse(raw));
    } catch(e) {
      setScript({ error:true });
      setApiError(e.message||"대본 생성 실패");
    }
    setSL(false);
  }, [apiKey]);

  const addPipe = (trend, v) => {
    setPipe(p=>[...p,{id:Date.now(),trend:trend.title,video:v.title,format:v.format,stage:"discovered",added:new Date().toLocaleString("ko-KR"),score:trend.trendScore}]);
    setWorkflowStep(4);
  };
  const moveStage = (id, st2) => setPipe(p=>p.map(i=>i.id===id?{...i,stage:st2}:i));
  const rmPipe = (id) => setPipe(p=>p.filter(i=>i.id!==id));

  const saveApiKey = (key) => {
    localStorage.setItem("tr_gemini_key", key);
    setApiKey(key);
    setShowApiModal(false);
  };

  return (<>
    <Head>
      <title>Trend Radar v5 — AI 콘텐츠 파이프라인</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </Head>
    <div style={{ minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.f }}>
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

      {showApiModal && <ApiKeyModal onSave={saveApiKey} onSkip={()=>setShowApiModal(false)} />}

      {/* ── Header ── */}
      <header style={{ padding:"14px 20px",borderBottom:`1px solid ${T.b}`,background:`${T.s}ee`,backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${T.ac},${T.cy})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#fff",boxShadow:`0 0 18px ${T.ac}40` }}>T</div>
          <div>
            <div style={{ fontSize:16,fontWeight:900,letterSpacing:"-0.04em",display:"flex",alignItems:"center",gap:8 }}>
              TREND RADAR
              <span style={{ fontSize:11,fontFamily:T.m,color:T.r,fontWeight:700,background:T.rd,padding:"2px 6px",borderRadius:4 }}>v5</span>
              <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:T.g,fontFamily:T.m,fontWeight:700 }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:T.g,animation:"liveDot 2s infinite",display:"inline-block" }}/>
                LIVE
              </span>
            </div>
            <div style={{ fontSize:11,color:T.ts,fontFamily:T.m,marginTop:1 }}>
              {lastRefresh?`갱신 ${lastRefresh.toLocaleTimeString("ko-KR")} · ${stats.total}개 · ${stats.src}/8 소스`:"데이터 수집중..."}
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <button onClick={()=>setShowApiModal(true)} style={{ padding:"6px 12px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",border:`1px solid ${apiKey?T.gb:T.amb}`,background:apiKey?T.gd:T.amd,color:apiKey?T.g:T.am }}>
            {apiKey?"🔷 Gemini 연결됨":"🔷 API 설정"}
          </button>
          <button onClick={()=>setAuto(!auto)} style={{ padding:"6px 12px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",border:`1px solid ${auto?T.gb:T.ba}`,background:auto?T.gd:"transparent",color:auto?T.g:T.ts }}>
            {auto?"⏱ 자동갱신":"⏸ 수동"}
          </button>
          <button onClick={()=>fetchAll()} disabled={loading} style={{ padding:"6px 14px",borderRadius:7,fontSize:11,fontFamily:T.m,fontWeight:700,cursor:"pointer",background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,opacity:loading?.5:1 }}>
            {loading?"수집중...":"↻ 수집"}
          </button>
        </div>
      </header>

      {/* ── Workflow Bar ── */}
      <div style={{ padding:"14px 20px",background:T.s,borderBottom:`1px solid ${T.b}` }}>
        <div style={{ fontSize:10,fontFamily:T.m,color:T.tm,marginBottom:10,fontWeight:600,letterSpacing:".08em" }}>WORKFLOW — 콘텐츠 제작 파이프라인</div>
        <div style={{ display:"flex",alignItems:"center",gap:0 }}>
          <WorkflowStep label="수집" icon="📡" active={workflowStep===0} done={workflowStep>0} />
          <div style={{ color:T.tm,fontSize:16,paddingBottom:16,flexShrink:0,margin:"0 2px" }}>›</div>
          <WorkflowStep label="트렌드선택" icon="🔍" active={workflowStep===1} done={workflowStep>2} />
          <div style={{ color:T.tm,fontSize:16,paddingBottom:16,flexShrink:0,margin:"0 2px" }}>›</div>
          <WorkflowStep label="AI분석" icon="🤖" active={workflowStep===2} done={workflowStep>2} />
          <div style={{ color:T.tm,fontSize:16,paddingBottom:16,flexShrink:0,margin:"0 2px" }}>›</div>
          <WorkflowStep label="대본생성" icon="✍️" active={workflowStep===3} done={workflowStep>3} />
          <div style={{ color:T.tm,fontSize:16,paddingBottom:16,flexShrink:0,margin:"0 2px" }}>›</div>
          <WorkflowStep label="파이프라인" icon="📋" active={workflowStep===4} done={false} />
        </div>
        <div style={{ fontSize:11,marginTop:8,textAlign:"center",fontWeight:600,
          color:workflowStep===0?T.ts:workflowStep===1?T.am:workflowStep===2?T.ac:workflowStep===3?T.g:T.g,
          animation:workflowStep===2?"pulse 1.5s infinite":"none" }}>
          {workflowStep===0&&"⏳ 데이터 수집중..."}
          {workflowStep===1&&"👆 트렌드 카드를 클릭하면 AI 분석이 시작됩니다"}
          {workflowStep===2&&"🤖 Gemini가 콘텐츠 기회를 분석중..."}
          {workflowStep===3&&"✅ 분석 완료! 아이디어를 선택해 대본을 생성하거나 파이프라인에 추가하세요"}
          {workflowStep===4&&"🎬 파이프라인 탭에서 제작 단계를 관리하세요"}
        </div>
      </div>

      {/* ── Source Status (클릭 가능) ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(8,1fr)",borderBottom:`1px solid ${T.b}`,background:T.s2 }}>
        {Object.entries(SRC).map(([k,v])=>{
          const st2=fStatus[k];
          return (
            <div key={k} onClick={()=>setSrcF(srcF===k?"all":k)}
              style={{ padding:"10px 4px",borderRight:`1px solid ${T.b}`,textAlign:"center",cursor:"pointer",background:srcF===k?v.b:"transparent",transition:"all .2s" }}>
              <div style={{ fontSize:18 }}>{v.i}</div>
              <div style={{ fontSize:16,fontFamily:T.m,fontWeight:800,color:st2?.ok?T.g:loading?T.am:T.r,marginTop:2 }}>{st2?st2.n:"—"}</div>
              <div style={{ fontSize:9,color:T.tm,fontFamily:T.m,marginTop:1 }}>{v.l}</div>
            </div>
          );
        })}
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.b}` }}>
        {[
          { l:"전체 수집", v:stats.total, c:T.t },
          { l:"🔥 폭발", v:stats.exp, c:T.r },
          { l:"📈 상승", v:stats.rise, c:T.am },
          { l:"활성 소스", v:`${stats.src}/8`, c:T.ac },
        ].map((s2,i)=>(
          <div key={i} style={{ padding:"14px 10px",textAlign:"center",borderRight:i<3?`1px solid ${T.b}`:"none" }}>
            <div style={{ fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600 }}>{s2.l}</div>
            <div style={{ fontSize:28,fontWeight:900,color:s2.c,fontFamily:T.m,lineHeight:1.1,marginTop:4 }}>{s2.v}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex",borderBottom:`1px solid ${T.b}`,background:T.s }}>
        {[{id:"trends",l:"🔍 라이브 트렌드",n:filtered.length},{id:"pipeline",l:"📋 파이프라인",n:pipe.length}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{ flex:1,padding:"14px",background:"transparent",border:"none",borderBottom:tab===tb.id?`2px solid ${T.ac}`:"2px solid transparent",color:tab===tb.id?T.t:T.tm,fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s" }}>
            {tb.l} <span style={{ fontFamily:T.m,fontSize:11,background:tab===tb.id?T.acd:T.c,padding:"2px 7px",borderRadius:10,marginLeft:4 }}>{tb.n}</span>
          </button>
        ))}
      </div>

      {/* ══ TRENDS TAB ══ */}
      {tab==="trends" && <div>
        <div style={{ padding:"10px 16px",borderBottom:`1px solid ${T.b}` }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 키워드 검색..."
            style={{ width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:9,padding:"10px 14px",color:T.t,fontSize:13 }} />
        </div>
        <div style={{ display:"flex",gap:5,padding:"8px 16px",overflowX:"auto",borderBottom:`1px solid ${T.b}` }}>
          {CATS.map(c2=>(
            <button key={c2.id} onClick={()=>setCat(c2.id)}
              style={{ padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:cat===c2.id?T.ac:T.c,color:cat===c2.id?"#fff":T.ts,whiteSpace:"nowrap",transition:"all .2s" }}>
              {c2.i} {c2.l}
            </button>
          ))}
        </div>

        {loading&&!trends.length&&(
          <div style={{ padding:60,textAlign:"center" }}>
            <Spin s={32}/>
            <div style={{ marginTop:16,fontSize:14,color:T.ts,animation:"pulse 1.5s infinite" }}>8개 소스에서 실시간 수집중...</div>
          </div>
        )}

        {/* ── Trend Cards ── */}
        <div style={{ padding:"10px 14px" }}>
          {filtered.slice(0,50).map((t2,idx)=>{
            const src=SRC[t2.source]||{};
            const ht=HEAT[t2.heat]||{};
            const isSel=sel?.id===t2.id;
            return (
              <div key={t2.id}
                style={{ background:isSel?`linear-gradient(135deg,${T.ca},${T.c})`:T.c, border:`1px solid ${isSel?T.acb:T.b}`, borderLeft:`3px solid ${isSel?T.ac:ht.c||T.b}`, borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:"pointer",transition:"all .15s",animation:`fadeUp .3s ease ${idx*.012}s both`,boxShadow:isSel?`0 4px 20px ${T.ac}20`:"none" }}
                onClick={()=>analyze(t2)}>
                <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  <ScoreBadge score={t2.trendScore}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",gap:5,alignItems:"center",marginBottom:7,flexWrap:"wrap" }}>
                      <Pill color={ht.c}>{ht.l}</Pill>
                      <Pill color={src.c} bg={src.b}>{src.i} {src.l}</Pill>
                      {t2.sub&&<Pill color={T.tm}>r/{t2.sub}</Pill>}
                      {t2.traffic>0&&<Pill color={T.am}>{t2.traffic.toLocaleString()}+ 검색</Pill>}
                      {t2.stars>0&&<Pill color={T.am}>★{t2.stars.toLocaleString()}</Pill>}
                      <span style={{ fontSize:10,color:T.tm,fontFamily:T.m,marginLeft:"auto" }}>{t2.ageLabel}</span>
                    </div>
                    <div style={{ fontSize:15,fontWeight:700,lineHeight:1.5,marginBottom:6 }}>{t2.title}</div>
                    {t2.tagline&&<div style={{ fontSize:11,color:T.ts,marginBottom:6 }}>{t2.tagline}</div>}
                    <Bar pct={t2.trendScore} color={t2.trendScore>=80?T.r:t2.trendScore>=55?T.am:T.g}/>
                    <div style={{ display:"flex",gap:12,marginTop:6,fontSize:11,fontFamily:T.m,color:T.tm }}>
                      {t2.score>0&&<span>▲ {t2.score.toLocaleString()}</span>}
                      {t2.comments>0&&<span>💬 {t2.comments.toLocaleString()}</span>}
                      <span style={{ marginLeft:"auto",color:T.ac,fontWeight:600 }}>클릭 → AI 분석 시작</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading&&!filtered.length&&(
            <div style={{ textAlign:"center",padding:48,color:T.tm }}>해당 조건에 맞는 트렌드가 없습니다</div>
          )}
        </div>

        {/* ── Analysis Panel ── */}
        {(aL||analysis)&&sel&&(
          <div ref={analysisRef} style={{ margin:"0 14px 14px",background:T.s2,border:`1px solid ${T.acb}`,borderRadius:14,overflow:"hidden",animation:"fadeUp .25s ease" }}>
            <div style={{ padding:"16px 18px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.acd},transparent)` }}>
              <span style={{ fontSize:22 }}>🤖</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:800 }}>AI 콘텐츠 분석 <span style={{ fontSize:10,color:"#4285f4",fontFamily:T.m,fontWeight:700,background:"#4285f415",padding:"2px 6px",borderRadius:4 }}>Gemini</span></div>
                <div style={{ fontSize:11,color:T.ts,fontFamily:T.m,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sel.title}</div>
              </div>
              {aL&&<Spin/>}
              <button onClick={()=>{setSel(null);setAnalysis(null);setScript(null);}} style={{ width:28,height:28,borderRadius:7,background:T.c,border:`1px solid ${T.b}`,color:T.ts,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>

            {aL&&<div style={{ padding:48,textAlign:"center" }}><Spin s={24}/><div style={{ marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite" }}>Gemini가 분석중...</div></div>}

            {apiError&&<div style={{ padding:16,background:T.rd,margin:14,borderRadius:9,fontSize:12,color:T.r }}>⚠️ {apiError} — API Key를 확인해주세요.</div>}

            {analysis&&!analysis.error&&<div style={{ padding:16 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14 }}>
                {[{l:"기회점수",v:`${analysis.opportunity}/10`,c:T.ac},{l:"경쟁강도",v:analysis.competition,c:T.t},{l:"시급성",v:analysis.urgency,c:analysis.urgency==="즉시"?T.r:T.am}].map((s2,i)=>(
                  <div key={i} style={{ background:T.c,borderRadius:10,padding:"14px 10px",textAlign:"center" }}>
                    <div style={{ fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600 }}>{s2.l}</div>
                    <div style={{ fontSize:20,fontWeight:900,color:s2.c,fontFamily:T.m,marginTop:4 }}>{s2.v}</div>
                  </div>
                ))}
              </div>
              {analysis.summary_ko&&<div style={{ background:T.c,borderRadius:10,padding:14,marginBottom:10 }}><div style={{ fontSize:10,color:T.ts,fontFamily:T.m,fontWeight:600,marginBottom:6 }}>📊 분석 요약</div><div style={{ fontSize:13,lineHeight:1.7 }}>{analysis.summary_ko}</div></div>}
              {analysis.angle&&<div style={{ background:`${T.ac}0c`,border:`1px solid ${T.acb}`,borderRadius:10,padding:12,marginBottom:10 }}><div style={{ fontSize:10,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:4 }}>💡 채널 앵글</div><div style={{ fontSize:13,lineHeight:1.6 }}>{analysis.angle}</div></div>}
              {analysis.best_time&&<div style={{ background:T.amd,border:`1px solid ${T.amb}`,borderRadius:10,padding:12,marginBottom:14,display:"flex",gap:10,alignItems:"center" }}><span style={{ fontSize:18 }}>⏰</span><div><div style={{ fontSize:10,color:T.am,fontFamily:T.m,fontWeight:700 }}>업로드 타이밍</div><div style={{ fontSize:13,marginTop:2 }}>{analysis.best_time}</div></div></div>}
              <div style={{ fontSize:11,color:T.ts,fontFamily:T.m,fontWeight:700,marginBottom:8,letterSpacing:".05em" }}>🎬 영상 아이디어</div>
              {(analysis.videos||[]).map((v,i)=>(
                <div key={i} style={{ background:T.c,border:`1px solid ${T.b}`,borderRadius:10,padding:14,marginBottom:8 }}>
                  <div style={{ fontSize:14,fontWeight:800,marginBottom:8 }}>{v.title}</div>
                  <div style={{ display:"flex",gap:5,marginBottom:12 }}><Pill>{v.format}</Pill><Pill color={T.g}>예상 {v.views}</Pill></div>
                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={e=>{e.stopPropagation();addPipe(sel,v);}} style={{ flex:1,padding:"9px",borderRadius:8,background:T.acd,border:`1px solid ${T.acb}`,color:T.ac,fontSize:12,fontWeight:700,cursor:"pointer" }}>📋 파이프라인</button>
                    <button onClick={e=>{e.stopPropagation();genScript(v);}} style={{ flex:1,padding:"9px",borderRadius:8,background:T.gd,border:`1px solid ${T.gb}`,color:T.g,fontSize:12,fontWeight:700,cursor:"pointer" }}>✍️ 대본 생성</button>
                  </div>
                </div>
              ))}
              {analysis.tags&&<div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:10 }}>{analysis.tags.map((tg,i)=><Pill key={i} color={T.ac} bg={T.acd}>{tg}</Pill>)}</div>}
            </div>}
          </div>
        )}

        {/* ── Script Panel ── */}
        {(sL||script)&&(
          <div style={{ margin:"0 14px 14px",background:T.s2,border:`1px solid ${T.gb}`,borderRadius:14,overflow:"hidden",animation:"fadeUp .25s ease" }}>
            <div style={{ padding:"16px 18px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.gd},transparent)` }}>
              <span style={{ fontSize:22 }}>✍️</span>
              <div style={{ fontSize:14,fontWeight:800 }}>AI 대본 초안</div>
              {sL&&<div style={{ marginLeft:"auto" }}><Spin c={T.g}/></div>}
            </div>
            {sL&&<div style={{ padding:48,textAlign:"center" }}><Spin s={24} c={T.g}/><div style={{ marginTop:12,fontSize:13,color:T.ts,animation:"pulse 1.5s infinite" }}>대본 생성중...</div></div>}
            {script&&!script.error&&<div style={{ padding:16 }}>
              {script.hook&&<div style={{ background:`${T.ac}0c`,border:`1px solid ${T.acb}`,borderRadius:10,padding:14,marginBottom:12 }}><div style={{ fontSize:10,color:T.ac,fontFamily:T.m,fontWeight:700,marginBottom:6 }}>🎯 오프닝 후킹 (15초)</div><div style={{ fontSize:14,lineHeight:1.7,fontStyle:"italic" }}>"{script.hook}"</div></div>}
              {(script.sections||[]).map((sec,i)=>(
                <div key={i} style={{ display:"flex",gap:12,marginBottom:6,padding:"12px 14px",background:T.c,borderRadius:9,border:`1px solid ${T.b}` }}>
                  <div style={{ flexShrink:0,minWidth:52 }}>
                    <div style={{ fontSize:11,color:T.ac,fontFamily:T.m,fontWeight:700 }}>{sec.ts}</div>
                    <div style={{ fontSize:12,fontWeight:800,marginTop:2 }}>{sec.name}</div>
                  </div>
                  <div style={{ fontSize:12,color:T.ts,lineHeight:1.6,borderLeft:`2px solid ${T.b}`,paddingLeft:12 }}>{sec.desc}</div>
                </div>
              ))}
              {script.desc&&<div style={{ background:T.c,borderRadius:9,padding:12,marginTop:10 }}><div style={{ fontSize:10,color:T.tm,fontFamily:T.m,fontWeight:600,marginBottom:4 }}>📝 영상 설명문</div><div style={{ fontSize:12,lineHeight:1.6,color:T.ts }}>{script.desc}</div></div>}
            </div>}
          </div>
        )}
      </div>}

      {/* ══ PIPELINE TAB ══ */}
      {tab==="pipeline"&&(
        <div style={{ padding:16,animation:"fadeUp .3s ease" }}>
          {!pipe.length?(
            <div style={{ textAlign:"center",padding:60,color:T.tm }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>파이프라인이 비어있습니다</div>
              <div style={{ fontSize:13,color:T.ts,lineHeight:1.8 }}>트렌드 클릭 → AI 분석 → 영상 아이디어 → 파이프라인 추가</div>
            </div>
          ):(
            <>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:20 }}>
                {STAGES.map(s2=>{
                  const cnt=pipe.filter(p=>p.stage===s2.id).length;
                  return (
                    <div key={s2.id} style={{ background:T.c,border:`1px solid ${cnt>0?s2.c+"40":T.b}`,borderRadius:10,padding:"12px 8px",textAlign:"center" }}>
                      <div style={{ fontSize:20 }}>{s2.i}</div>
                      <div style={{ fontSize:11,fontWeight:700,color:s2.c,fontFamily:T.m,marginTop:4 }}>{s2.l}</div>
                      <div style={{ fontSize:24,fontWeight:900,color:cnt>0?s2.c:T.tm,fontFamily:T.m }}>{cnt}</div>
                    </div>
                  );
                })}
              </div>
              {STAGES.map(stage=>{
                const items=pipe.filter(p=>p.stage===stage.id);
                if(!items.length) return null;
                return (
                  <div key={stage.id} style={{ marginBottom:18 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 14px",background:T.s2,borderRadius:9,border:`1px solid ${stage.c}20` }}>
                      <span style={{ fontSize:18 }}>{stage.i}</span>
                      <span style={{ fontSize:14,fontWeight:800,color:stage.c }}>{stage.l}</span>
                      <span style={{ fontSize:11,color:T.tm,fontFamily:T.m }}>({items.length}개)</span>
                    </div>
                    {items.map(item=>(
                      <div key={item.id} style={{ background:T.c,border:`1px solid ${T.b}`,borderLeft:`3px solid ${stage.c}`,borderRadius:10,padding:14,marginBottom:8 }}>
                        <div style={{ fontSize:14,fontWeight:800,marginBottom:4 }}>{item.video}</div>
                        <div style={{ fontSize:11,color:T.ts,marginBottom:10 }}>원본: {item.trend.slice(0,50)}...</div>
                        <div style={{ display:"flex",gap:5,marginBottom:10,flexWrap:"wrap" }}>
                          <Pill>{item.format}</Pill>
                          <Pill color={T.am}>트렌드 {item.score}점</Pill>
                          <Pill color={T.tm}>{item.added}</Pill>
                        </div>
                        <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                          {STAGES.filter(s2=>s2.id!==stage.id).map(s2=>(
                            <button key={s2.id} onClick={()=>moveStage(item.id,s2.id)} style={{ padding:"6px 10px",borderRadius:6,background:`${s2.c}12`,border:`1px solid ${s2.c}30`,color:s2.c,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.m }}>
                              {s2.i} {s2.l}
                            </button>
                          ))}
                          <button onClick={()=>rmPipe(item.id)} style={{ padding:"6px 10px",borderRadius:6,background:T.rd,border:`1px solid ${T.rb}`,color:T.r,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.m,marginLeft:"auto" }}>✕ 삭제</button>
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

      <div style={{ padding:"20px 16px",borderTop:`1px solid ${T.b}`,textAlign:"center",marginTop:8 }}>
        <div style={{ fontSize:10,color:T.tm,fontFamily:T.m,lineHeight:2 }}>
          TREND RADAR v5.0 · Powered by <span style={{ color:"#4285f4" }}>Google Gemini 1.5 Flash</span> (무료 1,500회/일)<br/>
          HackerNews · Reddit · Google Trends KR/US/Global · 네이버뉴스 · ProductHunt · GitHub Trending
        </div>
      </div>
    </div>
  </>);
}

