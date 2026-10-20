// UI, Speicherstand, Story, Laeden, Skillbaum, Beutel, Bosskampf und Spielschleife.
const $ = s => document.querySelector(s), ui = $('#ui'), cv = $('#cv'), ctx = cv.getContext('2d', { alpha: false, desynchronized: true }), tc = $('#tc');
const defSave = () => ({ w: 0, prog: [0, 0, 0, 0, 0, 0], shards: 0, coins: 0, skills: {}, own: {}, load: [], moons: {}, cleared: {}, cons: {}, seen: {}, bells: {}, tips: {}, cos: { own: {}, eq: {} }, stats: { kills: {}, secrets: 0, levels: 0 }, ach: {}, best: {}, ng: 0, ts: 0 });
const SAVE_KEY = window.ADMIN ? 'mondkatze_admin' : 'mondkatze';
let save; try { save = Object.assign(defSave(), JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { save = defSave(); }
const persistRaw = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } };
const persist = () => { save.ts = Date.now(); persistRaw(); CLOUD.touch(); };

const spent = () => Object.values(save.skills).reduce((a, r) => a + r * (r + 1) / 2, 0);
const pts = () => Math.floor(save.shards / 20) - spent();
const lvl = () => 1 + Object.values(save.skills).reduce((a, b) => a + b, 0);

function stats() {
  const r = n => save.skills[n] || 0;
  const S = { maxhp: 3 + r('hp1'), spd: 1 + .08 * r('spd'), jmp: 1 + .06 * r('jmp'), xj: r('xj'), dmg: r('pow1'), crit: .1 * r('crit'), time: 10 * r('tm1'),
    killT: 2 * r('tm2'), magnet: 50 * r('mag'), shield: r('shd'), regen: r('reg'), shot: r('fire'), s2: 0, rev: 0, combo: r('combo'), dash: r('dash'), glide: r('glide'), wall: r('wall') };
  for (const id of save.load) {
    const f = ITEM[id].fx;
    S.maxhp += f.hp || 0; S.xj += f.xj || 0; S.spd += f.spd || 0; S.jmp += f.jmp || 0; S.dmg += f.dmg || 0; S.time += f.time || 0;
    S.shield += f.shield || 0; S.magnet += f.mag || 0; S.shot += f.shot || 0; S.regen += f.regen || 0; S.s2 += f.s2 || 0; S.rev += f.rev || 0;
  }
  return S;
}

function nodes(wi) {
  const n = W[wi].n, a = [];
  for (let i = 0; i < n; i++) { a.push({ t: 'lv', i }); if (i === Math.floor(n / 2) - 1) a.push({ t: 'mini' }); }
  a.push({ t: 'boss' }); return a;
}
const unlocked = wi => wi === 0 || save.prog[wi - 1] >= nodes(wi - 1).length;

// ---------- Anzeige-Modi ----------
let mode = 'ui', lastAt = null, lastK = 0, toastT = 0;
function show(m) {
  mode = m; ui.style.display = m === 'ui' ? 'block' : 'none';
  $('#mw').style.display = m === 'map' ? 'block' : 'none';
  cv.style.display = m === 'play' || m === 'cine' ? 'block' : 'none'; tc.style.display = m === 'play' ? 'block' : 'none';
  if (m !== 'map') closePop();
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => e.style.display = 'none', 2200); }
function popup(h) { const p = $('#pop'); p.innerHTML = h; p.style.display = 'flex'; }
function closePop() { $('#pop').style.display = 'none'; }

