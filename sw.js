/* App instalable y uso sin internet.
   Primero intenta la red (asi siempre ves la ultima version) y, si no hay
   conexion, usa la copia guardada. Las llamadas a Firebase (datos e inicio de
   sesion) no pasan por aqui; solo se guardan los archivos del SDK. */
var CACHE = "rutina-v2-2";
var BASE = [
  "./", "index.html", "manifest.webmanifest", "css/estilos.css", "fonts/archivo-latin.woff2", "img/icono.svg", "img/icono-192.png",
  "js/plan.js", "js/datos.js", "js/graficas.js", "js/vistas.js", "js/sesion.js", "js/nube.js", "js/eventos.js", "js/inicio.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url);
  var propio = url.origin === self.location.origin;
  var sdk = url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0;
  if (!propio && !sdk) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (r) { return r || (req.mode === "navigate" ? caches.match("index.html") : undefined); });
  }));
});
