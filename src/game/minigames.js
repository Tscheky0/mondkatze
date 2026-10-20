// Mini-Spiele in den Laeden: Angeln (Timing, 20 Muenzen) und Memory (15 Muenzen).
function fishing(wi, s) {
  if (save.coins < 20) return toast('🪙 Du brauchst 20 Münzen.');
  save.coins -= 20; persist();
  let round = 0, total = 0, raf = 0, pos = 50, cx = 50; const R = 5;
  const done = () => {
    cancelAnimationFrame(raf); save.coins += total; persist(); checkAch();
    ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><h2>🎣 Fang beendet!</h2><p>${total >= 40 ? '🐟 Prachtfang!' : total > 0 ? '🐠 Nicht schlecht.' : 'Heute beißt nichts…'}</p><h3>+${total} 🪙</h3>
    <div class=row style="justify-content:center"><button class=g onclick="fishing(${wi},${s})">Nochmal (20 🪙)</button><button class=d onclick="shop(${wi},${s})">Zurück zum Laden</button></div></div>`;
  };
  const next = () => {
    if (round >= R) return done(); round++; cx = 25 + Math.random() * 50;
    ui.innerHTML = `<div class=card style="text-align:center;margin-top:6vh"><h2>🎣 Angeln – Runde ${round}/${R}</h2><p>Drück „Einholen!", wenn die Markierung im grünen Bereich ist.</p><div style="font-size:60px">🌊🐟🌊</div>
      <div class=tm><div class=z style="left:0;width:100%;background:#a33"></div><div class=z style="left:${cx - 30}%;width:60%;background:#d83"></div><div class=z style="left:${cx - 16}%;width:32%;background:#cc3"></div><div class=z style="left:${cx - 7}%;width:14%;background:#3c3"></div><div class=m id=mk></div></div>
      <p id=fb style="min-height:26px">Bisher: ${total} 🪙</p><button class=g id=fbtn>Einholen!</button></div>`;
    const t0 = performance.now(), sp = .0035 + round * .0006;
    const tick = t => { const m = $('#mk'); if (!m) return; pos = 50 + 50 * Math.sin((t - t0) * sp); m.style.left = `calc(${pos}% - 3px)`; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    $('#fbtn').onclick = () => {
      cancelAnimationFrame(raf); const d = Math.abs(pos - cx), g = d < 7 ? 14 : d < 16 ? 8 : d < 30 ? 3 : 0; total += g;
      AUDIO.sfx(g >= 8 ? 'treasure' : g ? 'coin' : 'hit');
      $('#fb').textContent = g >= 14 ? '🎯 Prachtfisch! +14 🪙' : g >= 8 ? '🐟 Guter Fang! +8 🪙' : g ? '🐠 Kleiner Fisch +3 🪙' : '💨 Entwischt!';
      $('#fbtn').disabled = true; setTimeout(next, 900);
    };
  };
  next();
}

function memory(wi, s) {
  if (save.coins < 15) return toast('🪙 Du brauchst 15 Münzen.');
  save.coins -= 15; persist();
  const em = [...new Set([W[wi].emoji, ...W[wi].enemies.map(e => e.e), '🌙', '🪙'])].slice(0, 4), MAXF = 14;
  const cards = [...em, ...em].map(e => ({ e, up: false, done: false })).sort(() => Math.random() - .5);
  let open = [], flips = 0, pairs = 0, lock = false;
  const draw = () => {
    ui.innerHTML = `<div class=card style="text-align:center;margin-top:4vh"><h2>🃏 Memory</h2><p>Züge: ${flips}/${MAXF} · Paare: ${pairs}/4</p>
    <div style="display:grid;grid-template-columns:repeat(4,76px);gap:8px;justify-content:center">${cards.map((c, i) => `<button style="height:76px;font-size:36px;padding:0;${c.up || c.done ? 'background:#ffffff33' : ''}" onclick="memFlip(${i})">${c.up || c.done ? c.e : '❔'}</button>`).join('')}</div></div>`;
  };
  const end = () => {
    lock = true; const reward = pairs * 10 + (pairs === 4 ? 20 + (MAXF - flips) * 2 : 0); save.coins += reward; persist(); checkAch(); AUDIO.sfx(pairs === 4 ? 'win' : 'coin');
    ui.innerHTML = `<div class=card style="text-align:center;margin-top:8vh"><h2>🃏 ${pairs === 4 ? 'Geschafft!' : 'Zeit vorbei'}</h2><p>${pairs}/4 Paare in ${flips} Zügen</p><h3>+${reward} 🪙</h3>
    <div class=row style="justify-content:center"><button class=g onclick="memory(${wi},${s})">Nochmal (15 🪙)</button><button class=d onclick="shop(${wi},${s})">Zurück zum Laden</button></div></div>`;
  };
  window.memFlip = i => {
    if (lock || cards[i].up || cards[i].done) return; cards[i].up = true; open.push(i); AUDIO.sfx('ui'); draw();
    if (open.length < 2) return; flips++; const [a, b] = open;
    if (cards[a].e === cards[b].e) { cards[a].done = cards[b].done = true; cards[a].up = cards[b].up = false; pairs++; open = []; AUDIO.sfx('coin'); draw(); if (pairs === 4 || flips >= MAXF) setTimeout(end, 500); }
    else { lock = true; setTimeout(() => { cards[a].up = cards[b].up = false; open = []; lock = false; draw(); if (flips >= MAXF) end(); }, 700); }
  };
  draw();
}
