// Kampfbuehne: Welt-Kulisse, Luna und Gegner als Figuren mit Angriffs-, Block- und Treffer-Animationen.
function arenaMount(host, wi, kind) {
  const cn = document.createElement('canvas'); cn.width = 960; cn.height = 400;
  cn.style.cssText = 'width:100%;max-width:720px;border-radius:14px;display:block;margin:0 auto;box-shadow:0 4px 18px #0008';
  host.appendChild(cn);
  const c = cn.getContext('2d'), B = W[wi][kind], sp = cineSpec(wi, wi === 5 ? 'night' : 'dusk'), GY = 330, LX = 230, BX = 720;
  const A = { t: 0, shake: 0, flash: 0, bp: { pose: 'idle', t: 0, type: 0 }, lp: { pose: 'idle', t: 0 }, txt: [], fx: [], pend: null };
  const e2 = u => u * u * (3 - 2 * u), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = (t, x, y, col) => A.txt.push({ t, x, y, col: col || '#fff', l: 1 });
  const burst = (x, y, n, col) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 80 + Math.random() * 180; A.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, l: .6 + Math.random() * .3, m: .9, c: col, s: 3 + Math.random() * 3 }); } };

  A.tele = i => { A.bp = { pose: 'tele', t: 0, type: i }; A.lp = { pose: 'idle', t: 0 }; };
  A.clash = (i, ans, ok) => { A.bp = { pose: 'strike', t: 0, type: i }; A.lp = { pose: ans || 'idle', t: 0 }; A.pend = { t: .3, ok, i }; };
  A.hit = (dmg, how) => { A.lp = { pose: how === 'moon' ? 'moon' : 'attack', t: 0 }; A.pend = { t: how === 'moon' ? .5 : .22, dmg, how }; };
  A.heal = () => { A.lp = { pose: 'heal', t: 0 }; burst(LX, GY - 50, 14, '#6fe39a'); };
  A.win = () => { A.bp = { pose: 'die', t: 0, type: 0 }; };

  function update(dt) {
    A.t += dt; A.bp.t += dt; A.lp.t += dt; A.shake = Math.max(0, A.shake - dt); A.flash = Math.max(0, A.flash - dt * 3);
    if (A.pend) {
      A.pend.t -= dt;
      if (A.pend.t <= 0) {
        const p = A.pend; A.pend = null;
        if ('ok' in p) {
          if (p.ok) { burst(LX + 60, GY - 60, 16, '#7fe8ff'); say('Pariert!', LX + 40, GY - 130, '#7fe8ff'); }
          else { A.lp = { pose: 'hurt', t: 0 }; A.shake = .45; A.flash = 1; burst(LX, GY - 50, 14, '#ff5a5a'); }
        } else {
          A.bp = { pose: 'hurt', t: 0, type: 0 }; A.shake = p.how === 'moon' ? .5 : .25;
          burst(BX, GY - 100, p.how === 'moon' ? 30 : 14, p.how === 'moon' ? '#fff6c8' : '#ffffff'); say('-' + p.dmg, BX - 20, GY - 190, '#ffd54a');
        }
      }
    }
    for (const f of A.fx) { f.l -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; }
    A.fx = A.fx.filter(f => f.l > 0);
    for (const s of A.txt) { s.l -= dt * .8; s.y -= 30 * dt; }
    A.txt = A.txt.filter(s => s.l > 0);
    if (A.bp.pose === 'strike' && A.bp.t > .6) A.bp = { pose: 'idle', t: 0, type: 0 };
    if (A.bp.pose === 'hurt' && A.bp.t > .4) A.bp = { pose: 'idle', t: 0, type: 0 };
    const lp = A.lp;
    if ((lp.pose === 'attack' && lp.t > .6) || (lp.pose === 'moon' && lp.t > .9) || (lp.pose === 'hurt' && lp.t > .5) || (['guard', 'jump', 'focus', 'heal'].includes(lp.pose) && lp.t > .7)) A.lp = { pose: 'idle', t: 0 };
  }

  function draw() {
    const t = A.t, b = A.bp, l = A.lp;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    const sx = A.shake > 0 ? (Math.random() - .5) * A.shake * 40 : 0, sy = A.shake > 0 ? (Math.random() - .5) * A.shake * 24 : 0;
    c.translate(sx, sy);
    drawScenery(c, wi, sp, 100, t, 960, 400);
    c.fillStyle = sp.pal.dirt; c.fillRect(-20, GY, 1000, 90); c.fillStyle = sp.pal.top; c.fillRect(-20, GY, 1000, 10);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    // --- Boss
    let bx = BX + (1 - e2(cl(t / 1.1, 0, 1))) * 300, by = GY - 105 + Math.sin(t * 2) * 6, rot = 0, sc = 1, ba = 1;
    if (b.pose === 'tele') { const u = e2(cl(b.t / .5, 0, 1)); if (b.type === 0) { by -= 40 * u; rot = -.25 * u; } else if (b.type === 1) { by += 18 * u; sc = 1 - .15 * u; } else { by -= 15 * u; } }
    if (b.pose === 'strike') {
      if (b.type === 0) { const u = b.t < .25 ? e2(b.t / .25) : 1 - e2(cl((b.t - .25) / .3, 0, 1)); bx = BX - 330 * cl(u, 0, 1); rot = .2 * u; }
      else if (b.type === 1) rot = Math.sin(b.t * 14) * .5;
    }
    if (b.pose === 'hurt') { bx += 26 * (1 - b.t / .4); ba = Math.floor(b.t * 20) % 2 ? .45 : 1; }
    if (b.pose === 'die') { const u = cl(b.t / 1.3, 0, 1); ba = 1 - u; sc = 1 + u * .4; rot = u * 1.2; if (Math.random() < .5) burst(BX, GY - 100, 1, '#ffe066'); }
    if (b.pose === 'tele') {
      c.globalAlpha = .2 + .15 * Math.sin(b.t * 14); c.fillStyle = b.type === 2 ? '#a64bff' : '#ff3b3b'; c.beginPath(); c.arc(bx, by, 120 + b.t * 30, 0, 7); c.fill(); c.globalAlpha = 1;
      if (b.type === 1) { c.strokeStyle = '#ff3b3b'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx - 150, GY + 2); c.lineTo(LX + 60, GY + 2); c.stroke(); }
      if (b.type === 2) for (let i = 0; i < 4; i++) { const an = t * 4 + i * 1.57; c.font = EMF(26); c.fillStyle = '#000'; c.fillText('🔮', bx + Math.cos(an) * 110, by + Math.sin(an) * 60); }
    }
    { const ag = c.createRadialGradient(bx, by, 20, bx, by, 190); ag.addColorStop(0, ['rgba(120,255,150,.22)', 'rgba(255,170,60,.2)', 'rgba(255,210,90,.22)', 'rgba(150,220,255,.24)', 'rgba(110,150,255,.24)', 'rgba(255,70,60,.26)'][wi]); ag.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ag; c.fillRect(bx - 200, by - 200, 400, 400); }
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(bx, GY + 6, 90 * sc, 14, 0, 0, 7); c.fill();
    c.save(); c.translate(bx, by); c.rotate(rot); c.scale(sc, sc * (b.pose === 'tele' && b.type === 1 ? .85 : 1)); c.globalAlpha = ba; c.fillStyle = '#000'; if (b.pose === 'hurt' && b.t < .14) c.filter = 'brightness(2.4)'; if (!drawCreature(c, B.n, 0, 0, 230, -1, t * 10, {})) { c.font = EMF(200); c.fillText(B.e, 0, 0); } c.filter = 'none'; c.restore(); c.globalAlpha = 1;
    if (b.pose === 'strike') {
      if (b.type === 0 && b.t > .22 && b.t < .5) { const u = (b.t - .22) / .28; c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 8; c.beginPath(); c.ellipse(LX + 90, GY, 20 + u * 110, 8 + u * 22, 0, 0, 7); c.stroke(); }
      if (b.type === 1) { const u = cl(b.t / .35, 0, 1), x = lerp(BX - 120, LX + 40, u); c.fillStyle = '#ff5a3b'; c.beginPath(); c.moveTo(x - 30, GY); c.quadraticCurveTo(x, GY - 70, x + 30, GY); c.quadraticCurveTo(x, GY - 25, x - 30, GY); c.fill(); }
      if (b.type === 2) { const u = cl(b.t / .35, 0, 1), x = lerp(BX - 120, LX + 40, u), y = lerp(by, GY - 60, u); c.font = EMF(60); c.fillStyle = '#000'; c.globalAlpha = u >= 1 ? .4 : 1; c.fillText('🔮', x, y); for (let i = 1; i < 5; i++) { c.globalAlpha = .5 - i * .1; c.fillText('🔮', x + i * 18, y - i * 3); } c.globalAlpha = 1; }
    }
    // --- Luna
    let lx = LX, ly = GY - 32, run = false, air = false;
    if (l.pose === 'jump') { const u = cl(l.t / .6, 0, 1); ly -= 120 * Math.sin(u * Math.PI); air = u > 0 && u < 1; }
    if (l.pose === 'hurt') { lx -= 36 * (1 - l.t / .5); if (Math.floor(l.t * 16) % 2) c.globalAlpha = .5; }
    if (l.pose === 'attack') { const u = l.t < .2 ? e2(l.t / .2) : l.t < .35 ? 1 : 1 - e2(cl((l.t - .35) / .25, 0, 1)); lx = LX + 330 * cl(u, 0, 1); run = l.t < .2 || l.t > .35; }
    if (l.pose === 'moon') { const u = cl(l.t / .4, 0, 1); ly -= 70 * Math.sin(u * Math.PI); air = u < 1; }
    if (l.pose === 'focus') for (let i = 0; i < 3; i++) { const u = ((l.t * 1.8 + i / 3) % 1); c.strokeStyle = `rgba(255,213,74,${1 - u})`; c.lineWidth = 4; c.beginPath(); c.arc(lx, ly + 5, 20 + u * 70, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(lx, GY + 4, 38, 8, 0, 0, 7); c.fill();
    drawCat(c, lx, ly, 100, 1, t * 10, { run, air }, PAL.luna); c.globalAlpha = 1;
    if (l.pose === 'guard') { c.strokeStyle = `rgba(127,232,255,${.6 + .3 * Math.sin(l.t * 20)})`; c.lineWidth = 8; c.beginPath(); c.arc(lx + 40, ly, 70, -1.2, 1.2); c.stroke(); c.fillStyle = 'rgba(127,232,255,.18)'; c.fill(); }
    if (l.pose === 'attack' && l.t > .15 && l.t < .35) { const u = (l.t - .15) / .2; c.strokeStyle = `rgba(255,255,255,${1 - u * .6})`; c.lineWidth = 10; c.beginPath(); c.arc(lx + 40, ly, 60, -1 + u, 1 + u * .6); c.stroke(); }
    if (l.pose === 'moon' && l.t > .15) { const u = cl((l.t - .15) / .35, 0, 1), x = lerp(LX + 40, BX - 60, u), y = lerp(ly - 30, GY - 100, u); c.font = EMF(80); c.shadowColor = '#fff6c8'; c.shadowBlur = 30; c.fillStyle = '#000'; c.fillText('🌙', x, y); c.shadowBlur = 0; }
    // --- Partikel & Text
    for (const f of A.fx) { c.globalAlpha = Math.max(0, f.l / f.m); c.fillStyle = f.c; c.fillRect(f.x - f.s / 2, f.y - f.s / 2, f.s, f.s); }
    c.globalAlpha = 1;
    for (const s of A.txt) { c.globalAlpha = Math.min(1, s.l * 2); c.font = 'bold 34px "Trebuchet MS",sans-serif'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = s.col; c.strokeText(s.t, s.x, s.y); c.fillText(s.t, s.x, s.y); }
    c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
    if (A.flash > 0) { c.fillStyle = `rgba(255,40,40,${A.flash * .35})`; c.fillRect(0, 0, 960, 400); }
    if (!PREFS.saver) drawWeather(c, WEATHER[wi], t, 960, 400);
    drawVignette(c, 960, 400);
  }

  let last = performance.now();
  const loop = ts => { if (!cn.isConnected) return; update(Math.min(.05, (ts - last) / 1000)); last = ts; draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return A;
}
