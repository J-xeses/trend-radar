// pages/api/youtube.js
// YouTube Data API v3 — 급상승 영상 수집
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, ids } = req.query;
  const YT_KEY = process.env.YOUTUBE_API_KEY;

  try {
    // ── 급상승 영상 (Data API v3) ──────────────────────────
    if (type === "trending") {
      if (!YT_KEY) {
        return res.status(200).json({ xml: "", error: "YOUTUBE_API_KEY not set" });
      }

      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=KR&hl=ko_KR&maxResults=25&key=${YT_KEY}`;
      const r = await fetch(url);
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err?.error?.message || "YouTube API error: " + r.status);
      }

      const data = await r.json();
      const items = data.items || [];

      // RSS XML 형식으로 변환 (기존 파싱 코드 호환)
      const entries = items.map(item => {
        const id = item.id;
        const title = item.snippet?.title || "";
        const channel = item.snippet?.channelTitle || "";
        const published = item.snippet?.publishedAt || new Date().toISOString();
        const views = item.statistics?.viewCount || "0";
        const likes = item.statistics?.likeCount || "0";
        return `<entry>
  <id>yt:video:${id}</id>
  <title>${title.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</title>
  <link href="https://www.youtube.com/watch?v=${id}"/>
  <published>${published}</published>
  <author><name>${channel.replace(/&/g,"&amp;")}</name></author>
  <media:statistics views="${views}"/>
  <yt:likes>${likes}</yt:likes>
</entry>`;
      }).join("
");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/">
${entries}
</feed>`;

      return res.status(200).json({ xml, count: items.length });
    }

    // ── 채널 영상 (RSS — 채널은 API 키 불필요) ────────────
    if (type === "channels" && ids) {
      const channelIds = ids.split(",").slice(0, 10);
      const results = await Promise.all(
        channelIds.map(async (cid) => {
          try {
            const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`;
            const r = await fetch(url, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" }
            });
            if (!r.ok) return { cid, xml: null };
            return { cid, xml: await r.text() };
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
