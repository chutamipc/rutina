"use strict";
/* Arranque: decide si mostrar la pantalla de inicio y conecta con la nube. */
window.addEventListener("online", pintarCuenta);
window.addEventListener("offline", pintarCuenta);
pantallaInicio(modoSesion() ? "oculto" : "cargando");
render();
cargarFirebase();
