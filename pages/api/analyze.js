// pages/api/analyze.js
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-fable-5-2";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { type, trend, video, videos, keyword, trendAnalysis, ytAnalysis, channel, style, apiKey, items, issue } = req.body;
  // 서버 환경변수(ANTHROPIC_API_KEY)가 설정돼 있으면 브라우저에 키를 저장해두지 않아도
  // 한글 요약 등 AI 기능이 바로 동작한다 — 브라우저 로컬 키가 지워져도 기능이 "조용히" 꺼지지 않도록.
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(400).json({ error: "API Key가 필요합니다." });
  }
  let prompt = "";
  if (type === "analyze") {
    prompt = `아래 트렌드를 분석해서 한국 직장인(20-40대) 유튜버 콘텐츠 기회를 분석해줘.
트렌드: "${trend.title}" / 소스: ${trend.source} / 점수: ${trend.trendScore}
JSON만 응답: {"opportunity":8,"competition":"높음","urgency":"긴급","summary_ko":"요약 2-3문장","angle":"채널 각도","videos":[{"title":"추천영상1","format":"쇼츠","views":"10만~50만"},{"title":"추천2","format":"롱폼","views":"5만~20만"},{"title":"추천3","format":"브이로그","views":"3만~10만"}],"tags":["#태그1","#태그2","#태그3","#태그4","#태그5"],"best_time":"최적 업로드 요일 시간대"}`;
  } else if (type === "script") {
    prompt = `영상 "${video.title}" (형식: ${video.format}) 스크립트를 JSON으로만:
{"hook":"15초 후킹","sections":[{"ts":"0:00","name":"인트로","desc":"설명"},{"ts":"2:00","name":"결론","desc":"설명"},{"ts":"6:00","name":"CTA","desc":"설명"}],"seo":["키워드1","키워드2","키워드3"],"desc":"2줄 설명"}`;
  } else if (type === "youtube_benchmark") {
    prompt = `유튜브 영상들 분석, 키워드 "${keyword}":
${videos.map((v,i)=>`${i+1}. "${v.title}" | ${v.channel} | ${v.views}`).join("\n")}
JSON만: {"title_patterns":["패턴1","패턴2","패턴3"],"hook_styles":["스타일1","스타일2"],"common_structure":"구조","why_popular":"이유","gap":"빈틈","my_angle":"각도","recommended_title":"추천 제목 40자내","thumbnail_keywords":["키워드1","키워드2","키워드3"],"best_upload_time":"최적 시간","estimated_views":"예상 조회수"}`;
  } else if (type === "cross_analysis") {
    prompt = `트렌드 분석("${trendAnalysis.title}", 기회:${trendAnalysis.opportunity}/10)과 유튜브 경쟁 분석("${ytAnalysis.keyword}") 교차 분석.
JSON만: {"score":9,"verdict":"판정","common_keywords":["키워드1","키워드2","키워드3"],"blue_ocean":"블루오션 각도","final_title":"최종 제목 40자내","final_format":"쇼츠 또는 롱폼","why_win":"이길 이유","risk":"리스크","upload_timing":"최적 시간","estimated_views":"예상 조회수","thumbnail_concept":"썸네일 컨셉","hook_idea":"후킹 아이디어"}`;
  } else if (type === "channel_analysis") {
    prompt = `채널 "${channel.name}" (구독자: ${channel.subscribers||"미입력"}) 분석.
JSON만: {"channel_type":"유형","strengths":["강점1","강점2","강점3"],"weaknesses":["약점1","약점2","약점3"],"title_formula":"제목 공식","upload_pattern":"업로드 패턴","audience":"오디언스","top_topics":["주제1","주제2","주제3"],"missing_topics":["빈틈1","빈틈2","빈틈3"],"my_differentiation":"차별화","learn_from":"배울점","avoid":"피할점","collab_potential":"협업 가능성","threat_level":"위협 수준","overall":"종합 2-3문장"}`;
  } else if (type === "drama_prompt") {
    const styleMap = {shortform:"쇼츠(60초):짧고 임팩트있는 대사",longform:"롱폼(10분):깊이있는 이야기",vlog:"브이로그:자연스러운 말투",tutorial:"튜토리얼:단계별 설명",interview:"인터뷰:편안한 대화",drama:"드라마/PSA:감정적 연기"};
    prompt = `영상 "${video.title}" AI 버추얼 인플루언서 씬별 대본+프롬프트. 스타일: ${styleMap[style||"shortform"]||styleMap.shortform}
JSON만: {"style":"shortform","logline":"한줄","characters":[{"name":"서여리","age":"20대","personality":"성격","image_prompt":"Cinematic portrait, Korean woman 20s, neutral expression, 8K, photorealistic"}],"storyline":"스토리","bgm_mood":"BGM","cuts":[{"cut":1,"scene":"씬","dialogue":"대사","is_narration":false,"image_prompt":"Cinematic [shot], [setting]. Bright warm Korean lifestyle, film grain, --ar 16:9","video_prompt":"[Motion]. Strictly NO background music. Clean voices only."},{"cut":2,"scene":"씬2","dialogue":"대사2","is_narration":true,"image_prompt":"Cinematic close-up, [setting]. --ar 16:9","video_prompt":"[Motion]. Strictly NO background music."}],"core_message":"메시지","editing_guide":{"vrew":"Vrew 가이드","capcut":"CapCut 가이드","subtitle_style":"자막"}}`;
  } else if (type === "translate_titles") {
    // items: [{id, title, context?}]
    // - 영어/외국어 제목 -> 한글 핵심 요약 번역
    // - 국내 커뮤니티 실시간 검색어처럼 맥락 없는 한글 키워드 -> "왜 화제인지" 한줄 설명 (context가 있으면 참고)
    const list = (items||[]).map((it,i)=>`${i+1}. [${it.id}] ${it.title}${it.context ? ` (참고: ${it.context})` : ""}`).join("\n");
    prompt = `다음은 트렌드 대시보드에 올라온 제목/키워드 목록이다. 해외 기술·엔터 콘텐츠의 영어 제목도 있고, 국내 커뮤니티 실시간 화제 검색어(맥락 없이 짧은 한글 키워드)도 섞여 있다.
한국 시청자가 한눈에 "이게 왜 화제인지" 파악할 수 있도록, 각 항목을 자연스러운 한국어 한 줄 설명(20~30자 내외, 핵심 키워드 포함, 번역체·추측 단정 지양)으로 바꿔줘.
- 영어 제목은 자연스러운 한국어로 요약 번역.
- 참고 정보가 없는 한글 키워드는 보유한 지식으로 가장 가능성 높은 맥락을 짧게 추정하고, 확신이 없으면 "~관련 화제"처럼 완곡하게 표현.
${list}
JSON 배열만 응답 (다른 텍스트 없이): [{"id":"항목id","summary_ko":"한글 설명"}, ...] - id는 원본의 [ ] 안 값을 그대로 사용.`;
  } else if (type === "assess_issue") {
    // issue: {title, source, url, context?} — 세계 이슈 쇼츠 채널의 "제작 준비 파이프라인" 1차 분석.
    // 기존 트렌드 score(=인기도)와는 완전히 다른 축: "이걸로 쇼츠를 만들 수 있는가"를 판단한다.
    prompt = `아래는 전세계 이슈/뉴스를 다루는 쇼츠 채널의 소재 후보다.
제목: "${issue.title}"
소스: ${issue.source}${issue.context ? `\n참고 맥락: ${issue.context}` : ""}

이 소재를 쇼츠로 제작할 가치가 있는지 1차 분석해줘. 평가 기준:
1. summary_ko: 이 이슈가 무엇인지 한국어 1~2문장 요약(배경지식 없는 시청자도 이해 가능하게)
2. angle: 쇼츠로 만든다면 어떤 각도/프레이밍이 좋을지(예: "사실 요약형", "미스터리형", "숫자로 보는 충격", "현지 반응형" 등) 한 줄
3. visual_feasibility: "상"/"중"/"하" — 뉴스 영상·사진·지도·그래픽 등 시각자료를 구하기 쉬운 소재인지
4. visual_note: 위 판단의 근거 한 줄
5. risk_level: "낮음"/"중간"/"높음" — 민감도(인명피해·정치적 논란·저작권 민감 소재 등) 리스크
6. risk_note: 위 판단의 근거 한 줄
7. freshness: "급함"/"보통"/"느슨" — 지금 바로 다뤄야 하는지, 며칠 지나도 괜찮은지
8. global_fit: "상"/"중"/"하" — 한국 시청자가 자막/번역만으로 바로 공감·이해할 수 있는 소재인지(현지 맥락 의존도가 낮을수록 높음)
9. recommended: true/false — 종합적으로 제작을 추천하는지
10. verdict: 종합 판단 한 줄(왜 추천/비추천하는지)

JSON만 응답: {"summary_ko":"...","angle":"...","visual_feasibility":"상","visual_note":"...","risk_level":"낮음","risk_note":"...","freshness":"보통","global_fit":"상","recommended":true,"verdict":"..."}`;
  } else {
    return res.status(400).json({ error: "type은 analyze, script, youtube_benchmark, cross_analysis, channel_analysis, drama_prompt, translate_titles, assess_issue 중 하나." });
  }
  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
      body: JSON.stringify({model:MODEL, max_tokens: type==="translate_titles" ? 4000 : 1500, messages:[{role:"user",content:prompt}]}),
    });
    if (!response.ok) {
      const e = await response.json();
      return res.status(response.status).json({error: e?.error?.message || "Claude API 오류"});
    }
    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?|\n?```/g,"").trim();
    // 배열 응답(translate_titles) 또는 객체 응답 모두 처리
    const isArray = type === "translate_titles";
    const openCh = isArray ? "[" : "{";
    const closeCh = isArray ? "]" : "}";
    const s = cleaned.indexOf(openCh), e2 = cleaned.lastIndexOf(closeCh);
    if (s===-1||e2===-1) return res.status(200).json({raw:cleaned});
    try {
      const parsed = JSON.parse(cleaned.slice(s,e2+1));
      return res.status(200).json(isArray ? {result:parsed} : {result:parsed});
    }
    catch { return res.status(200).json({raw:cleaned}); }
  } catch (err) {
    return res.status(500).json({error: err.message||"서버 오류"});
  }
}