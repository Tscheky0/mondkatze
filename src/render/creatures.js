// Eigene Gegner- und Boss-Figuren (Vektor-Zeichnungen im Stil von Luna).
// Alle Figuren sind in eine 40x40-Box um (0,0) gezeichnet und schauen nach rechts. t = Animationszeit.
const _e = (c, x, y, rx, ry, f, s, l) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = l || 1.4; c.stroke(); } };
const _eye = (c, x, y, r, k) => { _e(c, x, y, r, r, '#fff'); c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(x + (k || 0), y + r * .15, r * .55, 0, 7); c.fill(); };
const _l = (c, pts, col, w) => { c.strokeStyle = col; c.lineWidth = w || 1.5; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
const _p = (c, pts, f, s, w) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = w || 1.4; c.stroke(); } };
const _brow = (c, x, y, d) => _l(c, [[x - 3 * d, y - 2.2], [x + 3 * d, y + 1.6]], '#2a1a1a', 1.7);
const _q = (c, a, b, e, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], e[0], e[1]); c.stroke(); };

const CR = {
  // ---------- Natur ----------
  'Pilzling': (c, t) => { const w = Math.sin(t * 1.2) * 3;
    _e(c, -5 - w, 16, 5, 3.4, '#f0e6d0', '#8a7a5a'); _e(c, 5 + w, 16, 5, 3.4, '#f0e6d0', '#8a7a5a');
    _p(c, [[-7, 0], [7, 0], [8, 15], [-8, 15]], '#f0e6d0', '#8a7a5a');
    c.beginPath(); c.moveTo(-19, 2); c.quadraticCurveTo(-19, -21, 0, -21); c.quadraticCurveTo(19, -21, 19, 2); c.closePath(); c.fillStyle = '#e8453c'; c.fill(); c.strokeStyle = '#8a2420'; c.lineWidth = 1.6; c.stroke();
    for (const [x, y, r] of [[-9, -10, 3.2], [4, -14, 3.6], [11, -6, 2.6]]) _e(c, x, y, r, r, '#fff');
    _eye(c, -3, 7, 2.5, 1); _eye(c, 5, 7, 2.5, 1); _brow(c, -3, 3.6, 1); _brow(c, 5, 3.6, -1); },
  'Hüpfkäfer': (c, t, o) => { const sp = o.air ? 4 : Math.sin(t * 1.4) * 2;
    for (const x of [-8, 0, 8]) { _l(c, [[x, 10], [x - 3 - sp, 17]], '#2a2a2a', 2); _l(c, [[x, 10], [x + 3 + sp, 17]], '#2a2a2a', 2); }
    _e(c, 0, 2, 15, 12, '#e8453c', '#7a1a16', 1.8); _l(c, [[0, -9], [0, 13]], '#7a1a16', 1.6);
    for (const [x, y] of [[-7, -2], [7, -2], [-5, 6], [6, 6]]) _e(c, x, y, 2.6, 2.6, '#222');
    _e(c, 13, 4, 7, 6, '#2a2a2a'); _eye(c, 15, 2, 1.9); _l(c, [[16, -1], [22, -8 + Math.sin(t) * 2]], '#2a2a2a', 1.4); },
  'Biene': (c, t) => { const fl = Math.sin(t * 3) * .5;
    c.save(); c.translate(-2, -4); c.rotate(-.4 + fl); _e(c, 0, -6, 6, 9, 'rgba(200,230,255,.75)', '#7aa'); c.restore();
    c.save(); c.translate(3, -4); c.rotate(.3 - fl); _e(c, 0, -6, 5, 8, 'rgba(200,230,255,.6)', '#7aa'); c.restore();
    c.save(); c.beginPath(); c.ellipse(0, 3, 13, 9, 0, 0, 7); c.clip(); c.fillStyle = '#ffd23a'; c.fillRect(-14, -8, 30, 24); c.fillStyle = '#2a2000'; c.fillRect(-6, -8, 3.6, 24); c.fillRect(1, -8, 3.6, 24); c.restore();
    _e(c, 0, 3, 13, 9, null, '#6a4a00', 1.6); _p(c, [[-13, 3], [-19, 1], [-13, 6]], '#2a2000');
    _e(c, 11, 2, 5.5, 5.2, '#ffd23a', '#6a4a00'); _eye(c, 13, 0, 2); _l(c, [[13, -3], [17, -8]], '#2a2000', 1.3); },
  // ---------- Dschungel ----------
  'Frosch': (c, t, o) => { const ex = o.air ? 5 : 0;
    _e(c, -11, 12 + ex * .3, 7, 4 + ex * .2, '#3aa84a', '#1f6a2a'); _e(c, 0, 6, 15, 10, '#4cc35a', '#1f6a2a', 1.7); _e(c, 3, 11, 10, 5, '#bff0a8');
    _e(c, 7, -5, 5.5, 5.5, '#4cc35a', '#1f6a2a'); _e(c, -2, -5, 5.5, 5.5, '#4cc35a', '#1f6a2a'); _eye(c, 8, -6, 3.5, 1); _eye(c, -1, -6, 3.5, 1);
    c.strokeStyle = '#1f6a2a'; c.lineWidth = 1.6; c.beginPath(); c.arc(8, 7, 6, .2, 2.6); c.stroke(); _e(c, 12, 17, 4, 2.4, '#3aa84a', '#1f6a2a'); },
  'Affe': (c, t) => { const s = Math.sin(t * 1.2) * 3;
    _q(c, [-10, 10], [-24, 6 + s], [-18, -6], '#6a4220', 3.6);
    _l(c, [[-4, 12], [-5 - s, 19]], '#6a4220', 3.6); _l(c, [[4, 12], [5 + s, 19]], '#6a4220', 3.6);
    _e(c, 0, 4, 11, 12, '#8a5a30', '#4a2a10', 1.6); _e(c, 2, 7, 7, 8, '#d9ae7a'); _l(c, [[3, 0], [10 + s, 8]], '#6a4220', 3.4);
    _e(c, 4, -9, 9, 9, '#8a5a30', '#4a2a10', 1.6); _e(c, -4, -9, 3.5, 3.5, '#d9ae7a', '#4a2a10'); _e(c, 12, -9, 3, 3, '#d9ae7a', '#4a2a10');
    _e(c, 7, -7, 6, 5, '#f0cfa8'); _eye(c, 4, -10, 2, 1); _eye(c, 10, -10, 2, 1); c.fillStyle = '#4a2a10'; c.beginPath(); c.arc(8, -5, 1.4, 0, 7); c.fill(); },
  'Papagei': (c, t) => { const fl = Math.sin(t * 2.6) * .45;
    _p(c, [[-8, 4], [-20, 14], [-16, 18], [-5, 12]], '#2a8ae8', '#16508a'); _p(c, [[-8, 2], [-19, 7], [-15, 12]], '#3ac87a', '#16685a');
    _e(c, 0, 3, 10, 13, '#e8453c', '#8a2420', 1.6);
    c.save(); c.translate(-2, 0); c.rotate(-.3 + fl); _e(c, -3, 2, 6, 10, '#3a7ae8', '#16408a'); _e(c, -3, 7, 4, 5, '#ffd23a'); c.restore();
    _e(c, 7, -9, 7, 7, '#e8453c', '#8a2420'); _e(c, 9, -10, 3.5, 3.5, '#f0e6d0'); _eye(c, 9, -10, 2, 1);
    c.beginPath(); c.moveTo(13, -11); c.quadraticCurveTo(20, -11, 17, -4); c.quadraticCurveTo(15, -8, 13, -7); c.closePath(); c.fillStyle = '#ffd23a'; c.fill(); c.strokeStyle = '#8a6a00'; c.lineWidth = 1.2; c.stroke(); },
  // ---------- Wüste ----------
  'Skorpion': (c, t) => { const s = Math.sin(t * 1.4) * 2;
    for (let i = 0; i < 4; i++) { _l(c, [[-6 + i * 5, 10], [-8 + i * 5 + s, 17]], '#6a4a1a', 1.8); }
    _q(c, [-12, 8], [-28, -6], [-12, -17], '#c9a05a', 4.6); _q(c, [-12, 8], [-28, -6], [-12, -17], '#6a4a1a', 1.4);
    _p(c, [[-15, -18], [-8, -19], [-11, -11]], '#d9402a', '#6a1a10');
    for (const [x, rx] of [[-5, 8], [5, 8], [12, 6]]) _e(c, x, 6, rx, 6.5, '#d9ae6a', '#6a4a1a', 1.5);
    const op = 1 + Math.sin(t * 2) * .6; _e(c, 17, 1, 5, 3.6 * op, '#c9a05a', '#6a4a1a'); _e(c, 17, 11, 5, 3.4, '#c9a05a', '#6a4a1a'); _eye(c, 11, 2, 1.6); },
  'Geier': (c, t) => { const fl = Math.sin(t * 2.2) * 9;
    _p(c, [[-2, 0], [-22, -8 - fl], [-18, 2], [-8, 8]], '#3a2a2a', '#1a1010'); _p(c, [[2, 0], [20, -6 - fl], [16, 4], [6, 8]], '#4a3a3a', '#1a1010');
    _e(c, 0, 4, 11, 10, '#4a3a3a', '#1a1010', 1.6); _e(c, 7, -4, 6, 4, '#f0ece0'); _e(c, 11, -8, 5, 5, '#e8b8a0', '#8a5a4a');
    c.beginPath(); c.moveTo(15, -9); c.quadraticCurveTo(22, -9, 19, -2); c.quadraticCurveTo(17, -6, 15, -5); c.closePath(); c.fillStyle = '#e8c050'; c.fill(); c.strokeStyle = '#8a6a10'; c.lineWidth = 1; c.stroke();
    _eye(c, 12, -9, 1.8, 1); _brow(c, 12, -12, -1); },
  'Kaktussprung': (c, t, o) => { const sq = o.air ? 1.12 : 1 + Math.sin(t) * .03;
    c.save(); c.scale(1 / sq, sq);
    _l(c, [[-8, 2], [-15, 2], [-15, -9]], '#5ab86a', 5.5); _l(c, [[8, -2], [15, -2], [15, -12]], '#5ab86a', 5.5);
    _p(c, [[-8, -15], [8, -15], [9, 15], [-9, 15]], '#5ab86a', '#2a7a3a', 1.6); _e(c, 0, -15, 8, 5, '#5ab86a', '#2a7a3a', 1.6);
    for (const [x, y] of [[-5, -8], [5, -4], [-4, 6], [6, 9], [-15, -6], [15, -9]]) { _l(c, [[x, y], [x + (x < 0 ? -2.5 : 2.5), y - 2.2]], '#fff', 1.2); }
    _e(c, 0, -20, 3.4, 3.4, '#ff7ab0', '#a02a60'); c.restore();
    _eye(c, -2.5, 0, 2.6, 1); _eye(c, 4, 0, 2.6, 1); _brow(c, -2.5, -3.5, 1); _brow(c, 4, -3.5, -1); },
  // ---------- Schnee ----------
  'Pinguin': (c, t) => { const s = Math.sin(t * 1.3) * 3;
    _e(c, -4 - s, 17, 5, 2.6, '#ff9a2a', '#8a4a00'); _e(c, 5 + s, 17, 5, 2.6, '#ff9a2a', '#8a4a00');
    _e(c, 0, 2, 11, 15, '#2a2e3a', '#10121a', 1.6); _e(c, 2, 5, 7, 11, '#f4f6ff');
    c.save(); c.translate(-9, 0); c.rotate(.3 + Math.sin(t * 1.3) * .3); _e(c, 0, 5, 3, 9, '#2a2e3a'); c.restore();
    _eye(c, 5, -8, 2.7, 1); _eye(c, 10, -8, 2.2, 1); _brow(c, 7, -12, -1);
    _p(c, [[8, -5], [16, -3], [8, -1]], '#ff9a2a', '#8a4a00'); },
  'Schneehase': (c, t, o) => { const ear = Math.sin(t * .8) * .12;
    _e(c, -13, 8, 5, 5, '#fff', '#9ab'); _e(c, 0, 6, 13, 10, '#fdfdff', '#9ab', 1.6); _e(c, -8, 14, 6, 3.4, '#fdfdff', '#9ab');
    c.save(); c.translate(7, -8); c.rotate(-.2 + ear); _e(c, 0, -9, 3.4, 10, '#fdfdff', '#9ab'); _e(c, 0, -9, 1.8, 7.5, '#ffb0c8'); c.restore();
    c.save(); c.translate(11, -7); c.rotate(.2 - ear); _e(c, 0, -9, 3.4, 10, '#fdfdff', '#9ab'); _e(c, 0, -9, 1.8, 7.5, '#ffb0c8'); c.restore();
    _e(c, 10, -2, 8, 7.5, '#fdfdff', '#9ab', 1.6); _eye(c, 13, -4, 2.2, 1); _e(c, 17, -1, 1.5, 1.2, '#ff8aa8'); },
  'Frostgeist': (c, t) => { const w = Math.sin(t * 1.2) * 2;
    c.save(); c.shadowColor = '#bfe8ff'; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(-13, 14); c.lineTo(-13, -4); c.quadraticCurveTo(-13, -20, 0, -20); c.quadraticCurveTo(13, -20, 13, -4); c.lineTo(13, 14);
    c.quadraticCurveTo(9, 8 + w, 5, 14); c.quadraticCurveTo(1, 20 - w, -3, 14); c.quadraticCurveTo(-7, 8 + w, -13, 14); c.closePath();
    c.fillStyle = 'rgba(200,235,255,.88)'; c.fill(); c.strokeStyle = '#6ab0d8'; c.lineWidth = 1.5; c.stroke(); c.restore();
    _e(c, -4, -6, 2.6, 3.6, '#1a2a4a'); _e(c, 5, -6, 2.6, 3.6, '#1a2a4a'); _e(c, 0, 2, 2.2, 2.8, '#1a2a4a');
    for (let i = 0; i < 3; i++) { const a = i * 1.047; _l(c, [[7 - Math.cos(a) * 4, 8 - Math.sin(a) * 4], [7 + Math.cos(a) * 4, 8 + Math.sin(a) * 4]], '#fff', 1.2); } },
  // ---------- Berg ----------
  'Steinbock': (c, t) => { const s = Math.sin(t * 1.3) * 2.5;
    for (const x of [-9, -4, 5, 10]) _l(c, [[x, 10], [x + (x % 2 ? s : -s), 18]], '#5a4a3a', 2.6);
    _e(c, 0, 5, 14, 9, '#9a8a78', '#4a3a2a', 1.6); _e(c, 12, -2, 7, 5.5, '#a89886', '#4a3a2a', 1.6);
    _q(c, [10, -6], [6, -20], [-4, -17], '#e8dcc0', 4); _q(c, [10, -6], [6, -20], [-4, -17], '#7a6a4a', 1);
    _p(c, [[15, 3], [18, 3], [16.5, 9]], '#e8dcc0', '#7a6a4a', 1); _eye(c, 14, -3, 1.8, 1); _e(c, 19, 0, 1.4, 1.4, '#3a2a1a'); },
  'Fledermaus': (c, t) => { const fl = Math.sin(t * 2.8) * 7;
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 3, 0); c.quadraticCurveTo(d * 12, -14 - fl, d * 22, -6 - fl); c.quadraticCurveTo(d * 17, -2, d * 17, 3); c.quadraticCurveTo(d * 12, 0, d * 10, 6); c.quadraticCurveTo(d * 6, 2, d * 3, 8); c.closePath(); c.fillStyle = '#5a4a7a'; c.fill(); c.strokeStyle = '#2a1a4a'; c.lineWidth = 1.4; c.stroke(); }
    _e(c, 0, 3, 6, 8, '#4a3a6a', '#2a1a4a', 1.5); _p(c, [[-6, -4], [-4, -12], [-1, -5]], '#4a3a6a', '#2a1a4a', 1.2); _p(c, [[6, -4], [4, -12], [1, -5]], '#4a3a6a', '#2a1a4a', 1.2);
    _e(c, -2.4, 0, 1.7, 1.7, '#ff4a4a'); _e(c, 2.4, 0, 1.7, 1.7, '#ff4a4a'); _p(c, [[-2, 6], [-1, 9], [0, 6]], '#fff'); _p(c, [[1, 6], [2, 9], [3, 6]], '#fff'); },
  'Felsbrocken': (c, t, o) => { const sq = o.air ? 1.08 : 1;
    c.save(); c.scale(1 / sq, sq);
    _p(c, [[-15, 12], [-17, -2], [-9, -14], [4, -17], [15, -9], [17, 5], [12, 14]], '#8a8a96', '#40404c', 1.8);
    _p(c, [[-9, -14], [4, -17], [15, -9], [4, -6]], '#a4a4b0');
    _l(c, [[-6, 4], [-2, 8], [-4, 12]], '#40404c', 1.4); _l(c, [[8, -4], [11, 1]], '#40404c', 1.4); c.restore();
    _e(c, -4, -2, 3, 2.6, '#ffe04a', '#40404c', 1); _e(c, 6, -2, 3, 2.6, '#ffe04a', '#40404c', 1); _brow(c, -4, -6, 1); _brow(c, 6, -6, -1);
    _l(c, [[-5, 6], [-2, 4], [1, 7], [4, 4], [7, 6]], '#2a2a32', 1.5); },
  // ---------- Lava ----------
  'Lavakrabbe': (c, t) => { const s = Math.sin(t * 1.5) * 2, cl = Math.sin(t * 1.2) * 3;
    for (let i = 0; i < 3; i++) { _l(c, [[-9 + i * 7, 11], [-12 + i * 7 + s, 18]], '#8a2a10', 2); _l(c, [[-6 + i * 7, 11], [-3 + i * 7 - s, 18]], '#8a2a10', 2); }
    _e(c, 0, 6, 16, 9.5, '#e8602a', '#7a2a10', 1.7); _l(c, [[-6, 4], [-2, 8], [3, 4], [8, 9]], '#ffd23a', 1.3);
    for (const d of [-1, 1]) { _l(c, [[d * 13, 4], [d * 17, -4]], '#c84a1a', 3); c.beginPath(); c.arc(d * 17, -8 - cl * .4, 5, d > 0 ? .5 : 2.6, d > 0 ? 5.8 : 6.0 + 3.1); c.lineTo(d * 17, -8); c.closePath(); c.fillStyle = '#e8602a'; c.fill(); c.strokeStyle = '#7a2a10'; c.lineWidth = 1.5; c.stroke(); }
    _l(c, [[-4, 0], [-4, -6]], '#7a2a10', 1.5); _l(c, [[4, 0], [4, -6]], '#7a2a10', 1.5); _eye(c, -4, -8, 2.4, 1); _eye(c, 4, -8, 2.4, 1); },
  'Feuergeist': (c, t) => { const f = Math.sin(t * 2.4) * 2, g = Math.cos(t * 2) * 2;
    c.save(); c.shadowColor = '#ff8a2a'; c.shadowBlur = 12;
    c.beginPath(); c.moveTo(0, -22 + f); c.quadraticCurveTo(8 + g, -10, 13, 2); c.quadraticCurveTo(15, 15, 0, 17); c.quadraticCurveTo(-15, 15, -13, 2); c.quadraticCurveTo(-8 - g, -10, 0, -22 + f); c.closePath();
    c.fillStyle = '#ff6a1a'; c.fill(); c.restore();
    c.beginPath(); c.moveTo(0, -10 + f); c.quadraticCurveTo(6, -2, 8, 5); c.quadraticCurveTo(8, 13, 0, 14); c.quadraticCurveTo(-8, 13, -8, 5); c.quadraticCurveTo(-5, -2, 0, -10 + f); c.closePath(); c.fillStyle = '#ffd23a'; c.fill();
    _e(c, -3.5, 1, 2, 3, '#3a1a0a'); _e(c, 3.5, 1, 2, 3, '#3a1a0a'); _e(c, 0, 8, 2.4, 1.6, '#3a1a0a'); },
  'Magma-Schleim': (c, t, o) => { const w = Math.sin(t * 1.5) * 1.6;
    c.save(); c.shadowColor = '#ff7a2a'; c.shadowBlur = 8; _e(c, 0, 8, 16 + w, 11 - w, '#ff7a2a', '#8a2a00', 1.8); c.restore();
    _e(c, -5, 3, 6, 3.4, 'rgba(255,230,120,.7)'); _e(c, 6, 12, 2.4, 2.4, '#ffd23a'); _e(c, -8, 12, 1.8, 1.8, '#ffd23a');
    _eye(c, -4, 4, 3, 1); _eye(c, 5, 4, 3, 1); _l(c, [[-3, 11], [0, 13], [3, 11]], '#5a1a00', 1.6); _e(c, 11, 18, 1.8, 3, '#ff7a2a'); },
  // ---------- Schwaerme (klein) ----------
  'Schwarm0': (c, t) => { const s = Math.sin(t * 2) * 2;
    for (const x of [-4, 0, 4]) { _l(c, [[x, 4], [x - 3 + s, 12]], '#3a1a10', 1.6); _l(c, [[x, 4], [x + 3 - s, 12]], '#3a1a10', 1.6); }
    _e(c, -8, 2, 6, 5, '#6a2a1a', '#2a1008'); _e(c, 0, 2, 4, 4, '#7a3a2a', '#2a1008'); _e(c, 8, 1, 5, 5, '#6a2a1a', '#2a1008'); _l(c, [[11, -2], [16, -8]], '#2a1008', 1.3); _eye(c, 10, 0, 1.5); },
  'Schwarm1': (c, t) => { const fl = Math.sin(t * 4) * .5;
    c.save(); c.rotate(-.5 + fl); _e(c, -2, -9, 3, 8, 'rgba(210,235,255,.8)', '#789'); c.restore(); c.save(); c.rotate(.4 - fl); _e(c, 3, -9, 3, 7, 'rgba(210,235,255,.7)', '#789'); c.restore();
    for (const x of [-4, 0, 4]) _l(c, [[x, 4], [x - 2, 13]], '#3a3a3a', 1.2);
    _e(c, -3, 1, 8, 3.6, '#6a5a50', '#2a2220'); _e(c, 7, 0, 3.4, 3, '#6a5a50'); _l(c, [[10, 0], [17, 4]], '#2a2220', 1.4); _eye(c, 8, -1, 1.3); },
  'Schwarm2': (c, t) => { const s = Math.sin(t * 2.2) * 2;
    _l(c, [[-2, 4], [-10, -4 + s], [-14, 10]], '#4a6a2a', 2.4); _l(c, [[3, 6], [4, 12]], '#4a6a2a', 1.6);
    _e(c, -2, 3, 11, 5.5, '#7aa83a', '#3a5a1a', 1.4); _e(c, 10, 0, 5, 4.4, '#8ab84a', '#3a5a1a'); _eye(c, 12, -1, 1.6); _l(c, [[12, -4], [20, -10]], '#3a5a1a', 1.2); _l(c, [[10, -4], [15, -12]], '#3a5a1a', 1.2); },
  'Schwarm3': (c, t) => { const s = Math.sin(t * 2) * 2;
    _q(c, [-10, 6], [-20, 0 + s], [-17, -8], '#c89aa0', 1.8); _e(c, 0, 5, 12, 8, '#9a9aa8', '#4a4a58', 1.4); _e(c, 11, 3, 6, 5, '#a8a8b6', '#4a4a58', 1.4);
    _e(c, 8, -3, 3.4, 3.8, '#9a9aa8', '#4a4a58'); _e(c, 8, -3, 1.8, 2.2, '#ffb0c8'); _eye(c, 13, 1, 1.5); _e(c, 17, 4, 1.3, 1.2, '#ff8aa8'); _l(c, [[-5, 12], [-6 + s, 16]], '#4a4a58', 1.6); _l(c, [[5, 12], [6 - s, 16]], '#4a4a58', 1.6); },
  'Schwarm4': (c, t) => { const fl = Math.sin(t * 3) * .5;
    _e(c, 0, 3, 11, 9, '#b0824a', '#5a3a1a', 1.5); c.save(); c.translate(-2, 2); c.rotate(-.3 + fl); _e(c, -2, 0, 5, 8, '#8a5a2a', '#5a3a1a'); c.restore();
    _e(c, 9, -3, 6, 6, '#b0824a', '#5a3a1a'); _p(c, [[14, -4], [20, -2], [14, 0]], '#ffb02a', '#8a5a00'); _eye(c, 10, -4, 1.7, 1); _p(c, [[-10, 6], [-17, 10], [-11, 11]], '#5a3a1a'); },
  'Schwarm5': (c, t) => { const s = Math.sin(t * 2.4) * 2;
    for (const x of [-6, 0, 6]) { _l(c, [[x, 4], [x - 3 + s, 12]], '#2a1408', 1.5); _l(c, [[x, 4], [x + 3 - s, 12]], '#2a1408', 1.5); }
    _e(c, 0, 1, 13, 7, '#5a2a14', '#1a0a04', 1.5); _e(c, 0, -1, 10, 3.6, 'rgba(255,200,120,.35)'); _e(c, 11, 0, 4.4, 4, '#4a2010', '#1a0a04'); _l(c, [[13, -3], [21, -9 + s]], '#1a0a04', 1.2); _l(c, [[12, -3], [18, -12]], '#1a0a04', 1.2); _eye(c, 12, -1, 1.3); },
};

