// Weltkarte im Super-Mario-World-Stil: Landmasse, Strasse, Levelpunkte, Festungen, Laeden, laufende Katze.
const MW = 960, MH = 544, K = 1.5;
const MAPTH = [
  { sea: '#4aa8e0', land: '#8ed36b', edge: '#4f9a44', road: '#f3e0a8', patch: '#7bc65b', deco: ['🌳', '🌳', '🌷', '🍄', '🌼', '🌳'] },
  { sea: '#2a8aa8', land: '#4fb861', edge: '#2b8441', road: '#e2cf96', patch: '#3da352', deco: ['🌴', '🌴', '🌺', '🦜', '🌿', '🌴'] },
  { sea: '#6fc4e0', land: '#f1d28a', edge: '#c29a4c', road: '#fff2cf', patch: '#e8c273', deco: ['🌵', '🌵', '🐪', '🏜️', '🪨', '🌵'] },
  { sea: '#5fa4de', land: '#f2f8ff', edge: '#9fc0dc', road: '#cfe6fa', patch: '#d7e8f6', deco: ['🌲', '⛄', '🌲', '🧊', '❄️', '🌲'] },
  { sea: '#7587b0', land: '#b3b8c9', edge: '#767c94', road: '#ece4d2', patch: '#a2a8bd', deco: ['⛰️', '🏔️', '🪨', '🌲', '⛰️', '🏔️'] },
  { sea: '#e8541c', land: '#5b4040', edge: '#2b1616', road: '#f7b873', patch: '#6d4a4a', deco: ['🌋', '🔥', '🪨', '💀', '🔥', '🌋'] },
  { sea: '#8ec8ff', land: '#fafcff', edge: '#b8cdf0', road: '#ffe9b0', patch: '#e8f0ff', deco: ['☁️', '🌈', '⭐', '🪁', '🕊️', '☁️'] },
];
const mp = document.getElementById('mp'), mx = mp.getContext('2d');
mp.width = MW * K; mp.height = MH * K;
let MV = null, mapTok = 0;

function layout(wi) {
  const N = nodes(wi), M = N.length, c = Math.ceil(M / 3), r = rng(wi * 77 + 5), ys = [120, 282, 440], P = [];
  for (let k = 0; k < M; k++) {
    const row = Math.floor(k / c), i = k % c, dir = row % 2 ? -1 : 1, end = i === 0 || i === c - 1;
    P.push({ x: dir > 0 ? 100 + i * (760 / (c - 1)) : 860 - i * (760 / (c - 1)), y: ys[row] + (end ? 0 : (r() - .5) * 40) });
  }
  const shops = [];
  for (const base of [.22, .68]) {
    let h = Math.floor(M * base);
    while (N[h].t !== 'lv' || h % c === 0 || h % c === c - 1) h++;
    const row = Math.floor(h / c);
    shops.push({ host: h, x: P[h].x, y: P[h].y + (row === 0 ? 66 : -66) });
  }
  return { P, M, N, shops, c };
}

function segDist(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l));
  return Math.hypot(px - a.x - t * dx, py - a.y - t * dy);
}

