// Level-Editor: eigene Level malen, testen und per Code oder Link teilen. Gespielt werden sie mit der normalen Run-Klasse (opts.custom).
const ED_ROWS = ROWS, ED_S = 24;
const ED_TOOLS = [['ground', '⛰️ Boden'], ['block', '🧱 Block'], ['plat', '🪵 Plattform'], ['spike', '▲ Stacheln'], ['coin', '🪙 Münze'], ['shard', '🌙 Splitter'], ['e0', '👾 Gegner 1'], ['e1', '👾 Gegner 2'], ['e2', '👾 Gegner 3'], ['flag', '🏁 Ziel'], ['erase', '🧽 Radierer']];
let ED = null;

function edNew() {
  const g = []; for (let y = 0; y < ED_ROWS; y++) g.push((y >= 14 ? '1' : '0').repeat(80));
  return { w: 0, kind: 'day', cols: 80, g, objs: [], en: [], flag: null };
}
const edRows = d => d.g.map(r => r.padEnd(d.cols, '0').slice(0, d.cols));

// Gespeicherten Entwurf oder neuen laden
function editor(from) {
  show('ui'); if (!ED) ED = { d: (save.editor && save.editor.cols ? save.editor : edNew()), tool: 'ground', share: false, from: from || 'title' };
  if (from) ED.from = from; save.editor = ED.d;
  const d = ED.d;
  ui.innerHTML = `<div class=hd><h2>🛠️ Level-Editor</h2><button class=d onclick="edExit()">Zurück</button></div>
  <div class=card><div class=tabs>${ED_TOOLS.map(t => `<button class="${t[0] === ED.tool ? 'on' : 'd'}" onclick="edTool('${t[0]}')">${t[1]}</button>`).join('')}</div>
  <div id=edwrap style="overflow-x:auto;border-radius:14px;border:1px solid #ffffff40"><canvas id=edc width="${d.cols * ED_S}" height="${ED_ROWS * ED_S}" style="display:block;touch-action:none"></canvas></div>
  <label>Scrollen</label><input type=range id=edscroll min=0 max=100 value=0 oninput="edScroll(this.value)">
  <div class=row><button class=g onclick="edTest()">▶ Testen</button><button onclick="edShare()">📤 Teilen</button><button class=d onclick="edClear()">🗑️ Leeren</button></div></div>
  <div class=card><h3>Aussehen &amp; Länge</h3><div class=row><button class=d onclick="edWorld(-1)">◀</button><b>${W[d.w].emoji} ${W[d.w].name}</b><button class=d onclick="edWorld(1)">▶</button>
  ${['day', 'dusk', 'night'].map(k => `<button class="${d.kind === k ? 'on' : 'd'}" onclick="edKind('${k}')">${{ day: '☀️ Tag', dusk: '🌇 Dämmerung', night: '🌙 Nacht' }[k]}</button>`).join('')}</div>
  <label>Länge: ${d.cols} Spalten</label><input type=range min=40 max=140 step=10 value="${d.cols}" onchange="edCols(+this.value)"></div>
  ${ED.share ? edShareCard() : ''}`;
  const cv = $('#edc'); ED.cv = cv; edDraw();
  let down = false;
  const hit = e => { const r = cv.getBoundingClientRect(), c = Math.floor((e.clientX - r.left) / ED_S), y = Math.floor((e.clientY - r.top) / ED_S); if (c >= 0 && c < d.cols && y >= 0 && y < ED_ROWS) { edApply(c, y); edDraw(); } };
  cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); hit(e); });
  cv.addEventListener('pointermove', e => { if (down && !/^(coin|shard|e\d|flag)$/.test(ED.tool)) hit(e); });
  cv.addEventListener('pointerup', () => { down = false; persist(); });
}
function edExit() { const f = ED.from; ED = null; if (f === 'map') map(); else showTitle(); }
function edTool(t) { ED.tool = t; editor(); }
function edScroll(v) { const w = $('#edwrap'); w.scrollLeft = (w.scrollWidth - w.clientWidth) * v / 100; }
function edWorld(dw) { const d = ED.d; d.w = (d.w + dw + W.length) % W.length; d.en = d.en.filter(e => e.t < 3); editor(); }
function edKind(k) { ED.d.kind = k; editor(); }
function edCols(n) { const d = ED.d; d.cols = n; d.g = edRows(d); d.objs = d.objs.filter(o => o.c < n); d.en = d.en.filter(o => o.c < n); if (d.flag && d.flag.c >= n) d.flag = null; editor(); }
function edClear() { if (confirm('Das ganze Level leeren?')) { const w = ED.d.w; ED.d = edNew(); ED.d.w = w; editor(); } }

