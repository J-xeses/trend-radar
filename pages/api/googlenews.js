// pages/api/googlenews.js
// Google 뉴스 RSS — 키 불필요.
// - entertainment/viral: 한국어 검색어 기반 (연예/화제)
// - world: 섹션 토픽 기반(WORLD) 영어 피드 — 전세계 이슈 발굴용
const TOPIC_QUERIES = {
  entertainment: { q: "연예", hl: "ko", gl: "KR", ceid: "KR:ko" },
  viral:         { q: "화제 OR 이슈 OR 밈 OR 논란", hl: "ko", gl: "KR", ceid: "KR:ko" },
};
const TOPIC_SECTIONS = {
  world: { section: "WORLD", hl: "en-US", gl: "US", ceid: "US:en" },
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
    let url;
    if (TOPIC_SECTIONS[topic]) {
      const t = TOPIC_SECTIONS[topic];
      url = "https://news.google.com/rss/headlines/section/topic/" + t.section +
        "?hl=" + t.hl + "&gl=" + t.gl + "&ceid=" + t.ceid;
    } else if (TOPIC_QUERIES[topic]) {
      const t = TOPIC_QUERIES[topic];
      url = "https://news.google.com/rss/search?q=" + encodeURIComponent(t.q) +
        "&hl=" + t.hl + "&gl=" + t.gl + "&ceid=" + t.ceid;
    } else {
      return res.status(400).json({ error: "topic must be one of: " + Object.keys({ ...TOPIC_QUERIES, ...TOPIC_SECTIONS }).join(", ") });
    }
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendRadar/1.0)" } });
    if (!r.ok) throw new Error("Google News fetch failed: " + r.status);
    const xml = await r.text();
    const items = parseRssItems(xml);
    return res.status(200).json({ items: items.slice(0, 20), topic });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
