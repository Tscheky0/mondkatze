// Kulisse (Parallax), Wetter und Drache. Genutzt von level.js und cine.js.
const SKYS = { day: null, dawn: ['#ff9a8b', '#ffe3b3'], dusk: ['#4b3a8f', '#ff9a6b'], night: ['#0b1033', '#2b2f7a'], storm: ['#59606e', '#aab0bd'] };
const SKYS_LAVA = { day: ['#5a1a1a', '#ff8a3d'], dawn: ['#7a2a1a', '#ffb060'], dusk: ['#2a0a0a', '#c4401a'], night: ['#120505', '#4a1010'], storm: ['#2a2020', '#7a3a2a'] };
const skyFor = (wi, kind) => (wi === 5 ? SKYS_LAVA[kind] : SKYS[kind]) || W[wi].sky;
const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; };
// Glas-Panel fuer Canvas-UI (HUD, Banner): Blur-freie Optik mit Verlauf, Glanzkante und Schatten.
function glassRect(c, x, y, w, h, r, tint) {
  c.save();
  c.shadowColor = 'rgba(10,2,32,.45)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = tint || 'rgba(26,14,58,.55)'; c.fill();
  c.shadowColor = 'transparent';
  const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(.5, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,.12)');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.42)'; c.stroke();
  c.beginPath(); c.roundRect(x + 3, y + 2, w - 6, h * .42, Math.max(2, r - 3)); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
  c.restore();
}
// Hex-Farbe um f aufhellen (f>0) oder abdunkeln (f<0)
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), m = f < 0 ? 0 : 255, a = Math.abs(f);
  const ch = v => Math.round(v + (m - v) * a);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
const EMF = s => s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

function drawScenery(c, wi, sp, cam, t, VWd, VHt) {
  const gr = c.createLinearGradient(0, 0, 0, VHt); gr.addColorStop(0, sp.sky[0]); gr.addColorStop(1, sp.sky[1]);
  c.fillStyle = gr; c.fillRect(0, 0, VWd, VHt);
  if (sp.kind === 'night') {
    for (let i = 0; i < 55; i++) { c.fillStyle = `rgba(255,255,255,${.35 + .5 * Math.sin(t * 2 + i)})`; c.fillRect((i * 149) % VWd, (i * 83) % (VHt * .6), 2, 2); }
    c.shadowColor = '#fff8c0'; c.shadowBlur = 30; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(VWd * .8, 90, 32, 0, 7); c.fill(); c.shadowBlur = 0;
  } else if (sp.kind === 'dawn' || sp.kind === 'dusk') { c.fillStyle = 'rgba(255,200,120,.9)'; c.beginPath(); c.arc(VWd * .25, VHt * .6, 46, 0, 7); c.fill(); }
  else if (sp.kind === 'day') { c.fillStyle = wi === 5 ? '#ff6a3a' : '#fff2a0'; c.beginPath(); c.arc(VWd * .8, 80, 36, 0, 7); c.fill(); }
  if (sp.kind !== 'night' && sp.kind !== 'storm') {
    const sx = sp.kind === 'day' ? VWd * .8 : VWd * .25, sy = sp.kind === 'day' ? 80 : VHt * .6;
    c.fillStyle = wi === 5 ? 'rgba(255,150,80,.08)' : 'rgba(255,245,190,.08)';
    for (let i = 0; i < 6; i++) { const a = .35 + i * .42 + Math.sin(t * .2 + i) * .06; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 1500, sy + Math.sin(a) * 1500); c.lineTo(sx + Math.cos(a + .13) * 1500, sy + Math.sin(a + .13) * 1500); c.fill(); }
  }
  // ferne Gipfel + Wolken (Parallax) fuer mehr Tiefe
  { const night = sp.kind === 'night', cl = wi === 5 ? 'rgba(90,30,20,' : night ? 'rgba(120,130,200,' : 'rgba(255,255,255,';
    c.fillStyle = wi === 5 ? 'rgba(60,15,10,.55)' : night ? 'rgba(20,20,70,.5)' : 'rgba(110,100,170,.28)'; c.beginPath(); c.moveTo(0, VHt);
    for (let x = 0; x <= VWd; x += 20) { const u = (x + cam * .08) * .011 + sp.ph; c.lineTo(x, VHt - 250 - Math.abs(Math.sin(u) + Math.sin(u * 2.3) * .5) * 110); }
    c.lineTo(VWd, VHt); c.fill();
    if (wi === 3 || wi === 4) { c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x <= VWd; x += 20) { const u = (x + cam * .08) * .011 + sp.ph, hgt = Math.abs(Math.sin(u) + Math.sin(u * 2.3) * .5) * 110; if (hgt > 95) { c.beginPath(); c.moveTo(x - 10, VHt - 250 - hgt + 22); c.lineTo(x, VHt - 250 - hgt); c.lineTo(x + 10, VHt - 250 - hgt + 22); c.fill(); } } }
    if (sp.kind !== 'storm') for (let i = 0; i < 6; i++) {
      const w = 90 + (i * 37) % 70, x = ((i * 241 - cam * (.05 + (i % 3) * .03) + t * (4 + i)) % (VWd + 300) + VWd + 300) % (VWd + 300) - 150, y = 50 + (i * 53) % 150;
      c.fillStyle = cl + (night ? '.12)' : '.5)'); c.beginPath(); c.ellipse(x, y, w, 22, 0, 0, 7); c.moveTo(x + w * 1, y - 12); c.ellipse(x + w * .45, y - 12, w * .55, 20, 0, 0, 7); c.moveTo(x + w * .05, y - 6); c.ellipse(x - w * .4, y - 6, w * .45, 16, 0, 0, 7); c.fill();
    }
  }
  c.fillStyle = sp.pal.hill;
  for (let L = -1; L < 2; L++) {
    c.globalAlpha = L < 0 ? .18 : .35 + L * .25; c.beginPath(); c.moveTo(0, VHt);
    const f = L > 0 ? sp.f2 : sp.f1, a = L > 0 ? sp.a2 : sp.a1;
    for (let x = 0; x <= VWd; x += 24) c.lineTo(x, VHt - 150 - L * 50 - (L < 0 ? 40 : 0) - (Math.sin((x + cam * Math.max(.06, .2 + L * .2)) * f + sp.ph + L * 2 + (L < 0 ? 5 : 0)) + Math.sin((x + cam * .2) * f * 2.3 + L)) * a * .6);
    c.lineTo(VWd, VHt); c.fill();
  }
  { const hz = c.createLinearGradient(0, VHt - 300, 0, VHt - 90), rr = [1, 3, 5].map(i => parseInt(sp.sky[1].slice(i, i + 2), 16)); hz.addColorStop(0, `rgba(${rr},0)`); hz.addColorStop(1, `rgba(${rr},.3)`); c.globalAlpha = 1; c.fillStyle = hz; c.fillRect(0, VHt - 300, VWd, 210); }
  c.globalAlpha = 1; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
  const gap = sp.gap, off = cam * .5, i0 = Math.floor(off / gap) - 1;
  for (let i = i0; i < i0 + Math.ceil(VWd / gap) + 3; i++) {
    const hh = hash(i * 31 + wi * 7 + sp.li * 3), sz = (62 + hh % 50) * sp.sc;
    c.font = EMF(sz); c.fillText(sp.objs[(hh >>> 3) % sp.objs.length], i * gap - off + hh % 60, VHt - 92 - sz * .42 + hh % 14);
  }
  if (sp.kind === 'night' || sp.kind === 'storm' || sp.kind === 'dusk') { c.fillStyle = sp.kind === 'dusk' ? 'rgba(40,10,60,.18)' : 'rgba(10,10,50,.3)'; c.fillRect(0, 0, VWd, VHt); }
}

