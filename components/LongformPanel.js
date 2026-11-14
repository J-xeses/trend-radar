// "롱폼 소재 창고" 패널 — 에버그린(오래 찾아보는) 10분+ 롱폼 소재를 발굴(Claude) → 검증(위키 3년 조회수) → 저장·관리.
import { useEffect, useState } from "react";

const C = {
  bg: "#07070e", bg1: "#0d0d1a", bg2: "#131320", bg3: "#191928",
  ac: "#7c6ff7", g: "#10c98a", am: "#f59e0b", r: "#f05252", cy: "#0ea5e9", ro: "#f472b6", vi: "#a78bfa",
  t: "#f0f0ff", ts: "#a0a0c8", tm: "#58586e", b: "rgba(255,255,255,.07)", b2: "rgba(255,255,255,.13)",
  m: "'IBM Plex Mono', monospace",
};
const CATS = ["이색 테크·발명", "미스터리·미제사건", "해외 바이럴·장인", "심리·행동실험", "틈새 상식·역발상", "팩트체크·탐사", "역사·문명", "자연·우주", "인간·몸의 비밀"];
const FORMATS = ["검증소", "댓글이 물었다", "직접 해봤다", "TOP5", "딥다이브"];
const STATUS = [["idea", "아이디어", C.ts], ["research", "조사 중", C.cy], ["plan", "기획 중", C.vi], ["produce", "제작 중", C.am], ["done", "제작 완료", C.g], ["hold", "보류", C.tm]];
const statusMeta = (s) => STATUS.find((x) => x[0] === s) || STATUS[0];
const fmtNum = (n) => (n == null ? "-" : n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}만` : n.toLocaleString());

function Spark({ series, color = C.cy, w = 150, h = 34 }) {
  if (!series?.length) return <div style={{ width: w, height: h, fontSize: 10, color: C.tm, display: "grid", placeItems: "center" }}>데이터 없음</div>;
  const v = series.map((x) => x.v);
  const max = Math.max(...v, 1);
  const pts = v.map((y, i) => `${(i / Math.max(1, v.length - 1)) * w},${h - (y / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}22`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function Score({ ev }) {
  const s = ev?.score;
  const col = s == null ? C.tm : s >= 70 ? C.g : s >= 50 ? C.am : C.r;
  return (
    <div style={{ textAlign: "center", minWidth: 62 }}>
      <div style={{ fontSize: 22, fontWeight: 900, fontFamily: C.m, color: col, lineHeight: 1 }}>{s ?? "–"}</div>
      <div style={{ fontSize: 9.5, color: C.tm, marginTop: 3 }}>에버그린</div>
      <div style={{ fontSize: 10, color: col, fontWeight: 700 }}>{ev?.label || ""}</div>
    </div>
  );
}

function TopicBody({ it }) {
  const st = it.wiki?.enStats;
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.t }}>{it.title}</span>
        {it.format && <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${C.vi}20`, color: C.vi, border: `1px solid ${C.vi}40` }}>{it.format}</span>}
        {it.category && <span style={{ fontSize: 10, color: C.tm }}>{it.category}</span>}
      </div>
      {it.angle && <div style={{ fontSize: 12, color: C.ts, marginTop: 4, lineHeight: 1.55 }}>🎯 {it.angle}</div>}
      {it.why_evergreen && <div style={{ fontSize: 11.5, color: C.tm, marginTop: 2 }}>♾ {it.why_evergreen}</div>}
      {it.host_role && <div style={{ fontSize: 11.5, color: C.cy, marginTop: 2 }}>🎙 진행자: {it.host_role}</div>}
      {it.chapters?.length > 0 && <div style={{ fontSize: 11, color: C.ts, marginTop: 4 }}>📑 {it.chapters.map((c, i) => `${i + 1}. ${c}`).join("  ·  ")}</div>}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
        <Spark series={it.wiki?.enSeries} />
        <div style={{ fontSize: 10.5, fontFamily: C.m, color: C.ts, lineHeight: 1.7 }}>
          {it.wiki ? <>
            <a href={it.wiki.url} target="_blank" rel="noreferrer" style={{ color: C.cy }}>{it.wiki.en}</a>{it.wiki.ko ? ` · ko: ${it.wiki.ko}` : ""}<br />
            월평균 {fmtNum(st?.avg)} · 변동 {st?.cv} · 3년 유지 {st ? `${Math.round(st.keep * 100)}%` : "-"}{it.wiki.koStats ? ` · 한국어 월 ${fmtNum(it.wiki.koStats.avg)}` : ""}
          </> : <span style={{ color: C.tm }}>위키 문서를 못 찾음 — 문서명을 고쳐 다시 확인하세요</span>}
        </div>
      </div>
    </>
  );
}