// ---------- Bosse ----------
Object.assign(CR, {
  'Eichen-Wächter': (c, t) => { const sw = Math.sin(t * .7) * 3;
    for (const x of [-9, -3, 4, 10]) _q(c, [x, 16], [x + (x < 0 ? -4 : 4), 20], [x + (x < 0 ? -9 : 9), 19], '#4a2a10', 3);
    c.beginPath(); c.moveTo(-11, 18); c.quadraticCurveTo(-13, 0, -9, -10); c.lineTo(9, -10); c.quadraticCurveTo(13, 0, 11, 18); c.closePath(); c.fillStyle = '#7a4a22'; c.fill(); c.strokeStyle = '#3a1e0a'; c.lineWidth = 1.8; c.stroke();
    for (const [a, b, d] of [[-5, -8, 14], [3, -9, 16], [8, -6, 12]]) _l(c, [[a, b], [a + 1, b + d]], '#5a3416', 1.2);
    _l(c, [[-11, 0], [-19, -6 + sw], [-22, -2 + sw]], '#6a3e1a', 4); _l(c, [[11, 0], [19, -6 - sw], [22, -2 - sw]], '#6a3e1a', 4);
    for (const [x, y] of [[-22, -2 + sw], [22, -2 - sw]]) { _e(c, x, y, 4, 3, '#4caf3a', '#2a6a1a'); }
    for (const [x, y, r] of [[-10, -16, 9], [0, -21, 10], [10, -16, 9], [-3, -14, 8], [6, -13, 8]]) _e(c, x, y + sw * .2, r, r, '#4caf3a', '#2a6a1a');
    _e(c, -4, -3, 2.8, 2.2, '#ffe04a'); _e(c, 5, -3, 2.8, 2.2, '#ffe04a'); _brow(c, -4, -7, 1); _brow(c, 5, -7, -1); _e(c, 0, 6, 3.4, 2.6, '#2a1008'); },
  'Wurzelkönig': (c, t) => { const sw = Math.sin(t * .8) * 3;
    for (let i = -3; i <= 3; i++) _q(c, [i * 3, 16], [i * 8 + sw * (i % 2 ? 1 : -1), 22], [i * 6, 19], '#3a2214', 2.6);
    c.beginPath(); c.moveTo(-12, 18); c.quadraticCurveTo(-15, 0, -10, -11); c.lineTo(10, -11); c.quadraticCurveTo(15, 0, 12, 18); c.closePath(); c.fillStyle = '#4a3322'; c.fill(); c.strokeStyle = '#1e120a'; c.lineWidth = 1.8; c.stroke();
    _l(c, [[-12, 2], [-20, 8 + sw], [-24, 14]], '#4a3322', 4); _l(c, [[12, 2], [20, 8 - sw], [24, 14]], '#4a3322', 4);
    for (const [x, y, r] of [[-9, -17, 8], [0, -20, 9], [9, -17, 8]]) _e(c, x, y, r, r, '#3a7a4a', '#1e4a2a');
    _p(c, [[-9, -24], [-6, -31], [-3, -25], [0, -33], [3, -25], [6, -31], [9, -24]], '#ffd23a', '#8a6a00', 1.4);
    _e(c, -4, -3, 3, 2.4, '#7aff7a'); _e(c, 5, -3, 3, 2.4, '#7aff7a'); _brow(c, -4, -7, 1); _brow(c, 5, -7, -1); _l(c, [[-4, 6], [-1, 8], [2, 6], [5, 8]], '#150a04', 1.8); },
  'Lianen-Schlange': (c, t) => { const w = Math.sin(t * 1.2) * 3;
    c.lineCap = 'round'; for (const [col, wd] of [['#1f6a2a', 11], ['#3fbf5a', 8.6]]) { c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); c.moveTo(-16, 17); c.bezierCurveTo(-24, 8 + w, -2, 12, -6, 2); c.bezierCurveTo(-12, -6, 12, -2 + w, 8, -10); c.stroke(); }
    c.strokeStyle = '#d9e84a'; c.lineWidth = 1.6; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(-16, 17); c.bezierCurveTo(-24, 8 + w, -2, 12, -6, 2); c.bezierCurveTo(-12, -6, 12, -2 + w, 8, -10); c.stroke(); c.setLineDash([]);
    _e(c, 11, -13, 8, 6, '#3fbf5a', '#1f6a2a', 1.8); _e(c, 12, -15, 2, 2.6, '#ffe04a'); _e(c, 12, -15, .8, 2.4, '#1a1a1a'); _brow(c, 12, -19, -1);
    const tg = Math.sin(t * 3) * 2; _l(c, [[18, -12], [24 + tg, -12], [27 + tg, -15]], '#e8303a', 1.4); _l(c, [[24 + tg, -12], [27 + tg, -9]], '#e8303a', 1.4); },
  'Dschungel-Titan': (c, t) => { const s = Math.sin(t * 1.1) * 3;
    _e(c, -6, 17, 6, 4, '#2a2a34'); _e(c, 7, 17, 6, 4, '#2a2a34');
    _e(c, 0, 5, 15, 14, '#3a3a46', '#16161e', 1.8); _e(c, 2, 8, 9, 9, '#5a5a68');
    for (const d of [-1, 1]) { _l(c, [[d * 12, -2], [d * 19, 8 + s * d], [d * 17, 16 + s * d]], '#3a3a46', 7); _e(c, d * 17, 17 + s * d, 5.4, 5, '#2a2a34', '#16161e'); }
    _e(c, 2, -12, 9, 8.6, '#2f2f3a', '#16161e', 1.8); _e(c, 4, -9, 6.6, 5.6, '#7a7a88'); _p(c, [[-3, -17], [10, -17], [9, -13], [-2, -13]], '#222', null);
    _e(c, 1, -11, 2.2, 1.8, '#fff'); _e(c, 8, -11, 2.2, 1.8, '#fff'); _brow(c, 1, -14, 1); _brow(c, 8, -14, -1);
    _l(c, [[1, -6], [4, -4], [7, -6]], '#16161e', 1.6); _p(c, [[2, -5], [3, -3], [4, -5]], '#fff'); _p(c, [[5, -5], [6, -3], [7, -5]], '#fff'); },
  'Sand-Skarabäus': (c, t) => { const s = Math.sin(t * 1.4) * 2;
    for (let i = 0; i < 3; i++) { _l(c, [[-9 + i * 8, 8], [-14 + i * 8 + s, 17]], '#5a3a0a', 2.2); _l(c, [[-6 + i * 8, 8], [-1 + i * 8 - s, 17]], '#5a3a0a', 2.2); }
    _e(c, -1, 2, 17, 13, '#c9a02a', '#5a3a0a', 1.9); _e(c, -1, -1, 14, 8, 'rgba(60,200,170,.45)'); _l(c, [[-1, -11], [-1, 14]], '#5a3a0a', 1.6);
    _e(c, 14, 3, 8, 7, '#8a6a1a', '#3a2606', 1.7); _p(c, [[15, -2], [20, -12], [18, -2]], '#3a2606'); _p(c, [[11, -2], [11, -11], [14, -3]], '#3a2606');
    _e(c, 17, 4, 2.6, 2.2, '#ff4a2a'); _brow(c, 17, 1, -1); _l(c, [[19, 8], [23, 6]], '#3a2606', 2); _l(c, [[19, 10], [23, 12]], '#3a2606', 2); },
  'Sandpharao': (c, t) => { const bob = Math.sin(t * .8) * 1.5;
    _p(c, [[-12, 4], [12, 4], [14, 20], [-14, 20]], '#e8c050', '#8a6a10', 1.8); for (let i = 0; i < 4; i++) _l(c, [[-13 + i * .6, 7 + i * 3.4], [13 - i * .6, 7 + i * 3.4]], i % 2 ? '#2a5ac8' : '#e8c050', 2.2);
    _l(c, [[-8, 8], [8, 14]], '#8a6a10', 3); _l(c, [[8, 8], [-8, 14]], '#8a6a10', 3);
    c.save(); c.translate(0, bob);
    _p(c, [[-12, -22], [12, -22], [15, 4], [-15, 4]], '#e8c050', '#8a6a10', 1.8); for (let i = 0; i < 5; i++) _l(c, [[-13 + i * 1, -18 + i * 5], [13 - i * 1, -18 + i * 5]], '#2a5ac8', 2);
    _e(c, 0, -8, 8.4, 10, '#d9a860', '#8a5a2a', 1.6); _e(c, -3.4, -10, 2.8, 1.6, '#16161e'); _e(c, 3.4, -10, 2.8, 1.6, '#16161e'); _e(c, -3.4, -10, 1, 1, '#ffe04a'); _e(c, 3.4, -10, 1, 1, '#ffe04a'); _l(c, [[-3, -3], [3, -3]], '#8a3a2a', 1.6);
    _p(c, [[-1.8, -17], [1.8, -17], [0, -26]], '#4aa85a', '#1a5a2a', 1.2); _e(c, 0, -24, 2.2, 2.4, '#4aa85a'); c.restore(); },
  'Mammut': (c, t) => { const s = Math.sin(t * 1.1) * 2;
    for (const x of [-10, -3, 6, 12]) _p(c, [[x - 3, 8], [x + 3, 8], [x + 3, 18], [x - 3, 18]], '#6a4630', '#2a1a0e', 1.4);
    _e(c, -2, 3, 17, 13, '#7a5238', '#2a1a0e', 1.8); for (let i = 0; i < 7; i++) _l(c, [[-16 + i * 4.5, 12 + (i % 2) * 2], [-17 + i * 4.5, 17 + (i % 2) * 2]], '#6a4630', 2.2);
    _e(c, 12, 0, 9.4, 9, '#7a5238', '#2a1a0e', 1.8); _e(c, 8, -3, 5.4, 6.6, '#6a4630', '#2a1a0e'); _eye(c, 14, -3, 2, 1); _brow(c, 14, -6, -1);
    _q(c, [20, 3], [26, 12 + s], [20, 18], '#7a5238', 5.4); _q(c, [20, 3], [26, 12 + s], [20, 18], '#2a1a0e', 1);
    c.strokeStyle = '#f4ecd8'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(16, 6); c.bezierCurveTo(12, 20, 22, 22, 26, 12); c.stroke(); },
  'Eiskönigin': (c, t) => { const fl = Math.sin(t * 1.4) * 1.6;
    c.save(); c.shadowColor = '#bfe8ff'; c.shadowBlur = 10;
    _p(c, [[-6, -2], [6, -2], [18, 20], [-18, 20]], '#cfeaff', '#6aa8d8', 1.8); c.restore();
    _l(c, [[-8, 6 + fl], [-12, 20]], '#fff', 1.4); _l(c, [[0, 4], [0, 20]], '#fff', 1.4); _l(c, [[8, 6 - fl], [12, 20]], '#fff', 1.4);
    _q(c, [-7, -12], [-18, -2 + fl], [-13, 14], '#9ad0f4', 4.2); _q(c, [7, -12], [18, -2 - fl], [13, 14], '#9ad0f4', 4.2);
    _e(c, 0, -10, 7, 8, '#f4ecff', '#8aa8d8', 1.5); _e(c, -2.6, -10, 1.6, 2, '#2a6aff'); _e(c, 2.6, -10, 1.6, 2, '#2a6aff'); _l(c, [[-2, -5], [2, -5]], '#c85a8a', 1.4);
    _p(c, [[-7, -16], [-6, -25], [-3, -17], [0, -28], [3, -17], [6, -25], [7, -16]], '#bfe8ff', '#5a98d0', 1.4);
    _l(c, [[14, -4], [14, 18]], '#9a7a5a', 2); _p(c, [[14, -12], [17, -7], [14, -2], [11, -7]], '#7fe0ff', '#2a8ab8', 1.2); },
  'Steingolem': (c, t) => { const s = Math.sin(t * 1.1) * 2;
    _p(c, [[-9, 10], [-2, 10], [-2, 19], [-10, 19]], '#6a6a76', '#2a2a32', 1.6); _p(c, [[2, 10], [9, 10], [10, 19], [2, 19]], '#6a6a76', '#2a2a32', 1.6);
    _p(c, [[-12, -6], [12, -6], [13, 11], [-13, 11]], '#7a7a86', '#2a2a32', 1.9); _p(c, [[-7, -18], [7, -18], [8, -6], [-8, -6]], '#8a8a96', '#2a2a32', 1.9);
    for (const d of [-1, 1]) { _p(c, [[d * 12, -4], [d * 18, -2 + s * d], [d * 18, 10 + s * d], [d * 12, 10]], '#7a7a86', '#2a2a32', 1.6); _p(c, [[d * 17, 10 + s * d], [d * 24, 10 + s * d], [d * 24, 18 + s * d], [d * 17, 18 + s * d]], '#6a6a76', '#2a2a32', 1.6); }
    c.save(); c.shadowColor = '#5af0ff'; c.shadowBlur = 8; _e(c, -3.4, -12, 2.2, 1.8, '#5af0ff'); _e(c, 3.4, -12, 2.2, 1.8, '#5af0ff'); c.restore();
    _l(c, [[-5, 0], [0, 3], [5, 0]], '#5af0ff', 1.6); _l(c, [[-8, -2], [-6, 6]], '#2a2a32', 1.2); _e(c, 8, 5, 3, 2, 'rgba(80,160,60,.6)'); },
  'Donnervogel': (c, t) => { const fl = Math.sin(t * 2) * 7;
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 3, -2); c.lineTo(d * 12, -14 - fl); c.lineTo(d * 16, -8 - fl); c.lineTo(d * 20, -15 - fl); c.lineTo(d * 22, -4 - fl * .6); c.lineTo(d * 18, 2); c.lineTo(d * 20, 8); c.lineTo(d * 10, 4); c.lineTo(d * 6, 10); c.closePath(); c.fillStyle = '#2a4ab8'; c.fill(); c.strokeStyle = '#ffe04a'; c.lineWidth = 1.6; c.stroke(); }
    _p(c, [[-4, 10], [-10, 21], [-5, 17], [-3, 24], [1, 14]], '#ffe04a', '#8a6a00', 1.2);
    _e(c, 0, 3, 10, 12, '#3a5ac8', '#16288a', 1.7); _e(c, 2, 6, 6, 8, '#6a8aff');
    _e(c, 6, -10, 6.6, 6.4, '#3a5ac8', '#16288a', 1.6); _p(c, [[4, -15], [6, -26], [9, -16], [12, -24], [11, -14]], '#ffe04a', '#8a6a00', 1.2);
    _p(c, [[11, -11], [20, -9], [11, -6]], '#ffcf3a', '#8a6a00', 1.3); _eye(c, 7, -11, 2, 1); _brow(c, 7, -14, -1);
    const sp = Math.floor(t * 2) % 3; _l(c, [[-14 + sp * 3, -18], [-11 + sp * 3, -12], [-14 + sp * 3, -11], [-10 + sp * 3, -4]], '#fff08a', 1.4); },
  'Flammenwächter': (c, t) => { const f = Math.sin(t * 2.4) * 2, g = Math.cos(t * 2) * 2;
    c.save(); c.shadowColor = '#ff7a2a'; c.shadowBlur = 10;
    for (const [x, h, k] of [[-8, 16, f], [-3, 22, g], [3, 24, -f], [8, 17, -g]]) { c.beginPath(); c.moveTo(x - 4, -12); c.quadraticCurveTo(x - 3 + k, -12 - h * .6, x + k, -12 - h); c.quadraticCurveTo(x + 3, -12 - h * .5, x + 4, -12); c.closePath(); c.fillStyle = h > 20 ? '#ffd23a' : '#ff6a1a'; c.fill(); } c.restore();
    _e(c, 0, 8, 13, 12, '#7a1a12', '#2a0806', 1.8); _e(c, 0, 9, 7, 8, '#ff7a2a', null); _e(c, 0, 9, 4, 5, '#ffd23a');
    for (const d of [-1, 1]) { _l(c, [[d * 11, 2], [d * 18, 10 + f * d], [d * 17, 16]], '#7a1a12', 6); _e(c, d * 17, 17, 5.4, 5, '#ff7a2a', '#8a2a00'); }
    _e(c, 0, -5, 9, 9, '#8a2218', '#2a0806', 1.8); _p(c, [[-8, -9], [-14, -20], [-4, -12]], '#1a0806'); _p(c, [[8, -9], [14, -20], [4, -12]], '#1a0806');
    c.save(); c.shadowColor = '#ffe04a'; c.shadowBlur = 6; _e(c, -3.4, -6, 2.4, 1.8, '#ffe04a'); _e(c, 3.4, -6, 2.4, 1.8, '#ffe04a'); c.restore();
    _brow(c, -3.4, -9.4, 1); _brow(c, 3.4, -9.4, -1); _l(c, [[-4, -1], [-2, 1], [0, -1], [2, 1], [4, -1]], '#1a0806', 1.6); },
  'Mondverschlinger': (c, t) => {
    c.save(); c.shadowColor = '#ff3b3b'; c.shadowBlur = 10; drawDragon(c, -5, 3, 30, t / 10, 1, '#2a0f3a'); c.restore();
    _e(c, -5, 9, 12, 5.6, 'rgba(255,214,90,.8)'); _e(c, 18, -4, 3.2, 3.2, '#ffe04a'); _e(c, 18, -4, 1.4, 1.4, '#ff3b3b');
    const m = .5 + .5 * Math.sin(t * .9); c.fillStyle = `rgba(255,246,200,${.5 + .4 * m})`; c.beginPath(); c.arc(-5, 10, 3, 0, 7); c.fill(); },
});

