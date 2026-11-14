// pages/api/longform.js
// "롱폼 소재 창고" — 최신 트렌드 영향이 적은(에버그린) 10분+ 롱폼 소재를 발굴·검증·저장.
//
// 발굴: Claude가 카테고리/키워드로 소재 후보 제안(영어 위키 문서명·유튜브 검색어·챕터 아이디어 포함)
// 검증(무료·키 불필요): 위키백과 최근 36개월 월별 조회수 → 평균·변동성·유지율로 "오래 찾아보는 주제인지" 점수
//        (영어 위키 + 한국어 위키 연결 문서가 있으면 한국 관심도도 같이)
// 근거 영상(선택, 유튜브 할당량 101 units): 1년 넘은 8분+ 영상이 아직 조회되는지
//
// ⚠️ 저장은 이슈 후보와 같은 로컬 JSON(data/longform-topics.json) — 로컬 실행 전용.
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "longform-topics.json");
const UA = "trend-radar/1.0 (local research tool)";
const MODEL = "claude-opus-5-5";
export const FORMATS = ["검증소", "댓글이 물었다", "직접 해봤다", "TOP5", "딥다이브"];

function readAll() {
  try { return fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]") : []; } catch { return []; }
}
function writeAll(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 위키미디어는 몰아서 부르면 429(잠시 후 다시)를 준다(2026-11-14 실측: 8개 소재 병렬 조회 중 일부 실패)
// → Retry-After 만큼 기다렸다 최대 2번 재시도. 결과는 하루 캐시.
const CACHE_FILE = path.join(process.cwd(), "data", "wiki-cache.json");
let cache = null;
function cacheGet(url) {
  if (!cache) { try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch { cache = {}; } }
  const c = cache[url];
  return c && Date.now() - c.t < 86400000 ? c.d : undefined;
}
function cacheSet(url, d) {
  cache = cache || {};
  cache[url] = { t: Date.now(), d };
  try { fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch { /* noop */ }
}
async function getJson(url, ms = 10000) {
  const wiki = /wikipedia\.org|wikimedia\.org/.test(url);
  if (wiki) { const c = cacheGet(url); if (c !== undefined) return c; }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(ms) });
      if (r.status === 429) { await sleep(Math.min(30, Number(r.headers.get("retry-after")) || 5) * 1000); continue; }
      const d = r.ok ? await r.json() : null;
      if (wiki && (r.ok || r.status === 404)) cacheSet(url, d);
      return d;
    } catch { return null; }
  }
  return null;
}

