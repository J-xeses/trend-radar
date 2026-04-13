// pages/api/analyze.js
// Claude Haiku 4.5 — AI 분석 + 유튜브 벤치마킹

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, trend, video, videos, keyword, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API Key가 필요합니다." });
  }

  let prompt = "";

  if (type === "analyze") {
    prompt = `당신은 "AI × 자기계발" 유튜브 채널 전략가입니다. 타겟: 20-40대 직장인 한국인.
아래 트렌드를 분석하여 유튜브 콘텐츠 기회를 평가하세요.
반드시 순수 JSON만 응답하세요. 마크다운 없이, JSON 객체만.

트렌드: "${trend.title}"
소스: ${trend.source}
트렌드점수: ${trend.trendScore}
열기: ${trend.heat}
${trend.tagline ? `설명: ${trend.tagline}` : ""}

아래 형식 JSON만 반환:
{"opportunity":8,"competition":"보통","urgency":"즉시","summary_ko":"한국어 분석 2-3문장","angle":"채널 고유 앵글 한국어","videos":[{"title":"한국어 제목 40자이내","format":"숏폼","views":"10만~50만"},{"title":"제목2","format":"롱폼","views":"5만~20만"},{"title":"제목3","format":"튜토리얼","views":"3만~10만"}],"tags":["#태그1","#태그2","#태그3","#태그4","#태그5"],"best_time":"업로드 최적 타이밍 한국어"}`;

  } else if (type === "script") {
    prompt = `한국어 유튜브 대본 작성가입니다.
영상 제목: "${video.title}" (형식: ${video.format})
반드시 순수 JSON만 응답. 마크다운 없이.

아래 형식 JSON만 반환:
{"hook":"15초 오프닝 한국어","sections":[{"ts":"0:00","name":"후킹","desc":"내용"},{"ts":"0:15","name":"문제제기","desc":"내용"},{"ts":"2:00","name":"핵심내용","desc":"내용"},{"ts":"6:00","name":"실전적용","desc":"내용"},{"ts":"8:00","name":"CTA","desc":"내용"}],"seo":["키워드1","키워드2","키워드3","키워드4","키워드5"],"desc":"2문장 영상설명 한국어"}`;

  } else if (type === "youtube_benchmark") {
    // 유튜브 벤치마킹 분석
    prompt = `당신은 유튜브 콘텐츠 전략 전문가입니다. 한국 직장인 20-40대 대상 "AI × 자기계발" 채널을 위한 분석을 해주세요.

키워드: "${keyword}"
분석할 영상 목록:
${videos.map((v, i) => `${i+1}. 제목: "${v.title}" | 채널: ${v.channel} | 조회수: ${v.views} | 좋아요: ${v.likes} | 업로드: ${v.uploadDate}`).join("\n")}

위 영상들을 분석하여 다음을 파악해주세요. 반드시 순수 JSON만 응답. 마크다운 없이.

{"title_patterns":["제목 패턴1 한국어","패턴2","패턴3"],"hook_styles":["후킹 방식1","방식2","방식3"],"common_structure":"공통 영상 구성 설명 한국어","why_popular":"조회수 높은 이유 2-3문장 한국어","gap":"아직 다루지 않은 차별화 각도 한국어","my_angle":"내 채널에서 활용할 수 있는 구체적 각도 한국어","recommended_title":"추천 영상 제목 한국어 40자이내","thumbnail_keywords":["썸네일 키워드1","키워드2","키워드3"],"best_upload_time":"최적 업로드 타이밍 한국어","estimated_views":"예상 조회수 범위"}`;

  } else {
    return res.status(400).json({ error: "type은 analyze, script, youtube_benchmark 여야 합니다." });
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({
        error: errData?.error?.message || `Claude API 오류 (${response.status})`,
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(200).json({ raw: cleaned });
    }

    try {
      const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      return res.status(200).json({ result: parsed });
    } catch {
      return res.status(200).json({ raw: cleaned });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
