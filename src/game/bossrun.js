// Hüpf-Bosskampf: der Boss als Jump&Run-Gegner in einer Arena. Auf den Kopf springen, Angriffen ausweichen.
// Nutzt die normale Level-Engine (Run), dadurch geht er auch online zu zweit.
const BOSS_SHOT = ['🌰', '🥥', '🪲', '❄️', '⚡', '🔥', '⭐'];

function bossLevel(wi, kind) {
  const cols = 30, FL = 14, g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Uint8Array(cols));
  for (let c = 0; c < cols; c++) for (let y = FL; y < ROWS; y++) g[y][c] = 1;
  for (let y = 0; y < ROWS; y++) g[y][0] = g[y][cols - 1] = 1;
  for (const [row, a, b] of [[10, 3, 6], [10, 23, 26], [6, 12, 17]]) for (let c = a; c <= b; c++) g[row][c] = 3;
  const sp = { ...levelSpec(wi, W[wi].n - 1), mods: [], wind: 0, name: (kind === 'boss' ? '👑 ' : '⚔️ ') + W[wi][kind].n };
  return { g, cols, spots: [{ x0: 1, x1: cols - 1, y: FL }], gaps: [], sp, springs: [], movers: [], fire: [], doors: [], cps: [], gate: null, keyPos: null, moonPos: null, secret: null, flagX: 1e9, flagY: 0 };
}

Run.prototype.bossInit = function (kind) {
  const B = this.Wd[kind], ng = save.ng || 0, hp = (kind === 'boss' ? 8 : 5) + ng * 2 + (this.coop ? 3 : 0);
  this.bossK = kind; this.pan = 0; this.time = 180 + (this.assist ? 60 : 0);
  this.boss = { B, x: 21 * TS, y: -160, w: 96, h: 96, vx: 0, vy: 0, hp, max: hp, ph: 1, st: 'enter', t: 0, face: -1, inv: 0, hitT: 0, sid: [-1, -1], atk: '', last: '' };
  this.say(`${B.n}: Spring ihm auf den Kopf!`);
};

Run.prototype.bossDmg = function (d) {
  const b = this.boss, cx = b.x + b.w / 2;
  if (b.st === 'die' || b.st === 'enter') return;
  b.hp = Math.max(0, b.hp - d); b.hitT = .15;
  if (d >= 1) { b.inv = .9; this.shake = .35; snd('hit'); this.spark(cx, b.y + 10, 22, '#ffe066'); this.float(cx - 12, b.y - 20, '-1', '#ffd54a'); if (b.st === 'charge') { b.st = 'stun'; b.t = 1.2; } }
  else this.spark(cx, b.y + b.h / 2, 5, '#ffffff');
  if (b.hp <= 0) { b.st = 'die'; b.t = 1.6; this.shake = .8; snd('roar'); this.spark(cx, b.y + b.h / 2, 40, '#fff6c8'); this.eshots = []; return; }
  const r = b.hp / b.max, np = r > .66 ? 1 : r > .33 ? 2 : 3;
  if (np > b.ph) {
    b.ph = np; this.say(`⚠️ Phase ${np} – ${b.B.n} ${np === 2 ? 'wird wütend!' : 'rastet völlig aus!'}`); snd('roar'); AUDIO.play('boss', { wi: this.wi, ph: np });
    this.pick.push({ k: 'U', u: pick(['shroom', 'flower', 'star']), x: 15 * TS, y: 6 * TS - 22 }); // Belohnung auf der oberen Plattform
  }
};

