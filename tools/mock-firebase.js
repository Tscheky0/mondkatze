// Lokaler Nachbau von Firebase Auth (REST) und Realtime Database (REST) fuer Tests ohne echtes Projekt.
//   node tools/mock-firebase.js           -> http://localhost:9099
// Im Spiel unter Konto -> Einrichtung eintragen: URL http://localhost:9099, API-Key beliebig.
// Zusaetzlich im Browser: localStorage.setItem('mk_fb', JSON.stringify({apiKey:'x', url:'http://localhost:9099', auth:'http://localhost:9099', tok:'http://localhost:9099'}))
const http = require('http'), PORT = +process.env.PORT || 9099;
const users = {}, tree = {};
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(obj)); };
const uidOf = t => { const m = /^T:([^:]+):/.exec(t || ''); return m ? m[1] : null; };
function node(path, create) { let n = tree; for (const k of path) { if (typeof n[k] !== 'object' || n[k] === null) { if (!create) return undefined; n[k] = {}; } n = n[k]; } return n; }
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const u = new URL(req.url, 'http://x'); let body = '';
  req.on('data', d => body += d); req.on('end', () => {
    let j = {}; try { j = body ? JSON.parse(body) : {}; } catch (e) { }
    const p = u.pathname;
    if (p === '/v1/accounts:signUp') {
      if (users[j.email]) return send(res, 400, { error: { message: 'EMAIL_EXISTS' } });
      if (String(j.password || '').length < 6) return send(res, 400, { error: { message: 'WEAK_PASSWORD : Password should be at least 6 characters' } });
      const uid = 'u' + Math.random().toString(36).slice(2, 10); users[j.email] = { uid, pw: j.password };
      return send(res, 200, { idToken: `T:${uid}:${Date.now()}`, refreshToken: 'R:' + uid, localId: uid, expiresIn: '3600' });
    }
    if (p === '/v1/accounts:signInWithPassword') {
      const us = users[j.email]; if (!us || us.pw !== j.password) return send(res, 400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
      return send(res, 200, { idToken: `T:${us.uid}:${Date.now()}`, refreshToken: 'R:' + us.uid, localId: us.uid, expiresIn: '3600' });
    }
    if (p === '/v1/token') { const uid = (/^R:(.+)$/.exec(j.refresh_token || '') || [])[1]; if (!uid) return send(res, 400, { error: { message: 'INVALID_REFRESH_TOKEN' } }); return send(res, 200, { id_token: `T:${uid}:${Date.now()}`, refresh_token: 'R:' + uid, user_id: uid, expires_in: '3600' }); }
    if (p.endsWith('.json')) {
      const path = p.slice(1, -5).split('/').filter(Boolean).map(decodeURIComponent), uid = uidOf(u.searchParams.get('auth'));
      if ((path[0] === 'users' || path[0] === 'rooms') && !uid) return send(res, 401, { error: 'Permission denied' });
      if (path[0] === 'users' && path[1] !== uid) return send(res, 401, { error: 'Permission denied' });
      if (req.method === 'GET') { const n = node(path, false); return send(res, 200, n === undefined ? null : n); }
      if (req.method === 'DELETE') { if (path.length) { const par = node(path.slice(0, -1), false); if (par) delete par[path[path.length - 1]]; } return send(res, 200, null); }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const par = node(path.slice(0, -1), true), key = path[path.length - 1];
        if (req.method === 'PUT') par[key] = j; else par[key] = Object.assign(par[key] || {}, j);
        return send(res, 200, j);
      }
    }
    send(res, 404, { error: 'not found' });
  });
}).listen(PORT, () => console.log('Mock-Firebase: http://localhost:' + PORT));
