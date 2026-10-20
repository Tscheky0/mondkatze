// Garderobe (Kleidung), Album, Erfolge, Medaillen/Geister-Rennen und Neues Spiel+.
const COS = [
  { id: 'h0', t: 'hat', n: 'Blumenkranz', e: '🌸', w: 0, s: 0 }, { id: 'h1', t: 'hat', n: 'Blätterkrone', e: '🍃', w: 1, s: 0 }, { id: 'h2', t: 'hat', n: 'Pharao-Haube', e: '🔱', w: 2, s: 0 },
  { id: 'h3', t: 'hat', n: 'Pelzmütze', e: '🧢', w: 3, s: 0 }, { id: 'h4', t: 'hat', n: 'Bergsteiger-Mütze', e: '⛑️', w: 4, s: 0 }, { id: 'h5', t: 'hat', n: 'Feuerkrone', e: '👑', w: 5, s: 0 },
  { id: 's0', t: 'scarf', n: 'Wiesen-Schal', e: '🧣', w: 0, s: 1, c: '#4cc35a' }, { id: 's1', t: 'scarf', n: 'Dschungel-Schal', e: '🧣', w: 1, s: 1, c: '#e8453c' },
  { id: 's2', t: 'scarf', n: 'Sand-Schal', e: '🧣', w: 2, s: 1, c: '#e8c050' }, { id: 's3', t: 'scarf', n: 'Eis-Schal', e: '🧣', w: 3, s: 1, c: '#6ab0ff' },
  { id: 's4', t: 'scarf', n: 'Gipfel-Schal', e: '🧣', w: 4, s: 1, c: '#b07adf' }, { id: 's5', t: 'scarf', n: 'Glut-Schal', e: '🧣', w: 5, s: 1, c: '#ff7a2a' },
  { id: 'c1', t: 'color', n: 'Rosa Fell', e: '🎀', w: 1, s: 0, c: '#ffd9ec', edge: '#e8a0c0' }, { id: 'c2', t: 'color', n: 'Himmelblaues Fell', e: '💙', w: 3, s: 0, c: '#d8ecff', edge: '#98b8e8' },
  { id: 'c3', t: 'color', n: 'Goldenes Fell', e: '✨', w: 5, s: 0, c: '#fff0b8', edge: '#e0b850' },
];
const COS_T = { hat: 'Hut', scarf: 'Schal', color: 'Fellfarbe' };
const cosPrice = x => x.t === 'hat' ? 80 + x.w * 20 : x.t === 'scarf' ? 60 + x.w * 15 : 140;
const lookSig = () => { try { const e = save.cos.eq; return (e.hat || '') + (e.scarf || '') + (e.color || ''); } catch (e) { return ''; } };

