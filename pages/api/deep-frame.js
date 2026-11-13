// pages/api/deep-frame.js — 심층 분석 때 추출한 프레임 이미지 서빙 (data/deep/<id>/<name>)
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const id = String(req.query.id || "").replace(/[^\w-]/g, "");
  const name = String(req.query.f || "");
  if (!id || !/^f_[\d_]+\.jpg$/.test(name)) return res.status(400).end();
  const file = path.join(process.cwd(), "data", "deep", id, name);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  fs.createReadStream(file).pipe(res);
}
