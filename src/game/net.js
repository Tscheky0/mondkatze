// Online-Koop fuer zwei Spieler ueber WebRTC (Peer-to-Peer). Firebase dient nur zum Finden (Raumcode); danach laeuft alles direkt zwischen den Geraeten.
// Host = rechnet das Spiel und schickt 20x pro Sekunde einen Schnappschuss. Gast = schickt seine Eingaben, bewegt seine Katze sofort selbst
// (Vorhersage) und gleicht sie leicht mit dem Host ab. Beide speichern den Fortschritt in ihrem eigenen Konto.
const NET = {
  live: false, mode: null, peer: '', peerChar: 'minsch', code: '', status: '', err: '', pc: null, dc: null, poll: 0, ev: [], hostRun: false,
  edge: { a: 0, d: 0, u: 0, j: 0 }, prevJ: 0, lastM: -1, lastIn: 0, acc: 0,
};
const NET_ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const netCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(5)); return Array.from(r, v => a[v % a.length]).join(''); };
const myChar = () => save.chars.p1;
function netRefresh() { if (document.getElementById('onl')) online(); }

function netReset() {
  clearInterval(NET.poll); NET.poll = 0;
  try { if (NET.dc) { NET.dc.onclose = null; NET.dc.close(); } } catch (e) { } try { if (NET.pc) { NET.pc.onconnectionstatechange = null; NET.pc.close(); } } catch (e) { }
  Object.assign(NET, { live: false, mode: null, peer: '', pc: null, dc: null, hostRun: false, ev: [], status: '', err: '' });
  NETIN.l = NETIN.r = NETIN.j = NETIN.jb = NETIN.ap = NETIN.dash = NETIN.use = 0;
}
function netFail(msg) { const code = NET.code; netReset(); NET.err = msg; if (code) ACC.db(`rooms/${code}`, 'DELETE').catch(() => { }); netRefresh(); }
function netSend(o) { const d = NET.dc; if (d && d.readyState === 'open' && d.bufferedAmount < 250000) { try { d.send(JSON.stringify(o)); } catch (e) { } } }
function netPC() {
  const pc = new RTCPeerConnection(NET_ICE); NET.pc = pc;
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') netDown('Die Verbindung ist abgebrochen.'); };
  return pc;
}
const netGather = pc => new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 4000); pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }; });
function netChannel(dc) {
  NET.dc = dc;
  dc.onopen = () => { NET.live = true; NET.err = ''; NET.status = 'Verbunden'; if (NET.code) ACC.db(`rooms/${NET.code}`, 'DELETE').catch(() => { }); netSend({ t: 'hello', name: ACC.user.name, char: myChar() }); netRefresh(); };
  dc.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m && typeof m === 'object') netMsg(m); };
  dc.onclose = () => netDown('Der Mitspieler hat die Verbindung getrennt.');
}

