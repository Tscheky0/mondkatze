// UI, Speicherstand, Story, Laeden, Skillbaum, Beutel, Bosskampf und Spielschleife.
const $ = s => document.querySelector(s), ui = $('#ui'), cv = $('#cv'), ctx = cv.getContext('2d', { alpha: false, desynchronized: true }), tc = $('#tc');
const defSave = () => ({ w: 0, prog: [0, 0, 0, 0, 0, 0], shards: 0, coins: 0, skills: {}, own: {}, load: [], moons: {}, cleared: {}, cons: {}, seen: {}, bells: {}, tips: {}, cos: { own: {}, eq: {} }, stats: { kills: {}, secrets: 0, levels: 0 }, ach: {}, best: {}, ng: 0, ts: 0, chars: { p1: 'luna', p2: 'minsch', coop: false } });
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
  <p>Der Mondverschlinger hat <b>Chey</b> entfÃ¼hrt und den Mond verschluckt.<br>Hilf <b>Luna</b>, Chey zu retten!</p>
  <div class="row c"><button class=g onclick="start()">â–¶ ${save.seen.intro ? 'Weiter' : 'Neues Abenteuer'}</button><button class=r onclick="resetGame()">Neu starten</button></div>
  <div class="row c"><button class=d onclick="chars('title')">ðŸ± Charaktere</button><button class=d onclick="album()">ðŸ“– Album</button><button class=d onclick="settings()">âš™ï¸ Einstellungen &amp; Cloud</button><button class=d data-fs onclick="FS.toggle()">â›¶</button>${save.cleared['5:boss'] ? `<button class=g onclick="startNG()">ðŸ” Neues Spiel+ (${(save.ng || 0) + 1})</button>` : ''}</div>
  <small>Handy quer halten Â· Android/iPhone: im Browser "Zum Startbildschirm"</small><br><small>Version 12</small></div>`;
}
function start() { if (!save.seen.intro) cine('intro', {}, () => story(STORY.intro, () => { save.seen.intro = 1; persist(); map(); })); else map(); }
function resetGame() { if (confirm('Gesamten Fortschritt lÃ¶schen?')) { save = defSave(); persist(); lastAt = null; showTitle(); } }
function story(pages, done) {
  let i = 0;
  const step = () => {
    if (i >= pages.length) return done();
    const p = pages[i++]; show('ui');
    const who = p.w === 'luna' ? catImg('luna', 120) : p.w === 'chey' ? catImg('chey', 120) : p.w === 'boss' ? p.e : 'ðŸ“–';
    ui.innerHTML = `<div class=story><div class=who>${who}</div><b>${{ luna: 'Luna', chey: 'Chey', boss: '', narr: '' }[p.w]}</b><div class=txt>${p.t}</div>
    <button class=g id=nx>Weiter â–¶</button> <button class=d id=sk>Ãœberspringen</button></div>`;
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
  $('#hud').innerHTML = `<div><button class=d onclick="swW(-1)">â—€</button><span>${Wd.emoji} ${Wd.name}${save.ng ? ' Â· NG+' + save.ng : ''}</span><button class=d onclick="swW(1)">â–¶</button></div>
  <div><span>ðŸª™ ${save.coins}</span><span>ðŸŒ™ ${save.shards % 20}/20</span><span>â­ ${pts()}</span><button onclick="bag()">ðŸŽ’</button><button onclick="tree()">ðŸŒŸ${pts() > 0 ? 'â—' : ''}</button><button class=d onclick="chars('map')">ðŸ±</button><button class=d data-fs onclick="FS.toggle()">â›¶</button><button class=d onclick="showTitle()">â˜°</button></div>`;
}
function swW(d) {
  const n = save.w + d; if (n < 0 || n >= W.length) return;
  if (!unlocked(n)) return toast('ðŸ”’ Besiege erst den Boss von ' + W[n - 1].name + '!');
  save.w = n; persist(); lastAt = null; map();
}
function arrive(d) {
  if (!MV) return;
  const wi = MV.wi, Wd = W[wi], pr = save.prog[wi];
  lastAt = { wi, k: MV.at.k, shop: MV.at.shop };
  if (d.shop != null) { const sh = SHOPS[wi][d.shop]; popup(`<div><b>${sh.o} ${sh.n}</b><br><small>Items &amp; Boni kaufen</small></div><button class=g onclick="shop(${wi},${d.shop})">ðŸ›’ Eintreten</button>`); return; }
  const nd = MV.L.N[d.k]; let t, s;
  if (nd.t === 'lv') { t = `${nd.i + 1}. ${levelSpec(wi, nd.i).name}`; s = MOONLV.includes(nd.i) && !save.moons[wi + ':' + nd.i] ? 'ðŸŒ• Hier versteckt sich ein groÃŸer Mond' : 'Splitter, MÃ¼nzen &amp; Items sammeln'; }
  else { t = `${nd.t === 'boss' ? 'ðŸ‘‘ Boss' : 'âš”ï¸ WÃ¤chter'}: ${Wd[nd.t].n}`; s = 'Kampf mit Konter-System'; }
  const bst = nd.t === 'lv' && save.best[wi + ':' + nd.i], gh = nd.t === 'lv' && loadGhost(wi, nd.i);
  popup(`<div><b>${t}</b><br><small>${s}${bst ? ` Â· ${MEDAL[bst.m]} Bestzeit ${bst.t}s` : ''}</small></div><button class=g onclick="go(${d.k})">â–¶ ${d.k < pr ? 'Nochmal' : 'Start'}</button>${gh ? `<button class=d onclick="go(${d.k},true)">ðŸ‘» Rennen</button>` : ''}`);
}
function go(k, race) { lastK = k; const nd = nodes(save.w)[k]; if (nd.t === 'lv') play(save.w, nd.i, k, race); else battle(save.w, nd.t, k); }

// ---------- Laden ----------
let curShop = null;
function shop(wi, s) {
  curShop = { wi, s }; const keep = ui.scrollTop; show('ui');
  const sh = SHOPS[wi][s], items = ITEMS.filter(i => i.w === wi).slice(s * 2, s * 2 + 2), ip = it => 40 + wi * 30 + (ITEMS.indexOf(it) % 4) * 25;
  let h = `<div class=hd><h2>${sh.o} ${sh.n}</h2><b>ðŸª™ ${save.coins}</b><button class=d onclick="leaveShop()">ZurÃ¼ck</button></div><h3>AusrÃ¼stung</h3><div class=grid>`;
  for (const it of items) { const own = save.own[it.id], p = ip(it); h += `<div class=card><b>${it.e} ${it.n}</b><br><small>${it.d}</small><br><button ${own || save.coins < p ? 'disabled' : ''} onclick="buy('i','${it.id}',${p})">${own ? 'Gekauft' : 'ðŸª™ ' + p}</button></div>`; }
  h += '</div><h3>Verbrauchbar</h3><div class=grid>';
  for (const c of CONS) h += `<div class=card><b>${c.e} ${c.n}</b> (${save.cons[c.id] || 0})<br><small>${c.d}</small><br><button ${save.coins < c.p ? 'disabled' : ''} onclick="buy('c','${c.id}',${c.p})">ðŸª™ ${c.p}</button></div>`;
  const sp = 100 + wi * 20;
  h += `<div class=card><b>ðŸŒ™ 20 Mondsplitter</b><br><small>= 1 Skillpunkt</small><br><button ${save.coins < sp ? 'disabled' : ''} onclick="buy('s','',${sp})">ðŸª™ ${sp}</button></div></div>`;
  const cs = COS.filter(x => x.w === wi && x.s === s);
  if (cs.length) {
    h += '<h3>ðŸ‘’ Garderobe</h3><div class=grid>';
    for (const x of cs) { const own = save.cos.own[x.id], p = cosPrice(x); h += `<div class=card><b>${x.e} ${x.n}</b><br><small>${COS_T[x.t]}</small><br><button ${own || save.coins < p ? 'disabled' : ''} onclick="buy('o','${x.id}',${p})">${own ? 'Gekauft' : 'ðŸª™ ' + p}</button></div>`; }
    h += '</div>';
  }
  h += `<h3>ðŸŽ® Spiele</h3><div class=grid><div class=card><b>ðŸŽ£ Angeln</b><br><small>5 Runden Timing â€“ gewinne MÃ¼nzen</small><br><button ${save.coins < 20 ? 'disabled' : ''} onclick="fishing(${wi},${s})">ðŸª™ 20</button></div>
  <div class=card><b>ðŸƒ Memory</b><br><small>Finde 4 Paare in 14 ZÃ¼gen</small><br><button ${save.coins < 15 ? 'disabled' : ''} onclick="memory(${wi},${s})">ðŸª™ 15</button></div></div>`;
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
  let h = `<div class=hd><h2>ðŸŽ’ Beutel (${save.load.length}/3)</h2><button class=d onclick="wardrobe()">ðŸ‘’ Garderobe</button><button class=d onclick="map()">Fertig</button></div><p>WÃ¤hle bis zu 3 Items fÃ¼r die Level. Neue Items findest du in Truhen und LÃ¤den.</p>`;
  for (const it of ITEMS) h += save.own[it.id]
    ? `<div class="it ${save.load.includes(it.id) ? 'sel' : ''}" onclick="tog('${it.id}')"><div class=e>${it.e}</div><b>${it.n}</b><br>${it.d}</div>`
    : `<div class=it style="opacity:.4"><div class=e>â”</div>${W[it.w].emoji} ${W[it.w].name}</div>`;
  ui.innerHTML = h;
}
function tog(id) { const i = save.load.indexOf(id); if (i >= 0) save.load.splice(i, 1); else if (save.load.length < 3) save.load.push(id); persist(); bag(); }
function tree() {
  show('ui');
  let h = `<div class=hd><h2>ðŸŒŸ Mondbaum Â· Luna Lv ${lvl()}</h2><b>â­ ${pts()}</b><button class=d onclick="map()">ZurÃ¼ck</button></div><p><small>20 Mondsplitter = 1 Punkt. Kosten = Rangnummer.</small></p><div class=sk>`;
  for (const b of SKILLS) {
    h += `<div><h3>${b.b}</h3>`;
    for (const s of b.list) {
      const r = save.skills[s.id] || 0, lock = s.req && !save.skills[s.req], cost = r + 1;
      h += `<div class=card style="${lock ? 'opacity:.4' : ''}"><b>${s.n}</b> ${r}/${s.max}<br><small>${s.d}</small><br><button ${lock || r >= s.max || pts() < cost ? 'disabled' : ''} onclick="buySkill('${s.id}')">${r >= s.max ? 'MAX' : '+ (' + cost + 'â­)'}</button></div>`;
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
  for (const [id, txt, f] of [['heart', 'ðŸª +1 Herz', () => S.maxhp++], ['time', 'â° +20s', () => S.time += 20], ['shield', 'ðŸ›¡ï¸ Schild', () => S.shield++]])
    if (save.cons[id] > 0) { save.cons[id]--; f(); used.push(txt); }
  persist(); show('play'); $('#bd').style.display = charStats(S, save.chars.p1).dash ? 'flex' : 'none'; paused = false; curLv = { wi, li, k, race };
  AUDIO.play('level', { wi, li, kind: levelSpec(wi, li).kind });
  run = new Run(wi, li, S, r => endLevel(wi, li, k, r), { race, chars: race || !save.chars.coop ? [save.chars.p1] : [save.chars.p1, save.chars.p2] });
  if (used.length) run.say(used.join(' Â· '));
  last = performance.now(); requestAnimationFrame(loop);
}
const buEl = $('#bu'); let slowN = 0, lastCan = null;
function loop(t) {
  const r = run; if (!r || paused) return;
  const rdt = (t - last) / 1000;
  if (!PREFS.saver) { slowN = rdt > .03 && rdt < .5 ? slowN + 1 : Math.max(0, slowN - 2); if (slowN > 90) { PREFS.saver = true; document.documentElement.classList.add('lowfx'); toast('ðŸ”‹ Sparmodus automatisch an â€“ lÃ¤uft flÃ¼ssiger'); } }
  r.update(Math.min(.05, rdt) * (window.ADM ? ADM.slow : 1)); last = t; if (r.canUse !== lastCan) { lastCan = r.canUse; buEl.style.opacity = r.canUse ? 1 : .35; }
  if (run === r) { r.draw(ctx); if (window.ADM) { ADM.tick(); ADM.overlay(ctx, r); } requestAnimationFrame(loop); }
}
function endLevel(wi, li, k, r) {
  run = null; show('ui'); AUDIO.stop(); AUDIO.sfx(r.win ? 'win' : 'lose');
  if (!r.win) { ui.innerHTML = `<div class=card style="text-align:center;margin-top:10vh"><h2>ðŸ’€ ${r.why}</h2><div class="row c"><button onclick="play(${wi},${li},${k})">Nochmal</button><button class=d onclick="map({from:${k}})">Karte</button></div></div>`; return; }
  const key = wi + ':' + li, first = !save.cleared[key], lv0 = Math.floor(save.shards / 20), lines = [];
  let gain = first ? r.shards : Math.ceil(r.shards * .25);
  const cg = first ? r.coins : Math.ceil(r.coins * .5), tb = Math.floor(r.time / 5);
  if (tb > 0) lines.push(`â± Zeitbonus: +${tb} ðŸª™`);
  if (r.secrets) lines.push(`ðŸšª GeheimrÃ¤ume entdeckt: ${r.secrets}`);
  if (r.bell && !save.bells[wi]) { save.bells[wi] = 1; lines.push('ðŸ”” Cheys GlÃ¶ckchen gefunden â€“ Chey war hier!'); }
  if (r.moon && !save.moons[key]) { save.moons[key] = 1; gain += 20; lines.push('ðŸŒ• GroÃŸer Mond +20 Splitter'); }
  if (r.chest) {
    const un = ITEMS.filter(i => i.w === wi && !save.own[i.id]);
    if (un.length) { const it = pick(un); save.own[it.id] = 1; lines.push(`ðŸŽ Neues Item: ${it.e} ${it.n} (${it.d})`); } else { gain += 5; lines.push('ðŸŽ Truhe: +5 Splitter'); }
  }
  const used = Math.round(r.elapsed * 10) / 10, medal = used <= r.par ? 'gold' : used <= r.par * 1.5 ? 'silver' : 'bronze', bst = save.best[key];
  lines.push(`${MEDAL[medal]} ${used}s (Gold bis ${Math.round(r.par)}s)`);
  if (!bst || used < bst.t) { save.best[key] = { t: used, m: medal }; saveGhost(wi, li, r.rec); if (bst) lines.push('ðŸ Neue Bestzeit! Im Rennen jagt dich jetzt deine Geister-Katze.'); }
  for (const n in r.kills) save.stats.kills[n] = (save.stats.kills[n] || 0) + r.kills[n];
  save.stats.secrets += r.secrets || 0; save.stats.levels++;
  save.shards += gain; save.coins += Math.round((cg + tb) * (1 + .5 * (save.ng || 0))); save.cleared[key] = 1; save.prog[wi] = Math.max(save.prog[wi], k + 1); persist(); checkAch();
  if (Math.floor(save.shards / 20) > lv0) lines.push('â­ Neuer Skillpunkt im Mondbaum!');
  ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><div>${catImg('luna', 90)}</div><h2>âœ… ${W[wi].name} ${li + 1} geschafft!</h2><p>ðŸª™ +${cg} Â· ðŸŒ™ +${gain}${first ? '' : ' (Wiederholung)'} Â· â± ${r.time}s Ã¼brig</p>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button class=g onclick="map({from:${k},advance:true})">Weiter â–¶</button><button onclick="play(${wi},${li},${k})">ðŸ”„ Nochmal</button><button class=d onclick="map({from:${k}})">ðŸ—ºï¸ Karte</button></div></div>`;
}