Run.prototype.bossStep = function (dt) {
  const b = this.boss, P = this.players, GY = 14 * TS, wi = this.wi, cx = b.x + b.w / 2;
  const wallL = TS, wallR = (this.cols - 1) * TS - b.w, tp = this.near(cx);
  b.t -= dt; b.inv -= dt; b.hitT -= dt;
  // Schwerkraft fuer den Boss; liefert die Aufprallgeschwindigkeit beim Landen, sonst 0
  const fall = () => { b.vy = Math.min(b.vy + 1800 * dt, 1400); b.y += b.vy * dt; if (b.y < GY - b.h) return 0; const v = b.vy; b.y = GY - b.h; b.vy = 0; return v || .1; };
  if (b.st === 'die') { b.y += 30 * dt; if (b.t <= 0) this.finish(true, `${b.B.n} besiegt!`); return; }
  if (b.st === 'enter') { if (fall() > 300) { this.shake = .5; snd('rock'); this.puff(cx, GY, 20, '#e8e0c8'); b.st = 'idle'; b.t = 1.4; } return; }
  if (b.st === 'idle') {
    b.face = tp.x + 11 < cx ? -1 : 1; b.x = clamp(b.x + b.face * (45 + 25 * b.ph) * dt, wallL, wallR); fall();
    if (b.t <= 0) {
      const opts = b.ph === 1 ? ['charge', 'volley'] : ['charge', 'volley', 'quake']; let a;
      do a = pick(opts); while (a === b.last && Math.random() < .7); b.last = b.atk = a;
      b.st = 'tele'; b.t = .9 - .15 * (b.ph - 1); snd('tele');
      if (b.ph === 3) for (let i = 0; i < 3; i++) this.eshots.push({ x: rint(2, 27) * TS, y: -20 - i * 60, vx: 0, vy: 40, g: 420, w: 14, h: 14, life: 4, e: '☄️' });
    }
  } else if (b.st === 'tele') {
    fall();
    if (b.t <= 0) {
      if (b.atk === 'charge') { b.st = 'charge'; b.vx = b.face * (340 + 70 * b.ph); }
      else if (b.atk === 'quake') { b.st = 'quake'; b.vy = -780; }
      else { b.st = 'volley'; b.n = 2 + b.ph; b.t = 0; }
    }
  } else if (b.st === 'charge') {
    b.x += b.vx * dt; fall(); if (Math.random() < .5) this.puff(cx - b.face * 40, GY, 2, '#e8e0c8');
    if (b.x <= wallL || b.x >= wallR) { b.x = clamp(b.x, wallL, wallR); this.shake = .45; snd('rock'); b.st = 'stun'; b.t = 1.5 - .2 * (b.ph - 1); this.spark(b.vx < 0 ? b.x : b.x + b.w, b.y + 40, 14, '#ffe066'); }
  } else if (b.st === 'quake') {
    b.x = clamp(b.x + clamp(tp.x - cx, -220, 220) * dt * .9, wallL, wallR);
    if (fall()) {
      this.shake = .55; snd('rock'); this.puff(b.x + b.w / 2, GY, 24, '#e8e0c8');
      for (const d of [-1, 1]) this.eshots.push({ x: b.x + b.w / 2 - 10 + d * 50, y: GY - 20, vx: d * (240 + 50 * b.ph), w: 20, h: 18, life: 3, e: '💥' });
      b.st = 'idle'; b.t = 1.3 - .2 * (b.ph - 1);
    }
  } else if (b.st === 'volley') {
    fall();
    if (b.t <= 0) {
      if (b.n-- <= 0) { b.st = 'idle'; b.t = 1.2 - .15 * (b.ph - 1); }
      else {
        const al = P.filter(q => !q.ko), q = al.length ? pick(al) : tp, sx = cx - 7, sy = b.y + 18, T = .9 + Math.random() * .3;
        this.eshots.push({ x: sx, y: sy, vx: (q.x + 4 - sx) / T, vy: (q.y + 10 - sy) / T - 350 * T, g: 700, w: 14, h: 14, life: 3, e: BOSS_SHOT[wi] }); snd('shoot');
        b.t = .45 - .08 * (b.ph - 1);
      }
    }
  } else if (b.st === 'stun') { fall(); if (b.t <= 0) { b.st = 'idle'; b.t = .8; } }

  // Spieler gegen Boss: Kopftreffer von oben, sonst Schaden
  const hb = { x: b.x + 8, y: b.y + 10, w: b.w - 16, h: b.h - 10 };
  for (const q of P) {
    if (q.ko || this.done) continue;
    if (q.swing > 0 && b.sid[q.idx] !== q.sid) { const sw = { x: q.face > 0 ? q.x + q.w : q.x - 36, y: q.y - 4, w: 36, h: q.h + 8 }; if (ov(sw, hb)) { b.sid[q.idx] = q.sid; this.bossDmg(.25); } }
    if (!ov(q, hb) || b.st === 'die') continue;
    if (q.vy > 60 && q.y + q.h - hb.y < 30) { q.vy = -640; q.jumps = 0; q.y = hb.y - q.h; if (b.inv <= 0) this.bossDmg(1); }
    else if (q.star > 0) { if (b.inv <= 0) { b.inv = .6; this.bossDmg(.5); } }
    else { this.p = q; this.hurt(1 + (wi >= 3 ? 1 : 0), b.B.n); q.vx = (q.x + 11 < cx ? -1 : 1) * 320; }
  }
  for (const s of this.shots) if (s.life > 0 && ov(s, hb)) { s.life = 0; this.bossDmg(.15); }
};

