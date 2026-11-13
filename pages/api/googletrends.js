// pages/api/googletrends.js
// Google Trends 실시간 급상승 검색어 RSS — 키 불필요.
// geo: KR, US, 혹은 콤마로 여러 지역(예: GB,JP)을 합쳐서 "글로벌" 느낌으로 반환.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const geos = String(req.query.geo || "KR").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);

  function parseItems(xml) {
    const out = [];
    const parts = xml.split("<item>");
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i].split("</item>")[0];
      const get = (tag) => {
        const s = block.indexOf("<" + tag);
        const e = block.indexOf("</" + tag + ">");
        if (s === -1 || e === -1) return "";
        return block.slice(block.indexOf(">", s) + 1, e).replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
      };
      const title = get("title");
      if (!title) continue;
      out.push({
        title,
        traffic: get("ht:approx_traffic"),
        newsTitle: get("ht:news_item_title"),
        newsUrl: get("ht:news_item_url"),
        pubDate: get("pubDate"),
      });
    }
    return out;
  }

  try {
    const results = await Promise.all(
      geos.map(geo =>
        fetch("https://trends.google.com/trending/rss?geo=" + encodeURIComponent(geo), {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendRadar/1.0)" }
        }).then(r => r.ok ? r.text() : "").then(parseItems).catch(() => [])
      )
    );
    const seen = new Set();
    const merged = [];
    for (const list of results) {
      for (const it of list) {
        const key = it.title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(it);
      }
    }
    return res.status(200).json({ items: merged.slice(0, 20) });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
