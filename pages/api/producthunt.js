// pages/api/producthunt.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const r = await fetch("https://www.producthunt.com/feed", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!r.ok) throw new Error("fetch failed: " + r.status);
    const xml = await r.text();

    // 태그 추출 헬퍼
    function getTag(str, tag) {
      const open = "<" + tag + ">";
      const close = "</" + tag + ">";
      const s = str.indexOf(open);
      const e = str.indexOf(close);
      if (s === -1 || e === -1) return "";
      let val = str.slice(s + open.length, e).trim();
      // CDATA 제거
      val = val.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
      return val;
    }

    const items = [];
    const parts = xml.split("<item>");
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i].split("</item>")[0];
      const title = getTag(block, "title");
      const link  = getTag(block, "link");
      const desc  = getTag(block, "description").substring(0, 100);
      const date  = getTag(block, "pubDate");
      if (title) items.push({ title, url: link, description: desc, pubDate: date });
    }

    return res.status(200).json({ items: items.slice(0, 15) });
  } catch (err) {
    return res.status(500).json({ error: err.message, items: [] });
  }
}
