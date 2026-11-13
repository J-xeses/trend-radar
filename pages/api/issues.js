// pages/api/issues.js
// "이슈 후보" 제작 준비 파이프라인 저장소.
//
// ⚠️ 저장 방식 한계 — 지금은 로컬 JSON 파일(data/issue-candidates.json)에 씀.
// `npm run dev`로 로컬에서 쓰는 동안은 문제없이 동작하지만, Vercel 프로덕션
// 서버리스 환경에서는 파일시스템이 요청마다/인스턴스마다 초기화돼 영구 저장이
// 안 된다. Vercel 배포가 재개되면(11/30~) Vercel Blob/KV 같은 실제 저장소로
// 교체 필요 — 그 전까지는 로컬 실행 전용으로 쓸 것.
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "issue-candidates.json");

function readAll() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeAll(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}
function normalizeTitle(s) {
  return (s || "").toLowerCase().replace(/[\s\p{P}]/gu, "").trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const list = readAll();
    const status = req.query.status;
    const filtered = status ? list.filter(c => c.status === status) : list;
    return res.status(200).json({ items: filtered.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt)) });
  }

  if (req.method === "POST") {
    const { title, url, source, country, extra } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });
    const list = readAll();
    const normTitle = normalizeTitle(title);
    const now = new Date().toISOString();
    // 중복 등록 방지 — url이 같거나(있는 경우), 없으면 정규화된 제목이 같으면 기존 항목으로 간주
    const existing = list.find(c =>
      (url && c.url && c.url === url) || (!url || !c.url) && normalizeTitle(c.title) === normTitle
    );
    if (existing) {
      existing.lastSeenAt = now;
      existing.seenCount = (existing.seenCount || 1) + 1;
      writeAll(list);
      return res.status(200).json({ item: existing, duplicate: true });
    }
    const item = {
      id: `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title, url: url || "", source: source || "", country: country || "",
      extra: extra || {},
      status: "new", // new -> reviewing -> adopted -> produced | dropped
      analysis: null,
      memo: "",
      firstSeenAt: now, lastSeenAt: now, seenCount: 1,
    };
    list.push(item);
    writeAll(list);
    return res.status(200).json({ item, duplicate: false });
  }

  if (req.method === "PATCH") {
    const { id, status, memo, analysis, deep, sourceCheck } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });
    const list = readAll();
    const item = list.find(c => c.id === id);
    if (!item) return res.status(404).json({ error: "not found" });
    if (status !== undefined) item.status = status;
    if (memo !== undefined) item.memo = memo;
    if (analysis !== undefined) item.analysis = analysis;
    if (deep !== undefined) item.deep = deep; // 심층 분석(영상 실제 시청) 결과 — /api/deep-analyze
    if (sourceCheck !== undefined) item.sourceCheck = sourceCheck; // 소스 확보 점검 결과 — /api/source-check
    writeAll(list);
    return res.status(200).json({ item });
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id required" });
    const list = readAll().filter(c => c.id !== id);
    writeAll(list);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
