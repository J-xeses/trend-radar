// pages/api/analyze.js
// Claude Haiku 4.5 — AI 분석 + 유튜브 벤치마킹 + 교차 분석 + 채널 분석

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }