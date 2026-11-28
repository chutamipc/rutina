"use strict";
/* Eventos de la pagina, copias de seguridad y avisos. */

var avisoT = null;
function aviso(t, icono) {
  var el = $("#toast");
  el.innerHTML = ico(icono || "info") + "<span>" + esc(t) + "</span>";
  el.hidden = false; el.classList.remove("sale"); void el.offsetWidth; el.classList.add("entra");
  clearTimeout(avisoT); avisoT = setTimeout(function () { el.hidden = true; el.classList.remove("entra"); }, 2800);
}

/* ---------- Copia de seguridad ---------- */
function exportar() {
  var nombre = "rutina-copia-" + hoy() + ".txt", texto = JSON.stringify(datos);
  var marcar = function () { datos.ajustes.ultimoRespaldo = hoy(); guardar(); render(); };
  var archivo = null;
  try { archivo = new File([texto], nombre, { type: "text/plain" }); } catch (e) {}
  if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: "Copia de mi rutina" }).then(marcar).catch(function () {});
    return;
  }
  var url = URL.createObjectURL(new Blob([texto], { type: "text/plain" })), a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  marcar(); aviso("Copia descargada", "download");
}
function importar(archivo) {
  var lector = new FileReader();
  lector.onload = function () {
    var d; try { d = JSON.parse(lector.result); } catch (e) { d = null; }
    if (!d || d.version !== 1 || !Array.isArray(d.registros)) { aviso("Ese archivo no es una copia de la rutina.", "triangle-alert"); return; }
    if (!confirm("Esto reemplaza los datos de este equipo por los de la copia. ¿Seguir?")) return;
    var sub = datos.ajustes.subidoA; datos = normalizar(d); datos.ajustes.subidoA = sub; datos.pendientes = []; guardar(); aviso("Copia cargada", "check"); render();
    if (nube.user) subirTodo().catch(errNube);
  };
  lector.readAsText(archivo);
}

/* ---------- Guardado de datos sueltos ---------- */
function guardarPeso(fecha, kg) {
  if (kg == null || kg < 30 || kg > 200) { aviso("Escribe tu peso en kg, entre 30 y 200.", "triangle-alert"); return; }
  datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== fecha; });
  datos.pesos.push({ fecha: fecha, kg: kg }); datos.pesos.sort(porFecha);
  nubeSet({ pesos: o(fecha, kg) });
  guardar(); aviso("Peso guardado: " + kg + " kg", "check"); render();
}
function guardarCintura(s) {
  var cm = numero($("#cintura-cm").value); if (cm == null || cm < 40 || cm > 200) { aviso("Escribe la cintura en cm, entre 40 y 200.", "triangle-alert"); return; }
  datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== s; }); datos.cinturas.push({ fecha: s, cm: cm }); datos.cinturas.sort(porFecha);
  nubeSet({ cinturas: o(s, cm) });
  guardar(); aviso("Cintura guardada: " + cm + " cm", "check"); render();
}
function guardarMedidas(s) {
  var m = { fecha: s }, alguno = false;
  $$("[data-medida]").forEach(function (i) { var n = numero(i.value); if (n != null && n > 0) { m[i.dataset.medida] = n; if (i.dataset.medida !== "estatura") alguno = true; } });
  if (!alguno) { aviso("Escribe al menos una medida.", "triangle-alert"); return; }
  datos.medidas = datos.medidas.filter(function (x) { return x.fecha !== s; }); datos.medidas.push(m); datos.medidas.sort(porFecha);
  if (m.peso) { datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== s; }); datos.pesos.push({ fecha: s, kg: m.peso }); datos.pesos.sort(porFecha); }
  if (m.cintura) { datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== s; }); datos.cinturas.push({ fecha: s, cm: m.cintura }); datos.cinturas.sort(porFecha); }
  var copia = Object.assign({}, m); delete copia.fecha;
  var up = { medidas: o(s, copia) }; if (m.peso) up.pesos = o(s, m.peso); if (m.cintura) up.cinturas = o(s, m.cintura);
  nubeSet(up);
  guardar(); aviso("Medidas guardadas", "check"); render();
}
function alternarDiario(b) {
  var s = hoy(), clave = b.dataset.diario, d = datos.diario[s] = datos.diario[s] || {};
  d[clave] = !d[clave];
  nubeSet({ diario: o(s, o(clave, d[clave])) }); guardar();
  b.setAttribute("aria-pressed", d[clave] ? "true" : "false");
  var hechos = PLAN.diario.filter(function (it) { return d[it.id]; }).length, cuenta = $(".habitos .cuenta");
  if (cuenta) cuenta.textContent = hechos + " de " + PLAN.diario.length;
  var metas = $(".metas-caja"); if (metas) metas.outerHTML = metasSemana(s);
}
function alternarSemanal(b) {
  var l = lunesDe(hoy()), clave = b.dataset.semanal, w = datos.semanal[l] = datos.semanal[l] || {};
  w[clave] = !w[clave];
  nubeSet({ semanal: o(l, o(clave, w[clave])) }); guardar(); render();
}
function borrarTodo() {
  if (!confirm(nube.user ? "¿Borrar TODOS tus datos de la nube y de este equipo?" : "¿Borrar TODOS tus datos de este equipo?") || !confirm("¿Seguro? Esto no se puede deshacer si no tienes una copia.")) return;
  var subido = datos.ajustes.subidoA;
  datos = vacio(); datos.ajustes.subidoA = subido; guardar(); render();
  opsEnVuelo = {};
  if (nube.user) borrarNube().then(function () { aviso("Datos borrados", "trash-2"); }).catch(errNube); else aviso("Datos borrados", "trash-2");
}

