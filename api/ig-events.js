/*
 * GET /api/ig-events?club=<slug>
 * Serverless (Vercel / Netlify con adaptador / cualquier Node 18+).
 *
 * Lee los últimos posts de la cuenta de Instagram del club con la
 * Instagram Graph API ("Instagram API with Instagram Login"), los
 * convierte en eventos con shared/ig-parse.js y responde con cache de CDN
 * de 10 minutos. Cuando el club publica un flyer nuevo, aparece en la web
 * en ≤10 min sin tocar código.
 *
 * Variables de entorno por club (SLUG en mayúsculas, guiones -> _):
 *   IG_TOKEN_TUTAINA       token de larga duración (60 días, se renueva con /api/ig-refresh)
 *   IG_TOKEN_CANTINA_70
 * Opcional (si se usa Upstash/Vercel KV para guardar tokens renovados):
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 */
const { postsToEvents } = require("../shared/ig-parse.js");

const CLUBS = {
  "tutaina":    { handle: "tutaina.ejecafetero" },
  "cantina-70": { handle: "cantina70.med" }
};
const GRAPH = "https://graph.instagram.com/v21.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

const envKey = (slug) => "IG_TOKEN_" + slug.toUpperCase().replace(/-/g, "_");

async function getToken(slug) {
  const url = process.env.KV_REST_API_URL, kvToken = process.env.KV_REST_API_TOKEN;
  if (url && kvToken) {
    try {
      const r = await fetch(`${url}/get/${envKey(slug)}`, { headers: { Authorization: `Bearer ${kvToken}` } });
      const j = await r.json();
      if (j && j.result) return j.result;
    } catch (_) {}
  }
  return process.env[envKey(slug)];
}

module.exports = async function handler(req, res) {
  const slug = String((req.query && req.query.club) || new URL(req.url, "http://x").searchParams.get("club") || "");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!CLUBS[slug]) return res.status(400).json({ error: "club desconocido" });

  const token = await getToken(slug);
  if (!token) return res.status(503).json({ error: "Instagram no conectado para este club", events: [] });

  try {
    const r = await fetch(`${GRAPH}/me/media?fields=${FIELDS}&limit=25&access_token=${encodeURIComponent(token)}`);
    const j = await r.json();
    if (!r.ok || j.error) throw new Error((j.error && j.error.message) || "Graph API " + r.status);

    const events = postsToEvents(j.data || []);
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({ club: slug, handle: CLUBS[slug].handle, updated: new Date().toISOString(), events });
  } catch (err) {
    res.setHeader("Cache-Control", "public, s-maxage=60");
    return res.status(502).json({ error: String(err.message || err), events: [] });
  }
};

module.exports.CLUBS = CLUBS;
module.exports.envKey = envKey;
