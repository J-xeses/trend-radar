// pages/api/producthunt.js
// ProductHunt RSS 피드 파싱 (무료, 키 불필요)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch("https://www.producthunt.com/feed", {
      headers: { "User-Agent": "Mozilla/5.0 TrendRadar/1.0" }
    });
    if (!response.ok) throw new Error("ProductHunt RSS fetch failed: " + response.status);

    const xml = await response.text();

    // 간단한 RSS 파싱
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title   = (block.match(/<title><![CDATA[([\s\S]*?)]]><\/title>/) ||
                       block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
      const url     = (block.match(/<link>(.*?)<\/link>/))?.[1]?.trim() || "";
      const desc    = (block.match(/<description><![CDATA[([\s\S]*?)]]><\/description>/) ||
                       block.match(/<description>(.*?)<\/description>/))?.[1]?.trim() || "";
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() || "";

      if (title) items.push({ title, url, description: desc.substring(0,100), pubDate });
    }

    return res.status(200).json({ items: items.slice(0, 15) });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
