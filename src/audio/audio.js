// Prozeduraler Sound: Effekte und Musik per WebAudio, keine Audio-Dateien.
// Einstellungen (Lautstaerke, Vibration, Touch-Layout, Energiesparen) liegen in PREFS.
const PREFS = Object.assign({ music: .7, sfx: .8, vib: true, btn: 1, lefty: false, saver: false },
  (() => { try { return JSON.parse(localStorage.getItem('mk_prefs')) || {}; } catch (e) { return {}; } })());
const vib = ms => { if (PREFS.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } };

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
  const SC = { major: [0, 2, 4, 7, 9], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 4, 5, 7, 8, 10], lyd: [0, 2, 4, 6, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 1, 4, 5, 7, 8, 11], pent: [0, 3, 5, 7, 10] };
  const TH = [
    { root: 60, sc: 'major', bpm: 118, prog: [0, 5, 7, 5], lead: 'triangle', bass: 'square', kick: [0, 8] },
    { root: 62, sc: 'dorian', bpm: 126, prog: [0, 0, 3, 5], lead: 'sine', bass: 'triangle', kick: [0, 6, 8, 14] },
    { root: 64, sc: 'phryg', bpm: 100, prog: [0, 1, 0, -2], lead: 'sawtooth', bass: 'triangle', kick: [0, 10] },
    { root: 57, sc: 'lyd', bpm: 90, prog: [0, 4, 5, 2], lead: 'sine', bass: 'sine', kick: [0, 8] },
    { root: 62, sc: 'minor', bpm: 112, prog: [0, 8, 10, 7], lead: 'square', bass: 'sawtooth', kick: [0, 6, 8] },
    { root: 61, sc: 'harm', bpm: 138, prog: [0, 0, 1, -2], lead: 'sawtooth', bass: 'sawtooth', kick: [0, 4, 8, 12] },
  ];
  function build(name, o) {
    o = o || {}; const wi = o.wi || 0, T = TH[wi], r = rnd(wi * 131 + (name === 'boss' ? 7 : name === 'map' ? 3 : name === 'menu' ? 11 : 1) + (o.li || 0) * 17);
    const mode = name === 'menu' || name === 'map' ? 'calm' : name === 'boss' ? 'tense' : 'play';
    const bpm = T.bpm * (mode === 'calm' ? .8 : mode === 'tense' ? 1.18 : 1) * (o.kind === 'night' ? .92 : o.kind === 'storm' ? 1.05 : 1);
    let sc = SC[T.sc], root = T.root; if (mode === 'tense') { sc = SC.minor; root -= 2; }
    const lead = []; for (let i = 0; i < 64; i++) lead.push(i % 2 === 0 && r() < (mode === 'calm' ? .45 : .7) ? { d: Math.floor(r() * sc.length), o: r() < .25 ? 12 : 0 } : null);
    const bass = []; for (let i = 0; i < 16; i++) bass.push([0, 4, 6, 8, 12, 14].includes(i) && (mode !== 'calm' || i % 8 === 0));
    return { T, sc, root, bpm, lead, bass, mode, hat: mode !== 'calm', snare: mode !== 'calm' && wi !== 3 };
  }
  function schedule(q, st, t) {
    const pos = st % 64, bar = Math.floor(pos / 16) % 4, s = pos % 16, sd = 60 / q.bpm / 4, chord = q.T.prog[bar], dest = mus, base = q.root + chord, at = t - ctx.currentTime;
    if (s === 0) for (const iv of [0, 4, 7]) osc(mid(base + iv + 12), sd * 15, { type: 'sine', vol: .05, dest, attack: .15, at });
    if (q.bass[s]) osc(mid(base - 12 + (s === 6 || s === 14 ? 7 : 0)), sd * 1.8, { type: q.T.bass, vol: .2, dest, at });
    const L = q.lead[pos]; if (L) osc(mid(q.root + chord + 12 + q.sc[L.d % q.sc.length] + L.o), sd * 1.7, { type: q.T.lead, vol: .1, dest, at, attack: .01 });
    if (q.mode !== 'calm' || s === 0) {
      if (q.T.kick.includes(s)) osc(130, .13, { type: 'sine', vol: .5, slide: 40, dest, at });
      if (q.snare && (s === 4 || s === 12)) noise(.1, { vol: .16, fq: 1800, type: 'highpass', dest, at });
      if (q.hat && s % 2 === 0) noise(.03, { vol: .05, fq: 7000, type: 'highpass', dest, at });
    }
  }
  function tick() { if (!ctx || !seq) return; while (nextT < ctx.currentTime + .18) { schedule(seq, step, nextT); nextT += 60 / seq.bpm / 4; step++; } }
  function play(name, o) {
    if (!ctx && !gest) { pend = [name, o]; return; } if (!init()) return; o = o || {}; const k = name + ':' + (o.wi || 0) + ':' + (name === 'level' ? (o.li || 0) + (o.kind || '') : '');
    if (k === key) return; key = k; seq = build(name, o); step = 0; nextT = ctx.currentTime + .15;
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
