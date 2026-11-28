/* App instalable y uso sin internet.
   - Archivos de la pagina: primero la red (asi ves la ultima version); si la
     red tarda mas de 3.5 s o no hay conexion, se usa la copia guardada.
   - SDK de Firebase: la version esta fija, asi que se usa la copia guardada
     y solo se descarga la primera vez. Carga rapido aunque haya mala senal.
   - Las llamadas a Firebase (datos e inicio de sesion) no pasan por aqui. */
var CACHE = "rutina-v2-3";
var BASE = [
  "./", "index.html", "manifest.webmanifest", "css/estilos.css", "fonts/archivo-latin.woff2", "img/icono.svg", "img/icono-192.png",
  "js/plan.js", "js/datos.js", "js/graficas.js", "js/vistas.js", "js/sesion.js", "js/nube.js", "js/eventos.js", "js/inicio.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf("rutina-sdk") !== 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function guardarEn(nombre, req, res) { if (res && res.ok) { var copia = res.clone(); caches.open(nombre).then(function (c) { c.put(req, copia); }); } return res; }
self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0) {
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (res) { return guardarEn("rutina-sdk", req, res); }); }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  var navegar = req.mode === "navigate", opciones = { ignoreSearch: navegar };
  var red = fetch(req).then(function (res) { return guardarEn(CACHE, req, res); });
  e.respondWith(new Promise(function (ok) {
    var listo = false;
    function copia() { return caches.match(req, opciones).then(function (r) { return r || (navegar ? caches.match("index.html") : null); }); }
    var espera = setTimeout(function () { copia().then(function (r) { if (r && !listo) { listo = true; ok(r); } }); }, 3500);
    red.then(function (res) { if (!listo) { listo = true; clearTimeout(espera); ok(res); } }).catch(function () {
      clearTimeout(espera);
      copia().then(function (r) { if (!listo) { listo = true; ok(r || Response.error()); } });
    });
  }));
});
