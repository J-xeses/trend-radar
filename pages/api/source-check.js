// pages/api/source-check.js
// "📦 소스 재구성 점검" — 원본 영상 전체를 고정틀(뼈대·타이밍)로 두고, 원본 타임라인(deep.timeline)의 구간마다
// "무엇으로 바꿔 끼울지"를 정한다. 교체 가능한 실사 구간은 오픈소스 창고에서 후보를 찾고, Claude가 원본 프레임과
// 후보 썸네일을 직접 비교해 관련성을 판정(관련성 필터). 맞는 후보가 없으면 그 구간은 원본 유지로 떨어진다.
//
// 채널 제작 방식(2026-11-14 갱신): 원본 전체 = 고정틀 → 구간별로 오픈소스 교체 / 진행자 컷 / 그래픽 재제작 /
// 원본 유지 → 그 위에 나레이션 + 진행자(아바타/서여리 등 미정, 슬롯으로만 표시).
// 재구성률 = (교체 확정 + 진행자 + 그래픽) 구간 길이 ÷ 전체 길이. ≥ PASS_RATIO 이면 대본 단계로 진행.
//
// 라이선스 처리: NC(비영리)·ND(변경금지)는 수익화·편집 채널에 못 쓰므로 후보로는 보여주되 판정·확보에서 제외.
import fs from "fs";
import path from "path";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const FAST_MODEL = "claude-haiku-5-5";
const PASS_RATIO = 0.7;
const UA = "trend-radar/1.0 (local research tool)";

// 공급원별 실패 사유 — 조용히 0건으로 보이지 않게 화면에 그대로 띄운다(요청마다 초기화, 로컬 단일 사용자 전제)
let providerErrors = {};

async function getJson(url, opts = {}, ms = 9000, provider = "") {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal, headers: { "User-Agent": UA, ...(opts.headers || {}) } });
    if (!r.ok) {
      if (provider) {
        let msg = `HTTP ${r.status}`;
        try { const e = await r.json(); if (/quota/i.test(e?.error?.message || "")) msg = "일일 할당량 소진"; } catch {}
        providerErrors[provider] = msg;
      }
      return null;
    }
    return await r.json();
  } catch (e) {
    if (provider) providerErrors[provider] = e.name === "AbortError" ? "응답 시간 초과" : "연결 실패";
    return null;
  } finally { clearTimeout(t); }
}

const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// 라이선스 문자열 → {tier, label}
//  free: 표기 불필요(PD/CC0/NASA/Pexels)  attr: 출처표기 필요(CC-BY, BY-SA)  blocked: NC/ND
function classify(lic) {
  const l = String(lic || "").toLowerCase();
  if (!l) return { tier: "unknown", label: "라이선스 확인 필요" };
  if (/\bnc\b|non-?commercial|by-nc/.test(l)) return { tier: "blocked", label: "NC(비영리 전용)" };
  if (/\bnd\b|noderiv|by-nd|-nd/.test(l)) return { tier: "blocked", label: "ND(변경 금지)" };
  if (/cc0|public ?domain|publicdomain|\bpd\b|pdm|nasa|pexels/.test(l)) return { tier: "free", label: lic };
  if (/by-sa|by sa/.test(l)) return { tier: "attr", label: lic + " (동일조건)" };
  if (/by/.test(l)) return { tier: "attr", label: lic };
  return { tier: "unknown", label: lic };
}

function licFromUrl(u) {
  const m = String(u || "").match(/licenses\/([a-z-]+)\/([\d.]+)/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  if (/publicdomain\/zero/i.test(u)) return "CC0";
  if (/publicdomain/i.test(u)) return "Public Domain";
  return u || "";
}

async function searchCommons(q, media) {
  const ft = media === "image" ? "filetype:bitmap" : "filetype:video";
  const d = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(q + " " + ft)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata|mediatype&iiurlwidth=320`, {}, 9000, "Wikimedia");
  const pages = d?.query?.pages ? Object.values(d.query.pages) : [];
  return pages.map(p => {
    const ii = p.imageinfo?.[0] || {};
    const em = ii.extmetadata || {};
    const lic = em.LicenseShortName?.value || "";
    return {
      provider: "Wikimedia", title: p.title.replace(/^File:/, ""), url: ii.descriptionurl || ii.url,
      thumb: ii.thumburl || "", media: ii.mediatype === "VIDEO" ? "video" : "image",
      license: lic, author: stripHtml(em.Artist?.value).slice(0, 80),
    };
  });
}

async function searchNasa(q) {
  const d = await getJson(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=video,image&page_size=5`, {}, 9000, "NASA");
  return (d?.collection?.items || []).slice(0, 5).map(it => {
    const x = it.data?.[0] || {};
    return {
      provider: "NASA", title: x.title || x.nasa_id, url: `https://images.nasa.gov/details/${encodeURIComponent(x.nasa_id)}`,
      thumb: it.links?.[0]?.href || "", media: x.media_type === "video" ? "video" : "image",
      license: "NASA Public Domain", author: x.center ? `NASA ${x.center}` : "NASA",
    };
  });
}

