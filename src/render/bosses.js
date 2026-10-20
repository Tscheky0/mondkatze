// Die sechs Bosse: schattierte Vektorfiguren mit Leuchteffekten und mehrschichtiger Animation.
// Ueberschreibt die einfachen Einträge aus creatures.js. Koordinaten wie dort: 40x40-Box um (0,0), Blick nach rechts, t = Frames (10/s).
const _lg = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach((s, i) => g.addColorStop(i / (st.length - 1), s)); return g; };
// Schattierte Kugel/Ellipse: Licht oben links, dunkler Rand
const _ball = (c, x, y, rx, ry, col, line, lw) => {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(-rx * .35, -rx * .4, rx * .1, 0, 0, rx * 1.1); g.addColorStop(0, shade(col, .42)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, -.42));
  c.beginPath(); c.arc(0, 0, rx, 0, 7); c.fillStyle = g; c.fill(); c.restore();
  if (line) { c.strokeStyle = line; c.lineWidth = lw || 1.2; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.stroke(); }
};
const _glow = (c, x, y, r, rgb, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); };
const _poly = (c, pts, fill, line, lw) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw || 1.2; c.stroke(); } };
const _curve = (c, pts, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); c.stroke(); };
const _eyeGlow = (c, x, y, rx, ry, rgb, core) => { _glow(c, x, y, rx * 3, rgb, .55); _ball(c, x, y, rx, ry, core || '#fff6c8', null); };

