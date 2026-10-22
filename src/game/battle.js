// Bosskampf: Telegraph lesen, richtig kontern, Timing-Angriff. Buehne = arena.js, Menues = DOM.
const ATT = [{ ic: '⬆️', h: 'Hoher Schlag', ans: 'guard' }, { ic: '⬇️', h: 'Tiefer Schlag', ans: 'jump' }, { ic: '✨', h: 'Magie', ans: 'focus' }];

function afterBoss(wi, kind, k) {
  const sk = 'b' + wi + kind, fin = wi === 5 && kind === 'boss', pages = kind === 'mini' ? STORY.mini[wi] : fin ? STORY.end : STORY.boss[wi];
  const done = () => { map({ from: k, advance: true }); if (fin) setTimeout(() => toast('🔁 Neues Spiel+ findest du jetzt im Titelmenü'), 800); };
  if (save.seen[sk] || !pages) return done();
  save.seen[sk] = 1; persist();
  if (fin) cine('ending', {}, () => story(pages, done)); else cine('bossdown', { wi, kind }, () => story(pages, done));
}

function battle(wi, kind, k, noFilm) {
  if (!noFilm) return cine('bossintro', { wi, kind }, () => battle(wi, kind, k, 1));
  show('ui'); AUDIO.play('boss', { wi });
  const B = W[wi][kind], NG = save.ng || 0, BHP = Math.round(W[wi][kind].hp * (1 + .8 * NG)), BDMG = W[wi][kind].dmg + 3 * NG, S = stats(), boss = kind === 'boss', pm = 20 + (S.maxhp - 3) * 6, atk = 6 + S.dmg * 3;
  const st = { bh: BHP, php: pm, en: 0, buff: 1, used: {}, phase: 1, cur: null, raf: 0, pos: 50, over: false };
  ui.innerHTML = `<div class=bt style="background:${B.bg}"><div class=row><b style="flex:1">${B.n}</b><span id=phs>Phase 1</span></div>
    <div id=stage></div><div class=bar style="max-width:720px;margin:8px auto"><i id=bhb></i></div>
    <div class=tl id=tl></div><div id=mid></div>
    <div class=row id=stt style="justify-content:center"></div>
    <div class=bar style="max-width:420px;margin:auto"><i id=pbar style="background:#4ad07a"></i></div>
    <div class=ctl id=ctl style="margin-top:12px"></div></div>`;
  const A = arenaMount($('#stage'), wi, kind);
  const chain = () => boss ? st.phase : (st.phase >= 3 ? 2 : 1);
  const log = t => { $('#tl').innerHTML = t; };
  const bars = () => {
    $('#bhb').style.width = Math.max(0, st.bh) / BHP * 100 + '%'; $('#pbar').style.width = Math.max(0, st.php) / pm * 100 + '%'; $('#phs').textContent = 'Phase ' + st.phase;
    $('#stt').innerHTML = `<span>${catImg(save.chars.p1, 30)} ${Math.max(0, st.php)}/${pm}</span><span>🌙 ${'●'.repeat(st.en)}${'○'.repeat(3 - st.en)}</span>`;
  };
  const draw = (mid, ctl) => { $('#mid').innerHTML = mid || ''; $('#ctl').innerHTML = ctl || ''; bars(); };
  // Phasenwechsel bei 66% und 33% Leben: Arena-Effekt, Musik wird schneller, der Boss greift haeufiger an
  const setPhase = () => {
    const r = st.bh / BHP, np = r > .66 ? 1 : r > .33 ? 2 : 3; if (np === st.phase) return '';
    st.phase = np; A.rage(np); AUDIO.sfx('roar'); AUDIO.play('boss', { wi, ph: np });
    return `⚠️ <b>Phase ${np}</b> – ${B.n} ${np === 2 ? 'wird wütend!' : 'rastet völlig aus!'}`;
  };

  function lose() {
    st.over = true; AUDIO.stop(); AUDIO.sfx('lose'); draw('', `<button onclick="battle(${wi},'${kind}',${k},1)">Nochmal</button><button class=d onclick="map({from:${k}})">Karte</button>`); log(`💀 ${B.n} war zu stark!`);
  }
  function win() {
    st.over = true; AUDIO.stop(); AUDIO.sfx('win');
    const key = wi + ':' + kind, first = !save.cleared[key], lv0 = Math.floor(save.shards / SP_PT), lines = [], cb = Math.round((boss ? 150 : 60) * (1 + .5 * NG));
    const cg = first ? cb : Math.round(cb * .25); save.coins += cg; lines.push(`🪙 +${cg} Münzen`);
    if (first) {
      save.shards += boss ? 40 : 20; save.cleared[key] = 1; lines.push(`🌙 +${boss ? 40 : 20} Splitter`);
      const un = ITEMS.filter(i => i.w === wi && !save.own[i.id]);
      if (un.length && boss) { const it = pick(un); save.own[it.id] = 1; lines.push(`🎁 Beute: ${it.e} ${it.n} (${it.d})`); }
    }
    save.prog[wi] = Math.max(save.prog[wi], k + 1); persist(); checkAch();
    if (Math.floor(save.shards / SP_PT) > lv0) lines.push('⭐ Neuer Skillpunkt im Mondbaum!');
    if (boss && wi < W.length - 1) lines.push(`🗺️ Neue Welt: ${W[wi + 1].emoji} ${W[wi + 1].name}`);
    ui.innerHTML = `<div class=bt style="background:${B.bg}"><div class=foe>💫</div><h2>${B.n} besiegt!</h2>${lines.map(l => `<p>${l}</p>`).join('')}<div class="row c"><button class=g onclick="afterBoss(${wi},'${kind}',${k})">Weiter ▶</button><button onclick="battle(${wi},'${kind}',${k},1)">🔄 Nochmal</button><button class=d onclick="map({from:${k}})">🗺️ Karte</button></div></div>`;
  }
  function enemyTurn(n) {
    if (st.over) return;
    if (n <= 0) return playerTurn();
    const i = Math.floor(Math.random() * 3), a = ATT[i], tw = Math.max(1100, 2600 - st.phase * 300 - wi * 100);
    A.tele(i); AUDIO.sfx('tele'); log(`<b>${B.atk[i]}</b>! ${a.ic} ${a.h}`);
    draw(`<div class=bar style="max-width:420px;margin:auto"><i id=tb style="width:100%;background:#ffd54a;transition:width ${tw}ms linear"></i></div>`,
      `<button onclick="bans('guard')">🛡️ Block</button><button onclick="bans('jump')">🦘 Sprung</button><button onclick="bans('focus')">🧘 Fokus</button>`);
    setTimeout(() => { const tb = $('#tb'); if (tb) tb.style.width = '0%'; }, 30);
    st.cur = { a, i, n, to: setTimeout(() => resolve(null), tw) };
  }
  function resolve(ch) {
    const c = st.cur; if (!c || st.over) return; clearTimeout(c.to); st.cur = null;
    const ok = ch === c.a.ans; A.clash(c.i, ch, ok); AUDIO.sfx('strike'); setTimeout(() => AUDIO.sfx(ok ? 'block' : 'bossHit'), 300); if (!ok) vib(120);
    if (ok) { st.en = Math.min(3, st.en + 1); log('✅ Perfekt gekontert!'); }
    else { const d = Math.round(BDMG * (st.phase >= 3 ? 1.2 : 1)); st.php -= d; log(`💥 Treffer! -${d} (richtig wäre: ${{ guard: 'Block', jump: 'Sprung', focus: 'Fokus' }[c.a.ans]})`); }
    draw('', '');
    if (st.php <= 0) return setTimeout(lose, 900);
    setTimeout(() => enemyTurn(c.n - 1), 1100);
  }
  window.bans = resolve;
  function playerTurn() {
    { const ph = setPhase(); log((ph ? ph + '<br>' : '') + 'Dein Zug!'); }
    const items = save.load.filter(id => !st.used[id]).map(id => `<button class=d onclick="bitem('${id}')">${ITEM[id].e} ${ITEM[id].n}</button>`).join('');
    const tonic = save.cons.tonic > 0 ? `<button class=d onclick="btonic()">🧪 Mondtrank (${save.cons.tonic})</button>` : '';
    draw('', `<button onclick="batk()">⚔️ Angriff</button><button ${st.en < 3 ? 'disabled' : ''} onclick="bmoon()">🌙 Mondkraft</button>${items}${tonic}`);
  }
  function after(dmg, msg, how) {
    st.bh -= dmg; log(msg); draw('', ''); A.hit(dmg, how); if (how === 'moon') { AUDIO.sfx('moon'); setTimeout(() => AUDIO.sfx('bossHit'), 500); } else { AUDIO.sfx('strike'); setTimeout(() => AUDIO.sfx('hit'), 220); } vib(40);
    if (st.bh <= 0) { setTimeout(() => A.win(), 700); return setTimeout(win, 2000); }
    { const ph = setPhase(); if (ph) log(msg + '<br>' + ph); } setTimeout(() => enemyTurn(chain()), 1200);
  }
  window.bgo = () => enemyTurn(1);
  window.batk = () => {
    log('Stoppe in der grünen Zone!');
    draw(`<div class=tm><div class=z style="left:0;width:100%;background:#a33"></div><div class=z style="left:10%;width:80%;background:#d83"></div><div class=z style="left:25%;width:50%;background:#cc3"></div><div class=z style="left:42%;width:16%;background:#3c3"></div><div class=m id=mk></div></div>`, `<button class=g onclick="bstop()">STOP</button>`);
    const t0 = performance.now(), sp = .0045 * (1 + st.phase * .2);
    const tick = t => { const m = $('#mk'); if (!m) return; st.pos = 50 + 50 * Math.sin((t - t0) * sp); m.style.left = `calc(${st.pos}% - 3px)`; st.raf = requestAnimationFrame(tick); };
    st.raf = requestAnimationFrame(tick);
  };
  window.bstop = () => {
    cancelAnimationFrame(st.raf); const d = Math.abs(st.pos - 50);
    const m = d < 8 ? 2 : d < 25 ? 1.4 : d < 40 ? 1 : .5, crit = Math.random() < S.crit;
    const dmg = Math.round(atk * m * st.buff * (crit ? 1.5 : 1)); st.buff = 1;
    if (m >= 1.4) st.en = Math.min(3, st.en + 1);
    after(dmg, `${m === 2 ? '🎯 Volltreffer!' : m >= 1.4 ? 'Guter Treffer!' : m === 1 ? 'Treffer' : 'Schwach…'} ${crit ? '★ KRIT ' : ''}-${dmg}`, 'attack');
  };
  window.bmoon = () => {
    st.en = 0; const dmg = Math.round(atk * 2.5 * st.buff); st.buff = 1; st.php = Math.min(pm, st.php + Math.round(pm * .2));
    after(dmg, `🌙 Mondkraft! -${dmg} und Luna heilt sich`, 'moon');
  };
  window.bitem = id => {
    st.used[id] = 1; st.php = Math.min(pm, st.php + Math.round(pm * .35)); st.buff = 1.5; A.heal(); AUDIO.sfx('heal');
    log(`${ITEM[id].e} ${ITEM[id].n}: geheilt, nächster Angriff +50%`); draw('', ''); setTimeout(() => enemyTurn(chain()), 1000);
  };
  window.btonic = () => {
    save.cons.tonic--; persist(); st.php = Math.min(pm, st.php + Math.round(pm * .5)); A.heal(); AUDIO.sfx('heal');
    log('🧪 Mondtrank: +50% Leben'); draw('', ''); setTimeout(() => enemyTurn(chain()), 1000);
  };
  log(`<b>${B.n}</b>: „${STORY.say[wi][kind]}“`);
  draw('', '<button class=g onclick="bgo()">⚔️ Kampf!</button>');
}
