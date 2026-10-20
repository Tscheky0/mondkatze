// Selbstgezeichnete Katzen (Luna = weiss, Chey = rotes Kätzchen). Kein Emoji, skalierbar.
const PAL = {
  luna: { k: 'luna', body: '#ffffff', edge: '#b9c6e6', inner: '#ffb3c6', eye: '#3b9cff', acc: '#ffd54a' },
  chey: { k: 'chey', body: '#f4a53c', edge: '#c4741a', inner: '#ffd9a8', eye: '#2d2a26', acc: '#ff5d8f' },
};

function drawCat(c, x, y, s, face, t, o, pal) {
  o = o || {}; pal = pal || PAL.luna; face = face || 1;
  let eq = null;
  if (pal.k === 'luna' && !o.nolook && typeof save !== 'undefined' && save.cos) { eq = save.cos.eq; const cc = eq.color && COS.find(x => x.id === eq.color); if (cc) pal = { ...pal, body: cc.c, edge: cc.edge }; }
  c.save(); c.translate(x, y); c.scale(face * s / 40, s / 40);
  const run = o.run, air = o.air, sw = Math.sin(t * .7), l = run ? Math.sin(t * 1.6) * 5 : 0;
  if (run) c.translate(0, -Math.abs(Math.sin(t * 1.6)) * 1.8);
  c.lineJoin = c.lineCap = 'round';
  // Schwanz
  c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(-28, 4, -23, -14 + sw * 4);
  c.lineWidth = 7; c.strokeStyle = pal.edge; c.stroke(); c.lineWidth = 4; c.strokeStyle = pal.body; c.stroke();
  c.lineWidth = 2; c.strokeStyle = pal.edge; c.fillStyle = pal.body;
  const leg = (lx, ly) => { c.beginPath(); c.ellipse(lx, ly, 4, air ? 4 : 5.5, 0, 0, 7); c.fill(); c.stroke(); };
  leg(-9 - l * .7 - (air ? 4 : 0), 15 - (air ? 3 : 0)); leg(9 + l * .7 + (air ? 4 : 0), 15 - (air ? 3 : 0));
  c.beginPath(); c.ellipse(0, 5, 15, 11, 0, 0, 7); c.fill(); c.stroke();
  leg(-3 + l, 15 - (air ? 3 : 0)); leg(4 - l, 15 - (air ? 3 : 0));
  // Ohren
  for (const [a, b, d, e, f, g] of [[3, -15, 5, -28, 13, -16], [10, -16, 18, -28, 21, -12]]) {
    c.fillStyle = pal.body; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineTo(f, g); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = pal.inner; c.beginPath(); c.moveTo((a + f) / 2 - 1, (b + g) / 2); c.lineTo(d + (f - a) * .1, e + 6); c.lineTo((a + f) / 2 + 3, (b + g) / 2); c.closePath(); c.fill();
  }
  // Kopf
  c.fillStyle = pal.body; c.beginPath(); c.ellipse(11, -7, 11.5, 10, 0, 0, 7); c.fill(); c.stroke();
  for (const ex of [7, 15]) {
    c.fillStyle = pal.eye; c.beginPath(); c.ellipse(ex, -8, 2.4, 3.2, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + .8, -9.4, .9, 0, 7); c.fill();
  }
  c.fillStyle = '#ff8fa8'; c.beginPath(); c.moveTo(10.5, -3.5); c.lineTo(14.5, -3.5); c.lineTo(12.5, -1); c.closePath(); c.fill();
  c.lineWidth = 1; c.strokeStyle = pal.edge; c.beginPath(); c.moveTo(20, -4); c.lineTo(28, -7); c.moveTo(20, -2); c.lineTo(28, -1); c.stroke();
  c.lineWidth = 2;
  if (pal.k === 'luna') { c.fillStyle = pal.acc; c.strokeStyle = '#e0a800'; c.beginPath(); c.arc(4, 4, 3.2, 0, 7); c.fill(); c.stroke(); }
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
