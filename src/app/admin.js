// Admin-/Test-Modus. Aufruf: index.html?admin=1  (eigener Spielstand 'mondkatze_admin', Cloud aus).
// Panel oeffnen: Knopf 🛠 unten links, oder Taste F2 / ^.
const ADM = { god: false, inftime: false, slow: 1, hit: false, fps: false, fpsV: 0, _f: 0, _t: 0 };
const SFX_ALL = ['jump', 'jump2', 'wall', 'land', 'coin', 'shard', 'hit', 'stomp', 'hurt', 'kill', 'dash', 'spring', 'door', 'power', 'treasure', 'bell', 'crumble', 'rock', 'fire', 'shoot', 'win', 'lose', 'ui', 'tele', 'block', 'bossHit', 'strike', 'magic', 'moon', 'heal', 'thunder', 'roar', 'moonEat', 'wind', 'sparkle', 'step'];
const WN = () => W.map((w, i) => `<option value="${i}">${i + 1} ${w.name}</option>`).join('');

ADM.overlay = (c, r) => {
  if (ADM.fps) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(8, 74, 130, 22); c.fillStyle = '#7fff7f'; c.font = 'bold 14px monospace'; c.textAlign = 'left'; c.fillText('FPS ' + ADM.fpsV + '  x' + ADM.slow, 14, 90); }
  if (ADM.hit) {
    c.save(); c.translate(-Math.floor(r.cam), 0); c.lineWidth = 1.5;
    const box = (o, col) => { c.strokeStyle = col; c.strokeRect(o.x, o.y, o.w, o.h); };
    box(r.p, '#00ff66'); for (const e of r.ent) box(e, '#ff3b3b'); for (const d of r.doors) box(d, '#ffd54a'); for (const s of r.springs) box(s, '#33bbff'); for (const m of r.movers) box(m, '#ff33ff');
    c.strokeStyle = 'rgba(255,255,255,.25)'; for (const k of r.pick) { c.beginPath(); c.arc(k.x, k.y, 24, 0, 7); c.stroke(); } c.restore();
  }
};
ADM.tick = () => { const n = performance.now(); ADM._f++; if (n - ADM._t > 500) { ADM.fpsV = Math.round(ADM._f * 1000 / (n - ADM._t)); ADM._f = 0; ADM._t = n; } };

