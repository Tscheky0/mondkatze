// UI, Speicherstand, Story, Laeden, Skillbaum, Beutel, Bosskampf und Spielschleife.
const $ = s => document.querySelector(s), ui = $('#ui'), cv = $('#cv'), ctx = cv.getContext('2d', { alpha: false, desynchronized: true }), tc = $('#tc');
const defSave = () => ({ w: 0, prog: [0, 0, 0, 0, 0, 0, 0], shards: 0, coins: 0, skills: {}, own: {}, load: [], moons: {}, cleared: {}, cons: {}, seen: {}, bells: {}, tips: {}, cos: { own: {}, eq: {} }, stats: { kills: {}, secrets: 0, levels: 0 }, ach: {}, best: {}, rank: {}, daily: {}, editor: null, ng: 0, ts: 0, chars: { p1: 'luna', p2: 'minsch', coop: false } });
const SAVE_KEY = window.ADMIN ? 'mondkatze_admin' : 'mondkatze';
let save; try { save = Object.assign(defSave(), JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { save = defSave(); }
while (save.prog.length < W.length) save.prog.push(0);
const cheyOpen = () => (save.ng || 0) >= 1; // Chey wird erst mit Neues Spiel+ spielbar
if (!cheyOpen()) { if (save.chars.p1 === 'chey') save.chars.p1 = save.chars.p2 === 'luna' ? 'minsch' : 'luna'; if (save.chars.p2 === 'chey') save.chars.p2 = save.chars.p1 === 'minsch' ? 'luna' : 'minsch'; }
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
  <div class="row c"><button class=g onclick="daily()">📅 Tageslevel${save.daily.streak ? ' 🔥' + save.daily.streak : ''}</button><button class=d onclick="chars('title')">🐱 Charaktere</button><button class=d onclick="editor('title')">🛠️ Editor</button><button class=d onclick="album()">📖 Album</button><button class=d onclick="account()">👤 ${ACC.user ? esc(ACC.user.name) : 'Konto'}</button><button class=g onclick="online()">🌐 Online-Koop</button><button class=d onclick="settings()">⚙️ Einstellungen &amp; Cloud</button><button class=d data-fs onclick="FS.toggle()">⛶</button>${save.cleared['5:boss'] ? `<button class=g onclick="startNG()">🔁 Neues Spiel+ (${(save.ng || 0) + 1})</button>` : ''}</div>
  <small>Handy quer halten · Android/iPhone: im Browser "Zum Startbildschirm"</small><br><small>Version 20</small></div>`;
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
  <div><span>🪙 ${save.coins}</span><span>🌙 ${save.shards % 20}/20</span><span>⭐ ${pts()}</span><button onclick="bag()">🎒</button><button onclick="tree()">🌟${pts() > 0 ? '❗' : ''}</button><button class=d onclick="online()">🌐${NET.live ? ' ' + esc(NET.peer) : ''}</button><button class=d onclick="chars('map')">🐱</button><button class=d data-fs onclick="FS.toggle()">⛶</button><button class=d onclick="showTitle()">☰</button></div>`;
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
function go(k, race) {
  if (NET.live && NET.mode === 'guest') return toast('Im Online-Koop wählt der Host das Level');
  lastK = k; const nd = nodes(save.w)[k];
  if (nd.t === 'lv') play(save.w, nd.i, k, race); else if (NET.live && NET.mode === 'host') toast('Bosskämpfe gibt es nur solo – trenne zuerst im 🌐-Menü'); else battle(save.w, nd.t, k);
}

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
function play(wi, li, k, race, resume, daily) {
  lastK = k; const S = stats(), used = [];
  for (const [id, txt, f] of [['heart', '🍪 +1 Herz', () => S.maxhp++], ['time', '⏰ +20s', () => S.time += 20], ['shield', '🛡️ Schild', () => S.shield++]])
    if (save.cons[id] > 0) { save.cons[id]--; f(); used.push(txt); }
  const netHost = !!(NET.live && NET.mode === 'host' && !race && !daily);
  const chars = netHost ? [save.chars.p1, netGuestChar(save.chars.p1)] : race || !save.chars.coop ? [save.chars.p1] : [save.chars.p1, save.chars.p2];
  persist(); show('play'); $('#bd').style.display = charStats(S, save.chars.p1).dash ? 'flex' : 'none'; paused = false; curLv = { wi, li, k, race, daily };
  AUDIO.play('level', { wi, li, kind: levelSpec(wi, li).kind });
  run = new Run(wi, li, S, r => { if (netHost) { NET.hostRun = false; netSend({ t: 'end', r: { ...r, rec: [] } }); } daily ? endDaily(daily, r) : endLevel(wi, li, k, r); }, { race, resume, seed: daily ? daily.seed : 0, chars, net: netHost ? 'host' : undefined });
  if (netHost) netStartHost(run, wi, li, k);
  if (used.length) run.say(used.join(' · '));
  last = performance.now(); startLoop();
}
const buEl = $('#bu'); let slowN = 0, lastCan = null, looping = false;
const startLoop = () => { if (!looping) { looping = true; requestAnimationFrame(loop); } };
function loop(t) {
  const r = run; if (!r || paused) { looping = false; return; }
  const rdt = (t - last) / 1000;
  if (!PREFS.saver) { slowN = rdt > .03 && rdt < .5 ? slowN + 1 : Math.max(0, slowN - 2); if (slowN > 90) { PREFS.saver = true; document.documentElement.classList.add('lowfx'); toast('🔋 Sparmodus automatisch an – läuft flüssiger'); } }
  if (r.net === 'guest') netGuestInput();
  r.update(Math.min(.05, rdt) * (window.ADM ? ADM.slow : 1)); last = t; if (r.net === 'host') netHostTick(r, Math.min(.05, rdt)); if (r.canUse !== lastCan) { lastCan = r.canUse; buEl.style.opacity = r.canUse ? 1 : .35; }
  if (run === r) { r.draw(ctx); if (window.ADM) { ADM.tick(); ADM.overlay(ctx, r); } requestAnimationFrame(loop); } else looping = false;
}
const RANKV = { C: 0, B: 1, A: 2, S: 3 }, RCOL = { C: '#b9c6e6', B: '#7cd6ff', A: '#7dff9a', S: '#ffd54a' };
// Wertung aus Zeit, getroffen werden, Kills, Kombo, Geheimnissen und Sammelstuecken
function rankOf(r) {
  const kills = Object.values(r.kills).reduce((a, b) => a + b, 0);
  let pts = r.elapsed <= r.par ? 40 : r.elapsed <= r.par * 1.5 ? 25 : 10;
  pts += r.hits === 0 ? 30 : r.hits <= 2 ? 15 : r.hits <= 4 ? 5 : 0;
  pts += Math.min(25, kills * 3) + (r.combo || 0) * 5 + (r.secrets || 0) * 8 + (r.moon ? 12 : 0) + (r.bell ? 6 : 0) + (r.chest ? 6 : 0) + Math.min(20, Math.round(r.shards * 1.2));
  return pts >= 105 ? 'S' : pts >= 80 ? 'A' : pts >= 55 ? 'B' : 'C';
}
function endLevel(wi, li, k, r) {
  const gst = NET.live && NET.mode === 'guest';
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose');
  if (!r.win) { ui.innerHTML = `<div class=card style="text-align:center;margin-top:10vh"><h2>💀 ${r.why}</h2><div class="row c">${r.cpX ? `<button class=g onclick="play(${wi},${li},${k},false,{cpX:${Math.round(r.cpX)},cpY:${Math.round(r.cpY)},cpTime:${Math.round(r.cpTime)}})">🏮 Vom Checkpoint</button>` : ''}<button onclick="play(${wi},${li},${k})">${r.cpX ? 'Von vorn' : 'Nochmal'}</button><button class=d onclick="map({from:${k}})">Karte</button></div></div>`; if (gst) netGuestWait(); return; }
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
  if (!bst || used < bst.t) { save.best[key] = { t: used, m: medal }; if (r.rec && r.rec.length > 6) saveGhost(wi, li, r.rec); if (bst) lines.push('🏁 Neue Bestzeit! Im Rennen jagt dich jetzt deine Geister-Katze.'); }
  const rk = rankOf(r), rko = save.rank[key]; if (!rko || RANKV[rk] > RANKV[rko]) { save.rank[key] = rk; if (rko) lines.push('🏅 Neuer Bestrang!'); }
  lines.push(`💥 ${r.hits} Treffer erhalten`);
  for (const n in r.kills) save.stats.kills[n] = (save.stats.kills[n] || 0) + r.kills[n];
  save.stats.secrets += r.secrets || 0; save.stats.levels++; save.stats.gates = (save.stats.gates || 0) + (r.gates || 0); save.stats.cps = (save.stats.cps || 0) + (r.cpHit || 0); if (r.coop) save.stats.coop = (save.stats.coop || 0) + 1; save.stats.chars = save.stats.chars || {}; for (const ch of r.chars || []) save.stats.chars[ch] = 1;
  save.shards += gain; save.coins += Math.round((cg + tb) * (1 + .5 * (save.ng || 0))); save.cleared[key] = 1; save.prog[wi] = Math.max(save.prog[wi], k + 1); persist(); checkAch();
  if (Math.floor(save.shards / 20) > lv0) lines.push('⭐ Neuer Skillpunkt im Mondbaum!');
  ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><div>${catImg('luna', 90)}</div><h2>✅ ${W[wi].name} ${li + 1} geschafft!</h2><div class=rank style="color:${RCOL[rk]}">${rk}</div><p>🪙 +${cg} · 🌙 +${gain}${first ? '' : ' (Wiederholung)'} · ⏱ ${r.time}s übrig</p>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button class=g onclick="map({from:${k},advance:true})">Weiter ▶</button><button onclick="play(${wi},${li},${k})">🔄 Nochmal</button><button class=d onclick="map({from:${k}})">🗺️ Karte</button></div></div>`;
  if (gst) netGuestWait();
}

// ---------- Tageslevel: pro Tag ein festes Level mit eigener Bestzeit und Serie ----------
function dailyInfo() {
  const d = new Date(), seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(), open = [];
  for (let w = 0; w < W.length; w++) if (unlocked(w)) open.push(w);
  const wi = open[seed % open.length], li = Math.min(W[wi].n - 1, 3 + ((seed >> 3) % (W[wi].n - 3)));
  return { seed, wi, li };
}
function daily() { const D = dailyInfo(); show('play'); play(D.wi, D.li, -1, false, null, D); }
function endDaily(D, r) {
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose');
  if (!r.win) { ui.innerHTML = `<div class=card style="text-align:center;margin-top:10vh"><h2>💀 ${r.why}</h2><div class="row c"><button onclick="daily()">Nochmal</button><button class=d onclick="showTitle()">Menü</button></div></div>`; return; }
  const dl = save.daily, first = dl.last !== D.seed, used = Math.round(r.elapsed * 10) / 10, rk = rankOf(r), lines = [];
  if (first) { const yd = new Date(); yd.setDate(yd.getDate() - 1); const ys = yd.getFullYear() * 10000 + (yd.getMonth() + 1) * 100 + yd.getDate(); dl.streak = dl.last === ys ? (dl.streak || 0) + 1 : 1; dl.last = D.seed; dl.best = used; const c = 60 + Math.min(7, dl.streak) * 10; save.coins += c; save.shards += 10; lines.push(`🪙 +${c} · 🌙 +10 (Serie ${dl.streak} 🔥)`); }
  else if (used < dl.best) { dl.best = used; lines.push('🏁 Neue Tagesbestzeit!'); }
  lines.push(`⏱ ${used}s · Bestzeit heute: ${dl.best}s`, `💥 ${r.hits} Treffer erhalten`); persist();
  ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><div>${catImg(save.chars.p1, 90)}</div><h2>📅 Tageslevel geschafft!</h2><div class=rank style="color:${RCOL[rk]}">${rk}</div>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button onclick="daily()">🔄 Nochmal</button><button class=g onclick="showTitle()">Menü</button></div></div>`;
}

// ---------- Eigene Level (Editor, geteilte Links) ----------
let CUST = null;
function playCustom(d, from) {
  CUST = d; const S = stats(); persist(); show('play'); $('#bd').style.display = charStats(S, save.chars.p1).dash ? 'flex' : 'none'; paused = false; curLv = { wi: d.w, li: 3, k: -1, custom: d, from };
  AUDIO.play('level', { wi: d.w, li: 3, kind: d.kind });
  run = new Run(d.w, 3, S, r => endCustom(d, r, from), { custom: d, chars: save.chars.coop ? [save.chars.p1, save.chars.p2] : [save.chars.p1] });
  last = performance.now(); startLoop();
}
function endCustom(d, r, from) {
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose'); const used = Math.round(r.elapsed * 10) / 10;
  ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><div>${catImg(save.chars.p1, 90)}</div><h2>${r.win ? '✅ Level geschafft!' : '💀 ' + r.why}</h2>${r.win ? `<p>⏱ ${used}s · 🪙 ${r.coins} · 🌙 ${r.shards}</p>` : ''}<div class="row c"><button class=g onclick="playCustom(CUST,'${from}')">🔄 Nochmal</button>${from === 'editor' ? '<button onclick="editor()">✏️ Zum Editor</button>' : '<button class=d onclick="showTitle()">Menü</button>'}</div></div>`;
}

// ---------- Pause, Tipps ----------
function pauseGame() {
  if (!run || paused || run.done || mode !== 'play') return;
  if (run.net) { if (confirm(run.net === 'host' ? 'Das Level beenden und zur Karte?' : 'Das Online-Spiel verlassen?')) { if (run.net === 'host') quitLevel(); else netLeave(); } return; }
  paused = true; AUDIO.duck(.25); IN.l = IN.r = IN.j = 0;
  $('#pbox').innerHTML = `<h2>⏸ Pause</h2><button class=g onclick="resumeGame()">▶ Weiter</button><button onclick="restartLevel()">🔄 Level neu starten</button>
  <label>🎵 Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>🔊 Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <button class=d onclick="quitLevel()">🗺️ Zur Karte</button>`;
  $('#pause').style.display = 'flex';
}
function resumeGame() { if (!paused) return; paused = false; $('#pause').style.display = 'none'; AUDIO.duck(1); last = performance.now(); startLoop(); }
function restartLevel() { $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; if (curLv.custom) return playCustom(curLv.custom, curLv.from); play(curLv.wi, curLv.li, curLv.k, curLv.race, null, curLv.daily); }
function quitLevel() { if (NET.hostRun) { NET.hostRun = false; netSend({ t: 'abort' }); } $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; AUDIO.stop(); if (curLv.custom) { if (curLv.from === 'editor') editor(); else showTitle(); } else if (curLv.daily) showTitle(); else map({ from: curLv.k }); }
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

// ---------- Charaktere & lokaler Koop ----------
let charsBack = 'title';
function chars(back) {
  if (back) charsBack = back; show('ui'); const C = save.chars;
  const card = (id, slot) => id === 'chey' && !cheyOpen() ? `<div class=it style="width:150px;opacity:.55"><div class=e>🔒</div><b>Chey</b><br><small>Wird mit Neues Spiel+ freigeschaltet</small></div>` : `<div class="it ${C[slot] === id ? 'sel' : ''}" style="width:150px" tabindex=0 onclick="pickChar('${slot}','${id}')"><div class=e>${catImg(id, 76)}</div><b>${CHAR[id].n}</b><br><small>${CHAR[id].d}</small></div>`;
  ui.innerHTML = `<div class=hd><h2>🐱 Charaktere</h2><button class=d onclick="${charsBack === 'map' ? 'map()' : 'showTitle()'}">Zurück</button></div>
  <div class=card><h3>Spielmodus</h3><div class=row><button class="${C.coop ? 'd' : 'g'}" onclick="setCoop(false)">1 Spieler</button><button class="${C.coop ? 'g' : 'd'}" onclick="setCoop(true)">👥 2 Spieler (lokal)</button></div>
  ${C.coop ? '<small>Spieler 1: A/D laufen · W oder Leertaste springen · F schlagen · G Dash · S Tür.<br>Spieler 2: Pfeiltasten · ↑ springen · Enter schlagen · rechte Shift Dash · ↓ Tür.<br>Oder zwei Controller. Fällt eine Katze um, steht sie nach 6 Sekunden wieder auf. Das Level ist geschafft, wenn alle lebenden Katzen im Ziel sind.</small>' : '<small>Im 2-Spieler-Modus spielen Luna und Minsch gemeinsam an einem Gerät. Chey ist ein optionaler dritter Charakter und wird mit Neues Spiel+ freigeschaltet.</small>'}</div>
  <div class=card><h3>${C.coop ? 'Spieler 1' : 'Dein Charakter'}</h3>${['luna', 'minsch', 'chey'].map(id => card(id, 'p1')).join('')}</div>
  ${C.coop ? `<div class=card><h3>Spieler 2</h3>${['luna', 'minsch', 'chey'].map(id => card(id, 'p2')).join('')}</div>` : ''}`;
}
function pickChar(slot, id) { if (id === 'chey' && !cheyOpen()) return toast('🔒 Chey gibt es erst ab Neues Spiel+'); const C = save.chars, other = slot === 'p1' ? 'p2' : 'p1'; if (C[other] === id) C[other] = C[slot]; C[slot] = id; persist(); chars(); }
function setCoop(v) { save.chars.coop = v; persist(); chars(); }

// ---------- Einstellungen, Spielstand-Code, Cloud ----------
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function applySave(o) { save = Object.assign(defSave(), o); persistRaw(); lastAt = null; }
function settings(msg) {
  show('ui'); const c = CLOUD.cfg();
  ui.innerHTML = `<div class=hd><h2>⚙️ Einstellungen</h2><button class=d onclick="showTitle()">Zurück</button></div>
  ${msg ? `<div class=card>${msg}</div>` : ''}
  <div class=card><h3>🔊 Ton</h3><label>🎵 Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>🔊 Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.vib ? 'checked' : ''} style="width:auto" onchange="setPref('vib',this.checked)"> 📳 Vibration bei Treffern</label>
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.retro ? 'checked' : ''} style="width:auto" onchange="setPref('retro',this.checked)"> 🎹 Retro-Sound (8-Bit-Musik statt Orchester)</label></div>
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
function setInto(T, c, v) { if (c === 'l') T.l = v; else if (c === 'r') T.r = v; else if (c === 'j') { T.j = v; if (v) T.jb = .12; } else if (c === 'a' && v) T.ap = 1; else if (c === 'dash' && v) T.dash = 1; else if (c === 'use' && v) T.use = 1; }
const setIn = (c, v) => setInto(IN, c, v), setIn2 = (c, v) => setInto(IN2, c, v);
// Lokaler Koop auf einer Tastatur: Spieler 1 links (WASD + F/G), Spieler 2 rechts (Pfeile + Enter/Shift rechts)
const K1 = { KeyA: 'l', KeyD: 'r', KeyW: 'j', Space: 'j', KeyS: 'use', KeyF: 'a', KeyG: 'dash', ShiftLeft: 'dash' }, K2 = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'j', ArrowDown: 'use', Enter: 'a', Slash: 'a', ShiftRight: 'dash' };
const coopKeys = () => save.chars.coop && mode === 'play' && !NET.live;
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
  if (coopKeys()) { const c1 = K1[e.code], c2 = K2[e.code]; if (c1 || c2) e.preventDefault(); if (!e.repeat) { if (c1) setIn(c1, 1); if (c2) setIn2(c2, 1); } return; }
  const c = KEY[e.key]; if (c) { e.preventDefault(); if (!e.repeat) setIn(c, 1); }
});
addEventListener('keyup', e => { if (typing(e)) return; if (coopKeys()) { const c1 = K1[e.code], c2 = K2[e.code]; if (c1) setIn(c1, 0); if (c2) setIn2(c2, 0); return; } const c = KEY[e.key]; if (c) setIn(c, 0); });
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
// Geteilter Level-Link (?lvl=...) direkt anbieten
try { const q = new URLSearchParams(location.search).get('lvl'); if (q) { const d = edDecode(q); history.replaceState(null, '', location.pathname); setTimeout(() => { if (confirm('Ein geteiltes Level wurde gefunden. Jetzt spielen?')) playCustom(d, 'link'); }, 700); } } catch (e) { setTimeout(() => toast('⚠️ Der Level-Link ist ungültig'), 600); }
CLOUD.boot(); ACC.boot();
applyPrefs();
