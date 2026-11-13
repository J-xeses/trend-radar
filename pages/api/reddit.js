// pages/api/reddit.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const flavor = req.query.flavor || "tech";
    const SUBS = {
      tech: "artificial+MachineLearning+technology+programming",
      // 흥미/화제 위주 — 교양·기술보다 SNS에서 바로 공감되는 소재
      fun: "popculture+entertainment+interestingasfuck+todayilearned+nottheonion+Showerthoughts",
      // 니치 바이럴 클립 큐레이션용 6개 카테고리 서브레딧 묶음(인덱스단에서 subreddit별로 카테고리 재매핑)
      niche: "gadgets+DIY+BeAmazed+UnresolvedMysteries+creepy+oddlysatisfying+educationalgifs+psychology+AskScienceDiscussion+todayilearned+Showerthoughts+interestingasfuck+nottheonion+explainlikeimfive",
    };
    const subs = SUBS[flavor] || SUBS.tech;
    const limit = flavor === "niche" ? 50 : 25; // niche는 14개 서브레딧이 섞여있어 더 넉넉히
    const r = await fetch(
      "https://www.reddit.com/r/" + subs + "/hot.json?limit=" + limit,
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
