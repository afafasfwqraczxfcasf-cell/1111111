/*
 * GET /api/ig-refresh  (lo llama el cron de vercel.json cada semana)
 * Renueva los tokens de larga duración de Instagram (duran 60 días).
 * Si hay KV configurado (KV_REST_API_URL/KV_REST_API_TOKEN) guarda el token
 * nuevo ahí; si no, el refresh igual extiende la vigencia del token actual.
 * Protegido con CRON_SECRET (Vercel lo envía como Bearer automáticamente).
 */
const { CLUBS, envKey } = require("./ig-events.js");

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).end();

  const kvUrl = process.env.KV_REST_API_URL, kvToken = process.env.KV_REST_API_TOKEN;
  const out = {};
  for (const slug of Object.keys(CLUBS)) {
    let token = process.env[envKey(slug)];
    if (kvUrl && kvToken) {
      try {
        const r = await fetch(`${kvUrl}/get/${envKey(slug)}`, { headers: { Authorization: `Bearer ${kvToken}` } });
        const j = await r.json(); if (j.result) token = j.result;
      } catch (_) {}
    }
    if (!token) { out[slug] = "sin token"; continue; }
    try {
      const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
      const j = await r.json();
      if (!j.access_token) throw new Error((j.error && j.error.message) || "sin token");
      if (kvUrl && kvToken) {
        await fetch(`${kvUrl}/set/${envKey(slug)}`, { method: "POST", headers: { Authorization: `Bearer ${kvToken}` }, body: j.access_token });
      }
      out[slug] = `ok, vence en ${Math.round(j.expires_in / 86400)} días`;
    } catch (e) { out[slug] = "error: " + e.message; }
  }
  res.status(200).json(out);
};