function admFull() {
  for (let w = 0; w < W.length; w++) { const N = nodes(w); save.prog[w] = N.length; N.forEach(nd => { if (nd.t === 'lv') save.cleared[w + ':' + nd.i] = 1; else save.cleared[w + ':' + nd.t] = 1; }); }
  persist(); checkAch(); admMsg('Alle Welten und Level freigeschaltet.');
}
function admAll() {
  ITEMS.forEach(i => save.own[i.id] = 1); COS.forEach(x => save.cos.own[x.id] = 1);
  SKILLS.forEach(b => b.list.forEach(s => save.skills[s.id] = s.max)); save.shards = Math.max(save.shards, 3000);
  for (let w = 0; w < W.length; w++) { save.bells[w] = 1; MOONLV.forEach(l => save.moons[w + ':' + l] = 1); }
  persist(); checkAch(); admMsg('Alle Items, Kleidung, Fähigkeiten, Glöckchen und Monde.');
}
function admMsg(t) { const m = document.getElementById('admMsg'); if (m) m.textContent = '✔ ' + t; toast('🛠 ' + t); if (mode === 'map') hud(); }
function admRun() { if (!run) { admMsg('Dafür muss ein Level laufen.'); return null; } return run; }
function admStart(kind) {
  const w = +document.getElementById('aw').value, l = +document.getElementById('al').value; admClose();
  const k = nodes(w).findIndex(n => n.t === 'lv' && n.i === l); save.w = w; lastK = k;
  play(w, l, k, kind === 'race');
}
function admBoss(kind) { const w = +document.getElementById('aw').value; admClose(); save.w = w; const k = nodes(w).findIndex(n => n.t === kind); lastK = k; battle(w, kind, k); }
function admCine(key) { const w = +document.getElementById('aw').value; admClose(); cine(key, { wi: w, kind: 'boss' }, () => map()); }
function admWorld() { const w = +document.getElementById('aw').value; save.w = w; persist(); admClose(); lastAt = null; map(); }
function admLvInfo() {
  const w = +document.getElementById('aw').value, sel = document.getElementById('al'), cur = +sel.value || 0;
  sel.innerHTML = Array.from({ length: W[w].n }, (_, i) => `<option value="${i}">${i + 1} ${LV_NAMES[w][i]}</option>`).join(''); sel.value = Math.min(cur, W[w].n - 1);
  const sp = levelSpec(w, +sel.value); document.getElementById('aInfo').textContent = `${sp.style} · ${sp.kind} · ${sp.weather} · ${sp.mods.join(', ') || '–'}`;
}
function admClose() { document.getElementById('adm').style.display = 'none'; }
function admOpen() {
  const p = document.getElementById('adm'); p.style.display = 'block';
  const b = (t, f, cls) => `<button class="${cls || 'd'}" onclick="${f}">${t}</button>`;
  p.innerHTML = `<div class=row><b style="flex:1">🛠 ADMIN (getrennter Spielstand)</b><button class=r onclick="admClose()">✖</button></div><div id=admMsg style="font-size:13px;min-height:18px;color:#7fff7f"></div>
  <details open><summary><b>Fortschritt &amp; Cheats</b></summary><div class=row>
  ${b('🔓 Alles freischalten', 'admFull()', 'g')}${b('🎁 Alles besitzen', 'admAll()', 'g')}${b('+1000 🪙', "save.coins+=1000;persist();admMsg('+1000 Münzen')")}${b('+200 🌙 (10 ⭐)', "save.shards+=200;persist();admMsg('+10 Skillpunkte')")}
  ${b('NG+ +1', "save.ng=(save.ng||0)+1;persist();admMsg('NG+ '+save.ng)")}${b('🏆 Erfolge prüfen', "checkAch();admMsg('geprüft')")}${b('💡 Tipps zurücksetzen', "save.tips={};persist();admMsg('Tipps zurückgesetzt')")}${b('🗑 Admin-Stand löschen', "if(confirm('Admin-Spielstand löschen?')){save=defSave();persist();lastAt=null;showTitle();admClose()}", 'r')}</div></details>
  <details open><summary><b>Level / Boss / Welt starten</b></summary><div class=row><select id=aw onchange="admLvInfo()">${WN()}</select><select id=al onchange="admLvInfo()"></select></div><div id=aInfo style="font-size:12px;opacity:.8"></div>
  <div class=row>${b('▶ Level', "admStart('level')", 'g')}${b('👻 Rennen', "admStart('race')")}${b('⚔️ Wächter', "admBoss('mini')")}${b('👑 Boss', "admBoss('boss')")}${b('🗺️ Karte dieser Welt', 'admWorld()')}</div></details>
  <details open><summary><b>Im Level</b></summary><div class=row>
  <label><input type=checkbox style="width:auto" ${ADM.god ? 'checked' : ''} onchange="ADM.god=this.checked"> Unverwundbar</label><label><input type=checkbox style="width:auto" ${ADM.inftime ? 'checked' : ''} onchange="ADM.inftime=this.checked"> Unendlich Zeit</label>
  <label><input type=checkbox style="width:auto" ${ADM.hit ? 'checked' : ''} onchange="ADM.hit=this.checked"> Hitboxen</label><label><input type=checkbox style="width:auto" ${ADM.fps ? 'checked' : ''} onchange="ADM.fps=this.checked"> FPS</label></div>
  <div class=row><label>Tempo</label>${[.25, .5, 1, 2].map(v => b('x' + v, `ADM.slow=${v}`)).join('')}</div>
  <div class=row>${b('🏁 Sofort gewinnen', "const r=admRun();if(r){admClose();r.t=Math.max(r.t,15);r.finish(true,'Admin')}", 'g')}${b('☠ Alle Gegner töten', 'const r=admRun();if(r)r.ent.slice().forEach(e=>r.hit(e,999))')}${b('➡ Zum Ziel', 'const r=admRun();if(r){r.p.x=r.flagX-120;r.p.y=r.flagY-60}')}
  ${b('🚪 Zum Eingang', "const r=admRun();if(r){const d=r.doors.find(d=>!d.used&&d.type!=='exit');if(d){r.p.x=d.x;r.p.y=d.y-10}else admMsg('Kein Eingang')}")}${b('🧲 Alles einsammeln', 'const r=admRun();if(r)r.pick.forEach(k=>{k.x=r.p.x+11;k.y=r.p.y+15})')}
  ${b('❤ Heilen +60s', 'const r=admRun();if(r){r.p.hp=r.S.maxhp+r.boost.hp;r.time+=60}')}${b('🎁 Item spawnen', 'const r=admRun();if(r)r.drops.push({x:r.p.x+90,y:r.p.y,d:pick(DROPS)})')}${b('⏭ Kamerafahrt überspringen', 'const r=admRun();if(r)r.pan=0')}</div>
  <div class=row><label>Geheimraum:</label>${['coins', 'shaft', 'arena'].map(k => b(k, `const r=admRun();if(r&&!r.room){admClose();r.enterRoom({x:0,y:0,w:10,h:10,type:'door',room:'${k}',used:false})}`)).join('')}</div></details>
  <details><summary><b>Filme &amp; Story (Welt oben wählen)</b></summary><div class=row>
  ${b('Intro', "admCine('intro')")}${b('Ankunft', "admCine('arrive')")}${b('Boss-Auftritt', "admCine('bossintro')")}${b('Boss besiegt', "admCine('bossdown')")}${b('Ende', "admCine('ending')")}
  ${b('Story: Intro', 'admClose();story(STORY.intro,()=>map())')}${b('Story: Welt', "admClose();story(STORY.world[+document.getElementById('aw').value],()=>map())")}${b('Story: Ende', 'admClose();story(STORY.end,()=>map())')}</div></details>
  <details><summary><b>Sound &amp; Musik</b></summary><div class=row>${SFX_ALL.map(n => b(n, `AUDIO.unlock();AUDIO.sfx('${n}')`)).join('')}</div>
  <div class=row><label>Musik:</label>${[['menu', 'Menü'], ['map', 'Karte'], ['level', 'Level'], ['boss', 'Boss']].map(([k, t]) => b(t, `AUDIO.unlock();AUDIO.play('${k}',{wi:+document.getElementById('aw').value,li:3,kind:'day'})`)).join('')}${b('⏹ Stopp', 'AUDIO.stop()', 'r')}</div></details>
  <details><summary><b>Sonstiges</b></summary><div class=row>${b('📖 Album', 'admClose();album()')}${b('👒 Garderobe', 'admClose();wardrobe()')}${b('🛒 Laden 1', "admClose();shop(+document.getElementById('aw').value,0)")}${b('🛒 Laden 2', "admClose();shop(+document.getElementById('aw').value,1)")}${b('🌟 Mondbaum', 'admClose();tree()')}${b('⚙️ Einstellungen', 'admClose();settings()')}</div></details>`;
  document.getElementById('aw').value = save.w; admLvInfo();
}