// ---------- Pause, Tipps ----------
function pauseGame() {
  if (!run || paused || run.done || mode !== 'play') return; paused = true; AUDIO.duck(.25); IN.l = IN.r = IN.j = 0;
  $('#pbox').innerHTML = `<h2>â¸ Pause</h2><button class=g onclick="resumeGame()">â–¶ Weiter</button><button onclick="restartLevel()">ðŸ”„ Level neu starten</button>
  <label>ðŸŽµ Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>ðŸ”Š Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <button class=d onclick="quitLevel()">ðŸ—ºï¸ Zur Karte</button>`;
  $('#pause').style.display = 'flex';
}
function resumeGame() { if (!paused) return; paused = false; $('#pause').style.display = 'none'; AUDIO.duck(1); last = performance.now(); requestAnimationFrame(loop); }
function restartLevel() { $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; play(curLv.wi, curLv.li, curLv.k, curLv.race); }
function quitLevel() { $('#pause').style.display = 'none'; paused = false; AUDIO.duck(1); run = null; AUDIO.stop(); map({ from: curLv.k }); }
function setPref(k, v) { PREFS[k] = v; savePrefs(); }
const TIPS = {
  basics: 'ðŸ± â—€ â–¶ laufen Â· â¤’ springen Â· âš”ï¸ schlagen. Sammle ðŸŒ™ und ðŸª™ â€“ das Ziel ist die ðŸ!',
  dash: 'ðŸ’¨ Dash: DrÃ¼ck ðŸ’¨ (PC: Shift) fÃ¼r einen schnellen Sprint. Dabei bist du kurz unverwundbar.',
  wall: 'ðŸ§— Wandsprung: In der Luft gegen eine Wand drÃ¼cken, dann springen.', glide: 'ðŸƒ Gleiten: In der Luft den Sprung-Knopf gedrÃ¼ckt halten.',
  combo: 'âš”ï¸ Kombo: Schnell hintereinander zuschlagen macht mehr Schaden.',
  door: 'ðŸšª Geheimraum! Stell dich auf das Rohr oder vor die TÃ¼r und drÃ¼ck â¬‡ (PC: Pfeil runter / S).',
  springs: 'ðŸŸ© Sprungfedern schleudern dich hoch â€“ einfach draufspringen.', movers: 'ðŸªµ Bewegliche Plattformen tragen dich mit.',
  crumble: 'ðŸªµ BrÃ¼chige Planken brechen kurz nach dem Betreten â€“ nicht stehen bleiben!', rain: 'ðŸŒ§ï¸ Es regnet â€“ nur Stimmung, der Boden bleibt griffig.',
  wind: 'ðŸ’¨ Starker Wind drÃ¼ckt dich zur Seite â€“ spring dagegen an.', ice: 'ðŸ§Š Rutschiges Eis: Du bremst viel spÃ¤ter.',
  dark: 'ðŸŒ‘ Es ist dunkel â€“ nur Lunas Licht zeigt den Weg.', boulders: 'âš ï¸ Steinschlag! Achte auf die Warnzeichen oben im Bild.',
  fireballs: 'ðŸ”¥ FeuerbÃ¤lle springen aus den AbgrÃ¼nden â€“ das Timing ist alles.', lowgrav: 'ðŸŒ™ Mond-Schwerkraft: Du springst hÃ¶her und schwebst lÃ¤nger.',
  swarm: 'ðŸœ Ein Schwarm! Die Kleinen jagen dich â€“ schlag sie oder spring auf sie.', shoot: 'ðŸ¥¥ Manche Gegner werfen Geschosse â€“ weich aus oder schlag sie weg.',
  spiky: 'ðŸ”´ Rote Stacheln: Nicht draufspringen â€“ schlag diese Gegner!', drops: 'ðŸŽ Items, die im Level erscheinen, helfen dir bis zum Levelende.',
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
  const card = (id, slot) => `<div class="it ${C[slot] === id ? 'sel' : ''}" style="width:150px" tabindex=0 onclick="pickChar('${slot}','${id}')"><div class=e>${catImg(id, 76)}</div><b>${CHAR[id].n}</b><br><small>${CHAR[id].d}</small></div>`;
  ui.innerHTML = `<div class=hd><h2>ðŸ± Charaktere</h2><button class=d onclick="${charsBack === 'map' ? 'map()' : 'showTitle()'}">ZurÃ¼ck</button></div>
  <div class=card><h3>Spielmodus</h3><div class=row><button class="${C.coop ? 'd' : 'g'}" onclick="setCoop(false)">1 Spieler</button><button class="${C.coop ? 'g' : 'd'}" onclick="setCoop(true)">ðŸ‘¥ 2 Spieler (lokal)</button></div>
  ${C.coop ? '<small>Spieler 1: A/D laufen Â· W oder Leertaste springen Â· F schlagen Â· G Dash Â· S TÃ¼r.<br>Spieler 2: Pfeiltasten Â· â†‘ springen Â· Enter schlagen Â· rechte Shift Dash Â· â†“ TÃ¼r.<br>Oder zwei Controller. FÃ¤llt eine Katze um, steht sie nach 6 Sekunden wieder auf. Das Level ist geschafft, wenn alle lebenden Katzen im Ziel sind.</small>' : '<small>Im 2-Spieler-Modus spielen Luna und Minsch gemeinsam an einem GerÃ¤t. Chey ist ein optionaler dritter Charakter.</small>'}</div>
  <div class=card><h3>${C.coop ? 'Spieler 1' : 'Dein Charakter'}</h3>${['luna', 'minsch', 'chey'].map(id => card(id, 'p1')).join('')}</div>
  ${C.coop ? `<div class=card><h3>Spieler 2</h3>${['luna', 'minsch', 'chey'].map(id => card(id, 'p2')).join('')}</div>` : ''}`;
}
function pickChar(slot, id) { const C = save.chars, other = slot === 'p1' ? 'p2' : 'p1'; if (C[other] === id) C[other] = C[slot]; C[slot] = id; persist(); chars(); }
function setCoop(v) { save.chars.coop = v; persist(); chars(); }

