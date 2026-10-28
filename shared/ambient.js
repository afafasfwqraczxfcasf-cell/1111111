/*
 * ambient.js — música ambiente original, sintetizada en el navegador (Web Audio API).
 * Sin archivos de audio, sin librerías, sin samples. UMD → window.Ambient.
 *
 * Uso en la página:
 *   <button class="amb" type="button" data-ambient="tutaina" aria-pressed="false"
 *           aria-label="Activar música ambiente">…</button>
 *   <script src="../shared/ambient.js" defer></script>
 *
 * Nunca hay autoplay: suena solo tras un gesto. Si el usuario lo había activado
 * (localStorage), el botón queda en estado "ready" y arranca en el primer clic/tap.
 *
 * Con data-music en el botón, ../shared/music.js toma el botón (reproductor de YouTube) y este
 * motor queda como respaldo: no se enlaza al clic y avisa su estado con el evento "ambient:state".
 *
 * API: Ambient.start(), Ambient.stop(), Ambient.toggle(), Ambient.state(), Ambient.supported,
 *      Ambient.presets (nombres), Ambient.render(name, seconds) → Promise<{peak, rms, silentRatio}>
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Ambient = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : {};
  var AC = W.AudioContext || W.webkitAudioContext;
  var MASTER = 0.42;          // ≈ −7.5 dB: audible de fondo; el compresor evita picos
  var FADE_IN = 2.5, FADE_OUT = 1.2;
  var LOOKAHEAD_MS = 25, AHEAD = 0.12;
  var KEY = "ambient.on";

  /* ---------- utilidades ---------- */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var R = Math.random;
  function hum(v, a) { return Math.max(0, v * (1 + (R() * 2 - 1) * (a == null ? 0.1 : a))); }
  function jit(t, ms) { return t + R() * (ms == null ? 4 : ms) / 1000; }

  var NOISE = {}, KS = {}, CURVE = null;
  function noiseBuf(ctx) {
    var sr = ctx.sampleRate;
    if (NOISE[sr]) return NOISE[sr];
    var b = ctx.createBuffer(1, sr, sr), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
    return (NOISE[sr] = b);
  }
  function driveCurve() {
    if (CURVE) return CURVE;
    var n = 1024; CURVE = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; CURVE[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
    return CURVE;
  }
  /* Karplus-Strong precalculado en un AudioBuffer (afinación exacta vía playbackRate). */
  function ksBuf(ctx, midi, bright, decay, len) {
    var sr = ctx.sampleRate, key = sr + "|" + midi + "|" + bright + "|" + decay;
    if (KS[key]) return KS[key];
    var f = mtof(midi), N = Math.max(2, Math.floor(sr / f - 0.5));
    var rate = f * (N + 0.5) / sr, n = Math.floor(sr * len);
    var ring = new Float32Array(N), p = 0, mean = 0, i;
    for (i = 0; i < N; i++) { p += bright * ((R() * 2 - 1) - p); ring[i] = p; mean += p; }
    mean /= N;
    for (i = 0; i < N; i++) ring[i] -= mean;
    var b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), j = 0, peak = 1e-6;
    for (i = 0; i < n; i++) {
      var a = ring[j], j2 = j + 1 === N ? 0 : j + 1;
      d[i] = a; ring[j] = decay * 0.5 * (a + ring[j2]); j = j2;
      if (i < N * 4 && Math.abs(a) > peak) peak = Math.abs(a);
    }
    var fade = Math.min(400, n);
    for (i = 0; i < n; i++) { d[i] /= peak; if (i > n - fade) d[i] *= (n - i) / fade; }
    return (KS[key] = { b: b, rate: rate });
  }

  /* ---------- grafo: bus → hp → lp (respira) → compresor → master ; delay filtrado como espacio ---------- */
  function Graph(ctx, P) {
    var g = this; g.ctx = ctx;
    g.out = ctx.createGain(); g.out.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5;
    comp.attack.value = 0.008; comp.release.value = 0.25;
    g.lp = ctx.createBiquadFilter(); g.lp.type = "lowpass"; g.lp.frequency.value = P.lp; g.lp.Q.value = 0.5;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 32; hp.Q.value = 0.6;
    g.bus = ctx.createGain(); g.bus.gain.value = P.bus || 0.8;
    g.bus.connect(hp); hp.connect(g.lp); g.lp.connect(comp); comp.connect(g.out); g.out.connect(ctx.destination);

    g.send = ctx.createGain();
    var d = ctx.createDelay(2); d.delayTime.value = P.delay * 60 / P.bpm;
    var fb = ctx.createGain(); fb.gain.value = P.fb;
    var dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = P.delayLp || 2400;
    var dhp = ctx.createBiquadFilter(); dhp.type = "highpass"; dhp.frequency.value = 280;
    var wet = ctx.createGain(); wet.gain.value = P.wet;
    g.send.connect(d); d.connect(dlp); dlp.connect(dhp); dhp.connect(fb); fb.connect(d); dhp.connect(wet);
    if (ctx.createStereoPanner) { var wp = ctx.createStereoPanner(); wp.pan.value = 0.35; wet.connect(wp); wp.connect(g.bus); }
    else wet.connect(g.bus);
    g.noise = noiseBuf(ctx);
  }
  Graph.prototype.route = function (node, send, pan) {
    var c = this.ctx, dst = node;
    if (pan && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan; node.connect(p); dst = p; }
    dst.connect(this.bus);
    if (send > 0) { var s = c.createGain(); s.gain.value = send; dst.connect(s); s.connect(this.send); }
  };

  /* ---------- instrumentos (pocas voces, todo con envolventes cortas) ---------- */
  var I = {};
  I.kick = function (g, t, v, o) {
    o = o || {};
    var c = g.ctx, os = c.createOscillator(), a = c.createGain(), dec = o.dec || 0.3;
    os.frequency.setValueAtTime(o.f0 || 115, t);
    os.frequency.exponentialRampToValueAtTime(o.f1 || 46, t + 0.07);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + 0.003);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    os.connect(a); g.route(a, 0); os.start(t); os.stop(t + dec + 0.05);
  };
  I.noise = function (g, t, v, o) {
    var c = g.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), a = c.createGain();
    var dec = o.dec || 0.05, atk = o.atk || 0.002;
    s.buffer = g.noise; f.type = o.type || "bandpass"; f.frequency.value = o.freq || 2000; f.Q.value = o.q || 0.8;
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + atk);
    a.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
    s.connect(f); f.connect(a); g.route(a, o.send || 0, o.pan || 0);
    s.start(t, R() * 0.6); s.stop(t + atk + dec + 0.03);
  };
  I.snare = function (g, t, v, o) {
    o = o || {};
    I.noise(g, t, v, { freq: o.freq || 1800, q: 0.9, dec: o.dec || 0.12, send: o.send || 0.12, pan: o.pan });
    if (o.tone === 0) return;
    var c = g.ctx, os = c.createOscillator(), a = c.createGain(), f0 = o.tone || 190;
    os.type = "triangle"; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f0 * 0.78, t + 0.06);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v * 0.55, t + 0.002);
    a.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    os.connect(a); g.route(a, 0); os.start(t); os.stop(t + 0.1);
  };
  I.hat = function (g, t, v, dec, o) {
    o = o || {};
    I.noise(g, t, v, { type: "highpass", freq: o.freq || 7600, q: 0.7, dec: dec || 0.035, pan: o.pan == null ? 0.18 : o.pan, send: o.send || 0 });
  };
  /* guacharaca / shaker: ruido filtrado con raspado (rizos de amplitud) */
  I.scrape = function (g, t, v, len, o) {
    o = o || {};
    var c = g.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), h = c.createBiquadFilter(), a = c.createGain();
    var n = 24, cv = new Float32Array(n), ridges = o.ridges || 5;
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1), env = Math.min(1, x * 6) * (1 - x);
      cv[i] = v * env * (0.35 + 0.65 * ((x * ridges) % 1));
    }
    cv[n - 1] = 0;
    s.buffer = g.noise; f.type = "bandpass"; f.frequency.value = o.freq || 4400; f.Q.value = 1.4;
    h.type = "highpass"; h.frequency.value = 2400;
    a.gain.value = 0; a.gain.setValueCurveAtTime(cv, t, len);
    s.connect(f); f.connect(h); h.connect(a); g.route(a, 0.05, o.pan == null ? -0.22 : o.pan);
    s.start(t, R() * 0.6); s.stop(t + len + 0.02);
  };
  /* barrido de ruido para los fills */
  I.swell = function (g, t, dur, v, o) {
    o = o || {};
    var c = g.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), a = c.createGain();
    s.buffer = g.noise; s.loop = true; f.type = "bandpass"; f.Q.value = 2.2;
    f.frequency.setValueAtTime(o.from || 380, t); f.frequency.exponentialRampToValueAtTime(o.to || 3600, t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(v, t + dur * 0.92);
    a.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(a); g.route(a, 0.3, 0); s.start(t); s.stop(t + dur + 0.02);
  };
  /* bajo / 808 / tuba */
  I.bass = function (g, t, midi, dur, v, o) {
    o = o || {};
    var c = g.ctx, os = c.createOscillator(), f = c.createBiquadFilter(), a = c.createGain(), src = os;
    var fr = mtof(midi), atk = o.atk || 0.008, sus = o.sus == null ? 0.7 : o.sus;
    os.type = o.type || "triangle";
    if (o.from != null) { os.frequency.setValueAtTime(mtof(o.from), t); os.frequency.exponentialRampToValueAtTime(fr, t + (o.fromTime || 0.07)); }
    else os.frequency.setValueAtTime(fr, t);
    if (o.glide) {
      os.frequency.setValueAtTime(fr, t + o.glide.at);
      os.frequency.exponentialRampToValueAtTime(mtof(o.glide.to), t + o.glide.at + o.glide.time);
    }
    if (o.drive) { var ws = c.createWaveShaper(), pre = c.createGain(); pre.gain.value = o.drive; ws.curve = driveCurve(); os.connect(pre); pre.connect(ws); src = ws; }
    f.type = "lowpass"; f.frequency.value = o.cut || 600; f.Q.value = o.q || 0.7;
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + atk);
    a.gain.setTargetAtTime(v * sus, t + atk, Math.max(0.03, dur * 0.4));
    a.gain.setTargetAtTime(0, t + dur, 0.045);
    src.connect(f); f.connect(a); g.route(a, o.send || 0, o.pan || 0);
    os.start(t); os.stop(t + dur + 0.35);
  };
  /* cuerda pulsada (Karplus-Strong) */
  I.pluck = function (g, t, midi, v, o) {
    o = o || {};
    var c = g.ctx, k = ksBuf(c, midi, o.bright || 0.6, o.decay || 0.996, o.len || 1.4);
    var s = c.createBufferSource(), a = c.createGain(), node = a;
    s.buffer = k.b; s.playbackRate.value = k.rate;
    a.gain.setValueAtTime(v, t);
    var end = t + (o.len || 1.4) / k.rate;
    if (o.mute) { a.gain.setTargetAtTime(0, t + o.mute, 0.035); end = Math.min(end, t + o.mute + 0.25); }
    s.connect(a);
    if (o.lp) { var f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; a.connect(f); node = f; }
    g.route(node, o.send || 0, o.pan || 0);
    s.start(t); s.stop(end);
  };
  I.strum = function (g, t, notes, v, down, o) {
    var n = notes.length;
    for (var i = 0; i < n; i++) {
      var m = down ? notes[i] : notes[n - 1 - i];
      I.pluck(g, t + i * (o.spread || 0.011) + R() * 0.003, m, v * (1 - i * 0.07), o);
    }
  };
  /* pad: osciladores desafinados → filtro que respira, o banco de formantes (coro/órgano) */
  I.pad = function (g, t, notes, dur, v, o) {
    o = o || {};
    var c = g.ctx, sum = c.createGain(), a = c.createGain(), det = o.det || 7;
    var atk = o.atk || 0.8, rel = o.rel || 1.2;
    sum.gain.value = 1 / notes.length;
    notes.forEach(function (m) {
      [-det, det].forEach(function (dc) {
        var os = c.createOscillator(); os.type = o.type || "sawtooth";
        os.frequency.value = mtof(m); os.detune.value = dc + (R() - 0.5) * 3;
        os.connect(sum); os.start(t); os.stop(t + dur + rel * 2.5);
      });
    });
    if (o.formants) {
      o.formants.forEach(function (fm) {
        var bp = c.createBiquadFilter(), fg = c.createGain();
        bp.type = "bandpass"; bp.frequency.value = fm[0]; bp.Q.value = fm[1]; fg.gain.value = fm[2] * 3;
        if (fm[3]) { bp.frequency.setValueAtTime(fm[0], t); bp.frequency.linearRampToValueAtTime(fm[3], t + dur); }
        sum.connect(bp); bp.connect(fg); fg.connect(a);
      });
    } else {
      var f = c.createBiquadFilter(); f.type = "lowpass"; f.Q.value = o.q || 0.9;
      f.frequency.setValueAtTime(o.cut || 700, t);
      f.frequency.linearRampToValueAtTime(o.peak || 1400, t + dur * 0.55);
      f.frequency.linearRampToValueAtTime(o.cut || 700, t + dur + rel);
      sum.connect(f); f.connect(a);
    }
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + atk);
    a.gain.setValueAtTime(v, t + dur); a.gain.setTargetAtTime(0, t + dur, rel / 3);
    g.route(a, o.send || 0.3, o.pan || 0);
  };
  /* campana: FM inarmónica, lejana */
  I.bell = function (g, t, midi, v, o) {
    o = o || {};
    var c = g.ctx, fr = mtof(midi), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
    var p2 = c.createOscillator(), p2g = c.createGain(), a = c.createGain(), f = c.createBiquadFilter(), dec = o.dec || 5;
    mod.frequency.value = fr * 1.4; car.frequency.value = fr; p2.frequency.value = fr * 2.76;
    mg.gain.setValueAtTime(fr * 1.6, t); mg.gain.exponentialRampToValueAtTime(fr * 0.05, t + 1.6);
    mod.connect(mg); mg.connect(car.frequency);
    p2g.gain.setValueAtTime(0.25, t); p2g.gain.exponentialRampToValueAtTime(0.0001, t + dec * 0.4);
    p2.connect(p2g); p2g.connect(a); car.connect(a);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + 0.004);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    f.type = "lowpass"; f.frequency.value = o.lp || 2600; a.connect(f);
    g.route(f, o.send || 0.65, o.pan || -0.3);
    [car, mod, p2].forEach(function (x) { x.start(t); x.stop(t + dec + 0.05); });
  };
  /* metal cálido: dos sierras + filtro con "bwah" */
  I.brass = function (g, t, midi, dur, v, o) {
    o = o || {};
    var c = g.ctx, f = c.createBiquadFilter(), a = c.createGain(), fr = mtof(midi);
    [-6, 6].forEach(function (dc) {
      var os = c.createOscillator(); os.type = "sawtooth"; os.frequency.value = fr; os.detune.value = dc;
      os.connect(f); os.start(t); os.stop(t + dur + 0.4);
    });
    f.type = "lowpass"; f.Q.value = 1.1;
    f.frequency.setValueAtTime(320, t); f.frequency.linearRampToValueAtTime(o.peak || 1700, t + 0.07);
    f.frequency.setTargetAtTime(o.body || 950, t + 0.07, 0.12);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + 0.045);
    a.gain.setValueAtTime(v * 0.85, t + dur); a.gain.setTargetAtTime(0, t + dur, 0.06);
    f.connect(a); g.route(a, o.send || 0.28, o.pan || 0);
  };

  /* ---------- presets ---------- */
  function chordAt(P, bar) { return P.ch[P.prog[bar % P.prog.length]]; }
  function runLen(P, bar) {
    var i = bar % P.prog.length, n = 1, name = P.prog[i];
    while (i + n < P.prog.length && P.prog[i + n] === name) n++;
    return n;
  }
  function samePrev(P, bar) {
    var i = bar % P.prog.length;
    return i > 0 && P.prog[i - 1] === P.prog[i];
  }

  var PRESETS = {};

  /* Tutaina — rumba crossover del Eje: dembow suave, guacharaca, tiple pulsado, Sol mayor */
  PRESETS.tutaina = {
    bpm: 95, swing: 0.04, lp: 7800, bus: 1.05, delay: 0.75, fb: 0.3, wet: 0.32, delayLp: 2600, breath: 21,
    prog: ["G", "D", "Em", "C", "G", "D", "C", "D", "Em", "C", "G", "D", "C", "D", "G", "G"],
    ch: {
      G: { b: 43, n: [59, 62, 67, 71] }, D: { b: 38, n: [57, 62, 66, 69] },
      Em: { b: 40, n: [59, 64, 67, 71] }, C: { b: 36, n: [60, 64, 67, 72] }
    },
    step: function (e, bar, s, t, sd) {
      var g = e.g, P = this, ch = chordAt(P, bar), fill = bar % 8 === 7, drop = e.isDrop(bar), sec = bar % 16;
      if (!drop) {
        if (s === 0 || s === 8) I.kick(g, t, hum(0.82, 0.06), { f0: 120, f1: 47, dec: 0.34 });
        else if ((s === 4 || (s === 12 && !fill))) I.kick(g, t, hum(0.45), { f0: 100, f1: 47, dec: 0.2 });
      }
      if ((s === 3 || s === 6 || s === 11 || s === 14) && !(fill && s >= 12))
        I.snare(g, jit(t, 3), hum(s === 6 || s === 14 ? 0.36 : 0.28), { freq: 1700, tone: 205 });
      if (fill && s >= 12) {
        I.snare(g, t, 0.14 + 0.05 * (s - 12), { freq: 1900, tone: 230 });
        if (s >= 14) I.snare(g, t + sd / 2, 0.18 + 0.04 * (s - 14), { freq: 2000, tone: 240 });
      }
      /* guacharaca: largo en el tiempo, corto en el contratiempo */
      if (s % 4 === 0) I.scrape(g, jit(t, 5), hum(0.2), sd * 1.5, { ridges: 6 });
      else if (s % 4 === 2) I.scrape(g, jit(t, 5), hum(0.13), sd * 0.7, { ridges: 3 });
      else if (R() < 0.22) I.scrape(g, t, 0.06, sd * 0.4, { ridges: 2 });
      /* bajo cálido */
      var cut = 480 + 220 * e.lfo(t), bo = { type: "triangle", cut: cut, sus: 0.6 };
      if (s === 0) I.bass(g, t, ch.b, sd * 3, hum(0.5, 0.05), bo);
      else if (s === 6) I.bass(g, t, ch.b, sd, hum(0.32), bo);
      else if (s === 8) I.bass(g, t, ch.b, sd * 2, hum(0.44, 0.05), bo);
      else if (s === 11) I.bass(g, t, ch.b + 7, sd * 2, hum(0.34), bo);
      else if (s === 14 && !fill) I.bass(g, t, ch.b + 12, sd, hum(0.26), bo);
      /* tiple pulsado en contratiempos, rasgueo alterno */
      if (s === 2 || s === 6 || s === 10 || s === 14)
        I.strum(g, jit(t, 3), ch.n, hum(0.24), s % 8 === 2, { bright: 0.72, decay: 0.995, mute: sd * 1.7, send: 0.12, pan: 0.2, len: 1.2 });
      /* sección B: punteo arriba, en compases pares */
      if (sec >= 8 && e.vari.mel && bar % 2 === 0 && (s === 0 || s === 3 || s === 7 || s === 10) && R() > 0.12) {
        var k = [3, 2, 1, 2][[0, 3, 7, 10].indexOf(s)];
        I.pluck(g, jit(t, 4), ch.n[k] + 12, hum(0.15), { bright: 0.8, decay: 0.994, send: 0.3, pan: -0.25, len: 1.3 });
      }
    }
  };

  /* Medallo — perreo/trap oscuro de Provenza: 808 con glide, hats con rolls, pad frío, Do menor */
  PRESETS.medallo = {
    bpm: 90, swing: 0.06, lp: 7000, delay: 0.75, fb: 0.38, wet: 0.42, delayLp: 2100, breath: 26,
    prog: ["Cm", "Ab", "Eb", "Bb", "Cm", "Ab", "Eb", "Bb", "Fm", "Ab", "Cm", "G", "Fm", "Ab", "Bb", "Bb"],
    ch: {
      Cm: { b: 36, n: [60, 63, 67, 70] }, Ab: { b: 32, n: [56, 60, 63, 67] }, Eb: { b: 39, n: [55, 58, 63, 67] },
      Bb: { b: 34, n: [53, 58, 62, 65] }, Fm: { b: 41, n: [56, 60, 65, 68] }, G: { b: 43, n: [55, 59, 62, 67] }
    },
    mel: [72, 75, 79, 77, 75, 72, 70, 67],
    bar: function (e, bar, t, bd) {
      if (samePrev(this, bar)) return;
      var ch = chordAt(this, bar), n = runLen(this, bar), lf = e.lfo(t);
      I.pad(e.g, t, ch.n, bd * n - 0.05, 0.15, { type: "sawtooth", cut: 380 + 300 * lf, peak: 900 + 700 * lf, det: 9, atk: 0.7, rel: 1, send: 0.4, pan: -0.1 });
    },
    step: function (e, bar, s, t, sd) {
      var g = e.g, P = this, ch = chordAt(P, bar), nx = chordAt(P, bar + 1), fill = bar % 8 === 7, drop = e.isDrop(bar);
      var o8 = { type: "sine", drive: 1.6, cut: 850, sus: 0.75 };
      if (s === 0) I.bass(g, t, ch.b, sd * 6, hum(0.6, 0.04), o8);
      else if (s === 7) I.bass(g, t, ch.b, sd * 2, hum(0.42), o8);
      else if (s === 10) {
        var o = { type: "sine", drive: 1.6, cut: 850, sus: 0.75 };
        if (fill || (bar % 2 === 1 && nx.b !== ch.b)) o.glide = { to: fill ? ch.b - 12 : nx.b, at: sd * 3, time: sd * 2.2 };
        else if (R() < 0.4) { o.from = ch.b + 12; o.fromTime = 0.09; }
        I.bass(g, t, ch.b, sd * 5.5, hum(0.5, 0.05), o);
      }
      if (!drop && (s === 0 || s === 10)) I.kick(g, t, hum(0.7, 0.05), { f0: 140, f1: 52, dec: 0.13 });
      if ((s === 3 || s === 6 || s === 11 || s === 14) && !(fill && s >= 12))
        I.snare(g, jit(t, 2), hum(s === 6 || s === 14 ? 0.3 : 0.24), { freq: 1500, tone: 175, dec: 0.1 });
      /* hats: corcheas + rolls ocasionales en tresillos de fusa */
      var roll = (e.vari.roll[bar % 4] || fill) && s >= 12;
      if (roll) {
        var k = fill ? 3 : 2;
        for (var i = 0; i < k; i++) I.hat(g, t + i * sd / k, 0.05 + 0.03 * (s - 12) + 0.01 * i, 0.025, { pan: 0.25 });
      } else if (s % 2 === 0) I.hat(g, jit(t, 3), hum(s % 4 === 0 ? 0.13 : 0.09), 0.03);
      else if (R() < 0.1) I.hat(g, t, 0.05, 0.02);
      if (s === 14 && !roll && R() < 0.2) I.hat(g, t, 0.07, 0.18, { freq: 6500 });
      if (fill && s >= 12) I.snare(g, t, 0.12 + 0.05 * (s - 12), { freq: 1700, tone: 190, dec: 0.08 });
      /* destello frío en la sección B */
      if (bar % 16 >= 8 && e.vari.mel && (s === 0 || s === 6 || s === 10) && R() < 0.55) {
        I.pluck(g, jit(t, 3), P.mel[(bar * 3 + s) % P.mel.length], hum(0.12), { bright: 0.9, decay: 0.997, send: 0.55, pan: 0.3, lp: 3200, len: 1.6 });
      }
    }
  };

  /* La Logia — templo del perreo: reggaetón lento, coro/órgano con formantes, campana ritual, Mi frigio */
  PRESETS["la-logia"] = {
    bpm: 88, swing: 0.05, lp: 6200, delay: 0.75, fb: 0.46, wet: 0.5, delayLp: 1800, breath: 31,
    prog: ["Em", "F", "Em", "Em", "Am", "F", "Em", "F", "Em", "F", "G", "F", "Dm", "F", "Em", "Em"],
    ch: {
      Em: { b: 40, n: [52, 59, 64, 67] }, F: { b: 41, n: [53, 60, 65, 69] }, G: { b: 43, n: [55, 62, 67, 71] },
      Am: { b: 45, n: [57, 64, 69, 72] }, Dm: { b: 38, n: [50, 57, 62, 65] }
    },
    motif: [64, 65, 67, 65, 64],
    bar: function (e, bar, t, bd) {
      var sec = bar % 16;
      if (sec % 8 === 0) I.bell(e.g, t + 0.02, sec === 0 ? 76 : 71, 0.2, { dec: 5.5, lp: 2400, send: 0.7 });
      if (samePrev(this, bar)) return;
      var ch = chordAt(this, bar), n = runLen(this, bar);
      /* formantes "ah" en A, "oh" en B, con deriva lenta */
      var F = sec < 8 ? [[760, 6, 1, 700], [1150, 7, 0.55], [2600, 9, 0.15]] : [[460, 6, 1, 520], [820, 7, 0.6], [2500, 9, 0.12]];
      I.pad(e.g, t, ch.n, bd * n - 0.05, 0.2, { type: "sawtooth", formants: F, det: 6, atk: 1.1, rel: 1.4, send: 0.45, pan: 0.05 });
    },
    step: function (e, bar, s, t, sd) {
      var g = e.g, P = this, ch = chordAt(P, bar), nx = chordAt(P, bar + 1), fill = bar % 8 === 7, drop = e.isDrop(bar);
      if (!drop) {
        if (s === 0) I.kick(g, t, hum(0.72, 0.05), { f0: 105, f1: 42, dec: 0.36 });
        else if (s === 8) I.kick(g, t, hum(0.58, 0.05), { f0: 105, f1: 42, dec: 0.3 });
        else if (s === 4 || s === 12) I.kick(g, t, hum(0.28), { f0: 90, f1: 42, dec: 0.18 });
      }
      if ((s === 3 || s === 6 || s === 11 || s === 14) && !(fill && s >= 12))
        I.snare(g, jit(t, 3), hum(s === 6 || s === 14 ? 0.24 : 0.18), { freq: 1100, tone: 165, dec: 0.1, send: 0.2 });
      if (s % 4 === 2) I.hat(g, jit(t, 4), hum(0.06), 0.03, { freq: 6400 });
      var bo = { type: "sine", cut: 400, sus: 0.8 };
      if (s === 0) I.bass(g, t, ch.b - 12, sd * 6, hum(0.5, 0.04), bo);
      else if (s === 8) {
        if (nx.b !== ch.b) bo.glide = { to: nx.b - 12, at: sd * 5, time: sd * 2.5 };
        I.bass(g, t, ch.b - 12, sd * 7.5, hum(0.44, 0.04), bo);
      }
      /* fill: barrido + tres golpes */
      if (fill && s === 8) I.swell(g, t, sd * 8, 0.1, { from: 300, to: 2800 });
      if (fill && s >= 12 && s <= 14) I.snare(g, t, 0.14 + 0.06 * (s - 12), { freq: 1200, tone: 170, send: 0.3 });
      /* motivo ritual en B */
      if (bar % 16 >= 8 && e.vari.mel && bar % 2 === 1 && (s === 0 || s === 3 || s === 6 || s === 10 || s === 13)) {
        var i = [0, 3, 6, 10, 13].indexOf(s);
        I.pluck(g, jit(t, 6), P.motif[i], hum(0.14), { bright: 0.45, decay: 0.997, send: 0.5, pan: -0.3, lp: 2200, len: 1.6 });
      }
    }
  };

  /* Cantina 70 — Viernes de Banda / Domingo de Despecho: oom-pah de tuba, requinto, metales en las respuestas, Fa mayor */
  PRESETS["cantina-70"] = {
    bpm: 100, swing: 0, lp: 7600, bus: 1.35, delay: 0.5, fb: 0.26, wet: 0.3, delayLp: 2800, breath: 19,
    prog: ["F", "F", "C7", "C7", "C7", "C7", "F", "F", "F", "F7", "Bb", "Bb", "F", "C7", "F", "F"],
    ch: {
      F: { b: 41, f: 36, n: [60, 65, 69, 72] }, C7: { b: 36, f: 43, n: [60, 64, 67, 70] },
      F7: { b: 41, f: 36, n: [60, 63, 65, 69] }, Bb: { b: 46, f: 41, n: [58, 62, 65, 70] }
    },
    arp: [0, 1, 2, 3, 2, 1, 2, 1],
    step: function (e, bar, s, t, sd) {
      var g = e.g, P = this, ch = chordAt(P, bar), nx = chordAt(P, bar + 1), fill = bar % 8 === 7, drop = e.isDrop(bar);
      /* tuba: oom en 1 y 3 (raíz / quinta), aproximación cromática al cambiar */
      var tu = { type: "sawtooth", cut: 360 + 120 * e.lfo(t), q: 1.2, atk: 0.025, sus: 0.5 };
      if (s === 0) I.bass(g, t, ch.b, sd * 3, hum(0.5, 0.05), tu);
      else if (s === 8) I.bass(g, t, ch.f, sd * 3, hum(0.42, 0.05), tu);
      else if (s === 14 && nx.b !== ch.b && !fill) I.bass(g, t, nx.b + (nx.b > ch.f ? -1 : 1), sd * 1.5, hum(0.3), tu);
      /* pah: rasgueo apagado en 2 y 4 + escobilla */
      if (s === 4 || s === 12) {
        I.strum(g, jit(t, 3), ch.n, hum(0.24), true, { bright: 0.6, decay: 0.994, mute: sd * 1.2, send: 0.1, pan: 0.15, len: 0.9 });
        I.noise(g, t, hum(0.07), { freq: 3200, q: 0.7, dec: 0.08, pan: 0.1 });
      }
      if (!drop && (s === 0 || s === 8)) I.kick(g, t, hum(s === 0 ? 0.42 : 0.32), { f0: 95, f1: 50, dec: 0.2 });
      /* requinto: arpegios en corcheas (compases impares y sección B) */
      if (s % 2 === 0 && (bar % 2 === 1 || (bar % 16 >= 8 && e.vari.mel)) && !(fill && s >= 10) && R() > 0.12) {
        var m = ch.n[P.arp[s / 2]] + 12;
        I.pluck(g, jit(t, 4), m, hum(s % 4 === 0 ? 0.19 : 0.14), { bright: 0.78, decay: 0.995, send: 0.22, pan: -0.28, len: 1.2 });
      }
      /* metales: respuesta corta en terceras al final de cada frase de 4 */
      if (bar % 4 === 3 && (s === 4 || s === 6 || s === 8)) {
        var hi = ch.n.slice().sort(function (a, b) { return b - a; }), k = (s - 4) / 2;
        var top = hi[k] + 12, low = hi[k + 1] + 12, d = s === 8 ? sd * 3.5 : sd * 1.6;
        I.brass(g, jit(t, 5), top, d, hum(0.075), { pan: 0.3 });
        I.brass(g, jit(t, 7), low, d, hum(0.06), { pan: 0.18, peak: 1400 });
      }
      /* tarola: redoble suave al cierre de cada 8 */
      if (fill && s >= 10) {
        I.snare(g, t, 0.06 + 0.025 * (s - 10), { freq: 2600, tone: 0, dec: 0.07 });
        I.snare(g, t + sd / 2, 0.05 + 0.025 * (s - 10), { freq: 2600, tone: 0, dec: 0.06 });
      }
    }
  };

  /* ---------- motor: secuenciador por lookahead ---------- */
  function Engine(ctx, P) {
    this.ctx = ctx; this.P = P; this.g = new Graph(ctx, P);
    this.sd = 60 / P.bpm / 4; this.step = 0; this.next = 0;
    this.vari = { drop: -1, mel: true, roll: [false, true, false, false] };
  }
  Engine.prototype.lfo = function (t) {
    var b = this.P.breath || 20;
    return 0.6 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / b)) + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / (b * 1.618) + 1.3));
  };
  Engine.prototype.isDrop = function (bar) {
    var d = this.vari.drop, b = bar % 16;
    return d >= 0 && (b === d || b === d + 1);
  };
  Engine.prototype.reset = function (t) { this.step = 0; this.next = t; };
  Engine.prototype.run = function (until) {
    var P = this.P;
    while (this.next < until) {
      var s = this.step % 16, bar = Math.floor(this.step / 16), t = this.next;
      if (this.step % 2 === 1) t += P.swing * this.sd;
      if (s === 0) {
        if (bar % 16 === 0) this.vari = {
          drop: bar >= 16 && R() < 0.45 ? (R() < 0.5 ? 4 : 12) : -1,
          mel: bar === 0 ? R() < 0.5 : R() < 0.7,
          roll: [R() < 0.3, R() < 0.4, R() < 0.3, R() < 0.5]
        };
        /* filtro maestro que respira */
        this.g.lp.frequency.setTargetAtTime(P.lp * (0.62 + 0.38 * this.lfo(t)), t, 1.6);
        if (P.bar) P.bar(this, bar, t, this.sd * 16);
      }
      P.step(this, bar, s, t, this.sd);
      this.next += this.sd; this.step++;
    }
  };

  /* ---------- reproductor + UI ---------- */
  var S = { ctx: null, eng: null, timer: 0, playing: false, ready: false, hiddenPause: false, token: 0, name: null, btns: [] };

  function loop() {
    if (!S.eng) return;
    if (S.eng.next < S.ctx.currentTime) S.eng.next = S.ctx.currentTime + 0.05;
    try { S.eng.run(S.ctx.currentTime + AHEAD); } catch (err) { if (W.console) console.warn("[ambient]", err); }
    S.timer = setTimeout(loop, LOOKAHEAD_MS);
  }
  function startTimer() { if (!S.timer) { S.timer = 1; loop(); } }
  function stopTimer() { clearTimeout(S.timer); S.timer = 0; }
  function fadeTo(target, dur) {
    var p = S.eng.g.out.gain, now = S.ctx.currentTime;
    p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(target, now + dur);
  }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function start() {
    if (S.playing || !AC || !S.name) return;
    var P = PRESETS[S.name]; if (!P) return;
    try {
      if (!S.ctx) S.ctx = new AC({ latencyHint: "playback" });
      if (!S.eng) S.eng = new Engine(S.ctx, P);
    } catch (e) { if (W.console) console.warn("[ambient]", e); return; }
    S.token++; S.playing = true; S.ready = false; unlisten();
    var p = S.ctx.resume ? S.ctx.resume() : null;
    if (!S.timer) { S.eng.reset(S.ctx.currentTime + 0.08); startTimer(); }
    fadeTo(MASTER, FADE_IN);
    if (p && p.catch) p.catch(function () {});
    ui();
  }
  function stop() {
    if (!S.playing) return;
    S.playing = false; S.hiddenPause = false;
    var tk = ++S.token;
    fadeTo(0, FADE_OUT);
    setTimeout(function () { if (tk === S.token && !S.playing) { stopTimer(); if (S.ctx.suspend) S.ctx.suspend().catch(function () {}); } }, FADE_OUT * 1000 + 80);
    ui();
  }
  function toggle() { if (S.playing) { stop(); save("0"); } else { start(); save("1"); } }

  function onVis() {
    if (!S.ctx) return;
    if (document.hidden) {
      if (!S.playing) return;
      S.hiddenPause = true; var tk = ++S.token;
      fadeTo(0, 0.25);
      setTimeout(function () { if (tk === S.token && document.hidden) { stopTimer(); S.ctx.suspend().catch(function () {}); } }, 300);
    } else if (S.hiddenPause && S.playing) {
      S.hiddenPause = false; S.token++;
      S.ctx.resume().then(function () {
        if (!S.playing) return;
        S.eng.next = Math.max(S.eng.next, S.ctx.currentTime + 0.06);
        startTimer(); fadeTo(MASTER, 1.5);
      }).catch(function () {});
    }
  }

  function ui() {
    /* modo música (music.js): el botón abre el reproductor; aquí solo se avisa del estado */
    if (S.music) {
      try { document.dispatchEvent(new CustomEvent("ambient:state", { detail: { playing: S.playing } })); } catch (e) {}
      return;
    }
    S.btns.forEach(function (b) {
      b.setAttribute("aria-pressed", S.playing ? "true" : "false");
      b.setAttribute("aria-label", S.playing ? "Silenciar música" : "Activar música ambiente");
      b.setAttribute("data-state", S.playing ? "on" : (S.ready ? "ready" : "off"));
    });
  }
  function onAny(e) {
    if (!S.ready) return;
    var tg = e.target;
    if (tg && tg.closest && tg.closest("[data-ambient]")) return;
    start();
  }
  function unlisten() { if (typeof document !== "undefined") document.removeEventListener("click", onAny, true); }

  /* el botón se aparta (fundido) mientras está encima de un enlace o control: nunca tapa un CTA */
  var AV = "a[href],button,summary,input,select,textarea,label,[role=button],[tabindex]:not([tabindex='-1'])";
  var raf = 0, showT = 0;
  function dodge() {
    raf = 0;
    S.btns.forEach(function (b) {
      if (b.hidden || !document.elementsFromPoint) return;
      var r = b.getBoundingClientRect(), hit = false;
      if (!r.width) return;
      var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      var pts = [[r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2], [cx, cy], [cx, r.top + 2], [cx, r.bottom - 2]];
      for (var i = 0; i < pts.length && !hit; i++) {
        var st = document.elementsFromPoint(pts[i][0], pts[i][1]);
        for (var j = 0; j < st.length; j++) {
          var el = st[j];
          if (el === b || b.contains(el)) continue;
          if (el.closest && el.closest(AV)) hit = true;
          break;
        }
      }
      if (hit) { clearTimeout(showT); showT = 0; b.classList.add("amb--away"); }
      else if (b.classList.contains("amb--away") && !showT) showT = setTimeout(function () { showT = 0; b.classList.remove("amb--away"); }, 160);
    });
  }
  function queueDodge() { if (!raf) raf = (W.requestAnimationFrame || setTimeout)(dodge); }

  function init() {
    var list = document.querySelectorAll("[data-ambient]");
    if (!list.length) return;
    S.btns = Array.prototype.slice.call(list);
    if (!AC) { if (!S.btns[0].hasAttribute("data-music")) S.btns.forEach(function (b) { b.hidden = true; }); return; }
    S.name = S.btns[0].getAttribute("data-ambient");
    S.music = S.btns[0].hasAttribute("data-music");
    if (!S.music) {
      S.btns.forEach(function (b) { b.addEventListener("click", toggle); });
      if (load() === "1") { S.ready = true; document.addEventListener("click", onAny, true); }
    }
    document.addEventListener("visibilitychange", onVis);
    W.addEventListener("scroll", queueDodge, { passive: true });
    W.addEventListener("resize", queueDodge);
    W.addEventListener("load", queueDodge);
    setTimeout(queueDodge, 1200);
    W.addEventListener("pagehide", function () { if (S.ctx && S.playing) { stopTimer(); S.ctx.suspend().catch(function () {}); } });
    ui();
  }

  /* render fuera de línea para pruebas: pico, RMS y proporción de silencio */
  function render(name, seconds) {
    var OAC = W.OfflineAudioContext || W.webkitOfflineAudioContext, P = PRESETS[name];
    if (!OAC || !P) return Promise.reject(new Error("no disponible"));
    var sr = 44100, sec = seconds || 16, ctx = new OAC(2, sr * sec, sr), e = new Engine(ctx, P);
    e.g.out.gain.value = MASTER; e.reset(0.02); e.run(sec - 0.4);
    return ctx.startRendering().then(function (buf) {
      var peak = 0, sum = 0, n = 0, quiet = 0, win = 2205, ws = 0, wn = 0;
      for (var c = 0; c < buf.numberOfChannels; c++) {
        var d = buf.getChannelData(c);
        for (var i = 0; i < d.length; i++) {
          var a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; n++;
          if (c === 0) { ws += d[i] * d[i]; if (++wn === win) { if (Math.sqrt(ws / win) < 1e-4) quiet++; ws = 0; wn = 0; } }
        }
      }
      return { peak: peak, rms: Math.sqrt(sum / n), silentRatio: quiet / Math.floor(buf.length / win) };
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return {
    start: start, stop: stop, toggle: toggle, render: render, supported: !!AC,
    presets: Object.keys(PRESETS),
    state: function () { return { playing: S.playing, ready: S.ready, context: S.ctx ? S.ctx.state : "none", preset: S.name }; }
  };
});
