// Spielerkonten ueber Firebase Authentication (REST, kein SDK) + Cloud-Spielstand pro Konto.
// Ein Konto = Spielername + Passwort (intern als Name@mondkatze.app angelegt). Der Spielstand liegt unter users/<uid>/save.
const ACC = (() => {
  const LS = 'mk_acc', LF = 'mk_fb';
  const rd = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  const cfg = () => {
    const c = window.MK_FIREBASE || {}, o = rd(LF);
    return { apiKey: o.apiKey || c.apiKey || '', url: (o.url || c.url || '').trim().replace(/\/+$/, ''), auth: o.auth || 'https://identitytoolkit.googleapis.com', tok: o.tok || 'https://securetoken.googleapis.com' };
  };
  const ERR = { EMAIL_EXISTS: 'Diesen Namen gibt es schon.', EMAIL_NOT_FOUND: 'Name oder Passwort falsch.', INVALID_PASSWORD: 'Name oder Passwort falsch.', INVALID_LOGIN_CREDENTIALS: 'Name oder Passwort falsch.',
    WEAK_PASSWORD: 'Das Passwort braucht mindestens 6 Zeichen.', OPERATION_NOT_ALLOWED: 'E-Mail/Passwort-Anmeldung ist in Firebase nicht aktiviert.', TOO_MANY_ATTEMPTS_TRY_LATER: 'Zu viele Versuche – kurz warten.', INVALID_API_KEY: 'Der API-Key ist falsch.', API_KEY_INVALID: 'Der API-Key ist falsch.' };
  const errText = j => { const m = String((j && j.error && j.error.message) || '').split(/[ :]/)[0]; return ERR[m] || (m ? 'Fehler: ' + m : 'Anmeldung fehlgeschlagen.'); };
  const mail = n => n.toLowerCase() + '@mondkatze.app';
  const okName = n => /^[A-Za-z0-9_-]{3,16}$/.test(n);
  let user = null, timer = 0;

  async function http(url, opt) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 10000);
    try { return await fetch(url, { ...opt, signal: ac.signal }); }
    catch (e) { throw new Error(e.name === 'AbortError' ? 'Zeitüberschreitung – keine Verbindung?' : 'Keine Verbindung zum Server.'); }
    finally { clearTimeout(to); }
  }
  async function post(url, body) {
    const r = await http(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(errText(j)); return j;
  }
  function adopt(j, name) {
    user = { uid: j.localId || j.user_id, name: name || (user && user.name) || '', idToken: j.idToken || j.id_token, refresh: j.refreshToken || j.refresh_token, exp: Date.now() + (+(j.expiresIn || j.expires_in) || 3600) * 1000 };
    try { localStorage.setItem(LS, JSON.stringify({ uid: user.uid, name: user.name, refresh: user.refresh })); } catch (e) { }
  }
  const ready = () => { const c = cfg(); return !!(c.apiKey && c.url); };

  async function sign(kind, name, pw) {
    const c = cfg(); if (!ready()) throw new Error('Firebase ist noch nicht eingerichtet.');
    name = String(name || '').trim(); if (!okName(name)) throw new Error('Der Name braucht 3–16 Zeichen: Buchstaben, Zahlen, _ oder -.');
    if (String(pw || '').length < 6) throw new Error('Das Passwort braucht mindestens 6 Zeichen.');
    const j = await post(`${c.auth}/v1/accounts:${kind}?key=${encodeURIComponent(c.apiKey)}`, { email: mail(name), password: pw, returnSecureToken: true });
    adopt(j, name);
    if (kind === 'signUp') await db(`users/${user.uid}/profile`, 'PUT', { name, ts: Date.now() }); // Anzeigename
    else { const p = await db(`users/${user.uid}/profile`, 'GET').catch(() => null); if (p && p.name) user.name = p.name; }
    adopt({ localId: user.uid, idToken: user.idToken, refreshToken: user.refresh, expiresIn: Math.max(60, (user.exp - Date.now()) / 1000) }, user.name);
    return user;
  }
  const signUp = (n, p) => sign('signUp', n, p), signIn = (n, p) => sign('signInWithPassword', n, p);
  function signOut() { user = null; try { localStorage.removeItem(LS); } catch (e) { } }

  async function token() { // gueltiges ID-Token, bei Bedarf erneuern
    if (!user) throw new Error('Bitte erst anmelden.');
    if (Date.now() > user.exp - 60000) {
      const c = cfg(), j = await post(`${c.tok}/v1/token?key=${encodeURIComponent(c.apiKey)}`, { grant_type: 'refresh_token', refresh_token: user.refresh });
      adopt(j, user.name);
    }
    return user.idToken;
  }
  // Realtime-Database-Zugriff mit Konto-Token
  async function db(path, method, body) {
    const c = cfg(), t = await token().catch(e => { if (user) throw e; return null; }) || (user && user.idToken);
    const r = await http(`${c.url}/${path}.json?auth=${encodeURIComponent(t)}`, { method: method || 'GET', headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined, body: body !== undefined ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Zugriff verweigert – Datenbank-Regeln prüfen.' : 'Serverfehler ' + r.status);
    return r.json();
  }

  // ----- Cloud-Spielstand -----
  async function push() { await db(`users/${user.uid}/save`, 'PUT', { ts: save.ts || Date.now(), data: save }); CLOUD.status = '☁️ Konto gespeichert ' + new Date().toLocaleTimeString(); }
  async function pull() { const r = await db(`users/${user.uid}/save`, 'GET'); if (!r || !r.data) return null; r.data = CLOUD.normalize(r.data); if (!CLOUD.validSave(r.data)) throw new Error('Der Cloud-Spielstand ist beschädigt.'); return r; }
  function touch() { if (!user || window.ADMIN) return; clearTimeout(timer); timer = setTimeout(() => push().catch(e => { CLOUD.status = '⚠️ ' + e.message; }), 4000); }
  async function boot() { // beim Start: gemerkte Anmeldung wiederherstellen und neueren Cloud-Stand anbieten
    const s = rd(LS); if (!s.refresh || !ready() || window.ADMIN) return;
    try {
      user = { uid: s.uid, name: s.name, refresh: s.refresh, idToken: '', exp: 0 }; await token();
      const r = await pull();
      if (r && (r.ts || 0) > (save.ts || 0) + 1000 && confirm(`Neuerer Spielstand in deinem Konto „${user.name}“ gefunden. Jetzt laden?`)) { applySave(r.data); showTitle(); }
      else if (!r || (r.ts || 0) < (save.ts || 0)) push().catch(() => { });
      CLOUD.status = '☁️ Konto verbunden';
    } catch (e) { if (/Name oder Passwort|Bitte erst|INVALID|TOKEN/i.test(e.message)) signOut(); CLOUD.status = '⚠️ ' + e.message; }
  }
  return { cfg, ready, okName, signUp, signIn, signOut, token, db, push, pull, touch, boot, get user() { return user; }, setCfg(o) { try { localStorage.setItem(LF, JSON.stringify({ ...rd(LF), ...o })); } catch (e) { } } };
})();

// ---------- Konto-Bildschirm ----------
function account(msg) {
  show('ui'); const c = ACC.cfg(), u = ACC.user;
  const setup = `<details ${ACC.ready() ? '' : 'open'}><summary>Einrichtung (einmalig, kostenlos)</summary>
  <label>Datenbank-URL</label><input id=fu value="${esc(c.url)}" placeholder="https://dein-projekt-default-rtdb.europe-west1.firebasedatabase.app">
  <label>Web-API-Schlüssel</label><input id=fk value="${esc(c.apiKey)}" placeholder="AIza…">
  <div class=row><button class=d onclick="accSaveCfg()">Speichern</button></div>
  <small>Der Betreiber des Spiels trägt beides einmal in <code>src/app/config.js</code> ein, dann brauchen Spieler das hier nicht. Anleitung: README, Abschnitt „Online-Funktionen einrichten“.</small></details>`;
  ui.innerHTML = `<div class=hd><h2>👤 Konto</h2><button class=d onclick="showTitle()">Zurück</button></div>${msg ? `<div class=card>${msg}</div>` : ''}
  ${u ? `<div class=card><h3>Angemeldet als ${esc(u.name)}</h3><small>${esc(CLOUD.status || 'Dein Spielstand wird automatisch in deinem Konto gesichert.')}</small>
    <div class=row><button onclick="accPush()">☁️ Jetzt speichern</button><button class=d onclick="accPull()">☁️ Laden</button><button class=g onclick="online()">🌐 Online-Koop</button><button class=r onclick="accOut()">Abmelden</button></div></div>`
  : ACC.ready() ? `<div class=card><h3>Anmelden oder neues Konto</h3><small>Mit einem Konto bleibt dein Fortschritt auf jedem Gerät erhalten – auch wenn du online mit Freunden spielst.</small>
    <label>Spielername (3–16 Zeichen)</label><input id=an autocomplete=username value="${esc(ACC.last || '')}"><label>Passwort (mindestens 6 Zeichen)</label><input id=ap type=password autocomplete=current-password>
    <div class=row><button class=g onclick="accGo('signIn')">Anmelden</button><button onclick="accGo('signUp')">Konto erstellen</button></div></div>`
  : '<div class=card>Konten und Online-Koop sind noch nicht eingerichtet. Trag unten die Firebase-Daten ein.</div>'}
  <div class=card>${setup}</div>`;
  const pw = $('#ap'); if (pw) pw.type = 'password';
}
function accSaveCfg() { ACC.setCfg({ url: $('#fu').value.trim(), apiKey: $('#fk').value.trim() }); account('✅ Gespeichert.'); }
async function accGo(kind) {
  const n = $('#an').value, p = $('#ap').value; ACC.last = n;
  try { await ACC[kind](n, p); if (kind === 'signUp') await ACC.push(); else { const r = await ACC.pull(); if (r && (r.ts || 0) > (save.ts || 0) + 1000 && confirm('In deinem Konto liegt ein neuerer Spielstand. Jetzt laden?')) applySave(r.data); else await ACC.push(); } account(`✅ Willkommen, ${esc(ACC.user.name)}!`); }
  catch (e) { account('⚠️ ' + esc(e.message)); $('#an').value = n; }
}
async function accPush() { try { await ACC.push(); account('✅ Gespeichert.'); } catch (e) { account('⚠️ ' + esc(e.message)); } }
async function accPull() { try { const r = await ACC.pull(); if (!r) return account('In deinem Konto liegt noch kein Spielstand.'); if (confirm('Den lokalen Spielstand mit dem aus dem Konto überschreiben?')) { applySave(r.data); account('✅ Geladen.'); } } catch (e) { account('⚠️ ' + esc(e.message)); } }
function accOut() { ACC.signOut(); if (typeof NET !== 'undefined' && NET.live) netLeave(true); account('Abgemeldet.'); }
