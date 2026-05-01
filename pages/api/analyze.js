// pages/api/analyze.js
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { type, trend, video, videos, keyword, trendAnalysis, ytAnalysis, channel, style, apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: "API Key가 필요합니다." });
  }
  let prompt = "";
  if (type === "analyze") {
    prompt = `아래 트렌드를 분석해서 한국 직장인(20-40대) 유튜버 콘텐츠 기회를 분석해줘.
트렌드: "${trend.title}"
소스: ${trend.source}
아래 형식 JSON만 응답:
{"opportunity":8,"competition":"높음","urgency":"긴급","summary_ko":"요약 2-3문장","angle":"채널 각도","videos":[{"title":"추천 영상 제목","format":"쇼츠","views":"10만~50만"},{"title":"추천2","format":"롱폼","views":"5만~20만"},{"title":"추천3","format":"브이로그","views":"3만~10만"}],"tags":["#태그1","#태그2","#태그3","#태그4","#태그5"],"best_time":"업로드 최적 요일 시간대"}`;
  } else if (type === "script") {
    prompt = `영상 "${video.title}" (형식: ${video.format}) 스크립트 JSON으로만:
{"hook":"15초 후킹","sections":[{"ts":"0:00","name":"인트로","desc":"설명"}],"seo":["키워드1","키워드2"],"desc":"설명"}`;
  } else if (type === "youtube_benchmark") {
    prompt = `유튜브 영상들 분석 키워드 "${keyword}":
${videos.map((v,i)=>`${i+1}. "${v.title}" | ${v.channel} | ${v.views}`).join("\n")}
JSON만: {"title_patterns":["패턴1","패턴2"],"hook_styles":["스타일1"],"common_structure":"구조","why_popular":"이유","gap":"빈틈","my_angle":"각도","recommended_title":"추천 제목","thumbnail_keywords":["키워드1"],"best_upload_time":"최적 시간","estimated_views":"예상 조회수"}`;
  } else if (type === "cross_analysis") {
    prompt = `트렌드 분석(${trendAnalysis.title})과 유튜브 경쟁 분석(${ytAnalysis.keyword}) 교차 분석.
JSON만: {"score":9,"verdict":"판정","common_keywords":["키워드1"],"blue_ocean":"블루오션","final_title":"최종 제목","final_format":"형식","why_win":"이유","risk":"리스크","upload_timing":"시간","estimated_views":"조회수","thumbnail_concept":"썸네일","hook_idea":"후킹"}`;
  } else if (type === "channel_analysis") {
    prompt = `채널 "${channel.name}" 분석 (구독자: ${channel.subscribers||"미입력"}).
JSON만: {"channel_type":"유형","strengths":["강점1","강점2"],"weaknesses":["약점1"],"title_formula":"공식","upload_pattern":"패턴","audience":"오디언스","top_topics":["주제1"],"missing_topics":["빈틈1"],"my_differentiation":"차별화","learn_from":"배울점","avoid":"피할점","collab_potential":"협업","threat_level":"위협","overall":"종합 2-3문장"}`;
  } else if (type === "drama_prompt") {
    prompt = `영상 "${video.title}" AI 버추얼 인플루언서 씬별 대본+프롬프트.
JSON만: {"style":"shortform","logline":"한줄","characters":[{"name":"서여리","age":"20대","personality":"성격","image_prompt":"Cinematic portrait, Korean woman 20s, neutral expression, 8K, photorealistic"}],"storyline":"스토리","bgm_mood":"BGM","cuts":[{"cut":1,"scene":"씬","dialogue":"대사","is_narration":false,"image_prompt":"Cinematic [shot], [setting]. Bright warm Korean lifestyle, film grain, --ar 16:9","video_prompt":"[Motion]. Strictly NO background music. Clean voices only."}],"core_message":"메시지","editing_guide":{"vrew":"Vrew 가이드","capcut":"CapCut 가이드","subtitle_style":"자막"}}`;
  } else {
    return res.status(400).json({ error: "type은 analyze, script, youtube_benchmark, cross_analysis, channel_analysis, drama_prompt 중 하나." });
  }
  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) {
      const e = await response.json();
      return res.status(response.status).json({ error: e?.error?.message || "Claude API 오류" });
    }
    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const s = cleaned.indexOf("{"), e2 = cleaned.lastIndexOf("}");
    if (s === -1 || e2 === -1) return res.status(200).json({ raw: cleaned });
    try { return res.status(200).json({ result: JSON.parse(cleaned.slice(s, e2+1)) }); }
    catch { return res.status(200).json({ raw: cleaned }); }
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
