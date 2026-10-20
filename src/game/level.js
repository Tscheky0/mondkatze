// Jump&Run-Engine: jedes Level hat Stil, Mechaniken, Himmel, Palette und Kulisse (levelSpec).
const TS = 32, ROWS = 17, VW = 960, VH = 544;
const snd = n => { if (window.AUDIO) AUDIO.sfx(n); };
const IN = { l: 0, r: 0, j: 0, jb: 0, ap: 0 }; // Eingabe, wird von app.js gesetzt
const MOONLV = [1, 3, 5, 7, 9];

function rng(s) {
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const _specs = {};
function levelSpec(wi, li) {
  const key = wi + '_' + li; if (_specs[key]) return _specs[key];
  let ps = -1, pm = -1, style = 'plain', mods = [];
  for (let k = 0; k <= li; k++) {
    const rr = rng(wi * 900 + k * 31 + 3);
    let s = Math.floor(rr() * 6); if (s === ps) s = (s + 1 + Math.floor(rr() * 5)) % 6; ps = s;
    let m = Math.floor(rr() * 4); if (m === pm) m = (m + 1 + Math.floor(rr() * 3)) % 4; pm = m;
    const m2 = Math.floor(rr() * 4), two = rr() < .35 && m2 !== m;
    style = k === 0 ? 'plain' : STYLES[s]; mods = k === 0 ? [] : two ? [MODS[wi][m], MODS[wi][m2]] : [MODS[wi][m]];
  }
  const r = rng(wi * 500 + li * 13 + 1), kinds = ['day', 'day', 'day', 'dawn', 'dusk', 'night', 'storm'];
  let kind = mods.includes('dark') ? 'night' : kinds[Math.floor(r() * kinds.length)];
  if (li === 0) kind = 'day';
  let weather = mods.includes('rain') ? 'rain' : r() < .6 ? WEATHER[wi] : 'none';
  if (kind === 'storm') weather = wi === 3 ? 'snow' : wi === 5 ? 'embers' : 'rain';
  if (li === 0) weather = 'none';
  const pal = PALS[wi][Math.floor(r() * 3)], o = WORLD_OBJ[wi], st = Math.floor(r() * o.length);
  const wind = mods.includes('wind') ? (r() < .5 ? -1 : 1) * (70 + Math.floor(r() * 50)) : 0;
  return _specs[key] = { wi, li, name: LV_NAMES[wi][li], style, mods, kind, sky: skyFor(wi, kind), weather, pal,
    objs: [o[st], o[(st + 1) % o.length], o[(st + 2) % o.length]].slice(0, 2 + (r() < .5 ? 1 : 0)),
    gap: 150 + Math.floor(r() * 150), sc: .8 + r() * .6, f1: .006 + r() * .006, a1: 35 + r() * 35, f2: .012 + r() * .01, a2: 25 + r() * 25, ph: r() * 6, wind };
}

function genLevel(wi, li) {
  const sp = levelSpec(wi, li), r = rng(wi * 1000 + li * 37 + 7), st = sp.style, mods = sp.mods, cols = 100 + li * 8 + wi * 6;
  const g = []; for (let y = 0; y < ROWS; y++) g.push(new Uint8Array(cols));
  const diff = Math.min(.5, .12 + wi * .04 + li * .012);
  const PR = { plain: { l: [4, 11], gp: diff, gs: [2, 3], sp: .4, ss: 1 }, hills: { l: [3, 7], gp: diff * .25, gs: [2, 2], sp: .85, ss: 2 },
    gaps: { l: [3, 6], gp: .75, gs: [2, 3], sp: .3, ss: 1 }, sky: { l: [3, 5], gp: 1, gs: [2, 3], sp: .75, ss: 2 },
    stairs: { l: [3, 4], gp: diff * .3, gs: [2, 2], sp: 1, ss: 1 }, cave: { l: [4, 10], gp: diff, gs: [2, 3], sp: .4, ss: 1 } }[st];
  const lo = st === 'sky' || st === 'hills' || st === 'stairs' ? ROWS - 9 : ROWS - 6, hi = st === 'sky' ? ROWS - 4 : ROWS - 2;
  const spots = [], gaps = []; let x = 0, h = ROWS - 3, sd = -1;
  while (x < cols) {
    const last = x >= cols - 14;
    let len = x < 8 ? 8 : last ? cols - x : PR.l[0] + Math.floor(r() * (PR.l[1] - PR.l[0] + 1));
    len = Math.min(len, cols - x);
    const bot = st === 'sky' ? Math.min(ROWS, h + 3) : ROWS;
    for (let c = x; c < x + len; c++) for (let y = h; y < bot; y++) g[y][c] = 1;
    spots.push({ x0: x, x1: x + len, y: h }); x += len;
    if (x >= cols) break;
    if (cols - x > 14 && r() < PR.gp) { const gp = PR.gs[0] + Math.floor(r() * (PR.gs[1] - PR.gs[0] + 1)); gaps.push({ x0: x, x1: x + gp, si: spots.length - 1 }); x += gp; }
    if (!last) {
      if (st === 'stairs') { h += sd; if (h <= ROWS - 9) sd = 1; if (h >= ROWS - 3) sd = -1; }
      else if (r() < PR.sp) h += (r() < .5 ? -1 : 1) * (1 + Math.floor(r() * PR.ss));
    }
    h = clamp(h, lo, hi);
  }
  for (const s of spots) {
    const len = s.x1 - s.x0;
    if (st !== 'sky' && len >= 7 && s.x0 > 10 && s.x1 < cols - 14 && r() < .35 + wi * .03) {
      const c = s.x0 + 2 + Math.floor(r() * (len - 5)), n = 1 + (r() < .5 ? 1 : 0);
      for (let k = 0; k < n; k++) g[s.y - 1][c + k] = 2;
    }
    if (st !== 'sky' && len >= 6 && r() < .5) {
      const pc = s.x0 + 1 + Math.floor(r() * (len - 5)), pl = 3 + Math.floor(r() * 2), ty = mods.includes('crumble') && r() < .7 ? 5 : 3;
      for (let c = pc; c < Math.min(pc + pl, s.x1); c++) g[s.y - 3][c] = ty;
    }
  }
  for (const gp of gaps) gp.yl = spots[gp.si].y, gp.yr = spots[gp.si + 1].y;
  if (mods.includes('crumble')) for (const gp of gaps) if (r() < .5) for (let c = gp.x0; c < gp.x1; c++) g[gp.yl][c] = 5;
  let moon = null;
  if (MOONLV.includes(li)) {
    const cand = spots.filter(s => s.x1 - s.x0 >= 8 && s.x0 > 12 && s.x1 < cols - 16);
    const s = cand[Math.floor(r() * cand.length)] || spots[Math.floor(spots.length / 2)];
    for (let c = s.x0 + 1; c <= s.x0 + 3; c++) g[s.y - 3][c] = 3;
    for (let c = s.x0 + 4; c <= s.x0 + 6; c++) g[s.y - 6][c] = 3;
    moon = { x: (s.x0 + 5) * TS + 16, y: (s.y - 7) * TS + 16 };
  }
  const doors = [];
  if (li >= 1 && r() < .6) {
    const kind = ['coins', 'shaft', 'arena'][Math.floor(r() * 3)], cand = spots.filter(s => s.x1 - s.x0 >= 7 && s.x0 > 10 && s.x1 < cols - 14);
    if (cand.length) {
      const s = cand[Math.floor(r() * cand.length)], high = r() < .5 || st === 'sky', c = s.x0 + 2 + Math.floor(r() * Math.max(1, s.x1 - s.x0 - 5));
      const free = (y, a, b) => !g[y][a] && !g[y][b];
      if (!high && free(s.y - 1, c, c + 1) && free(s.y - 2, c, c + 1) && free(s.y - 3, c, c + 1)) {
        for (const y of [s.y - 1, s.y - 2]) g[y][c] = g[y][c + 1] = 6;
        doors.push({ x: c * TS + 8, y: (s.y - 2) * TS - 40, w: 48, h: 40, type: 'pipe', room: kind, used: false });
      } else {
        const a = Math.min(s.x0 + 1, cols - 20); for (let k = a; k <= a + 2; k++) if (!g[s.y - 3][k]) g[s.y - 3][k] = 3;
        doors.push({ x: (a + 1) * TS - 2, y: (s.y - 3) * TS - 56, w: 36, h: 56, type: 'door', room: kind, used: false });
      }
    }
  }
  if (st === 'cave') {
    const colH = new Array(cols).fill(ROWS - 3);
    for (const s of spots) for (let c = s.x0; c < s.x1; c++) colH[c] = s.y;
    for (let c = 1; c < cols; c++) if (!g[colH[c]][c] && !g[colH[c - 1]][c]) colH[c] = colH[c - 1];
    for (let c = 0; c < cols; c++) { const ce = colH[c] - 8 - Math.round(Math.abs(Math.sin(c * .3)) * 2); for (let y = 0; y <= ce; y++) if (!g[y][c]) g[y][c] = 1; }
  }
  const springs = [], movers = [], fire = [];
  const roomy = spots.filter(s => s.x1 - s.x0 >= 5 && s.x0 > 8 && s.x1 < cols - 12);
  if (mods.includes('springs')) for (let k = 0; k < 5 && roomy.length; k++) {
    const s = pick(roomy), col = s.x0 + 2 + Math.floor(r() * (s.x1 - s.x0 - 3));
    if (!g[s.y - 1][col]) springs.push({ x: col * TS + 2, y: s.y * TS - 10, w: 28, h: 10, sq: 0 });
  }
  if (mods.includes('movers') || st === 'sky') {
    for (const gp of gaps) if (st === 'sky' || r() < .6) { const w = (gp.x1 - gp.x0) * TS; movers.push({ cx: gp.x0 * TS + w / 2, y0: gp.yl * TS, ax: w / 2 + 10, ay: 0, w: 64, h: 12, sp: 1.3 + r() * .6, ph: r() * 6, x: 0, y: 0, dx: 0, dy: 0 }); }
    if (mods.includes('movers')) for (let k = 0; k < 3 && roomy.length; k++) { const s = pick(roomy); movers.push({ cx: (s.x0 + s.x1) / 2 * TS, y0: (s.y - 4) * TS, ax: 0, ay: 56, w: 80, h: 12, sp: 1.2 + r() * .5, ph: r() * 6, x: 0, y: 0, dx: 0, dy: 0 }); }
  }
  if (mods.includes('fireballs')) for (const gp of gaps) if (r() < .85) fire.push({ x: (gp.x0 + gp.x1) / 2 * TS, ph: r() * 3, per: 2.4 + r() * 1.2, hh: 170 + r() * 60 });
  return { g, cols, spots, gaps, sp, springs, movers, fire, doors, moonPos: moon, flagX: (cols - 5) * TS, flagY: spots[spots.length - 1].y * TS };
}


// ---------- Geheimraeume ----------
const SWAP = ['g', 'cols', 'spots', 'gaps', 'ent', 'pick', 'drops', 'movers', 'springs', 'fire', 'eshots', 'shots', 'rocks', 'warn', 'cr', 'flagX', 'flagY', 'moonPos', 'doors'];
const SWARM_E = ['🐜', '🦟', '🦗', '🐭', '🐦', '🪳'];
function genRoom(kind, wi, li) {
  const cols = 30, FL = 14, g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Uint8Array(cols));
  for (let c = 0; c < cols; c++) { g[0][c] = 1; for (let y = FL; y < ROWS; y++) g[y][c] = 1; }
  for (let y = 0; y < ROWS; y++) { g[y][0] = 1; g[y][cols - 1] = 1; }
  const pk = [], doors = [], spawn = [];
  const room = { g, cols, spots: [{ x0: 1, x1: cols - 1, y: FL }], gaps: [], ent: [], pick: pk, drops: [], movers: [], springs: [], fire: [], eshots: [], shots: [], rocks: [], warn: [], cr: [], flagX: 1e9, flagY: 0, moonPos: null, doors, kind, spawn, cleared: false, start: { x: 2 * TS, y: FL * TS - 30 } };
  const exit = { x: (cols - 4) * TS - 2, y: FL * TS - 56, w: 40, h: 56, type: 'exit', used: false }; doors.push(exit);
  const coin = (x, y) => pk.push({ k: 'o', x, y }), shard = (x, y) => pk.push({ k: 's', x, y });
  const ledge = (row, a, b) => { for (let c = a; c <= b; c++) g[row][c] = 3; };
  if (kind === 'coins') {
    [[12, 6, 10], [10, 11, 15], [8, 16, 20], [6, 21, 26]].forEach(([row, a, b], i) => {
      ledge(row, a, b); for (let c = a; c <= b; c++) coin(c * TS + 16, row * TS - 22);
      if (i === 3) pk.push({ k: 'r', x: (a + 2) * TS + 16, y: row * TS - 26 }); else shard((a + 3) * TS, row * TS - 60);
    });
    for (let c = 3; c < 26; c += 2) coin(c * TS + 16, FL * TS - 20);
  } else if (kind === 'shaft') {
    for (let y = 1; y <= 11; y++) g[y][8] = g[y][9] = 1;
    for (let y = 1; y < FL; y++) g[y][19] = g[y][20] = 1;
    [[12, 14, 17], [10, 10, 13], [8, 14, 17], [6, 10, 13], [4, 14, 17], [2, 10, 13]].forEach(([row, a, b], i) => {
      ledge(row, a, b); for (let c = a; c <= b; c++) coin(c * TS + 16, row * TS - 22);
      if (i === 5) pk.push({ k: 'r', x: (a + 2) * TS + 16, y: row * TS - 26 });
    });
    for (let y = 1; y < 13; y += 2) shard(14 * TS + 16, y * TS + 20);
    exit.x = 4 * TS - 2;
    for (let c = 22; c < 28; c += 2) coin(c * TS + 16, FL * TS - 20);
  } else {
    ledge(12, 9, 12); ledge(12, 17, 20); for (let c = 9; c <= 12; c++) coin(c * TS + 16, 12 * TS - 22); for (let c = 17; c <= 20; c++) coin(c * TS + 16, 12 * TS - 22);
    for (const c of [8, 13, 18, 23]) spawn.push({ x: c * TS, y: FL * TS - 26 });
  }
  return room;
}

