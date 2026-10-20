// Controller-Unterstuetzung (PS4/PS5 und andere "standard"-Gamepads) ueber die Gamepad-API.
// Spiel: Stick/Steuerkreuz laufen, Kreuz springen, Quadrat schlagen, Kreis/R1 Dash, Dreieck oder Stick runter Tuer/Rohr, Options Pause.
// Menues: Steuerkreuz/Stick wechseln den Fokus, Kreuz bestaetigt, Kreis geht zurueck. Karte: links/rechts laufen, Kreuz starten.
const GP = (() => {
  const B = { cross: 0, circle: 1, square: 2, tri: 3, l1: 4, r1: 5, l2: 6, r2: 7, options: 9, up: 12, down: 13, left: 14, right: 15 };
  const DZ = .4; let pad = null, prev = {}, held = {}, rep = {}, last = 0, active = false, curMode = '', lock = false, hudMode = false, held2 = {};
  const pressed = (g, i) => !!(g.buttons[i] && g.buttons[i].pressed);
  const edge = (k, v) => { const e = v && !prev[k]; prev[k] = v; return e; };
  // Tastendruck mit Wiederholung (fuer Menues): sofort, dann nach .35s alle .12s
  const repeat = (k, v, now) => { if (!v) { rep[k] = 0; return false; } if (!rep[k]) { rep[k] = now + .35; return true; } if (now > rep[k]) { rep[k] = now + .12; return true; } return false; };

  const scope = () => (typeof paused !== 'undefined' && paused) ? document.getElementById('pause') : mode === 'ui' ? document.getElementById('ui') : (mode === 'map' && hudMode) ? document.getElementById('hud') : null;
  const hint = document.getElementById('gphint'), setHint = t => { if (hint && hint.textContent !== t) hint.textContent = t; };
  const enterHud = () => { const all = focusables(document.getElementById('hud')); if (!all.length) return; hudMode = true; all[0].focus(); };
  const exitHud = () => { hudMode = false; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); };
  const focusables = root => [...root.querySelectorAll('button:not(:disabled),input[type=range],input[type=checkbox],textarea,.it,summary')].filter(e => e.offsetParent !== null && e.getBoundingClientRect().width > 0);
  function nav(dir) {
    const root = scope(); if (!root) return; const all = focusables(root); if (!all.length) return;
    let cur = document.activeElement; if (!all.includes(cur)) { const f = all[0]; if (f.tabIndex < 0) f.tabIndex = -1; f.focus(); return; }
    if (cur.type === 'range' && (dir === 'left' || dir === 'right')) { const st = +cur.step || 1; cur.value = +cur.value + (dir === 'right' ? st : -st); cur.dispatchEvent(new Event('input', { bubbles: true })); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bs = 1e9;
    for (const e of all) {
      if (e === cur) continue; const q = e.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy;
      const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy, side = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (along <= 4) continue; const s = along + side * 2.2; if (s < bs) { bs = s; best = e; }
    }
    if (best) { if (best.tabIndex < 0) best.tabIndex = -1; best.focus(); }
  }
  function confirm() { const a = document.activeElement, root = scope(); if (root && a && root.contains(a) && a !== root) a.click(); }
  function back() {
    if (typeof paused !== 'undefined' && paused) return resumeGame();
    const root = scope(); if (!root) return; const b = [...root.querySelectorAll('button')].find(x => /^(Zurück|Fertig|Karte)/.test(x.textContent.trim())); if (b) b.click();
  }
  const key = k => dispatchEvent(new KeyboardEvent('keydown', { key: k }));

  // Ein Controller steuert eine Katze (sIn = setIn fuer Spieler 1 oder setIn2 fuer Spieler 2)
  function drive(gg, H, pre, sIn) {
    const ax = gg.axes[0] || 0, ay = gg.axes[1] || 0, l = pressed(gg, B.left) || ax < -DZ, r = pressed(gg, B.right) || ax > DZ, d = pressed(gg, B.down) || ay > DZ + .2;
    const set = (k, v, c) => { if (H[k] !== v) { H[k] = v; sIn(c, v ? 1 : 0); } };
    set('l', l, 'l'); set('r', r, 'r'); set('j', pressed(gg, B.cross) || pressed(gg, B.l1), 'j');
    if (edge(pre + 'atk', pressed(gg, B.square) || pressed(gg, B.r2))) sIn('a', 1);
    if (edge(pre + 'dash', pressed(gg, B.circle) || pressed(gg, B.r1))) sIn('dash', 1);
    if (edge(pre + 'use', pressed(gg, B.tri) || d)) sIn('use', 1);
  }
  function poll(ts) {
    requestAnimationFrame(poll);
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; let g = null;
    const list = []; for (const p of gps) if (p && p.connected && (p.mapping === 'standard' || p.buttons.length >= 16)) list.push(p);
    g = list[0] || null; const g2 = list[1] || null;
    if (!g) { if (pad) { pad = null; document.documentElement.classList.remove('gp'); } return; }
    if (!pad || pad.index !== g.index) { pad = g; if (window.toast) toast('🎮 Controller verbunden'); }
    const now = ts / 1000, ax = g.axes[0] || 0, ay = g.axes[1] || 0;
    // Moduswechsel (Menue, Level, Karte): gehaltene Tasten nicht in den neuen Bildschirm uebernehmen, sonst startet z.B. ein Druck auf "Karte" sofort das naechste Level
    const ms = mode + (typeof paused !== 'undefined' && paused ? 'p' : ''); if (ms !== curMode) { curMode = ms; lock = true; hudMode = false; }
    if (lock) { if (g.buttons.some(b => b.pressed)) { for (const [k, c] of [['l', 'l'], ['r', 'r'], ['j', 'j']]) { if (held[k]) { held[k] = false; setIn(c, 0); } if (held2[k]) { held2[k] = false; setIn2(c, 0); } } return; } lock = false; }
    const L = pressed(g, B.left) || ax < -DZ, R = pressed(g, B.right) || ax > DZ, U = pressed(g, B.up) || ay < -DZ, D = pressed(g, B.down) || ay > DZ + .2;
    const any = g.buttons.some(b => b.pressed) || Math.abs(ax) > DZ || Math.abs(ay) > DZ; if (any && !active) { active = true; document.documentElement.classList.add('gp'); }
    if (edge('opt', pressed(g, B.options) || (g2 && pressed(g2, B.options)))) {
      if (mode === 'play') { if (paused) resumeGame(); else pauseGame(); }
      else if (mode === 'map') showTitle();
      else if (mode === 'ui') {
        if (document.querySelector('#ui .title')) start();
        else if (!document.querySelector('#ui .hd')) { const b = document.querySelector('#ui button.g'); if (b) b.click(); }
        else back();
      }
    }
    if (mode === 'play' && !paused) {
      // Gehen/Springen/Schlagen: nur bei Aenderung an das Eingabesystem melden, damit Tastatur und Touch daneben weiter funktionieren
      drive(g, held, 'a', setIn); if (g2 && save.chars.coop && !NET.live) drive(g2, held2, 'b', setIn2);
    } else {
      if (held.l) { held.l = false; setIn('l', 0); } if (held.r) { held.r = false; setIn('r', 0); } if (held.j) { held.j = false; setIn('j', 0); }
      if (held2.l) { held2.l = false; setIn2('l', 0); } if (held2.r) { held2.r = false; setIn2('r', 0); } if (held2.j) { held2.j = false; setIn2('j', 0); }
      if (mode === 'map' && MV) {
        if (hudMode) {
          setHint('◀ ▶ wählen · ✕ öffnen · ○ zurück zur Karte');
          if (repeat('hl', L, now)) nav('left'); if (repeat('hr', R, now)) nav('right');
          if (edge('hc', pressed(g, B.cross))) confirm(); if (edge('hb', pressed(g, B.circle) || D)) exitHud();
        } else {
          setHint('L1/R1 Welt · ◻ Beutel · △ Fähigkeiten · ↑ Menüleiste · Options Menü');
          if (repeat('ml', L, now) && !MV.moving) key('ArrowLeft'); if (repeat('mr', R, now) && !MV.moving) key('ArrowRight');
          if (edge('mc', pressed(g, B.cross))) key('Enter');
          if (edge('mu', U)) enterHud();
          if (edge('mw1', pressed(g, B.l1))) swW(-1); if (edge('mw2', pressed(g, B.r1))) swW(1);
          if (edge('mbag', pressed(g, B.square))) bag(); if (edge('mtree', pressed(g, B.tri))) tree();
        }
      } else if (scope()) {
        if (repeat('nl', L, now)) nav('left'); if (repeat('nr', R, now)) nav('right'); if (repeat('nu', U, now)) nav('up'); if (repeat('nd', D, now)) nav('down');
        if (edge('ok', pressed(g, B.cross))) confirm(); if (edge('bk', pressed(g, B.circle))) back();
      }
    }
    last = now;
  }
  // Rumpeln bei Treffern (Chrome/Edge/Android unterstuetzen es fuer DualShock/DualSense)
  function rumble(ms) {
    if (!pad) return; const a = pad.vibrationActuator; if (!a || !a.playEffect) return;
    try { a.playEffect('dual-rumble', { startDelay: 0, duration: Math.min(400, ms || 80), weakMagnitude: .5, strongMagnitude: .7 }).catch(() => { }); } catch (e) { }
  }
  // Neuer Bildschirm (Level-Ende, Menue, Pause): primaeren Knopf automatisch vorwaehlen, damit Stick/Steuerkreuz sofort greifen
  const focusPrimary = () => requestAnimationFrame(() => {
    if (!pad) return; const root = scope(); if (!root) return; const all = focusables(root); if (!all.length || all.includes(document.activeElement)) return;
    (root.querySelector('button.g:not(:disabled)') || all[0]).focus();
  });
  for (const id of ['ui', 'pbox']) { const el = document.getElementById(id); if (el) new MutationObserver(focusPrimary).observe(el, { childList: true }); }
  addEventListener('gamepadconnected', () => { if (window.toast) toast('🎮 Controller verbunden'); });
  addEventListener('gamepaddisconnected', () => { document.documentElement.classList.remove('gp'); if (mode === 'play' && !paused) pauseGame(); });
  requestAnimationFrame(poll);
  return { rumble, connected: () => !!pad };
})();