function renderBG(wi, L) {
  const T = MAPTH[wi], r = rng(wi * 131 + 9), cn = document.createElement('canvas');
  cn.width = MW * K; cn.height = MH * K;
  const c = cn.getContext('2d'); c.scale(K, K);
  { const sg = c.createRadialGradient(MW / 2, MH / 2, 80, MW / 2, MH / 2, MW * .62); sg.addColorStop(0, shade(T.sea, .16)); sg.addColorStop(1, shade(T.sea, -.22)); c.fillStyle = sg; c.fillRect(0, 0, MW, MH); }
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2;
  for (let i = 0; i < 46; i++) { const x = r() * MW, y = r() * MH; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 6, x + 20, y); c.stroke(); }
  const land = new Path2D();
  for (let a = 0; a <= 6.35; a += .08) {
    const k = 1 + .04 * Math.sin(a * 3 + wi) + .03 * Math.sin(a * 5 + 1.3 * wi) + .02 * Math.sin(a * 9),
      co = Math.cos(a), si = Math.sin(a), x = 480 + 452 * Math.sign(co) * Math.sqrt(Math.abs(co)) * k, y = 284 + 240 * Math.sign(si) * Math.sqrt(Math.abs(si)) * k;
    a === 0 ? land.moveTo(x, y) : land.lineTo(x, y);
  }
  land.closePath();
  c.save(); c.lineJoin = 'round'; c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 54; c.stroke(land); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 30; c.stroke(land); c.restore();
  c.fillStyle = T.edge; c.save(); c.translate(0, 10); c.fill(land); c.restore();
  { const lg = c.createLinearGradient(0, 40, 0, MH); lg.addColorStop(0, shade(T.land, .16)); lg.addColorStop(1, shade(T.land, -.08)); c.fillStyle = lg; c.fill(land); }
  c.save(); c.clip(land); c.fillStyle = T.patch; c.globalAlpha = .55;
  for (let i = 0; i < 28; i++) { c.beginPath(); c.arc(r() * MW, r() * MH, 20 + r() * 55, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 30; c.stroke(land);
  // Akt-Regionen: weiche Farbfelder je Drittel der Welt
  const nact = i => i < L.M - 1 ? actOf(wi, L.N[i].t === 'lv' ? L.N[i].i : Math.floor(W[wi].n / 2)) : 2, cen = [0, 1, 2].map(a => { const q = L.P.filter((_, i) => nact(i) === a); return { x: q.reduce((s, p) => s + p.x, 0) / q.length, y: q.reduce((s, p) => s + p.y, 0) / q.length }; });
  cen.forEach((q, a) => { const pc = PALS[wi][a].top, g = c.createRadialGradient(q.x, q.y, 20, q.x, q.y, 300); g.addColorStop(0, shade(pc, a ? -.05 : .1)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = .38; c.fillStyle = g; c.fillRect(0, 0, MW, MH); c.globalAlpha = 1; });
  c.restore(); c.lineWidth = 5; c.strokeStyle = T.edge; c.stroke(land);
  c.save(); c.setLineDash([3, 10]); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke(land); c.restore();

  const segs = []; for (let k = 0; k < L.M - 1; k++) segs.push([L.P[k], L.P[k + 1]]);
  for (const s of L.shops) segs.push([L.P[s.host], s]);
  const pts = [...L.P, ...L.shops], dec = [], lakes = [];
  mx.setTransform(1, 0, 0, 1, 0, 0);
  cn.sea = []; for (let i = 0; i < 300 && cn.sea.length < 46; i++) { const x = r() * MW, y = r() * MH; if (!mx.isPointInPath(land, x, y)) cn.sea.push({ x, y, ph: r() * 6 }); }
  for (let i = 0; i < 200 && lakes.length < 2; i++) {
    const x = 120 + r() * (MW - 240), y = 90 + r() * (MH - 180), rx = 26 + r() * 22, ry = rx * .55;
    if (!mx.isPointInPath(land, x, y) || !mx.isPointInPath(land, x + rx, y) || !mx.isPointInPath(land, x - rx, y)) continue;
    if (segs.some(([a, b]) => segDist(x, y, a, b) < rx + 26) || pts.some(q => Math.hypot(q.x - x, q.y - y) < rx + 56) || lakes.some(l => Math.hypot(l.x - x, l.y - y) < 120)) continue;
    lakes.push({ x, y, rx, ry });
  }
  for (let i = 0; i < 400 && dec.length < 80; i++) {
    const x = 30 + r() * (MW - 60), y = 50 + r() * (MH - 80);
    if (!mx.isPointInPath(land, x, y) || lakes.some(l => Math.hypot(l.x - x, (l.y - y) * 1.8) < l.rx + 22)) continue;
    if (segs.some(([a, b]) => segDist(x, y, a, b) < 34) || pts.some(p => Math.hypot(p.x - x, p.y - y) < 52)) continue;
    let nn = 0, nd = 1e9; L.P.forEach((p, i) => { const dd = Math.hypot(p.x - x, p.y - y); if (dd < nd) { nd = dd; nn = i; } });
    dec.push({ x, y, e: T.deco[(Math.floor(r() * 3) + nact(nn) * 2) % T.deco.length], s: 20 + r() * 16 });
  }
  dec.sort((a, b) => a.y - b.y); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const lk of lakes) { const lg = c.createRadialGradient(lk.x - lk.rx * .3, lk.y - lk.ry * .4, 4, lk.x, lk.y, lk.rx); lg.addColorStop(0, shade(T.sea, .3)); lg.addColorStop(1, T.sea); c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(lk.x, lk.y + 4, lk.rx + 4, lk.ry + 4, 0, 0, 7); c.fill(); c.fillStyle = lg; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.ellipse(lk.x, lk.y, lk.rx, lk.ry, 0, 0, 7); c.fill(); c.stroke(); }
  for (const d of dec) { c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(d.x, d.y + d.s * .38, d.s * .42, d.s * .14, 0, 0, 7); c.fill(); c.fillStyle = '#000'; c.font = d.s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.fillText(d.e, d.x, d.y); }

  cn.crit = [];
  for (let i = 0; i < 300 && cn.crit.length < 5; i++) {
    const x = 40 + r() * (MW - 80), y = 70 + r() * (MH - 110); if (!mx.isPointInPath(land, x, y)) continue;
    if (segs.some(([a, b]) => segDist(x, y, a, b) < 44) || pts.some(p => Math.hypot(p.x - x, p.y - y) < 60)) continue;
    const en = W[wi].enemies.filter(e => e.b !== 'fly'); cn.crit.push({ x, y, n: en[Math.floor(r() * en.length)].n, ph: r() * 6 });
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  cen.forEach((q, a) => { const nm = 'Akt ' + ['I', 'II', 'III'][a] + ' · ' + ACTS[wi][a].n; c.font = 'bold 14px "Trebuchet MS",sans-serif'; const w = c.measureText(nm).width + 26, ry = Math.min(...L.P.filter((_, i) => nact(i) === a).map(p => p.y)); glassRect(c, q.x - w / 2, ry - 62, w, 26, 13, 'rgba(26,14,58,.5)'); c.fillStyle = '#ffe9a8'; c.fillText(nm, q.x, ry - 49); });
  c.lineCap = c.lineJoin = 'round';
  const road = (p, w) => { c.beginPath(); p.forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)); c.lineWidth = w; c.stroke(); };
  c.save(); c.translate(0, 4); c.strokeStyle = 'rgba(0,0,0,.2)'; road(L.P, 25); for (const s of L.shops) road([L.P[s.host], s], 19); c.restore();
  c.strokeStyle = T.edge; road(L.P, 22); for (const s of L.shops) road([L.P[s.host], s], 16);
  c.strokeStyle = T.road; road(L.P, 15); for (const s of L.shops) road([L.P[s.host], s], 9);
  c.strokeStyle = shade(T.road, .45); c.globalAlpha = .6; road(L.P, 4); c.globalAlpha = 1;
  c.setLineDash([2, 12]); c.strokeStyle = shade(T.road, -.2); road(L.P, 2); for (const s of L.shops) road([L.P[s.host], s], 2); c.setLineDash([]);
  return cn;
}