// ---------- Titel & Story ----------
function showTitle() {
  show('ui'); AUDIO.play('menu', { wi: 0 });
  ui.innerHTML = `<div class=title><div>${catImg('luna', 130)}${catImg('chey', 100)}</div><h1>Mondkatze</h1>
  <p>Der Mondverschlinger hat <b>Chey</b> entführt und den Mond verschluckt.<br>Hilf <b>Luna</b>, Chey zu retten!</p>
  <div class="row c"><button class=g onclick="start()">▶ ${save.seen.intro ? 'Weiter' : 'Neues Abenteuer'}</button><button class=r onclick="resetGame()">Neu starten</button></div>
  <div class="row c"><button class=d onclick="album()">📖 Album</button><button class=d onclick="settings()">⚙️ Einstellungen &amp; Cloud</button><button class=d data-fs onclick="FS.toggle()">⛶</button>${save.cleared['5:boss'] ? `<button class=g onclick="startNG()">🔁 Neues Spiel+ (${(save.ng || 0) + 1})</button>` : ''}</div>
  <small>Handy quer halten · Android/iPhone: im Browser "Zum Startbildschirm"</small><br><small>Version 11</small></div>`;
}
function start() { if (!save.seen.intro) cine('intro', {}, () => story(STORY.intro, () => { save.seen.intro = 1; persist(); map(); })); else map(); }
function resetGame() { if (confirm('Gesamten Fortschritt löschen?')) { save = defSave(); persist(); lastAt = null; showTitle(); } }
function story(pages, done) {
  let i = 0;
  const step = () => {
    if (i >= pages.length) return done();
    const p = pages[i++]; show('ui');
    const who = p.w === 'luna' ? catImg('luna', 120) : p.w === 'chey' ? catImg('chey', 120) : p.w === 'boss' ? p.e : '📖';
    ui.innerHTML = `<div class=story><div class=who>${who}</div><b>${{ luna: 'Luna', chey: 'Chey', boss: '', narr: '' }[p.w]}</b><div class=txt>${p.t}</div>
    <button class=g id=nx>Weiter ▶</button> <button class=d id=sk>Überspringen</button></div>`;
    $('#nx').onclick = step; $('#sk').onclick = () => { i = pages.length; step(); };
  };
  step();
}

// ---------- Karte ----------
function map(opt) {
  const wi = save.w;
  if (!opt && lastAt && lastAt.wi === wi) opt = { from: lastAt.k, shop: lastAt.shop };
  const open = () => { show('map'); AUDIO.play('map', { wi }); hud(); mapOpen(wi, opt || {}); };
  if (!save.seen['w' + wi]) { save.seen['w' + wi] = 1; persist(); cine('arrive', { wi }, () => story(STORY.world[wi], open)); } else open();
}
function hud() {
  const Wd = W[save.w];
  $('#hud').innerHTML = `<div><button class=d onclick="swW(-1)">◀</button><span>${Wd.emoji} ${Wd.name}${save.ng ? ' · NG+' + save.ng : ''}</span><button class=d onclick="swW(1)">▶</button></div>
  <div><span>🪙 ${save.coins}</span><span>🌙 ${save.shards % 20}/20</span><span>⭐ ${pts()}</span><button onclick="bag()">🎒</button><button onclick="tree()">🌟${pts() > 0 ? '❗' : ''}</button><button class=d data-fs onclick="FS.toggle()">⛶</button><button class=d onclick="showTitle()">☰</button></div>`;
}
function swW(d) {
  const n = save.w + d; if (n < 0 || n >= W.length) return;
  if (!unlocked(n)) return toast('🔒 Besiege erst den Boss von ' + W[n - 1].name + '!');
  save.w = n; persist(); lastAt = null; map();
}
function arrive(d) {
  if (!MV) return;
  const wi = MV.wi, Wd = W[wi], pr = save.prog[wi];
  lastAt = { wi, k: MV.at.k, shop: MV.at.shop };
  if (d.shop != null) { const sh = SHOPS[wi][d.shop]; popup(`<div><b>${sh.o} ${sh.n}</b><br><small>Items &amp; Boni kaufen</small></div><button class=g onclick="shop(${wi},${d.shop})">🛒 Eintreten</button>`); return; }
  const nd = MV.L.N[d.k]; let t, s;
  if (nd.t === 'lv') { t = `${nd.i + 1}. ${levelSpec(wi, nd.i).name}`; s = MOONLV.includes(nd.i) && !save.moons[wi + ':' + nd.i] ? '🌕 Hier versteckt sich ein großer Mond' : 'Splitter, Münzen &amp; Items sammeln'; }
  else { t = `${nd.t === 'boss' ? '👑 Boss' : '⚔️ Wächter'}: ${Wd[nd.t].n}`; s = 'Kampf mit Konter-System'; }
  const bst = nd.t === 'lv' && save.best[wi + ':' + nd.i], gh = nd.t === 'lv' && loadGhost(wi, nd.i);
  popup(`<div><b>${t}</b><br><small>${s}${bst ? ` · ${MEDAL[bst.m]} Bestzeit ${bst.t}s` : ''}</small></div><button class=g onclick="go(${d.k})">▶ ${d.k < pr ? 'Nochmal' : 'Start'}</button>${gh ? `<button class=d onclick="go(${d.k},true)">👻 Rennen</button>` : ''}`);
}
function go(k, race) { lastK = k; const nd = nodes(save.w)[k]; if (nd.t === 'lv') play(save.w, nd.i, k, race); else battle(save.w, nd.t, k); }