Run.prototype.bossDraw = function (c, tt) {
  const b = this.boss, cx = b.x + b.w / 2, cy = b.y + b.h / 2, GY = 14 * TS;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(cx, GY + 2, b.w * .55 * Math.max(.3, 1 - (GY - b.y - b.h) / 320), 8, 0, 0, 7); c.fill();
  if (b.st === 'tele') { c.globalAlpha = .22 + .18 * Math.sin(tt * 30); c.fillStyle = b.atk === 'volley' ? '#a64bff' : '#ff3b3b'; c.beginPath(); c.arc(cx, cy, 72, 0, 7); c.fill(); c.globalAlpha = 1; drawEm(c, b.atk === 'charge' ? (b.face > 0 ? '➡️' : '⬅️') : b.atk === 'quake' ? '⬆️' : '❗', cx, b.y - 30, 32); }
  if (b.ph > 1 && b.st !== 'die') _gl(c, cx, cy, 95, '255,60,40', .14 * b.ph + .08 * Math.sin(tt * 6));
  c.save(); c.translate(cx, cy + (b.st === 'idle' ? Math.sin(tt * 4) * 3 : 0));
  if (b.st === 'die') { const u = 1 - Math.max(0, b.t) / 1.6; c.globalAlpha = Math.max(0, 1 - u); c.rotate(u * 1.5); c.scale(1 + u * .4, 1 + u * .4); }
  else if (b.st === 'charge') c.rotate(b.face * .12);
  else if (b.st === 'stun') c.rotate(Math.sin(tt * 10) * .08);
  if (b.inv > 0 && Math.floor(b.inv * 14) % 2) c.globalAlpha = .45;
  if (b.hitT > 0) c.filter = 'brightness(2.2)';
  c.fillStyle = '#000'; if (!drawCreature(c, b.B.n, 0, 0, 130, b.face, tt * 10, { hurt: b.inv > 0 })) drawEm(c, b.B.e, 0, 0, 110);
  c.restore();
  if (b.st === 'stun') for (let i = 0; i < 3; i++) { const a = tt * 4 + i * 2.1; drawEm(c, '⭐', cx + Math.cos(a) * 34, b.y - 10 + Math.sin(a) * 8, 18); }
};

Run.prototype.bossHud = function (c) {
  const b = this.boss, w = 380, x = VW / 2 - w / 2, y = VH - 34;
  glassRect(c, x - 10, y - 8, w + 20, 30, 15, 'rgba(60,10,20,.55)');
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect(x, y, w, 14, 7); c.fill();
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ff4a4a'); g.addColorStop(1, '#ffb04a');
  if (b.hp > 0) { c.fillStyle = g; c.beginPath(); c.roundRect(x, y, Math.max(8, b.hp / b.max * w), 14, 7); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.55)'; for (const f of [1 / 3, 2 / 3]) c.fillRect(x + w * f - 1, y, 2, 14);
};

// ---------- Start, Ende, Belohnung ----------
function bossPlay(wi, kind, k, noFilm) {
  const netHost = !!(NET.live && NET.mode === 'host');
  if (!noFilm && !netHost) return cine('bossintro', { wi, kind }, () => bossPlay(wi, kind, k, 1));
  lastK = k; const S = stats(), chars = netHost ? [save.chars.p1, netGuestChar(save.chars.p1)] : [save.chars.p1];
  show('play'); $('#bd').style.display = charStats(S, save.chars.p1).dash ? 'flex' : 'none'; paused = false; curLv = { wi, li: 0, k, boss: kind };
  AUDIO.play('boss', { wi });
  run = new Run(wi, 0, S, r => { if (netHost) { NET.hostRun = false; netSend({ t: 'end', r: { ...r, rec: [] } }); } bossEnd(wi, kind, k, r); }, { boss: kind, chars, net: netHost ? 'host' : undefined });
  if (netHost) netStartHost(run, wi, 0, k);
  last = performance.now(); startLoop();
}

function bossEnd(wi, kind, k, r) {
  const gst = NET.live && NET.mode === 'guest', B = W[wi][kind];
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose');
  if (!r.win) {
    ui.innerHTML = `<div class=bt style="background:${B.bg}"><h2>💀 ${r.why}</h2><p>${B.n} war zu stark!</p><div class="row c"><button class=g onclick="bossPlay(${wi},'${kind}',${k},1)">🦘 Nochmal</button><button onclick="battle(${wi},'${kind}',${k},1)">⚔️ Rundenkampf</button><button class=d onclick="map({from:${k}})">🗺️ Karte</button></div></div>`;
    if (gst) netGuestWait(); return;
  }
  const lines = bossLoot(wi, kind, k); lines.push(`💥 ${r.hits} Treffer erhalten`);
  ui.innerHTML = `<div class=bt style="background:${B.bg}"><div class=foe>💫</div><h2>${B.n} besiegt!</h2>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button class=g onclick="afterBoss(${wi},'${kind}',${k})">Weiter ▶</button><button onclick="bossPlay(${wi},'${kind}',${k},1)">🔄 Nochmal</button><button class=d onclick="map({from:${k}})">🗺️ Karte</button></div></div>`;
  if (gst) netGuestWait();
}
