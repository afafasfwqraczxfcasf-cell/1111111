/*
 * ig-parse.js — convierte posts de Instagram en eventos.
 * UMD: se usa en el navegador (window.IGParse) y en la API serverless (require).
 *
 * Reglas:
 *  - Título: primera línea útil del caption, sin hashtags, menciones ni emojis sueltos.
 *  - Fecha: busca en el caption formatos en español:
 *      "31 de octubre", "VIE 31 OCT", "31/10", "31.10.2026", "sábado 1 nov",
 *      "este viernes", "mañana", "hoy"  (los relativos se resuelven contra la fecha del post)
 *  - Es evento si tiene fecha o palabras clave (evento, fiesta, line up, en vivo, invitado, preventa, cover…).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IGParse = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var MONTHS = {
    ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
    may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
    sep: 8, sept: 8, septiembre: 8, setiembre: 8, oct: 9, octubre: 9,
    nov: 10, noviembre: 10, dic: 11, diciembre: 11
  };
  var DAYS = { domingo: 0, dom: 0, lunes: 1, lun: 1, martes: 2, mar: 2, miercoles: 3, mie: 3,
    jueves: 4, jue: 4, viernes: 5, vie: 5, sabado: 6, sab: 6 };
  var DAY_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  var MONTH_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  var KEYWORDS = /(evento|fiesta|party|line ?up|en vivo|invitad|preventa|cover|boleter|reserva|esta noche|tonight|dj |show|concierto|celebra|halloween|noche de|lanzamiento)/i;

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function cleanLine(line) {
    return line
      .replace(/#[\p{L}\p{N}_]+/gu, "")
      .replace(/@[\w.]+/g, "")
      .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s\-–—•·|:]+|[\s\-–—•·|:]+$/g, "")
      .trim();
  }

  function titleFrom(caption) {
    var lines = String(caption || "").split(/\n+/).map(cleanLine).filter(function (l) { return l.length >= 3; });
    var t = lines[0] || "Evento";
    if (t.length > 70) t = t.slice(0, 67).replace(/\s+\S*$/, "") + "…";
    // Pasa a "Title Case" si viene todo en mayúsculas
    if (t === t.toUpperCase()) t = t.toLowerCase().replace(/(^|\s)(\p{L})/gu, function (m, a, b) { return a + b.toUpperCase(); });
    return t;
  }

  function withYear(day, month, explicitYear, ref) {
    var y = explicitYear || ref.getFullYear();
    var d = new Date(y, month, day, 21, 0, 0);
    // Si no hay año y la fecha quedó > 2 meses antes del post, es del año siguiente
    if (!explicitYear && d < new Date(ref.getTime() - 60 * 864e5)) d.setFullYear(y + 1);
    return d;
  }

  function dateFrom(caption, refDate) {
    var ref = refDate ? new Date(refDate) : new Date();
    var t = norm(caption);
    var m;
    // 31 de octubre (de 2026)
    m = t.match(/\b(\d{1,2})\s*(?:de\s+)?(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sept?(?:iembre)?|setiembre|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\b(?:\s*(?:de\s+)?(\d{4}))?/);
    if (m) return withYear(+m[1], MONTHS[m[2]], m[3] ? +m[3] : null, ref);
    // octubre 31
    m = t.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{1,2})\b/);
    if (m) return withYear(+m[2], MONTHS[m[1]], null, ref);
    // 31/10(/2026) o 31.10
    m = t.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/);
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) {
      var yy = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : null;
      return withYear(+m[1], +m[2] - 1, yy, ref);
    }
    // hoy / esta noche / mañana
    if (/\b(hoy|esta noche|tonight)\b/.test(t)) return at21(ref, 0);
    if (/\bmanana\b/.test(t)) return at21(ref, 1);
    // este viernes / sábado
    m = t.match(/\b(?:este|esta|proximo|el)\s+(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
    if (m) {
      var diff = (DAYS[m[1]] - ref.getDay() + 7) % 7;
      return at21(ref, diff);
    }
    return null;
  }

  function at21(ref, plusDays) {
    var d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + plusDays, 21, 0, 0);
    return d;
  }

  function label(d) {
    return d ? DAY_LABEL[d.getDay()] + " " + d.getDate() + " " + MONTH_LABEL[d.getMonth()] : "";
  }

  function isEvent(caption, date) {
    return !!date || KEYWORDS.test(caption || "");
  }

  /** post: { id, caption, media_type, media_url, thumbnail_url, permalink, timestamp } */
  function postToEvent(post, now) {
    now = now ? new Date(now) : new Date();
    var caption = post.caption || "";
    var date = dateFrom(caption, post.timestamp);
    if (!isEvent(caption, date)) return null;
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var image = post.media_type === "VIDEO" ? (post.thumbnail_url || null) : (post.media_url || null);
    return {
      id: "ig_" + post.id,
      title: titleFrom(caption),
      date: date ? date.toISOString() : null,
      dateLabel: date ? label(date) : "",
      caption: caption.slice(0, 600),
      image: image,
      permalink: post.permalink || null,
      postedAt: post.timestamp || null,
      isUpcoming: date ? date >= startOfToday : false
    };
  }

  function postsToEvents(posts, now) {
    var out = (posts || []).map(function (p) { return postToEvent(p, now); }).filter(Boolean);
    // próximos primero (más cercano arriba), luego pasados (más reciente arriba)
    out.sort(function (a, b) {
      if (a.isUpcoming !== b.isUpcoming) return a.isUpcoming ? -1 : 1;
      var da = new Date(a.date || a.postedAt).getTime(), db = new Date(b.date || b.postedAt).getTime();
      return a.isUpcoming ? da - db : db - da;
    });
    return out;
  }

  return { postsToEvents: postsToEvents, postToEvent: postToEvent, dateFrom: dateFrom, titleFrom: titleFrom, label: label };
});
