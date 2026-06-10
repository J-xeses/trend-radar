// pages/api/youtube.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, ids } = req.query;

  try {
    if (type === "trending") {
      // 여러 User-Agent와 URL 조합 시도
      const attempts = [
        {
          url: "https://www.youtube.com/feeds/videos.xml?chart=mostPopular&regionCode=KR&hl=ko_KR&maxResults=20",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "application/xml,text/xml,*/*",
            "Accept-Language": "ko-KR,ko;q=0.9",
          }
        },
        {
          url: "https://www.youtube.com/feeds/videos.xml?chart=mostPopular&regionCode=KR&maxResults=20",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/xml,application/xml",
          }
        },
        {
          url: "https://www.youtube.com/feeds/videos.xml?chart=mostPopular&regionCode=KR",
          headers: { "User-Agent": "feedparser/6.0" }
        },
      ];

      let xml = null;
      let lastErr = "";

      for (const attempt of attempts) {
        try {
          const r = await fetch(attempt.url, { headers: attempt.headers });
          if (r.ok) {
            const text = await r.text();
            if (text.includes("<entry>")) {
              xml = text;
              break;
            }
          }
          lastErr = `status ${r.status}`;
        } catch(e) {
          lastErr = e.message;
        }
      }

      if (xml) {
        return res.status(200).json({ xml });
      } else {
        // fallback: 빈 XML 반환 (에러 대신)
        return res.status(200).json({ xml: "", error: "YouTube blocked: " + lastErr });
      }
    }

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
