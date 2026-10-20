// Filmsequenzen: kurze animierte Canvas-Szenen mit Untertiteln. Tippen / Leertaste = ueberspringen.
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), ease = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, u) => { const x = rgb(a), y = rgb(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], u)).toString(16).padStart(2, '0')).join(''); };
const cineSpec = (wi, kind) => ({ ...levelSpec(wi, 0), kind, sky: skyFor(wi, kind) });

function moonDisc(c, x, y, r, eat, bg) {
  c.save(); c.shadowColor = '#fff8c0'; c.shadowBlur = 45; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.shadowBlur = 0;
  c.fillStyle = 'rgba(200,190,150,.35)'; for (const [dx, dy, rr] of [[-.3, -.2, .18], [.25, .15, .13], [-.1, .35, .1]]) { c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, 7); c.fill(); }
  if (eat > 0) { c.fillStyle = bg; c.beginPath(); c.arc(x + r * 2.1 * (1 - eat), y - r * .1, r * 1.05, 0, 7); c.fill(); }
  c.restore();
}

function lakeScene(c, t, o) {
  const gr = c.createLinearGradient(0, 0, 0, 544); gr.addColorStop(0, o.sky[0]); gr.addColorStop(1, o.sky[1]); c.fillStyle = gr; c.fillRect(0, 0, 960, 544);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${o.stars * (.3 + .5 * Math.sin(t * 2 + i))})`; c.fillRect((i * 149) % 960, (i * 83) % 330, 2, 2); }
  if (o.moon) moonDisc(c, 560, 140, o.moon.r, o.moon.eat, o.sky[0]);
  c.fillStyle = '#0b1a4a'; c.fillRect(0, 410, 960, 134);
  if (o.moon && o.moon.eat < 1) { c.fillStyle = `rgba(255,246,200,${.35 * (1 - o.moon.eat)})`; c.beginPath(); c.ellipse(560, 470, 70 * (1 - o.moon.eat * .6), 12, 0, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(520 + i * 40, 440 + (i % 3) * 25, 30 + (t * 20 + i * 9) % 30, 5, 0, 0, 7); c.stroke(); }
  c.fillStyle = '#0d2a22'; c.beginPath(); c.moveTo(0, 544); c.lineTo(0, 430); c.quadraticCurveTo(260, 400, 520, 470); c.lineTo(520, 544); c.fill();
  c.fillStyle = '#09201a'; for (const x of [40, 110, 190]) { c.beginPath(); c.moveTo(x, 420); c.lineTo(x - 22, 470); c.lineTo(x + 22, 470); c.fill(); c.fillRect(x - 3, 470, 6, 12); }
}

function groundStrip(c, sp) { c.fillStyle = sp.pal.dirt; c.fillRect(0, 462, 960, 82); c.fillStyle = sp.pal.top; c.fillRect(0, 462, 960, 10); }
const cat = (c, who, x, y, s, face, t, run) => drawCat(c, x, y, s, face, t * 10, { run }, PAL[who]);

const CINE = {
  intro: { dur: 18, sfx: [[.2, 'wind'], [5.2, 'roar'], [7.6, 'moonEat'], [8.4, 'thunder'], [11.1, 'roar'], [15.4, 'sparkle']], subs: [[.3, 4.5, 'Am Mondsee lebten Luna und Chey – beste Freunde.'], [4.8, 7.3, 'Doch in dieser Nacht verdunkelte sich der Himmel…'], [7.6, 10.4, 'Der Mondverschlinger schluckte den Mond!'], [10.8, 14.8, 'Und er entführte Chey in seinen Vulkan.'], [15.2, 17.6, 'Luna schwört: Ich hole dich zurück!']],
    draw(c, t) {
      const sh = t > 7.5 && t < 11 ? Math.sin(t * 50) * 4 : 0, eat = seg(t, 7.5, 10), dark = seg(t, 8, 11);
      c.save(); c.translate(sh, sh * .6);
      lakeScene(c, t, { sky: [mix('#050824', '#000000', dark), mix('#1b1a5a', '#05051a', dark)], stars: 1 - dark * .8, moon: t < 10 ? { r: 60, eat } : null });
      const cx = 410, cy = 442; let lx = 300, ly = 440, lrun = false;
      if (t > 9.5 && t < 11.2) ly -= Math.abs(Math.sin((t - 9.5) * 5)) * 40;
      if (t > 11.2) { lx = lerp(300, 760, ease(seg(t, 11.2, 14.5))); lrun = t < 14.5; }
      cat(c, 'luna', lx, ly, 70, 1, t, lrun);
      let dx = 0, dy = 0, ds = 130, df = -1, show = t > 5;
      if (t < 7.5) { const u = ease(seg(t, 5, 7.5)); dx = lerp(1150, 690, u); dy = lerp(110, 150, u); }
      else if (t < 9.5) { dx = 690 + Math.sin(t * 3) * 10; dy = 150 + Math.sin(t * 5) * 6; }
      else if (t < 11.2) { const u = ease(seg(t, 9.5, 11.2)); dx = lerp(690, cx + 40, u); dy = lerp(150, cy - 70, u); ds = lerp(130, 150, u); }
      else { const u = ease(seg(t, 11.2, 15)); dx = lerp(cx + 40, 1250, u); dy = lerp(cy - 70, 40, u); ds = lerp(150, 60, u); df = 1; }
      if (t < 11.2) cat(c, 'chey', cx, cy, 60, 1, t, false); else cat(c, 'chey', dx - 4, dy + ds * .5, ds * .4, 1, t, false);
      if (show) drawDragon(c, dx, dy, ds, t, df);
      if (t > 9.5 && t < 14.5) { c.strokeStyle = '#ffe066'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 30; i++) { const x = (i * 137 + (t - 9.5) * 60) % 960, y = ((t - 9.5) * 380 + i * 61) % 544; c.moveTo(x, y); c.lineTo(x - 8, y + 24); } c.stroke(); }
      c.restore();
      c.fillStyle = `rgba(0,0,0,${seg(t, 15.4, 16.4)})`; c.fillRect(0, 0, 960, 544);
      if (t > 16) { c.globalAlpha = seg(t, 16, 17); c.textAlign = 'center'; c.fillStyle = '#ffd54a'; c.font = 'bold 64px "Trebuchet MS",sans-serif'; c.fillText('Mondkatze', 480, 270); c.globalAlpha = 1; }
    } },

  arrive: { dur: 6, sfx: [[.3, 'wind'], [1.2, 'step']], subs: [],
    draw(c, t, o) {
      const wi = o.wi, sp = cineSpec(wi, 'day'), Wd = W[wi];
      drawScenery(c, wi, sp, t * 150, t, 960, 544); groundStrip(c, sp);
      c.fillStyle = sp.pal.top; for (let i = 0; i < 14; i++) c.fillRect(((i * 97 - t * 150) % 1000 + 1000) % 1000 - 20, 456, 3, 8);
      c.textAlign = 'center'; c.font = EMF(34); c.fillText(Wd.enemies[0].e, 1100 - t * 220, 446);
      if (wi === 5) {
        const vx = lerp(1150, 780, ease(seg(t, .3, 5))); c.font = EMF(210); c.fillText('🌋', vx, 330);
        c.strokeStyle = '#ffd54a'; c.lineWidth = 2; c.strokeRect(vx - 20, 170, 40, 36); for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(vx - 20 + i * 8, 170); c.lineTo(vx - 20 + i * 8, 206); c.stroke(); }
        cat(c, 'chey', vx, 192, 26, -1, t, false);
      }
      cat(c, 'luna', 300, 438, 66, 1, t, true);
      const a = seg(t, .4, 1.2) * (1 - seg(t, 4.8, 5.8));
      c.globalAlpha = a; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 8;
      c.font = 'bold 26px "Trebuchet MS",sans-serif'; c.fillStyle = '#fff'; c.strokeText('Welt ' + (wi + 1), 480, 160); c.fillText('Welt ' + (wi + 1), 480, 160);
      c.font = 'bold 64px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffd54a'; const n = Wd.emoji + ' ' + Wd.name; c.strokeText(n, 480, 220); c.fillText(n, 480, 220);
      c.globalAlpha = 1;
    } },

  bossintro: { dur: 3.4, sfx: [[.2, 'roar'], [1.25, 'bossHit']], subs: [],
    draw(c, t, o) {
      const wi = o.wi, B = W[wi][o.kind], sp = cineSpec(wi, wi === 5 ? 'night' : 'dusk');
      drawScenery(c, wi, sp, 80, t, 960, 544); groundStrip(c, sp);
      const u = ease(seg(t, 0, 1.2)), sh = t > 1.2 ? Math.sin(t * 40) * 3 : 0;
      c.textAlign = 'center'; drawCreature(c, B.n, 560 + sh, lerp(400, 300, u), lerp(40, 240, u), -1, t * 10, {});
      cat(c, 'luna', 220, 440, 66, 1, t, false);
      const a = seg(t, 1, 1.6); c.globalAlpha = a; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 8; c.textBaseline = 'middle';
      c.font = 'bold 26px "Trebuchet MS",sans-serif'; c.fillStyle = '#ff8a8a'; const k = o.kind === 'boss' ? '👑 Boss' : '⚔️ Wächter'; c.strokeText(k, 480, 100); c.fillText(k, 480, 100);
      c.font = 'bold 58px "Trebuchet MS",sans-serif'; c.fillStyle = '#fff'; c.strokeText(B.n, 480, 156); c.fillText(B.n, 480, 156); c.globalAlpha = 1;
    } },

  bossdown: { dur: 7, sfx: [[.1, 'bossHit'], [2.1, 'sparkle'], [4.2, 'roar']], subs: o => o.kind === 'boss' ? [[.5, 3.5, 'Der Boss ist besiegt!'], [4.2, 6.8, 'Da – der Drache! Er trägt Chey fort…']] : [[.5, 3.5, 'Der Wächter ist besiegt!'], [4, 6.8, 'Die Mondsplitter leuchten auf…']],
    draw(c, t, o) {
      const wi = o.wi, B = W[wi][o.kind], sp = cineSpec(wi, 'dusk');
      drawScenery(c, wi, sp, 40 + t * 10, t, 960, 544); groundStrip(c, sp);
      cat(c, 'luna', 220, 440, 70, 1, t, false);
      const u = ease(seg(t, 2, 4)), bx = 640 + (t < 2 ? Math.sin(t * 45) * 7 : 0);
      if (u < 1) { c.globalAlpha = 1 - u; drawCreature(c, B.n, bx, 355, lerp(190, 40, u), -1, t * 10, {}); c.globalAlpha = 1; }
      if (t > 2) { c.font = EMF(18); for (let i = 0; i < 22; i++) { const r = u * 150, a = i * .29; c.globalAlpha = 1 - u; c.fillText('✨', 640 + Math.cos(a) * r, 380 + Math.sin(a) * r * .7); } c.globalAlpha = 1; }
      if (t > 3.2 && t < 5.2) { const f = seg(t, 3.2, 5); c.font = EMF(16); for (let i = 0; i < 10; i++) { const k = clamp(f * 1.3 - i * .06, 0, 1); c.fillText('🌙', lerp(640, 230, ease(k)), lerp(380, 420, k) - Math.sin(k * 3.14) * 60); } }
      if (o.kind === 'boss' && t > 4) { const dx = lerp(-150, 1100, seg(t, 4, 7)), dy = 120 + Math.sin(t * 2) * 10; cat(c, 'chey', dx + 8, dy + 48, 36, 1, t, false); drawDragon(c, dx, dy, 110, t, 1); }
    } },

  ending: { dur: 20, sfx: [[1.4, 'thunder'], [1.6, 'roar'], [5.5, 'sparkle'], [8, 'moon'], [9.5, 'door'], [11.5, 'heal'], [13.2, 'win']], subs: [[.5, 3.8, 'Der Mondverschlinger zerfällt zu Asche!'], [4.6, 8.6, 'Die Mondsplitter kehren zum Himmel zurück…'], [9.4, 12.6, 'Chey ist frei!'], [13.2, 17.2, 'Zusammen gehen sie nach Hause – zum Mondsee.']],
    draw(c, t) {
      const k = seg(t, 7, 11), sp = { ...cineSpec(5, k > .5 ? 'night' : 'dusk'), sky: [mix('#2a0a0a', '#0b1033', k), mix('#c4401a', '#2b2f7a', k)] };
      drawScenery(c, 5, sp, t > 13 ? (t - 13) * 100 : 0, t, 960, 544); groundStrip(c, sp);
      const dA = 1 - seg(t, 1.5, 4.5);
      if (dA > 0) { c.globalAlpha = dA; drawDragon(c, 480 + Math.sin(t * 40) * 5, 250, 260, t, -1, '#2a0f10'); c.globalAlpha = 1; }
      if (t > 1.5 && t < 6) { const u = seg(t, 1.5, 6); for (let i = 0; i < 70; i++) { const r = u * 300 * (.3 + (i % 5) * .18), a = i * 2.4; c.fillStyle = `rgba(70,55,55,${1 - u})`; c.fillRect(480 + Math.cos(a) * r, 250 + Math.sin(a) * r * .8 + u * 60, 5, 5); } }
      if (t > 1.4 && t < 2.2) { c.fillStyle = `rgba(255,255,255,${1 - seg(t, 1.4, 2.2)})`; c.fillRect(0, 0, 960, 544); }
      if (t > 4 && t < 9) for (let i = 0; i < 30; i++) { const f = ease(seg(t, 4 + (i % 10) * .15, 8.5)), x = lerp((i * 131) % 960, 480 + (i % 7 - 3) * 8, f), y = lerp(560 + (i * 17) % 80, 120, f); c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
      const mr = 62 * seg(t, 8, 9.5); if (mr > 0) moonDisc(c, 480, 120, mr, 0, '#000');
      const cage = 1 - seg(t, 9.3, 10.3);
      if (t > 4) {
        if (cage > 0) { c.globalAlpha = cage; c.strokeStyle = '#ffd54a'; c.lineWidth = 3; c.strokeRect(190, 392, 64, 66); for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(190 + i * 10.7, 392); c.lineTo(190 + i * 10.7, 458); c.stroke(); } c.globalAlpha = 1; }
        const chx = t < 9.5 ? 222 : lerp(222, 520, ease(seg(t, 9.5, 11.5))), run = t >= 9.5 && t < 11.5;
        cat(c, 'chey', t > 13 ? 560 + (t - 13) * 0 + lerp(0, 450, seg(t, 13, 19)) - 70 : chx, 440, 56, t > 13 ? 1 : 1, t, run || t > 13);
        const lux = t > 13 ? lerp(600, 1050, seg(t, 13, 19)) : 600;
        cat(c, 'luna', lux, 440, 70, t > 13 ? 1 : -1, t, t > 13);
      }
      if (t > 11.5 && t < 13.2) { c.font = EMF(22); c.textAlign = 'center'; for (let i = 0; i < 5; i++) c.fillText('❤️', 560 + i * 12, 380 - (t - 11.5) * 50 - i * 14); }
      if (t > 17.6) { c.globalAlpha = seg(t, 17.6, 18.6); c.textAlign = 'center'; c.fillStyle = '#ffd54a'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.6)'; c.font = 'bold 80px "Trebuchet MS",sans-serif'; c.strokeText('ENDE', 480, 270); c.fillText('ENDE', 480, 270); c.globalAlpha = 1; }
    } },
};

function cine(key, o, done) {
  const S = CINE[key], subs = typeof S.subs === 'function' ? S.subs(o) : S.subs;
  show('cine'); AUDIO.stop(); let t = 0, last = performance.now(), fin = false, ei = 0; const evs = (S.sfx || []).slice();
  const stop = () => { if (fin) return; fin = true; cv.removeEventListener('pointerdown', stop); removeEventListener('keydown', kd); done(); };
  const kd = e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); stop(); } };
  cv.addEventListener('pointerdown', stop); addEventListener('keydown', kd);
  const c = ctx;
  const loop = ts => {
    if (fin) return;
    t += Math.min(.05, (ts - last) / 1000); last = ts;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.textBaseline = 'middle'; c.textAlign = 'center';
    S.draw(c, t, o);
    while (ei < evs.length && t >= evs[ei][0]) AUDIO.sfx(evs[ei++][1]);
    const b = Math.min(1, t * 2) * 46; c.fillStyle = '#000'; c.fillRect(0, 0, 960, b); c.fillRect(0, 544 - b, 960, b);
    const s = subs.find(s => t >= s[0] && t <= s[1]);
    if (s) { c.globalAlpha = Math.min(1, (t - s[0]) * 4, (s[1] - t) * 4); c.font = 'bold 24px "Trebuchet MS",sans-serif'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 6; c.fillStyle = '#fff'; c.strokeText(s[2], 480, 544 - 23); c.fillText(s[2], 480, 544 - 23); c.globalAlpha = 1; }
    c.font = '15px sans-serif'; c.fillStyle = 'rgba(255,255,255,.55)'; c.textAlign = 'right'; c.fillText('Tippen = überspringen', 950, 23); c.textAlign = 'center';
    if (t >= S.dur) return stop();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