function edApply(c, r) {
  const d = ED.d, t = ED.tool, rows = d.g.map(s => s.split(''));
  const setT = (y, v) => { rows[y][c] = String(v); };
  const rm = () => { d.objs = d.objs.filter(o => !(o.c === c && o.r === r)); d.en = d.en.filter(o => !(o.c === c && o.r === r)); if (d.flag && d.flag.c === c && d.flag.r === r) d.flag = null; };
  if (t === 'ground') for (let y = r; y < ED_ROWS; y++) setT(y, 1);
  else if (t === 'block') setT(r, 1); else if (t === 'plat') setT(r, 3); else if (t === 'spike') setT(r, 2);
  else if (t === 'erase') { setT(r, 0); rm(); }
  else if (t === 'coin' || t === 'shard') { rm(); d.objs.push({ k: t === 'coin' ? 'o' : 's', c, r }); }
  else if (/^e\d$/.test(t)) { rm(); d.en.push({ t: +t[1], c, r }); }
  else if (t === 'flag') d.flag = { c, r };
  d.g = rows.map(a => a.join(''));
}

function edDraw() {
  const cv = ED.cv, c = cv.getContext('2d'), d = ED.d, S = ED_S, sky = skyFor(d.w, d.kind) || W[d.w].sky, pal = PALS[d.w][0], rows = d.g;
  const bg = c.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, sky[0]); bg.addColorStop(1, sky[1]); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < ED_ROWS; y++) for (let x = 0; x < d.cols; x++) {
    const v = +rows[y][x] || 0, px = x * S, py = y * S;
    if (v === 1) { c.fillStyle = pal.dirt; c.fillRect(px, py, S, S); if (!(y > 0 && rows[y - 1][x] === '1')) { c.fillStyle = pal.top; c.fillRect(px, py, S, 7); } }
    else if (v === 3) { c.fillStyle = PLAT[d.w][0]; c.fillRect(px + 1, py + 1, S - 2, S - 2); c.fillStyle = PLAT[d.w][1]; c.fillRect(px + 1, py + 1, S - 2, 6); }
    else if (v === 2) { c.fillStyle = '#d8dce8'; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(px + k * 12, py + S); c.lineTo(px + k * 12 + 6, py + S / 2); c.lineTo(px + k * 12 + 12, py + S); c.fill(); } }
  }
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; c.beginPath(); for (let x = 0; x <= d.cols; x++) { c.moveTo(x * S + .5, 0); c.lineTo(x * S + .5, cv.height); } for (let y = 0; y <= ED_ROWS; y++) { c.moveTo(0, y * S + .5); c.lineTo(cv.width, y * S + .5); } c.stroke();
  for (const o of d.objs) drawEm(c, o.k === 'o' ? '🪙' : '🌙', o.c * S + S / 2, o.r * S + S / 2, 18);
  for (const e of d.en) drawEm(c, W[d.w].enemies[e.t].e, e.c * S + S / 2, e.r * S + S / 2, 20);
  if (d.flag) drawEm(c, '🏁', d.flag.c * S + S / 2, d.flag.r * S + S / 2, 22);
  drawEm(c, '🐱', 2 * S + S / 2, 13 * S + S / 2, 20); c.fillStyle = 'rgba(255,255,255,.7)'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillText('Start', 2 * S + S / 2, 12 * S + 8);
}

