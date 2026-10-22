// Selbstgezeichnete Katzen: Luna = weiss mit orangen Flecken, Minsch = ganz weiss, Chey = schwarz. Kein Emoji, skalierbar.
const PAL = {
  luna: { k: 'luna', body: '#ffffff', edge: '#b9c6e6', inner: '#ffb3c6', eye: '#3b9cff', acc: '#ffd54a', patch: '#f39a3a' },
  minsch: { k: 'minsch', body: '#ffffff', edge: '#aebde0', inner: '#ffc0d0', eye: '#38c9a4', acc: '#6cb8ff' },
  chey: { k: 'chey', body: '#2b2b38', edge: '#0e0e16', inner: '#c46a8a', eye: '#ffd23a', acc: '#ff5d8f', whisk: '#9aa0b8' },
  kuro: { k: 'kuro', body: '#4a4a5a', edge: '#1e1e28', inner: '#d08a9a', eye: '#7cff9a', acc: '#e8453c', whisk: '#b0b6c8', stripe: '#2a2a36' },
  mama: { k: 'mama', body: '#fffdf8', edge: '#c8c0d8', inner: '#ffc0d0', eye: '#8a6cff', acc: '#ff8fb8', pearl: '#f6f2ff' },
};
// Spielbare Charaktere (Werte in level.js: charStats)
const CHAR = {
  luna: { n: 'Luna', d: 'Ausgewogen – weiß mit orangen Flecken' },
  minsch: { n: 'Minsch', d: 'Schneller und springt von Wänden ab' },
  chey: { n: 'Chey', d: 'Dash von Anfang an, sieht im Dunkeln weiter' },
  kuro: { n: 'Kuro', d: 'Grau getigert – Doppelsprung von Anfang an' },
  mama: { n: 'Mama-Kitty', d: 'Weiß mit Perlen – +1 Herz und heilt langsam' },
};
const selPal = () => PAL[(typeof save !== 'undefined' && save.chars && save.chars.p1) || 'luna'];

