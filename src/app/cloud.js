// Spielstand sichern: Export-/Import-Code (funktioniert immer) + optionale Cloud-Synchronisierung
// ueber eine eigene Firebase Realtime Database (REST, kein SDK). Der Spieler-Code ist der Schluessel.
const CLOUD = {
  status: '', timer: 0,
  cfg() { try { return JSON.parse(localStorage.getItem('mk_cloud')) || {}; } catch (e) { return {}; } },
  setCfg(o) { try { localStorage.setItem('mk_cloud', JSON.stringify({ ...CLOUD.cfg(), ...o })); } catch (e) { } },
  newCode() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(r, v => a[v % a.length]).join('').replace(/(.{4})(?=.)/g, '$1-');
  },
  // Firebase speichert keine leeren Listen/Objekte und macht aus Listen mit Luecken Objekte: beim Laden wieder auffuellen
  normalize(o) {
    if (!o || typeof o !== 'object') return o;
    const arr = v => Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : [], r = Object.assign(defSave(), o);
    r.prog = arr(o.prog); while (r.prog.length < W.length) r.prog.push(0); r.load = arr(o.load);
    for (const k of ['skills', 'own', 'moons', 'cleared', 'cons', 'seen', 'bells', 'tips', 'ach', 'best', 'rank', 'daily']) if (!r[k] || typeof r[k] !== 'object') r[k] = {};
    r.stats = Object.assign(defSave().stats, o.stats || {}); if (!r.stats.kills) r.stats.kills = {};
    r.cos = { own: (o.cos && o.cos.own) || {}, eq: (o.cos && o.cos.eq) || {} }; r.chars = Object.assign(defSave().chars, o.chars || {});
    if (r.editor) { r.editor.objs = arr(r.editor.objs); r.editor.en = arr(r.editor.en); r.editor.g = arr(r.editor.g); }
    return r;
  },
  validSave(o) {
    return o && typeof o === 'object' && Array.isArray(o.prog) && o.prog.length >= 6 && o.prog.length <= 12 && o.prog.every(n => Number.isInteger(n) && n >= 0 && n < 40)
      && Number.isFinite(o.shards) && Number.isFinite(o.coins) && o.skills && typeof o.skills === 'object' && o.own && typeof o.own === 'object' && Array.isArray(o.load);
  },
  exportCode() { return 'MK1.' + btoa(unescape(encodeURIComponent(JSON.stringify(save)))); },
  parseCode(txt) {
    const t = String(txt).trim();
    if (!t.startsWith('MK1.')) throw new Error('Das ist kein Mondkatze-Code.');
    let o; try { o = JSON.parse(decodeURIComponent(escape(atob(t.slice(4))))); } catch (e) { throw new Error('Der Code ist beschädigt.'); }
    if (!CLOUD.validSave(o)) throw new Error('Der Code ist beschädigt.');
    return o;
  },
  endpoint() {
    const c = CLOUD.cfg(); if (!c.url || !c.code) return null;
    const u = c.url.trim().replace(/\/+$/, '');
    if (!/^https:\/\//.test(u)) throw new Error('Die URL muss mit https:// beginnen.');
    return `${u}/saves/${encodeURIComponent(c.code.trim().toUpperCase())}.json`;
  },
  async req(method, body) {
    const ep = CLOUD.endpoint(); if (!ep) throw new Error('Bitte URL und Spieler-Code eintragen.');
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 9000);
    try {
      const r = await fetch(ep, { method, body: body ? JSON.stringify(body) : undefined, signal: ac.signal, headers: body ? { 'Content-Type': 'application/json' } : undefined });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Zugriff verweigert – Datenbank-Regeln prüfen.' : 'Serverfehler ' + r.status);
      return await r.json();
    } catch (e) { throw new Error(e.name === 'AbortError' ? 'Zeitüberschreitung – keine Verbindung?' : e.message); }
    finally { clearTimeout(to); }
  },
  async push() { await CLOUD.req('PUT', { ts: save.ts || Date.now(), data: save }); CLOUD.status = '☁️ Gespeichert ' + new Date().toLocaleTimeString(); },
  async pull() {
    const r = await CLOUD.req('GET'); if (!r || !r.data) throw new Error('In der Cloud gibt es unter diesem Code noch keinen Spielstand.');
    r.data = CLOUD.normalize(r.data);
    if (!CLOUD.validSave(r.data)) throw new Error('Der Cloud-Spielstand ist beschädigt.');
    return r;
  },
  touch() { // nach jedem lokalen Speichern: verzoegert hochladen
    if (typeof ACC !== 'undefined') ACC.touch();
    const c = CLOUD.cfg(); if (window.ADMIN || !c.auto || !c.url || !c.code) return;
    clearTimeout(CLOUD.timer); CLOUD.timer = setTimeout(() => CLOUD.push().catch(e => { CLOUD.status = '⚠️ ' + e.message; }), 4000);
  },
  async boot() { // beim Start: neueren Cloud-Stand anbieten
    const c = CLOUD.cfg(); if (window.ADMIN || !c.auto || !c.url || !c.code) return;
    try {
      const r = await CLOUD.pull();
      if ((r.ts || 0) > (save.ts || 0) + 1000 && confirm('Neuerer Spielstand in der Cloud gefunden. Jetzt laden?')) { applySave(r.data); showTitle(); }
      else if ((r.ts || 0) < (save.ts || 0)) CLOUD.push().catch(() => { });
      CLOUD.status = '☁️ Verbunden';
    } catch (e) { CLOUD.status = '⚠️ ' + e.message; }
  },
};