// ---------- Teilen: kompakter Code, auch als Link ----------
function edEncode(d) {
  const L = 'abcd', rle = d.g.map(r => r.replace(/(.)\1*/g, (m, ch) => L[+ch] + m.length)).join('|');
  const o = { v: 1, w: d.w, k: d.kind, c: d.cols, g: rle, o: d.objs.map(x => [x.k, x.c, x.r].join(',')).join(';'), e: d.en.map(x => [x.t, x.c, x.r].join(',')).join(';'), f: d.flag ? d.flag.c + ',' + d.flag.r : '' };
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function edDecode(code) {
  const o = JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/-/g, '+').replace(/_/g, '/')))));
  if (o.v !== 1 || !(o.c >= 40 && o.c <= 140) || o.w < 0 || o.w >= W.length) throw new Error('Ungültiger Level-Code');
  const g = o.g.split('|').map(r => { let s = ''; r.replace(/([a-d])(\d+)/g, (m, l, n) => { s += String('abcd'.indexOf(l)).repeat(+n); }); return s.padEnd(o.c, '0').slice(0, o.c); });
  if (g.length !== ED_ROWS) throw new Error('Ungültiger Level-Code');
  const nums = s => s.split(',').map(Number);
  return { w: o.w, kind: ['day', 'dusk', 'night'].includes(o.k) ? o.k : 'day', cols: o.c, g,
    objs: o.o ? o.o.split(';').map(s => { const [k, c, r] = s.split(','); return { k: k === 'o' ? 'o' : 's', c: +c, r: +r }; }) : [],
    en: o.e ? o.e.split(';').map(s => { const [t, c, r] = nums(s); return { t: Math.max(0, Math.min(2, t)), c, r }; }) : [], flag: o.f ? (([c, r]) => ({ c, r }))(nums(o.f)) : null };
}
const edLink = d => location.origin + location.pathname + '?lvl=' + edEncode(d);
function edShareCard() {
  return `<div class=card><h3>📤 Level teilen</h3><small>Schick den Link an Freunde. Sie öffnen ihn und können dein Level sofort spielen.</small>
  <textarea id=edcode readonly rows=3>${edLink(ED.d)}</textarea><div class=row><button onclick="edCopy()">📋 Link kopieren</button></div>
  <h3>📥 Level laden</h3><textarea id=edin rows=3 placeholder="Code oder Link hier einfügen"></textarea><div class=row><button class=g onclick="edImport()">Laden</button></div></div>`;
}
function edShare() { ED.share = !ED.share; editor(); }
function edCopy() { const t = $('#edcode').value; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('📋 Link kopiert'), () => { $('#edcode').select(); toast('Markiert – jetzt kopieren'); }); }
function edImport() {
  try { let v = $('#edin').value.trim(); if (v.includes('lvl=')) v = v.split('lvl=')[1].split('&')[0]; ED.d = edDecode(v); save.editor = ED.d; persist(); toast('✅ Level geladen'); editor(); }
  catch (e) { toast('⚠️ ' + (e.message || 'Code ungültig')); }
}
function edTest() { const d = ED.d; save.editor = d; persist(); playCustom(d, 'editor'); }

// ---------- Custom-Level fuer die Run-Klasse ----------
function customLevel(d) {
  const cols = d.cols, g = [];
  for (let y = 0; y < ROWS; y++) { const row = new Uint8Array(cols), s = d.g[y] || ''; for (let c = 0; c < cols; c++) row[c] = +s[c] || 0; g.push(row); }
  for (let c = 0; c < 8; c++) if (!g.some(r => r[c] === 1)) for (let y = 14; y < ROWS; y++) g[y][c] = 1; // Start immer auf festem Boden
  const top = []; for (let c = 0; c < cols; c++) { let y = -1; for (let r = 0; r < ROWS; r++) if (g[r][c] === 1) { y = r; break; } top.push(y); }
  const spots = []; for (let c = 0; c < cols;) { if (top[c] < 0) { c++; continue; } let e = c; while (e < cols && top[e] === top[c]) e++; spots.push({ x0: c, x1: e, y: top[c] }); c = e; }
  const sp = Object.assign({}, levelSpec(d.w, 3), { name: 'Eigenes Level', kind: d.kind, sky: skyFor(d.w, d.kind), style: 'plain', mods: [], weather: 'none', wind: 0, act: 0, actName: 'Eigenes Level' });
  const fc = d.flag ? d.flag.c : cols - 5, fr = d.flag ? d.flag.r : (spots[spots.length - 1] || { y: 14 }).y - 1;
  return { g, cols, spots, gaps: [], sp, springs: [], movers: [], fire: [], doors: [], cps: [], gate: null, keyPos: null, moonPos: null, secret: null, flagX: fc * TS, flagY: (fr + 1) * TS };
}
