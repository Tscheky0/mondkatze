const C = 'mondkatze-v7', F = ['./', 'index.html', 'src/ui/style.css', 'src/data/data.js', 'src/data/data2.js', 'src/audio/audio.js', 'src/render/art.js', 'src/render/creatures.js', 'src/render/scenery.js', 'src/game/level.js', 'src/render/cine.js', 'src/game/arena.js', 'src/game/battle.js', 'src/game/extras.js', 'src/game/minigames.js', 'src/app/cloud.js', 'src/game/map.js', 'src/app/app.js', 'manifest.json', 'icon.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(F.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== C).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
