// pages/api/producthunt.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const r = await fetch("https://www.producthunt.com/feed", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });
    if (!r.ok) throw new Error("fetch failed: " + r.status);
    const xml = await r.text();
    const items = [];
    const parts = xml.split("<item>");
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i].split("</item>")[0];
      function getTag(str, tag) {
        const s = str.indexOf("<" + tag);
        const e = str.indexOf("</" + tag + ">");
        if (s === -1 || e === -1) return "";
        const inner = str.slice(str.indexOf(">", s) + 1, e).trim();
        return inner.replace(/<![CDATA[/g, "").replace(/]]>/g, "").trim();
      }
      const title = getTag(block, "title");
      const link = getTag(block, "link") || getTag(block, "guid");
      const desc = getTag(block, "description").substring(0, 120);
      const date = getTag(block, "pubDate");
      if (title) items.push({ title, url: link, description: desc, pubDate: date });
    }
    return res.status(200).json({ items: items.slice(0, 20) });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
