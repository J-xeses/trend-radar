// pages/api/googlenews.js
// Google 뉴스 RSS 검색 — 키 불필요. topic으로 미리 정의된 한국어 검색어를 사용해
// 연예/화제 중심 뉴스를 끌어온다.
const TOPIC_QUERIES = {
  entertainment: "연예",
  viral: "화제 OR 이슈 OR 밈 OR 논란",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const topic = req.query.topic || "entertainment";
  const q = TOPIC_QUERIES[topic];
  if (!q) return res.status(400).json({ error: "topic must be one of: " + Object.keys(TOPIC_QUERIES).join(", ") });

  try {
    const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(q) +
      "&hl=ko&gl=KR&ceid=KR:ko";
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendRadar/1.0)" } });
    if (!r.ok) throw new Error("Google News fetch failed: " + r.status);
    const xml = await r.text();
    const items = [];
    const parts = xml.split("<item>");
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i].split("</item>")[0];
      const get = (tag) => {
        const s = block.indexOf("<" + tag);
        const e = block.indexOf("</" + tag + ">");
        if (s === -1 || e === -1) return "";
        return block.slice(block.indexOf(">", s) + 1, e).replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
      };
      const rawTitle = get("title");
      if (!rawTitle) continue;
      // Google 뉴스 제목은 보통 "기사제목 - 언론사" 형식
      const dashIdx = rawTitle.lastIndexOf(" - ");
      const title = dashIdx > -1 ? rawTitle.slice(0, dashIdx) : rawTitle;
      const source = dashIdx > -1 ? rawTitle.slice(dashIdx + 3) : "";
      items.push({
        title, source,
        url: get("link"),
        pubDate: get("pubDate"),
      });
    }
    return res.status(200).json({ items: items.slice(0, 20), topic });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