// ---------- Laden ----------
let curShop = null;
function shop(wi, s) {
  curShop = { wi, s }; const keep = ui.scrollTop; show('ui');
  const sh = SHOPS[wi][s], items = ITEMS.filter(i => i.w === wi).slice(s * 2, s * 2 + 2), ip = it => 40 + wi * 30 + (ITEMS.indexOf(it) % 4) * 25;
  let h = `<div class=hd><h2>${sh.o} ${sh.n}</h2><b>🪙 ${save.coins}</b><button class=d onclick="leaveShop()">Zurück</button></div><h3>Ausrüstung</h3><div class=grid>`;
  for (const it of items) { const own = save.own[it.id], p = ip(it); h += `<div class=card><b>${it.e} ${it.n}</b><br><small>${it.d}</small><br><button ${own || save.coins < p ? 'disabled' : ''} onclick="buy('i','${it.id}',${p})">${own ? 'Gekauft' : '🪙 ' + p}</button></div>`; }
  h += '</div><h3>Verbrauchbar</h3><div class=grid>';
  for (const c of CONS) h += `<div class=card><b>${c.e} ${c.n}</b> (${save.cons[c.id] || 0})<br><small>${c.d}</small><br><button ${save.coins < c.p ? 'disabled' : ''} onclick="buy('c','${c.id}',${c.p})">🪙 ${c.p}</button></div>`;
  const sp = 100 + wi * 20;
  h += `<div class=card><b>🌙 20 Mondsplitter</b><br><small>= 1 Skillpunkt</small><br><button ${save.coins < sp ? 'disabled' : ''} onclick="buy('s','',${sp})">🪙 ${sp}</button></div></div>`;
  const cs = COS.filter(x => x.w === wi && x.s === s);
  if (cs.length) {
    h += '<h3>👒 Garderobe</h3><div class=grid>';
    for (const x of cs) { const own = save.cos.own[x.id], p = cosPrice(x); h += `<div class=card><b>${x.e} ${x.n}</b><br><small>${COS_T[x.t]}</small><br><button ${own || save.coins < p ? 'disabled' : ''} onclick="buy('o','${x.id}',${p})">${own ? 'Gekauft' : '🪙 ' + p}</button></div>`; }
    h += '</div>';
  }
  h += `<h3>🎮 Spiele</h3><div class=grid><div class=card><b>🎣 Angeln</b><br><small>5 Runden Timing – gewinne Münzen</small><br><button ${save.coins < 20 ? 'disabled' : ''} onclick="fishing(${wi},${s})">🪙 20</button></div>
  <div class=card><b>🃏 Memory</b><br><small>Finde 4 Paare in 14 Zügen</small><br><button ${save.coins < 15 ? 'disabled' : ''} onclick="memory(${wi},${s})">🪙 15</button></div></div>`;
  ui.innerHTML = h; ui.scrollTop = keep;
}
function buy(kind, id, p) {
  if (save.coins < p) return; save.coins -= p;
  if (kind === 'o') { save.cos.own[id] = 1; save.cos.eq[COS.find(x => x.id === id).t] = id; AUDIO.sfx('power'); } else if (kind === 'i') save.own[id] = 1; else if (kind === 'c') save.cons[id] = (save.cons[id] || 0) + 1; else save.shards += 20;
  persist(); checkAch(); shop(curShop.wi, curShop.s);
}
function leaveShop() { map({ shop: curShop.s }); }