Object.assign(CR, {
  // ---------- Himmel ----------
  'Wolkenschaf': (c, t) => { const b = Math.sin(t * 1.4) * 1.2, l = Math.sin(t * 1.6) * 2;
    for (const x of [-8, -2, 5, 11]) _l(c, [[x, 10], [x + (x % 2 ? l : -l), 19]], '#3a4a78', 2.6);
    for (const [x, y, r] of [[-10, 3 + b, 8], [-3, -2 - b, 9], [5, 0 + b, 9], [-1, 7, 9], [10, 5 - b, 7]]) _e(c, x, y, r, r, '#fdfdff', '#9fb0d8', 1.2);
    _e(c, 14, 0, 6.4, 6, '#3a4a78', '#1e284a', 1.4); _e(c, 12, -1, 1.5, 1.7, '#fff'); _e(c, 17, -1, 1.5, 1.7, '#fff'); _e(c, 12.4, -.8, .7, .8, '#101828'); _e(c, 17.4, -.8, .7, .8, '#101828');
    _p(c, [[10, -6], [12, -11], [14, -6]], '#3a4a78'); _l(c, [[13, 3], [16, 3.4]], '#101828', 1.2); },
  'Windgeist': (c, t) => { const s = Math.sin(t * 2.2) * 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(190,225,255,.85)'; c.lineWidth = 3.4;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-18, 6 + k * 3); c.bezierCurveTo(-8, 0 + s + k * 2, 0, 14 - s, 8, 2 + k); c.stroke(); }
    _e(c, 6, 0, 9, 9, 'rgba(235,246,255,.92)', '#9ac4ee', 1.4); _e(c, 3, -2, 1.8, 2.4, '#2a4a8a'); _e(c, 9, -2, 1.8, 2.4, '#2a4a8a'); _e(c, 6, 4, 2.6, 1.6, '#2a4a8a');
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.6; c.beginPath(); c.arc(6, 0, 12 + s * .3, 3.6, 5.2); c.stroke(); },
  'Funkenhüpfer': (c, t) => { const j = Math.abs(Math.sin(t * 1.6));
    _p(c, [[-9, 6], [-17, 2], [-12, 5], [-19, -3], [-10, 3]], '#ffd23a', '#c88a00', 1.2);
    _e(c, 0, 5 - j * 2, 12, 11 + j, '#ffe04a', '#c89a00', 1.6); _e(c, 2, 8 - j * 2, 7, 6, '#fff3a8');
    _eye(c, 4, 2, 3, 1); _eye(c, 10, 2, 3, 1); _l(c, [[4, 9], [8, 11], [12, 9]], '#7a4a00', 1.5);
    for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; _l(c, [[Math.cos(a) * 13, 4 + Math.sin(a) * 12], [Math.cos(a) * 17 + 2, 4 + Math.sin(a) * 16 - 3]], '#fff6a0', 1.4); } },
  'Wolken-Wächter': (c, t) => { const b = Math.sin(t * .8) * 1.5;
    for (const [x, y, r] of [[-12, 10, 8], [-4, 12, 9], [6, 12, 9], [13, 9, 7]]) _e(c, x, y, r, r * .8, '#e8f0ff', '#9fb0d8', 1.4);
    _p(c, [[-9, -4 + b], [9, -4 + b], [11, 10], [-11, 10]], '#aab8d8', '#4a5a88', 1.8);
    _e(c, 0, -10 + b, 8, 8.4, '#c8d4ec', '#4a5a88', 1.7); _p(c, [[-6, -11 + b], [6, -11 + b], [5, -6 + b], [-5, -6 + b]], '#1a2040'); _l(c, [[-4, -9 + b], [4, -9 + b]], '#7fe0ff', 1.8);
    _p(c, [[-1, -18 + b], [1, -18 + b], [3, -24 + b], [-3, -24 + b]], '#ff6a6a', '#8a2a2a', 1);
    _e(c, -15, 2, 6, 8, '#4a6ad8', '#1e2a68', 1.6); _p(c, [[-15, -3], [-12, 2], [-15, 7], [-18, 2]], '#ffe06a');
    _l(c, [[13, -14], [13, 16]], '#8a7a5a', 2); _p(c, [[13, -20], [16, -14], [10, -14]], '#e8eef8', '#4a5a88', 1.2); },
  'Schwarm6': (c, t) => { const s = Math.sin(t * 2) * 2;
    for (const [x, y, r] of [[-6, 2 + s, 5], [5, -3 - s, 4], [2, 8, 3.4]]) { c.save(); c.translate(x, y); c.rotate(t * .8 + x); _p(c, [[0, -r], [r * .35, -r * .35], [r, 0], [r * .35, r * .35], [0, r], [-r * .35, r * .35], [-r, 0], [-r * .35, -r * .35]], '#ffe66a', '#c89a00', .8); c.restore(); } },
});

const CR_ALIAS = { 'Schwarm': 'Schwarm' };
function crKey(t, wi) { return t.b === 'swarm' ? 'Schwarm' + wi : t.n; }
function drawCreature(c, name, x, y, s, face, t, o) {
  const f = CR[name]; if (!f) return false;
  c.save(); c.translate(x, y); c.scale((face || 1) * s / 40, s / 40); c.lineJoin = c.lineCap = 'round';
  if (o && o.hurt) c.globalAlpha *= .5;
  f(c, t || 0, o || {}); c.restore(); return true;
}