// ── 위키백과 월별 조회수 (최근 36개월 완결 월) ──
function monthRange(n = 36) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // 지난달 말
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (n - 1), 1));
  const f = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}00`;
  return [f(start), f(end)];
}
async function pageviews(lang, title) {
  if (!title) return null;
  const [s, e] = monthRange(36);
  const t = encodeURIComponent(title.replace(/ /g, "_"));
  const d = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/user/${t}/monthly/${s}/${e}`);
  const items = d?.items || [];
  if (!items.length) return null;
  return items.map((x) => ({ m: x.timestamp.slice(0, 6), v: x.views }));
}
// 영어 문서명 정규화(리다이렉트 해소) + 한국어 연결 문서
async function resolveWiki(title) {
  const d = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}&prop=langlinks|info&lllang=ko&inprop=url`);
  const page = d?.query?.pages ? Object.values(d.query.pages)[0] : null;
  if (!page || page.missing !== undefined) return null;
  return { en: page.title, ko: page.langlinks?.[0]?.["*"] || null, url: page.fullurl };
}
function stats(series) {
  if (!series?.length) return null;
  const v = series.map((x) => x.v);
  const avg = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - avg) ** 2, 0) / v.length);
  const k = Math.min(12, Math.floor(v.length / 3));
  const first = v.slice(0, k).reduce((a, b) => a + b, 0) / Math.max(1, k);
  const last = v.slice(-k).reduce((a, b) => a + b, 0) / Math.max(1, k);
  const sorted = [...v].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 1;
  return { avg: Math.round(avg), cv: +(sd / Math.max(1, avg)).toFixed(2), keep: +(last / Math.max(1, first)).toFixed(2), spike: +(Math.max(...v) / Math.max(1, median)).toFixed(1), months: v.length };
}
// 에버그린 점수 0~100: 규모(월평균) × 안정성(변동 낮음) × 유지율(최근 vs 3년 전) × 반짝 감점
function evergreenScore(st) {
  if (!st) return null;
  const size = Math.min(1, Math.log10(st.avg + 1) / 5); // 월 10만 → 1.0
  const stable = 1 - (Math.min(st.cv, 1.2) / 1.2) * 0.6;
  const persist = st.keep >= 0.7 ? 1 : st.keep >= 0.4 ? 0.8 : 0.6;
  const spike = st.spike > 6 ? 0.85 : 1;
  return Math.round(100 * size * stable * persist * spike);
}
function label(st) {
  if (!st) return "데이터 없음";
  if (st.spike > 6) return "반짝 이슈 섞임";
  if (st.keep >= 1.15) return "상승 중";
  if (st.keep >= 0.7) return st.cv < 0.35 ? "꾸준함" : "꾸준함(출렁임)";
  return "서서히 하락";
}
async function enrichWiki(item) {
  const w = item.wiki_title ? await resolveWiki(item.wiki_title) : null;
  if (!w) return { ...item, wiki: null, evergreen: null };
  const en = await pageviews("en", w.en);
  const ko = w.ko ? await pageviews("ko", w.ko) : null;
  const enSt = stats(en), koSt = stats(ko);
  return {
    ...item,
    wiki: { en: w.en, ko: w.ko, url: w.url, enSeries: en, koSeries: ko, enStats: enSt, koStats: koSt },
    evergreen: { score: evergreenScore(enSt), label: label(enSt), koAvg: koSt?.avg ?? null },
  };
}

// ── 근거 영상: 1년 넘은 8분+ 영상이 아직 많이 보이는가 ──
function isoDur(s) {
  const m = String(s || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}
async function youtubeEvidence(query) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { error: "YOUTUBE_API_KEY 없음" };
  const before = new Date(Date.now() - 365 * 86400000).toISOString();
  const s = await getJson(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&maxResults=15&publishedBefore=${before}&q=${encodeURIComponent(query)}&key=${key}`);
  if (!s) return { error: "유튜브 검색 실패(할당량 소진 가능)" };
  const ids = (s.items || []).map((x) => x.id?.videoId).filter(Boolean).join(",");
  if (!ids) return { videos: [] };
  const v = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${key}`);
  const now = Date.now();
  const videos = (v?.items || []).map((x) => {
    const sec = isoDur(x.contentDetails?.duration);
    const ageY = (now - new Date(x.snippet.publishedAt).getTime()) / (365 * 86400000);
    const views = +x.statistics?.viewCount || 0;
    return { id: x.id, title: x.snippet.title, channel: x.snippet.channelTitle, url: `https://www.youtube.com/watch?v=${x.id}`, thumb: x.snippet.thumbnails?.medium?.url,
      minutes: +(sec / 60).toFixed(1), ageYears: +ageY.toFixed(1), views, viewsPerYear: Math.round(views / Math.max(1, ageY)) };
  }).filter((x) => x.minutes >= 8).sort((a, b) => b.viewsPerYear - a.viewsPerYear).slice(0, 6);
  return { videos, checkedAt: new Date().toISOString() };
}

