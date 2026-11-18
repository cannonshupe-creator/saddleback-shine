// Saddleback Shine offline support: the page opens with no signal.
// The page itself: network first, cached copy when offline. Libraries and fonts: cached after the first load.
// Map tiles: kept as you browse. The sync script and address lookups always go to the network.
// The cache names start with "ss-" so they never collide with another app on the same site.
const SHELL = "ss-shell-v1", LIBS = "ss-libs-v1", TILES = "ss-tiles-v1";
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(["./", "./index.html"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET" || req.headers.has("range")) return;
  const u = new URL(req.url);
  if (u.origin === location.origin){
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(SHELL).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("./index.html"))));
    return;
  }
  if (/^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(LIBS).then(x => x.put(req, c)); } return r; })));
    return;
  }
  if (u.hostname === "tile.openstreetmap.org"){
    e.respondWith(caches.open(TILES).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
