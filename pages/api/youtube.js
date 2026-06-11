// pages/api/youtube.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, ids, region, q } = req.query;
  const YT_KEY = process.env.YOUTUBE_API_KEY;
  const regionCode = region || "KR";

  try {
    // trending: mostPopular chart
    if (type === "trending") {
      if (!YT_KEY) return res.status(200).json({ xml: "", error: "YOUTUBE_API_KEY not set" });
      const url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=" + regionCode + "&hl=ko_KR&maxResults=25&key=" + YT_KEY;
      const r = await fetch(url);
      if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message || "YouTube API error: " + r.status); }
      const data = await r.json();
      const items = data.items || [];
      const entries = items.map(item => {
        const id = item.id;
        const title = (item.snippet?.title || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        const channel = (item.snippet?.channelTitle || "").replace(/&/g,"&amp;");
        const published = item.snippet?.publishedAt || new Date().toISOString();
        const views = item.statistics?.viewCount || "0";
        return "<entry><id>yt:video:" + id + "</id><title>" + title + "</title><link href=\"https://www.youtube.com/watch?v=" + id + "\"/><published>" + published + "</published><author><name>" + channel + "</name></author><media:statistics views=\"" + views + "\"/></entry>";
      }).join("\n");
      const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><feed xmlns:yt=\"http://www.youtube.com/xml/schemas/2015\" xmlns:media=\"http://search.yahoo.com/mrss\">" + entries + "</feed>";
      return res.status(200).json({ xml, count: items.length, region: regionCode });
    }

    // search: keyword search for benchmarking
    if (type === "search" && q) {
      if (!YT_KEY) return res.status(200).json({ videos: [], error: "YOUTUBE_API_KEY not set" });
      const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=" + encodeURIComponent(q) + "&regionCode=" + regionCode + "&relevanceLanguage=ko&maxResults=15&order=viewCount&key=" + YT_KEY;
      const r = await fetch(url);
      if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message || "YouTube search error: " + r.status); }
      const data = await r.json();
      const items = data.items || [];

      // Get video stats
      const videoIds = items.map(i => i.id?.videoId).filter(Boolean).join(",");
      let statsMap = {};
      if (videoIds) {
        const statsUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=" + videoIds + "&key=" + YT_KEY;
        const sr = await fetch(statsUrl);
        if (sr.ok) {
          const sd = await sr.json();
          (sd.items || []).forEach(v => { statsMap[v.id] = v; });
        }
      }

      const videos = items.map(item => {
        const vid = item.id?.videoId;
        const stats = statsMap[vid];
        const views = parseInt(stats?.statistics?.viewCount || "0");
        const duration = stats?.contentDetails?.duration || "";
        const isShorts = duration.includes("PT") && !duration.includes("M") && parseInt(duration.replace(/PT|S/g,"")) <= 60;
        return {
          id: vid,
          title: item.snippet?.title || "",
          channel: item.snippet?.channelTitle || "",
          thumbnail: item.snippet?.thumbnails?.medium?.url || "",
          publishedAt: item.snippet?.publishedAt?.substring(0,10) || "",
          url: "https://www.youtube.com/watch?v=" + vid,
          views: views >= 10000 ? (views/10000).toFixed(1) + "만" : views.toLocaleString(),
          viewCount: views,
          isShorts,
        };
      });

      return res.status(200).json({ videos, keyword: q, region: regionCode });
    }

    // channels
    if (type === "channels" && ids) {
      const channelIds = ids.split(",").slice(0, 10);
      const results = await Promise.all(
        channelIds.map(async (cid) => {
          try {
            const url = "https://www.youtube.com/feeds/videos.xml?channel_id=" + cid;
            const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
            if (!r.ok) return { cid, xml: null };
            return { cid, xml: await r.text() };
          } catch { return { cid, xml: null }; }
        })
      );
      return res.status(200).json({ channels: results });
    }

    return res.status(400).json({ error: "type must be trending, search, or channels" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
