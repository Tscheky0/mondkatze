// Vollbild: Fullscreen-API (Android/Desktop). iPhone-Safari kennt sie nicht, dort hilft nur "Zum Home-Bildschirm".
const FS = (() => {
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  const standalone = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const active = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const sync = () => {
    root.classList.toggle('is-fs', active());
    document.querySelectorAll('[data-fs]').forEach(b => { b.textContent = active() ? '🗗' : '⛶'; b.title = active() ? 'Vollbild beenden' : 'Vollbild'; });
  };
  async function toggle() {
    if (!req) { if (window.toast) toast(standalone() ? 'Schon im Vollbild' : 'iPhone: Teilen → „Zum Home-Bildschirm“ für Vollbild'); return; }
    try {
      if (active()) { await exit.call(document); if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
      else {
        await req.call(root, { navigationUI: 'hide' });
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
      }
    } catch (e) { if (window.toast) toast('Vollbild nicht möglich'); }
    sync();
  }
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
  addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !/input|textarea/i.test((e.target || {}).tagName || '') && !e.ctrlKey && !e.metaKey) toggle(); });
  addEventListener('DOMContentLoaded', sync);
  return { toggle, active, sync, standalone };
})();