// ---------- Beutel & Skillbaum ----------
function bag() {
  show('ui');
  let h = `<div class=hd><h2>🎒 Beutel (${save.load.length}/3)</h2><button class=d onclick="wardrobe()">👒 Garderobe</button><button class=d onclick="map()">Fertig</button></div><p>Wähle bis zu 3 Items für die Level. Neue Items findest du in Truhen und Läden.</p>`;
  for (const it of ITEMS) h += save.own[it.id]
    ? `<div class="it ${save.load.includes(it.id) ? 'sel' : ''}" onclick="tog('${it.id}')"><div class=e>${it.e}</div><b>${it.n}</b><br>${it.d}</div>`
    : `<div class=it style="opacity:.4"><div class=e>❔</div>${W[it.w].emoji} ${W[it.w].name}</div>`;
  ui.innerHTML = h;
}
function tog(id) { const i = save.load.indexOf(id); if (i >= 0) save.load.splice(i, 1); else if (save.load.length < 3) save.load.push(id); persist(); bag(); }
function tree() {
  show('ui');
  let h = `<div class=hd><h2>🌟 Mondbaum · Luna Lv ${lvl()}</h2><b>⭐ ${pts()}</b><button class=d onclick="map()">Zurück</button></div><p><small>20 Mondsplitter = 1 Punkt. Kosten = Rangnummer.</small></p><div class=sk>`;
  for (const b of SKILLS) {
    h += `<div><h3>${b.b}</h3>`;
    for (const s of b.list) {
      const r = save.skills[s.id] || 0, lock = s.req && !save.skills[s.req], cost = r + 1;
      h += `<div class=card style="${lock ? 'opacity:.4' : ''}"><b>${s.n}</b> ${r}/${s.max}<br><small>${s.d}</small><br><button ${lock || r >= s.max || pts() < cost ? 'disabled' : ''} onclick="buySkill('${s.id}')">${r >= s.max ? 'MAX' : '+ (' + cost + '⭐)'}</button></div>`;
    }
    h += '</div>';
  }
  ui.innerHTML = h + '</div>';
}
function buySkill(id) { const r = save.skills[id] || 0; if (pts() >= r + 1) { save.skills[id] = r + 1; persist(); tree(); } }