// ---------- Einstellungen, Spielstand-Code, Cloud ----------
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function applySave(o) { save = Object.assign(defSave(), o); persistRaw(); lastAt = null; }
function settings(msg) {
  show('ui'); const c = CLOUD.cfg();
  ui.innerHTML = `<div class=hd><h2>âš™ï¸ Einstellungen</h2><button class=d onclick="showTitle()">ZurÃ¼ck</button></div>
  ${msg ? `<div class=card>${msg}</div>` : ''}
  <div class=card><h3>ðŸ”Š Ton</h3><label>ðŸŽµ Musik</label><input type=range min=0 max=1 step=.05 value="${PREFS.music}" oninput="setPref('music',+this.value)">
  <label>ðŸ”Š Effekte</label><input type=range min=0 max=1 step=.05 value="${PREFS.sfx}" oninput="setPref('sfx',+this.value)">
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.vib ? 'checked' : ''} style="width:auto" onchange="setPref('vib',this.checked)"> ðŸ“³ Vibration bei Treffern</label></div>
  <div class=card><h3>ðŸŽ® Steuerung &amp; Leistung</h3><label>Touch-Tasten</label>
  <div class=row><button class="${PREFS.btn === .85 ? 'g' : 'd'}" onclick="setPref('btn',.85);settings()">Klein</button><button class="${PREFS.btn === 1 ? 'g' : 'd'}" onclick="setPref('btn',1);settings()">Normal</button><button class="${PREFS.btn === 1.25 ? 'g' : 'd'}" onclick="setPref('btn',1.25);settings()">GroÃŸ</button></div>
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.lefty ? 'checked' : ''} style="width:auto" onchange="setPref('lefty',this.checked)"> âœ‹ LinkshÃ¤nder-Layout (Tasten spiegeln)</label>
  <label style="display:block;margin:8px 0"><input type=checkbox ${PREFS.saver ? 'checked' : ''} style="width:auto" onchange="setPref('saver',this.checked)"> ðŸ”‹ Energiesparmodus (weniger Effekte)</label>
  <div class=row><button class=d data-fs onclick="FS.toggle()">â›¶</button><button class=d onclick="save.tips={};persistRaw();toast('Hinweise werden wieder angezeigt')">ðŸ’¡ Hinweise zurÃ¼cksetzen</button></div></div>
  <div class=card><h3>ðŸŽ® Controller</h3><small>PS4/PS5-Controller per Bluetooth oder USB verbinden und eine Taste drÃ¼cken. Stick/Steuerkreuz: laufen Â· âœ• springen Â· â—» schlagen Â· â—‹ oder R1: Dash Â· â–³ oder Stick runter: TÃ¼r/Rohr Â· Options: Pause. Auf der Karte: L1/R1 Welt wechseln Â· â—» Beutel Â· â–³ FÃ¤higkeitenbaum Â· â†‘ MenÃ¼leiste Â· Options MenÃ¼. In MenÃ¼s und nach dem Level: Steuerkreuz/Stick wÃ¤hlen, âœ• bestÃ¤tigen, â—‹ zurÃ¼ck.</small></div>
  <div class=card><h3>ðŸ’¾ Spielstand-Code</h3><small>Kopiere den Code und fÃ¼ge ihn auf einem anderen GerÃ¤t ein. Funktioniert auch ohne Cloud.</small>
  <textarea id=cd readonly rows=3>${CLOUD.exportCode()}</textarea><div class=row><button onclick="copyCode()">ðŸ“‹ Kopieren</button></div>
  <textarea id=imp rows=3 placeholder="Code hier einfÃ¼gen"></textarea><div class=row><button class=g onclick="importCode()">â¬‡ï¸ Importieren</button></div></div>
  <div class=card><h3>â˜ï¸ Cloud-Speicher</h3><small>${esc(CLOUD.status || 'Noch nicht verbunden.')}</small>
  <label>Datenbank-URL</label><input id=cu value="${esc(c.url || '')}" placeholder="https://dein-projekt-default-rtdb.europe-west1.firebasedatabase.app">
  <label>Spieler-Code (wie ein Passwort â€“ nicht teilen!)</label><input id=cc value="${esc(c.code || '')}" placeholder="XXXX-XXXX-XXXX">
  <div class=row><button class=d onclick="cloudGen()">ðŸŽ² Neuer Code</button><button onclick="cloudSave()">â˜ï¸ Speichern</button><button onclick="cloudLoad()">â˜ï¸ Laden</button></div>
  <label style="display:block;margin:8px 0"><input type=checkbox id=ca ${c.auto ? 'checked' : ''} style="width:auto" onchange="cloudAuto()"> Automatisch synchronisieren</label>
  <details><summary>Einrichtung (einmalig, kostenlos)</summary><ol>
  <li>Auf console.firebase.google.com ein Projekt anlegen.</li>
  <li>Build â†’ Realtime Database â†’ Datenbank erstellen (Region Europa).</li>
  <li>Tab â€žRegeln": <code>{"rules":{"saves":{"$code":{".read":true,".write":true,".validate":"newData.hasChildren(['ts','data'])"}}}}</code> einfÃ¼gen und verÃ¶ffentlichen.</li>
  <li>Die Datenbank-URL oben eintragen, â€žNeuer Code" drÃ¼cken, â€žSpeichern". Auf dem zweiten GerÃ¤t dieselbe URL und denselben Code eintragen und â€žLaden" drÃ¼cken.</li></ol>
  <small>Wer deinen Code kennt, kann deinen Spielstand lesen und Ã¼berschreiben. Kein Konto und keine Daten auÃŸer dem Spielstand.</small></details></div>`;
}
function cloudRead() { CLOUD.setCfg({ url: $('#cu').value.trim(), code: $('#cc').value.trim().toUpperCase() }); }
function cloudGen() { $('#cc').value = CLOUD.newCode(); cloudRead(); }
function cloudAuto() { cloudRead(); CLOUD.setCfg({ auto: $('#ca').checked }); if ($('#ca').checked) CLOUD.touch(); }
async function cloudSave() { cloudRead(); try { await CLOUD.push(); settings('âœ… In der Cloud gespeichert.'); } catch (e) { settings('âš ï¸ ' + esc(e.message)); } }
async function cloudLoad() {
  cloudRead();
  try {
    const r = await CLOUD.pull();
    if (confirm('Den lokalen Spielstand durch den Cloud-Stand ersetzen?')) { applySave(r.data); settings('âœ… Aus der Cloud geladen.'); }
  } catch (e) { settings('âš ï¸ ' + esc(e.message)); }
}
function copyCode() {
  const t = $('#cd'); t.select();
  (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('ðŸ“‹ Code kopiert'), () => { try { document.execCommand('copy'); toast('ðŸ“‹ Code kopiert'); } catch (e) { toast('Bitte den Code von Hand markieren und kopieren'); } });
}
function importCode() {
  try { const o = CLOUD.parseCode($('#imp').value); if (confirm('Den aktuellen Spielstand Ã¼berschreiben?')) { applySave(o); settings('âœ… Spielstand importiert.'); } }
  catch (e) { settings('âš ï¸ ' + esc(e.message)); }
}

// ---------- Eingabe ----------
const KEY = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'j', w: 'j', ' ': 'j', x: 'a', z: 'a', j: 'a', Shift: 'dash', c: 'dash', ArrowDown: 'use', s: 'use' };
function setInto(T, c, v) { if (c === 'l') T.l = v; else if (c === 'r') T.r = v; else if (c === 'j') { T.j = v; if (v) T.jb = .12; } else if (c === 'a' && v) T.ap = 1; else if (c === 'dash' && v) T.dash = 1; else if (c === 'use' && v) T.use = 1; }
const setIn = (c, v) => setInto(IN, c, v), setIn2 = (c, v) => setInto(IN2, c, v);
// Lokaler Koop auf einer Tastatur: Spieler 1 links (WASD + F/G), Spieler 2 rechts (Pfeile + Enter/Shift rechts)
const K1 = { KeyA: 'l', KeyD: 'r', KeyW: 'j', Space: 'j', KeyS: 'use', KeyF: 'a', KeyG: 'dash', ShiftLeft: 'dash' }, K2 = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'j', ArrowDown: 'use', Enter: 'a', Slash: 'a', ShiftRight: 'dash' };
const coopKeys = () => save.chars.coop && mode === 'play';
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
CLOUD.boot();
applyPrefs();
