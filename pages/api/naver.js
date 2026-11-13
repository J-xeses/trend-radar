// pages/api/naver.js
// 네이버 뉴스 검색(Open API) — 무료 Client ID/Secret 필요 (developers.naver.com, 가입 즉시 발급).
// 키가 없으면 YouTube 패턴과 동일하게 "키 없음" 상태만 반환하고 조용히 빈 배열을 내려준다.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const CID = process.env.NAVER_CLIENT_ID;
  const CSECRET = process.env.NAVER_CLIENT_SECRET;
  if (!CID || !CSECRET) {
    return res.status(200).json({ items: [], error: "NAVER_CLIENT_ID/NAVER_CLIENT_SECRET not set" });
  }
  const query = req.query.q || "연예 화제";
  try {
    const url = "https://openapi.naver.com/v1/search/news.json?query=" + encodeURIComponent(query) + "&display=20&sort=date";
    const r = await fetch(url, {
      headers: { "X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSECRET }
    });
    if (!r.ok) throw new Error("Naver API error: " + r.status);
    const data = await r.json();
    const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const items = (data?.items || []).map(it => ({
      title: strip(it.title),
      desc: strip(it.description),
      url: it.originallink || it.link,
      pubDate: it.pubDate,
    }));
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
