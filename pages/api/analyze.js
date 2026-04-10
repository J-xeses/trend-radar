// pages/api/analyze.js
// OpenRouter 무료 API — 신용카드 불필요
// 폴백 모델 포함 (안정성 강화)

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// 무료 모델 우선순위 (앞에서부터 시도)
const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-4b-it:free",
];

async function callWithFallback(apiKey, messages) {
  for (const model of FREE_MODELS) {
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
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        const msg = err?.error?.message || "";
        // Provider 오류면 다음 모델로
        if (response.status === 502 || response.status === 503 || msg.includes("Provider")) {
          continue;
        }
        throw new Error(msg || `오류 ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (!content) continue;
      return { content, model };
    } catch (e) {
      // 마지막 모델이면 에러 던지기
      if (model === FREE_MODELS[FREE_MODELS.length - 1]) throw e;
      continue;
    }
  }
  throw new Error("모든 모델에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
}

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
  } else {
    return res.status(400).json({ error: "type은 analyze 또는 script 여야 합니다." });
  }

  try {
    const { content, model } = await callWithFallback(apiKey, [
      { role: "user", content: prompt }
    ]);

    // JSON 파싱
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(200).json({ raw: cleaned, usedModel: model });
    }

    const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(jsonStr);
      return res.status(200).json({ result: parsed, usedModel: model });
    } catch {
      return res.status(200).json({ raw: cleaned, usedModel: model });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
