// pages/api/signal.js
// 시그널(signal.bz) — 네이트/네이버 등 국내 커뮤니티·포털 실시간 화제 키워드 + 톱기사 집계.
// 키 불필요. 2020년 네이버 급상승검색어 폐지 이후 가장 흔히 쓰이는 대체 소스.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const r = await fetch("https://api.signal.bz/news/realtime", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendRadar/1.0)" }
    });
    if (!r.ok) throw new Error("signal.bz fetch failed: " + r.status);
    const data = await r.json();

    // 실시간 화제 키워드 (제목만 있어 맥락이 필요 — 프론트에서 AI 요약 대상)
    const keywords = (data?.top10 || []).map(k => ({
      rank: k.rank,
      keyword: k.keyword,
      state: k.state, // '+' 상승 / '-' 하강 / 'n' 신규
    }));

    // 실시간 톱기사 (desc에 이미 내용 요약이 있어 추가 AI 호출 불필요)
    const articles = (data?.articles || []).slice(0, 15).map((a, i) => ({
      id: `sigart_${i}_${data.now || Date.now()}`,
      title: a.title || a.name || "",
      url: a.link || "",
      desc: (a.desc || "").trim(),
    }));

    return res.status(200).json({ keywords, articles, fetchedAt: data?.now || Date.now() });
  } catch (err) {
    return res.status(500).json({ error: err.message, keywords: [], articles: [] });
  }
}
