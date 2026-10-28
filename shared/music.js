/*
 * music.js — mini-reproductor de música oficial de YouTube por club (YouTube IFrame Player API).
 *
 * Comportamiento (dentro de los Términos de la API de YouTube):
 *  - Nada se carga al abrir la página. Con el PRIMER gesto del visitante (clic, tap o tecla; el
 *    scroll no cuenta) se carga la API y empieza la música, salvo que antes la haya silenciado o
 *    minimizado (preferencia "music.pref" = "off" en localStorage).
 *  - El video siempre está visible mientras suena: reproductor flotante de exactamente 200×200 px
 *    abajo a la izquierda, con una barrita (título, siguiente, silenciar, minimizar).
 *    Minimizar deja solo el icono y PAUSA el video (no hay audio con el reproductor oculto).
 *  - Videos con inserción desactivada (errores 100/101/150/153, y 2/5) se saltan en silencio y se
 *    recuerdan 7 días ("music.bad"). Solo si fallan TODOS, o la API no carga en 6 s, se pasa
 *    automáticamente al ambiente sintetizado de ambient.js (con aviso discreto).
 *
 * Listas: ../shared/playlists.json (fuente). La copia embebida entre PLAYLISTS:BEGIN/END se
 * regenera desde ese archivo para no depender de fetch.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var W = window, D = document;

  /* PLAYLISTS:BEGIN */
  var PLAYLISTS = {
    "medallo": [
      {
        "id": "C9nTIF0EXyU",
        "title": "Ojitos Rojos",
        "channel": "Blessd - Topic"
      },
      {
        "id": "VC0-I2w9GMA",
        "title": "HIMNO DE LA GRANDEZA (feat. ATLETICO NACIONAL)",
        "channel": "Blessd - Topic"
      },
      {
        "id": "_2x3UUxN8qg",
        "title": "Blessd - QUÉ LÍO (Lyric Video)",
        "channel": "Warner Music México"
      },
      {
        "id": "A7WtjqxON-k",
        "title": "Blessd, Cris MJ - Provocate (Lyric Video)",
        "channel": "Warner Música"
      },
      {
        "id": "og9ewQAioUk",
        "title": "BLESSD ❌ FEID - SI SABE FERXXO (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "zcw8NlHljF4",
        "title": "BLESSD ❌ OVY ON THE DRUMS - MÍRAME (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "Hn_bElcL2L4",
        "title": "BLESSD | QUIEN TV",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "ooJFygOGooA",
        "title": "CUANDO | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "sJnMF2MuQ6A",
        "title": "EL MEJOR HOMBRE DEL MUNDO | BLESSD",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "Lf566pMNCOw",
        "title": "AMISTA (VIDEO OFICIAL) | BLESSD ❌ OVY ON THE DRUMS",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "kbjUsKkUeHE",
        "title": "DIOMEDEZ | BLESSD ❌ GEEZYDEE (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "9IWsV-wndbc",
        "title": "BUENOS DIAS | BLESSD ❌ ANUEL AA ❌ KRIS R ❌ GEEZYDEE ❌ YOUNG FATTY ❌ CARABIN3 ❌ TURY",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "HBxTsyvkluY",
        "title": "MIU MIU | BLESSD ❌ KRIS R ❌ GEEZYDEE ❌ YOUNGFATTY ❌ TURY ❌ CARABIN3 (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "51N3CxZzw4k",
        "title": "BOQUISUCIO | BLESSD ❌ KRIS R ❌ GEEZYDEE ❌ YOUNGFATTY ❌ TURY ❌ CARABIN3 (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "J3-hTJvqBMw",
        "title": "40 DE DICIEMBRE | BLESSD ❌ KRIS R ❌ GEEZYDEE ❌ YOUNGFATTY ❌ TURY ❌ CARABIN3",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "fHviz2tM604",
        "title": "QUITATELOTO | BLESSD ❌ KRIS R ❌ GEEZYDEE ❌ YOUNGFATTY ❌ TURY ❌ CARABIN3 ❌ BAD MILK (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "C07CUZEvdBc",
        "title": "BLESSD | ARGENTINA (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "YkBrEfFpnBs",
        "title": "BLESSD - CONDENADO AL ÉXITO II (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "eeBQrWAVSV0",
        "title": "ULTRA COMPLICADO REMIX (VIDEO OFICIAL) | BLESSD ❌ KENNY DIE ❌ KRIS R FEAT SEBAS",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "MS4b11sLHwg",
        "title": "BLESSD ❌ KRIS R | POLOS OPUESTOS REMIX (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "Zb52MUSgVtw",
        "title": "BLESSD ❌ JAVIIELO ❌ NEUTRO SHORTY ❌ BIG SOTO | 2 PROBLEMAS (REMIX)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "4HRDFXXuMNE",
        "title": "MENTE POSITIVA | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "t0mKqvRyDn0",
        "title": "SORNERO | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "Ud-kS1f5fmA",
        "title": "YUNOGUARA | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "hMhR6T7EEfQ",
        "title": "BLESSD ❌ JUSTIN QUILES ❌ LENNY TAVAREZ | MEDALLO (OFFICIAL VIDEO)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "oGeuhfblEyQ",
        "title": "ALÓ | BLESSD ❌ FRONTI ❌ TUTU ❌ JUNH ❌ TURY (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "kLNwlamNawY",
        "title": "ELLA | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "vf2N-7AUHB4",
        "title": "BLESSD ❌ ANUEL AA | DEPORTIVO (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "rHpAXvqDzYY",
        "title": "BLESSD ❌ ANUEL AA | CAPCANA COCOA (Video Oficial)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "ssCsH8v_m-I",
        "title": "BLESSD | INSTAGRAM (OFFICIAL VIDEO)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "crBawh4FT4w",
        "title": "MERO TOTE | BLESSD ❌ DE LA ROSE (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      },
      {
        "id": "mVrD1Xud9WU",
        "title": "QUE LE DE (CHILE) | BLESSD (VIDEO OFICIAL)",
        "channel": "SIEMPRE BLESSD"
      }
    ],
    "tutaina": [
      {
        "id": "SAvVnVNSvDk",
        "title": "Ryan Castro - Mujeriego (Vídeo Oficial)",
        "channel": "Ryan Castro"
      },
      {
        "id": "WXfY0FHZ0lQ",
        "title": "TURY - KENTUCKY (Video Oficial)",
        "channel": "TURY"
      },
      {
        "id": "aTcpp8La4T0",
        "title": "Ryan Castro, Peso Pluma - QUEMA (Video Oficial)",
        "channel": "Ryan Castro"
      },
      {
        "id": "siFCXKOQoXI",
        "title": "CARABIN3 x El High - MEJOR DICHO (video oficial)",
        "channel": "CARABIN3 Official"
      },
      {
        "id": "EOkCOYrPEsU",
        "title": "Ryan Castro, Feid - Monastery (Vídeo Oficial)",
        "channel": "Ryan Castro"
      },
      {
        "id": "vWj6xR_TSl4",
        "title": "CHUCHA - TURY ❌ CARABIN3 (VIDEO OFICIAL)",
        "channel": "TURY"
      },
      {
        "id": "niVhPncWa28",
        "title": "Ryan Castro - Amor De Una Noche (Vídeo Oficial)",
        "channel": "Ryan Castro"
      },
      {
        "id": "McDuB6I7d9k",
        "title": "Olvidarme De Ti - Luis Hernández (Video Oficial)",
        "channel": "Luis Hernández Vallenato"
      },
      {
        "id": "6Y1dtxb-2lE",
        "title": "Ryan Castro, SOG, Selección Colombia - EL RITMO QUE NOS UNE (Video Oficial)",
        "channel": "Ryan Castro"
      }
    ],
    "la-logia": [
      {
        "id": "2djj_KnGwjk",
        "title": "Gasolina",
        "channel": "Daddy Yankee - Topic"
      },
      {
        "id": "O8gd0c5geVU",
        "title": "Dile",
        "channel": "Don Omar - Topic"
      },
      {
        "id": "iIVbbBxirAk",
        "title": "Rakata (Remix)",
        "channel": "Wisin & Yandel - Topic"
      },
      {
        "id": "dR6MvpVQSZA",
        "title": "Sol, Playa Y Arena",
        "channel": "Tito \"El Bambino\" - Topic"
      },
      {
        "id": "HTXWlrkLI6g",
        "title": "Yo Quiero Bailar",
        "channel": "Ivy Queen - Topic"
      },
      {
        "id": "t5VwjH4vHEQ",
        "title": "Lo Que Pasó, Pasó",
        "channel": "Daddy Yankee - Topic"
      },
      {
        "id": "uQC4GmE_Mb4",
        "title": "Pam Pam",
        "channel": "Wisin & Yandel - Topic"
      },
      {
        "id": "PnpEOtzb668",
        "title": "Pa' Que Retozen",
        "channel": "Tego Calderón - Topic"
      },
      {
        "id": "BWV4x6oBTac",
        "title": "Bandida",
        "channel": "Zion - Topic"
      },
      {
        "id": "CGIAziEuZVs",
        "title": "Ella Me Levantó",
        "channel": "Daddy Yankee - Topic"
      },
      {
        "id": "TD-_GdjgwKo",
        "title": "Sensacion Del Bloque",
        "channel": "De La Ghetto - Topic"
      },
      {
        "id": "LKf8GodiVtU",
        "title": "Hasta el Amanecer",
        "channel": "Nicky Jam - Topic"
      },
      {
        "id": "yaLC-rgVfFk",
        "title": "Ay Vamos",
        "channel": "J Balvin - Topic"
      },
      {
        "id": "QCu3mkFaLrE",
        "title": "Plan B - Si No Le Contesto [Official Audio]",
        "channel": "Plan B"
      },
      {
        "id": "ORkA465ZcyQ",
        "title": "Arcángel - Hace Mucho Tiempo (Audio Oficial)",
        "channel": "Arcangel"
      },
      {
        "id": "JR9UC9l2WW4",
        "title": "Don Omar | Pobre Diabla (Video Oficial)",
        "channel": "Don Omar"
      },
      {
        "id": "aKuivabiOns",
        "title": "Daddy Yankee - Shaky Shaky (Official Video)",
        "channel": "Daddy Yankee"
      },
      {
        "id": "DiItGE3eAyQ",
        "title": "Daddy Yankee & Snow - Con Calma (Official Video)",
        "channel": "Daddy Yankee"
      },
      {
        "id": "9LsozO41xho",
        "title": "Daddy Yankee - 2K20 Live Parte 1",
        "channel": "Daddy Yankee"
      },
      {
        "id": "adyZO3E63Gg",
        "title": "Plan B - Si No Le Contesto [Official Video]",
        "channel": "Pina Records"
      },
      {
        "id": "NtvxdO03xRo",
        "title": "Wisin & Yandel - Rakata (Visualizer)",
        "channel": "WisinYYandelVEVO"
      },
      {
        "id": "7zp1TbLFPp8",
        "title": "Don Omar - Danza Kuduro ft. Lucenzo",
        "channel": "DonOmarVEVO"
      },
      {
        "id": "Us46BxyZVQo",
        "title": "Hector & Tito - Felina (Visualizer)",
        "channel": "HectorYTitoVEVO"
      },
      {
        "id": "KI1yOlb1uWA",
        "title": "Tito \"El Bambino\" El Patrón - El Amor (Official video)",
        "channel": "Tito \"El Bambino\""
      },
      {
        "id": "MEPlwur1zjs",
        "title": "Daddy Yankee - MÉTELE AL PERREO (Official Video)",
        "channel": "Daddy Yankee"
      },
      {
        "id": "NC1kxtnhRgU",
        "title": "Wisin & Yandel - Algo Me Gusta De Ti (Visualizer)",
        "channel": "WisinYYandelVEVO"
      },
      {
        "id": "N-b_Xb3l6Dk",
        "title": "Tito \"El Bambino\", Ñengo Flow, Dj Nelson - Flow Callejero (Official Video)",
        "channel": "Tito \"El Bambino\""
      },
      {
        "id": "fH4r_pZyZVA",
        "title": "DON OMAR, WISIN, YANDEL - SANDUNGA",
        "channel": "Don Omar"
      },
      {
        "id": "t7gsVuW8AtY",
        "title": "Daddy Yankee - Rumbatón (Official Video)",
        "channel": "Daddy Yankee"
      },
      {
        "id": "55sOQtVd2uA",
        "title": "Daddy Yankee x El Alfa x Lil Jon - Bombón (Official Video)",
        "channel": "Daddy Yankee"
      }
    ],
    "cantina-70": [
      {
        "id": "X22rPmiqXMo",
        "title": "Jessi Uribe - Si Me Ven Llorando (Video Oficial)",
        "channel": "Jessi Uribe"
      },
      {
        "id": "dvShydwPUAg",
        "title": "Jhonny Rivera - Amor y Despecho (Video Oficial)",
        "channel": "Jhonny Rivera"
      },
      {
        "id": "7UO0O6ADu4Q",
        "title": "BANDA MS - EL COLOR DE TUS OJOS (VIDEO OFICIAL)",
        "channel": "Lizos Music"
      },
      {
        "id": "XUouQi4b5Sc",
        "title": "Jessi Uribe - Mi Debilidad (Video Oficial)",
        "channel": "Jessi Uribe"
      },
      {
        "id": "xYAGnnBdOQw",
        "title": "Galy Galiano, Jessi Uribe - La Cita (Video Oficial)",
        "channel": "Jessi Uribe"
      },
      {
        "id": "9wveiphYgUk",
        "title": "Jhonny Rivera - Me Tragaba Tus Mentiras (Vídeo Oficial)",
        "channel": "Jhonny Rivera"
      },
      {
        "id": "nM3eGstKrWU",
        "title": "Jessi Uribe - De Malas (Video Oficial)",
        "channel": "Jessi Uribe"
      },
      {
        "id": "zzkkUpTC-lM",
        "title": "Tengo Que Olvidar (Video Oficial) - Jessi Uribe & Franko | Aquellos Clásicos",
        "channel": "Jessi Uribe"
      },
      {
        "id": "fqwEKifuEUQ",
        "title": "Jessi Uribe, Anderson Raura - No Es Mi Culpa Remix (Video Oficial)",
        "channel": "Jessi Uribe"
      }
    ]
  };
  /* PLAYLISTS:END */

  /* estilo de cada página: solo sus tokens de :root */
  var THEMES = {
    tutaina: { bg: "var(--surface)", plate: "var(--plate)", ink: "var(--ink)", muted: "var(--muted)", rule: "var(--rule)", accent: "var(--accent)", focus: "var(--accent)", font: "var(--text)", radius: "0" },
    medallo: { bg: "var(--surface)", plate: "var(--bg)", ink: "var(--ink)", muted: "var(--muted)", rule: "var(--rule)", accent: "var(--ink)", focus: "var(--muted)", font: "var(--text)", radius: "0" },
    "la-logia": { bg: "var(--crypt)", plate: "var(--void)", ink: "var(--bone)", muted: "var(--ash)", rule: "var(--rule)", accent: "var(--gold)", focus: "var(--gold)", font: "var(--sans)", radius: "0" },
    "cantina-70": { bg: "var(--onix)", plate: "var(--negro)", ink: "var(--marfil)", muted: "var(--humo)", rule: "var(--linea)", accent: "var(--oro)", focus: "var(--oro-hi)", font: "var(--text)", radius: "2px" }
  };
  var TIMEOUT = 6000, VOLUME = 35, SIZE = 200;
  var K_PREF = "music.pref", K_BAD = "music.bad", K_LAST = "music.last.", BAD_TTL = 7 * 864e5;
  var SKIP = { 2: 1, 5: 1, 100: 1, 101: 1, 150: 1, 153: 1 };
  var YT_HOST = "https://www.youtube-nocookie.com";

  var I = {
    next: '<path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/>',
    vol: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2"/>',
    min: '<path d="M5 19h14" fill="none" stroke="currentColor" stroke-width="2.4"/>'
  };
  function svg(n, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 20) + '" height="' + (s || 20) + '" fill="currentColor" aria-hidden="true" focusable="false">' + I[n] + "</svg>"; }

  var S = {
    club: null, all: [], list: [], i: 0, btn: null, panel: null, el: {}, note: null,
    mode: "idle",            /* idle | yt | synth */
    open: false, ready: false, loading: false, failed: false, playing: false, muted: false,
    synth: false, started: false, timer: 0, tries: 0, want: false
  };

  /* ---------- memoria (localStorage, siempre en try/catch) ---------- */
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function bad() {
    var o = {}; try { o = JSON.parse(get(K_BAD) || "{}") || {}; } catch (e) { o = {}; }
    var now = Date.now(), out = {};
    for (var id in o) if (now - o[id] < BAD_TTL) out[id] = o[id];
    return out;
  }
  function markBad(id) { var o = bad(); o[id] = Date.now(); set(K_BAD, JSON.stringify(o)); }
  function prefOff() { return get(K_PREF) === "off"; }
  function pref(on) { set(K_PREF, on ? "on" : "off"); }

  /* ---------- CSS (inyectado; colores = tokens de la página) ---------- */
  function css() {
    var t = THEMES[S.club] || THEMES.tutaina, v = "";
    for (var k in t) v += "--mu-" + k + ":" + t[k] + ";";
    var c = [
      ".mu{" + v + "position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(max(16px,env(safe-area-inset-bottom,0px)) + var(--mu-bottom,0px));width:" + (SIZE + 2) + "px;display:flex;flex-direction:column;background:var(--mu-bg);color:var(--mu-ink);border:1px solid var(--mu-rule);border-radius:var(--mu-radius);box-shadow:0 18px 40px -14px rgb(0 0 0 / .7);font:400 13px/1.3 var(--mu-font);box-sizing:border-box;overflow:hidden;-webkit-tap-highlight-color:transparent}",
      ".mu[hidden]{display:none}",
      ".mu *,.mu *::before,.mu *::after{box-sizing:border-box}",
      ".mu-vid{position:relative;width:" + SIZE + "px;height:" + SIZE + "px;flex:none;background:var(--mu-plate)}",
      ".mu-vid iframe,.mu-vid>div{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}",
      ".mu-ti{margin:0;padding:8px 10px 0;color:var(--mu-ink);font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;min-height:calc(2.6em + 8px)}",
      ".mu-bar{display:flex;align-items:center;min-height:44px}",
      ".mu-ch{flex:1;min-width:0;padding:0 2px 0 10px;color:var(--mu-muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".mu-b{display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;min-height:44px;margin:0;padding:0;background:transparent;border:0;border-radius:var(--mu-radius);color:var(--mu-muted);cursor:pointer;touch-action:manipulation;transition:color .16s ease,transform .16s ease}",
      ".mu-b:active{transform:scale(.94)}",
      ".mu-b:focus-visible{outline:2px solid var(--mu-focus);outline-offset:-3px;color:var(--mu-ink)}",
      ".mu-b[aria-pressed=true]{color:var(--mu-accent)}",
      ".mu-x{width:36px}",
      ".mu-note{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(max(16px,env(safe-area-inset-bottom,0px)) + var(--mu-bottom,0px) + 52px);max-width:min(280px,calc(100vw - 32px));margin:0;padding:8px 10px;background:var(--mu-bg);color:var(--mu-muted);border:1px solid var(--mu-rule);border-radius:var(--mu-radius);font:400 13px/1.35 var(--mu-font);" + v + "}",
      ".mu-note[hidden]{display:none}",
      "@media(hover:hover) and (pointer:fine){.mu-b:hover{color:var(--mu-ink)}}",
      ".amb[data-playing=true]{color:var(--mu-ink," + t.ink + ")}",
      ".amb[data-playing=true] .amb-eq{color:" + t.accent + "}",
      ".amb[data-playing=true] .amb-eq i{animation:amb-eq .9s ease-in-out infinite alternate}",
      ".amb[data-playing=true] .amb-eq i:nth-child(2){animation-duration:.66s;animation-delay:-.3s}",
      ".amb[data-playing=true] .amb-eq i:nth-child(3){animation-duration:1.1s;animation-delay:-.5s}",
      ".amb[data-playing=true] .amb-eq i:nth-child(4){animation-duration:.78s;animation-delay:-.15s}",
      ".amb[data-open=true]{display:none!important}",
      "@media(prefers-reduced-motion:reduce){.mu-b{transition:none}.mu-b:active{transform:none}.amb[data-playing=true] .amb-eq i{animation:none!important}}"
    ].join("\n");
    var st = D.createElement("style"); st.id = "mu-css"; st.textContent = c;
    D.head.appendChild(st);
  }

  /* ---------- DOM ---------- */
  function build() {
    var p = D.createElement("div");
    p.className = "mu"; p.id = "mu-panel"; p.hidden = true;
    p.setAttribute("role", "region"); p.setAttribute("aria-label", "Reproductor de música");
    p.innerHTML =
      '<div class="mu-vid"><div id="mu-yt"></div></div>' +
      '<p class="mu-ti"></p><div class="mu-bar">' +
        '<span class="mu-ch"></span>' +
        '<button class="mu-b mu-next" type="button" aria-label="Siguiente tema">' + svg("next", 18) + "</button>" +
        '<button class="mu-b mu-mute" type="button" aria-pressed="false" aria-label="Silenciar">' + svg("vol", 20) + "</button>" +
        '<button class="mu-b mu-x" type="button" aria-label="Minimizar reproductor (pausa la música)">' + svg("min", 18) + "</button>" +
      "</div>";
    D.body.appendChild(p);
    var n = D.createElement("p"); n.className = "mu-note"; n.hidden = true;
    n.setAttribute("role", "status"); n.setAttribute("aria-live", "polite");
    D.body.appendChild(n);
    S.panel = p; S.note = n;
    var q = function (s) { return p.querySelector(s); };
    S.el = { ti: q(".mu-ti"), ch: q(".mu-ch"), next: q(".mu-next"), mute: q(".mu-mute"), x: q(".mu-x") };
    S.el.next.addEventListener("click", function () { next(true); });
    S.el.mute.addEventListener("click", toggleMute);
    S.el.x.addEventListener("click", function () { collapse(true); });
    p.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Esc") { e.stopPropagation(); collapse(true); } });
  }

  /* ---------- estado → UI ---------- */
  function render() {
    var t = S.list[S.i] || {}, e = S.el;
    if (e.ti) {
      e.ti.textContent = t.title || ""; e.ch.textContent = t.channel || "";
      e.ti.title = t.title || "";
      e.mute.innerHTML = svg(S.muted ? "mute" : "vol", 20);
      e.mute.setAttribute("aria-pressed", S.muted ? "true" : "false");
      e.mute.setAttribute("aria-label", S.muted ? "Activar sonido" : "Silenciar");
    }
    var b = S.btn; if (!b) return;
    var on = S.mode === "synth" ? S.synth : (S.open && S.playing && !S.muted);
    b.setAttribute("data-open", S.open ? "true" : "false");
    b.setAttribute("data-playing", on ? "true" : "false");
    b.setAttribute("aria-expanded", S.open ? "true" : "false");
    b.setAttribute("aria-label", S.mode === "synth"
      ? (S.synth ? "Silenciar música ambiente" : "Activar música ambiente")
      : "Abrir reproductor de música");
  }
  var noteT = 0;
  function note(msg) {
    if (!S.note) return;
    S.note.textContent = msg; S.note.hidden = false; place();
    clearTimeout(noteT); noteT = setTimeout(function () { S.note.hidden = true; }, 6000);
  }

  /* ---------- YouTube ---------- */
  function loadAPI() {
    if (S.loading || S.ready || S.failed) return;
    S.loading = true;
    S.timer = setTimeout(function () { if (!S.ready) toSynth("YouTube no está disponible aquí: suena el ambiente del club."); }, TIMEOUT);
    if (W.YT && W.YT.Player) { makePlayer(); return; }
    var prev = W.onYouTubeIframeAPIReady;
    W.onYouTubeIframeAPIReady = function () { if (typeof prev === "function") { try { prev(); } catch (e) {} } if (!S.failed) makePlayer(); };
    if (!D.getElementById("yt-iframe-api")) {
      var s = D.createElement("script");
      s.id = "yt-iframe-api"; s.src = "https://www.youtube.com/iframe_api"; s.async = true;
      s.onerror = function () { toSynth("YouTube no está disponible aquí: suena el ambiente del club."); };
      D.head.appendChild(s);
    }
  }
  function makePlayer() {
    if (S.player || S.failed) return;
    try {
      S.player = new W.YT.Player("mu-yt", {
        host: YT_HOST, width: SIZE, height: SIZE, videoId: S.list[S.i].id,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin && location.origin !== "null" ? location.origin : undefined },
        events: { onReady: onReady, onStateChange: onState, onError: onErr }
      });
    } catch (e) { toSynth("YouTube no está disponible aquí: suena el ambiente del club."); }
  }
  function frameTitle() {
    try { var f = S.player.getIframe && S.player.getIframe(); if (f) f.setAttribute("title", "Video de YouTube: " + (S.list[S.i] || {}).title); } catch (e) {}
  }
  function onReady() {
    if (S.failed) return;
    S.ready = true; S.loading = false; clearTimeout(S.timer);
    try { S.player.setVolume(VOLUME); if (S.muted) S.player.mute(); else S.player.unMute(); } catch (e) {}
    frameTitle();
    if (S.open && S.want) { try { S.player.playVideo(); } catch (e) {} }
    render();
  }
  function onState(e) {
    var st = e.data; /* -1 sin iniciar, 0 fin, 1 sonando, 2 pausa, 3 cargando, 5 en cola */
    if (st === 1) { S.tries = 0; if (!S.open) { try { S.player.pauseVideo(); } catch (x) {} } }
    S.playing = st === 1 || st === 3;
    if (st === 0) { next(true); return; }
    frameTitle(); render();
  }
  function onErr(e) {
    var code = e && e.data, cur = S.list[S.i];
    if (cur && SKIP[code]) markBad(cur.id);           /* no se puede insertar: no lo volvemos a intentar en 7 días */
    if (cur) { S.list.splice(S.i, 1); if (S.i >= S.list.length) S.i = 0; }
    if (!S.list.length) { toSynth("Ningún video se puede reproducir aquí: suena el ambiente del club."); return; }
    if (++S.tries > 40) { toSynth("YouTube no responde: suena el ambiente del club."); return; }
    load(S.open && S.want);                            /* salto en silencio */
  }
  function load(play) {
    var t = S.list[S.i]; if (!t) return;
    set(K_LAST + S.club, t.id); render();
    if (!S.ready) return;
    try { if (play) S.player.loadVideoById(t.id); else S.player.cueVideoById(t.id); } catch (e) {}
  }
  function next(play) { if (S.mode !== "yt" || !S.list.length) return; S.i = (S.i + 1) % S.list.length; load(play !== false && S.open); }
  function toggleMute() {
    S.muted = !S.muted; pref(!S.muted);
    try { if (S.ready) { if (S.muted) S.player.mute(); else { S.player.unMute(); S.player.setVolume(VOLUME); } } } catch (e) {}
    render();
  }

  /* ---------- modos ---------- */
  function synthOK() { return !!(W.Ambient && W.Ambient.supported); }
  function toSynth(msg) {
    if (S.failed) return;
    S.failed = true; S.loading = false; S.ready = false; clearTimeout(S.timer);
    var hadFocus = S.panel && S.panel.contains(D.activeElement);
    try { if (S.player && S.player.destroy) S.player.destroy(); } catch (e) {}
    S.player = null; S.playing = false;
    S.mode = "synth"; S.open = false; if (S.panel) S.panel.hidden = true;
    if (synthOK() && S.want && !prefOff()) W.Ambient.start();
    render();
    note(synthOK() ? msg : "YouTube no está disponible aquí.");
    if (hadFocus && S.btn) focus(S.btn);
  }
  function expand(play) {
    if (S.mode === "synth") return;
    S.mode = "yt"; S.open = true; S.want = !!play; S.panel.hidden = false; place();
    if (play && S.muted) { S.muted = false; try { if (S.ready) S.player.unMute(); } catch (e) {} }
    if (S.ready) { if (play) { try { S.player.playVideo(); } catch (e) {} } }
    else loadAPI();
    render();
  }
  function collapse(returnFocus) {
    if (!S.open) return;
    S.open = false; S.want = false; pref(false);
    try { if (S.player && S.ready) S.player.pauseVideo(); } catch (e) {}   /* oculto ⇒ en pausa */
    S.playing = false; S.panel.hidden = true; render();
    if (returnFocus && S.btn) focus(S.btn);
  }
  function focus(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }

  /* arranque: con el primer gesto o con el icono */
  function start(fromIcon) {
    S.started = true; unlisten();
    if (!S.list.length) S.failed = true;
    if (S.failed || S.mode === "synth") {
      S.mode = "synth"; S.want = true;
      if (synthOK()) { if (fromIcon) { W.Ambient.toggle(); pref(W.Ambient.state().playing); } else W.Ambient.start(); }
      render(); return;
    }
    pref(true); expand(true);
  }
  function onIcon() {
    if (!S.started) { start(true); return; }
    if (S.mode === "synth") { if (synthOK()) { W.Ambient.toggle(); pref(W.Ambient.state().playing); } render(); return; }
    pref(true); expand(true);
    focus(S.el.next);
  }
  var IGN = { Tab: 1, Shift: 1, Control: 1, Alt: 1, Meta: 1, Escape: 1, Esc: 1, CapsLock: 1, ContextMenu: 1 };
  function onFirst(e) {
    if (S.started) return;
    if (e.type === "keydown" && (IGN[e.key] || e.ctrlKey || e.metaKey || e.altKey)) return;
    var tg = e.target;
    if (tg && tg.closest && (tg.closest("[data-ambient]") || tg.closest(".mu"))) return; /* lo atiende el icono */
    start(false);
  }
  function listen() { D.addEventListener("click", onFirst, true); D.addEventListener("keydown", onFirst, true); }
  function unlisten() { D.removeEventListener("click", onFirst, true); D.removeEventListener("keydown", onFirst, true); }

  /* el reproductor se apoya encima de cualquier barra fija de reserva (medallo móvil) */
  var BARS = ".mbar, [data-reserve-bar]";
  function place() {
    var off = 0, ih = W.innerHeight;
    Array.prototype.forEach.call(D.querySelectorAll(BARS), function (b) {
      var cs = W.getComputedStyle(b); if (cs.display === "none" || cs.visibility === "hidden" || cs.position !== "fixed") return;
      var r = b.getBoundingClientRect(); if (r.height && r.top < ih - 1 && r.bottom > ih - 2) off = Math.max(off, ih - r.top);
    });
    var v = Math.round(off) + "px";
    if (S.panel) S.panel.style.setProperty("--mu-bottom", v);
    if (S.note) S.note.style.setProperty("--mu-bottom", v);
  }
  var raf = 0;
  function queuePlace() { if (!raf) raf = (W.requestAnimationFrame || setTimeout)(function () { raf = 0; place(); }); }

  /* ---------- init ---------- */
  function init() {
    var b = D.querySelector("[data-ambient][data-music]");
    if (!b) return;
    S.club = b.getAttribute("data-ambient");
    S.all = (PLAYLISTS[S.club] || []).slice();
    var bd = bad();
    S.list = S.all.filter(function (t) { return !bd[t.id]; });
    if (!S.list.length && S.all.length) S.failed = true;     /* todos marcados: directo al ambiente */
    var last = get(K_LAST + S.club);
    for (var k = 0; k < S.list.length; k++) if (S.list[k].id === last) S.i = k;
    S.btn = b;
    css(); build();
    b.hidden = false;
    b.removeAttribute("aria-pressed");
    b.setAttribute("aria-controls", "mu-panel");
    var lbl = b.querySelector(".amb-lbl"); if (lbl) lbl.textContent = "Música";
    var z = W.getComputedStyle(b).zIndex; if (z && z !== "auto") { S.panel.style.zIndex = z; S.note.style.zIndex = z; }
    b.addEventListener("click", onIcon);
    D.addEventListener("ambient:state", function (e) { S.synth = !!(e.detail && e.detail.playing); render(); });
    D.addEventListener("keydown", function (e) { if ((e.key === "Escape" || e.key === "Esc") && S.open && S.panel.contains(D.activeElement)) collapse(true); });
    W.addEventListener("scroll", queuePlace, { passive: true });
    W.addEventListener("resize", queuePlace);
    if (!prefOff()) listen();
    render();
  }

  W.Music = {
    state: function () { return { club: S.club, mode: S.mode, open: S.open, ready: S.ready, failed: S.failed, playing: S.playing, muted: S.muted, synth: S.synth, started: S.started, track: S.list[S.i], left: S.list.length, total: S.all.length }; }
  };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", init); else init();
})();