function mapOpen(wi, opt) {
  opt = opt || {};
  const L = layout(wi), pr = save.prog[wi];
  const at = opt.shop != null ? { k: L.shops[opt.shop].host, shop: opt.shop } : { k: Math.min(opt.from != null ? opt.from : pr, L.M - 1), shop: null };
  const p0 = at.shop != null ? L.shops[at.shop] : L.P[at.k];
  MV = { wi, L, bg: renderBG(wi, L), t: 0, at, x: p0.x, y: p0.y, face: 1, wp: [], dest: null, moving: false };
  MV.sea = MV.bg.sea; MV.crit = MV.bg.crit; if (opt.advance && at.k + 1 < L.M && at.k + 1 <= pr) MV.pop = { k: at.k + 1, t0: 0 };
  document.getElementById('mw').style.background = MAPTH[wi].sea;
  const tok = ++mapTok; let last = performance.now();
  const loop = ts => {
    if (tok !== mapTok || mode !== 'map') return;
    mupdate(Math.min(.05, (ts - last) / 1000)); last = ts; mdraw(); requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if (opt.advance && at.k + 1 < L.M && at.k + 1 <= pr) mvGo({ k: at.k + 1 }); else arrive(shopDest(at));
}
const shopDest = at => at.shop != null ? { shop: at.shop } : { k: at.k };

function mvGo(target) {
  const L = MV.L, a = MV.at, pts = []; let k = a.k;
  closePop();
  if (a.shop != null) pts.push(L.P[k]);
  const tk = target.shop != null ? L.shops[target.shop].host : target.k;
  while (k !== tk) { k += tk > k ? 1 : -1; pts.push(L.P[k]); }
  if (target.shop != null) pts.push(L.shops[target.shop]);
  MV.wp = pts.map(p => ({ x: p.x, y: p.y })); MV.dest = target;
  MV.at = { k: tk, shop: target.shop != null ? target.shop : null };
  if (!MV.wp.length) arrive(target);
}

function mupdate(dt) {
  MV.t += dt;
  if (!MV.wp.length) { MV.moving = false; return; }
  MV.moving = true;
  const w = MV.wp[0], dx = w.x - MV.x, dy = w.y - MV.y, d = Math.hypot(dx, dy), st = 270 * dt;
  if (dx) MV.face = dx > 0 ? 1 : -1;
  if (d <= st) { MV.x = w.x; MV.y = w.y; MV.wp.shift(); if (!MV.wp.length) { MV.moving = false; arrive(MV.dest); } }
  else { MV.x += dx / d * st; MV.y += dy / d * st; }
}

function mdraw() {
  const c = mx, t = MV.t, L = MV.L, wi = MV.wi, pr = save.prog[wi], Wd = W[wi];
  c.setTransform(K, 0, 0, K, 0, 0); c.drawImage(MV.bg, 0, 0, MW, MH);
  const font = s => { c.font = s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.fillStyle = '#000'; };
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (wi === 5) { c.fillStyle = `rgba(255,110,0,${.06 + .05 * Math.sin(t * 2)})`; c.fillRect(0, 0, MW, MH); }
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
  for (const s of MV.sea) { c.globalAlpha = .1 + .22 * Math.max(0, Math.sin(t * 1.5 + s.ph)); c.beginPath(); c.moveTo(s.x - 11, s.y); c.quadraticCurveTo(s.x, s.y - 5 + Math.sin(t * 2 + s.ph) * 3, s.x + 11, s.y); c.stroke(); }
  c.globalAlpha = 1;
  for (let i = 0; i < Math.min(5, MV.sea.length); i++) {
    const s = MV.sea[i], ph = (t * .45 + s.ph) % 4;
    if (ph < 1) { const fx = s.x + ph * 44 - 22, fy = s.y - Math.sin(ph * Math.PI) * 22; font(15); c.save(); c.translate(fx, fy); c.rotate((ph - .5) * 1.6); c.fillText('🐟', 0, 0); c.restore(); if (ph < .2 || ph > .85) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(ph < .5 ? s.x - 22 : s.x + 22, s.y + 3, 6 + ph * 5, 2.5, 0, 0, 7); c.stroke(); } }
  }
  if (MV.sea.length) {
    const s = MV.sea[0], bx = s.x + Math.sin(t * .35) * 50, by = s.y + Math.sin(t * 1.6) * 2;
    c.save(); c.translate(bx, by); c.rotate(Math.sin(t * 1.6) * .06);
    _p(c, [[-14, 0], [14, 0], [10, 8], [-10, 8]], '#8a5a2a', '#4a2a10', 1.4); _l(c, [[0, 0], [0, -26]], '#4a2a10', 1.6); _p(c, [[1, -25], [1, -3], [15, -3]], '#fff', '#9ab', 1.2); _p(c, [[-1, -20], [-1, -4], [-10, -4]], '#ffe6a8', '#9ab', 1.2);
    c.restore();
  }
  for (let i = 0; i < 3; i++) { const x = (t * 10 + i * 380) % 1200 - 120, y = 90 + i * 150; c.fillStyle = 'rgba(0,0,0,.06)'; c.beginPath(); c.ellipse(x + 26, y + 38, 62, 17, 0, 0, 7); c.ellipse(x + 52, y + 28, 36, 14, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x, y, 60, 18, 0, 0, 7); c.ellipse(x + 30, y - 10, 36, 16, 0, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(30,30,50,.7)'; c.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const bx = (t * 42 + i * 420) % 1200 - 120, by = 70 + i * 100 + Math.sin(t * 3 + i) * 8, w = Math.sin(t * 10 + i) * 4; c.beginPath(); c.moveTo(bx - 9, by); c.quadraticCurveTo(bx - 4, by - 6 + w, bx, by); c.quadraticCurveTo(bx + 4, by - 6 + w, bx + 9, by); c.stroke(); }
  const col = { ok: '#3fd16f', cur: '#ff5c7a', lock: '#8c8f9e' };
  L.N.forEach((nd, k) => {
    const p = L.P[k], st = k < pr ? 'ok' : k === pr ? 'cur' : 'lock', bob = Math.sin(t * 3 + k) * (st === 'cur' ? 2 : 0);
    const pu = MV.pop && MV.pop.k === k ? clamp((t - MV.pop.t0) / .8, 0, 1) : 1;
    if (pu < 1) { const sc = pu < .6 ? pu / .6 * 1.35 : 1.35 - (pu - .6) / .4 * .35; c.save(); c.translate(p.x, p.y); c.scale(sc, sc); c.translate(-p.x, -p.y); c.strokeStyle = `rgba(255,224,102,${1 - pu})`; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, 20 + pu * 40, 0, 7); c.stroke(); }
    if (st === 'cur') { c.strokeStyle = `rgba(255,75,75,${.55 - .3 * Math.sin(t * 5)})`; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, 24 + 3 * Math.sin(t * 5), 0, 7); c.stroke(); }
    c.globalAlpha = st === 'lock' ? .82 : 1;
    if (nd.t === 'boss') {
      font(60); c.fillText('🏰', p.x, p.y - 8 + bob); if (!drawCreature(c, Wd.boss.n, p.x, p.y - 40 + bob, 38, -1, t * 10, {})) { font(26); c.fillText(Wd.boss.e, p.x, p.y - 38 + bob); }
    } else {
      const r = nd.t === 'mini' ? 23 : 17;
      const oy = p.y + bob; c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x, p.y + r * .95, r * .9, r * .28, 0, 0, 7); c.fill();
      const og = c.createRadialGradient(p.x - r * .35, oy - r * .45, r * .1, p.x, oy, r * 1.15); og.addColorStop(0, shade(col[st], .55)); og.addColorStop(.5, col[st]); og.addColorStop(1, shade(col[st], -.35));
      c.fillStyle = og; c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, oy, r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(p.x - r * .2, oy - r * .5, r * .5, r * .26, -.5, 0, 7); c.fill();
      if (nd.t === 'mini') { if (!drawCreature(c, Wd.mini.n, p.x, p.y + 2 + bob, 36, 1, t * 10, {})) { font(28); c.fillText(Wd.mini.e, p.x, p.y + 1 + bob); } }
      else { c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 3; c.font = 'bold 16px "Trebuchet MS",sans-serif'; c.fillText(nd.i + 1, p.x, p.y + 1 + bob); c.shadowBlur = 0; }
    }
    c.globalAlpha = 1;
    if (nd.t === 'lv' && MOONLV.includes(nd.i) && !save.moons[wi + ':' + nd.i]) { font(15); c.fillText('🌕', p.x + 17, p.y - 19); }
    if (nd.t === 'lv' && nd.i === 4 && (save.bells || {})[wi]) { font(15); c.fillText('🔔', p.x - 17, p.y - 19); }
    { const bm = nd.t === 'lv' && (save.best || {})[wi + ':' + nd.i]; if (bm) { font(13); c.fillText(MEDAL[bm.m], p.x - 17, p.y + 19); } }
    { const rk = nd.t === 'lv' && (save.rank || {})[wi + ':' + nd.i]; if (rk) { c.font = 'bold 14px "Trebuchet MS",sans-serif'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(rk, p.x + 18, p.y + 20); c.fillStyle = RCOL[rk]; c.fillText(rk, p.x + 18, p.y + 20); } }
    if (pu < 1) c.restore();
  });
  L.shops.forEach((s, si) => {
    const lock = s.host > pr; c.globalAlpha = lock ? .55 : 1; glassRect(c, s.x - 28, s.y - 27, 56, 54, 18, 'rgba(26,14,58,.35)'); font(36); c.fillText('🏪', s.x, s.y + Math.sin(t * 2 + s.x) * 1.5);
    c.save(); c.translate(s.x + 26, s.y + 10); c.rotate(Math.sin(t * 5 + si) * .28); font(18); c.fillText(SHOPS[wi][si].o, 0, 0); c.restore();
    font(15); c.fillText(lock ? '🔒' : '🪙', s.x + 20, s.y - 18); c.globalAlpha = 1;
  });
  for (const k of MV.crit || []) { const hop = Math.pow(Math.max(0, Math.sin(t * 1.3 + k.ph)), 3) * 9; drawCreature(c, k.n, k.x, k.y - hop, 24, Math.sin(t * .2 + k.ph) > 0 ? 1 : -1, t * 10 + k.ph, {}); }
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(MV.x, MV.y + 6, 15, 5, 0, 0, 7); c.fill();
  if (wi === 5) { c.fillStyle = 'rgba(255,120,30,.55)'; for (let i = 0; i < 14; i++) { const ex = (i * 173 + Math.sin(t + i) * 24) % MW, ey = MH - ((i * 61 + t * 38) % MH); c.fillRect(ex, ey, 2.5, 2.5); } }
  const cyc = t % 4, hop = !MV.moving && cyc < .6 ? Math.abs(Math.sin(cyc / .6 * Math.PI)) * 14 : 0;
  drawCat(c, MV.x, MV.y - 14 - hop, 46, MV.face, t * 10, { run: MV.moving, air: hop > 2 }, selPal());
  drawVignette(c, MW, MH);
  const tot = L.M, done = Math.min(pr, tot), bw = 200, bx = 14, by = MH - 44;
  glassRect(c, bx, by, bw, 30, 15);
  c.save(); c.beginPath(); c.roundRect(bx + 8, by + 9, bw - 16, 12, 6); c.clip(); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(bx + 8, by + 9, bw - 16, 12);
  const pg = c.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, '#ffe08a'); pg.addColorStop(1, '#ff9e5c'); c.fillStyle = pg; c.fillRect(bx + 8, by + 9, (bw - 16) * done / tot, 12); c.restore();
  c.font = 'bold 12px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(done + ' / ' + tot, bx + bw / 2, by + 15); c.fillStyle = '#fff'; c.fillText(done + " / " + tot, bx + bw / 2, by + 15);
}