// ---------- Jump&Run ----------
let run = null, last = 0, paused = false, curLv = null;
function play(wi, li, k, race) {
  lastK = k; const S = stats(), used = [];
  for (const [id, txt, f] of [['heart', '🍪 +1 Herz', () => S.maxhp++], ['time', '⏰ +20s', () => S.time += 20], ['shield', '🛡️ Schild', () => S.shield++]])
    if (save.cons[id] > 0) { save.cons[id]--; f(); used.push(txt); }
  persist(); show('play'); $('#bd').style.display = S.dash ? 'flex' : 'none'; paused = false; curLv = { wi, li, k, race };
  AUDIO.play('level', { wi, li, kind: levelSpec(wi, li).kind });
  run = new Run(wi, li, S, r => endLevel(wi, li, k, r), { race });
  if (used.length) run.say(used.join(' · '));
  last = performance.now(); requestAnimationFrame(loop);
}
const buEl = $('#bu'); let slowN = 0, lastCan = null;
function loop(t) {
  const r = run; if (!r || paused) return;
  const rdt = (t - last) / 1000;
  if (!PREFS.saver) { slowN = rdt > .03 && rdt < .5 ? slowN + 1 : Math.max(0, slowN - 2); if (slowN > 90) { PREFS.saver = true; document.documentElement.classList.add('lowfx'); toast('🔋 Sparmodus automatisch an – läuft flüssiger'); } }
  r.update(Math.min(.05, rdt) * (window.ADM ? ADM.slow : 1)); last = t; if (r.canUse !== lastCan) { lastCan = r.canUse; buEl.style.opacity = r.canUse ? 1 : .35; }
  if (run === r) { r.draw(ctx); if (window.ADM) { ADM.tick(); ADM.overlay(ctx, r); } requestAnimationFrame(loop); }
}
function endLevel(wi, li, k, r) {
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose');
  if (!r.win) { ui.innerHTML = `<div class=card style="text-align:center;margin-top:10vh"><h2>💀 ${r.why}</h2><div class="row c"><button onclick="play(${wi},${li},${k})">Nochmal</button><button class=d onclick="map({from:${k}})">Karte</button></div></div>`; return; }
  const key = wi + ':' + li, first = !save.cleared[key], lv0 = Math.floor(save.shards / 20), lines = [];
  let gain = first ? r.shards : Math.ceil(r.shards * .25);
  const cg = first ? r.coins : Math.ceil(r.coins * .5), tb = Math.floor(r.time / 5);
  if (tb > 0) lines.push(`⏱ Zeitbonus: +${tb} 🪙`);
  if (r.secrets) lines.push(`🚪 Geheimräume entdeckt: ${r.secrets}`);
  if (r.bell && !save.bells[wi]) { save.bells[wi] = 1; lines.push('🔔 Cheys Glöckchen gefunden – Chey war hier!'); }
  if (r.moon && !save.moons[key]) { save.moons[key] = 1; gain += 20; lines.push('🌕 Großer Mond +20 Splitter'); }
  if (r.chest) {
    const un = ITEMS.filter(i => i.w === wi && !save.own[i.id]);
    if (un.length) { const it = pick(un); save.own[it.id] = 1; lines.push(`🎁 Neues Item: ${it.e} ${it.n} (${it.d})`); } else { gain += 5; lines.push('🎁 Truhe: +5 Splitter'); }
  }
  const used = Math.round(r.elapsed * 10) / 10, medal = used <= r.par ? 'gold' : used <= r.par * 1.5 ? 'silver' : 'bronze', bst = save.best[key];
  lines.push(`${MEDAL[medal]} ${used}s (Gold bis ${Math.round(r.par)}s)`);
  if (!bst || used < bst.t) { save.best[key] = { t: used, m: medal }; saveGhost(wi, li, r.rec); if (bst) lines.push('🏁 Neue Bestzeit! Im Rennen jagt dich jetzt deine Geister-Katze.'); }
  for (const n in r.kills) save.stats.kills[n] = (save.stats.kills[n] || 0) + r.kills[n];
  save.stats.secrets += r.secrets || 0; save.stats.levels++;
  save.shards += gain; save.coins += Math.round((cg + tb) * (1 + .5 * (save.ng || 0))); save.cleared[key] = 1; save.prog[wi] = Math.max(save.prog[wi], k + 1); persist(); checkAch();
  if (Math.floor(save.shards / 20) > lv0) lines.push('⭐ Neuer Skillpunkt im Mondbaum!');
  ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><div>${catImg('luna', 90)}</div><h2>✅ ${W[wi].name} ${li + 1} geschafft!</h2><p>🪙 +${cg} · 🌙 +${gain}${first ? '' : ' (Wiederholung)'} · ⏱ ${r.time}s übrig</p>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button class=g onclick="map({from:${k},advance:true})">Weiter ▶</button><button onclick="play(${wi},${li},${k})">🔄 Nochmal</button><button class=d onclick="map({from:${k}})">🗺️ Karte</button></div></div>`;
}

// ---------- Pause, Tipps ----------
function pauseGame() {
  if (!run || paused || run.done || mode !== 'play') return; paused = true; AUDIO.duck(.25); IN.l = IN.r = IN.j = 0;
  $('#pbox').innerHTML = `<h2>⏸ Pause</h2><button class=g onclick="resumeGame()">▶ Weiter</button><button onclick="restartLevel()">🔄 Level neu starten</button>
  <label>🎵 Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>🔊 Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <button class=d onclick="quitLevel()">🗺️ Zur Karte</button>`;
  $('#pause').style.display = 'flex';
}
function resumeGame() { if (!paused) return; paused = false; $('#pause').style.display = 'none'; AUDIO.duck(1); last = performance.now(); requestAnimationFrame(loop); }
function restartLevel() { $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; play(curLv.wi, curLv.li, curLv.k, curLv.race); }
function quitLevel() { $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; AUDIO.stop(); map({ from: curLv.k }); }
function setPref(k, v) { PREFS[k] = v; savePrefs(); }
const TIPS = {
  basics: '🐱 ◀ ▶ laufen · ⤒ springen · ⚔️ schlagen. Sammle 🌙 und 🪙 – das Ziel ist die 🏁!',
  dash: '💨 Dash: Drück 💨 (PC: Shift) für einen schnellen Sprint. Dabei bist du kurz unverwundbar.',
  wall: '🧗 Wandsprung: In der Luft gegen eine Wand drücken, dann springen.', glide: '🍃 Gleiten: In der Luft den Sprung-Knopf gedrückt halten.',
  combo: '⚔️ Kombo: Schnell hintereinander zuschlagen macht mehr Schaden.',
  door: '🚪 Geheimraum! Stell dich auf das Rohr oder vor die Tür und drück ⬇ (PC: Pfeil runter / S).',
  springs: '🟩 Sprungfedern schleudern dich hoch – einfach draufspringen.', movers: '🪵 Bewegliche Plattformen tragen dich mit.',
  crumble: '🪵 Brüchige Planken brechen kurz nach dem Betreten – nicht stehen bleiben!', rain: '🌧️ Es regnet – nur Stimmung, der Boden bleibt griffig.',
  wind: '💨 Starker Wind drückt dich zur Seite – spring dagegen an.', ice: '🧊 Rutschiges Eis: Du bremst viel später.',
  dark: '🌑 Es ist dunkel – nur Lunas Licht zeigt den Weg.', boulders: '⚠️ Steinschlag! Achte auf die Warnzeichen oben im Bild.',
  fireballs: '🔥 Feuerbälle springen aus den Abgründen – das Timing ist alles.', lowgrav: '🌙 Mond-Schwerkraft: Du springst höher und schwebst länger.',
  swarm: '🐜 Ein Schwarm! Die Kleinen jagen dich – schlag sie oder spring auf sie.', shoot: '🥥 Manche Gegner werfen Geschosse – weich aus oder schlag sie weg.',
  spiky: '🔴 Rote Stacheln: Nicht draufspringen – schlag diese Gegner!', drops: '🎁 Items, die im Level erscheinen, helfen dir bis zum Levelende.',
};
const tipQ = []; let tipBusy = false;
function tip(k) {
  if (!TIPS[k] || save.tips[k]) return; save.tips[k] = 1; persistRaw(); tipQ.push(TIPS[k]); if (!tipBusy) nextTip();
}
function nextTip() {
  const e = $('#tip'), t = tipQ.shift(); if (!t) { tipBusy = false; e.style.display = 'none'; return; }
  tipBusy = true; e.textContent = t; e.style.display = 'block'; setTimeout(nextTip, 4800);
}

// ---------- Einstellungen, Spielstand-Code, Cloud ----------
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function applySave(o) { save = Object.assign(defSave(), o); persistRaw(); lastAt = null; }
function settings(msg) {
  show('ui'); const c = CLOUD.cfg();
  ui.innerHTML = `<div class=hd><h2>⚙️ Einstellungen</h2><button class=d onclick="showTitle()">Zurück</button></div>
  ${msg ? `<div class=card>${msg}</div>` : ''}
  <div class=card><h3>🔊 Ton</h3><label>🎵 Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>🔊 Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.vib ? 'checked' : ''} style="width:auto" onchange="setPref('vib',this.checked)"> 📳 Vibration bei Treffern</label></div>
  <div class=card><h3>🎮 Steuerung &amp; Leistung</h3><label>Touch-Tasten</label>
  <div class=row><button class="${PREFS.btn === .85 ? 'g' : 'd'}" onclick="setPref('btn',.85);settings()">Klein</button><button class="${PREFS.btn === 1 ? 'g' : 'd'}" onclick="setPref('btn',1);settings()">Normal</button><button class="${PREFS.btn === 1.25 ? 'g' : 'd'}" onclick="setPref('btn',1.25);settings()">Groß</button></div>
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.lefty ? 'checked' : ''} style="width:auto" onchange="setPref('lefty',this.checked)"> ✋ Linkshänder-Layout (Tasten spiegeln)</label>
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.saver ? 'checked' : ''} style="width:auto" onchange="setPref('saver',this.checked)"> 🔋 Energiesparmodus (weniger Effekte)</label>
  <div class=row><button class=d data-fs onclick="FS.toggle()">⛶</button><button class=d onclick="save.tips={};persistRaw();toast('Hinweise werden wieder angezeigt')">💡 Hinweise zurücksetzen</button></div></div>
  <div class=card><h3>🎮 Controller</h3><small>PS4/PS5-Controller per Bluetooth oder USB verbinden und eine Taste drücken. Stick/Steuerkreuz: laufen · ✕ springen · ◻ schlagen · ○ oder R1: Dash · △ oder Stick runter: Tür/Rohr · Options: Pause. Auf der Karte: L1/R1 Welt wechseln · ◻ Beutel · △ Fähigkeitenbaum · ↑ Menüleiste · Options Menü. In Menüs und nach dem Level: Steuerkreuz/Stick wählen, ✕ bestätigen, ○ zurück.</small></div>
  <div class=card><h3>💾 Spielstand-Code</h3><small>Kopiere den Code und füge ihn auf einem anderen Gerät ein. Funktioniert auch ohne Cloud.</small>
  <textarea id=cd readonly rows=3>${CLOUD.exportCode()}</textarea><div class=row><button onclick="copyCode()">📋 Kopieren</button></div>
  <textarea id=imp rows=3 placeholder="Code hier einfügen"></textarea><div class=row><button class=g onclick="importCode()">⬇️ Importieren</button></div></div>
  <div class=card><h3>☁️ Cloud-Speicher</h3><small>${esc(CLOUD.status || 'Noch nicht verbunden.')}</small>
  <label>Datenbank-URL</label><input id=cu value="${esc(c.url || '')}" placeholder="https://dein-projekt-default-rtdb.europe-west1.firebasedatabase.app">
  <label>Spieler-Code (wie ein Passwort – nicht teilen!)</label><input id=cc value="${esc(c.code || '')}" placeholder="XXXX-XXXX-XXXX">
  <div class=row><button class=d onclick="cloudGen()">🎲 Neuer Code</button><button onclick="cloudSave()">☁️ Speichern</button><button onclick="cloudLoad()">☁️ Laden</button></div>
  <label style="display:block;margin:8px 0"><input type=checkbox id=ca ${c.auto ? 'checked' : ''} style="width:auto" onchange="cloudAuto()"> Automatisch synchronisieren</label>
  <details><summary>Einrichtung (einmalig, kostenlos)</summary><ol>
  <li>Auf console.firebase.google.com ein Projekt anlegen.</li>
  <li>Build → Realtime Database → Datenbank erstellen (Region Europa).</li>
  <li>Tab „Regeln": <code>{"rules":{"saves":{"$code":{".read":true,".write":true,".validate":"newData.hasChildren(['ts','data'])"}}}}</code> einfügen und veröffentlichen.</li>
  <li>Die Datenbank-URL oben eintragen, „Neuer Code" drücken, „Speichern". Auf dem zweiten Gerät dieselbe URL und denselben Code eintragen und „Laden" drücken.</li></ol>
  <small>Wer deinen Code kennt, kann deinen Spielstand lesen und überschreiben. Kein Konto und keine Daten außer dem Spielstand.</small></details></div>`;
}
function cloudRead() { CLOUD.setCfg({ url: $('#cu').value.trim(), code: $('#cc').value.trim().toUpperCase() }); }
function cloudGen() { $('#cc').value = CLOUD.newCode(); cloudRead(); }
function cloudAuto() { cloudRead(); CLOUD.setCfg({ auto: $('#ca').checked }); if ($('#ca').checked) CLOUD.touch(); }
async function cloudSave() { cloudRead(); try { await CLOUD.push(); settings('✅ In der Cloud gespeichert.'); } catch (e) { settings('⚠️ ' + esc(e.message)); } }
async function cloudLoad() {
  cloudRead();
  try {
    const r = await CLOUD.pull();
    if (confirm('Den lokalen Spielstand durch den Cloud-Stand ersetzen?')) { applySave(r.data); settings('✅ Aus der Cloud geladen.'); }
  } catch (e) { settings('⚠️ ' + esc(e.message)); }
}
function copyCode() {
  const t = $('#cd'); t.select();
  (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('📋 Code kopiert'), () => { try { document.execCommand('copy'); toast('📋 Code kopiert'); } catch (e) { toast('Bitte den Code von Hand markieren und kopieren'); } });
}
function importCode() {
  try { const o = CLOUD.parseCode($('#imp').value); if (confirm('Den aktuellen Spielstand überschreiben?')) { applySave(o); settings('✅ Spielstand importiert.'); } }
  catch (e) { settings('⚠️ ' + esc(e.message)); }
}

// ---------- Eingabe ----------
const KEY = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'j', w: 'j', ' ': 'j', x: 'a', z: 'a', j: 'a', Shift: 'dash', c: 'dash', ArrowDown: 'use', s: 'use' };
function setIn(c, v) { if (c === 'l') IN.l = v; else if (c === 'r') IN.r = v; else if (c === 'j') { IN.j = v; if (v) IN.jb = .12; } else if (c === 'a' && v) IN.ap = 1; else if (c === 'dash' && v) IN.dash = 1; else if (c === 'use' && v) IN.use = 1; }
const typing = e => e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
addEventListener('keydown', e => {
  if (typing(e)) return;
  if (mode === 'map' && MV) {
    if (e.key === 'Enter' || e.key === ' ') { const b = document.querySelector('#pop button'); if (b) b.click(); e.preventDefault(); return; }
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (dir && !MV.moving) {
      const cur = MV.at.shop != null ? MV.L.shops[MV.at.shop].host : MV.at.k, nk = cur + dir;
      if (nk >= 0 && nk < MV.L.M && nk <= save.prog[MV.wi]) mvGo({ k: nk });
    }
    return;
  }
  const c = KEY[e.key]; if (c) { e.preventDefault(); if (!e.repeat) setIn(c, 1); }
});
addEventListener('keyup', e => { if (typing(e)) return; const c = KEY[e.key]; if (c) setIn(c, 0); });
for (const [id, c] of [['#bl', 'l'], ['#br', 'r'], ['#bj', 'j'], ['#ba', 'a'], ['#bd', 'dash'], ['#bu', 'use']]) {
  const el = $(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('on'); setIn(c, 1); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, () => { el.classList.remove('on'); setIn(c, 0); });
}
$('#q').addEventListener('click', pauseGame);
addEventListener('keydown', e => { if (typing(e)) return; if (e.key === 'Escape' || e.key === 'p') { if (paused) resumeGame(); else pauseGame(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
addEventListener('contextmenu', e => e.preventDefault());
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => { });

showTitle();
CLOUD.boot();
applyPrefs();