function drawCat(c, x, y, s, face, t, o, pal) {
  o = o || {}; pal = pal || PAL.luna; face = face || 1;
  let eq = null;
  if ((pal.k === 'luna' || o.cos) && !o.nolook && typeof save !== 'undefined' && save.cos) { eq = save.cos.eq; const cc = pal.k === 'luna' && eq.color && COS.find(x => x.id === eq.color); if (cc) pal = { ...pal, body: cc.c, edge: cc.edge, patch: null }; }
  c.save(); c.translate(x, y); c.scale(face * s / 40, s / 40);
  const run = o.run, air = o.air, sw = Math.sin(t * .7), l = run ? Math.sin(t * 1.6) * 5 : 0;
  if (run) c.translate(0, -Math.abs(Math.sin(t * 1.6)) * 1.8);
  c.lineJoin = c.lineCap = 'round';
  // Schwanz
  c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(-28, 4, -23, -14 + sw * 4);
  c.lineWidth = 7; c.strokeStyle = pal.edge; c.stroke(); c.lineWidth = 4; c.strokeStyle = pal.body; c.stroke();
  if (pal.patch) { c.fillStyle = pal.patch; c.beginPath(); c.arc(-23, -14 + sw * 4, 3.6, 0, 7); c.fill(); }
  c.lineWidth = 2; c.strokeStyle = pal.edge; c.fillStyle = pal.body;
  const leg = (lx, ly) => { c.beginPath(); c.ellipse(lx, ly, 4, air ? 4 : 5.5, 0, 0, 7); c.fill(); c.stroke(); };
  leg(-9 - l * .7 - (air ? 4 : 0), 15 - (air ? 3 : 0)); leg(9 + l * .7 + (air ? 4 : 0), 15 - (air ? 3 : 0));
  c.beginPath(); c.ellipse(0, 5, 15, 11, 0, 0, 7); c.fill(); c.stroke();
  if (pal.patch) { c.save(); c.beginPath(); c.ellipse(0, 5, 14, 10, 0, 0, 7); c.clip(); c.fillStyle = pal.patch; c.beginPath(); c.ellipse(-6, 0, 8, 6, .3, 0, 7); c.fill(); c.beginPath(); c.ellipse(9, 12, 5, 4, 0, 0, 7); c.fill(); c.restore(); c.lineWidth = 2; c.strokeStyle = pal.edge; c.fillStyle = pal.body; }
  if (pal.stripe) { c.save(); c.beginPath(); c.ellipse(0, 5, 14, 10, 0, 0, 7); c.clip(); c.strokeStyle = pal.stripe; c.lineWidth = 2.6; for (const sx of [-9, -4, 1, 6]) { c.beginPath(); c.moveTo(sx, -6); c.quadraticCurveTo(sx + 2, 2, sx - 1, 8); c.stroke(); } c.restore(); c.lineWidth = 2; c.strokeStyle = pal.edge; c.fillStyle = pal.body; }
  leg(-3 + l, 15 - (air ? 3 : 0)); leg(4 - l, 15 - (air ? 3 : 0));
  // Ohren
  for (const [a, b, d, e, f, g] of [[3, -15, 5, -28, 13, -16], [10, -16, 18, -28, 21, -12]]) {
    c.fillStyle = pal.patch && a === 3 ? pal.patch : pal.body; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineTo(f, g); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = pal.inner; c.beginPath(); c.moveTo((a + f) / 2 - 1, (b + g) / 2); c.lineTo(d + (f - a) * .1, e + 6); c.lineTo((a + f) / 2 + 3, (b + g) / 2); c.closePath(); c.fill();
  }
  // Kopf
  c.fillStyle = pal.body; c.beginPath(); c.ellipse(11, -7, 11.5, 10, 0, 0, 7); c.fill(); c.stroke();
  if (pal.patch) { c.save(); c.beginPath(); c.ellipse(11, -7, 10.5, 9, 0, 0, 7); c.clip(); c.fillStyle = pal.patch; c.beginPath(); c.ellipse(3.5, -13, 7.5, 6, .2, 0, 7); c.fill(); c.restore(); c.lineWidth = 2; c.strokeStyle = pal.edge; }
  if (pal.stripe) { c.strokeStyle = pal.stripe; c.lineWidth = 1.6; for (const sx of [8, 11, 14]) { c.beginPath(); c.moveTo(sx, -16.5); c.lineTo(sx + (sx - 11) * .2, -12.5); c.stroke(); } c.lineWidth = 2; c.strokeStyle = pal.edge; }
  for (const ex of [7, 15]) {
    c.fillStyle = pal.eye; c.beginPath(); c.ellipse(ex, -8, 2.4, 3.2, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + .8, -9.4, .9, 0, 7); c.fill();
  }
  c.fillStyle = '#ff8fa8'; c.beginPath(); c.moveTo(10.5, -3.5); c.lineTo(14.5, -3.5); c.lineTo(12.5, -1); c.closePath(); c.fill();
  c.lineWidth = 1; c.strokeStyle = pal.whisk || pal.edge; c.beginPath(); c.moveTo(20, -4); c.lineTo(28, -7); c.moveTo(20, -2); c.lineTo(28, -1); c.stroke();
  c.lineWidth = 2;
  if (pal.k === 'luna') { c.fillStyle = pal.acc; c.strokeStyle = '#e0a800'; c.beginPath(); c.arc(4, 4, 3.2, 0, 7); c.fill(); c.stroke(); }
  else if (pal.k === 'kuro') { c.fillStyle = pal.acc; c.beginPath(); c.moveTo(1, 1); c.quadraticCurveTo(7, 7, 14, 2); c.lineTo(9, 9); c.lineTo(5, 6); c.closePath(); c.fill(); }
  else if (pal.k === 'mama') { // Perlenkette, Schleife am Ohr, Wimpern
    for (let i = 0; i < 7; i++) { const a = .35 + i * .34; c.fillStyle = pal.pearl; c.strokeStyle = '#b8b0d0'; c.lineWidth = .7; c.beginPath(); c.arc(7 + Math.cos(a) * 7, -1 + Math.sin(a) * 4.4, 1.5, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = pal.acc; c.beginPath(); c.moveTo(17, -19); c.lineTo(13, -23); c.lineTo(13, -16); c.closePath(); c.moveTo(17, -19); c.lineTo(21, -23); c.lineTo(21, -16); c.closePath(); c.fill();
    c.strokeStyle = '#3a2a4a'; c.lineWidth = .9; for (const ex of [7, 15]) { c.beginPath(); c.moveTo(ex - 2.2, -11); c.lineTo(ex - 3.6, -12.6); c.moveTo(ex - .6, -11.6); c.lineTo(ex - 1, -13.4); c.stroke(); }
  }
  else if (pal.k === 'minsch') { c.strokeStyle = pal.acc; c.lineWidth = 4.2; c.beginPath(); c.moveTo(1.5, 1); c.quadraticCurveTo(6, 7, 13, 3); c.stroke(); c.fillStyle = pal.acc; c.beginPath(); c.moveTo(4, 5); c.lineTo(1, 11); c.lineTo(7, 9); c.closePath(); c.fill(); }
  else { c.fillStyle = pal.acc; c.beginPath(); c.moveTo(11, -17); c.lineTo(4, -22); c.lineTo(4, -13); c.closePath(); c.moveTo(11, -17); c.lineTo(18, -22); c.lineTo(18, -13); c.closePath(); c.fill(); }
  if (eq) drawLook(c, eq);
  c.restore();
}

const _imgCache = {};
function catImg(who, size) {
  const key = who + size + (who === 'luna' && typeof lookSig === 'function' ? lookSig() : '');
  if (!_imgCache[key]) {
    const cn = document.createElement('canvas'); cn.width = cn.height = size * 2;
    const c = cn.getContext('2d'); drawCat(c, size * 1.0, size * 1.05, size * 1.6, 1, 0, {}, PAL[who]);
    _imgCache[key] = cn.toDataURL();
  }
  return `<img src="${_imgCache[key]}" width="${size}" height="${size}" style="vertical-align:middle">`;
}