async function searchArchive(q) {
  // 본문 전체검색은 엉뚱한 옛 기록영상이 걸려 확보율을 부풀림(실측: "finger touching airplane window" → "American Frontier") → 제목 한정
  const d = await getJson(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(`title:(${q}) AND mediatype:movies AND licenseurl:[* TO *]`)}&fl[]=identifier&fl[]=title&fl[]=licenseurl&fl[]=creator&rows=5&output=json`, {}, 9000, "Internet Archive");
  return (d?.response?.docs || []).map(x => ({
    provider: "Internet Archive", title: x.title, url: `https://archive.org/details/${x.identifier}`,
    thumb: `https://archive.org/services/img/${x.identifier}`, media: "video",
    license: licFromUrl(x.licenseurl), author: Array.isArray(x.creator) ? x.creator[0] : (x.creator || ""),
  }));
}

async function searchYoutubeCC(q) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const d = await getJson(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoLicense=creativeCommon&q=${encodeURIComponent(q)}&maxResults=5&key=${key}`, {}, 9000, "YouTube CC");
  return (d?.items || []).map(it => ({
    provider: "YouTube CC", title: stripHtml(it.snippet?.title).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
    url: `https://www.youtube.com/watch?v=${it.id?.videoId}`, thumb: it.snippet?.thumbnails?.medium?.url || "",
    media: "video", license: "CC BY 3.0", author: it.snippet?.channelTitle || "",
  }));
}

async function searchPexels(q) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const d = await getJson(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=5`, { headers: { Authorization: key } }, 9000, "Pexels");
  return (d?.videos || []).map(v => ({
    provider: "Pexels", title: (v.url || "").split("/").filter(Boolean).pop()?.replace(/-\d+$/, "").replace(/-/g, " ") || "Pexels video",
    url: v.url, thumb: v.image || "", media: "video", license: "Pexels License", author: v.user?.name || "",
  }));
}

async function searchOpenverse(q) {
  const d = await getJson(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=5&license_type=commercial,modification`, {}, 6000, "Openverse");
  return (d?.results || []).map(x => ({
    provider: "Openverse", title: x.title || "", url: x.foreign_landing_url || x.url, thumb: x.thumbnail || x.url,
    media: "image", license: `CC ${String(x.license || "").toUpperCase()} ${x.license_version || ""}`.trim(), author: x.creator || "",
  }));
}

// ── Claude 호출 공통 ───────────────────────────────────────────────
async function callClaude(key, content, maxTokens = 4000) {
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: FAST_MODEL, max_tokens: maxTokens, output_config: { effort: "low" }, messages: [{ role: "user", content }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Claude API 오류");
  const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").replace(/```json\n?|\n?```/g, "");
  const s = raw.indexOf("["), e = raw.lastIndexOf("]");
  return { json: JSON.parse(raw.slice(s, e + 1)), usage: data.usage || {} };
}

// "0:03-0:06" → {start:3, end:6}
function parseRange(t) {
  const toSec = (x) => { const p = String(x).trim().split(":").map(Number); return p.length === 2 ? p[0] * 60 + p[1] : p[0]; };
  const [a, b] = String(t || "").split(/[-–~]/);
  const start = toSec(a), end = toSec(b);
  return { start: isFinite(start) ? start : 0, end: isFinite(end) ? end : (isFinite(start) ? start : 0) };
}

// 구간 가운데에 가장 가까운 원본 프레임
function nearestFrame(frames, start, end) {
  if (!frames?.length) return null;
  const mid = (start + end) / 2;
  return frames.reduce((best, f) => Math.abs(f.t - mid) < Math.abs(best.t - mid) ? f : best, frames[0]);
}

function readFrameB64(id, name) {
  try {
    if (!id || !/^f_[\d_]+\.jpg$/.test(name || "")) return null;
    return fs.readFileSync(path.join(process.cwd(), "data", "deep", String(id).replace(/[^\w-]/g, ""), name)).toString("base64");
  } catch { return null; }
}

async function fetchImageB64(url) {
  if (!url) return null;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const type = (r.headers.get("content-type") || "").split(";")[0].trim();
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4.5 * 1024 * 1024) return null;
    return { type, data: buf.toString("base64") };
  } catch { return null; } finally { clearTimeout(t); }
}

