/* 旅のしおり帖：本棚そのものをオフラインでも開けるようにする（各しおりの保存は本棚のページ側で行う） */
var SHELL = 'shelf-7c368da1';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('shelf-') === 0 && k !== SHELL; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  var inShelf = url.pathname.indexOf(self.registration.scope.replace(location.origin, '')) === 0;
  if (!inShelf) return; /* 各しおりのURLは本棚のページが自分で保存・更新する */
  /* 本棚はネット優先、つながらなければ保存した版 */
  e.respondWith(fetch(req).then(function (r) {
    if (r.ok) { var c = r.clone(); caches.open(SHELL).then(function (ca) { ca.put(req, c); }); }
    return r;
  }).catch(function () {
    return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
  }));
});
