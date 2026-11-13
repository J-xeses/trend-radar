// pages/api/deep-analyze.js
// "심층 분석" — 이슈 후보 영상을 실제로 받아서 본다.
//   1) yt-dlp로 저해상도 영상 + 메타(info.json) 다운로드 (자막은 별도 호출: 자막 429가 영상 다운로드를 같이 죽이던 문제 실측)
//   2) ffmpeg로 프레임 추출 — 첫 3초는 촘촘히(후킹 분석용), 나머지는 균등 간격
//   3) 자막(VTT) → 타임스탬프 대본, 유튜브면 인기 댓글(Data API commentThreads, 1 unit)
//   4) 프레임 이미지 + 대본 + 메타 + 댓글을 Claude(Fable 5.2)에 넣어 비트 단위 분석 + 재구성 플랜 생성
//
// ⚠️ 로컬 전용: yt-dlp/ffmpeg 실행 파일이 필요해서 Vercel 서버리스에서는 동작하지 않는다.
//    프레임은 data/deep/<id>/ 에 남고 /api/deep-frame 으로 서빙된다(next start는 빌드 후 추가된 public/ 파일을 서빙하지 않음).
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";

export const config = { api: { responseLimit: false } };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-fable-5-2";
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const DEEP_DIR = path.join(process.cwd(), "data", "deep");

function run(cmd, args, timeoutMs = 180000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: String(stdout || ""), stderr: String(stderr || ""), err });
    });
  });
}

