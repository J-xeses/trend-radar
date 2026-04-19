// pages/api/analyze.js
// Claude Haiku 4.5 — AI 분석 + 유튜브 벤치마킹 + 교차 분석 + 채널 분석

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
    prompt = `당신은 유튜브 콘텐츠 전략 전문가입니다. 한국 직장인 20-40대 대상 "AI × 자기계발" 채널을 위한 분석을 해주세요.

키워드: "${keyword}"
분석할 영상 목록:
${videos.map((v, i) => `${i+1}. 제목: "${v.title}" | 채널: ${v.channel} | 조회수: ${v.views} | 좋아요: ${v.likes} | 업로드: ${v.uploadDate}`).join("\n")}

위 영상들을 분석하여 다음을 파악해주세요. 반드시 순수 JSON만 응답. 마크다운 없이.

{"title_patterns":["제목 패턴1 한국어","패턴2","패턴3"],"hook_styles":["후킹 방식1","방식2","방식3"],"common_structure":"공통 영상 구성 설명 한국어","why_popular":"조회수 높은 이유 2-3문장 한국어","gap":"아직 다루지 않은 차별화 각도 한국어","my_angle":"내 채널에서 활용할 수 있는 구체적 각도 한국어","recommended_title":"추천 영상 제목 한국어 40자이내","thumbnail_keywords":["썸네일 키워드1","키워드2","키워드3"],"best_upload_time":"최적 업로드 타이밍 한국어","estimated_views":"예상 조회수 범위"}`;

  } else if (type === "cross_analysis") {
    prompt = `당신은 "AI × 자기계발" 유튜브 채널 전략가입니다. 타겟: 20-40대 직장인 한국인.

아래 두 가지 분석 결과를 교차 비교하여 최적의 콘텐츠 전략을 도출해주세요.

═══ 트렌드 레이더 분석 결과 ═══
트렌드 주제: "${trendAnalysis.title}"
기회점수: ${trendAnalysis.opportunity}/10
경쟁강도: ${trendAnalysis.competition}
시급성: ${trendAnalysis.urgency}
AI 추천 앵글: ${trendAnalysis.angle}
AI 추천 영상 아이디어: ${(trendAnalysis.videos||[]).map(v=>v.title).join(", ")}
태그: ${(trendAnalysis.tags||[]).join(", ")}

═══ 유튜브 벤치마킹 분석 결과 ═══
검색 키워드: "${ytAnalysis.keyword}"
제목 패턴: ${(ytAnalysis.title_patterns||[]).join(", ")}
조회수 높은 이유: ${ytAnalysis.why_popular}
차별화 빈틈: ${ytAnalysis.gap}
썸네일 키워드: ${(ytAnalysis.thumbnail_keywords||[]).join(", ")}
AI 추천 제목: ${ytAnalysis.recommended_title}
예상 조회수: ${ytAnalysis.estimated_views}

위 두 분석을 교차 비교하여 아래 형식 JSON만 반환. 마크다운 없이.
{"score":9,"verdict":"지금 만들어야 합니다","common_keywords":["공통키워드1","공통키워드2","공통키워드3"],"blue_ocean":"트렌드는 뜨는데 유튜브에 아직 없는 블루오션 각도 한국어 구체적으로","final_title":"최종 확정 영상 제목 한국어 40자이내","final_format":"숏폼 또는 롱폼 또는 튜토리얼","why_win":"이 영상이 잘 될 이유 2-3문장 한국어","risk":"주의할 점 한국어","upload_timing":"최적 업로드 타이밍 구체적으로 한국어","estimated_views":"예상 조회수 범위","thumbnail_concept":"썸네일 컨셉 한국어 구체적으로","hook_idea":"영상 첫 15초 후킹 아이디어 한국어"}`;

  } else if (type === "channel_analysis") {
    // 채널 분석 모듈 — 경쟁/벤치마킹 채널 전략 분석
    prompt = `당신은 유튜브 채널 전략 분석 전문가입니다. "AI × 자기계발" 채널 (타겟: 한국 직장인 20-40대)을 준비 중인 크리에이터를 위해 경쟁/벤치마킹 채널을 분석해주세요.

채널명: "${channel.name}"
${channel.url ? `채널 URL: ${channel.url}` : ""}
구독자 수: ${channel.subscribers || "미입력"}
주요 주제: ${channel.topics || "미입력"}
최근 영상 목록 (제목 | 조회수 | 업로드):
${(channel.recentVideos || []).map((v,i) => `${i+1}. "${v.title}" | ${v.views} | ${v.date}`).join("\n")}

위 채널을 분석하여 아래 형식 JSON만 반환. 마크다운 없이.
{
  "channel_type": "채널 포지셔닝 한국어 (예: AI툴 리뷰어, 직장인 자기계발 코치 등)",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점/빈틈1", "빈틈2", "빈틈3"],
  "title_formula": "이 채널의 제목 공식 한국어",
  "upload_pattern": "업로드 패턴 분석 한국어",
  "audience": "주요 시청자층 분석 한국어",
  "top_topics": ["인기 주제1", "주제2", "주제3"],
  "missing_topics": ["이 채널이 다루지 않는 주제1", "주제2", "주제3"],
  "my_differentiation": "내 채널이 이 채널과 차별화할 수 있는 핵심 전략 한국어 구체적으로",
  "learn_from": "이 채널에서 배울 점 한국어",
  "avoid": "이 채널의 실수/피해야 할 점 한국어",
  "collab_potential": "협업 가능성 (높음/보통/낮음)",
  "threat_level": "경쟁 위협도 (높음/보통/낮음)",
  "overall": "종합 평가 2-3문장 한국어"
}`;

  } else if (type === "drama_prompt") {
    // 스타일별 프롬프트 분기
    const styleMap = {
      shortform: { label:"숏폼(60초)", tone:"임팩트 있고 빠른 전개, 첫 3초 강렬한 후킹 필수, 자막 크고 선명하게", structure:"문제제기(1~2컷)→공감(3~4컷)→핵심반전(5~7컷)→CTA(8~9컷)", duration:"각 컷 5~8초" },
      longform:  { label:"롱폼(10분)", tone:"깊이 있는 스토리, 천천히 감정을 쌓아가는 구성", structure:"도입→문제상황→심화갈등→해결과정→교훈→CTA", duration:"각 컷 60~90초 분량" },
      vlog:      { label:"브이로그", tone:"자연스럽고 친근한 1인칭 시점, 핸드헬드 카메라 느낌, 편안한 말투", structure:"하루시작→이슈발견→솔직한반응→해결과정→마무리소감", duration:"각 컷 자연스럽게" },
      tutorial:  { label:"튜토리얼", tone:"명확하고 단계별 설명, 화면 캡처+자막 강조, 친절한 설명체", structure:"목표제시→준비물→1단계→2단계→3단계→결과확인→꿀팁→주의사항→CTA", duration:"각 컷 30~60초" },
      interview: { label:"인터뷰", tone:"대화형, 질문-답변 구조, 인사이트 중심, 자연스러운 리액션", structure:"게스트소개→배경→핵심질문1→핵심질문2→심화→공감→조언→미래전망→마무리", duration:"각 컷 30~60초" },
      drama:     { label:"드라마/PSA", tone:"공익광고 스타일, 인식의 전환이 핵심, 밝고 따뜻한 화면, 감성 극대화", structure:"일상오해(1~2컷)→갈등(3~4컷)→관찰반전(5~6컷)→이해공감(7~8컷)→메시지(9컷)", duration:"각 컷 5~10초" },
    };
    const st = styleMap[style||"shortform"] || styleMap.shortform;

    prompt = `당신은 세계적인 광고 전문가이자 영상 스토리텔러입니다. 한국 직장인 20-40대를 타겟으로 하는 "AI × 자기계발" 유튜브 채널을 위한 ${st.label} 영상 제작 프롬프트를 생성합니다.

영상 주제: "${video.title}"
채널 앵글: "${video.angle||""}"
스타일: ${st.label}
연출 톤: ${st.tone}
컷 구성: ${st.structure}
컷 길이 기준: ${st.duration}

반드시 순수 JSON만 응답. 마크다운 없이.

아래 형식 JSON 반환:
{
  "style": "${style||"shortform"}",
  "logline": "한 줄 스토리 요약 한국어",
  "characters": [
    {"name":"이름","age":"나이","personality":"성격 한국어","image_prompt":"Cinematic portrait, [description], neutral calm expression, 8K, photorealistic"}
  ],
  "storyline": "줄거리 요약 한국어 (스타일에 맞게)",
  "bgm_mood": "BGM/분위기 제안 한국어",
  "cuts": [
    {
      "cut": 1,
      "scene": "화면/연출 설명 한국어 (${st.label} 스타일에 맞게)",
      "dialogue": "대사 또는 나레이션 한국어 (없으면 빈 문자열)",
      "is_narration": false,
      "image_prompt": "Cinematic [shot type], [setting matching ${st.label} style]. [Character] (Asset 1) [action]. Bright warm Korean lifestyle, film grain, --ar 16:9",
      "video_prompt": "[Motion matching ${st.label}]. Audio: [audio instruction]. Strictly NO background music. Clean voices and natural ambient SFX only. Lock temporal/spatial continuity. Unbroken single-take only. Enforce strict anatomical correctness. Zero flickering or melting. Strictly preserve all visible Hangul."
    }
  ],
  "core_message": "핵심 메시지 한국어",
  "editing_guide": {
    "vrew": "Vrew 편집 방향 한국어 (${st.label} 스타일)",
    "capcut": "CapCut 효과/스타일 한국어",
    "subtitle_style": "자막 스타일 제안 한국어"
  }
}`;

  } else {
    return res.status(400).json({ error: "type은 analyze, script, youtube_benchmark, cross_analysis, channel_analysis, drama_prompt 여야 합니다." });
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