/* ---------- Eventos ---------- */
document.addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-tab],[data-acc],[data-diario],[data-semanal],[data-prog]"); if (!b) return;
  if (b.dataset.tab) { irA(b.dataset.tab); return; }
  if (b.dataset.diario) { alternarDiario(b); return; }
  if (b.dataset.semanal) { alternarSemanal(b); return; }
  if (b.dataset.prog) { progSec = b.dataset.prog; render(); var t = $("[data-prog=\"" + progSec + "\"]"); if (t) t.focus(); return; }
  var acc = b.dataset.acc, s = hoy();
  if (acc === "abrir") abrirSesion(b.dataset.id, b.dataset.f || null);
  else if (acc === "cerrar") cerrarSesion(false);
  else if (acc === "guardar-sesion") guardarSesion();
  else if (acc === "repetir") repetirPesos(b.dataset.ej);
  else if (acc === "timer") iniciarTimer(+b.dataset.seg);
  else if (acc === "timer-mas") { timer.fin += 30000; timer.total += 30; if (!timer.id) { timer.id = setInterval(tick, 250); $("#timer").hidden = false; $("#timer").classList.remove("fin"); } tick(); }
  else if (acc === "timer-parar") pararTimer();
  else if (acc === "guardar-peso") guardarPeso(s, numero($("#peso-hoy").value));
  else if (acc === "guardar-peso2") guardarPeso($("#peso-fecha").value || s, numero($("#peso-kg").value));
  else if (acc === "borrar-peso") { datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== b.dataset.f; }); nubeDel("pesos", b.dataset.f); guardar(); render(); }
  else if (acc === "guardar-cintura") guardarCintura(s);
  else if (acc === "borrar-cintura") { datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== b.dataset.f; }); nubeDel("cinturas", b.dataset.f); guardar(); render(); }
  else if (acc === "guardar-medidas") guardarMedidas(s);
  else if (acc === "borrar-medida") { if (confirm("¿Borrar las medidas del " + bonita(b.dataset.f) + "?")) { datos.medidas = datos.medidas.filter(function (x) { return x.fecha !== b.dataset.f; }); nubeDel("medidas", b.dataset.f); guardar(); render(); } }
  else if (acc === "borrar-registro") { if (confirm("¿Borrar esta sesión del historial?")) { datos.registros = datos.registros.filter(function (r) { return !(r.fecha === b.dataset.f && r.sesion === b.dataset.id); }); nubeRegDel(b.dataset.f, b.dataset.id); guardar(); render(); } }
  else if (acc === "exportar") exportar();
  else if (acc === "importar") $("#archivo").click();
  else if (acc === "borrar-todo") borrarTodo();
  else if (acc === "cuenta") { if (nube.user) { progSec = "cuenta"; irA("progreso"); } else entrar(); }
  else if (acc === "entrar") entrar();
  else if (acc === "sin-cuenta") { modoSesion("local"); pantallaInicio("oculto"); render(); }
  else if (acc === "salir") salir();
  else if (acc === "copiar-uid") { if (navigator.clipboard) navigator.clipboard.writeText(nube.user.uid).then(function () { aviso("Código copiado", "copy"); }); }
  else if (acc === "elegir-foto") $("#foto-archivo").click();
  else if (acc === "borrar-foto") { if (confirm("¿Borrar esta foto?")) nube.F.deleteDoc(nube.F.doc(nube.db, "usuarios", nube.user.uid, "fotos", b.dataset.id)).catch(errNube); }
  else if (acc === "instalar" && avisoInstalar) { avisoInstalar.prompt(); avisoInstalar.userChoice.finally(function () { avisoInstalar = null; render(); }); }
});
document.addEventListener("change", function (ev) {
  var t = ev.target, s = hoy();
  if (t.hasAttribute("data-sueno")) { var dd = datos.diario[s] = datos.diario[s] || {}; dd.sueno = +t.value; nubeSet({ diario: o(s, { sueno: +t.value }) }); guardar(); }
  else if (t.hasAttribute("data-ej-sel")) { ejSel = t.value; render(); }
  else if (t.hasAttribute("data-hist")) { histSel = t.value; render(); }
  else if (t.dataset.cmp) { if (t.dataset.cmp === "a") cmpA = t.value; else cmpB = t.value; render(); }
  else if (t.id === "foto-archivo" && t.files && t.files[0]) { subirFoto(t.files[0]); t.value = ""; }
  else if (t.id === "archivo" && t.files && t.files[0]) { importar(t.files[0]); t.value = ""; }
});
document.addEventListener("input", function (ev) {
  var t = ev.target;
  if (t.hasAttribute("data-sueno")) $("#sueno-val").textContent = t.value + "/10";
  if (abierta && panel.contains(t) && (t.dataset.ej || t.id === "nota-sesion")) { guardarBorrador(); if (t.dataset.ej) actualizarProgreso(); }
});
document.addEventListener("keydown", function (ev) {
  if (ev.key === "Enter" && ev.target.matches && ev.target.matches("input[type=number]")) {
    var id = ev.target.id;
    if (id === "peso-hoy") { ev.preventDefault(); guardarPeso(hoy(), numero(ev.target.value)); }
    else if (id === "peso-kg") { ev.preventDefault(); guardarPeso($("#peso-fecha").value || hoy(), numero(ev.target.value)); }
    else if (id === "cintura-cm") { ev.preventDefault(); guardarCintura(hoy()); }
  }
  if (ev.key === "Escape" && abierta) cerrarSesion(false);
});
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState !== "visible") return;
  if (abierta) pedirPantalla();
  if (timer.id) tick();
  if (!abierta && hoy() !== ultimoDia) render();
});