function ytId(url) {
  const m = (url || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function fmtT(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r < 10 ? "0" : ""}${r.toFixed(r % 1 ? 1 : 0)}`;
}

// 유튜브 자동자막(롤링 형식)은 같은 줄이 여러 큐에 반복된다 → 최근 줄과 같으면 건너뜀
function parseVtt(text) {
  const out = [];
  const recent = [];
  const blocks = text.replace(/\r/g, "").split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.split("\n");
    const ti = lines.findIndex(l => l.includes("-->"));
    if (ti === -1) continue;
    const start = lines[ti].split("-->")[0].trim();
    const [h, m, s] = start.split(":").length === 3 ? start.split(":") : ["0", ...start.split(":")];
    const sec = (+h) * 3600 + (+m) * 60 + parseFloat(s);
    for (const raw of lines.slice(ti + 1)) {
      const t = raw.replace(/<[^>]+>/g, "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").trim();
      if (!t || recent.includes(t)) continue;
      out.push(`[${fmtT(sec)}] ${t}`);
      recent.push(t);
      if (recent.length > 4) recent.shift();
    }
  }
  return out.join("\n");
}

function frameTimes(duration) {
  const d = duration > 0 ? duration : 30;
  const hook = [0, 0.5, 1, 1.5, 2, 3].filter(t => t < d - 0.1);
  const rest = [];
  const restCount = d > 180 ? 14 : 10;
  const from = 4, to = Math.max(from, d - 0.5);
  if (to > from) {
    for (let i = 0; i < restCount; i++) rest.push(+(from + (to - from) * (i / (restCount - 1))).toFixed(1));
  }
  return [...hook, ...rest];
}

async function fetchComments(videoId) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !videoId) return [];
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=30&textFormat=plainText&key=${key}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.items || []).map(it => {
      const s = it.snippet?.topLevelComment?.snippet || {};
      return { text: (s.textDisplay || "").slice(0, 300), likes: s.likeCount || 0 };
    }).filter(c => c.text);
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id, url, title, category, apiKey } = req.body || {};
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(400).json({ error: "Claude API 키가 필요합니다." });
  if (!id || !url) return res.status(400).json({ error: "id와 url이 필요합니다(영상 링크가 있는 후보만 심층 분석 가능)." });

  const safeId = String(id).replace(/[^\w-]/g, "");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "tr-deep-"));
  const outDir = path.join(DEEP_DIR, safeId);
  const steps = [];
  try {
    // 1) 영상 + 메타
    const dl = await run(YTDLP, [url, "-f", "bv*/b", "-S", "res:480", "--write-info-json", "--no-playlist",
      "-o", path.join(work, "v.%(ext)s"), "--quiet", "--no-warnings"], 240000);
    const files = fs.readdirSync(work);
    const videoFile = files.find(f => /^v\.(mp4|webm|mkv|mov)$/i.test(f));
    if (!videoFile) {
      const reason = (dl.stderr || dl.err?.message || "").split("\n").filter(Boolean).slice(-2).join(" / ");
      return res.status(502).json({ error: `영상 다운로드 실패 — ${reason || "원인 불명"}`, hint: url.includes("reddit") ? "Reddit은 현재 이 PC에서 403 차단 중입니다." : "" });
    }
    steps.push("download");
    let info = {};
    try { info = JSON.parse(fs.readFileSync(path.join(work, "v.info.json"), "utf8")); } catch {}

    // 2) 자막 (실패해도 진행)
    await run(YTDLP, [url, "--skip-download", "--write-auto-subs", "--write-subs", "--sub-langs", "en,en-orig,ko",
      "--sub-format", "vtt", "--no-playlist", "-i", "-o", path.join(work, "v.%(ext)s"), "--quiet", "--no-warnings"], 60000);
    const vtts = fs.readdirSync(work).filter(f => f.endsWith(".vtt"));
    const pick = vtts.find(f => f === "v.en-orig.vtt") || vtts.find(f => f === "v.en.vtt") || vtts.find(f => f === "v.ko.vtt") || vtts[0];
    const transcript = pick ? parseVtt(fs.readFileSync(path.join(work, pick), "utf8")).slice(0, 6000) : "";
    if (transcript) steps.push("transcript");

    // 3) 길이 + 프레임
    let duration = +info.duration || 0;
    if (!duration) {
      const pr = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path.join(work, videoFile)], 30000);
      duration = parseFloat(pr.stdout) || 0;
    }
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    const frames = [];
    for (const t of frameTimes(duration)) {
      const name = `f_${String(t).replace(".", "_")}.jpg`;
      const r = await run(FFMPEG, ["-v", "error", "-y", "-ss", String(t), "-i", path.join(work, videoFile),
        "-frames:v", "1", "-vf", "scale=-2:640", "-q:v", "5", path.join(outDir, name)], 30000);
      if (r.ok && fs.existsSync(path.join(outDir, name))) frames.push({ t, name });
    }
    if (!frames.length) return res.status(502).json({ error: "프레임 추출 실패 (ffmpeg)" });
    steps.push("frames");

    // 4) 댓글
    const vid = ytId(url) || (info.extractor_key === "Youtube" ? info.id : null);
    const comments = await fetchComments(vid);
    if (comments.length) steps.push("comments");

    // 5) Claude
    const meta = {
      title: info.title || title, channel: info.channel || info.uploader || "", duration: Math.round(duration),
      views: info.view_count ?? null, likes: info.like_count ?? null, comments: info.comment_count ?? null,
      uploaded: info.upload_date || "", description: (info.description || "").slice(0, 1200),
      tags: (info.tags || []).slice(0, 15),
    };
    const content = [];
    content.push({ type: "text", text: `아래는 쇼츠 채널(해외 니치 바이럴 클립을 한국 시청자용 스토리 쇼츠로 재구성하는 채널)의 소재 후보 영상이다. 카테고리: ${category || "미지정"}\n\n[메타데이터]\n${JSON.stringify(meta, null, 1)}\n\n[프레임] 아래 이미지들은 영상에서 순서대로 뽑은 프레임이며, 각 이미지 앞에 타임스탬프가 붙어 있다. 0~3초 구간은 후킹 분석을 위해 촘촘히 뽑았다.` });
    for (const f of frames) {
      content.push({ type: "text", text: `▶ ${fmtT(f.t)}` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(path.join(outDir, f.name)).toString("base64") } });
    }
    content.push({ type: "text", text: `[대본/자막]\n${transcript || "(자막 없음 — 화면 텍스트와 프레임으로 추론할 것. 음성 내용은 확인 불가하다고 명시)"}\n\n[인기 댓글 상위]\n${comments.length ? comments.map(c => `- (${c.likes}♥) ${c.text}`).join("\n") : "(댓글 없음/수집 불가)"}

이 영상을 실제로 본 것처럼 심층 분석하고, 우리 채널에서 원본을 그대로 쓰지 않고 재구성할 제작 플랜을 짜줘.
- 프레임과 대본에서 직접 확인되는 것과 추정은 구분할 것(추정이면 "추정" 표기).
- 우리 채널 제작 방식: 오픈소스 영상·이미지(퍼블릭도메인·CC0·CC-BY 출처표기·무료 스톡)를 주재료로 편집·커스터마이징하고, 원본 영상은 꼭 필요한 짧은 구간만 일부 차용하며, 그 위에 한국어 나레이션 + 이야기를 이끄는 진행자(누구일지는 미정 — "진행자"로만 표기) 등장으로 연출 품질을 높인다. 원본 통째 재업로드는 하지 않는다.
- 재구성 플랜 구간은 진행자 컷(훅·반전 리액션·마무리 등)과 소스 영상 컷이 자연스럽게 교차하도록 짤 것. 원본 일부 차용 구간은 최소화하고 이유를 visual에 적을 것.
- 사실관계 주장이 있으면 검증이 필요한 항목으로 뽑을 것.

JSON만 응답(다른 텍스트 없이):
{"one_line":"이 영상이 무엇인지 한 줄","timeline":[{"t":"0:00-0:03","visual":"화면에 보이는 것","audio":"말/자막/소리","role":"훅|전개|긴장|반전|해답|CTA 중 하나"}],"hook_breakdown":{"first_frame":"첫 프레임이 주는 인상","first_line":"첫 대사/자막","technique":"어떤 후킹 기법인지(질문형·이상한 장면·숫자 충격 등)","why_works":"왜 3초 안에 멈추게 하는지"},"retention_mechanics":["시청 지속 장치1","장치2","장치3"],"story_structure":"전체 구조 한 줄(예: 일상의 의문 → 위험 암시 → 원리 설명 → 안도)","audience_reaction":{"main_feelings":"댓글에 드러난 주된 반응","questions":["시청자들이 궁금해하는 것1","2"],"debates":"논쟁/반박 포인트(없으면 빈 문자열)"},"facts_to_verify":["검증 필요한 주장1","2"],"remix_plan":{"titles":["한국어 제목안1","2","3"],"hook_line":"첫 3초 한국어 나레이션","beats":[{"sec":"0-3","narration":"나레이션","visual":"필요한 화면","source":"오픈소스|원본일부차용|진행자|그래픽|AI생성"}],"differentiation":"원본 대비 무엇을 더하거나 바꾸는지","length_sec":45},"visual_sourcing":"필요한 영상 소스를 저작권 안전하게 확보하는 방법","copyright_risk":{"level":"낮음|중간|높음","note":"이유와 권장"},"difficulty":"쉬움|보통|어려움","score":8,"verdict":"제작 추천 여부와 이유 한 줄"}` });

    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, messages: [{ role: "user", content }] }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Claude API 오류" });
    if (data.stop_reason === "refusal") return res.status(502).json({ error: "모델이 요청을 거절함" });
    const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
    let result;
    try { result = JSON.parse(cleaned.slice(s, e + 1)); }
    catch { return res.status(502).json({ error: "분석 결과 파싱 실패", stop_reason: data.stop_reason, raw: cleaned.slice(0, 2000) }); }

    const deep = {
      ...result,
      meta, frames, transcriptAvailable: !!transcript, commentCount: comments.length,
      steps, analyzedAt: new Date().toISOString(),
      usage: data.usage ? { input: data.usage.input_tokens, output: data.usage.output_tokens } : null,
    };
    return res.status(200).json({ deep });
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}
