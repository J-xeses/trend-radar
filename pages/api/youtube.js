// pages/api/youtube.js
// 서버사이드에서 유튜브 RSS 수집 — CORS 완전 해결

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();

  const { type } = req.query;

  try {
    if (type === "trending") {
      // 유튜브 급상승 (한국) RSS
      const response = await fetch(
        "https://www.youtube.com/feeds/videos.xml?chart=0&gl=KR&hl=ko",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const text = await response.text();
      return res.status(200).json({ xml: text });

    } else if (type === "channels") {
      // 채널 ID 목록을 쿼리로 받아서 RSS 수집
      const ids = (req.query.ids || "").split(",").filter(Boolean).slice(0, 15);
      const results = await Promise.all(
        ids.map(async (cid) => {
          try {
            const r = await fetch(
              `https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`,
              { headers: { "User-Agent": "Mozilla/5.0" } }
            );
            const xml = await r.text();
            return { cid, xml };
          } catch {
            return { cid, xml: "" };
          }
        })
      );
      return res.status(200).json({ channels: results });

    } else {
      return res.status(400).json({ error: "type=trending 또는 type=channels&ids=... 필요" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