// ---------- Raum erstellen / beitreten (Signalisierung ueber die Datenbank) ----------
async function netHost() {
  netReset(); if (!ACC.user) return online(); NET.mode = 'host'; NET.status = 'Raum wird erstellt…'; netRefresh();
  try {
    const code = netCode(), pc = netPC(); NET.code = code; netChannel(pc.createDataChannel('mk', { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await netGather(pc);
    await ACC.db(`rooms/${code}`, 'PUT', { host: { uid: ACC.user.uid, name: ACC.user.name, char: myChar(), offer: pc.localDescription.sdp, ts: Date.now() } });
    NET.status = 'Warte auf Mitspieler…'; netRefresh(); const t0 = Date.now();
    NET.poll = setInterval(async () => {
      try {
        if (Date.now() - t0 > 600000) throw new Error('Zeit abgelaufen – es ist niemand beigetreten.');
        const g = await ACC.db(`rooms/${code}/guest`, 'GET'); if (!g || !g.answer) return;
        clearInterval(NET.poll); NET.poll = 0; NET.peer = String(g.name || '').slice(0, 16); NET.peerChar = ['luna', 'minsch', 'chey', 'kuro', 'mama'].includes(g.char) ? g.char : 'minsch';
        await pc.setRemoteDescription({ type: 'answer', sdp: g.answer }); NET.status = 'Verbinde mit ' + NET.peer + '…'; netRefresh();
        setTimeout(() => { if (!NET.live && NET.mode === 'host') netFail('Verbindung fehlgeschlagen – das Netzwerk blockiert die direkte Verbindung.'); }, 15000);
      } catch (e) { netFail(e.message); }
    }, 900);
  } catch (e) { netFail(e.message); }
}
async function netJoin(code) {
  code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); netReset(); if (!ACC.user) return online();
  if (code.length !== 5) { NET.err = 'Der Raumcode hat 5 Zeichen.'; return netRefresh(); }
  NET.mode = 'guest'; NET.code = code; NET.status = 'Verbinde…'; netRefresh();
  try {
    const room = await ACC.db(`rooms/${code}`, 'GET'); if (!room || !room.host || !room.host.offer || Date.now() - room.host.ts > 900000) throw new Error('Diesen Raum gibt es nicht (mehr).');
    NET.peer = String(room.host.name || '').slice(0, 16); NET.peerChar = ['luna', 'minsch', 'chey', 'kuro', 'mama'].includes(room.host.char) ? room.host.char : 'luna';
    const pc = netPC(); pc.ondatachannel = e => netChannel(e.channel);
    await pc.setRemoteDescription({ type: 'offer', sdp: room.host.offer }); await pc.setLocalDescription(await pc.createAnswer()); await netGather(pc);
    await ACC.db(`rooms/${code}/guest`, 'PUT', { uid: ACC.user.uid, name: ACC.user.name, char: myChar(), answer: pc.localDescription.sdp, ts: Date.now() });
    NET.status = 'Verbinde mit ' + NET.peer + '…'; netRefresh();
    setTimeout(() => { if (!NET.live && NET.mode === 'guest') netFail('Verbindung fehlgeschlagen – das Netzwerk blockiert die direkte Verbindung.'); }, 15000);
  } catch (e) { netFail(e.message); }
}
function netLeave(silent) { netSend({ t: 'bye' }); const code = NET.code; netReset(); if (code) ACC.db(`rooms/${code}`, 'DELETE').catch(() => { }); if (typeof run !== 'undefined' && run && run.net) { run = null; AUDIO.stop(); } if (!silent) online(); }
function netDown(why) {
  if (!NET.pc && !NET.live) return; const wasLive = NET.live;
  if (typeof run !== 'undefined' && run && run.net === 'host' && !run.done) { const q = run.players[1]; q.ko = true; q.koT = 1e9; run.say('👋 Mitspieler getrennt – du spielst allein weiter'); NET.live = false; NET.hostRun = false; NETIN.l = NETIN.r = NETIN.j = 0; return; }
  netReset(); if (typeof run !== 'undefined' && run && run.net) { run = null; AUDIO.stop(); }
  if (wasLive) { NET.err = why || 'Verbindung beendet.'; online(); }
}

// ---------- Nachrichten ----------
function netMsg(m) {
  if (m.t === 'hello') { NET.peer = String(m.name || '').slice(0, 16); if (['luna', 'minsch', 'chey', 'kuro', 'mama'].includes(m.char)) NET.peerChar = m.char; netRefresh(); }
  else if (m.t === 'in' && NET.mode === 'host') { const n = NETIN, b = +m.m || 0; n.l = b & 1 ? 1 : 0; n.r = b & 2 ? 1 : 0; n.j = b & 4 ? 1 : 0; if (m.j) n.jb = .12; if (m.a) n.ap = 1; if (m.d) n.dash = 1; if (m.u) n.use = 1; }
  else if (m.t === 'start' && NET.mode === 'guest') netStartGuest(m);
  else if (m.t === 'snap' && NET.mode === 'guest') { if (typeof run !== 'undefined' && run && run.guest) run.applySnap(m); }
  else if (m.t === 'end' && NET.mode === 'guest') netEndGuest(m.r);
  else if (m.t === 'abort' && NET.mode === 'guest') { run = null; AUDIO.stop(); NET.err = ''; online(); toast('Der Host hat das Level beendet'); }
  else if (m.t === 'bye') netDown('Der Mitspieler hat das Spiel verlassen.');
}

// ---------- Host ----------
function netGuestChar(hc) { const g = NET.peerChar; return g === hc ? (hc === 'luna' ? 'minsch' : 'luna') : g; }
function netStartHost(r, wi, li, k) { NET.hostRun = true; NET.ev.length = 0; NET.acc = 0; netSend({ t: 'start', wi, li, k, S: r.S, chars: r.chars }); }
NET.snapOf = r => {
  const P = r.players, cl = Math.min(...P.map(q => q.x)) - 700, cr = Math.max(...P.map(q => q.x)) + 900, rd = Math.round, f2 = v => Math.round(v * 100) / 100;
  return { t: 'snap', T: f2(r.t), tm: Math.round(r.time * 10) / 10, sh: r.shards, co: r.coins, mn: r.moon ? 1 : 0, ch: r.chest ? 1 : 0, bl: r.bell ? 1 : 0, kn: r.keyN, gt: r.gate && r.gate.open ? 1 : 0, cps: r.cps.map(c => c.on ? 1 : 0).join(''),
    msg: r.msgT > 0 ? r.msg : '', sk: f2(r.shake),
    p: P.map(q => [rd(q.x), rd(q.y), rd(q.vx), rd(q.vy), q.face, q.hp, q.sh, f2(q.inv), q.ko ? 1 : 0, Math.min(99, rd(q.koT)), q.on ? 1 : 0, f2(q.swing), q.dashT > 0 ? 1 : 0]),
    e: r.ent.filter(e => e.x > cl && e.x < cr).map(e => [e.t.b === 'swarm' ? -1 : r.Wd.enemies.indexOf(e.t), rd(e.x), rd(e.y), e.d, f2(e.fl), e.hp, Math.round(e.ph * 10) / 10, e.on ? 1 : 0]),
    k: r.pick.filter(k => k.x > cl && k.x < cr).map(k => [k.k, rd(k.x), rd(k.y)]), s: r.shots.map(s => [rd(s.x), rd(s.y)]), es: r.eshots.map(s => [rd(s.x), rd(s.y), s.e || '']),
    d: r.drops.map(d => [rd(d.x), rd(d.y), DROPS.indexOf(d.d)]), cr: r.cr.filter(k => k.gone).map(k => k.tx + ',' + k.ty).join(';'), ro: r.rocks.map(k => [rd(k.x), rd(k.y)]), wa: r.warn.map(w => rd(w.x)),
    fx: r.fx.map(x => [rd(x.x), rd(x.y), x.txt, x.c, f2(x.t)]), qb: r.qbUsed.join(';'), ev: NET.ev.splice(0, 60) };
};
function netHostTick(r, dt) { if (!NET.live || NET.mode !== 'host') return; NET.acc += dt; if (NET.acc < .05) return; NET.acc = 0; netSend(NET.snapOf(r)); }

// ---------- Gast ----------
function netGuestInput() {
  if (!NET.live || NET.mode !== 'guest') return; const e = NET.edge;
  if (IN.ap) e.a = 1; if (IN.dash) e.d = 1; if (IN.use) e.u = 1; if (IN.j && !NET.prevJ) e.j = 1; NET.prevJ = IN.j;
  const now = performance.now(), m = (IN.l ? 1 : 0) | (IN.r ? 2 : 0) | (IN.j ? 4 : 0);
  if (m !== NET.lastM || e.a || e.d || e.u || e.j || now - NET.lastIn > 60) { netSend({ t: 'in', m, a: e.a, d: e.d, u: e.u, j: e.j }); NET.lastM = m; NET.lastIn = now; e.a = e.d = e.u = e.j = 0; }
}
function netStartGuest(m) {
  if (!Array.isArray(m.chars) || m.wi < 0 || m.wi >= W.length || m.li < 0 || m.li >= W[m.wi].n || !m.S) return;
  run = null; paused = false; AUDIO.stop(); curLv = { wi: m.wi, li: m.li, k: m.k, net: 'guest' };
  show('play'); tc.classList.remove('co'); $('#bd').style.display = charStats(m.S, m.chars[1]).dash ? 'flex' : 'none';
  AUDIO.play('level', { wi: m.wi, li: m.li, kind: levelSpec(m.wi, m.li).kind });
  run = new Run(m.wi, m.li, m.S, () => { }, { net: 'guest', chars: m.chars }); last = performance.now(); startLoop();
}
function netEndGuest(r) { if (typeof run === 'undefined' || !run || !curLv || curLv.net !== 'guest') return; const c = curLv; run = null; endLevel(c.wi, c.li, c.k, { ...r, rec: r.rec || [] }); }
function netGuestWait() { const row = ui.querySelector('.row.c'); if (row) row.innerHTML = '<small style="width:100%;text-align:center">Der Host wählt das nächste Level…</small><button class=d onclick="netLeave()">Trennen</button>'; }

Run.prototype.updateGuest = function (dt) {
  this.animT += dt; this.t += dt; this.msgT -= dt; this.fade = Math.max(0, this.fade - dt);
  for (const m of this.movers) this.moveM(m, dt);
  for (const s of this.springs) s.sq -= dt;
  for (const f of this.fire) { const ph = ((this.t + f.ph) % f.per) / f.per; f.y = ph < .4 ? VH + 14 - f.hh * Math.sin(Math.PI * ph / .4) : null; }
  for (const q of this.parts) { q.l -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
  this.parts = this.parts.filter(q => q.l > 0); this.shake = Math.max(0, this.shake - dt);
  for (const f of this.fx) { f.t -= dt; f.y -= 30 * dt; } this.fx = this.fx.filter(f => f.t > 0);
  const me = this.players[this.me], rm = this.players[1 - this.me], k = Math.min(1, dt * 14);
  if (!me.ko) { this.p = me; this.stepPlayer(me, dt); }
  if (me.tx != null) {
    // Eigene Katze wird sofort selbst bewegt (Vorhersage). Der Host-Stand ist durch die Netzwerk-Laufzeit veraltet:
    // Waehrend du laeuft/springst, korrigieren wir nur bei grossen Abweichungen; im Stand gleichen wir sanft an.
    const dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy), moving = IN.l || IN.r || !me.on || Math.abs(me.vx) > 20;
    if (me.ko || d > 260) { me.x = me.tx; me.y = me.ty; me.vx = me.vy = 0; }
    else if (!moving && d > 6) { me.x += dx * Math.min(1, dt * 6); me.y += dy * Math.min(1, dt * 6); }
    else if (d > 150) { me.x += dx * Math.min(1, dt * 2); me.y += dy * Math.min(1, dt * 2); }
  }
  if (rm.tx != null) { const dx = rm.tx - rm.x, dy = rm.ty - rm.y; if (Math.hypot(dx, dy) > 200) { rm.x = rm.tx; rm.y = rm.ty; } else { rm.x += dx * k; rm.y += dy * k; } }
  const ld = this.lead(); this.p = ld; this.cam = clamp(ld.x - VW * .4, 0, this.cols * TS - VW);
};
Run.prototype.applySnap = function (m) {
  if (!Array.isArray(m.p) || m.p.length !== 2) return;
  this.t = m.T; this.time = m.tm; this.shards = m.sh; this.coins = m.co; this.moon = !!m.mn; this.chest = m.ch ? true : null; this.bell = !!m.bl; this.keyN = m.kn; this.shake = Math.max(this.shake, m.sk || 0);
  this.cps.forEach((c, i) => { c.on = m.cps[i] === '1'; });
  if (m.gt && this.gate && !this.gate.open) { this.gate.open = true; for (let y = 0; y < this.gate.y1; y++) if (this.g[y][this.gate.tx] === 7) this.g[y][this.gate.tx] = 0; this.g._ch = []; }
  if (m.msg && m.msg !== this.msg) this.say(m.msg);
  m.p.forEach((a, i) => {
    const q = this.players[i], hp0 = q.hp; q.hp = a[5]; q.sh = a[6]; q.ko = !!a[8]; q.koT = a[9];
    if (i === this.me) { q.tx = a[0]; q.ty = a[1]; q.inv = a[7]; if (q.hp < hp0 && typeof vib !== 'undefined') vib(70); }
    else { q.tx = a[0]; q.ty = a[1]; q.vx = a[2]; q.vy = a[3]; q.face = a[4]; q.inv = a[7]; q.on = !!a[10]; q.swing = a[11]; q.dashT = a[12] ? .1 : 0; }
  });
  const sw = this.swarmT || (this.swarmT = { n: 'Schwarm', e: SWARM_E[this.wi], hp: 1, b: 'swarm', s: 100, sz: 20 });
  this.ent = m.e.map(a => { const t = a[0] < 0 ? sw : this.Wd.enemies[a[0]]; if (!t) return null; const fly = t.b === 'fly', swm = a[0] < 0; return { t, x: a[1], y: a[2], d: a[3], fl: a[4], hp: a[5], ph: a[6], on: !!a[7], w: swm ? 16 : 24, h: swm ? 16 : fly ? 24 : 26, vx: 0, vy: 0, sid: -1 }; }).filter(Boolean);
  this.pick = m.k.map(a => ({ k: a[0], x: a[1], y: a[2] })); this.shots = m.s.map(a => ({ x: a[0], y: a[1], w: 12, h: 10 })); this.eshots = m.es.map(a => ({ x: a[0], y: a[1], e: a[2], w: 12, h: 12 }));
  this.drops = m.d.map(a => ({ x: a[0], y: a[1], d: DROPS[a[2]] || DROPS[0] })); this.rocks = m.ro.map(a => ({ x: a[0], y: a[1], w: 26, h: 26 })); this.warn = m.wa.map(x => ({ x, t: .5 }));
  this.fx = m.fx.map(a => ({ x: a[0], y: a[1], txt: a[2], c: a[3], t: a[4] }));
  // brechende Planken
  const now = new Set(m.cr ? m.cr.split(';') : []); this.goneSet = this.goneSet || new Set(); let ch = false;
  for (const key of now) if (!this.goneSet.has(key)) { const [tx, ty] = key.split(',').map(Number); if (this.g[ty] && this.g[ty][tx] === 5) { this.g[ty][tx] = 0; ch = true; } }
  for (const key of this.goneSet) if (!now.has(key)) { const [tx, ty] = key.split(',').map(Number); if (this.g[ty] && this.g[ty][tx] === 0) { this.g[ty][tx] = 5; ch = true; } }
  if (m.qb) for (const key of m.qb.split(';')) { const [tx, ty] = key.split(',').map(Number); if (this.g[ty] && this.g[ty][tx] === 8) { this.g[ty][tx] = 9; ch = true; } }
  this.goneSet = now; if (ch) this.g._ch = [];
  for (const ev of m.ev) {
    if (ev[0] === 'n') { if (!['jump', 'jump2', 'wall', 'land', 'dash', 'step', 'spring'].includes(ev[1])) AUDIO.sfx(ev[1]); }
    else if (ev[0] === 's') Run.prototype.spark.call(this, ev[1], ev[2], ev[3], ev[4]); else if (ev[0] === 'u') Run.prototype.puff.call(this, ev[1], ev[2], ev[3], ev[4]);
  }
};

// ---------- Lobby ----------
function online() {
  show('ui'); const u = ACC.user, hostLive = NET.live && NET.mode === 'host', guestLive = NET.live && NET.mode === 'guest', busy = !NET.live && NET.mode;
  const names = { luna: 'Luna', minsch: 'Minsch', chey: 'Chey', kuro: 'Kuro', mama: 'Mama-Kitty' };
  let body;
  if (!ACC.ready()) body = `<div class=card><h3>Noch nicht eingerichtet</h3><p>Für Online-Koop braucht das Spiel eine kostenlose Firebase-Datenbank.</p><div class=row><button onclick="account()">👤 Einrichtung öffnen</button></div></div>`;
  else if (!u) body = `<div class=card><h3>Bitte anmelden</h3><p>Online-Koop gibt es nur mit Konto – so bleibt der Fortschritt für beide gespeichert.</p><div class=row><button class=g onclick="account()">👤 Anmelden / Konto erstellen</button></div></div>`;
  else if (hostLive) body = `<div class=card style="text-align:center"><h2>🎉 ${esc(NET.peer || 'Mitspieler')} ist verbunden!</h2><p>${catImg(myChar(), 70)} + ${catImg(netGuestChar(myChar()), 70)}</p><p>Du bist der Host: Wähle auf der Karte ein Level, ${esc(NET.peer)} spielt automatisch mit. Beide Spielstände werden in den Konten gesichert.</p><div class="row c"><button class=g onclick="map()">🗺️ Zur Karte</button><button class=r onclick="netLeave()">Trennen</button></div></div>`;
  else if (guestLive) body = `<div class=card style="text-align:center"><h2>🎉 Verbunden mit ${esc(NET.peer)}</h2><p>Warte, bis der Host ein Level startet… Du spielst mit ${esc(names[myChar()])}.</p><div class="row c"><button class=r onclick="netLeave()">Trennen</button></div></div>`;
  else if (busy && NET.mode === 'host' && NET.code) body = `<div class=card style="text-align:center"><h3>Dein Raumcode</h3><div class=rank style="color:#ffe08a;letter-spacing:8px">${esc(NET.code)}</div><p>${esc(NET.status)}</p><small>Schick den Code deinem Mitspieler. Er gibt ihn unter „Raum beitreten“ ein.</small><div class="row c"><button class=r onclick="netLeave()">Abbrechen</button></div></div>`;
  else if (busy) body = `<div class=card style="text-align:center"><h3>${esc(NET.status || 'Verbinde…')}</h3><div class="row c"><button class=r onclick="netLeave()">Abbrechen</button></div></div>`;
  else body = `<div class=card><h3>Hallo ${esc(u.name)}!</h3><div class=row><button class=g onclick="netHost()">➕ Raum erstellen</button></div></div>
    <div class=card><h3>Raum beitreten</h3><input id=rc maxlength=5 placeholder="CODE" autocapitalize=characters style="text-transform:uppercase;letter-spacing:6px;text-align:center;font-size:22px"><div class=row><button onclick="netJoin($('#rc').value)">🔗 Beitreten</button></div></div>`;
  ui.innerHTML = `<div id=onl><div class=hd><h2>🌐 Online-Koop</h2><button class=d onclick="showTitle()">Zurück</button></div>${NET.err ? `<div class=card>⚠️ ${esc(NET.err)}</div>` : ''}${body}
  <small>Zu zweit spielen, jeder auf seinem Gerät. Die Geräte verbinden sich direkt; der Raumcode wird nur zum Finden gebraucht.</small></div>`;
}