Object.assign(CR, {
  // ---------- Wurzelkönig: uralter Baum mit goldener Krone ----------
  'Wurzelkönig': (c, t) => {
    const T = t * .1, sw = Math.sin(T * 1.6) * 2.5, br = 1 + Math.sin(T * 2) * .018;
    _glow(c, 0, -4, 32, '110,255,150', .16 + .06 * Math.sin(T * 3));
    c.save(); c.translate(0, 18); c.scale(1, br); c.translate(0, -18);
    for (let i = -4; i <= 4; i++) { const x = i * 3.2, w = Math.sin(T * 2 + i) * 2; c.lineCap = 'round'; _curve(c, [[x * .6, 14], [x * 1.2 + w, 19], [x * 2 + w * 1.4, 22.5], [x * 2.7 + w, 21]], shade('#3a2214', i % 2 ? .12 : -.12), 3.4 - Math.abs(i) * .3); }
    c.beginPath(); c.moveTo(-13, 18); c.bezierCurveTo(-17, 6, -12, -6, -10, -12); c.lineTo(10, -12); c.bezierCurveTo(12, -6, 17, 6, 13, 18); c.closePath();
    c.fillStyle = _lg(c, -14, 0, 14, 0, ['#2a190d', '#6a4a30', '#8c6944', '#5a3c24', '#241408']); c.fill(); c.strokeStyle = '#1a0e06'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(20,10,4,.45)'; c.lineWidth = .9; for (const x of [-8, -3, 3, 8]) { c.beginPath(); c.moveTo(x, -10); c.bezierCurveTo(x + 2, -2, x - 2, 6, x + 1, 16); c.stroke(); }
    _ball(c, 6, 7, 3.8, 2.6, '#4a3220', '#2a190d', .8); _e(c, 6, 7, 1.8, 1.1, '#1e1208');
    c.fillStyle = 'rgba(120,200,90,.6)'; for (const [x, y, r] of [[-10, 9, 3], [-7, 13, 2.4], [9.5, -1, 2.6], [-11, 1, 1.8]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (const d of [-1, 1]) {
      const a = Math.sin(T * 1.8 + (d > 0 ? 1.3 : 0)) * 3.2;
      _curve(c, [[d * 11, 0], [d * 17, -3 + a], [d * 22, 3 + a], [d * 25, 10 + a]], '#4a3220', 4.8); _curve(c, [[d * 11, -.8], [d * 17, -3.8 + a], [d * 22, 2.2 + a], [d * 25, 9.2 + a]], '#8c6944', 1.3);
      for (let k = 0; k < 4; k++) _ball(c, d * (24 + k * 1.3) + (k % 2) * 1.2, 7 + a + k * 2.4, 2.6, 1.9, k % 2 ? '#4ea84e' : '#6ac05a', '#1e5a2a', .6);
    }
    for (const [x, y, r, k] of [[-11, -16, 8, 1], [-4, -21, 8.6, -1], [5, -21, 8.6, 1], [12, -16, 8, -1], [0, -15.5, 8, 1]]) _ball(c, x + sw * .2 * k, y + sw * .15, r, r * .95, '#3f9a4c', '#1e5a2a', 1);
    c.fillStyle = 'rgba(200,255,150,.35)'; for (const [x, y] of [[-6, -23], [3, -26], [9, -20], [-13, -19]]) { c.beginPath(); c.ellipse(x + sw * .2, y, 2.6, 1.4, -.5, 0, 7); c.fill(); }
    for (let i = 0; i < 5; i++) { const ph = (T * .5 + i / 5) % 1, x = -15 + i * 7.5 + Math.sin(T * 3 + i * 2) * 3, y = -14 + ph * 36; c.save(); c.globalAlpha = 1 - ph; c.fillStyle = i % 2 ? '#8fe05a' : '#d8c040'; c.translate(x, y); c.rotate(ph * 6 + i); c.beginPath(); c.ellipse(0, 0, 1.9, .9, 0, 0, 7); c.fill(); c.restore(); }
    _poly(c, [[-8.5, -27], [-7, -34], [-3.6, -28.4], [0, -36.5], [3.6, -28.4], [7, -34], [8.5, -27]], _lg(c, 0, -36, 0, -26, ['#fff4a8', '#e8b020', '#a87810']), '#6a4a00', 1.1);
    _ball(c, 0, -30.4, 1.7, 1.7, '#ff4a6a'); _ball(c, -4.6, -29, 1.1, 1.1, '#4aa8ff'); _ball(c, 4.6, -29, 1.1, 1.1, '#5aff8a');
    _e(c, 0, -4, 8.6, 7.6, '#1a1008', '#0e0804', 1);
    _eyeGlow(c, -3.9, -5.2, 2.5, 1.7, '120,255,120', '#d6ffbc'); _eyeGlow(c, 3.9, -5.2, 2.5, 1.7, '120,255,120', '#d6ffbc');
    _l(c, [[-7, -9], [-2, -6.4]], '#0e0804', 1.6); _l(c, [[7, -9], [2, -6.4]], '#0e0804', 1.6);
    const m = 1 + Math.sin(T * 3) * .5; c.globalAlpha = .6; _e(c, 0, 3.6, 4.4, 1.3 * m, '#4aff8a'); c.globalAlpha = 1;
    _p(c, [[-4.6, 2.6], [-3.2, 5], [-1.8, 2.8], [0, 5.2], [1.8, 2.8], [3.2, 5], [4.6, 2.6]], '#e8f0c8', '#0e0804', .6);
    c.restore();
  },
  // ---------- Dschungel-Titan: Silberrücken mit Kriegsbemalung ----------
  'Dschungel-Titan': (c, t) => {
    const T = t * .1, br = 1 + Math.sin(T * 2.2) * .02, drum = Math.max(0, Math.sin(T * 3.4)), s = Math.sin(T * 1.7) * 2;
    _glow(c, 0, 2, 32, '255,170,60', .1 + .05 * drum);
    _ball(c, -7, 17.5, 6.4, 4, '#26262e'); _ball(c, 8, 17.5, 6.4, 4, '#26262e');
    _curve(c, [[-11, -2], [-19, 5], [-21, 12 + s], [-17, 17]], '#2c2c36', 8.4); _ball(c, -17, 17.4, 5.4, 5, '#22222a', '#101016', 1);
    c.save(); c.translate(0, 18); c.scale(1, br); c.translate(0, -18);
    _ball(c, 0, 4, 16.4, 14.8, '#34343f', '#14141c', 1.6); _ball(c, 3, 7, 10, 10, '#6e6e80');
    c.strokeStyle = 'rgba(10,10,18,.5)'; c.lineWidth = .8; for (let i = 0; i < 9; i++) { const x = -13 + i * 3.2, y = -4 + (i % 3) * 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 1.5, y + 3, x - 3, y + 5); c.stroke(); }
    c.save(); c.globalAlpha = .75; c.strokeStyle = '#d83a2a'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-1 + i * 4, 3 - i * .4); c.lineTo(4 + i * 4, 10 - i * .4); c.stroke(); } c.restore();
    c.restore();
    const fx = 15 - drum * 9, fy = 16 - drum * 18; _curve(c, [[11, -1], [19, 3 + s * .3], [fx + 5, fy - 6], [fx, fy]], '#3a3a46', 8.8); _ball(c, fx, fy, 5.8, 5.4, '#2a2a34', '#101016', 1.2);
    if (drum > .9) { c.strokeStyle = 'rgba(255,230,160,.8)'; c.lineWidth = 1.2; c.beginPath(); c.arc(fx - 6, fy, 8, 2.4, 4); c.stroke(); }
    c.save(); c.translate(3, -13 + Math.sin(T * 2.2) * .5);
    _ball(c, 0, 0, 10, 9.4, '#2e2e38', '#101016', 1.6); _ball(c, 2.6, 1.8, 7.2, 6, '#8a7468');
    _poly(c, [[-9, -4], [9, -4.4], [8, -1.2], [-8, -.8]], '#1e1e26'); _l(c, [[-6, -5.2], [8, -5.4]], '#4a4a58', 1);
    _eyeGlow(c, 0, -.6, 1.7, 1.3, '255,170,40', '#ffd070'); _eyeGlow(c, 7, -.8, 1.7, 1.3, '255,170,40', '#ffd070');
    _l(c, [[-2.4, -3.4], [2.4, -1.4]], '#0e0e14', 1.7); _l(c, [[9.4, -3.6], [4.6, -1.6]], '#0e0e14', 1.7);
    _e(c, 3.4, 3.2, .9, .7, '#14141c'); _e(c, 6, 3.2, .9, .7, '#14141c');
    c.fillStyle = '#16161c'; c.beginPath(); c.moveTo(-.4, 5.8); c.quadraticCurveTo(4, 9.4, 9, 5.8); c.quadraticCurveTo(4, 7.2, -.4, 5.8); c.fill();
    _p(c, [[.8, 6.2], [1.8, 9], [2.8, 6.4]], '#fffbe8'); _p(c, [[6.6, 6.4], [7.6, 9], [8.6, 6]], '#fffbe8');
    c.strokeStyle = '#d83a2a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-3, 1); c.lineTo(-1, 5); c.moveTo(-6, 1); c.lineTo(-4, 5); c.stroke();
    _ball(c, -9, -3, 3, 3.6, '#2a2a34', '#101016', 1);
    c.restore();
    for (let i = 0; i < 7; i++) { const a = -2.7 + i * .45; _ball(c, 2 + Math.cos(a) * 9, -3 + Math.sin(a) * 4 + 4.4, 2.6, 1.4, i % 2 ? '#3fae4a' : '#6ad25a', '#1e6a2a', .5); }
  },
  // ---------- Sandpharao: schwebender Totenkönig ----------
  'Sandpharao': (c, t) => {
    const T = t * .1, bob = Math.sin(T * 1.8) * 1.6, rot = T * .35;
    c.save(); c.translate(0, -8 + bob); c.rotate(rot);
    _glow(c, 0, 0, 30, '255,200,70', .34);
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); _poly(c, [[-1.6, -17], [0, -29], [1.6, -17]], 'rgba(255,214,90,.55)'); }
    c.restore();
    for (let i = 0; i < 10; i++) { const a = T * 2.4 + i * .63, rr = 12 + (i % 3) * 3.4; c.fillStyle = `rgba(232,196,110,${.4 + (i % 2) * .3})`; c.beginPath(); c.arc(Math.cos(a) * rr, 21 + Math.sin(a) * 2.4, 1.2 + (i % 2) * .5, 0, 7); c.fill(); }
    c.save(); c.translate(0, bob);
    c.beginPath(); c.moveTo(-14, -2); c.lineTo(14, -2); c.bezierCurveTo(15, 8, 8, 16, 2, 24); c.lineTo(-2, 24); c.bezierCurveTo(-8, 16, -15, 8, -14, -2); c.closePath();
    c.fillStyle = _lg(c, -14, 0, 14, 0, ['#a87818', '#f0cc5a', '#fff0a0', '#d8a830', '#8a5e10']); c.fill(); c.strokeStyle = '#6a4608'; c.lineWidth = 1.5; c.stroke();
    for (let i = 0; i < 5; i++) { const y = 3 + i * 3.8, w = 13 - i * 1.7; c.strokeStyle = i % 2 ? '#2a5ac8' : '#a87818'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + 1.8, w, y); c.stroke(); }
    c.lineCap = 'round'; _l(c, [[-12, 14], [12, 0]], '#7a5a1a', 2); _l(c, [[12, 14], [-12, 0]], '#7a5a1a', 2);
    _curve(c, [[12, 0], [16, -3], [16, -8], [12, -8]], '#e8c050', 1.8); for (let i = 0; i < 3; i++) _l(c, [[-12 + i, 0], [-16 + i * 2, -4 - i * 1.4]], '#2a5ac8', 1.3);
    for (let k = 0; k < 3; k++) { c.strokeStyle = ['#2ac8c8', '#e84a4a', '#f0cc5a'][k]; c.lineWidth = 2.2; c.beginPath(); c.arc(0, -6, 12 - k * 2.6, .12 * Math.PI, .88 * Math.PI); c.stroke(); }
    for (let i = 0; i < 5; i++) _ball(c, Math.cos(.2 * Math.PI + i * .15 * Math.PI) * 13, -6 + Math.sin(.2 * Math.PI + i * .15 * Math.PI) * 13, 1.2, 1.2, i % 2 ? '#e84a4a' : '#2ac8c8');
    _poly(c, [[-9, -24], [9, -24], [14, -4], [8, -2], [8, -14], [-8, -14], [-8, -2], [-14, -4]], '#e8c050', '#7a5a10', 1.4);
    for (let i = 0; i < 5; i++) { c.strokeStyle = i % 2 ? '#2a5ac8' : '#a87818'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-13 + i * .5, -14 + i * .7 + i * 1.6); c.lineTo(-8.4, -14 + i * .7 + i * 1.6); c.stroke(); c.beginPath(); c.moveTo(13 - i * .5, -14 + i * .7 + i * 1.6); c.lineTo(8.4, -14 + i * .7 + i * 1.6); c.stroke(); }
    for (let i = 0; i < 4; i++) { c.strokeStyle = i % 2 ? '#2a5ac8' : '#c89a20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-9 + i * .3, -23 + i * 2.6); c.lineTo(9 - i * .3, -23 + i * 2.6); c.stroke(); }
    _ball(c, 0, -10, 7.6, 9, '#d6a05c', '#7a4a1a', 1.2);
    _glow(c, -3.2, -11, 5, '255,200,60', .5); _glow(c, 3.2, -11, 5, '255,200,60', .5);
    _poly(c, [[-6.6, -12], [-.8, -11.2], [-1.4, -9.4], [-6, -10.4]], '#14100a'); _poly(c, [[6.6, -12], [.8, -11.2], [1.4, -9.4], [6, -10.4]], '#14100a');
    _e(c, -3.4, -10.6, 1.1, .9, '#ffd24a'); _e(c, 3.4, -10.6, 1.1, .9, '#ffd24a');
    _l(c, [[0, -9], [-.6, -6]], '#8a5a2a', 1); _l(c, [[-2.6, -3.6], [2.6, -3.6]], '#7a2a1a', 1.5);
    _poly(c, [[-2, -2], [2, -2], [3, 6], [0, 8], [-3, 6]], '#2a5ac8', '#14288a', .9); for (let i = 0; i < 3; i++) _l(c, [[-2.4, -.4 + i * 2.2], [2.4, -.4 + i * 2.2]], '#f0cc5a', .8);
    const sn = Math.sin(T * 3) * 1.2; _glow(c, 0, -24, 5, '90,255,130', .5 + .2 * Math.sin(T * 4));
    _curve(c, [[0, -17], [2 + sn, -20], [-2 + sn, -22], [0 + sn, -26]], '#3aa85a', 2.6); _ball(c, sn, -27, 2, 1.7, '#4acb6a', '#1a5a2a', .6); _e(c, sn + .6, -27.2, .5, .5, '#ff3a3a');
    c.restore();
  },
  // ---------- Eiskönigin: Kristallgewand, schwebender Frost ----------
  'Eiskönigin': (c, t) => {
    const T = t * .1, fl = Math.sin(T * 2.4) * 1.6, pulse = .5 + .5 * Math.sin(T * 3);
    _glow(c, 0, -2, 34, '150,220,255', .22 + .08 * pulse);
    for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(220,240,255,${.18 - i * .03})`; c.beginPath(); c.ellipse(Math.sin(T + i) * 6, 20 - i * 1.4, 20 - i * 2.6, 3.4, 0, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(-8, -10); c.bezierCurveTo(-22, -2 + fl, -22, 14, -17, 22); c.lineTo(17, 22); c.bezierCurveTo(22, 14, 22, -2 - fl, 8, -10); c.closePath();
    c.fillStyle = _lg(c, 0, -10, 0, 22, ['rgba(120,170,230,.9)', 'rgba(70,110,200,.85)']); c.fill(); c.strokeStyle = '#5a88c8'; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -4); c.bezierCurveTo(10, 8, 16, 16, 18, 22); c.lineTo(-18, 22); c.bezierCurveTo(-16, 16, -10, 8, -6, -4); c.closePath();
    c.fillStyle = _lg(c, -14, 0, 14, 20, ['#f4fbff', '#bfe4ff', '#7ab8f0', '#d8f0ff']); c.fill(); c.strokeStyle = '#5a9ad4'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; for (const a of [-8, -2, 5, 10]) { c.beginPath(); c.moveTo(a * .6, -2); c.lineTo(a * 1.5, 21); c.stroke(); }
    for (let i = 0; i < 6; i++) { const x = -10 + i * 4 + Math.sin(T * 3 + i) * .6, y = 6 + (i % 3) * 5; _poly(c, [[x, y - 1.8], [x + 1, y], [x, y + 1.8], [x - 1, y]], `rgba(255,255,255,${.5 + .4 * Math.sin(T * 5 + i * 2)})`); }
    for (const d of [-1, 1]) { _curve(c, [[d * 5, -2], [d * 11, 0 + fl * d], [d * 14, 6], [d * (d > 0 ? 16 : 12), 10]], '#e6f2ff', 3.2); _ball(c, d * (d > 0 ? 16 : 12), 10.4, 2, 2, '#f4ecff'); }
    for (const d of [-1, 1]) { const pts = [[d * 5, -16], [d * 13, -12 + fl], [d * 11 + Math.sin(T * 2 + d) * 2, 0], [d * 9 + Math.sin(T * 2.4) * 2, 10]]; _curve(c, pts, '#9ad0ff', 4.6); _curve(c, pts, '#e8f6ff', 1.2); }
    _ball(c, 0, -11, 7, 8, '#f4ecff', '#7a98d0', 1.2);
    _l(c, [[-5, -14], [-1.4, -12.6]], '#4a6ab0', 1.1); _l(c, [[5, -14], [1.4, -12.6]], '#4a6ab0', 1.1);
    _eyeGlow(c, -2.8, -11, 1.5, 1.9, '90,170,255', '#2a6aff'); _eyeGlow(c, 2.8, -11, 1.5, 1.9, '90,170,255', '#2a6aff');
    _l(c, [[-1.8, -6], [1.8, -6]], '#c85a8a', 1.3); _e(c, -4, -8, 1.3, .8, 'rgba(255,150,190,.5)'); _e(c, 4, -8, 1.3, .8, 'rgba(255,150,190,.5)');
    _glow(c, 0, -26, 10, '170,230,255', .45 + .2 * pulse);
    _poly(c, [[-7.6, -17], [-7.4, -27], [-4, -19], [-2.4, -30], [0, -20], [2.4, -30], [4, -19], [7.4, -27], [7.6, -17]], _lg(c, 0, -30, 0, -17, ['#ffffff', '#bfe8ff', '#6ab4f0']), '#4a8ad0', 1.1);
    _l(c, [[16, -2], [16, 20]], '#9a7a5a', 2); _glow(c, 16, -9, 9, '120,225,255', .55 + .3 * pulse);
    _poly(c, [[16, -17], [19.6, -10], [16, -3], [12.4, -10]], _lg(c, 12, -17, 20, -3, ['#ffffff', '#7fe0ff', '#2a8ab8']), '#2a7ab0', 1.1);
    for (let i = 0; i < 7; i++) { const a = T * 1.4 + i * .9, r = 17 + (i % 3) * 4, x = Math.cos(a) * r, y = -4 + Math.sin(a) * 11; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .8; for (let k = 0; k < 3; k++) { const an = k * 1.047 + a; c.beginPath(); c.moveTo(x - Math.cos(an) * 1.9, y - Math.sin(an) * 1.9); c.lineTo(x + Math.cos(an) * 1.9, y + Math.sin(an) * 1.9); c.stroke(); } }
  },
  // ---------- Donnervogel: Sturmvogel mit Blitzen ----------
  'Donnervogel': (c, t) => {
    const T = t * .1, f = Math.sin(T * 4.2), fl = f * 8, ch = Math.floor(T * 7);
    _glow(c, 0, 0, 36, '90,140,255', .2 + .08 * Math.sin(T * 6));
    for (const d of [-1, 1]) {
      for (let L = 0; L < 3; L++) {
        const sc = 1 - L * .16, yy = -fl * (1 - L * .25), col = ['#1e3a9a', '#2a4ab8', '#4a6ae0'][L];
        c.beginPath(); c.moveTo(d * 3, -2); c.lineTo(d * 12 * sc, -14 * sc + yy); c.lineTo(d * 16 * sc, -8 * sc + yy); c.lineTo(d * 20 * sc, -16 * sc + yy); c.lineTo(d * 23 * sc, -5 * sc + yy * .6); c.lineTo(d * 19 * sc, 1); c.lineTo(d * 21 * sc, 8 * sc); c.lineTo(d * 10 * sc, 4); c.lineTo(d * 6, 11 * sc); c.closePath();
        c.fillStyle = _lg(c, 0, -16, 0, 10, [shade(col, .25), col, shade(col, -.3)]); c.fill(); c.strokeStyle = L === 0 ? '#ffe04a' : 'rgba(255,224,74,.6)'; c.lineWidth = 1.3 - L * .25; c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .8; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(d * 4, -1 + k); c.lineTo(d * (13 + k * 2.4), -9 + k * 3 - fl * .8); c.stroke(); }
    }
    const tipY = -16 - fl, jag = (x0, y0, x1, y1, n, amp, seed) => { c.beginPath(); c.moveTo(x0, y0); for (let i = 1; i < n; i++) { const u = i / n; c.lineTo(x0 + (x1 - x0) * u + Math.sin(seed + i * 7) * amp, y0 + (y1 - y0) * u + Math.cos(seed + i * 5) * amp); } c.lineTo(x1, y1); c.stroke(); };
    c.save(); c.shadowColor = '#bfe8ff'; c.shadowBlur = 6; c.strokeStyle = `rgba(220,245,255,${.55 + .4 * Math.sin(T * 14)})`; c.lineWidth = 1.2; jag(-20, tipY, 20, tipY, 9, 3, ch); c.restore();
    _poly(c, [[-4, 10], [-11, 22], [-5, 18], [-4, 26], [0, 17], [3, 25], [4, 14]], _lg(c, 0, 10, 0, 26, ['#ffe04a', '#e8a020']), '#8a6a00', 1.1);
    _ball(c, 0, 3, 10.4, 12.6, '#3a5ac8', '#16288a', 1.5); _ball(c, 1.6, 6.4, 6.4, 8, '#8aaaff');
    for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = .8; c.beginPath(); c.arc(1.6, 3 + i * 3, 4.6, .3, 2.8); c.stroke(); }
    for (const x of [-3, 4]) { _l(c, [[x, 14], [x + .4, 19]], '#c8a020', 1.6); for (let k = -1; k <= 1; k++) _l(c, [[x + .4, 19], [x + k * 2.4 + 1, 22.4]], '#ffcf3a', 1.1); }
    _ball(c, 6, -10.4, 6.8, 6.6, '#3a5ac8', '#16288a', 1.4);
    for (let i = 0; i < 5; i++) { const w = Math.sin(T * 3 + i) * 1.2; _poly(c, [[2.4 + i * 1.8, -15.4], [1 + i * 2.4 + w, -26 + (i % 2) * 3], [5.4 + i * 1.8, -15.6]], i % 2 ? '#ffe04a' : '#ffbd2a', '#8a6a00', .9); }
    _poly(c, [[11, -11.6], [21, -9.4], [11.4, -6]], _lg(c, 11, -10, 21, -8, ['#ffe46a', '#e8a820']), '#8a6a00', 1.2); _l(c, [[11.6, -8.8], [18, -9]], '#8a6a00', .8);
    _eyeGlow(c, 7.6, -11.4, 1.8, 1.6, '255,230,90', '#fff6c8'); _e(c, 8, -11.4, .8, .9, '#16288a'); _l(c, [[4, -15.4], [10.4, -13]], '#0e1a5a', 1.8);
    for (let i = 0; i < 6; i++) { const ph = (T * 2 + i / 6) % 1; c.fillStyle = `rgba(255,240,140,${1 - ph})`; c.fillRect(-18 + i * 7 + Math.sin(i * 9 + ch) * 2, 14 + ph * 16, 1.4, 1.4); }
  },
  // ---------- Mondverschlinger: Drache mit verschlucktem Mond ----------
  'Mondverschlinger': (c, t) => {
    const T = t * .1, f = Math.sin(T * 3), br = 1 + Math.sin(T * 2.4) * .02, fire = Math.max(0, Math.sin(T * .9 + 1) * 2 - .9);
    _glow(c, 0, 2, 40, '255,50,60', .14 + .06 * Math.sin(T * 4));
    const wing = (k, a) => {
      const bx = -6 + k * 3, by = -6, tx = -12 + k * 16, ty = -26 - f * 7 * a;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(tx - 8, ty + 4, tx, ty); c.lineTo(tx + 4, ty + 10); c.quadraticCurveTo(tx + 6, ty + 14, tx + 12, ty + 16); c.quadraticCurveTo(tx + 10, ty + 24, tx + 18, ty + 28); c.quadraticCurveTo(tx + 6, ty + 28, bx + 4, by + 8); c.closePath();
      c.fillStyle = _lg(c, tx, ty, bx, by + 10, ['rgba(120,30,90,.92)', 'rgba(60,14,70,.95)']); c.fill(); c.strokeStyle = '#1a0828'; c.lineWidth = 1.3; c.stroke();
      c.strokeStyle = '#b86a9a'; c.lineWidth = 1; for (const [x, y] of [[tx + 4, ty + 10], [tx + 12, ty + 16], [tx + 18, ty + 28]]) { c.beginPath(); c.moveTo(bx, by); c.lineTo(x, y); c.stroke(); }
    };
    wing(0, .8);
    const tl = Math.sin(T * 2) * 3; _curve(c, [[-12, 6], [-26, 12 + tl], [-30, 0], [-34, -4 + tl]], '#2a0f3a', 7); _curve(c, [[-12, 6], [-26, 12 + tl], [-30, 0], [-34, -4 + tl]], '#5a2a7a', 2.4);
    for (let i = 0; i < 4; i++) _poly(c, [[-18 - i * 3.6, 9 - i * .6 + tl * .3], [-19 - i * 3.6, 3 - i * 1.6 + tl * .3], [-21 - i * 3.6, 9 - i * .6 + tl * .3]], '#8a3ab0');
    c.save(); c.shadowColor = '#ff7a2a'; c.shadowBlur = 6; _poly(c, [[-33, -4 + tl], [-39, -8 + tl + Math.sin(T * 8) * 2], [-36, -1 + tl]], '#ffb02a'); c.restore();
    c.save(); c.translate(0, 16); c.scale(1, br); c.translate(0, -16);
    _ball(c, 0, 4, 17, 12.6, '#3a1a5a', '#14061e', 1.6);
    c.save(); c.beginPath(); c.ellipse(0, 4, 17, 12.6, 0, 0, 7); c.clip(); c.strokeStyle = 'rgba(180,110,230,.25)'; c.lineWidth = .8;
    for (let y = -6; y < 18; y += 3.4) for (let x = -20 + ((y / 3.4) % 2) * 2.6; x < 20; x += 5.2) { c.beginPath(); c.arc(x, y, 2.8, 0, Math.PI); c.stroke(); } c.restore();
    c.save(); c.beginPath(); c.ellipse(1, 9, 10.6, 7, 0, 0, 7); c.clip(); c.fillStyle = _lg(c, 0, 2, 0, 16, ['#ffe08a', '#d89a30']); c.fillRect(-12, 0, 24, 18); c.strokeStyle = 'rgba(120,60,0,.5)'; c.lineWidth = .9; for (let y = 3; y < 16; y += 2.6) { c.beginPath(); c.moveTo(-12, y); c.quadraticCurveTo(0, y + 1.4, 12, y); c.stroke(); } c.restore();
    const m = .5 + .5 * Math.sin(T * 1.8); _glow(c, 0, 9, 11, '255,246,200', .5 + .35 * m); c.fillStyle = `rgba(255,248,210,${.6 + .3 * m})`; c.beginPath(); c.arc(0, 9, 4.2, 0, 7); c.fill(); c.fillStyle = 'rgba(90,40,110,.9)'; c.beginPath(); c.arc(1.8, 8.2, 3.4, 0, 7); c.fill();
    c.restore();
    for (let i = 0; i < 6; i++) _poly(c, [[-10 + i * 4, -6 + Math.abs(i - 2.5) * .8], [-9 + i * 4, -12 + Math.abs(i - 2.5) * 1.2], [-6.4 + i * 4, -6]], '#7a3ab0', '#1a0828', .8);
    wing(1, 1);
    for (const x of [-7, 7]) { _ball(c, x, 16.4, 4.4, 3, '#2a0f3a'); for (let k = -1; k <= 1; k++) _l(c, [[x + k * 2, 18], [x + k * 2.4, 20.6]], '#ffe8a0', 1); }
    _curve(c, [[8, -2], [14, -6], [12, -14], [16, -17]], '#2a0f3a', 8.2); _curve(c, [[8, -2], [14, -6], [12, -14], [16, -17]], '#5a2a7a', 2.4);
    c.save(); c.translate(17, -18 + Math.sin(T * 2.4) * .6); const jaw = fire * 5 + Math.sin(T * 2.4) * .6;
    _poly(c, [[-5, -3], [9, -3.6], [14, -.4], [-4, 3.4]], '#3a1a5a', '#14061e', 1.4);
    _poly(c, [[-3, 3], [13, 0], [10, 4 + jaw], [-3, 6 + jaw]], '#2a0f3a', '#14061e', 1.2);
    c.fillStyle = '#ff5a2a'; c.globalAlpha = .55 + fire * .4; c.beginPath(); c.moveTo(-1, 3); c.lineTo(11, .6); c.lineTo(9, 3.4 + jaw); c.lineTo(-1, 5 + jaw); c.fill(); c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) _poly(c, [[1 + i * 2.8, 2.6 - i * .2], [2.2 + i * 2.8, 5.6 + jaw * .5], [3.4 + i * 2.8, 2.4 - i * .2]], '#fffbe8');
    _poly(c, [[-2, -3], [-7, -11], [-1, -6]], '#e8d0a0', '#6a4a20', 1); _poly(c, [[2, -3.4], [-1, -12], [4, -5]], '#e8d0a0', '#6a4a20', 1);
    _eyeGlow(c, 4.2, -.6, 2.2, 1.6, '255,40,40', '#ffe04a'); _l(c, [[4.2, -2.2], [4.2, .9]], '#1a0408', 1);
    _l(c, [[1, -3.4], [8, -1.8]], '#14061e', 1.8);
    if (fire > .05) { c.save(); c.shadowColor = '#ff7a2a'; c.shadowBlur = 8; for (let i = 0; i < 6; i++) { const u = i / 6, fx = 12 + u * 22 * fire, fy = 1 + Math.sin(T * 12 + i) * 2.4 * u; c.fillStyle = i % 2 ? '#ffcf3a' : '#ff6a1a'; c.beginPath(); c.arc(fx, fy, 1.6 + u * 3.4 * fire, 0, 7); c.fill(); } c.restore(); }
    for (let i = 0; i < 3; i++) { const ph = (T * .8 + i / 3) % 1; c.fillStyle = `rgba(120,110,130,${.5 * (1 - ph)})`; c.beginPath(); c.arc(11 + ph * 3, -3 - ph * 8, 1.2 + ph * 2, 0, 7); c.fill(); }
    c.restore();
    for (let i = 0; i < 8; i++) { const ph = (T * .5 + i / 8) % 1; c.fillStyle = `rgba(255,${120 + (i * 20) % 100},40,${1 - ph})`; c.fillRect(-26 + i * 7 + Math.sin(T * 2 + i) * 3, 20 - ph * 44, 1.6, 1.6); }
  },
});

// ---------- Sternenwaechter (Himmel): kosmische Eule mit Sternenfluegeln ----------
const _star = (c, x, y, r, col) => { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .4 : r; c.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); } c.closePath(); c.fill(); c.restore(); };
Object.assign(CR, {
  'Sternenwächter': (c, t) => {
    const T = t * .1, fl = Math.sin(T * 3.2), br = 1 + Math.sin(T * 2) * .02;
    _glow(c, 0, -2, 40, '150,170,255', .22 + .08 * Math.sin(T * 4));
    for (const d of [-1, 1]) for (let L = 0; L < 3; L++) {
      const sc = 1 - L * .14, col = ['#1e2468', '#343c9a', '#6a74d8'][L], y0 = -fl * 6 * (1 - L * .2);
      _poly(c, [[d * 5, -4], [d * 14 * sc, -16 * sc + y0], [d * 22 * sc, -14 * sc + y0], [d * 28 * sc, -4 + y0 * .7], [d * 27 * sc, 6], [d * 19 * sc, 10], [d * 8, 8]], _lg(c, 0, -16, 0, 10, [shade(col, .2), col, shade(col, -.3)]), L ? 'rgba(255,224,106,.6)' : '#ffe06a', 1.2);
    }
    for (let i = 0; i < 6; i++) _star(c, (i % 2 ? 1 : -1) * (10 + i * 2.6), -8 + (i % 3) * 5 - fl * 2, 1.6, `rgba(255,240,170,${.5 + .5 * Math.sin(T * 4 + i)})`);
    for (let i = 0; i < 6; i++) { const a = T * 1.6 + i * 1.047; _star(c, Math.cos(a) * 25, -2 + Math.sin(a) * 14, 2.4 + (i % 2), '#ffe98a'); }
    c.save(); c.translate(0, 16); c.scale(1, br); c.translate(0, -16);
    for (const x of [-4, 4]) { _l(c, [[x, 14], [x, 19]], '#c8a020', 1.8); for (let k = -1; k <= 1; k++) _l(c, [[x, 19], [x + k * 2.4, 22.4]], '#ffcf3a', 1.2); }
    _ball(c, 0, 3, 11.4, 13.4, '#2a3080', '#10143a', 1.5); _ball(c, 0, 6, 7, 9.4, '#6a74d8');
    for (let i = 0; i < 7; i++) _star(c, -3 + (i % 3) * 3, -1 + Math.floor(i / 3) * 4.2, 1.1, `rgba(255,240,170,${.4 + .6 * Math.abs(Math.sin(T * 3 + i * 1.7))})`);
    _ball(c, 0, -12, 9.4, 8.8, '#343a90', '#10143a', 1.4);
    _poly(c, [[-8, -17], [-11, -25], [-4, -19]], '#343a90', '#10143a', 1); _poly(c, [[8, -17], [11, -25], [4, -19]], '#343a90', '#10143a', 1);
    _e(c, 0, -12, 7, 6.2, '#f6f0ff', '#8a8ad0', 1.1);
    _eyeGlow(c, -3.2, -12, 2.6, 2.6, '255,230,110', '#fff2b0'); _eyeGlow(c, 3.2, -12, 2.6, 2.6, '255,230,110', '#fff2b0'); _e(c, -3.2, -12, 1, 1.4, '#10143a'); _e(c, 3.2, -12, 1, 1.4, '#10143a');
    _poly(c, [[-1.6, -9.6], [1.6, -9.6], [0, -6]], '#ffcf3a', '#8a6a00', .9);
    _l(c, [[-6, -16], [-1.6, -14.4]], '#10143a', 1.4); _l(c, [[6, -16], [1.6, -14.4]], '#10143a', 1.4);
    c.restore();
    _glow(c, 0, -26, 10, '255,230,140', .5 + .2 * Math.sin(T * 3));
    c.fillStyle = '#ffe06a'; c.beginPath(); c.arc(0, -26, 6, 0, 7); c.fill(); c.fillStyle = '#1a1e4a'; c.beginPath(); c.arc(2.6, -27, 5.2, 0, 7); c.fill();
  },
});