export default function LongformPanel({ apiKey }) {
  const [items, setItems] = useState([]);
  const [cands, setCands] = useState([]);
  const [cat, setCat] = useState("");
  const [seed, setSeed] = useState("");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("score");
  const [manual, setManual] = useState({ title: "", wiki_title: "", format: "딥다이브" });
  const [rowBusy, setRowBusy] = useState({});
  const [wikiEdit, setWikiEdit] = useState({});
  const [delAsk, setDelAsk] = useState(null); // 두 번 눌러 삭제(네이티브 confirm 대화상자 안 씀)

  const load = () => fetch("/api/longform").then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const post = async (body) => {
    const r = await fetch("/api/longform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d;
  };
  const discover = async () => {
    setBusy("AI가 소재를 찾고 위키 3년 조회수로 검증하는 중… (20~40초)"); setErr("");
    try { const d = await post({ action: "discover", category: cat, seed, count, apiKey }); setCands(d.candidates || []); } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const addManual = async () => {
    setBusy("위키 조회수 확인 중…"); setErr("");
    try { const d = await post({ action: "add", ...manual }); setCands((c) => [...(d.candidates || []), ...c]); setManual({ title: "", wiki_title: "", format: manual.format }); } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const save = async (it, k) => {
    try { await post({ action: "save", item: it }); setCands((c) => c.filter((_, j) => j !== k)); load(); } catch (e) { setErr(e.message); }
  };
  const patch = async (id, body) => {
    const r = await fetch("/api/longform", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const d = await r.json();
    if (d.item) setItems((list) => list.map((x) => (x.id === id ? d.item : x)));
  };
  const rowAction = async (id, body, label) => {
    setRowBusy((b) => ({ ...b, [id]: label })); setErr("");
    try { const d = await post({ id, ...body }); if (d.item) setItems((list) => list.map((x) => (x.id === id ? d.item : x))); } catch (e) { setErr(e.message); }
    setRowBusy((b) => { const n = { ...b }; delete n[id]; return n; });
  };
  const remove = async (id) => { await fetch(`/api/longform?id=${encodeURIComponent(id)}`, { method: "DELETE" }); load(); };

  const shown = items.filter((x) => filter === "all" || x.status === filter)
    .sort((a, b) => (sort === "score" ? (b.evergreen?.score ?? -1) - (a.evergreen?.score ?? -1) : String(b.updatedAt).localeCompare(String(a.updatedAt))));
  const chip = (on, color = C.ac) => ({ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: "pointer", border: `1px solid ${on ? color : C.b2}`, background: on ? `${color}20` : "transparent", color: on ? color : C.ts });
  const btn = (color = C.ac, solid) => ({ fontSize: 11.5, fontWeight: 700, padding: "6px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${color}60`, background: solid ? color : `${color}15`, color: solid ? "#fff" : color });
  const card = { background: C.bg2, border: `1px solid ${C.b}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 14 };
  const input = { background: C.bg, border: `1px solid ${C.b2}`, color: C.t, borderRadius: 8, padding: "7px 10px", fontSize: 12.5 };

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.t }}>롱폼 소재 창고</span>
          <span style={{ fontSize: 10, fontFamily: C.m, padding: "2px 9px", borderRadius: 20, background: `${C.g}18`, border: `1px solid ${C.g}40`, color: C.g }}>{items.length}개 저장</span>
        </div>
        <div style={{ fontSize: 12, color: C.tm, marginTop: 4, lineHeight: 1.6 }}>
          최신 트렌드에 흔들리지 않는 10분+ 롱폼 소재를 모아요. AI가 제안한 소재마다 <b style={{ color: C.ts }}>위키백과 최근 3년 월별 조회수</b>로 "오래 꾸준히 찾아보는 주제인지" 점수를 매겨요(무료). 유튜브 근거 영상(1년 넘은 8분+ 영상)은 필요할 때만 확인해요.
        </div>
      </div>

      {/* 발굴 */}
      <div style={{ background: C.bg1, border: `1px solid ${C.b}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={chip(!cat)} onClick={() => setCat("")}>자유</span>
          {CATS.map((c) => <span key={c} style={chip(cat === c)} onClick={() => setCat(c)}>{c}</span>)}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ ...input, flex: 1, minWidth: 220 }} placeholder="키워드·방향(선택) — 예: 비행기, 일상 속 숨은 설계, 착각을 부르는 심리" value={seed} onChange={(e) => setSeed(e.target.value)} onKeyDown={(e) => e.key === "Enter" && discover()} />
          <select style={input} value={count} onChange={(e) => setCount(+e.target.value)}>{[5, 8, 12].map((n) => <option key={n} value={n}>{n}개</option>)}</select>
          <button style={btn(C.ac, true)} disabled={!!busy || !apiKey} title={apiKey ? "" : "상단 Claude 연결이 필요해요"} onClick={discover}>✨ 소재 발굴</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${C.b2}` }}>
          <span style={{ fontSize: 11.5, color: C.tm }}>직접 추가</span>
          <input style={{ ...input, flex: 1, minWidth: 160 }} placeholder="소재 제목" value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
          <input style={{ ...input, width: 190 }} placeholder="영어 위키 문서명(검증용)" value={manual.wiki_title} onChange={(e) => setManual({ ...manual, wiki_title: e.target.value })} />
          <select style={input} value={manual.format} onChange={(e) => setManual({ ...manual, format: e.target.value })}>{FORMATS.map((f) => <option key={f}>{f}</option>)}</select>
          <button style={btn(C.cy)} disabled={!!busy || !manual.title.trim()} onClick={addManual}>확인하기</button>
        </div>
        {busy && <div style={{ fontSize: 12, color: C.am }}>⏳ {busy}</div>}
        {err && <div style={{ fontSize: 12, color: C.r }}>{err}</div>}
      </div>

      {cands.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.t }}>새로 찾은 후보 {cands.length}개 <span style={{ fontWeight: 400, color: C.tm }}>— 에버그린 점수 높은 순. 마음에 드는 것만 저장하세요.</span></div>
          {cands.map((it, k) => (
            <div key={k} style={{ ...card, borderColor: `${C.ac}40` }}>
              <Score ev={it.evergreen} />
              <div style={{ flex: 1, minWidth: 0 }}><TopicBody it={it} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button style={btn(C.g, true)} onClick={() => save(it, k)}>창고에 저장</button>
                <button style={btn(C.tm)} onClick={() => setCands((c) => c.filter((_, j) => j !== k))}>버리기</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 창고 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.t, marginRight: 6 }}>창고</span>
          <span style={chip(filter === "all")} onClick={() => setFilter("all")}>전체 {items.length}</span>
          {STATUS.map(([k, l, c]) => <span key={k} style={chip(filter === k, c)} onClick={() => setFilter(k)}>{l} {items.filter((x) => x.status === k).length}</span>)}
          <select style={{ ...input, marginLeft: "auto", padding: "4px 8px" }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">에버그린 점수순</option><option value="recent">최근 수정순</option>
          </select>
        </div>
        {shown.length === 0 && <div style={{ fontSize: 12.5, color: C.tm, padding: "18px 0" }}>저장된 소재가 없어요. 위에서 발굴하거나 직접 추가하세요.</div>}
        {shown.map((it) => {
          const [, sl, sc] = statusMeta(it.status);
          const rb = rowBusy[it.id];
          return (
            <div key={it.id} style={{ ...card, flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <Score ev={it.evergreen} />
                <div style={{ flex: 1, minWidth: 0 }}><TopicBody it={it} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch", width: 150 }}>
                  <select style={{ ...input, color: sc, fontWeight: 700 }} value={it.status} onChange={(e) => patch(it.id, { status: e.target.value })}>
                    {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <select style={input} value={it.format || ""} onChange={(e) => patch(it.id, { format: e.target.value })}>
                    {FORMATS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                  <button style={btn(C.r)} disabled={!!rb} onClick={() => rowAction(it.id, { action: "youtube" }, "유튜브 확인 중…")} title="유튜브 할당량 약 101 units">▶ 근거 영상</button>
                  <button style={btn(delAsk === it.id ? C.r : C.tm, delAsk === it.id)} onClick={() => { if (delAsk === it.id) { setDelAsk(null); remove(it.id); } else { setDelAsk(it.id); setTimeout(() => setDelAsk((x) => (x === it.id ? null : x)), 3000); } }}>{delAsk === it.id ? "한 번 더 누르면 삭제" : "삭제"}</button>
                </div>
              </div>
              {rb && <div style={{ fontSize: 11.5, color: C.am }}>⏳ {rb}</div>}
              {it.youtube?.videos && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                  {it.youtube.videos.length === 0 && <span style={{ fontSize: 11.5, color: C.tm }}>1년 넘은 8분+ 영상이 없어요 — 롱폼으로 다룬 사람이 적은 빈 소재일 수도 있어요.</span>}
                  {it.youtube.videos.map((v) => (
                    <a key={v.id} href={v.url} target="_blank" rel="noreferrer" style={{ width: 168, flexShrink: 0, textDecoration: "none" }}>
                      <img src={v.thumb} alt="" style={{ width: 168, height: 94, objectFit: "cover", borderRadius: 7 }} />
                      <div style={{ fontSize: 10.5, color: C.ts, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                      <div style={{ fontSize: 10, fontFamily: C.m, color: C.tm }}>{v.minutes}분 · {v.ageYears}년 전 · 연 {fmtNum(v.viewsPerYear)}회</div>
                    </a>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input style={{ ...input, flex: 1, minWidth: 200 }} placeholder="메모 — 기획 아이디어, 진행자 실험 아이디어, 참고 자료" defaultValue={it.memo}
                  onBlur={(e) => e.target.value !== (it.memo || "") && patch(it.id, { memo: e.target.value })} />
                <input style={{ ...input, width: 200 }} placeholder="위키 문서명 고치기" value={wikiEdit[it.id] ?? ""} onChange={(e) => setWikiEdit((w) => ({ ...w, [it.id]: e.target.value }))} />
                <button style={btn(C.cy)} disabled={!!rb} onClick={() => rowAction(it.id, { action: "refresh", wiki_title: wikiEdit[it.id] || undefined }, "위키 다시 확인 중…")}>↻ 위키 재확인</button>
                <span style={{ fontSize: 10.5, color: C.tm }}>{sl}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