function drawWeather(c, type, t, VWd, VHt) {
  if (!type || type === 'none') return;
  c.save();
  if (type === 'rain') { c.strokeStyle = 'rgba(200,220,255,.5)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 80; i++) { const x = (i * 97 + t * 120) % (VWd + 60) - 30, y = (i * 53 + t * 720) % VHt; c.moveTo(x, y); c.lineTo(x - 5, y + 16); } c.stroke(); }
  else if (type === 'snow') { c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 25 + Math.sin(t + i) * 20) % VWd, y = (i * 53 + t * 70) % VHt; c.beginPath(); c.arc(x, y, 1.5 + i % 3, 0, 7); c.fill(); } }
  else if (type === 'sand') { c.strokeStyle = 'rgba(230,200,140,.3)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 40; i++) { const x = (i * 131 + t * 600) % (VWd + 100) - 50, y = (i * 61 + t * 20) % VHt; c.moveTo(x, y); c.lineTo(x + 40, y + 2); } c.stroke(); }
  else if (type === 'embers') { for (let i = 0; i < 45; i++) { const x = (i * 97 + Math.sin(t + i) * 30) % VWd, y = VHt - ((i * 53 + t * 60) % VHt); c.fillStyle = `rgba(255,${120 + i * 3 % 100},40,.8)`; c.fillRect(x, y, 3, 3); } }
  else if (type === 'leaves') { c.font = EMF(16); c.textAlign = 'center'; for (let i = 0; i < 12; i++) c.fillText(i % 2 ? '🍃' : '🍂', (i * 211 + t * 90) % (VWd + 40) - 20, (i * 71 + t * 50 + Math.sin(t * 2 + i) * 20) % VHt); }
  else if (type === 'fog') { c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse((i * 260 + t * 15) % (VWd + 300) - 150, 120 + i * 70, 220, 40, 0, 0, 7); c.fill(); } }
  c.restore();
}

function drawDragon(c, x, y, s, t, face, col) {
  c.save(); c.translate(x, y); c.scale((face || 1) * s / 100, s / 100); c.fillStyle = col || '#1a0f2e';
  const f = Math.sin(t * 6) * 24;
  c.beginPath(); c.moveTo(-40, 5); c.quadraticCurveTo(-90, 28 + f * .3, -125, -8); c.quadraticCurveTo(-80, 8, -38, -10); c.fill();
  c.beginPath(); c.moveTo(-18, -12); c.lineTo(-70, -75 + f); c.lineTo(-48, -35); c.lineTo(-30, -82 + f); c.lineTo(-12, -30); c.lineTo(8, -70 + f); c.lineTo(10, -14); c.fill();
  c.beginPath(); c.ellipse(0, 0, 46, 22, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(28, -10); c.quadraticCurveTo(55, -38, 70, -28); c.lineTo(92, -22); c.lineTo(72, -12); c.quadraticCurveTo(55, -4, 40, 12); c.fill();
  c.beginPath(); c.moveTo(66, -30); c.lineTo(62, -46); c.lineTo(74, -32); c.moveTo(56, -30); c.lineTo(50, -44); c.lineTo(62, -30); c.fill();
  c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(76, -24, 3.2, 0, 7); c.fill();
  c.restore();
}

function drawVignette(c, VWd, VHt) {
  const g = c.createRadialGradient(VWd / 2, VHt / 2, VHt * .45, VWd / 2, VHt / 2, VWd * .62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,20,.35)'); c.fillStyle = g; c.fillRect(0, 0, VWd, VHt);
}