async function discover({ category, seed, apiKey, count = 10, existing = [] }) {
  const prompt = `너는 한국어 유튜브 채널 "Virtal"의 롱폼(10~15분) 소재 기획자다. 진행자가 영상을 이끌며 설명·검증·실험하는 채널이다.
최신 트렌드에 흔들리지 않고 1~3년 뒤에도 사람들이 찾아볼 "에버그린" 소재 ${count}개를 제안하라.
${category ? `[카테고리] ${category}` : ""}${seed ? `\n[키워드/방향] ${seed}` : ""}
[이미 창고에 있는 소재 — 겹치지 말 것] ${existing.slice(0, 40).join(" / ") || "없음"}

조건:
- 10분 넘게 풀 거리가 있을 것(사례 여러 개·원리·반전·논쟁 중 2가지 이상).
- 진행자가 끼어들 여지(직접 검증·실험·댓글 질문 답변·순위 매기기)가 있을 것.
- **가장 중요:** 채널 정체성은 "사람들의 호기심·몰랐던 사실의 원인과 이유를 알려주는 채널"이다. 그 "왜?"에 대해 시청자가 댓글로 자기 생각을 쓰고 서로 의견을 펼칠 수 있는 소재를 우선하라(누구나 추측 가능 · 직관과 답이 엇갈림 · 내 경험과 연결 · 정치/젠더/종교로 번지지 않는 안전한 논쟁).
- 영상은 답을 알려준 뒤 마지막에 다시 물음표를 던지며 끝난다(채널 고정 아이덴티티) — closing_question에 그 질문을.
- 실존 개인의 사생활·명예훼손 위험, 의학·금융 조언, 정치 논쟁은 피할 것.
- wiki_title은 이 소재를 대표하는 실제 영어 위키백과 문서 제목(정확한 표기). 없으면 가장 가까운 상위 개념 문서.
- format은 ${FORMATS.join(" / ")} 중 하나.

JSON 배열만 응답:
[{"title":"한국어 소재 제목(호기심형)","why_question":"핵심 왜? 질문","participation":{"score":0,"split":"댓글이 갈릴 곳 한 줄"},"closing_question":"마지막 물음표 한 줄","angle":"이 채널만의 풀이 각도 한 줄","why_evergreen":"오래 찾아볼 이유 한 줄","format":"검증소","host_role":"진행자가 하는 일 한 줄","chapters":["챕터1","챕터2","챕터3","챕터4"],"wiki_title":"English Wikipedia title","yt_query":"english youtube search query"}]`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, output_config: { effort: "low" }, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Claude API 오류");
  const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").replace(/```json\n?|\n?```/g, "");
  const items = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
  // 위키 검증은 하나씩(병렬로 몰아 부르면 429)
  const enriched = [];
  for (const x of items) { enriched.push(await enrichWiki({ ...x, category: category || "", seed: seed || "" })); await sleep(250); }
  // 댓글 참여 잠재력(핵심 기준)과 에버그린을 함께: 참여 60% + 에버그린 40%
  const mix = (x) => 0.6 * (x.participation?.score ?? 0) + 0.4 * (x.evergreen?.score ?? 0);
  return enriched.sort((a, b) => mix(b) - mix(a));
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).json({ items: readAll(), formats: FORMATS });
    if (req.method === "DELETE") { writeAll(readAll().filter((x) => x.id !== req.query.id)); return res.status(200).json({ ok: true }); }
    if (req.method === "PATCH") {
      const { id, ...patch } = req.body || {};
      const list = readAll();
      const it = list.find((x) => x.id === id);
      if (!it) return res.status(404).json({ error: "not found" });
      for (const k of ["status", "memo", "format", "title", "angle", "chapters"]) if (patch[k] !== undefined) it[k] = patch[k];
      it.updatedAt = new Date().toISOString();
      writeAll(list);
      return res.status(200).json({ item: it });
    }
    if (req.method !== "POST") return res.status(405).end();
    const { action } = req.body || {};
    if (action === "discover") {
      const key = req.body.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) return res.status(400).json({ error: "Claude API 키가 필요합니다." });
      const candidates = await discover({ ...req.body, apiKey: key, existing: readAll().map((x) => x.title) });
      return res.status(200).json({ candidates });
    }
    if (action === "save") {
      const item = req.body.item;
      if (!item?.title) return res.status(400).json({ error: "title 필요" });
      const list = readAll();
      const dup = list.find((x) => (item.wiki?.en && x.wiki?.en === item.wiki.en) || x.title === item.title);
      if (dup) return res.status(200).json({ item: dup, duplicate: true });
      const now = new Date().toISOString();
      const saved = { ...item, id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, status: "idea", memo: "", createdAt: now, updatedAt: now };
      list.push(saved);
      writeAll(list);
      return res.status(200).json({ item: saved });
    }
    if (action === "add") {
      // 직접 입력한 소재: 위키 문서명이 있으면 검증까지
      const { title, wiki_title, format, angle, apiKey } = req.body;
      if (!title) return res.status(400).json({ error: "소재 제목을 넣어 주세요." });
      const it = await enrichWiki({ title, wiki_title: wiki_title || "", format: format || "딥다이브", angle: angle || "", chapters: [], yt_query: wiki_title || title, manual: true });
      void apiKey;
      return res.status(200).json({ candidates: [it] });
    }
    if (action === "refresh") {
      const list = readAll();
      const it = list.find((x) => x.id === req.body.id);
      if (!it) return res.status(404).json({ error: "not found" });
      if (req.body.wiki_title) it.wiki_title = req.body.wiki_title;
      Object.assign(it, await enrichWiki(it), { updatedAt: new Date().toISOString() });
      writeAll(list);
      return res.status(200).json({ item: it });
    }
    if (action === "youtube") {
      const list = readAll();
      const it = list.find((x) => x.id === req.body.id);
      if (!it) return res.status(404).json({ error: "not found" });
      const ev = await youtubeEvidence(it.yt_query || it.wiki?.en || it.title);
      if (ev.error) return res.status(200).json({ error: ev.error });
      it.youtube = ev; it.updatedAt = new Date().toISOString();
      writeAll(list);
      return res.status(200).json({ item: it });
    }
    return res.status(400).json({ error: "action 확인" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "서버 오류" });
  }
}
