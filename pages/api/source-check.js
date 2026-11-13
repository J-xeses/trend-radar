// pages/api/source-check.js
// "📦 소스 확보 점검" — 심층 분석의 재구성 플랜(remix_plan.beats)을 구간별로 오픈소스 창고에서 찾아보고
// 확보율을 계산한다. 확보율 ≥ PASS_RATIO 이면 "제작 가능" → 대본 단계로 넘어갈 수 있다.
//
// 채널 제작 방식(2026-11-13 확정): 오픈소스(퍼블릭도메인·CC0·CC-BY/BY-SA 출처표기 조건부·무료스톡) +
// 원본 영상 일부 차용 → 편집·커스터마이징 → 나레이션 + 진행자(아바타/서여리 등 미정, 슬롯으로만 표시).
//
// 라이선스 처리: NC(비영리)·ND(변경금지)는 수익화·편집 채널에 못 쓰므로 후보로는 보여주되 확보율 계산에서 제외.
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

async function planQueries(beats, oneLine, key) {
  const list = beats.map((b, i) => `${i}. [${b.sec}s] 나레이션: ${b.narration} / 화면: ${b.visual} / 플랜상 소스: ${b.source || ""}`).join("\n");
  const prompt = `쇼츠 재구성 플랜의 구간 목록이다. 소재: ${oneLine || ""}
각 구간에 필요한 화면을 오픈소스 영상/이미지 창고(Wikimedia Commons, NASA, Internet Archive, Pexels, YouTube CC)에서 찾기 위한 영어 검색어를 만들어라.
- kind: "footage"(실제 영상/사진 소스가 필요), "host"(진행자가 화면에 나와 말하는 컷 — 진행자는 아직 미정), "graphic"(자막·도식·모션그래픽으로 직접 만들면 되는 컷), "original"(원본 영상 일부 차용이 가장 자연스러운 컷) 중 하나.
- queries: footage/original일 때만 영어 검색어 2개(짧고 구체적인 명사구, 스톡 검색에 잘 걸리게). 그 외엔 빈 배열.
- media: "video" 또는 "image" (움직임이 중요하면 video).
${list}
JSON 배열만 응답: [{"i":0,"kind":"footage","queries":["...","..."],"media":"video"}]`;
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: FAST_MODEL, max_tokens: 6000, output_config: { effort: "low" }, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Claude API 오류");
  const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").replace(/```json\n?|\n?```/g, "");
  const s = raw.indexOf("["), e = raw.lastIndexOf("]");
  return JSON.parse(raw.slice(s, e + 1));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { deep, sourceUrl, apiKey } = req.body || {};
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(400).json({ error: "Claude API 키가 필요합니다." });
  const beats = deep?.remix_plan?.beats || [];
  if (!beats.length) return res.status(400).json({ error: "심층 분석의 재구성 플랜(구간)이 없습니다. 심층 분석을 먼저 실행하세요." });

  providerErrors = {};
  try {
    const plan = await planQueries(beats, deep.one_line, key);
    const byIdx = Object.fromEntries((plan || []).map(p => [p.i, p]));

    const results = await Promise.all(beats.map(async (b, i) => {
      const p = byIdx[i] || { kind: "footage", queries: [], media: "video" };
      let candidates = [];
      if ((p.kind === "footage" || p.kind === "original") && p.queries?.length) {
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
          .map(c => ({ ...c, ...(() => { const k = classify(c.license); return { tier: k.tier, licenseLabel: k.label }; })() }))
          .sort((a, b) => ({ free: 0, attr: 1, unknown: 2, blocked: 3 }[a.tier] - { free: 0, attr: 1, unknown: 2, blocked: 3 }[b.tier]))
          .slice(0, 8);
      }
      const usable = candidates.filter(c => c.tier === "free" || c.tier === "attr").length;
      // 원본 차용 구간은 원본 영상 자체가 후보 — 오픈소스가 없어도 "차용"으로 확보 처리
      const covered = p.kind === "footage" ? usable > 0 : true; // host/graphic은 직접 제작이라 확보율 계산 대상 아님
      return { ...b, kind: p.kind, queries: p.queries || [], media: p.media, candidates, usable, covered,
        borrowed: p.kind === "original" && usable === 0 };
    }));

    const sourceBeats = results.filter(r => r.kind === "footage" || r.kind === "original");
    const coveredSource = sourceBeats.filter(r => r.covered).length;
    const ratio = sourceBeats.length ? coveredSource / sourceBeats.length : 1;
    const sourceCheck = {
      beats: results,
      ratio: +ratio.toFixed(2), passRatio: PASS_RATIO, pass: ratio >= PASS_RATIO,
      counts: {
        total: results.length, source: sourceBeats.length, covered: coveredSource,
        host: results.filter(r => r.kind === "host").length, graphic: results.filter(r => r.kind === "graphic").length,
        borrowed: results.filter(r => r.borrowed).length,
      },
      sourceUrl: sourceUrl || "",
      providers: { pexels: !!process.env.PEXELS_API_KEY, youtubeCC: !!process.env.YOUTUBE_API_KEY },
      providerErrors: { ...providerErrors },
      checkedAt: new Date().toISOString(),
    };
    return res.status(200).json({ sourceCheck });
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
