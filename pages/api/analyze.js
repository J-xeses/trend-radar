// pages/api/analyze.js
// OpenRouter 무료 API 사용 — 신용카드 불필요, 하루 200회 무료
// 모델: meta-llama/llama-3.3-70b-instruct:free (GPT-4 수준 성능)

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FREE_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, trend, video, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "OpenRouter API Key가 필요합니다." });
  }

  let prompt = "";

  if (type === "analyze") {
    prompt = `당신은 "AI × 자기계발" 유튜브 채널 전략가입니다. 타겟: 20-40대 직장인 한국인.
아래 트렌드를 분석하여 유튜브 콘텐츠 기회를 평가하세요.
반드시 순수 JSON만 응답하세요. 마크다운 코드블록 없이, JSON 객체만.

트렌드: "${trend.title}"
소스: ${trend.source}
트렌드점수: ${trend.trendScore}
열기: ${trend.heat}
${trend.tagline ? `설명: ${trend.tagline}` : ""}

반드시 아래 형식의 JSON만 반환:
{"opportunity":8,"competition":"보통","urgency":"즉시","summary_ko":"한국어 분석 2-3문장","angle":"채널 고유 앵글 한국어","videos":[{"title":"한국어 제목 40자이내","format":"숏폼","views":"10만~50만"},{"title":"제목2","format":"롱폼","views":"5만~20만"},{"title":"제목3","format":"튜토리얼","views":"3만~10만"}],"tags":["#태그1","#태그2","#태그3","#태그4","#태그5"],"best_time":"업로드 최적 타이밍 한국어"}`;
  } else if (type === "script") {
    prompt = `한국어 유튜브 대본 작성가입니다.
영상 제목: "${video.title}" (형식: ${video.format})
반드시 순수 JSON만 응답. 마크다운 코드블록 없이.

반드시 아래 형식의 JSON만 반환:
{"hook":"15초 오프닝 한국어 문장","sections":[{"ts":"0:00","name":"후킹","desc":"내용 설명"},{"ts":"0:15","name":"문제제기","desc":"내용 설명"},{"ts":"2:00","name":"핵심내용","desc":"내용 설명"},{"ts":"6:00","name":"실전적용","desc":"내용 설명"},{"ts":"8:00","name":"CTA","desc":"내용 설명"}],"seo":["키워드1","키워드2","키워드3","키워드4","키워드5"],"desc":"2문장 영상설명 한국어"}`;
  } else {
    return res.status(400).json({ error: "type은 analyze 또는 script 여야 합니다." });
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://trend-radar-gamma.vercel.app",
        "X-Title": "Trend Radar",
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      const errMsg = errData?.error?.message || `OpenRouter 오류 (${response.status})`;
      return res.status(response.status).json({ error: errMsg });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // JSON 파싱 — 마크다운 코드블록 제거 후 파싱
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    // JSON 시작/끝 위치 찾기 (안전한 파싱)
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(200).json({ raw: cleaned });
    }

    const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(jsonStr);
      return res.status(200).json({ result: parsed });
    } catch {
      return res.status(200).json({ raw: cleaned });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류가 발생했습니다." });
  }
}