(function init() {
  const css = document.createElement('style'); css.textContent = '#adm{position:fixed;left:8px;top:8px;width:min(94vw,440px);max-height:92vh;overflow:auto;background:#10081eee;border:2px solid #ff5a5a;border-radius:14px;padding:10px;z-index:60;display:none;font-size:14px}#adm select{background:#0008;color:#fff;border:1px solid #fff4;border-radius:8px;padding:8px;font-size:14px;max-width:48%}#adm button{padding:8px 11px;font-size:13px;margin:2px}#adm summary{cursor:pointer;margin:6px 0}#admBtn{position:fixed;left:8px;bottom:8px;z-index:59;width:44px;height:44px;border-radius:50%;padding:0;font-size:20px;background:#ff5a5a}#admTag{position:fixed;right:8px;bottom:4px;z-index:59;font:bold 11px monospace;color:#ff8a8a;pointer-events:none}';
  document.head.appendChild(css);
  const panel = document.createElement('div'); panel.id = 'adm'; document.body.appendChild(panel);
  const btn = document.createElement('button'); btn.id = 'admBtn'; btn.textContent = '🛠'; btn.onclick = () => { panel.style.display === 'block' ? admClose() : admOpen(); }; document.body.appendChild(btn);
  const tag = document.createElement('div'); tag.id = 'admTag'; tag.textContent = 'ADMIN'; document.body.appendChild(tag);
  addEventListener('keydown', e => { if (e.key === 'F2' || e.key === '^') { e.preventDefault(); panel.style.display === 'block' ? admClose() : admOpen(); } });
  document.title = 'Mondkatze ADMIN'; toast('🛠 Admin-Modus (eigener Spielstand)');
})();
