"use strict";
/* Arranque: pantalla de inicio, primera vista, nube y app instalable. */
window.addEventListener("online", pintarCuenta);
window.addEventListener("offline", pintarCuenta);
pantallaInicio(modoSesion() ? "oculto" : "cargando");
render();
cargarFirebase();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