// ① 원본 타임라인 구간 분류 + 검색어
async function planSegments(segs, oneLine, key) {
  const list = segs.map((s, i) => `${i}. [${s.t}] 화면: ${s.visual} / 소리: ${s.audio || ""} / 역할: ${s.role || ""}`).join("\n");
  const prompt = `원본 쇼츠 영상의 구간별 타임라인이다. 소재: ${oneLine || ""}
제작 방식: 원본 영상 전체를 고정틀(구성·타이밍)로 두고, 구간마다 다른 소스로 바꿔 끼워 재구성한다.
각 구간을 다음 중 하나로 분류하라.
- "replace": 실사 화면이라 오픈소스 영상/이미지(Wikimedia, NASA, Internet Archive, Pexels, YouTube CC)로 교체 가능
- "host": 원본 진행자·나레이터가 화면에 나와 말하는 컷 → 우리 채널 진행자 컷으로 교체 (진행자는 아직 미정)
- "graphic": 자막·도식·화살표·3D/모션그래픽 위주 → 직접 그래픽으로 재제작
- "keep": 원본에만 있는 고유 장면이라 대체가 부자연스러움 → 원본 유지
queries: replace일 때만 영어 검색어 2개(짧고 구체적인 명사구, 스톡 검색에 잘 걸리게). 그 외엔 빈 배열.
media: "video" 또는 "image" (움직임이 중요하면 video).
${list}
JSON 배열만 응답: [{"i":0,"kind":"replace","queries":["...","..."],"media":"video"}]`;
  return callClaude(key, prompt, 4000);
}

// ② 관련성 필터 — 원본 프레임 vs 후보 썸네일을 Claude가 직접 보고 판정
//    score 2 = 이 구간을 바로 대체 가능(같은 피사체·상황), 1 = 분위기만 맞는 보조 B-roll, 0 = 무관
async function judgeRelevance(seg, origB64, cands, key) {
  const imgs = await Promise.all(cands.map(c => fetchImageB64(c.thumb)));
  const ok = cands.map((c, k) => ({ c, k, img: imgs[k] })).filter(x => x.img);
  if (!ok.length) return { scores: {}, usage: {} };
  const content = [{ type: "text", text: `원본 쇼츠의 한 구간을 오픈소스 소스로 교체하려 한다.\n구간 화면 설명: ${seg.visual}\n구간 소리: ${seg.audio || ""}` }];
  if (origB64) content.push({ type: "text", text: "원본 구간 프레임:" }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: origB64 } });
  for (const x of ok) content.push({ type: "text", text: `후보 ${x.k} (${x.c.provider}: ${x.c.title}):` }, { type: "image", source: { type: "base64", media_type: x.img.type, data: x.img.data } });
  content.push({ type: "text", text: `각 후보를 판정하라. score 2 = 이 구간을 그대로 대체 가능(같은 피사체·상황으로 이 구간 내용을 보여줌), 1 = 분위기만 맞아 보조 B-roll 정도, 0 = 무관.
note는 한국어 15자 이내 이유. JSON 배열만 응답: [{"k":0,"score":2,"note":"..."}]` });
  try {
    const { json, usage } = await callClaude(key, content, 2000);
    return { scores: Object.fromEntries((json || []).map(j => [j.k, j])), usage };
  } catch { return { scores: {}, usage: {} }; }
}