// Kleidung zeichnen (im skalierten Katzen-Koordinatensystem, nach dem Kopf)
function drawLook(c, eq) {
  const sc = COS.find(x => x.id === eq.scarf);
  if (sc) { _q(c, [-1, 4], [7, 9], [15, 3], sc.c, 5); _l(c, [[1, 6], [-5, 15]], sc.c, 4); }
  const h = eq.hat;
  if (h === 'h0') for (const [x, y, k] of [[4, -16, '#ff8ac0'], [11, -18, '#fff'], [18, -15, '#ffd23a']]) { _e(c, x, y, 3, 3, k, '#8a4a6a', 1); _e(c, x, y, 1, 1, '#ffd23a'); }
  else if (h === 'h1') for (const [x, a] of [[4, -.9], [8, -.3], [12, .3], [17, .9]]) { c.save(); c.translate(x, -16); c.rotate(a); _e(c, 0, -3, 2.2, 5, '#4cc35a', '#1f6a2a', 1); c.restore(); }
  else if (h === 'h2') { _p(c, [[1, -14], [21, -14], [21, -10], [1, -10]], '#e8c050', '#8a6a10', 1.2); _l(c, [[1, -12], [21, -12]], '#2a5ac8', 1.6); _e(c, 22, -16, 1.8, 2.4, '#4aa85a', '#1a5a2a', 1); }
  else if (h === 'h3') { _e(c, 11, -17, 11, 5, '#e8eef8', '#8a96aa', 1.3); _e(c, 4, -15, 3, 2.4, '#fff'); _e(c, 18, -15, 3, 2.4, '#fff'); _e(c, 11, -23, 3, 3, '#fff', '#8a96aa', 1); }
  else if (h === 'h4') { c.beginPath(); c.ellipse(11, -14, 11, 9, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#e8453c'; c.fill(); c.strokeStyle = '#8a2420'; c.lineWidth = 1.2; c.stroke(); _p(c, [[0, -14], [22, -14], [22, -11], [0, -11]], '#fff', '#8a96aa', 1); _e(c, 11, -24, 3, 3, '#fff', '#8a96aa', 1); }
  else if (h === 'h5') { _p(c, [[3, -15], [4, -23], [8, -17], [11, -26], [14, -17], [18, -23], [19, -15]], '#ffb02a', '#c85a00', 1.3); _e(c, 11, -17, 1.8, 1.8, '#e8302a', '#7a1a10', 1); }
}

// ---------- Bilder fuer Album / Garderobe ----------
const _crImg = {};
function creatureImg(name, size, sil) {
  const key = name + size + (sil ? 's' : ''); if (_crImg[key]) return _crImg[key];
  const cn = document.createElement('canvas'); cn.width = cn.height = size * 2; const c = cn.getContext('2d');
  drawCreature(c, name, size, size * 1.05, size * 1.5, 1, 6, {});
  if (sil) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#1a1630'; c.fillRect(0, 0, size * 2, size * 2); }
  return _crImg[key] = `<img src="${cn.toDataURL()}" width="${size}" height="${size}" style="vertical-align:middle">`;
}

// ---------- Erfolge ----------
const kc = s => Object.values(s.stats.kills || {}).reduce((a, b) => a + b, 0);
const ACH = [
  { id: 'a1', n: 'Erster Schritt', d: 'Schaffe dein erstes Level', t: s => Object.keys(s.cleared).some(k => /^\d+:\d+$/.test(k)) },
  { id: 'a2', n: 'Sammlerin', d: 'Besitze 10 Items', t: s => Object.keys(s.own).length >= 10 },
  { id: 'a3', n: 'Rüstkammer', d: 'Besitze alle 24 Items', t: s => Object.keys(s.own).length >= ITEMS.length },
  { id: 'a4', n: 'Mondsucherin', d: 'Finde 10 große Monde', t: s => Object.keys(s.moons).length >= 10 },
  { id: 'a5', n: 'Glöckchen-Fan', d: 'Finde alle 6 Glöckchen', t: s => Object.keys(s.bells).length >= 6 },
  { id: 'a6', n: 'Geheimnisvoll', d: 'Entdecke 5 Geheimräume', t: s => (s.stats.secrets || 0) >= 5 },
  { id: 'a7', n: 'Wächterjägerin', d: 'Besiege alle 6 Wächter', t: s => [0, 1, 2, 3, 4, 5].every(w => s.cleared[w + ':mini']) },
  { id: 'a8', n: 'Bossbezwingerin', d: 'Besiege alle 6 Bosse', t: s => [0, 1, 2, 3, 4, 5].every(w => s.cleared[w + ':boss']) },
  { id: 'a9', n: 'Retterin des Mondes', d: 'Besiege den Mondverschlinger', t: s => !!s.cleared['5:boss'] },
  { id: 'a10', n: 'Kämpferin', d: 'Besiege 100 Gegner', t: s => kc(s) >= 100 },
  { id: 'a11', n: 'Schwarmjägerin', d: 'Besiege 30 Schwarm-Gegner', t: s => Object.keys(s.stats.kills || {}).filter(k => k.startsWith('Schwarm')).reduce((a, k) => a + s.stats.kills[k], 0) >= 30 },
  { id: 'a12', n: 'Goldkatze', d: '5 Gold-Medaillen holen', t: s => Object.values(s.best || {}).filter(b => b.m === 'gold').length >= 5 },
  { id: 'a13', n: 'Modeprofi', d: 'Besitze 6 Kleidungsstücke', t: s => Object.keys(s.cos.own).length >= 6 },
  { id: 'a14', n: 'Meisterhaft', d: 'Starte Neues Spiel+', t: s => (s.ng || 0) >= 1 },
  { id: 'a15', n: 'Goldesel', d: 'Besitze 1000 Münzen', t: s => s.coins >= 1000 },
  { id: 'a16', n: 'Aufsteigerin', d: 'Erreiche Mond-Level 20', t: () => lvl() >= 20 },
];
function checkAch() {
  for (const a of ACH) if (!save.ach[a.id] && a.t(save)) { save.ach[a.id] = 1; persistRaw(); toast('🏆 Erfolg: ' + a.n); AUDIO.sfx('treasure'); }
}

// ---------- Album ----------
function album(tab) {
  show('ui'); tab = tab || 'foes'; const k = save.stats.kills || {};
  const tabs = [['foes', '👾 Gegner'], ['boss', '👑 Bosse'], ['items', '🎒 Items'], ['ach', '🏆 Erfolge']];
  let h = `<div class=hd><h2>📖 Album</h2><button class=d onclick="showTitle()">Zurück</button></div><div class=tabs>${tabs.map(t => `<button class="${t[0] === tab ? 'on' : 'd'}" onclick="album('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
  if (tab === 'foes') for (let wi = 0; wi < 6; wi++) {
    h += `<div class=card><b>${W[wi].emoji} ${W[wi].name}</b><div class=row>`;
    for (const n of [...W[wi].enemies.map(e => e.n), 'Schwarm' + wi]) { const c = k[n] || 0; h += `<div style="text-align:center;width:92px">${creatureImg(n, 64, !c)}<br><small>${c ? (n.startsWith('Schwarm') ? 'Schwarm' : n) : '???'}</small><br><span class=badge>${c}×</span></div>`; }
    h += '</div></div>';
  }
  else if (tab === 'boss') for (let wi = 0; wi < 6; wi++) {
    h += `<div class=card><b>${W[wi].emoji} ${W[wi].name}</b><div class=row>`;
    for (const kind of ['mini', 'boss']) { const B = W[wi][kind], got = save.cleared[wi + ':' + kind]; h += `<div style="text-align:center;width:130px">${creatureImg(B.n, 96, !got)}<br><small>${got ? B.n : '???'}</small><br><span class=badge>${kind === 'boss' ? '👑 Boss' : '⚔️ Wächter'}</span></div>`; }
    h += '</div></div>';
  }
  else if (tab === 'items') {
    h += `<p>Items: ${Object.keys(save.own).length}/${ITEMS.length} · Kleidung: ${Object.keys(save.cos.own).length}/${COS.length} · Glöckchen: ${Object.keys(save.bells).length}/6 · Große Monde: ${Object.keys(save.moons).length}/30 · Geheimräume: ${save.stats.secrets || 0}</p>`;
    for (const it of ITEMS) h += save.own[it.id] ? `<div class=it><div class=e>${it.e}</div><b>${it.n}</b><br>${it.d}</div>` : `<div class=it style="opacity:.4"><div class=e>❔</div>${W[it.w].emoji}</div>`;
    h += '<h3>Kleidung</h3>'; for (const x of COS) h += save.cos.own[x.id] ? `<div class=it><div class=e>${x.e}</div><b>${x.n}</b></div>` : `<div class=it style="opacity:.4"><div class=e>❔</div>${W[x.w].emoji}</div>`;
  } else {
    const n = ACH.filter(a => save.ach[a.id]).length; h += `<p>Erfolge: ${n}/${ACH.length}</p>`;
    for (const a of ACH) h += `<div class=card style="${save.ach[a.id] ? '' : 'opacity:.5'}"><b>${save.ach[a.id] ? '🏆' : '🔒'} ${a.n}</b><br><small>${a.d}</small></div>`;
  }
  ui.innerHTML = h;
}

// ---------- Garderobe ----------
function wardrobe() {
  show('ui'); const eq = save.cos.eq;
  let h = `<div class=hd><h2>👒 Garderobe</h2><button class=d onclick="bag()">Zurück</button></div><div style="text-align:center">${catImg('luna', 150)}</div><p style="text-align:center"><small>Neue Kleidung gibt es in den Läden der Welten.</small></p>`;
  for (const t of ['hat', 'scarf', 'color']) {
    h += `<h3>${COS_T[t]}</h3><div><div class="it ${!eq[t] ? 'sel' : ''}" onclick="wear('${t}',null)"><div class=e>🚫</div>Ohne</div>`;
    for (const x of COS.filter(x => x.t === t)) h += save.cos.own[x.id] ? `<div class="it ${eq[t] === x.id ? 'sel' : ''}" onclick="wear('${t}','${x.id}')"><div class=e>${x.e}</div><b>${x.n}</b></div>` : `<div class=it style="opacity:.4"><div class=e>❔</div>${W[x.w].emoji} ${W[x.w].name}</div>`;
    h += '</div>';
  }
  ui.innerHTML = h;
}
function wear(t, id) { save.cos.eq[t] = id; persist(); wardrobe(); }

// ---------- Neues Spiel+ ----------
function startNG() {
  if (!confirm('Neues Spiel+ starten? Welten und Level beginnen von vorn, Gegner werden stärker. Fähigkeiten, Items, Münzen und Kleidung bleiben.')) return;
  save.ng = (save.ng || 0) + 1; save.prog = [0, 0, 0, 0, 0, 0]; save.cleared = {}; save.moons = {}; save.bells = {}; save.w = 0; lastAt = null; persist(); checkAch();
  toast('🔁 Neues Spiel+ ' + save.ng + ' gestartet!'); map();
}

// ---------- Geister-Aufzeichnung ----------
const ghostKey = (wi, li) => (window.ADMIN ? 'mk_aghost_' : 'mk_ghost_') + wi + '_' + li;
function loadGhost(wi, li) { try { return JSON.parse(localStorage.getItem(ghostKey(wi, li))); } catch (e) { return null; } }
function saveGhost(wi, li, rec) { try { localStorage.setItem(ghostKey(wi, li), JSON.stringify(rec)); } catch (e) { } }
const MEDAL = { gold: '🥇', silver: '🥈', bronze: '🥉' };
