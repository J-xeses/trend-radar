// pages/api/youtube.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, ids } = req.query;

  try {
    if (type === "trending") {
      const url = "https://www.youtube.com/feeds/videos.xml?chart=mostPopular&regionCode=KR&hl=ko_KR&maxResults=15";
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!response.ok) throw new Error("YouTube RSS fetch failed: " + response.status);
      const xml = await response.text();
      return res.status(200).json({ xml });
    }

    if (type === "channels" && ids) {
      const channelIds = ids.split(",").slice(0, 10);
      const results = await Promise.all(
        channelIds.map(async (cid) => {
          try {
            const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`;
            const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (!response.ok) return { cid, xml: null };
            const xml = await response.text();
            return { cid, xml };
          } catch {
            return { cid, xml: null };
          }
        })
      );
      return res.status(200).json({ channels: results });
    }

    return res.status(400).json({ error: "type must be trending or channels" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