function ov(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

class Run {
  constructor(wi, li, S, end, opts) {
    opts = opts || {};
    this.wi = wi; this.li = li; this.S = S; this.end = end; this.Wd = W[wi];
    Object.assign(this, genLevel(wi, li));
    this.ice = this.sp.mods.includes('ice'); this.lowg = this.sp.mods.includes('lowgrav'); this.wind = this.sp.wind;
    this.rec = []; this.recT = 0; this.kills = {}; this.race = !!opts.race; this.ghost = this.race ? loadGhost(wi, li) : null; this.par = this.cols * TS / 150;
    this.t = 0; this.animT = 0; this.pan = 2.8; this.time = 45 + this.cols * .35 + S.time;
    this.shards = 0; this.coins = 0; this.moon = false; this.chest = null; this.done = false;
    this.boost = { hp: 0, dmg: 0, spd: 0, jmp: 0 };
    const s0 = this.spots[0];
    this.p = { x: TS * 2, y: s0.y * TS - 30, w: 22, h: 30, vx: 0, vy: 0, on: false, coy: 0, face: 1, hp: S.maxhp, inv: 0, cd: 0, swing: 0, sid: 0, jumps: 0, sh: S.shield, dashT: 0, dcd: 0, wjT: 0, wall: 0 };
    this.safe = { x: this.p.x, y: this.p.y };
    this.ent = []; this.shots = []; this.fx = []; this.pick = []; this.drops = []; this.cr = []; this.warn = []; this.rocks = [];
    this.nextDrop = 18; this.regenT = 0; this.cam = 0; this.msg = ''; this.msgT = 0; this.bt = 3;
    this.parts = []; this.shake = 0; this.combo = 0; this.comboT = 0; this.eshots = []; this.runT = 0; this.wasOn = false; this.room = null; this.fade = 0; this.secrets = 0; this.canUse = false;
    for (const m of this.movers) this.moveM(m, 0);
    IN.jb = 0; IN.ap = 0; IN.dash = 0; IN.use = 0;
    this.spawn();
  }

  moveM(m, dt) {
    const s = Math.sin(this.t * m.sp + m.ph), nx = m.cx + s * m.ax - m.w / 2, ny = m.y0 + s * m.ay;
    m.dx = dt ? nx - m.x : 0; m.dy = dt ? ny - m.y : 0; m.x = nx; m.y = ny;
  }

  spawn() {
    const { Wd, wi, li } = this, ok = this.spots.filter(s => s.x0 > 11 && s.x1 - s.x0 >= 4 && s.x1 < this.cols - 8);
    const n = Math.floor(5 + li * .8 + wi * 1.2);
    for (let k = 0; k < n && ok.length; k++) {
      const s = pick(ok), t = pick(Wd.enemies), x = (s.x0 + 1 + Math.random() * (s.x1 - s.x0 - 2)) * TS;
      const fly = t.b === 'fly', h = fly ? 24 : 26, y = fly ? (s.y - 3 - Math.random() * 2) * TS : s.y * TS - h;
      this.ent.push({ t, x, y, y0: y, x0: x, w: 24, h, vx: 0, vy: 0, d: Math.random() < .5 ? -1 : 1,
        hp: Math.ceil(t.hp * (1 + wi * .35 + li * .03) * (1 + .6 * (save.ng || 0))), on: false, hop: Math.random() * 1.5, ph: Math.random() * 6, fl: 0, sid: -1, s: t.s });
    }
    for (let gi = 0, ng = li >= 2 ? 1 + Math.floor(li / 5) : 0; gi < ng && ok.length; gi++) {
      const s = pick(ok), bx = (s.x0 + 1 + Math.random() * Math.max(1, s.x1 - s.x0 - 3)) * TS;
      for (let i = 0, n = 3 + (li >= 6 ? 1 : 0); i < n; i++) this.ent.push(this.mkSwarm(bx + i * 18, s.y * TS - 16));
    }
    for (let k = 0; k < 14; k++) {
      const s = pick(this.spots), n2 = rint(3, 4), bx = (s.x0 + 1 + Math.random() * Math.max(1, s.x1 - s.x0 - 4)) * TS;
      for (let i = 0; i < n2; i++) this.pick.push({ k: 's', x: bx + i * 28, y: (s.y - 2) * TS - Math.sin(i / (n2 - 1) * Math.PI) * 24 });
    }
    for (let k = 0; k < 9; k++) {
      const s = pick(this.spots), bx = (s.x0 + 1 + Math.random() * Math.max(1, s.x1 - s.x0 - 4)) * TS;
      for (let i = 0; i < 3; i++) this.pick.push({ k: 'o', x: bx + i * 26, y: (s.y - 2) * TS - 64 });
    }
    for (const m of this.movers) for (let i = 0; i < 2; i++) this.pick.push({ k: 'o', x: m.cx - 14 + i * 28, y: m.y0 - 50 - m.ay });
    if (this.moonPos) this.pick.push({ k: 'm', x: this.moonPos.x, y: this.moonPos.y });
    if (this.li === 4 && !(save.bells || {})[this.wi] && ok.length) { const s = pick(ok); this.pick.push({ k: 'b', x: (s.x0 + s.x1) / 2 * TS, y: s.y * TS - 20 }); }
    const cs = this.spots.filter(s => s.x0 > 8 && s.x1 - s.x0 >= 5);
    if (cs.length && Math.random() < .5) { const s = pick(cs); this.pick.push({ k: 'c', x: (s.x0 + 2 + Math.random() * (s.x1 - s.x0 - 3)) * TS, y: s.y * TS - 16 }); }
  }

  solid(tx, ty) { if (tx < 0 || tx >= this.cols) return true; if (ty < 0 || ty >= ROWS) return false; const v = this.g[ty][tx]; return v === 1 || v === 3 || v === 5 || v === 6; }

  collide(e, dt) {
    e.hitX = false; e.x += e.vx * dt;
    let x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - .01) / TS), y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h - .01) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) {
      if (e.vx > 0) e.x = tx * TS - e.w; else if (e.vx < 0) e.x = (tx + 1) * TS; e.vx = 0; e.hitX = true;
    }
    e.y += e.vy * dt; e.on = false;
    x0 = Math.floor(e.x / TS); x1 = Math.floor((e.x + e.w - .01) / TS); y0 = Math.floor(e.y / TS); y1 = Math.floor((e.y + e.h - .01) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) {
      if (e.vy > 0) { e.y = ty * TS - e.h; e.on = true; } else if (e.vy < 0) e.y = (ty + 1) * TS; e.vy = 0;
    }
  }

  puff(x, y, n, col) { if (PREFS.saver) n = Math.ceil(n * .4); for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - .5) * 90, vy: -Math.random() * 60, g: 160, l: .4 + Math.random() * .3, m: .7, s: 2 + Math.random() * 3, c: col }); }
  spark(x, y, n, col) { if (PREFS.saver) n = Math.ceil(n * .4); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 120; this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 300, l: .35 + Math.random() * .3, m: .6, s: 2 + Math.random() * 2, c: col }); } }
  say(t) { this.msg = t; this.msgT = 2.2; }
  float(x, y, txt, c) { this.fx.push({ x, y, txt, c: c || '#fff', t: .9 }); }
  dmgOut() { return 1 + this.S.dmg + this.boost.dmg + (this.comboT > 0 ? this.combo : 0); }

  hurt(d, who) {
    const p = this.p; if (p.inv > 0 || this.done || (window.ADM && ADM.god)) return;
    if (p.sh > 0) { p.sh--; p.inv = 1; this.float(p.x, p.y - 10, 'Schild!', '#8cf'); return; }
    p.hp -= d; p.inv = 1.3; this.shake = .3; snd('hurt'); if (window.vib) vib(70); this.spark(p.x + 11, p.y + 15, 10, '#ff5a5a'); p.vy = -300; p.vx = -p.face * 160; this.float(p.x, p.y - 10, '-' + d, '#f55');
    if (p.hp <= 0) {
      if (this.S.rev > 0) { this.S.rev--; p.hp = Math.ceil(this.S.maxhp / 2); this.say('Phönixfeder! Wiederbelebt'); }
      else this.finish(false, who || 'Besiegt!');
    }
  }

  hit(e, d) {
    const crit = Math.random() < this.S.crit; if (crit) d = Math.ceil(d * 1.5);
    e.hp -= d; e.fl = .15; this.shake = Math.max(this.shake, .06); snd('hit'); this.spark(e.x + 12, e.y + 10, 6, '#ffffff'); e.vx = this.p.face * 120; this.float(e.x, e.y - 8, (crit ? '★' : '') + d, crit ? '#ff0' : '#fff');
    if (e.hp <= 0) {
      this.ent.splice(this.ent.indexOf(e), 1); this.time += this.S.killT; { const kn = crKey(e.t, this.wi); this.kills[kn] = (this.kills[kn] || 0) + 1; }
      if (e.t.b === 'swarm') this.pick.push({ k: 'o', x: e.x, y: e.y });
      else this.pick.push({ k: 's', x: e.x, y: e.y }, { k: 'o', x: e.x + 18, y: e.y }, { k: 'o', x: e.x + 36, y: e.y });
      this.fx.push({ x: e.x, y: e.y, txt: '💥', c: '#fff', t: .4 }); snd('kill');
    }
  }


  mkEnemy(t, x, y) {
    const fly = t.b === 'fly', h = fly ? 24 : 26, wi = this.wi, li = this.li;
    return { t, x, y, y0: y, x0: x, w: 24, h, vx: 0, vy: 0, d: Math.random() < .5 ? -1 : 1, hp: Math.ceil(t.hp * (1 + wi * .35 + li * .03) * (1 + .6 * (save.ng || 0))), on: false, hop: Math.random() * 1.5, ph: Math.random() * 6, fl: 0, sid: -1, s: t.s };
  }
  mkSwarm(x, y) {
    const t = { n: 'Schwarm', e: SWARM_E[this.wi], hp: 1, b: 'swarm', s: 100, sz: 20 };
    return { t, x, y, y0: y, x0: x, w: 16, h: 16, vx: 0, vy: 0, d: Math.random() < .5 ? -1 : 1, hp: 1 + Math.floor(this.wi / 3) + (save.ng || 0), on: false, hop: 0, ph: Math.random() * 6, fl: 0, sid: -1, s: 95 + Math.random() * 35 };
  }
  useDoor() {
    const p = this.p, d = this.doors.find(d => !d.used && ov(p, d)); if (!d) return;
    if (d.type === 'exit') return this.leaveRoom();
    this.enterRoom(d);
  }
  enterRoom(d) {
    const p = this.p; this.main = {}; for (const k of SWAP) this.main[k] = this[k]; this.mainDoor = d;
    const rm = genRoom(d.room, this.wi, this.li); for (const k of SWAP) this[k] = rm[k]; this.room = rm;
    this.roomSp = { ...this.sp, kind: 'night', sky: ['#10102a', '#2a2a55'], objs: ['🪨', '💎', '🍄'], sc: .6, weather: 'none', mods: [] };
    p.x = rm.start.x; p.y = rm.start.y; p.vx = p.vy = 0; p.dashT = 0; this.safe = { x: p.x, y: p.y }; this.cam = 0; this.fade = .5;
    this.secrets++; snd('door'); this.say('🚪 Geheimraum entdeckt!'); this.spark(p.x + 11, p.y + 15, 14, '#ffd54a');
    if (rm.kind === 'arena') for (const s of rm.spawn) rm.ent.push(this.mkEnemy(pick(this.Wd.enemies.filter(e => e.b !== 'fly')), s.x, s.y));
  }
  leaveRoom() {
    const p = this.p, d = this.mainDoor; for (const k of SWAP) this[k] = this.main[k]; this.room = null; d.used = true;
    p.x = d.x + (d.type === 'pipe' ? 12 : 8); p.y = d.y + (d.type === 'pipe' ? 8 : d.h - p.h); p.vx = p.vy = 0; this.fade = .5; this.safe = { x: p.x, y: p.y };
    snd('door'); this.say('Zurück im Level');
  }

  checkTips(start) {
    if (!window.tip) return; const p = this.p, S = this.S;
    if (start) {
      if (!Object.keys(save.cleared).length) tip('basics');
      for (const m of this.sp.mods) tip(m);
      if (S.dash) tip('dash'); if (S.wall) tip('wall'); if (S.glide) tip('glide'); if (S.combo) tip('combo');
    }
    if (this.doors.some(d => !d.used && d.type !== 'exit' && Math.abs(d.x - p.x) < 260 && Math.abs(d.y - p.y) < 200)) tip('door');
    for (const e of this.ent) { if (Math.abs(e.x - p.x) > 460) continue; if (e.t.b === 'swarm') tip('swarm'); if (e.t.x === 'shoot') tip('shoot'); if (e.t.x === 'spiky') tip('spiky'); }
    if (this.drops.length) tip('drops');
  }
  groundRow(c) { for (let y = 0; y < ROWS; y++) if (this.g[y][c] === 1 || this.g[y][c] === 3) return y; return -1; }

  update(dt) {
    if (this.done) return;
    this.animT += dt;
    if (this.pan > 0) { // Kamerafahrt zum Levelstart
      this.pan -= dt; if (IN.jb > 0 || IN.ap) this.pan = 0;
      const u = 1 - Math.max(0, this.pan) / 2.8, e = u < .2 ? 0 : (u - .2) / .8, c0 = clamp(this.flagX - VW * .6, 0, this.cols * TS - VW);
      this.cam = c0 * (1 - e * e * (3 - 2 * e));
      if (this.pan <= 0) { IN.jb = 0; IN.ap = 0; this.cam = 0; this.tipT = 0; this.checkTips(true); }
      return;
    }
    const p = this.p, S = this.S, b = this.boost, mods = this.sp.mods;
    this.tipT = (this.tipT || 0) - dt; if (this.tipT <= 0) { this.tipT = .6; this.checkTips(false); }
    if (!this.room) { this.recT -= dt; if (this.recT <= 0) { this.recT = .1; this.rec.push(Math.round(p.x), Math.round(p.y), p.face > 0 ? 1 : 0); } }
    this.t += dt; this.time -= dt; this.msgT -= dt; this.fade = Math.max(0, this.fade - dt); if (window.ADM && ADM.inftime) this.time = Math.max(this.time, 60);
    if (this.time <= 0) return this.finish(false, 'Zeit abgelaufen!');
    p.inv -= dt; p.cd -= dt; p.swing -= dt;
    if (S.regen) { this.regenT += dt; if (this.regenT > 28 / S.regen) { this.regenT = 0; if (p.hp < S.maxhp + b.hp) { p.hp++; this.float(p.x, p.y - 10, '+1', '#6f6'); } } }
    for (const m of this.movers) this.moveM(m, dt);

    const dir = IN.r - IN.l, GRV = this.lowg ? 1100 : 1800, JV = this.lowg ? .84 : 1;
    const tv = dir * 220 * (S.spd + b.spd) + (this.wind ? this.wind * (.7 + .3 * Math.sin(this.t * .8)) : 0);
    p.dcd -= dt; this.comboT -= dt;
    if (IN.dash && S.dash && p.dcd <= 0) { p.dashT = .18; p.dcd = .9; snd('dash'); this.puff(p.x + 11, p.y + 20, 8, '#ffffff'); }
    IN.dash = 0;
    if (p.dashT > 0) { p.dashT -= dt; p.vx = p.face * 520; p.vy = 0; p.inv = Math.max(p.inv, .05); this.parts.push({ x: p.x + 11, y: p.y + 15, vx: 0, vy: 0, g: 0, l: .25, m: .25, s: 10, c: '#ffffff' }); }
    else {
      if (p.wjT > 0) p.wjT -= dt; else p.vx += (tv - p.vx) * Math.min(1, dt * (this.ice ? 3 : 16));
      p.vy = Math.min(p.vy + GRV * dt, 900);
      if (S.glide && IN.j && !p.on && p.vy > 110 && p.coy <= 0) { p.vy = 110; if (Math.random() < .2) this.puff(p.x + 11, p.y + 4, 1, '#bfe8ff'); }
    }
    if (dir && !(p.wjT > 0)) p.face = dir;
    p.coy = p.on ? .1 : p.coy - dt; IN.jb -= dt;
    p.wall = 0;
    if (S.wall && !p.on && p.dashT <= 0) {
      const wy = Math.floor((p.y + p.h / 2) / TS);
      if (IN.l && this.solid(Math.floor((p.x - 3) / TS), wy)) p.wall = -1; else if (IN.r && this.solid(Math.floor((p.x + p.w + 3) / TS), wy)) p.wall = 1;
      if (p.wall && p.vy > 90) { p.vy = 90; if (Math.random() < .25) this.puff(p.x + (p.wall > 0 ? p.w : 0), p.y + 10, 1, '#e8e0c8'); }
    }
    if (IN.jb > 0) {
      if (p.coy > 0) { p.vy = -620 * JV * (S.jmp + b.jmp); p.jumps = 0; p.coy = 0; IN.jb = 0; snd('jump'); }
      else if (p.wall) { p.vy = -590 * JV * (S.jmp + b.jmp); p.vx = -p.wall * 300; p.wjT = .2; p.face = -p.wall; p.jumps = 0; IN.jb = 0; snd('wall'); this.puff(p.x + (p.wall > 0 ? p.w : 0), p.y + 15, 6, '#e8e0c8'); }
      else if (p.jumps < S.xj) { p.jumps++; p.vy = -560 * JV * (S.jmp + b.jmp); IN.jb = 0; snd('jump2'); }
    }
    if (!IN.j && p.vy < -200) p.vy += 2600 * dt;
    const vy0 = p.vy; this.collide(p, dt);
    for (const m of this.movers) {
      if (p.vy >= 0 && p.x + p.w > m.x && p.x < m.x + m.w && Math.abs(p.y + p.h - m.y) <= 10 + Math.abs(m.dy)) { p.y = m.y - p.h; p.vy = 0; p.on = true; p.x += m.dx; }
    }
    if (p.on && !this.wasOn && vy0 > 350) { snd('land'); this.puff(p.x + 11, p.y + p.h, 9, '#e8e0c8'); this.shake = Math.max(this.shake, .08); }
    this.wasOn = p.on;
    if (p.on && Math.abs(p.vx) > 120) { this.runT -= dt; if (this.runT <= 0) { this.runT = .11; this.puff(p.x + 11 - p.face * 8, p.y + p.h, 2, '#e8e0c8'); } }
    for (const q of this.parts) { q.l -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
    this.parts = this.parts.filter(q => q.l > 0); this.shake = Math.max(0, this.shake - dt);
    for (const s of this.springs) { s.sq -= dt; if (p.vy > 0 && ov(p, s)) { p.vy = -900; s.sq = .25; snd('spring'); p.jumps = 0; p.on = false; } }
    if (p.on) {
      const tx0 = Math.floor(p.x / TS), tx1 = Math.floor((p.x + p.w) / TS), ty = Math.floor((p.y + p.h + 1) / TS);
      if (ty < ROWS && this.g[ty][tx0] === 1 && this.g[ty][tx1] === 1 && this.g[ty - 1][tx0] !== 2 && this.g[ty - 1][tx1] !== 2) this.safe = { x: p.x, y: p.y };
      const cx = Math.floor((p.x + p.w / 2) / TS);
      if (ty < ROWS && this.g[ty][cx] === 5 && !this.cr.some(k => k.tx === cx && k.ty === ty)) this.cr.push({ tx: cx, ty, t: 0, gone: false });
    }
    for (const k of this.cr.slice()) {
      k.t += dt;
      if (!k.gone && k.t > .55) { this.g[k.ty][k.tx] = 0; k.gone = true; snd('crumble'); k.t = 0; }
      else if (k.gone && k.t > 3.5) { this.g[k.ty][k.tx] = 5; this.cr.splice(this.cr.indexOf(k), 1); }
    }
    if (p.y > VH + 60) { this.hurt(1, 'In den Abgrund gefallen'); if (!this.done) { p.x = this.safe.x; p.y = this.safe.y; p.vx = p.vy = 0; p.inv = 1.5; } }
    for (let ty = Math.floor(p.y / TS); ty <= Math.floor((p.y + p.h - .01) / TS); ty++) for (let tx = Math.floor(p.x / TS); tx <= Math.floor((p.x + p.w - .01) / TS); tx++)
      if (ty >= 0 && ty < ROWS && tx >= 0 && tx < this.cols && this.g[ty][tx] === 2 && p.y + p.h > (ty + .5) * TS) { this.hurt(1, 'Stacheln!'); p.vy = -380; }
    for (const f of this.fire) {
      const ph = ((this.t + f.ph) % f.per) / f.per;
      if (ph < .4) { f.y = VH + 14 - f.hh * Math.sin(Math.PI * ph / .4); if (ov(p, { x: f.x - 10, y: f.y - 10, w: 20, h: 20 })) this.hurt(1, 'Feuerball!'); } else f.y = null;
    }
    if (mods.includes('boulders') && !this.room) {
      this.bt -= dt; if (this.bt <= 0) { this.bt = 2.4 + Math.random() * 1.6; this.warn.push({ x: p.x + rint(-80, 260), t: .9 }); }
      for (const w of this.warn.slice()) { w.t -= dt; if (w.t <= 0) { this.rocks.push({ x: w.x, y: -30, vy: 0, w: 26, h: 26 }); this.warn.splice(this.warn.indexOf(w), 1); } }
      for (const k of this.rocks.slice()) {
        k.vy += 900 * dt; k.y += k.vy * dt;
        if (ov(p, k)) { this.hurt(1, 'Felsbrocken!'); this.rocks.splice(this.rocks.indexOf(k), 1); }
        else if (k.y > VH + 50 || this.solid(Math.floor((k.x + 13) / TS), Math.floor((k.y + 26) / TS))) { this.fx.push({ x: k.x, y: k.y - 10, txt: '💨', c: '#fff', t: .4 }); snd('rock'); this.rocks.splice(this.rocks.indexOf(k), 1); }
      }
    }

    if (IN.use) { IN.use = 0; this.useDoor(); }
    this.canUse = this.doors.some(d => !d.used && ov(p, d));
    if (this.room && this.room.kind === 'arena' && !this.room.cleared && this.ent.length === 0) {
      this.room.cleared = true; this.pick.push({ k: 'r', x: 15 * TS, y: 14 * TS - 40 }); this.say('Kammer gesäubert – Schatz!');
    }
    if (IN.ap && p.cd <= 0) {
      IN.ap = 0; p.cd = .35; p.swing = .18; p.sid++;
      if (S.combo && this.comboT > 0) { this.combo = Math.min(S.combo, this.combo + 1); this.float(p.x, p.y - 24, 'Kombo +' + this.combo, '#ffd54a'); } else this.combo = 0;
      this.comboT = .7;
      if (S.shot) this.shots.push({ x: p.x + p.w / 2, y: p.y + 10, vx: p.face * 520, life: .9, w: 12, h: 10 });
    }
    if (p.swing > 0) {
      const hb = { x: p.face > 0 ? p.x + p.w : p.x - 36, y: p.y - 4, w: 36, h: p.h + 8 };
      for (const e of this.ent.slice()) if (e.sid !== p.sid && ov(hb, e)) { e.sid = p.sid; this.hit(e, this.dmgOut()); }
    }
    for (const s of this.shots.slice()) {
      s.x += s.vx * dt; s.life -= dt;
      const e = this.ent.find(e => ov(s, e));
      if (e) { this.hit(e, Math.max(1, this.dmgOut() - 1)); s.life = 0; }
      if (s.life <= 0) this.shots.splice(this.shots.indexOf(s), 1);
    }

    for (const e of this.ent) {
      if (Math.abs(e.x - p.x) > 900) continue;
      e.fl -= dt;
      if (e.t.b === 'fly') { e.x += e.d * e.s * dt; e.y = e.y0 + Math.sin(this.t * 2 + e.ph) * 30; if (Math.abs(e.x - e.x0) > 150) e.d *= -1; }
      else {
        let chase = false;
        if (e.t.b === 'swarm') { const dx = p.x - e.x; if (Math.abs(dx) < 300 && Math.abs(p.y - e.y) < 200) { chase = true; e.d = dx > 0 ? 1 : -1; } }
        e.vx = e.fl > 0 ? e.vx * .9 : e.d * e.s * (e.t.b === 'swarm' ? (chase ? 1.25 : .6) : 1); e.vy = Math.min(e.vy + 1800 * dt, 900);
        if (e.t.b === 'hop') { e.hop -= dt; if (e.on && e.hop <= 0) { e.vy = -420; e.hop = 1 + Math.random(); } }
        this.collide(e, dt);
        if (chase) { if (e.on && e.fl <= 0 && (e.hitX || !this.solid(Math.floor((e.d > 0 ? e.x + e.w + 3 : e.x - 3) / TS), Math.floor((e.y + e.h + 4) / TS)))) e.vy = -430; }
        else if (e.hitX) e.d *= -1;
        else if (e.on && e.fl <= 0) { const fx = Math.floor((e.d > 0 ? e.x + e.w + 3 : e.x - 3) / TS), fy = Math.floor((e.y + e.h + 4) / TS); if (!this.solid(fx, fy)) e.d *= -1; }
        if (e.y > VH + 80) { this.ent.splice(this.ent.indexOf(e), 1); break; }
      }
      if (e.t.x === 'shoot') { e.sc = (e.sc == null ? Math.random() * 2 : e.sc) - dt; if (e.sc <= 0 && Math.abs(e.x - p.x) < 420) { e.sc = 2.4; snd('shoot'); this.eshots.push({ x: e.x + 6, y: e.y + 6, vx: (p.x < e.x ? -1 : 1) * 190, w: 12, h: 12, life: 3, e: e.t.sh }); } }
      if (ov(p, e)) {
        if (e.t.x === 'spiky' && p.vy > 100 && p.y + p.h - e.y < 18) { this.hurt(1, 'Stachelpanzer'); p.vy = -430; }
        else if (p.vy > 100 && p.y + p.h - e.y < 18) { p.vy = -430; p.jumps = 0; this.hit(e, this.dmgOut()); }
        else this.hurt(1 + (this.wi >= 3 ? 1 : 0) + Math.min(2, save.ng || 0), e.t.n);
      }
    }

    for (const k of this.eshots.slice()) {
      k.x += k.vx * dt; k.life -= dt;
      if (ov(p, k)) { this.hurt(1, 'Wurfgeschoss'); k.life = 0; }
      else if (this.solid(Math.floor((k.x + 6) / TS), Math.floor((k.y + 6) / TS))) k.life = 0;
      if (k.life <= 0) this.eshots.splice(this.eshots.indexOf(k), 1);
    }
    const R = 40 + S.magnet;
    for (const k of this.pick.slice()) {
      const dx = p.x + 11 - k.x, dy = p.y + 15 - k.y, d = Math.hypot(dx, dy);
      if ((k.k === 's' || k.k === 'o') && S.magnet && d < R && d > 1) { k.x += dx / d * 300 * dt; k.y += dy / d * 300 * dt; }
      if (d < 24) {
        this.pick.splice(this.pick.indexOf(k), 1); this.spark(k.x, k.y, k.k === 'm' ? 16 : 5, k.k === 'o' ? '#ffd54a' : '#fff6c8');
        if (k.k === 's') { this.shards += S.s2 ? 2 : 1; snd('shard'); }
        else if (k.k === 'o') { this.coins++; snd('coin'); }
        else if (k.k === 'm') { snd('treasure'); this.moon = true; this.say('Großer Mond gefunden! +20 Splitter'); }
        else if (k.k === 'b') { snd('bell'); this.bell = true; this.coins += 10; this.say('🔔 Cheys Glöckchen! Chey war hier…'); }
        else if (k.k === 'r') { snd('treasure'); this.coins += 30; this.shards += 8; this.time += 15; this.say('💎 Schatz! +30 🪙  +8 🌙  +15s'); this.spark(k.x, k.y, 24, '#9be8ff'); }
        else if (k.k === 'c') { snd('power'); this.chest = true; this.say('Truhe! Beute nach dem Level'); }
      }
    }

    if (this.t >= this.nextDrop) {
      this.nextDrop += 18;
      for (let c = Math.floor((p.x + 260) / TS), n = 0; n < 6 && c < this.cols; c++, n++) {
        const y = this.groundRow(c); if (y > 0) { this.drops.push({ x: c * TS + 16, y: y * TS - 26, d: pick(DROPS) }); this.say('Ein Item erscheint voraus!'); break; }
      }
    }
    for (const d of this.drops.slice()) if (Math.hypot(p.x + 11 - d.x, p.y + 15 - d.y) < 26) {
      this.drops.splice(this.drops.indexOf(d), 1); d.d.f(this); snd('power'); this.say(d.d.e + ' ' + d.d.t);
    }
    for (const f of this.fx) { f.t -= dt; f.y -= 30 * dt; }
    this.fx = this.fx.filter(f => f.t > 0);
    if (p.x > this.flagX) this.finish(true, 'Ziel erreicht!');
    this.cam = clamp(p.x - VW * .4, 0, this.cols * TS - VW);
  }

  finish(win, why) {
    if (this.done) return; this.done = true;
    this.end({ win, why, shards: this.shards, coins: this.coins, moon: this.moon, kills: this.kills, rec: this.rec, elapsed: this.t, par: this.par, secrets: this.secrets, bell: !!this.bell, chest: !!this.chest, time: Math.ceil(this.time) });
  }

  drawTile(c, v, tx, ty) {
    const sp = this.sp, wi = this.wi, x = tx * TS, y = ty * TS, h = hash(tx * 73856093 ^ ty * 19349663), pl = PLAT[wi];
    if (v === 2) { c.fillStyle = wi === 3 ? '#9fd8ff' : wi === 5 ? '#ff7a2a' : '#ccd'; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(x + k * 16, y + TS); c.lineTo(x + k * 16 + 8, y + TS / 2); c.lineTo(x + k * 16 + 16, y + TS); c.fill(); } return; }
    if (v === 6) {
      const right = this.g[ty][tx - 1] === 6, top = !(ty > 0 && this.g[ty - 1][tx] === 6);
      c.fillStyle = '#2fa84f'; c.fillRect(x, y, TS, TS); c.fillStyle = '#58d97a'; c.fillRect(right ? x + 4 : x + 8, y, 5, TS); c.fillStyle = '#1d7a38'; c.fillRect(right ? x + TS - 5 : x, y, 5, TS);
      if (top) { c.fillStyle = '#3fd16a'; c.fillRect(x - (right ? 0 : 3), y - 2, TS + 3, 14); c.strokeStyle = '#1d7a38'; c.lineWidth = 2; c.strokeRect(x - (right ? 0 : 3) + 1, y - 1, TS + 1, 12); }
      return;
    }
    if (v === 3 || v === 5) {
      let sx = 0; if (v === 5) { const k = this.cr.find(k => k.tx === tx && k.ty === ty); if (k && !k.gone) sx = Math.sin(this.animT * 60) * 1.5; }
      const pg = c.createLinearGradient(0, y, 0, y + TS); pg.addColorStop(0, shade(pl[0], .18)); pg.addColorStop(1, shade(pl[0], -.18));
      c.beginPath(); c.roundRect(x + sx + 1, y + 1, TS - 2, TS - 2, 6); c.fillStyle = pg; c.fill();
      c.fillStyle = pl[1]; c.beginPath(); c.roundRect(x + sx + 1, y + 1, TS - 2, 9, [6, 6, 2, 2]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + sx + 5, y + 3, TS - 10, 2);
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x + sx + 1, y + 1, TS - 2, TS - 2, 6); c.stroke();
      if (v === 5) { c.beginPath(); c.moveTo(x + 6, y + 12); c.lineTo(x + 14, y + 21); c.lineTo(x + 10, y + 28); c.moveTo(x + 24, y + 9); c.lineTo(x + 20, y + 19); c.stroke(); }
      else { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 6, y + 18, 4, 4); c.fillRect(x + TS - 10, y + 22, 4, 4); }
      return;
    }
    const open = ty > 0 && this.g[ty - 1][tx] === 1, dg = c.createLinearGradient(0, y, 0, y + TS);
    dg.addColorStop(0, shade(sp.pal.dirt, .1)); dg.addColorStop(1, shade(sp.pal.dirt, -.24));
    c.fillStyle = dg; c.fillRect(x, y, TS + 1, TS + 1);
    c.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 3; i++) c.fillRect(x + 2 + (h >>> (i * 5)) % 26, y + 10 + (h >>> (i * 4 + 2)) % 18, 3 + i % 2, 3);
    c.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 0; i < 2; i++) c.fillRect(x + 3 + (h >>> (i * 6 + 1)) % 24, y + 12 + (h >>> (i * 3 + 4)) % 16, 3, 2);
    if (open) { c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x, y, TS + 1, 4); }
    if (!(tx > 0 && this.g[ty][tx - 1] === 1)) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y, 3, TS + 1); }
    if (!(tx < this.cols - 1 && this.g[ty][tx + 1] === 1)) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + TS - 2, y, 3, TS + 1); }
    if (!open) {
      const tg = c.createLinearGradient(0, y, 0, y + 10); tg.addColorStop(0, shade(sp.pal.top, .22)); tg.addColorStop(1, sp.pal.top);
      c.fillStyle = tg; c.beginPath(); c.roundRect(x, y - 1, TS + 1, 11, [4, 4, 0, 0]); c.fill();
      c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, y + 10, TS + 1, 2);
      c.fillStyle = sp.pal.top;
      if (wi < 2) { for (let k = 0; k < 5; k++) { const bx = x + (h >>> (k * 3)) % 28; c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + 1, y - 4 - k % 3); c.lineTo(bx + 3, y); c.fill(); } if (h % 7 === 0) { c.fillStyle = h % 2 ? '#fff' : '#ffd54a'; c.beginPath(); c.arc(x + 6 + h % 20, y - 3, 2, 0, 7); c.fill(); } }
      else if (wi === 3) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 8 + h % 8, y + 2, 7, Math.PI, 0); c.arc(x + 22, y + 2, 6, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(160,200,235,.6)'; c.fillRect(x + 4, y + 9, 3, 5 + h % 5); c.fillRect(x + 20, y + 9, 3, 4 + h % 6); }
      else if (wi === 2) { c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(x + 4, y + 3, 14, 2); c.fillRect(x + 14, y + 6, 12, 1.5); }
      else if (wi === 4) { c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + 10, y + 8); c.lineTo(x + 8, y + 12); c.stroke(); }
      else if (wi === 5) { c.fillStyle = `rgba(255,${100 + (h % 80)},30,${.5 + .3 * Math.sin(this.animT * 3 + tx)})`; c.fillRect(x + 4 + h % 12, y + 3, 10, 2); }
    }
    if (ty < ROWS - 1 && this.g[ty + 1][tx] === 0) { c.fillStyle = shade(sp.pal.dirt, -.2); c.beginPath(); c.moveTo(x + 4, y + TS); c.lineTo(x + 14, y + TS + 8 + h % 12); c.lineTo(x + 24, y + TS); c.fill(); }
  }

  draw(c) {
    const sp = this.sp, cam = this.cam, p = this.p, wi = this.wi, tt = this.animT;
    drawScenery(c, wi, this.room ? this.roomSp : sp, cam, tt, VW, VH);
    c.fillStyle = PIT[wi]; c.beginPath(); c.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 20) c.lineTo(x, VH - 20 + Math.sin(tt * 3 + (x + cam) * .05) * 4);
    c.lineTo(VW, VH); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 0; x <= VW; x += 36) c.fillRect(x + Math.sin(tt * 2 + x) * 6, VH - 14 + ((x / 36) % 3) * 4, 14 + (x * 7) % 12, 2);
    const shx = this.shake > 0 ? Math.round((Math.random() - .5) * this.shake * 26) : 0, shy = this.shake > 0 ? Math.round((Math.random() - .5) * this.shake * 18) : 0;
    c.save(); c.translate(-Math.floor(cam) + shx, shy);
    const tx0 = Math.floor(cam / TS), tx1 = Math.min(this.cols - 1, tx0 + 31);
    for (let ty = 0; ty < ROWS; ty++) for (let tx = tx0; tx <= tx1; tx++) { const v = this.g[ty][tx]; if (v) this.drawTile(c, v, tx, ty); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const em = (t, x, y, s) => { c.font = EMF(s); c.fillStyle = '#000'; c.fillText(t, x, y); };
    for (const s of this.springs) { const q = s.sq > 0 ? 4 : 0; c.fillStyle = '#c9cbe0'; c.fillRect(s.x + 3, s.y + 6, 22, 4); c.strokeStyle = '#9094b4'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s.x + 6, s.y + 10); c.lineTo(s.x + 11, s.y + 6 + q); c.lineTo(s.x + 17, s.y + 10); c.lineTo(s.x + 22, s.y + 6 + q); c.stroke(); const sg = c.createLinearGradient(0, s.y, 0, s.y + 8); sg.addColorStop(0, '#7af2b0'); sg.addColorStop(1, '#1fae60'); c.fillStyle = sg; c.beginPath(); c.roundRect(s.x, s.y + q, s.w, 8 - q, 4); c.fill(); }
    for (const m of this.movers) { const mg = c.createLinearGradient(0, m.y, 0, m.y + m.h); mg.addColorStop(0, shade(PLAT[wi][0], .2)); mg.addColorStop(1, shade(PLAT[wi][0], -.2)); c.beginPath(); c.roundRect(m.x, m.y, m.w, m.h, 6); c.fillStyle = mg; c.fill(); c.fillStyle = PLAT[wi][1]; c.beginPath(); c.roundRect(m.x, m.y, m.w, 5, [6, 6, 0, 0]); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(m.x + .5, m.y + .5, m.w - 1, m.h - 1, 6); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; for (let u = 10; u < m.w - 6; u += 18) c.fillRect(m.x + u, m.y + m.h - 6, 8, 2); }
    for (const f of this.fire) if (f.y != null) em('🔥', f.x, f.y, 28);
    for (const w of this.warn) { c.globalAlpha = .6 + .4 * Math.sin(tt * 20); em('⚠️', w.x + 13, 66, 26); c.globalAlpha = 1; }
    for (const k of this.rocks) em('🪨', k.x + 13, k.y + 13, 30);
    if (!this.room) em('🏁', this.flagX + 16, this.flagY - 20, 40);
    for (const dd of this.doors) this.drawDoor(c, dd, em, tt);
    for (const k of this.pick) { if (k.x < cam - 40 || k.x > cam + VW + 40) continue; if (k.k !== 's') { c.globalAlpha = .22 + .1 * Math.sin(tt * 5 + k.x); c.fillStyle = k.k === 'o' ? '#ffd54a' : '#fff6c8'; c.beginPath(); c.arc(k.x, k.y, k.k === 'm' ? 28 : 15, 0, 7); c.fill(); c.globalAlpha = 1; } em({ s: '🌙', o: '🪙', m: '🌕', c: '🎁', b: '🔔', r: '💎' }[k.k], k.x, k.y + Math.sin(tt * 4 + k.x) * 3, k.k === 'm' ? 38 : 20); }
    for (const d of this.drops) em(d.d.e, d.x, d.y + Math.sin(tt * 5) * 4, 28);
    for (const e of this.ent) {
      if (e.x < cam - 60 || e.x > cam + VW + 60) continue;
      const sw = e.t.b === 'swarm', fly = e.t.b === 'fly', sz = sw ? 26 : 38, cx = e.x + e.w / 2;
      if (!fly && e.on) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(cx, e.y + e.h + 1, e.w * .6, 3.4, 0, 0, 7); c.fill(); }
      if (!drawCreature(c, crKey(e.t, this.wi), cx, fly ? e.y + e.h / 2 : e.y + e.h - 17 * sz / 40 + 1, sz, e.d, tt * 10 + e.ph * 3, { air: !e.on && !fly, hurt: e.fl > 0 })) { c.globalAlpha = e.fl > 0 ? .5 : 1; em(e.t.e, cx, e.y + e.h / 2, e.t.sz || 30); c.globalAlpha = 1; }
    }
    for (const s of this.shots) em('🌙', s.x, s.y, 16);
    for (const k of this.eshots) em(k.e || '⚫', k.x + 6, k.y + 6, 18);
    for (const e of this.ent) if (e.t.x === 'spiky') { c.fillStyle = '#e33'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(e.x + 2 + i * 8, e.y + 2); c.lineTo(e.x + 6 + i * 8, e.y - 7); c.lineTo(e.x + 10 + i * 8, e.y + 2); c.fill(); } }
    if (p.on) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(p.x + 11, p.y + p.h + 1, 12, 3.5, 0, 0, 7); c.fill(); }
    if (p.inv <= 0 || Math.floor(p.inv * 12) % 2) drawCat(c, p.x + p.w / 2, p.y + p.h / 2 + 2, 42, p.face, tt * 10, { run: Math.abs(p.vx) > 30 && p.on, air: !p.on }, PAL.luna);
    if (this.ghost && !this.room) {
      const a = this.ghost, f = this.t / .1, i = Math.floor(f), u = f - i;
      if ((i + 1) * 3 + 2 < a.length) { c.globalAlpha = .4; drawCat(c, a[i * 3] + (a[i * 3 + 3] - a[i * 3]) * u + 11, a[i * 3 + 1] + (a[i * 3 + 4] - a[i * 3 + 1]) * u + 17, 42, a[i * 3 + 2] ? 1 : -1, tt * 10, { run: true, nolook: true }, PAL.luna); c.globalAlpha = 1; }
    }
    if (p.swing > 0) { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.beginPath(); c.arc(p.x + 11 + p.face * 14, p.y + 15, 26, p.face > 0 ? -1 : Math.PI - 1, p.face > 0 ? 1 : Math.PI + 1); c.stroke(); }
    for (const q of this.parts) { c.globalAlpha = Math.max(0, q.l / q.m); c.fillStyle = q.c; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }
    c.globalAlpha = 1;
    for (const f of this.fx) { c.globalAlpha = Math.min(1, f.t * 2); c.fillStyle = f.c; c.font = 'bold 18px sans-serif'; c.fillText(f.txt, f.x + 12, f.y); }
    c.globalAlpha = 1; c.restore();
    if (!PREFS.saver) { drawWeather(c, this.room ? 'none' : sp.weather, tt, VW, VH); drawVignette(c, VW, VH); }
    this.drawAtmos(c, sp, tt, cam);
    if (sp.mods.includes('dark')) this.drawDark(c);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade * 2.2)})`; c.fillRect(0, 0, VW, VH); }

    const hp = Math.max(0, p.hp), hw = 20 + hp * 26 + (p.sh ? 40 : 0);
    glassRect(c, 10, 8, hw, 34, 17);
    c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = EMF(20);
    c.fillText('❤️'.repeat(hp) + (p.sh ? ' 🛡️' + p.sh : ''), 20, 26);
    const tl = '⏱ ' + Math.ceil(this.time) + 's', nm = this.room ? '🚪 Geheimraum' : sp.name;
    c.font = 'bold 22px "Trebuchet MS",sans-serif'; const cw = Math.max(c.measureText(tl).width + 28, 96);
    glassRect(c, VW / 2 - cw / 2, 6, cw, 34, 17, this.time < 15 ? 'rgba(160,30,40,.6)' : null);
    c.textAlign = 'center'; c.fillStyle = this.time < 15 ? '#ffb0b0' : '#fff'; c.fillText(tl, VW / 2, 24);
    c.font = 'bold 14px "Trebuchet MS",sans-serif'; const nw = c.measureText(nm).width + 26;
    glassRect(c, VW / 2 - nw / 2, 44, nw, 22, 11, 'rgba(26,14,58,.42)'); c.fillStyle = '#ffe9a8'; c.fillText(nm, VW / 2, 56);
    const cs = '🪙 ' + this.coins + '  🌙 ' + this.shards + (this.moon ? ' 🌕' : '');
    c.font = 'bold 20px "Trebuchet MS",sans-serif'; const sw2 = c.measureText(cs).width + 30;
    glassRect(c, VW - 70 - sw2, 8, sw2, 34, 17);
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.fillText(cs, VW - 85, 25);
    if (save.load.length) { glassRect(c, 10, 48, 18 + save.load.length * 28, 30, 15, 'rgba(26,14,58,.45)'); c.textAlign = 'left'; c.font = EMF(18); c.fillText(save.load.map(i => ITEM[i].e).join(' '), 20, 64); }
    if (this.msgT > 0) { c.font = 'bold 20px "Trebuchet MS",sans-serif'; const mw = c.measureText(this.msg).width + 36; glassRect(c, VW / 2 - mw / 2, 76, mw, 32, 16); c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(this.msg, VW / 2, 93); }
    if (this.pan > 0) this.drawIntro(c);
  }


  drawDoor(c, d, em, tt) {
    if (d.type !== 'pipe') {
      const ex = d.type === 'exit', base = ex ? '#2a6b4a' : '#7a4b2a', lite = ex ? '#4fb98a' : '#b27440';
      c.globalAlpha = d.used ? .35 : 1;
      if (!d.used) { c.fillStyle = ex ? 'rgba(120,255,190,.18)' : 'rgba(255,224,138,.2)'; c.beginPath(); c.ellipse(d.x + d.w / 2, d.y + d.h / 2, d.w, d.h * .8, 0, 0, 7); c.fill(); }
      const dg = c.createLinearGradient(d.x, d.y, d.x + d.w, d.y); dg.addColorStop(0, shade(base, -.15)); dg.addColorStop(.5, lite); dg.addColorStop(1, shade(base, -.15));
      c.beginPath(); c.roundRect(d.x, d.y, d.w, d.h, [d.w / 2, d.w / 2, 3, 3]); c.fillStyle = dg; c.fill();
      c.strokeStyle = '#2a160a'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(d.x + d.w / 2, d.y + 6); c.lineTo(d.x + d.w / 2, d.y + d.h); c.stroke();
      c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(d.x + d.w - 9, d.y + d.h / 2 + 4, 3, 0, 7); c.fill();
      em(ex ? '🌿' : '🌙', d.x + d.w / 2 - 2, d.y + d.h / 2 - 8, 16); c.globalAlpha = 1;
    }
    if (d.used) return;
    if (Math.abs(this.p.x - d.x) < 140 && Math.abs(this.p.y - d.y) < 130) em('⬇️', d.x + d.w / 2, d.y - 16 + Math.sin(tt * 6) * 4, 22);
    else if (d.type !== 'exit') { c.globalAlpha = .4 + .4 * Math.sin(tt * 3 + d.x); em('✨', d.x + d.w / 2, d.y - 8, 16); c.globalAlpha = 1; }
  }

  drawAtmos(c, sp, tt, cam) {
    if (PREFS.saver || this.room) return;
    if (sp.kind === 'storm') {
      const ph = (tt * .33 + sp.ph) % 1, fl = ph < .07 ? 1 - ph / .07 : 0;
      if (fl > 0) {
        c.fillStyle = `rgba(255,255,255,${fl * .45})`; c.fillRect(0, 0, VW, VH);
        const bx = 120 + (Math.floor(tt * .33 + sp.ph) * 397) % 720; c.strokeStyle = `rgba(255,255,230,${fl})`; c.lineWidth = 3; c.beginPath();
        let x = bx, y = 40; c.moveTo(x, y); for (let i = 0; i < 7; i++) { x += ((i * 53 + bx) % 40) - 20; y += 55; c.lineTo(x, y); } c.stroke();
        if (!this.lflash) { this.lflash = true; snd('thunder'); }
      } else this.lflash = false;
    }
    if (sp.kind === 'night' || sp.mods.includes('dark')) {
      for (let i = 0; i < 16; i++) {
        const x = (((i * 173 - cam * .35 + Math.sin(tt * .6 + i) * 40) % VW) + VW) % VW, y = 180 + (i * 97) % 260 + Math.sin(tt * .9 + i * 2) * 18, a = Math.max(0, .35 + .45 * Math.sin(tt * 2.2 + i * 1.7));
        c.globalAlpha = a; c.fillStyle = '#e8ff7a'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); c.globalAlpha = a * .25; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  drawDark(c) {
    if (!this.dk) { this.dk = document.createElement('canvas'); this.dk.width = VW; this.dk.height = VH; }
    const d = this.dk.getContext('2d'), px = this.p.x + 11 - this.cam, py = this.p.y + 15, R = 190;
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, VW, VH); d.fillStyle = 'rgba(2,3,20,.93)'; d.fillRect(0, 0, VW, VH);
    const gr = d.createRadialGradient(px, py, 25, px, py, R); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.globalCompositeOperation = 'destination-out'; d.fillStyle = gr; d.beginPath(); d.arc(px, py, R, 0, 7); d.fill();
    c.drawImage(this.dk, 0, 0);
  }

  drawIntro(c) {
    const a = Math.min(1, (1 - this.pan / 2.8) * 5) * Math.min(1, this.pan * 3), sp = this.sp;
    c.fillStyle = '#000'; c.fillRect(0, 0, VW, 54 * a); c.fillRect(0, VH - 54 * a, VW, 54 * a);
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.font = 'bold 40px "Trebuchet MS",sans-serif'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 7; c.fillStyle = '#fff';
    const t = `${this.Wd.name} ${this.li + 1}: ${sp.name}`; c.strokeText(t, VW / 2, VH / 2 - 30); c.fillText(t, VW / 2, VH / 2 - 30);
    const s = [STYLE_TXT[sp.style], ...sp.mods.map(m => MOD_TXT[m])].filter(Boolean).join(' · ');
    c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffd54a'; c.lineWidth = 5; c.strokeText(s, VW / 2, VH / 2 + 14); c.fillText(s, VW / 2, VH / 2 + 14);
    c.font = '16px sans-serif'; c.fillStyle = '#fff'; c.fillText('Tippen zum Überspringen', VW / 2, VH - 27);
    c.globalAlpha = 1;
  }
}
