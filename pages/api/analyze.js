// pages/api/analyze.js
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-fable-5-2";
// 제목 한 줄 번역은 단순 작업 — Fable은 30개 묶음에 25~28초 걸려 체감 지연이 컸음(실측). 빠른 모델 우선, 실패 시 MODEL로 폴백.
const FAST_MODEL = "claude-haiku-5-5";

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
  } else if (type === "assess_clip") {
    // issue: {title, source, url, category?, platform?, context?}
    // 니치 바이럴 클립 큐레이션(이색테크·미스터리·장인·심리실험·틈새상식·팩트체크)의 1차 분석.
    // 뉴스 기사가 아니라 "이미 바이럴된 영상/게시물"이 소재이므로, 평가축도 민감도/시사성이
    // 아니라 "왜 끌리는지 / 어떻게 재구성하면 더 잘 먹힐지"에 맞춘다. 이미 다뤄진 소재여도
    // 감점하지 않는다 — 접하지 못한 시청자에게는 여전히 새 소재다.
    prompt = `아래는 쇼츠 채널의 소재 후보로 수집된, 이미 바이럴된 영상/게시물이다.
제목: "${issue.title}"
소스: ${issue.source}${issue.category ? ` / 카테고리: ${issue.category}` : ""}${issue.context ? `\n참고 맥락: ${issue.context}` : ""}

이 소재로 쇼츠를 재구성한다면 어떨지 1차 분석해줘. 평가 기준:
1. summary_ko: 이 소재가 무엇에 관한 내용인지 한국어 1~2문장 요약(제목만 보고 모를 시청자도 이해 가능하게)
2. hook_point: 영상을 본다면 "3초 안에 시선을 끌 포인트"가 뭘지 한 줄 추정(제목·카테고리 기반 추론임을 감안해 구체적으로)
3. retention_secret: 끝까지 보게 만드는 요인(반전, 궁금증 지속, 비주얼 임팩트 등) 한 줄
4. remix_angle: 이미 알려진 소재여도 새롭게 재구성할 앵글 제안(예: "한국 시청자가 모를 디테일 추가", "반전 순서 바꾸기", "다른 사례와 비교", "직접 검증/실험 재연") 한 줄 — 원본 그대로 베끼지 않고 차별화할 방법
5. freshness_note: 이미 널리 퍼진 소재인지, 상대적으로 덜 알려진 소재인지 — "이미 다뤄졌어도 재구성 가치 있음"을 기본 전제로 중립적으로 평가(감점 요소 아님)
6. why_question: 이 소재가 던지는 "왜?" 질문 한 줄(예: "비행기 창문에는 왜 작은 구멍이 있을까?"). 원인·이유를 설명할 거리가 없으면 빈 문자열.
7. participation: 시청자가 그 "왜?"에 대해 댓글로 자기 생각을 쓰고 서로 의견을 펼칠 잠재력 — Virtal 채널의 가장 핵심 기준이다.
   - guessable(0~3): 지식 없이도 "내 생각엔…"을 쓸 수 있는가
   - intuition_gap(0~3): 정답을 들어도 "그래도 이상한데?"가 남는가(직관과 답이 엇갈림)
   - personal(0~3): "나도 그래/우리는 달라" 같은 내 경험과 연결되는가
   - safe_debate(0~3): 논쟁이 직관·이론 사이의 건강한 싸움인가(정치·젠더·종교·혐오로 번질수록 0)
   - score(0~100): 위 네 개를 종합한 댓글 참여 잠재력
   - split: 댓글이 어디서 갈릴지 한 줄 예측(예: "김서림 방지 vs 압력 조절")
   - closing_question: 답을 알려준 뒤 마지막에 다시 던질 물음표 한 줄(새 논쟁을 남기는 질문)
8. recommended: true/false — 종합적으로 제작을 추천하는지(댓글 참여 잠재력이 낮으면 신중하게)
9. verdict: 종합 판단 한 줄

JSON만 응답: {"summary_ko":"...","hook_point":"...","retention_secret":"...","remix_angle":"...","freshness_note":"...","why_question":"...","participation":{"guessable":2,"intuition_gap":2,"personal":1,"safe_debate":3,"score":70,"split":"...","closing_question":"...?"},"recommended":true,"verdict":"..."}`;
  } else {
    return res.status(400).json({ error: "type은 analyze, script, youtube_benchmark, cross_analysis, channel_analysis, drama_prompt, translate_titles, assess_clip 중 하나." });
  }
  try {
    const callModel = (model) => fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
      // Fable 5.2(항상)·Haiku 5.5(기본) 모두 thinking이 켜져 있어 그 토큰도 max_tokens에 포함됨 — 넉넉히.
      // 번역은 단순 작업이라 effort low로 속도 우선.
      body: JSON.stringify({
        model, max_tokens: 8000,
        ...(type === "translate_titles" ? { output_config: { effort: "low" } } : {}),
        messages:[{role:"user",content:prompt}],
      }),
    });
    let response = await callModel(type === "translate_titles" ? FAST_MODEL : MODEL);
    if (!response.ok && type === "translate_titles" && response.status !== 401) {
      response = await callModel(MODEL);
    }
    if (!response.ok) {
      const e = await response.json();
      return res.status(response.status).json({error: e?.error?.message || "Claude API 오류"});
    }
    const data = await response.json();
    // 첫 블록은 thinking 블록이라 content[0].text는 항상 비어 있었음 → text 블록만 모은다
    const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (data.stop_reason === "refusal") {
      return res.status(502).json({ error: "모델이 요청을 거절함", category: data.stop_details?.category || null });
    }
    if (!raw.trim()) {
      return res.status(502).json({ error: "빈 응답", stop_reason: data.stop_reason, blocks: (data.content || []).map(b => b.type) });
    }
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