// pages/api/reddit.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const subs = "artificial+MachineLearning+technology+programming";
    const r = await fetch(
      "https://www.reddit.com/r/" + subs + "/hot.json?limit=25",
      { headers: { "User-Agent": "TrendRadar/1.0" } }
    );
    if (!r.ok) throw new Error("Reddit fetch failed: " + r.status);
    const data = await r.json();
    const posts = (data?.data?.children || [])
      .filter(p => p.data?.title && !p.data?.over_18)
      .map(p => ({
        id: p.data.id,
        title: p.data.title,
        url: "https://reddit.com" + p.data.permalink,
        score: Math.min(100, Math.round((p.data.score || 0) / 150)),
        time: new Date((p.data.created_utc || 0) * 1000).toISOString(),
        upvotes: p.data.score,
        comments: p.data.num_comments,
        subreddit: p.data.subreddit,
      }));
    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({ error: err.message, posts: [] });
  }
}