const TIER_ORDER = { free: 0, attr: 1, unknown: 2, blocked: 3 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id, deep, sourceUrl, apiKey } = req.body || {};
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(400).json({ error: "Claude API 키가 필요합니다." });
  const timeline = deep?.timeline || [];
  if (!timeline.length) return res.status(400).json({ error: "심층 분석의 원본 타임라인이 없습니다. 심층 분석을 먼저 실행하세요." });

  providerErrors = {};
  const usage = { input_tokens: 0, output_tokens: 0 };
  const addUsage = (u) => { usage.input_tokens += u?.input_tokens || 0; usage.output_tokens += u?.output_tokens || 0; };
  try {
    const segs = timeline.map(s => ({ ...s, ...parseRange(s.t) }));
    const duration = deep?.meta?.duration || Math.max(...segs.map(s => s.end), 1);
    const plan = await planSegments(segs, deep.one_line, key);
    addUsage(plan.usage);
    const byIdx = Object.fromEntries((plan.json || []).map(p => [p.i, p]));

    const results = await Promise.all(segs.map(async (s, i) => {
      const p = byIdx[i] || { kind: "keep", queries: [], media: "video" };
      const frame = nearestFrame(deep.frames, s.start, s.end);
      const len = Math.max(0, s.end - s.start);
      let candidates = [];
      if (p.kind === "replace" && p.queries?.length) {
        const [q1, q2] = p.queries;
        const jobs = [
          searchCommons(q1, p.media), searchNasa(q1), searchArchive(q1), searchPexels(q1),
          searchYoutubeCC(q1), // 100 units/회 — 구간당 1회만
          p.media === "image" ? searchOpenverse(q1) : Promise.resolve([]),
        ];
        if (q2) jobs.push(searchCommons(q2, p.media), searchPexels(q2), searchArchive(q2));
        const all = (await Promise.all(jobs)).flat();
        const seen = new Set();
        candidates = all.filter(c => c.url && !seen.has(c.url) && seen.add(c.url))
          .map(c => { const k = classify(c.license); return { ...c, tier: k.tier, licenseLabel: k.label }; })
          .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
        // 판정은 쓸 수 있는 라이선스(free/attr)만, 최대 8건
        const judgeable = candidates.filter(c => c.tier === "free" || c.tier === "attr").slice(0, 8);
        const { scores, usage: u } = await judgeRelevance(s, frame ? readFrameB64(id, frame.name) : null, judgeable, key);
        addUsage(u);
        judgeable.forEach((c, k) => { const j = scores[k]; c.score = j ? Number(j.score) : null; c.note = j?.note || ""; });
        const judged = new Set(judgeable);
        candidates = [
          ...[...judgeable].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
          ...candidates.filter(c => !judged.has(c)).slice(0, 2), // 판정 대상 밖(라이선스 문제)은 참고로 2건만
        ];
      }
      const matched = candidates.filter(c => c.score === 2).length;
      const partial = candidates.filter(c => c.score === 1).length;
      // 최종 처리: replace인데 맞는 후보가 없으면 원본 유지로 떨어짐
      const outcome = p.kind === "replace" ? (matched ? "replaced" : "keep") : p.kind;
      return {
        t: s.t, start: s.start, end: s.end, len, visual: s.visual, audio: s.audio, role: s.role,
        kind: p.kind, outcome, queries: p.queries || [], media: p.media,
        frame: frame?.name || null, candidates, matched, partial,
      };
    }));

    const rebuilt = results.filter(r => r.outcome !== "keep").reduce((a, r) => a + r.len, 0);
    const total = results.reduce((a, r) => a + r.len, 0) || duration;
    const ratio = total ? rebuilt / total : 0;
    const by = (o) => results.filter(r => r.outcome === o);
    const sourceCheck = {
      mode: "frame", // 원본 고정틀 방식(2026-11-14~). 이전 결과(beats 기반)와 구분용
      segments: results,
      ratio: +ratio.toFixed(2), passRatio: PASS_RATIO, pass: ratio >= PASS_RATIO,
      counts: {
        total: results.length, replaceTried: results.filter(r => r.kind === "replace").length,
        replaced: by("replaced").length, host: by("host").length, graphic: by("graphic").length, keep: by("keep").length,
        keepSec: +by("keep").reduce((a, r) => a + r.len, 0).toFixed(1), totalSec: +total.toFixed(1),
      },
      sourceUrl: sourceUrl || "",
      providers: { pexels: !!process.env.PEXELS_API_KEY, youtubeCC: !!process.env.YOUTUBE_API_KEY },
      providerErrors: { ...providerErrors },
      usage,
      checkedAt: new Date().toISOString(),
    };
    return res.status(200).json({ sourceCheck });
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
