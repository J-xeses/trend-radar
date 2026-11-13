// pages/api/googlenews.js
// Google 뉴스 RSS — 키 불필요. 한국어 검색어 기반 (연예/화제).
// ⚠️ 2026-11-13: "월드 이슈"(WORLD 토픽) 소스는 제거함 — 일반 시사 기사라 쇼츠 스토리로
// 재구성하기 어렵다는 피드백에 따라, 니치 바이럴 클립 큐레이션(pages/index.js의
// niche_* 소스)으로 대체했다.
const TOPIC_QUERIES = {
  entertainment: { q: "연예", hl: "ko", gl: "KR", ceid: "KR:ko" },
  viral:         { q: "화제 OR 이슈 OR 밈 OR 논란", hl: "ko", gl: "KR", ceid: "KR:ko" },
};

function parseRssItems(xml) {
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
    items.push({ title, source, url: get("link"), pubDate: get("pubDate") });
  }
  return items;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const topic = req.query.topic || "entertainment";

  try {
    const t = TOPIC_QUERIES[topic];
    if (!t) return res.status(400).json({ error: "topic must be one of: " + Object.keys(TOPIC_QUERIES).join(", ") });
    const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(t.q) +
      "&hl=" + t.hl + "&gl=" + t.gl + "&ceid=" + t.ceid;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendRadar/1.0)" } });
    if (!r.ok) throw new Error("Google News fetch failed: " + r.status);
    const xml = await r.text();
    const items = parseRssItems(xml);
    return res.status(200).json({ items: items.slice(0, 20), topic });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
