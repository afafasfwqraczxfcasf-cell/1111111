/*
 * ig-events.js — cliente del navegador.
 * IGEvents.load({ club, fallback }) -> Promise<{ source, updated, events }>
 *
 * Pide los eventos a la API (/api/ig-events?club=<slug>), que lee Instagram
 * con la Graph API y responde con cache de ~10 min. Si la API no está
 * disponible (preview, sin token, sin red) usa el fallback de la página.
 *
 * Config opcional antes de cargar este script:
 *   window.IG_EVENTS_ENDPOINT = "https://tu-dominio.com/api/ig-events";
 */
(function () {
  var ENDPOINT = window.IG_EVENTS_ENDPOINT || "/api/ig-events";
  var TIMEOUT = 4500;
  var CACHE_MIN = 10;

  function readCache(club) {
    try {
      var raw = localStorage.getItem("igev:" + club);
      if (!raw) return null;
      var c = JSON.parse(raw);
      return Date.now() - c.t < CACHE_MIN * 60e3 ? c.data : null;
    } catch (e) { return null; }
  }
  function writeCache(club, data) {
    try { localStorage.setItem("igev:" + club, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
  }

  function recompute(events) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return (events || []).map(function (e) {
      var copy = Object.assign({}, e);
      if (copy.date) copy.isUpcoming = new Date(copy.date) >= today;
      return copy;
    });
  }

  function fallbackResult(fallback) {
    return { source: "fallback", updated: new Date().toISOString(), events: recompute(fallback) };
  }

  function load(opts) {
    var club = opts.club, fallback = opts.fallback || [];
    if (location.protocol === "file:") return Promise.resolve(fallbackResult(fallback));
    var cached = readCache(club);
    if (cached) return Promise.resolve(Object.assign({}, cached, { events: recompute(cached.events) }));

    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { ctrl && ctrl.abort(); }, TIMEOUT);
    return fetch(ENDPOINT + "?club=" + encodeURIComponent(club), { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        if (!data || !Array.isArray(data.events) || !data.events.length) return fallbackResult(fallback);
        var result = { source: "instagram", updated: data.updated || new Date().toISOString(), handle: data.handle, events: recompute(data.events) };
        writeCache(club, result);
        return result;
      })
      .catch(function () { clearTimeout(timer); return fallbackResult(fallback); });
  }

  /** "hace 5 min", "hace 2 h", "hace 3 días" */
  function ago(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "hace un momento";
    if (s < 3600) return "hace " + Math.round(s / 60) + " min";
    if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
    return "hace " + Math.round(s / 86400) + " días";
  }

  window.IGEvents = { load: load, ago: ago };
})();
