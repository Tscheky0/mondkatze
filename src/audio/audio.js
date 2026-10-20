// Prozeduraler Sound: Effekte und Musik per WebAudio, keine Audio-Dateien.
// Einstellungen (Lautstaerke, Vibration, Touch-Layout, Energiesparen) liegen in PREFS.
const PREFS = Object.assign({ music: .7, sfx: .8, vib: true, btn: 1, lefty: false, saver: false, retro: false },
  (() => { try { return JSON.parse(localStorage.getItem('mk_prefs')) || {}; } catch (e) { return {}; } })());
const vib = ms => { if (PREFS.vib && typeof GP !== 'undefined') GP.rumble(ms); if (PREFS.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } };

const AUDIO = (() => {
  let ctx = null, master, mus, sfxg, comp, timer = 0, nextT = 0, step = 0, seq = null, key = '', duck = 1;
  const last = {}, mid = n => 440 * Math.pow(2, (n - 69) / 12);
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  function init() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); comp = ctx.createDynamicsCompressor(); master = ctx.createGain(); mus = ctx.createGain(); sfxg = ctx.createGain();
      mus.connect(master); sfxg.connect(master); master.connect(comp); comp.connect(ctx.destination); setVol(); return true;
    } catch (e) { ctx = null; return false; }
  }
  function setVol() { if (!ctx) return; mus.gain.setTargetAtTime(PREFS.music * .45 * duck, ctx.currentTime, .05); sfxg.gain.setTargetAtTime(PREFS.sfx * .8, ctx.currentTime, .05); }
  let gest = false, pend = null;
  function unlock() { gest = true; if (init() && ctx.state === 'suspended') ctx.resume(); if (pend) { const p = pend; pend = null; play(p[0], p[1]); } }

  function osc(f, d, o) {
    o = o || {}; const t0 = ctx.currentTime + (o.at || 0), g = ctx.createGain(), s = ctx.createOscillator();
    s.type = o.type || 'square'; s.frequency.setValueAtTime(f, t0);
    if (o.slide) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + d);
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 9; lg.gain.value = f * .04; l.connect(lg); lg.connect(s.frequency); l.start(t0); l.stop(t0 + d + .05); }
    g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(o.vol == null ? .3 : o.vol, t0 + (o.attack || .006)); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    s.connect(g); g.connect(o.dest || sfxg); s.start(t0); s.stop(t0 + d + .03);
  }
  let nbuf = null;
  function noise(d, o) {
    o = o || {}; if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + (o.at || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nbuf; f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.fq || 1000, t0); if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t0 + d);
    g.gain.setValueAtTime(o.vol == null ? .3 : o.vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxg); s.start(t0, Math.random() * .5); s.stop(t0 + d + .02);
  }
  const arp = (fs, d, type, vol, gap) => fs.forEach((f, i) => osc(f, d, { type, vol, at: i * gap }));
  const S = {
    jump: () => osc(320, .14, { slide: 640, vol: .16 }), jump2: () => osc(480, .12, { slide: 900, vol: .15 }), wall: () => osc(400, .12, { slide: 800, vol: .15, type: 'triangle' }),
    land: () => noise(.07, { vol: .1, fq: 500 }),
    coin: () => { osc(988, .07, { vol: .13 }); osc(1319, .15, { vol: .13, at: .06 }); }, shard: () => osc(1760, .1, { type: 'sine', vol: .14, slide: 2093 }),
    hit: () => { noise(.1, { vol: .22, fq: 1800 }); osc(180, .1, { vol: .18, slide: 80 }); },
    stomp: () => { osc(260, .12, { type: 'triangle', vol: .3, slide: 90 }); noise(.06, { vol: .14, fq: 900 }); },
    hurt: () => osc(300, .3, { type: 'sawtooth', vol: .22, slide: 70 }),
    kill: () => { osc(500, .08, { vol: .14, slide: 1000 }); noise(.1, { vol: .14, fq: 2500 }); },
    dash: () => noise(.18, { vol: .18, fq: 3000, sweep: 600 }), spring: () => osc(300, .25, { type: 'sine', vol: .28, slide: 1400 }),
    door: () => { osc(520, .12, { type: 'triangle', vol: .25, slide: 260 }); osc(390, .2, { type: 'triangle', vol: .25, at: .1, slide: 180 }); },
    power: () => arp([523, 659, 784, 1047], .12, 'square', .14, .07), treasure: () => arp([523, 659, 784, 1047, 1319], .2, 'triangle', .22, .08),
    bell: () => { osc(1568, .6, { type: 'sine', vol: .22 }); osc(2093, .6, { type: 'sine', vol: .12, at: .02 }); },
    crumble: () => noise(.25, { vol: .16, fq: 400 }), rock: () => { noise(.3, { vol: .28, fq: 300 }); osc(70, .3, { type: 'sine', vol: .4, slide: 40 }); },
    fire: () => noise(.2, { vol: .14, fq: 1500, sweep: 300 }), shoot: () => osc(700, .1, { type: 'triangle', vol: .12, slide: 300 }),
    win: () => arp([523, 659, 784, 1047, 784, 1047, 1319], .22, 'square', .17, .1), lose: () => arp([392, 330, 262, 196], .32, 'sawtooth', .2, .18),
    ui: () => osc(880, .05, { vol: .08 }), tele: () => osc(200, .4, { type: 'sawtooth', vol: .15, slide: 420 }),
    block: () => { osc(1400, .1, { vol: .18 }); osc(700, .2, { type: 'sine', vol: .25, at: .02 }); },
    bossHit: () => { noise(.2, { vol: .33, fq: 500 }); osc(90, .35, { type: 'sine', vol: .5, slide: 40 }); }, strike: () => noise(.25, { vol: .22, fq: 2000, sweep: 300 }),
    magic: () => { osc(600, .5, { type: 'sine', vol: .18, slide: 1200, vib: true }); osc(900, .5, { type: 'triangle', vol: .1, slide: 300 }); },
    moon: () => arp([880, 1175, 1568, 2093], .4, 'sine', .2, .06), heal: () => arp([659, 784, 988], .2, 'triangle', .2, .08),
    thunder: () => { noise(1.4, { vol: .5, fq: 250, sweep: 60 }); osc(60, 1.2, { type: 'sine', vol: .35, slide: 35 }); },
    roar: () => { osc(90, .9, { type: 'sawtooth', vol: .32, slide: 50 }); noise(.9, { vol: .18, fq: 400 }); }, moonEat: () => osc(900, 2, { type: 'sine', vol: .22, slide: 90 }),
    wind: () => noise(1.5, { vol: .12, fq: 600, sweep: 1800 }), sparkle: () => arp([1568, 1976, 2349], .2, 'sine', .12, .05),
    step: () => noise(.04, { vol: .06, fq: 700 }),
  };
  function sfx(n) {
    if (!ctx || !PREFS.sfx || ctx.state !== 'running') return; const now = ctx.currentTime; if (last[n] && now - last[n] < .03) return; last[n] = now;
    try { if (S[n]) S[n](); } catch (e) { }
  }

  // ---------- Musik ----------
  // Instrumente werden synthetisiert: Karplus-Strong-Saiten (Gitarre/Harfe/Oud), additive Mallets und Glocken,
  // Streicher-/Chor-Pads, Blech, Flöte und ein Schlagzeug aus Rauschen und Sinus. Dazu Faltungshall und Menschlichkeit
  // (kleine Timing- und Lautstaerke-Abweichungen). Melodien entstehen aus Motiven (A A' B Kadenz), nicht aus Zufallsnoten.
  const SC = { major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 4, 5, 7, 8, 10], lyd: [0, 2, 4, 6, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  const Q = { M: [0, 4, 7], m: [0, 3, 7], d: [0, 3, 6], D: [0, 4, 7, 10] };
  const BOSSP = [[0, 'm'], [8, 'M'], [3, 'M'], [7, 'M'], [5, 'm'], [1, 'M'], [7, 'M'], [0, 'm']];
  const TH = [
    { sc: 'major', root: 60, bpm: 104, swing: .12, A: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], B: [[5, 'M'], [0, 'M'], [7, 'M'], [7, 'M']],
      pad: 'strings', comp: 'guitar', cp: [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 1, -1, 2, -1, 3, -1], lead: 'marimba', dens: .6, bass: 'pluck', bp: [0, -1, -1, -1, 1, -1, -1, -1, 0, -1, -1, -1, 1, -1, 0, -1],
      k: 'x.......x.....x.', s: '........o.......', h: '', p: 'xoxoxoxoxoxoxoxo' },
    { sc: 'dorian', root: 62, bpm: 116, swing: .06, A: [[0, 'm'], [5, 'M'], [0, 'm'], [10, 'M']], B: [[5, 'M'], [10, 'M'], [0, 'm'], [7, 'm']],
      pad: 'strings', comp: 'marimba', cp: [0, -1, 2, 0, -1, 2, -1, 1, 0, -1, 2, 0, -1, 1, 3, -1], lead: 'flute', dens: .55, bass: 'pluck', bp: [0, -1, -1, 0, -1, -1, 1, -1, 0, -1, -1, 0, -1, 1, -1, -1],
      k: 'x.....x.x.......', s: '', h: '', p: 'x..x..x...x.x...', tom: '..x....x..x....x' },
    { sc: 'phryg', root: 62, bpm: 94, swing: 0, A: [[0, 'M'], [1, 'M'], [0, 'M'], [10, 'm']], B: [[5, 'm'], [1, 'M'], [0, 'M'], [0, 'M']],
      pad: 'drone', comp: 'oud', cp: [0, -1, -1, 1, -1, 2, -1, -1, 0, -1, 1, -1, 2, -1, 1, -1], lead: 'oud', dens: .6, bass: 'pluck', bp: [0, -1, -1, -1, -1, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1],
      k: 'x.....x.x.......', s: '', h: '', p: '..x.x.....x.x...', tom: 'x.....x.x.......' },
    { sc: 'lyd', root: 57, bpm: 80, swing: 0, A: [[0, 'M'], [2, 'M'], [7, 'M'], [9, 'm']], B: [[9, 'm'], [2, 'M'], [0, 'M'], [7, 'M']],
      pad: 'strings', comp: 'piano', cp: [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 2, -1, 1, -1], lead: 'bell', dens: .5, bass: 'sub', bp: [0, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1],
      k: '', s: '', h: '', p: 'o...o...o...o...' },
    { sc: 'minor', root: 62, bpm: 100, swing: 0, A: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], B: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']],
      pad: 'strings', comp: 'stab', cp: [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 1, -1, 2, -1, 1, -1], lead: 'brass', dens: .45, bass: 'saw', bp: [0, -1, 0, -1, 1, -1, 0, -1, 0, -1, 0, -1, 1, -1, 2, -1],
      k: 'x...x...x...x...', s: '....x.......x...', h: '', p: '', tim: 'x.......x.....x.' },
    { sc: 'harm', root: 61, bpm: 128, swing: 0, A: [[0, 'm'], [0, 'm'], [8, 'M'], [7, 'M']], B: [[5, 'm'], [8, 'M'], [7, 'M'], [0, 'm']],
      pad: 'choir', comp: 'stab', cp: [0, 0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 3, 0], lead: 'brass', dens: .6, bass: 'saw', bp: [0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 1, -1, 0, -1],
      k: 'x..xx..xx..xx.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', p: '', tim: 'x...............' },
    { sc: 'lyd', root: 65, bpm: 112, swing: .05, A: [[0, 'M'], [2, 'M'], [9, 'm'], [7, 'M']], B: [[5, 'M'], [0, 'M'], [2, 'M'], [7, 'M']],
      pad: 'strings', comp: 'harp', cp: [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 0, -1, 1, -1], lead: 'bell', dens: .6, bass: 'sub', bp: [0, -1, -1, -1, -1, -1, 1, -1, 0, -1, -1, -1, 1, -1, -1, -1],
      k: 'x.......x...x...', s: '........o.......', h: '..o...o...o...o.', p: 'o.o.o.o.o.o.o.o.' },
  ];
  const BOSS_TH = { comp: 'stab', cp: [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 3, 0, 2, 0], lead: 'brass', dens: .5, bass: 'saw', pad: 'choir', bp: [0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, -1, 1, -1],
    k: 'x.x...x.x.x.....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.xx', p: '', tim: 'x.....x...x.x...' };

  let mbus = null, dbus = null;
  function initMusic() {
    if (mbus) return;
    const n = Math.floor(ctx.sampleRate * 2.4), ib = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ib.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    const rev = ctx.createConvolver(), send = ctx.createGain(), lp = ctx.createBiquadFilter(), dsend = ctx.createGain();
    rev.buffer = ib; send.gain.value = .32; dsend.gain.value = .1; lp.type = 'lowpass'; lp.frequency.value = 4800;
    mbus = ctx.createGain(); dbus = ctx.createGain();
    mbus.connect(mus); dbus.connect(mus); mbus.connect(send); dbus.connect(dsend); send.connect(lp); dsend.connect(lp); lp.connect(rev); rev.connect(mus);
  }
  // Karplus-Strong: gezupfte Saite als Sample, pro Tonhoehe einmal berechnet
  const ksC = {};
  function ks(m, kind) {
    const key = kind + m; if (ksC[key]) return ksC[key];
    const f = mid(m), sr = ctx.sampleRate, p = Math.max(2, Math.round(sr / f)), N = Math.floor(sr * (kind === 'bass' ? 1.4 : 1.8)), b = ctx.createBuffer(1, N, sr), d = b.getChannelData(0);
    const soft = kind === 'guitar' || kind === 'bass' ? .35 : kind === 'oud' ? .8 : .6, damp = kind === 'oud' ? .992 : kind === 'bass' ? .997 : kind === 'harp' ? .9965 : .995;
    let pv = 0; for (let i = 0; i < p; i++) { pv += soft * (Math.random() * 2 - 1 - pv); d[i] = pv * 2.2; }
    for (let i = p; i < N; i++) d[i] = (d[i - p] + d[i - p + 1]) * .5 * damp;
    b._rate = (sr / p) / f; return ksC[key] = b;
  }
  function out(g, o) { g.connect((o && o.dest) || mbus); }
  function pluckV(m, t, v, o) {
    o = o || {}; const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(), b = ks(m, o.kind || 'guitar'), len = o.len || 1.3;
    s.buffer = b; s.playbackRate.value = b._rate; f.type = 'lowpass'; f.frequency.setValueAtTime(o.cut || 5200, t); f.frequency.exponentialRampToValueAtTime(o.cut2 || 900, t + len);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + len); s.connect(f); f.connect(g); out(g, o); s.start(t); s.stop(t + len + .05);
  }
  // Additive Mallets/Glocken: Teiltoene mit eigenem Abklingen
  const PART = { marimba: [[1, 1, 1], [3.93, .38, .3], [9.9, .12, .12]], bell: [[1, 1, 1], [2.76, .45, .6], [5.4, .28, .35], [8.93, .14, .2]], piano: [[1, 1, 1], [2, .5, .75], [3, .3, .55], [4, .16, .4], [5, .08, .3]] };
  function addV(kind, m, t, d, v, o) {
    const f = mid(m), base = kind === 'marimba' ? .45 : kind === 'bell' ? 1.6 : 1.5, g0 = ctx.createGain(); g0.gain.value = 1; out(g0, o);
    for (const [r, a, dm] of PART[kind]) {
      const s = ctx.createOscillator(), g = ctx.createGain(), dd = Math.max(.12, base * dm * (kind === 'piano' ? 1 + d * .4 : 1));
      s.type = 'sine'; s.frequency.value = f * r * (kind === 'piano' && r > 1 ? 1 + .0004 * r * r : 1);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * a, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dd); s.connect(g); g.connect(g0); s.start(t); s.stop(t + dd + .03);
    }
    if (kind === 'piano') noise(.03, { vol: v * .25, fq: 2500, at: t - ctx.currentTime, dest: o && o.dest || mbus });
  }
  function padV(ms, t, d, v, kind) {
    if (PREFS.retro) return;
    for (const m of ms) {
      const f = mid(m), g = ctx.createGain(), fl = ctx.createBiquadFilter(), a = Math.min(.5, d * .35);
      fl.type = 'lowpass'; fl.frequency.value = kind === 'drone' ? 700 : 1500; fl.Q.value = .4;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + d - .25); g.gain.linearRampToValueAtTime(.0001, t + d + .35);
      for (const dt of [-8, 7]) { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = dt; s.connect(fl); s.start(t); s.stop(t + d + .4); }
      if (kind === 'choir') { // Formanten: "Ooh/Aah"
        const b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), g2 = ctx.createGain(); b1.type = b2.type = 'bandpass'; b1.frequency.value = 700; b2.frequency.value = 1150; b1.Q.value = b2.Q.value = 4; g2.gain.value = 1.4;
        fl.connect(b1); fl.connect(b2); b1.connect(g2); b2.connect(g2); g2.connect(g);
      } else fl.connect(g);
      out(g);
    }
  }
  function brassV(m, t, d, v) {
    const f = mid(m), g = ctx.createGain(), fl = ctx.createBiquadFilter(), at = Math.min(.09, d * .4);
    fl.type = 'lowpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(500, t); fl.frequency.exponentialRampToValueAtTime(2600, t + at + .02); fl.frequency.exponentialRampToValueAtTime(1100, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.setValueAtTime(v * .85, t + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t + d + .08);
    for (const dt of [-6, 6]) { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = dt; s.connect(fl); s.start(t); s.stop(t + d + .12); }
    fl.connect(g); out(g);
  }
  function fluteV(m, t, d, v) {
    const f = mid(m), s = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), at = Math.min(.08, d * .4);
    s.type = 'sine'; s.frequency.value = f; l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .006, t + d * .6); l.connect(lg); lg.connect(s.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.setValueAtTime(v * .9, t + d * .8); g.gain.exponentialRampToValueAtTime(.0001, t + d + .1);
    s.connect(g); out(g); s.start(t); l.start(t); s.stop(t + d + .15); l.stop(t + d + .15);
    noise(d, { vol: v * .09, fq: f * 2, type: 'bandpass', at: t - ctx.currentTime, dest: mbus });
  }
  function stabV(m, t, d, v) { // kurze Streicher-/Saitenstakkato
    const s = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); s.type = 'sawtooth'; s.frequency.value = mid(m);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(2400, t); fl.frequency.exponentialRampToValueAtTime(500, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); out(g); s.start(t); s.stop(t + d + .03);
  }
  function bassV(m, t, d, v, kind) {
    if (PREFS.retro) return osc(mid(m), Math.max(.08, d), { type: 'triangle', vol: v * .8, dest: mbus, at: t - ctx.currentTime, attack: .004 });
    if (kind === 'pluck') return pluckV(m, t, v * 1.4, { kind: 'bass', len: Math.max(.5, d * 1.6), cut: 1400, cut2: 300 });
    const s = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); s.type = kind === 'saw' ? 'sawtooth' : 'sine'; s.frequency.value = mid(m);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(kind === 'saw' ? 900 : 400, t); fl.frequency.exponentialRampToValueAtTime(220, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); out(g); s.start(t); s.stop(t + d + .03);
  }
  const kick = (t, v) => { osc(150, .16, { type: 'sine', vol: v, slide: 42, dest: dbus, at: t - ctx.currentTime }); noise(.012, { vol: v * .35, fq: 3500, dest: dbus, at: t - ctx.currentTime }); };
  const snare = (t, v) => { noise(.16, { vol: v, fq: 1900, type: 'bandpass', dest: dbus, at: t - ctx.currentTime }); osc(190, .1, { type: 'triangle', vol: v * .55, slide: 130, dest: dbus, at: t - ctx.currentTime }); };
  const hat = (t, v, open) => noise(open ? .14 : .035, { vol: v, fq: 7500, type: 'highpass', dest: dbus, at: t - ctx.currentTime });
  const shaker = (t, v) => noise(.05, { vol: v, fq: 5200, type: 'bandpass', dest: dbus, at: t - ctx.currentTime });
  const tom = (t, f, v) => { osc(f, .28, { type: 'sine', vol: v, slide: f * .55, dest: dbus, at: t - ctx.currentTime }); noise(.03, { vol: v * .3, fq: 1200, dest: dbus, at: t - ctx.currentTime }); };
  const timp = (t, v) => { osc(98, .8, { type: 'sine', vol: v, slide: 72, dest: dbus, at: t - ctx.currentTime }); noise(.08, { vol: v * .35, fq: 300, dest: dbus, at: t - ctx.currentTime }); };

  function note(kind, m, t, d, v) {
    if (PREFS.retro) { osc(mid(m), Math.max(.07, Math.min(d, .5)), { type: kind === 'brass' ? 'sawtooth' : kind === 'bell' || kind === 'flute' ? 'triangle' : 'square', vol: v * .5, dest: mbus, at: t - ctx.currentTime, attack: .004 }); return; }
    if (kind === 'guitar' || kind === 'oud' || kind === 'harp') pluckV(m, t, v, { kind, len: kind === 'oud' ? .9 : 1.5, cut: kind === 'oud' ? 6500 : 4800 });
    else if (kind === 'marimba' || kind === 'bell' || kind === 'piano') addV(kind, m, t, d, v);
    else if (kind === 'brass') brassV(m, t, d, v); else if (kind === 'flute') fluteV(m, t, d, v); else if (kind === 'stab') stabV(m, t, Math.min(d, .16), v);
  }

  // Melodie aus Motiven: Takte [A, A' (Sequenz), B, Kadenz] zweimal. Starke Zaehlzeiten rasten auf Akkordtoene ein.
  function melody(r, sc, chords, root, dens) {
    const n = sc.length, ev = new Array(128).fill(null), RH = [[0, 3, 6, 8, 10, 12], [0, 4, 8, 10, 12, 14], [0, 2, 4, 8, 12], [0, 3, 6, 9, 12], [0, 6, 8, 12, 14], [0, 4, 6, 8, 12]];
    const pm = d => root + Math.floor(d / n) * 12 + sc[((d % n) + n) % n];
    const snap = (d, ch) => { let best = d, bd = 99; for (let k = -3; k <= 3; k++) { const pc = pm(d + k) % 12; if (ch.t.some(x => (ch.r + x) % 12 === pc) && Math.abs(k) < bd) { bd = Math.abs(k); best = d + k; } } return best; };
    const motif = () => { const rh = RH[Math.floor(r() * RH.length)]; return { rh, base: n + Math.floor(r() * 3), st: rh.map(() => (r() < .7 ? (r() < .5 ? 1 : -1) : (r() < .5 ? 2 : -2) * (1 + (r() < .3 ? 1 : 0)))) }; };
    const bar = (b, mo, shift) => {
      let d = mo.base + shift;
      mo.rh.forEach((p, i) => {
        if (i) d += mo.st[i - 1]; d = Math.max(n - 2, Math.min(2 * n + 2, d));
        if (i && r() > dens + .25) return; const strong = p === 0 || p === 8, dd = strong ? snap(d, chords[b]) : d, nx = mo.rh[i + 1] != null ? mo.rh[i + 1] : 16;
        ev[b * 16 + p] = { m: pm(dd), len: nx - p };
      });
    };
    const cad = (b, last) => { ev[b * 16] = { m: pm(last ? n : snap(n + 4, chords[b])), len: 14 }; };
    for (const sec of [0, 1]) {
      const A = motif(), B = motif(), o = sec * 4;
      bar(o, A, 0); bar(o + 1, A, sec ? -1 : 1); bar(o + 2, B, 0); cad(o + 3, sec === 1);
    }
    return ev;
  }

  function build(name, o) {
    o = o || {}; const wi = o.wi || 0, T0 = TH[wi], seed = wi * 131 + (name === 'boss' ? 7 : name === 'map' ? 3 : name === 'menu' ? 11 : 1) + (o.li || 0) * 17, r = rnd(seed);
    const mode = name === 'menu' || name === 'map' ? 'calm' : name === 'boss' ? 'tense' : 'play';
    let T = T0, sc = SC[T0.sc], root = T0.root, prog = [...T0.A, ...T0.B];
    if (mode === 'tense') { T = Object.assign({}, T0, BOSS_TH, { swing: 0 }); sc = SC.minor; root -= 2; prog = BOSSP; }
    if (mode === 'calm') T = Object.assign({}, T0, { comp: T0.comp === 'stab' ? 'piano' : T0.comp, lead: 'bell', dens: .4, bass: 'sub', pad: 'strings', k: '', s: '', h: '', tim: '', tom: '', p: name === 'map' ? 'o.......o.......' : '' });
    const bpm = T0.bpm * (mode === 'calm' ? .78 : mode === 'tense' ? 1.14 + .07 * (o.ph || 0) : 1) * (o.kind === 'night' ? .92 : o.kind === 'storm' ? 1.05 : 1);
    const chords = prog.map(([off, qq]) => ({ r: root + off, t: Q[qq] }));
    return { T, sc, root, bpm, mode, chords, lead: melody(r, sc, chords, root, T.dens), sd: 60 / bpm / 4, night: o.kind === 'night' };
  }
  const hit = c => c === 'x' ? 1 : c === 'o' ? .45 : 0;
  function schedule(q, st, t) {
    const T = q.T, pos = st % 128, bar = pos >> 4, s = pos & 15, ch = q.chords[bar], sd = q.sd, hum = () => (Math.random() - .5) * .014, vr = () => .88 + Math.random() * .24;
    const tt = t + (s & 1 ? sd * (T.swing || 0) : 0) + hum(), calm = q.mode === 'calm', lv = calm ? .75 : 1;
    if (s === 0) { // Pad: Dreiklang + tiefe Wurzel
      const pv = (T.pad === 'choir' ? .05 : .045) * lv; padV(ch.t.slice(0, 3).map(x => ch.r + x), tt, sd * 16, pv, T.pad); padV([ch.r - 12], tt, sd * 16, pv * .8, 'strings');
    }
    const ci = T.cp[s]; if (ci >= 0 && ci < 4) { const m = ch.r - 12 + (ci === 3 ? 12 : ch.t[ci]) + (T.comp === 'marimba' || T.comp === 'piano' ? 12 : 0), vol = (T.comp === 'stab' ? .11 : T.comp === 'piano' ? .16 : .2) * lv * vr(); if (!(calm && s % 4)) note(T.comp, m, tt, sd * 1.6, vol); }
    const bi = T.bp[s]; if (bi >= 0) { const m = ch.r - 24 + (bi === 1 ? 7 : bi === 2 ? 12 : 0); bassV(m, tt, sd * (T.bass === 'saw' ? 1.7 : 2.6), (T.bass === 'saw' ? .17 : .26) * vr(), T.bass); }
    const L = q.lead[pos]; if (L) note(T.lead, L.m + (T.lead === 'bell' ? 12 : 0), tt, sd * L.len * .9, (T.lead === 'brass' ? .13 : T.lead === 'bell' ? .14 : .2) * lv * vr());
    if (q.mode === 'tense' && s % 4 === 0 && bar % 2 === 0 && s === 0) brassV(ch.r - 12, tt, sd * 5, .1);
    if (q.mode === 'tense' && !(s & 1)) stabV(ch.r - 12 + (s % 8 === 4 ? 7 : 0), tt, sd * .8, .05);
    const d = hit(T.k[s]); if (d && !(q.night && s % 8)) kick(tt, .5 * d * vr() * lv);
    if (T.s && hit(T.s[s])) snare(tt, .17 * hit(T.s[s]) * vr()); if (T.h && hit(T.h[s])) hat(tt, (s % 4 === 2 ? .06 : .035) * vr(), s === 14 && bar % 2);
    if (T.p && hit(T.p[s])) shaker(tt, .05 * hit(T.p[s]) * vr()); if (T.tim && hit(T.tim[s])) timp(tt, .5 * vr());
    if (T.tom && hit(T.tom[s])) tom(tt, s % 8 ? 190 : 140, .3 * vr());
    if ((bar === 3 || bar === 7) && s >= 12 && !calm && (T.s || T.tom)) { if (T.s) snare(tt, .1 + (s - 12) * .03); else tom(tt, 220 - (s - 12) * 25, .25); } // kleiner Fill vor dem Abschnittswechsel
  }
  function tick() { if (!ctx || !seq) return; while (nextT < ctx.currentTime + .3) { schedule(seq, step, nextT); nextT += seq.sd; step++; } }
  function play(name, o) {
    if (!ctx && !gest) { pend = [name, o]; return; } if (!init()) return; o = o || {}; const k = name + ':' + (o.wi || 0) + ':' + (name === 'level' ? (o.li || 0) + (o.kind || '') : name === 'boss' ? (o.ph || 0) : '');
    if (k === key) return; key = k; initMusic(); seq = build(name, o); step = 0; nextT = ctx.currentTime + .15;
    clearInterval(timer); timer = setInterval(tick, 40);
    mus.gain.cancelScheduledValues(ctx.currentTime); mus.gain.setValueAtTime(0, ctx.currentTime); setVol();
  }
  function stop() { key = ''; seq = null; clearInterval(timer); if (ctx) mus.gain.setTargetAtTime(0, ctx.currentTime, .15); }
  function setDuck(d) { duck = d; setVol(); }
  return { unlock, sfx, play, stop, setVol, duck: setDuck };
})();

function applyPrefs() {
  document.documentElement.style.setProperty('--bs', PREFS.btn);
  const tc = document.getElementById('tc'); if (tc) tc.classList.toggle('lefty', !!PREFS.lefty);
  AUDIO.setVol();
}
function savePrefs() { try { localStorage.setItem('mk_prefs', JSON.stringify(PREFS)); } catch (e) { } applyPrefs(); }
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => AUDIO.unlock(), { passive: true }));
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) AUDIO.sfx('ui'); }, true);
document.addEventListener('visibilitychange', () => AUDIO.duck(document.hidden ? 0 : 1));
