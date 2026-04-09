import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

const MODEL = "claude-sonnet-4-20250514";

/* ── Design ── */
const T={bg:"#06060b",s:"#0d0d14",s2:"#111119",c:"#13131d",ch:"#1a1a28",ca:"#1e1e2f",b:"#ffffff08",ba:"#ffffff14",bg2:"#ffffff20",ac:"#818cf8",acd:"#818cf815",g:"#34d399",gd:"#34d39915",am:"#fbbf24",amd:"#fbbf2415",r:"#f87171",rd:"#f8717115",cy:"#22d3ee",cyd:"#22d3ee15",ro:"#fb7185",t:"#e4e4ec",ts:"#9898b0",tm:"#5a5a72",m:"'JetBrains Mono','SF Mono',monospace",f:"'Inter',-apple-system,sans-serif"};

const Pill=({children,color=T.ts,bg:b})=><span style={{fontSize:10,fontWeight:600,letterSpacing:".04em",padding:"2px 7px",borderRadius:4,background:b||`${color}18`,color,fontFamily:T.m,whiteSpace:"nowrap"}}>{children}</span>;
const Bar=({pct,color=T.ac})=><div style={{width:"100%",height:3,background:`${color}15`,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>;
const Spin=({s=14,c=T.ac})=><div style={{width:s,height:s,border:`2px solid ${c}25`,borderTopColor:c,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;

/* ── Sources ── */
const SRC={
  hackernews:{l:"HackerNews",i:"Y",c:"#ff6600",b:"#ff660018"},
  reddit:{l:"Reddit",i:"R",c:"#ff4500",b:"#ff450018"},
  google_kr:{l:"Google KR",i:"🇰🇷",c:"#4285f4",b:"#4285f418"},
  google_us:{l:"Google US",i:"🇺🇸",c:"#34a853",b:"#34a85318"},
  google_gl:{l:"Google 글로벌",i:"🌍",c:"#ea4335",b:"#ea433518"},
  naver:{l:"네이버뉴스",i:"N",c:"#03c75a",b:"#03c75a18"},
  producthunt:{l:"ProductHunt",i:"P",c:"#da552f",b:"#da552f18"},
  github:{l:"GitHub",i:"G",c:"#8b5cf6",b:"#8b5cf618"},
};

const CATS=[{id:"all",l:"전체",i:"◎"},{id:"ai",l:"AI/ML",i:"⬡"},{id:"tech",l:"테크",i:"◇"},{id:"biz",l:"비즈니스",i:"△"},{id:"life",l:"라이프",i:"○"},{id:"career",l:"커리어",i:"◆"},{id:"product",l:"신제품",i:"★"}];
const STAGES=[{id:"discovered",l:"발견",c:T.cy,i:"🔍"},{id:"analyzing",l:"분석중",c:T.am,i:"🔬"},{id:"scripting",l:"대본작성",c:T.ac,i:"✍️"},{id:"producing",l:"제작중",c:T.ro,i:"🎬"},{id:"published",l:"발행완료",c:T.g,i:"✅"}];
const HEAT={explosive:{l:"🔥 폭발",c:T.r},rising:{l:"📈 상승",c:T.am},steady:{l:"→ 안정",c:T.g},cooling:{l:"↘ 하락",c:T.tm}};

function timeAgo(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<60)return`${m}분 전`;const h=Math.floor(m/60);if(h<24)return`${h}시간 전`;return`${Math.floor(h/24)}일 전`}
function classify(title){const t=title.toLowerCase();if(/\bai\b|artificial|llm|gpt|claude|gemini|openai|anthropic|machine learning|neural|transformer|diffusion|agent|챗봇|인공지능|딥러닝/.test(t))return"ai";if(/startup|founder|funding|vc|launch|스타트업|투자|유니콘/.test(t))return"biz";if(/career|job|hire|salary|이직|채용|연봉|퇴사|취업/.test(t))return"career";if(/건강|운동|다이어트|루틴|습관|명상|수면|여행|맛집/.test(t))return"life";if(/product|app|tool|saas|launch|ship/.test(t))return"product";return"tech"}
function scoreItem(item){const age=(Date.now()-item.time)/3600000;const rec=Math.max(0,100-age*2);let eng=50;if(item.source==="hackernews")eng=Math.min(100,item.score/5+item.comments/2);else if(item.source==="reddit")eng=Math.min(100,item.score/50+item.comments/3);else if(item.source.startsWith("google_"))eng=Math.min(100,item.traffic?item.traffic/5000*100:60);else if(item.source==="producthunt")eng=Math.min(100,(item.score||50)/3);else if(item.source==="github")eng=Math.min(100,(item.score||0)/10+50);return Math.max(5,Math.min(100,Math.round(eng*.6+rec*.4)))}
function heatOf(s,a){if(s>=85&&a<6)return"explosive";if(s>=65)return"rising";if(s>=40)return"steady";return"cooling"}

/* ── API Fetchers ── */
async function fetchHN(){try{const[a,b]=await Promise.all([fetch("https://hacker-news.firebaseio.com/v0/topstories.json"),fetch("https://hacker-news.firebaseio.com/v0/beststories.json")]);const[t,be]=await Promise.all([a.json(),b.json()]);const ids=[...new Set([...t.slice(0,15),...be.slice(0,10)])].slice(0,20);const items=await Promise.all(ids.map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json())));return items.filter(s=>s?.title).map(s=>({id:`hn-${s.id}`,title:s.title,url:s.url||`https://news.ycombinator.com/item?id=${s.id}`,score:s.score||0,comments:s.descendants||0,source:"hackernews",time:s.time*1000,author:s.by}))}catch{return[]}}

async function fetchRD(){const subs=["artificial","MachineLearning","technology","productivity","SideProject","selfimprovement"];try{const res=await Promise.all(subs.map(s=>fetch(`https://www.reddit.com/r/${s}/hot.json?limit=5`).then(r=>r.json()).then(d=>(d?.data?.children||[]).map(c=>c.data)).catch(()=>[])));return res.flat().filter(p=>p?.title&&!p.stickied).map(p=>({id:`rd-${p.id}`,title:p.title,url:`https://reddit.com${p.permalink}`,score:p.score||0,comments:p.num_comments||0,source:"reddit",time:(p.created_utc||0)*1000,author:p.author,sub:p.subreddit}))}catch{return[]}}

async function fetchGT(geo,srcId){try{const res=await fetch(`https://trends.google.com/trending/rss?geo=${geo}`);const text=await res.text();const parser=new DOMParser();const xml=parser.parseFromString(text,"text/xml");const items=xml.querySelectorAll("item");const r=[];items.forEach((item,i)=>{if(i>=15)return;const title=item.querySelector("title")?.textContent||"";const traffic=item.querySelector("ht\\:approx_traffic,approx_traffic")?.textContent||"";const link=item.querySelector("link")?.textContent||"";const pubDate=item.querySelector("pubDate")?.textContent||"";const newsItems=item.querySelectorAll("ht\\:news_item,news_item");let newsTitle="";if(newsItems.length>0)newsTitle=newsItems[0].querySelector("ht\\:news_item_title,news_item_title")?.textContent||"";const trafficNum=parseInt(traffic.replace(/[^0-9]/g,""))||0;r.push({id:`g${geo||"gl"}-${i}-${Date.now()}`,title,url:link||`https://trends.google.com/trending?geo=${geo}`,score:Math.min(100,Math.round(trafficNum/5000*100))||50,comments:0,source:srcId,time:pubDate?new Date(pubDate).getTime():Date.now(),traffic:trafficNum,newsTitle})});return r}catch{return[]}}

async function fetchNaver(){try{const res=await fetch(`https://news.google.com/rss/search?q=site:news.naver.com+AI+OR+인공지능+OR+테크+OR+자기계발&hl=ko&gl=KR&ceid=KR:ko`);const text=await res.text();const parser=new DOMParser();const xml=parser.parseFromString(text,"text/xml");const items=xml.querySelectorAll("item");const r=[];items.forEach((item,i)=>{if(i>=15)return;const title=item.querySelector("title")?.textContent||"";const link=item.querySelector("link")?.textContent||"";const pubDate=item.querySelector("pubDate")?.textContent||"";r.push({id:`nv-${i}-${Date.now()}`,title:title.replace(/ - .*$/,"").trim(),url:link||"https://news.naver.com",score:0,comments:0,source:"naver",time:pubDate?new Date(pubDate).getTime():Date.now()})});return r.filter((v,i,a)=>a.findIndex(t2=>t2.title===v.title)===i).slice(0,15)}catch{return[]}}

// Product Hunt — via their public RSS feed
async function fetchPH(){try{const res=await fetch("https://www.producthunt.com/feed");const text=await res.text();const parser=new DOMParser();const xml=parser.parseFromString(text,"text/xml");const items=xml.querySelectorAll("item");const r=[];items.forEach((item,i)=>{if(i>=12)return;const title=item.querySelector("title")?.textContent||"";const link=item.querySelector("link")?.textContent||"";const pubDate=item.querySelector("pubDate")?.textContent||"";const desc=item.querySelector("description")?.textContent||"";r.push({id:`ph-${i}-${Date.now()}`,title,url:link||"https://www.producthunt.com",score:50,comments:0,source:"producthunt",time:pubDate?new Date(pubDate).getTime():Date.now(),tagline:desc.replace(/<[^>]*>/g,"").slice(0,100)})});return r}catch{return[]}}

// GitHub Trending — via unofficial RSS
async function fetchGH(){try{const res=await fetch("https://github.com/trending?since=daily&spoken_language_code=en");const text=await res.text();const parser=new DOMParser();const doc=parser.parseFromString(text,"text/html");const repos=doc.querySelectorAll("article.Box-row");const r=[];repos.forEach((repo,i)=>{if(i>=10)return;const nameEl=repo.querySelector("h2 a");const name=nameEl?.textContent?.trim().replace(/\s+/g," ")||"";const href=nameEl?.getAttribute("href")||"";const desc=repo.querySelector("p")?.textContent?.trim()||"";const starsText=repo.querySelector("[href$='/stargazers']")?.textContent?.trim()||"0";const stars=parseInt(starsText.replace(/,/g,""))||0;r.push({id:`gh-${i}-${Date.now()}`,title:`${name}: ${desc}`.slice(0,120),url:`https://github.com${href}`,score:stars,comments:0,source:"github",time:Date.now()-i*3600000,stars})});return r}catch{return[]}}

/* ── Main Component ── */
export default function TrendRadarV4(){
  const[trends,setTrends]=useState([]);
  const[loading,setLoading]=useState(true);
  const[lastRefresh,setLastRefresh]=useState(null);
  const[tab,setTab]=useState("trends");
  const[cat,setCat]=useState("all");
  const[srcF,setSrcF]=useState("all");
  const[q,setQ]=useState("");
  const[sel,setSel]=useState(null);
  const[aL,setAL]=useState(false);
  const[analysis,setAnalysis]=useState(null);
  const[sL,setSL]=useState(false);
  const[script,setScript]=useState(null);
  const[pipe,setPipe]=useState([]);
  const[auto,setAuto]=useState(true);
  const[fStatus,setFStatus]=useState({});
  const timer=useRef(null);

  const fetchAll=useCallback(async(showL=true)=>{
    if(showL)setLoading(true);
    const st={};const mk=(k,r)=>{st[k]={ok:r.length>0,n:r.length}};
    const[hn,rd,gKR,gUS,gGL,nv,ph,gh]=await Promise.all([
      fetchHN().then(r=>{mk("hackernews",r);return r}),
      fetchRD().then(r=>{mk("reddit",r);return r}),
      fetchGT("KR","google_kr").then(r=>{mk("google_kr",r);return r}),
      fetchGT("US","google_us").then(r=>{mk("google_us",r);return r}),
      fetchGT("","google_gl").then(r=>{mk("google_gl",r);return r}),
      fetchNaver().then(r=>{mk("naver",r);return r}),
      fetchPH().then(r=>{mk("producthunt",r);return r}),
      fetchGH().then(r=>{mk("github",r);return r}),
    ]);
    const all=[...hn,...rd,...gKR,...gUS,...gGL,...nv,...ph,...gh];
    const scored=all.map(item=>{const age=(Date.now()-item.time)/3600000;const ts2=scoreItem(item);return{...item,trendScore:ts2,category:classify(item.title),heat:heatOf(ts2,age),ageLabel:timeAgo(item.time)}}).sort((a,b)=>b.trendScore-a.trendScore);
    setTrends(scored);setLastRefresh(new Date());setFStatus(st);setLoading(false);
  },[]);

  useEffect(()=>{fetchAll();return()=>clearInterval(timer.current)},[]);
  useEffect(()=>{clearInterval(timer.current);if(auto)timer.current=setInterval(()=>fetchAll(false),5*60*1000);return()=>clearInterval(timer.current)},[auto,fetchAll]);

  const filtered=trends.filter(t2=>{if(cat!=="all"&&t2.category!==cat)return false;if(srcF!=="all"&&t2.source!==srcF)return false;if(q&&!t2.title.toLowerCase().includes(q.toLowerCase()))return false;return true});

  const stats={total:trends.length,exp:trends.filter(t2=>t2.heat==="explosive").length,rise:trends.filter(t2=>t2.heat==="rising").length,src:Object.keys(fStatus).filter(k=>fStatus[k]?.ok).length};

  /* AI */
  const analyze=useCallback(async(trend)=>{setSel(trend);setAL(true);setAnalysis(null);setScript(null);try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:1000,messages:[{role:"user",content:`Korean YouTube strategist for "AI × 자기계발" channel targeting 20-40대 직장인.
Analyze for YouTube content opportunity. RESPOND ONLY IN VALID JSON. No markdown.
Topic:"${trend.title}" Source:${trend.source} Score:${trend.trendScore} Heat:${trend.heat} ${trend.tagline?`Tagline:${trend.tagline}`:""}
{"opportunity":<1-10>,"competition":"<낮음|보통|높음>","urgency":"<즉시|1주내|여유>","summary_ko":"<Korean 2-3 sentences>","angle":"<unique channel angle Korean>","videos":[{"title":"<Korean max 40ch>","format":"<숏폼|롱폼|튜토리얼|분석>","views":"<예상>"},{"title":"...","format":"...","views":"..."},{"title":"...","format":"...","views":"..."}],"tags":["#t1","#t2","#t3","#t4","#t5"],"best_time":"<Korean>"}`}]})});const d=await res.json();const raw=(d.content||[]).map(c2=>c2.text||"").join("");setAnalysis(JSON.parse(raw.replace(/```json|```/g,"").trim()))}catch{setAnalysis({error:true})}setAL(false)},[]);

  const genScript=useCallback(async(v)=>{setSL(true);setScript(null);try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:1000,messages:[{role:"user",content:`Korean YT scriptwriter. Script for:"${v.title}" (${v.format}) RESPOND ONLY IN VALID JSON.
{"hook":"<15sec Korean>","sections":[{"ts":"0:00","name":"후킹","desc":"<KR>"},{"ts":"0:15","name":"문제제기","desc":"<KR>"},{"ts":"2:00","name":"핵심","desc":"<KR>"},{"ts":"6:00","name":"실전","desc":"<KR>"},{"ts":"8:00","name":"CTA","desc":"<KR>"}],"seo":["t1","t2","t3","t4","t5"],"desc":"<2-sentence KR>"}`}]})});const d=await res.json();const raw=(d.content||[]).map(c2=>c2.text||"").join("");setScript(JSON.parse(raw.replace(/```json|```/g,"").trim()))}catch{setScript({error:true})}setSL(false)},[]);

  const addPipe=(trend,v)=>setPipe(p=>[...p,{id:Date.now(),trend:trend.title,video:v.title,format:v.format,stage:"discovered",added:new Date().toLocaleString("ko-KR"),score:trend.trendScore}]);
  const moveStage=(id,st2)=>setPipe(p=>p.map(i=>i.id===id?{...i,stage:st2}:i));
  const rmPipe=(id)=>setPipe(p=>p.filter(i=>i.id!==id));

  return(<>
    <Head><title>Trend Radar v4 — AI 콘텐츠 파이프라인</title><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></Head>
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.f,margin:0}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes liveDot{0%,100%{box-shadow:0 0 0 0 ${T.g}60}50%{box-shadow:0 0 0 6px ${T.g}00}}*{box-sizing:border-box;margin:0;scrollbar-width:thin;scrollbar-color:${T.ba} transparent}input:focus,button:focus{outline:none}body{margin:0;background:${T.bg}}`}</style>

      {/* Header */}
      <header style={{padding:"12px 16px",borderBottom:`1px solid ${T.b}`,background:T.s,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.ac},${T.cy})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>T</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,letterSpacing:"-0.03em",display:"flex",alignItems:"center",gap:6}}>
              TREND RADAR <span style={{fontSize:9,fontFamily:T.m,color:T.r,fontWeight:700,background:T.rd,padding:"1px 5px",borderRadius:3}}>v4</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,color:T.g,fontFamily:T.m,fontWeight:600}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:T.g,animation:"liveDot 2s infinite"}}/>LIVE
              </span>
            </div>
            <div style={{fontSize:9,color:T.tm,fontFamily:T.m}}>{lastRefresh?`${lastRefresh.toLocaleTimeString("ko-KR")} · ${stats.total}건 · ${stats.src}/8 소스`:"수집 대기중..."}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setAuto(!auto)} style={{padding:"4px 8px",borderRadius:5,fontSize:10,fontFamily:T.m,fontWeight:600,cursor:"pointer",border:`1px solid ${auto?T.g:T.tm}30`,background:auto?T.gd:"transparent",color:auto?T.g:T.tm}}>{auto?"⏱ 5분":"⏸ 수동"}</button>
          <button onClick={()=>fetchAll()} disabled={loading} style={{padding:"4px 10px",borderRadius:5,fontSize:10,fontFamily:T.m,fontWeight:600,cursor:"pointer",background:T.acd,border:`1px solid ${T.ac}30`,color:T.ac,opacity:loading?.5:1}}>{loading?"...":"↻ 수집"}</button>
        </div>
      </header>

      {/* Source Status */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.b}`,overflowX:"auto"}}>
        {Object.entries(SRC).map(([k,v])=>{const st2=fStatus[k];return(
          <div key={k} style={{flex:"1 0 auto",padding:"5px 6px",borderRight:`1px solid ${T.b}`,textAlign:"center",minWidth:60}}>
            <div style={{fontSize:11}}>{v.i}</div>
            <div style={{fontSize:9,fontFamily:T.m,fontWeight:600,color:st2?.ok?T.g:loading?T.am:T.r}}>{st2?`${st2.n}`:".."}</div>
            <div style={{fontSize:7,color:T.tm,fontFamily:T.m}}>{v.l}</div>
          </div>
        )})}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.b}`}}>
        {[{l:"전체",v:stats.total,c:T.t},{l:"🔥폭발",v:stats.exp,c:T.r},{l:"📈상승",v:stats.rise,c:T.am},{l:"소스",v:`${stats.src}/8`,c:T.ac}].map((s2,i)=>(
          <div key={i} style={{padding:"10px 8px",textAlign:"center",borderRight:i<3?`1px solid ${T.b}`:"none"}}>
            <div style={{fontSize:9,color:T.tm,fontFamily:T.m}}>{s2.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s2.c,fontFamily:T.m,lineHeight:1.2,marginTop:2}}>{s2.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.b}`,background:T.s}}>
        {[{id:"trends",l:"🔍 라이브 트렌드",n:filtered.length},{id:"pipeline",l:"📋 파이프라인",n:pipe.length}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"10px",background:"transparent",border:"none",borderBottom:tab===tb.id?`2px solid ${T.ac}`:"2px solid transparent",color:tab===tb.id?T.t:T.tm,fontSize:12,fontWeight:700,cursor:"pointer"}}>{tb.l} <span style={{fontFamily:T.m,fontSize:10,opacity:.5}}>({tb.n})</span></button>
        ))}
      </div>

      {/* ═══ TRENDS ═══ */}
      {tab==="trends"&&<div>
        <div style={{padding:"8px 12px",borderBottom:`1px solid ${T.b}`}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="키워드 검색..." style={{width:"100%",background:T.c,border:`1px solid ${T.b}`,borderRadius:7,padding:"8px 12px",color:T.t,fontSize:12}}/></div>
        <div style={{display:"flex",gap:4,padding:"6px 12px",overflowX:"auto",borderBottom:`1px solid ${T.b}`}}>
          <button onClick={()=>setSrcF("all")} style={{padding:"3px 8px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:"none",background:srcF==="all"?T.ac:T.c,color:srcF==="all"?"#fff":T.ts}}>전체</button>
          {Object.entries(SRC).map(([k,v])=><button key={k} onClick={()=>setSrcF(k)} style={{padding:"3px 8px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:"none",background:srcF===k?v.b:T.c,color:srcF===k?v.c:T.ts,whiteSpace:"nowrap"}}>{v.i} {v.l}</button>)}
        </div>
        <div style={{display:"flex",gap:4,padding:"6px 12px",overflowX:"auto",borderBottom:`1px solid ${T.b}`}}>
          {CATS.map(c2=><button key={c2.id} onClick={()=>setCat(c2.id)} style={{padding:"3px 8px",borderRadius:14,fontSize:10,fontWeight:600,cursor:"pointer",border:"none",background:cat===c2.id?T.ac:T.c,color:cat===c2.id?"#fff":T.ts,whiteSpace:"nowrap"}}>{c2.i} {c2.l}</button>)}
        </div>

        {loading&&!trends.length&&<div style={{padding:48,textAlign:"center"}}><Spin s={24}/><div style={{marginTop:12,fontSize:12,color:T.ts,animation:"pulse 1.5s infinite"}}>8개 소스에서 실시간 데이터 수집중...</div></div>}

        <div style={{padding:"6px 10px"}}>
          {filtered.slice(0,50).map((t2,idx)=>{const src=SRC[t2.source]||{};const ht=HEAT[t2.heat]||{};const isSel=sel?.id===t2.id;return(
            <div key={t2.id} style={{background:isSel?T.ca:T.c,border:`1px solid ${isSel?T.bg2:T.b}`,borderRadius:10,padding:12,marginBottom:6,cursor:"pointer",transition:"all .15s",animation:`fadeUp .3s ease ${idx*.012}s both`}} onClick={()=>analyze(t2)}>
              <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                <Pill color={ht.c}>{ht.l}</Pill>
                <Pill color={src.c} bg={src.b}>{src.i} {src.l}</Pill>
                {t2.sub&&<Pill color={T.tm}>r/{t2.sub}</Pill>}
                {t2.traffic>0&&<Pill color={T.am}>{t2.traffic.toLocaleString()}+ 검색</Pill>}
                {t2.stars>0&&<Pill color={T.am}>★{t2.stars.toLocaleString()}</Pill>}
                <span style={{fontSize:9,color:T.tm,fontFamily:T.m,marginLeft:"auto"}}>{t2.ageLabel}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,lineHeight:1.45}}>{t2.title}</div>
                  {t2.tagline&&<div style={{fontSize:10,color:T.ts,marginTop:2}}>{t2.tagline}</div>}
                </div>
                <div style={{fontSize:20,fontWeight:800,fontFamily:T.m,color:t2.trendScore>=80?T.r:t2.trendScore>=55?T.am:T.g,flexShrink:0}}>{t2.trendScore}</div>
              </div>
              <Bar pct={t2.trendScore} color={t2.trendScore>=80?T.r:t2.trendScore>=55?T.am:T.g}/>
              {t2.newsTitle&&<div style={{fontSize:10,color:T.ts,marginTop:4,fontStyle:"italic"}}>📰 {t2.newsTitle}</div>}
              <div style={{display:"flex",gap:10,marginTop:4,fontSize:10,fontFamily:T.m,color:T.tm}}>
                {t2.score>0&&<span>▲ {t2.score.toLocaleString()}</span>}
                {t2.comments>0&&<span>💬 {t2.comments.toLocaleString()}</span>}
              </div>
            </div>
          )})}
          {!loading&&!filtered.length&&<div style={{textAlign:"center",padding:40,color:T.tm}}>해당 조건에 맞는 트렌드가 없습니다</div>}
        </div>

        {/* Analysis */}
        {(aL||analysis)&&sel&&<div style={{margin:"0 10px 10px",background:T.s2,border:`1px solid ${T.ba}`,borderRadius:12,overflow:"hidden",animation:"fadeUp .25s ease"}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${T.acd},transparent)`}}>
            <span style={{fontSize:16}}>🤖</span>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700}}>AI 콘텐츠 분석</div><div style={{fontSize:9,color:T.tm,fontFamily:T.m,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.title}</div></div>
            {aL&&<Spin/>}
          </div>
          {aL&&<div style={{padding:36,textAlign:"center"}}><Spin s={20}/><div style={{marginTop:10,fontSize:11,color:T.ts,animation:"pulse 1.5s infinite"}}>Claude가 분석중...</div></div>}
          {analysis&&!analysis.error&&<div style={{padding:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
              {[{l:"기회",v:`${analysis.opportunity}/10`,c:T.ac},{l:"경쟁",v:analysis.competition,c:T.t},{l:"시급성",v:analysis.urgency,c:analysis.urgency==="즉시"?T.r:T.am}].map((s2,i)=><div key={i} style={{background:T.c,borderRadius:8,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:9,color:T.tm,fontFamily:T.m}}>{s2.l}</div><div style={{fontSize:15,fontWeight:800,color:s2.c,fontFamily:T.m,marginTop:3}}>{s2.v}</div></div>)}
            </div>
            {analysis.summary_ko&&<div style={{background:T.c,borderRadius:8,padding:12,marginBottom:8}}><div style={{fontSize:9,color:T.tm,fontFamily:T.m,marginBottom:4}}>분석</div><div style={{fontSize:12,lineHeight:1.65}}>{analysis.summary_ko}</div></div>}
            {analysis.angle&&<div style={{background:`${T.ac}0c`,border:`1px solid ${T.ac}20`,borderRadius:8,padding:10,marginBottom:8}}><div style={{fontSize:9,color:T.ac,fontFamily:T.m,fontWeight:600}}>💡 채널 앵글</div><div style={{fontSize:12,marginTop:3,lineHeight:1.5}}>{analysis.angle}</div></div>}
            {analysis.best_time&&<div style={{background:T.amd,border:`1px solid ${T.am}25`,borderRadius:8,padding:10,marginBottom:10,display:"flex",gap:8,alignItems:"center"}}><span>⏰</span><div><div style={{fontSize:9,color:T.am,fontFamily:T.m,fontWeight:600}}>업로드 타이밍</div><div style={{fontSize:11}}>{analysis.best_time}</div></div></div>}
            <div style={{fontSize:9,color:T.tm,fontFamily:T.m,marginBottom:6}}>영상 아이디어</div>
            {(analysis.videos||[]).map((v,i)=><div key={i} style={{background:T.c,border:`1px solid ${T.b}`,borderRadius:8,padding:10,marginBottom:5}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:5}}>{v.title}</div>
              <div style={{display:"flex",gap:4,marginBottom:8}}><Pill>{v.format}</Pill><Pill color={T.g}>예상 {v.views}</Pill></div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={e=>{e.stopPropagation();addPipe(sel,v)}} style={{flex:1,padding:7,borderRadius:6,background:T.acd,border:`1px solid ${T.ac}30`,color:T.ac,fontSize:10,fontWeight:700,cursor:"pointer"}}>📋 파이프라인</button>
                <button onClick={e=>{e.stopPropagation();genScript(v)}} style={{flex:1,padding:7,borderRadius:6,background:T.gd,border:`1px solid ${T.g}30`,color:T.g,fontSize:10,fontWeight:700,cursor:"pointer"}}>✍️ 대본생성</button>
              </div>
            </div>)}
            {analysis.tags&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:8}}>{analysis.tags.map((tg,i)=><Pill key={i} color={T.ac} bg={T.acd}>{tg}</Pill>)}</div>}
          </div>}
          {analysis?.error&&<div style={{padding:20,textAlign:"center",color:T.r,fontSize:12}}>분석 실패. 다시 시도해주세요.</div>}
        </div>}

        {/* Script */}
        {(sL||script)&&<div style={{margin:"0 10px 10px",background:T.s2,border:`1px solid ${T.g}25`,borderRadius:12,overflow:"hidden",animation:"fadeUp .25s ease"}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b}`,display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${T.gd},transparent)`}}>
            <span style={{fontSize:16}}>✍️</span><div style={{fontSize:11,fontWeight:700}}>AI 대본 초안</div>{sL&&<div style={{marginLeft:"auto"}}><Spin c={T.g}/></div>}
          </div>
          {sL&&<div style={{padding:36,textAlign:"center"}}><Spin s={20} c={T.g}/><div style={{marginTop:10,fontSize:11,color:T.ts,animation:"pulse 1.5s infinite"}}>대본 생성중...</div></div>}
          {script&&!script.error&&<div style={{padding:12}}>
            {script.hook&&<div style={{background:`${T.ac}0c`,border:`1px solid ${T.ac}20`,borderRadius:8,padding:12,marginBottom:10}}><div style={{fontSize:9,color:T.ac,fontFamily:T.m,fontWeight:600,marginBottom:3}}>🎯 후킹</div><div style={{fontSize:12,lineHeight:1.6,fontStyle:"italic"}}>"{script.hook}"</div></div>}
            {(script.sections||[]).map((sec,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:5,padding:"8px 10px",background:T.c,borderRadius:7,border:`1px solid ${T.b}`}}>
              <div style={{flexShrink:0,minWidth:40}}><div style={{fontSize:9,color:T.ac,fontFamily:T.m,fontWeight:600}}>{sec.ts}</div><div style={{fontSize:10,fontWeight:700}}>{sec.name}</div></div>
              <div style={{fontSize:11,color:T.ts,lineHeight:1.5,borderLeft:`2px solid ${T.b}`,paddingLeft:8}}>{sec.desc}</div>
            </div>)}
            {script.desc&&<div style={{background:T.c,borderRadius:7,padding:10,marginTop:8}}><div style={{fontSize:9,color:T.tm,fontFamily:T.m,marginBottom:3}}>설명문</div><div style={{fontSize:11,lineHeight:1.5,color:T.ts}}>{script.desc}</div></div>}
          </div>}
        </div>}
      </div>}

      {/* ═══ PIPELINE ═══ */}
      {tab==="pipeline"&&<div style={{padding:10,animation:"fadeUp .3s ease"}}>
        {!pipe.length?<div style={{textAlign:"center",padding:50,color:T.tm}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:13,fontWeight:700}}>파이프라인이 비어있습니다</div></div>
        :STAGES.map(stage=>{const items=pipe.filter(p=>p.stage===stage.id);if(!items.length)return null;return<div key={stage.id} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>{stage.i}</span><span style={{fontSize:11,fontWeight:700,color:stage.c,fontFamily:T.m}}>{stage.l}</span><span style={{fontSize:9,color:T.tm,fontFamily:T.m}}>({items.length})</span></div>
          {items.map(item=><div key={item.id} style={{background:T.c,border:`1px solid ${T.b}`,borderLeft:`3px solid ${stage.c}`,borderRadius:8,padding:12,marginBottom:5}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{item.video}</div>
            <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}><Pill>{item.format}</Pill><Pill color={T.tm}>점수 {item.score}</Pill></div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {STAGES.filter(s2=>s2.id!==stage.id).map(s2=><button key={s2.id} onClick={()=>moveStage(item.id,s2.id)} style={{padding:"4px 8px",borderRadius:4,background:`${s2.c}12`,border:`1px solid ${s2.c}25`,color:s2.c,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:T.m}}>→{s2.l}</button>)}
              <button onClick={()=>rmPipe(item.id)} style={{padding:"4px 8px",borderRadius:4,background:T.rd,border:`1px solid ${T.r}25`,color:T.r,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:T.m,marginLeft:"auto"}}>✕</button>
            </div>
          </div>)}
        </div>})}
      </div>}

      <div style={{padding:"16px 12px",borderTop:`1px solid ${T.b}`,textAlign:"center",marginTop:16}}>
        <div style={{fontSize:9,color:T.tm,fontFamily:T.m,lineHeight:1.8}}>
          TREND RADAR v4.0 — 8 Live Sources<br/>
          HackerNews · Reddit · Google Trends KR/US/Global · 네이버뉴스 · ProductHunt · GitHub Trending<br/>
          5분 자동갱신 · AI 분석 · 대본 생성 · 파이프라인 관리
        </div>
      </div>
    </div>
  </>);
}
