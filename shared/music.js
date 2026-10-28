/*
 * music.js — música de cada club en una píldora flotante (sin video).
 *
 *  1. Si ../shared/audio/<club>/playlist.json trae pistas ([{file,title,artist}]), suenan esos MP3
 *     locales en un <audio> oculto (preload="none"): orden aleatorio, fade-in de 2 s, volumen 0.35,
 *     paso automático a la siguiente y pausa al ocultar la pestaña.
 *  2. Si está vacío, no existe o el fetch falla (p. ej. file://), suena el ambiente sintetizado
 *     de ambient.js.
 *
 *  Arranca con el PRIMER clic/tap/tecla en la página (el scroll no cuenta), salvo que el visitante
 *  la haya silenciado antes (localStorage "music.pref" = "off"). Antes de sonar, la píldora es el
 *  botón "♪ Música" de la página ([data-ambient][data-music]); mientras suena muestra ecualizador,
 *  título, siguiente (solo con pistas locales) y silenciar. Se aparta (fundido) si queda encima de
 *  un enlace o botón, y se apoya encima de barras fijas de reserva.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var W = window, D = document;
  var SCRIPT = (D.currentScript && D.currentScript.src) || "";

  var THEMES = {
    tutaina: { bg: "var(--bg)", ink: "var(--ink)", muted: "var(--muted)", rule: "var(--rule)", accent: "var(--accent)", focus: "var(--accent)", font: "var(--text)", radius: "0" },
    "cantina-70": { bg: "var(--onix)", ink: "var(--marfil)", muted: "var(--humo)", rule: "var(--linea)", accent: "var(--oro)", focus: "var(--oro-hi)", font: "var(--text)", radius: "2px" }
  };
  var NAMES = { tutaina: "Tutaina", "cantina-70": "Cantina 70" };
  var K_PREF = "music.pref", A_VOL = 0.35, A_FADE = 2000;

  var I = {
    next: '<path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/>',
    vol: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2"/>'
  };
  function svg(n, s) { return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="currentColor" aria-hidden="true" focusable="false">' + I[n] + "</svg>"; }

  var S = {
    club: null, btn: null, pill: null, p: {},
    src: "synth",          /* audio | synth */
    list: [], i: 0, audio: null, playing: false, want: false, aErr: 0, fadeT: 0, visPaused: false,
    synth: false, started: false, ready: false
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function prefOff() { return get(K_PREF) === "off"; }
  function pref(on) { set(K_PREF, on ? "on" : "off"); }
  function synthOK() { return !!(W.Ambient && W.Ambient.supported); }

  /* ---------- CSS (tokens de la página) ---------- */
  function css() {
    var t = THEMES[S.club] || THEMES.tutaina, v = "";
    for (var k in t) v += "--mu-" + k + ":" + t[k] + ";";
    var c = [
      ".mu-pill{" + v + "position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(max(16px,env(safe-area-inset-bottom,0px)) + var(--mu-bottom,0px));display:flex;align-items:center;height:44px;max-width:min(340px,calc(100vw - 32px));background:var(--mu-bg);color:var(--mu-ink);border:1px solid var(--mu-rule);border-radius:var(--mu-radius);font:500 14px/1 var(--mu-font);box-shadow:0 10px 28px -12px rgb(0 0 0 / .65);transition:opacity .2s ease;box-sizing:border-box}",
      ".mu-pill *{box-sizing:border-box}",
      ".mu-pill[hidden]{display:none}",
      ".mu-pill.away{opacity:0;pointer-events:none}.mu-pill.away:focus-within{opacity:1;pointer-events:auto}",
      ".mu-pt{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto;padding:0 6px 0 14px}",
      ".mu-pt span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".mu-pill .amb-eq{display:inline-flex;align-items:flex-end;gap:2px;width:14px;height:14px;flex:none;color:var(--mu-accent)}",
      ".mu-pill .amb-eq i{flex:1;height:100%;background:currentColor;transform-origin:50% 100%;transform:scaleY(.35);animation:mu-eq .9s ease-in-out infinite alternate}",
      ".mu-pill .amb-eq i:nth-child(2){animation-duration:.66s;animation-delay:-.3s}.mu-pill .amb-eq i:nth-child(3){animation-duration:1.1s;animation-delay:-.5s}.mu-pill .amb-eq i:nth-child(4){animation-duration:.78s;animation-delay:-.15s}",
      ".mu-pill[data-muted=true] .amb-eq i{animation:none}",
      "@keyframes mu-eq{0%{transform:scaleY(.2)}100%{transform:scaleY(1)}}",
      ".mu-pb{display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;height:42px;margin:0;padding:0;background:transparent;border:0;border-radius:var(--mu-radius);color:var(--mu-muted);cursor:pointer;touch-action:manipulation}",
      ".mu-pb[hidden]{display:none}",
      ".mu-pb:focus-visible{outline:2px solid var(--mu-focus);outline-offset:-3px;color:var(--mu-ink)}",
      "@media(hover:hover) and (pointer:fine){.mu-pb:hover{color:var(--mu-ink)}}",
      ".amb[data-music] .amb-lbl{display:inline!important}",
      ".amb[data-music] .amb-lbl::before{content:\"\\266A\\00a0\"}",
      "@media(max-width:899px){.amb[data-music]{width:auto!important;padding:0 14px!important}}",
      ".amb[data-pill=true]{display:none!important}",
      "@media(prefers-reduced-motion:reduce){.mu-pill{transition:none}.mu-pill .amb-eq i{animation:none!important}}"
    ].join("\n");
    var st = D.createElement("style"); st.id = "mu-css"; st.textContent = c;
    D.head.appendChild(st);
  }

  function buildPill() {
    var p = D.createElement("div");
    p.className = "mu-pill"; p.hidden = true;
    p.setAttribute("role", "region"); p.setAttribute("aria-label", "Música sonando");
    p.innerHTML =
      '<div class="mu-pt"><span class="amb-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mu-pn"></span></div>' +
      '<button class="mu-pb mu-pnext" type="button" aria-label="Siguiente pista">' + svg("next", 18) + "</button>" +
      '<button class="mu-pb mu-pmute" type="button" aria-label="Silenciar">' + svg("vol", 20) + "</button>";
    D.body.appendChild(p);
    S.pill = p;
    S.p = { name: p.querySelector(".mu-pn"), next: p.querySelector(".mu-pnext"), mute: p.querySelector(".mu-pmute") };
    S.p.next.addEventListener("click", next);
    S.p.mute.addEventListener("click", stop);
  }

  /* ---------- estado → UI ---------- */
  function sounding() { return S.src === "audio" ? S.playing : S.synth; }
  function render() {
    var on = sounding(), t = S.list[S.i];
    if (S.pill) {
      S.pill.hidden = !on;
      S.p.name.textContent = S.src === "audio" && t ? t.title + (t.artist ? " · " + t.artist : "") : "Ambiente " + (NAMES[S.club] || "");
      S.p.next.hidden = S.src !== "audio" || S.list.length < 2;
      S.p.mute.innerHTML = svg("vol", 20);
      S.p.mute.setAttribute("aria-label", "Silenciar música");
    }
    if (S.btn) {
      S.btn.setAttribute("data-pill", on ? "true" : "false");
      S.btn.setAttribute("aria-label", "Activar música");
    }
    if (on) { queueDodge(); if (!dodgeI) dodgeI = setInterval(queueDodge, 700); }
    else if (dodgeI) { clearInterval(dodgeI); dodgeI = 0; }
  }

  /* ---------- reproducción (siempre tras un gesto) ---------- */
  function start() {
    S.started = true; unlisten(); pref(true); S.want = true;
    if (S.src === "audio") aPlay(); else if (synthOK() && !S.synth) W.Ambient.start();
    render();
  }
  function stop() {                                   /* silenciar = parar y recordar la preferencia */
    S.want = false; pref(false);
    if (S.src === "audio") { clearInterval(S.fadeT); if (S.audio) S.audio.pause(); }
    else if (synthOK()) W.Ambient.stop();
    render();
    if (S.btn) { try { S.btn.focus({ preventScroll: true }); } catch (e) {} }
  }
  function next() { if (S.src !== "audio" || !S.list.length) return; S.i = (S.i + 1) % S.list.length; aPlay(); }

  /* ---------- MP3 locales ---------- */
  function audioBase() { try { return new URL("audio/" + S.club + "/", SCRIPT || location.href).href; } catch (e) { return null; } }
  var waiters = [];
  function whenReady(fn) { if (S.ready) fn(); else waiters.push(fn); }
  function ready() { if (S.ready) return; S.ready = true; var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} }); }
  function checkLocal() {
    var base = audioBase();
    if (!base || !W.fetch) { ready(); return; }
    var guard = setTimeout(ready, 2500);              /* red lenta: no bloquear el arranque */
    fetch(base + "playlist.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (arr) {
        if (S.started) return;                        /* ya sonaba el ambiente */
        var tr = (Array.isArray(arr) ? arr : []).filter(function (t) { return t && typeof t.file === "string" && t.file; }).map(function (t) {
          return { url: new URL(t.file, base).href, title: String(t.title || t.file), artist: String(t.artist || "") };
        });
        if (tr.length) useAudio(tr);
      })
      .catch(function () {})
      .then(function () { clearTimeout(guard); ready(); });
  }
  function useAudio(tr) {
    for (var j = tr.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), x = tr[j]; tr[j] = tr[r]; tr[r] = x; }
    S.src = "audio"; S.list = tr; S.i = 0;
    var a = D.createElement("audio");
    a.preload = "none"; a.hidden = true; a.setAttribute("aria-hidden", "true");
    a.addEventListener("playing", function () { S.aErr = 0; S.playing = true; render(); });
    a.addEventListener("pause", function () { S.playing = false; render(); });
    a.addEventListener("ended", next);
    a.addEventListener("error", function () {
      if (++S.aErr >= S.list.length) { a.pause(); S.src = "synth"; S.playing = false; if (S.want && synthOK()) W.Ambient.start(); render(); return; }
      next();
    });
    D.body.appendChild(a); S.audio = a;
    D.addEventListener("visibilitychange", function () {
      if (S.src !== "audio") return;
      if (D.hidden) { if (S.playing) { S.visPaused = true; a.pause(); } }
      else if (S.visPaused) { S.visPaused = false; if (S.want) aPlay(); }
    });
  }
  function aPlay() {
    var a = S.audio, t = S.list[S.i]; if (!a || !t) return;
    S.want = true;
    if (a.getAttribute("src") !== t.url) a.setAttribute("src", t.url);
    clearInterval(S.fadeT); try { a.volume = 0; } catch (e) {}
    var p = a.play(), t0 = Date.now();
    S.fadeT = setInterval(function () {               /* fade-in de 2 s en escalones */
      var k = Math.min(1, (Date.now() - t0) / A_FADE);
      try { a.volume = A_VOL * k; } catch (e) {}
      if (k >= 1) clearInterval(S.fadeT);
    }, 50);
    if (p && p.catch) p.catch(function () { S.playing = false; render(); });
    render();
  }

  /* ---------- primer gesto ---------- */
  var IGN = { Tab: 1, Shift: 1, Control: 1, Alt: 1, Meta: 1, Escape: 1, Esc: 1, CapsLock: 1, ContextMenu: 1 };
  function onFirst(e) {
    if (S.started) return;
    if (e.type === "keydown" && (IGN[e.key] || e.ctrlKey || e.metaKey || e.altKey)) return;
    var tg = e.target;
    if (tg && tg.closest && (tg.closest("[data-ambient]") || tg.closest(".mu-pill"))) return;
    whenReady(start);
  }
  function listen() { D.addEventListener("click", onFirst, true); D.addEventListener("keydown", onFirst, true); }
  function unlisten() { D.removeEventListener("click", onFirst, true); D.removeEventListener("keydown", onFirst, true); }

  /* ---------- píldora: sobre barras de reserva y apartándose de enlaces/botones ---------- */
  var BARS = ".mbar, [data-reserve-bar]";
  var AV = "a[href],button,summary,input,select,textarea,label,[role=button],[tabindex]:not([tabindex='-1'])";
  function place() {
    if (!S.pill) return;
    var off = 0, ih = W.innerHeight;
    Array.prototype.forEach.call(D.querySelectorAll(BARS), function (b) {
      var cs = W.getComputedStyle(b); if (cs.display === "none" || cs.visibility === "hidden" || cs.position !== "fixed") return;
      var r = b.getBoundingClientRect(); if (r.height && r.top < ih - 1 && r.bottom > ih - 2) off = Math.max(off, ih - r.top);
    });
    S.pill.style.setProperty("--mu-bottom", Math.round(off) + "px");
  }
  var showT = 0, dodgeI = 0, raf = 0;
  function dodge() {
    var p = S.pill; if (!p || p.hidden || !D.elementsFromPoint) return;
    var r = p.getBoundingClientRect(), hit = false; if (!r.width) return;
    var all = D.querySelectorAll(AV);
    for (var i = 0; i < all.length && !hit; i++) {
      var el = all[i]; if (p.contains(el)) continue;
      var e = el.getBoundingClientRect();
      if (!e.width || !e.height || e.left >= r.right || e.right <= r.left || e.top >= r.bottom || e.bottom <= r.top) continue;
      var x0 = Math.max(e.left, r.left) + 2, x1 = Math.min(e.right, r.right) - 2, y0 = Math.max(e.top, r.top) + 2, y1 = Math.min(e.bottom, r.bottom) - 2;
      var pts = [[(x0 + x1) / 2, (y0 + y1) / 2], [x0, y0], [x1, y0], [x0, y1], [x1, y1]];
      for (var q = 0; q < pts.length && !hit; q++) {
        var st = D.elementsFromPoint(pts[q][0], pts[q][1]);
        for (var j = 0; j < st.length; j++) {
          var t = st[j]; if (t === p || p.contains(t)) continue;
          if (t === el || el.contains(t)) hit = true;
          break;
        }
      }
    }
    if (hit) { clearTimeout(showT); showT = 0; p.classList.add("away"); }
    else if (p.classList.contains("away") && !showT) showT = setTimeout(function () { showT = 0; p.classList.remove("away"); }, 160);
  }
  function queueDodge() { if (!raf) raf = (W.requestAnimationFrame || setTimeout)(function () { raf = 0; place(); dodge(); }); }

  /* ---------- init ---------- */
  function init() {
    var b = D.querySelector("[data-ambient][data-music]");
    if (!b) return;
    S.club = b.getAttribute("data-ambient");
    S.btn = b;
    css(); buildPill();
    b.hidden = false;
    b.removeAttribute("aria-pressed");
    b.removeAttribute("aria-expanded");
    var lbl = b.querySelector(".amb-lbl"); if (lbl) lbl.textContent = "Música";
    var z = W.getComputedStyle(b).zIndex; if (z && z !== "auto") S.pill.style.zIndex = z;
    b.addEventListener("click", function () { whenReady(start); });
    D.addEventListener("ambient:state", function (e) { S.synth = !!(e.detail && e.detail.playing); render(); });
    W.addEventListener("scroll", queueDodge, { passive: true });
    W.addEventListener("resize", queueDodge);
    if (!prefOff()) listen();
    render();
    checkLocal();
  }

  W.Music = {
    state: function () { return { club: S.club, src: S.src, playing: S.src === "audio" ? S.playing : S.synth, started: S.started, track: S.list[S.i] || null, tracks: S.list.length, vol: S.audio ? S.audio.volume : null }; }
  };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", init); else init();
})();