function mapHit(e) {
  const r = mp.getBoundingClientRect(), s = Math.min(r.width / MW, r.height / MH);
  const x = (e.clientX - r.left - (r.width - MW * s) / 2) / s, y = (e.clientY - r.top - (r.height - MH * s) / 2) / s;
  if (!MV) return;
  const L = MV.L, pr = save.prog[MV.wi];
  for (let i = 0; i < L.shops.length; i++) {
    const s2 = L.shops[i];
    if (Math.hypot(s2.x - x, s2.y - y) < 32) return s2.host > pr ? toast('🔒 Der Laden öffnet, wenn du das Level davor geschafft hast') : MV.moving ? 0 : (MV.at.shop === i ? arrive({ shop: i }) : mvGo({ shop: i }));
  }
  for (let k = 0; k < L.M; k++) {
    const p = L.P[k];
    if (Math.hypot(p.x - x, p.y - (L.N[k].t === 'boss' ? y + 12 : y)) < (L.N[k].t === 'boss' ? 40 : 28)) {
      if (k > pr) return toast('🔒 Erst die Level davor schaffen!');
      if (MV.moving) return;
      return MV.at.k === k && MV.at.shop == null ? arrive({ k }) : mvGo({ k });
    }
  }
}
mp.addEventListener('pointerdown', mapHit);
