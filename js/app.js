"use strict";
var CLAVE = "rutina-v1";
var DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
var DCORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
var ESFUERZO = { rir2: "Deja 1-2 reps en reserva", rir1: "Deja 1 rep en reserva", fallo: "Al fallo, técnica limpia", "fallo+": "Al fallo + extra", duro: "Hasta que el agarre casi se suelte" };
var ORDEN = PLAN.sesiones.map(function (s) { return s.id; });

/* ---------- Utilidades ---------- */
function $(sel, raiz) { return (raiz || document).querySelector(sel); }
function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
function lista(items) { return "<ul class=\"chico\">" + items.map(function (t) { return "<li>" + md(t) + "</li>"; }).join("") + "</ul>"; }
function tarjeta(titulo, cuerpo, ancho) { return "<div class=\"tarjeta" + (ancho ? " ancho" : "") + "\"><h2>" + esc(titulo) + "</h2>" + cuerpo + "</div>"; }
function numero(v) { if (v == null || v === "") return null; var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; }
function fmt(n, d) { if (n == null || !isFinite(n)) return "–"; var f = Math.pow(10, d || 0); return String(Math.round(n * f) / f); }
function v(x) { return x == null ? "" : x; }
function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }

/* ---------- Fechas (hora local del celular) ---------- */
function pad(n) { return (n < 10 ? "0" : "") + n; }
function aTexto(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function aFecha(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function sumarDias(s, n) { var d = aFecha(s); d.setDate(d.getDate() + n); return aTexto(d); }
function diasEntre(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 86400000); }
function diaSemana(s) { return (aFecha(s).getDay() + 6) % 7; }
function lunesDe(s) { return sumarDias(s, -diaSemana(s)); }
function bonita(s) { var d = aFecha(s); return d.getDate() + " " + MESES[d.getMonth()]; }
function hoy() {
  var q = new URLSearchParams(location.search).get("fecha");
  return (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) ? q : aTexto(new Date());
}

/* ---------- Datos guardados ---------- */
function vacio() { return { version: 1, registros: [], borradores: {}, pesos: [], cinturas: [], medidas: [], diario: {}, semanal: {}, ajustes: {} }; }
function normalizar(d) {
  var base = vacio();
  for (var k in base) if (d[k] === undefined || d[k] === null) d[k] = base[k];
  d.registros.sort(porFecha); d.pesos.sort(porFecha); d.cinturas.sort(porFecha); d.medidas.sort(porFecha);
  return d;
}
function porFecha(a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; }
function cargar() {
  try { var t = localStorage.getItem(CLAVE); return t ? normalizar(JSON.parse(t)) : vacio(); }
  catch (e) { return vacio(); }
}
var datos = cargar();
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch (e) { aviso("No se pudo guardar en este navegador."); }
}

/* ---------- Fases ---------- */
function faseDe(s) {
  for (var i = 0; i < PLAN.fases.length; i++) { var f = PLAN.fases[i]; if (s >= f.desde && s <= f.hasta) return f; }
  return s < PLAN.fases[0].desde ? PLAN.fases[0] : PLAN.fases[PLAN.fases.length - 1];
}
function semanaDef(s) {
  var n = 0;
  for (var i = 0; i < PLAN.fases.length; i++) {
    var f = PLAN.fases[i]; if (!f.def) continue;
    if (s > f.hasta) { n += Math.ceil((diasEntre(f.desde, f.hasta) + 1) / 7); continue; }
    if (s >= f.desde) return n + Math.floor(diasEntre(f.desde, s) / 7) + 1;
  }
  return 0;
}
function enDescarga(s) { for (var i = 0; i < PLAN.descargas.length; i++) { var d = PLAN.descargas[i]; if (s >= d.desde && s <= d.hasta) return d; } return null; }
function diaEspecial(s) { for (var i = 0; i < PLAN.diasMantenimiento.length; i++) if (PLAN.diasMantenimiento[i].fecha === s) return PLAN.diasMantenimiento[i]; return null; }
function esSemana0(s) { return faseDe(s).id === "s0"; }

/* ---------- Que toca hoy ---------- */
function sesion(id) { for (var i = 0; i < PLAN.sesiones.length; i++) if (PLAN.sesiones[i].id === id) return PLAN.sesiones[i]; return null; }
function hechasEnSemana(lunes) {
  var fin = sumarDias(lunes, 6), h = {};
  datos.registros.forEach(function (r) { if (r.fecha >= lunes && r.fecha <= fin && !h[r.sesion]) h[r.sesion] = r.fecha; });
  return h;
}
function sugerir(s) {
  var dow = diaSemana(s), hechas = hechasEnSemana(lunesDe(s)), hechaHoy = null;
  for (var id in hechas) if (hechas[id] === s) hechaHoy = id;
  if (dow === 6) return { descanso: true, hechas: hechas, plan: [], salta: [] };
  var dias = 6 - dow - (hechaHoy ? 1 : 0);
  var plan = ORDEN.filter(function (x) { return !hechas[x]; }), salta = [], exceso = plan.length - dias, i;
  for (i = plan.length - 1; i >= 0 && exceso > 0; i--) if (sesion(plan[i]).saltable) { salta.unshift(plan[i]); plan.splice(i, 1); exceso--; }
  for (i = plan.length - 1; i >= 0 && exceso > 0; i--) { salta.unshift(plan[i]); plan.splice(i, 1); exceso--; }
  return { descanso: false, hechas: hechas, hechaHoy: hechaHoy, plan: plan, salta: salta, siguiente: plan[0] || null };
}

/* ---------- Ejercicios: historial y sugerencias ---------- */
function ultimaVez(exId, antesDe) {
  for (var i = datos.registros.length - 1; i >= 0; i--) {
    var r = datos.registros[i]; if (r.fecha >= antesDe) continue;
    var sets = r.ej && r.ej[exId];
    if (sets && sets.some(function (x) { return x.kg != null || x.reps != null; })) return { fecha: r.fecha, sets: sets };
  }
  return null;
}
function maxKg(sets) { var m = 0; sets.forEach(function (x) { if (x.kg > m) m = x.kg; }); return m; }
function subirPeso(ej, ult) {
  if (!ult) return null;
  var ok = ult.sets.filter(function (x) { return x.reps != null; });
  if (ok.length < ej.s || !ok.every(function (x) { return x.reps >= ej.r[1]; })) return null;
  return maxKg(ok) + (ej.inc || 2.5);
}
function redondear(kg, tipo) { var r = Math.round(kg / 2.5) * 2.5; return (tipo === "barra" || tipo === "pm") ? Math.max(20, r) : Math.max(2.5, r); }
function aproximacion(ej, base) {
  if (!ej.a) return "";
  var esquema = ej.a === "pm" ? [[0.5, 5], [0.7, 3], [0.85, 1]] : ej.a === "mancuerna" ? [[0.5, 8], [0.75, 3]] : [[0.5, 8], [0.7, 4], [0.85, 2]];
  if (!base) return "Aproximación: " + (ej.a === "barra" ? "barra sola × 10, luego " : "") + esquema.map(function (p) { return "≈" + p[0] * 100 + "% × " + p[1]; }).join(", ") + " de tu peso de trabajo. Cuando anotes tu primera sesión, la página te pone los kilos.";
  var partes = ej.a === "barra" ? ["barra × 10"] : [];
  esquema.forEach(function (p) { partes.push(redondear(base * p[0], ej.a) + " × " + p[1]); });
  return "Aproximación para " + base + " kg: " + partes.join(" · ");
}
function esfuerzoDe(ej, s) { return esSemana0(s) ? "Deja 2-3 reps en reserva" : (ESFUERZO[ej.e] || ""); }
function seriesDe(ej, s) { return ej.s; }

/* ---------- Pestanas ---------- */
var actual = "hoy";
function irA(tab) {
  actual = tab;
  $$(".tab").forEach(function (t) { t.classList.toggle("activa", t.id === "tab-" + tab); });
  $$(".nav button").forEach(function (b) { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  render(); window.scrollTo(0, 0);
}
var ultimoDia = hoy();
function render() {
  var s = hoy(), f = faseDe(s), d = enDescarga(s);
  ultimoDia = s;
  $("#pill").textContent = (f.def ? f.corto + " · S" + semanaDef(s) + "/" + PLAN.semanasDefinicion : f.corto) + "";
  var html = { hoy: htmlHoy, rutina: htmlRutina, dieta: htmlDieta, progreso: htmlProgreso, guia: htmlGuia }[actual]();
  $("#tab-" + actual).innerHTML = html;
  pintarCuenta();
}

function htmlMetas(f, s) {
  var esp = diaEspecial(s);
  var kcal = esp ? PLAN.kcalMantenimiento : (f.kcalTexto || f.kcal);
  return "<div class=\"metas\">" +
    "<div class=\"meta\"><b>" + kcal + "</b><span>kcal</span></div>" +
    "<div class=\"meta\"><b>" + f.p + " g</b><span>proteína</span></div>" +
    "<div class=\"meta\"><b>" + (f.g ? f.g + " g" : "–") + "</b><span>grasa</span></div>" +
    "<div class=\"meta\"><b>" + (f.c ? f.c + " g" : "–") + "</b><span>carbos</span></div></div>";
}

/* ---------- HOY ---------- */
function htmlHoy() {
  var s = hoy(), f = faseDe(s), sug = sugerir(s), desc = enDescarga(s), esp = diaEspecial(s);
  var h = "<div class=\"tarjeta\"><div class=\"fila entre\"><h2>" + esc(f.nombre) + "</h2><span class=\"suave chico\">" + bonita(f.desde) + (f.hasta < "2099" ? " – " + bonita(f.hasta) : " →") + "</span></div>" +
    (f.def ? "<p class=\"chico suave\">Semana " + semanaDef(s) + " de " + PLAN.semanasDefinicion + " de definición</p>" : "") +
    htmlMetas(f, s) + "<p class=\"chico\">" + esc(f.nota) + "</p>" +
    (desc ? "<p class=\"aviso\">Semana de " + esc(desc.nombre) + ": si faltas por las fiestas, no pasa nada. Descarga solo si te sientes muy cansado o te duelen los tendones (mismos pesos, 1 serie menos, 2-3 reps en reserva).</p>" : "") +
    (esp ? "<p class=\"aviso\">" + esc(esp.nombre) + ": hoy comes a mantenimiento (≈" + PLAN.kcalMantenimiento + " kcal). Mañana vuelves al plan.</p>" : "") + "</div>";

  h = htmlAvisoNube() + h;
  h += "<div class=\"tarjeta destacada\">";
  if (sug.descanso) {
    var n = Object.keys(sug.hechas).length;
    h += "<h2>Domingo: descanso</h2><p class=\"chico\">Descansa de verdad. Prepara la comida de la semana y mañana, antes de desayunar, mide tu cintura.</p><p class=\"chico suave\">Esta semana hiciste " + n + " de 6 sesiones.</p>";
  } else if (sug.hechaHoy) {
    var hh = sesion(sug.hechaHoy);
    h += "<h2 class=\"ok-txt\">✓ Hoy hiciste " + esc(hh.nombre) + "</h2>" +
      "<p class=\"chico\">" + (sug.siguiente ? "Mañana toca <b>" + esc(sesion(sug.siguiente).nombre) + "</b>." : "Mañana descansas.") + "</p>" +
      "<button class=\"btn sec mini\" data-acc=\"abrir\" data-id=\"" + hh.id + "\">Ver o corregir lo de hoy</button>";
  } else if (sug.siguiente) {
    var t = sesion(sug.siguiente);
    h += "<p class=\"chico suave\" style=\"margin:0\">Hoy te toca</p><h2 style=\"font-size:1.4rem\">" + esc(t.nombre) + "</h2>" +
      "<p class=\"chico suave\">" + esc(t.foco) + " · ≈" + t.min + " min</p>" +
      "<button class=\"btn bloque\" data-acc=\"abrir\" data-id=\"" + t.id + "\">Empezar sesión</button>";
    if (sug.salta.length) h += "<p class=\"chico\" style=\"margin-top:.6rem\">Esta semana ya no alcanza para todo: se salta <b>" + sug.salta.map(function (x) { return esc(sesion(x).nombre); }).join(" y ") + "</b>. Pierna y Torso nunca se saltan.</p>";
  } else {
    h += "<h2>Semana completa 💪</h2><p class=\"chico\">Ya hiciste todas las sesiones. Descansa.</p>";
  }
  h += "<details><summary>Elegir otra sesión</summary><div class=\"fila\" style=\"margin-top:.4rem\">" +
    PLAN.sesiones.map(function (x) { return "<button class=\"btn sec mini\" data-acc=\"abrir\" data-id=\"" + x.id + "\">" + esc(x.nombre) + "</button>"; }).join("") + "</div></details></div>";

  h += "<div class=\"tarjeta\"><h3>Tu semana</h3><div class=\"semana\">" + ORDEN.map(function (id, i) {
    var x = sesion(id), cls = sug.hechas[id] ? "hecha" : (id === sug.siguiente && !sug.hechaHoy && !sug.descanso ? "hoy" : (sug.salta.indexOf(id) >= 0 ? "salta" : ""));
    return "<div class=\"dia " + cls + "\">" + DCORTO[i] + "<b>" + (sug.hechas[id] ? "✓ " : "") + esc(x.corto) + "</b></div>";
  }).join("") + "</div></div>";

  var ya = null; datos.pesos.forEach(function (p) { if (p.fecha === s) ya = p; });
  var pr = promedioSemana(lunesDe(s));
  h += "<div class=\"tarjeta\"><h3>Peso de hoy</h3><div class=\"fila\"><input id=\"peso-hoy\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" placeholder=\"kg\" value=\"" + v(ya && ya.kg) + "\" style=\"max-width:9rem\"><button class=\"btn\" data-acc=\"guardar-peso\">Guardar</button></div>" +
    "<p class=\"chico suave\">Pésate siempre igual: en la balanza del gym, al llegar y antes de entrenar. Lo que cuenta es el promedio de la semana" + (pr ? ": <b>" + fmt(pr.prom, 1) + " kg</b> (" + pr.n + " pesaje" + (pr.n > 1 ? "s" : "") + ")" : "") + ".</p></div>";

  var dd = datos.diario[s] || {};
  h += "<div class=\"tarjeta\"><h3>Hoy</h3><div class=\"checks\">" + PLAN.diario.map(function (it) {
    return "<label><input type=\"checkbox\" data-diario=\"" + it.id + "\"" + (dd[it.id] ? " checked" : "") + "> " + esc(it.txt) + "</label>";
  }).join("") + "</div><label class=\"chico\" style=\"display:block;margin-top:.6rem\">¿Cómo te levantaste hoy? <b id=\"sueno-val\">" + (dd.sueno || "–") + "</b>/10" +
    "<input type=\"range\" min=\"1\" max=\"10\" step=\"1\" value=\"" + (dd.sueno || 5) + "\" data-sueno></label></div>";

  h += htmlMetasSemana(s);
  var ult = datos.ajustes.ultimoRespaldo;
  if (!nube.user && datos.registros.length && (!ult || diasEntre(ult, s) >= 14)) h += "<div class=\"aviso\">Hace " + (ult ? diasEntre(ult, s) + " días" : "rato") + " que no haces respaldo de tus datos. <button class=\"btn sec mini\" data-acc=\"exportar\">Exportar ahora</button></div>";
  return h;
}

function contarSemana(lunes) {
  var hasta = sumarDias(lunes, 6), c = { sesiones: Object.keys(hechasEnSemana(lunes)).length, pesajes: 0, cintura: 0, proteina: 0, creatina: 0, pantalla: 0 };
  datos.pesos.forEach(function (p) { if (p.fecha >= lunes && p.fecha <= hasta) c.pesajes++; });
  datos.cinturas.forEach(function (p) { if (p.fecha >= lunes && p.fecha <= hasta) c.cintura++; });
  for (var i = 0; i < 7; i++) { var d = datos.diario[sumarDias(lunes, i)] || {}; if (d.proteina) c.proteina++; if (d.creatina) c.creatina++; if (d.pantalla) c.pantalla++; }
  return c;
}
function htmlMetasSemana(s) {
  var lunes = lunesDe(s), c = contarSemana(lunes), man = datos.semanal[lunes] || {};
  return "<div class=\"tarjeta\"><h3>Metas de la semana</h3>" + PLAN.metasSemana.map(function (m) {
    if (m.auto) { var val = c[m.auto], ok = val >= m.min; return "<div class=\"meta-sem\"><span>" + (ok ? "✅ " : "⬜ ") + esc(m.txt) + "</span><span class=\"suave\">" + val + "/" + m.min + "</span></div>"; }
    return "<div class=\"meta-sem\"><label class=\"fila\" style=\"flex-wrap:nowrap\"><input type=\"checkbox\" data-semanal=\"" + m.id + "\"" + (man[m.id] ? " checked" : "") + "> " + esc(m.txt) + "</label></div>";
  }).join("") + "</div>";
}

/* ---------- RUTINA ---------- */
function htmlRutina() {
  var h = "<div class=\"tarjeta\"><h2>Tu semana, estilo Arnold</h2><p class=\"chico\">6 días. Cada músculo 2 veces por semana; tus puntos débiles reciben más series (12-16 por semana). Si faltas, la pestaña <b>Hoy</b> te dice qué toca.</p>" +
    lista(["**Mancuernas, máquinas y poleas:** al fallo con técnica limpia.", "**Barra:** 1 rep en reserva (peso muerto 1-2), solo por seguridad.", "Cuando llegues al tope del rango en todas las series, sube peso. La página te avisa."]) + "</div>";
  PLAN.sesiones.forEach(function (x) {
    h += "<div class=\"tarjeta\"><div class=\"fila entre\" style=\"flex-wrap:nowrap\"><div><h3>" + DIAS[x.dia] + " · " + esc(x.nombre) + "</h3><p class=\"chico suave\">" + esc(x.foco) + " · ≈" + x.min + " min" + (x.saltable ? " · se salta primero si faltas" : "") + "</p></div>" +
      "<button class=\"btn mini\" data-acc=\"abrir\" data-id=\"" + x.id + "\">Abrir</button></div><ol class=\"chico\">" +
      x.ej.map(function (e) { return "<li>" + esc(e.n) + " <span class=\"suave\">" + e.s + " × " + e.r[0] + "-" + e.r[1] + (e.u ? " " + e.u : "") + (e.opc ? " · opcional" : "") + "</span></li>"; }).join("") + "</ol></div>";
  });
  return h;
}

/* ---------- SESION (panel) ---------- */
var abierta = null, guardarTimeout = null;
var panel = $("#panel");
function abrirSesion(id) {
  var s = hoy(), x = sesion(id); if (!x) return;
  abierta = id;
  var reg = null; datos.registros.forEach(function (r) { if (r.fecha === s && r.sesion === id) reg = r; });
  var bor = datos.borradores[id]; if (bor && bor.fecha !== s) { delete datos.borradores[id]; bor = null; guardar(); }
  var valores = (bor && bor.ej) || (reg && reg.ej) || {}, nota = (bor && bor.nota) || (reg && reg.nota) || "";
  var principales = x.ej.filter(function (e) { return !e.opc; }), extra = x.ej.filter(function (e) { return e.opc; });
  var h = "<div class=\"panel-top\"><button class=\"btn sec mini\" data-acc=\"cerrar\" aria-label=\"Volver\">← Volver</button><div><b>" + esc(x.nombre) + "</b><span class=\"chico suave\">" + esc(x.foco) + " · ≈" + x.min + " min</span></div></div><div class=\"panel-cuerpo\">";
  if (esSemana0(s)) h += "<p class=\"aviso\">Semana 0: deja 2-3 reps en reserva en todo. Encuentra tus pesos y anótalos.</p>";
  if (enDescarga(s)) h += "<p class=\"aviso\">Semana de " + esc(enDescarga(s).nombre) + ": entrena normal si puedes. Descarga solo si estás muy cansado o con molestias.</p>";
  if (reg) h += "<p class=\"chico ok-txt\">Ya guardaste esta sesión hoy. Si cambias algo, vuelve a guardar.</p>";
  h += "<details class=\"tarjeta\"><summary>Calentamiento (5-7 min)</summary><p class=\"chico\">" + esc(PLAN.calentamiento[x.cal]) + "</p></details>";
  h += principales.map(function (e, i) { return htmlEjercicio(e, i + 1, s, valores); }).join("");
  if (extra.length) h += "<h3 style=\"margin-top:1.2rem\">Extra</h3><p class=\"chico suave\">" + esc(x.notaExtra || "") + "</p>" + extra.map(function (e, i) { return htmlEjercicio(e, principales.length + i + 1, s, valores); }).join("");
  h += "<label class=\"tarjeta\"><span class=\"chico suave\">Fecha de la sesión</span><input type=\"date\" id=\"fecha-sesion\" value=\"" + s + "\" max=\"" + s + "\"></label>";
  h += "<label class=\"tarjeta\"><span class=\"chico suave\">Nota (opcional): cómo te sentiste, molestias…</span><textarea id=\"nota-sesion\" rows=\"2\">" + esc(nota) + "</textarea></label>";
  h += "</div><div class=\"barra-guardar\"><button class=\"btn bloque\" data-acc=\"guardar-sesion\">Guardar sesión ✔</button></div>";
  panel.innerHTML = h; panel.hidden = false; panel.scrollTop = 0;
  document.body.classList.add("con-panel");
  history.pushState({ panel: id }, "");
  pedirPantalla();
}
function htmlEjercicio(e, num, s, valores) {
  var ult = ultimaVez(e.id, s), bloqueo = esSemana0(s);
  var sube = bloqueo ? null : subirPeso(e, ult), n = seriesDe(e, s), vals = valores[e.id] || [];
  var base = sube || (ult ? maxKg(ult.sets) : 0), kgL = e.kgL || "kg", u = e.u || "reps";
  var filas = "<div class=\"serie cab\"><span></span><span>" + esc(kgL) + "</span><span>" + esc(u) + "</span><span></span></div>";
  for (var k = 0; k < n; k++) {
    var val = vals[k] || {}, ph = ult && ult.sets[k] ? ult.sets[k] : {};
    filas += "<div class=\"serie\"><span class=\"l\">S" + (k + 1) + "</span>" +
      "<input type=\"number\" inputmode=\"decimal\" step=\"0.5\" min=\"0\" data-ej=\"" + e.id + "\" data-k=\"" + k + "\" data-c=\"kg\" value=\"" + v(val.kg) + "\" placeholder=\"" + v(ph.kg) + "\" aria-label=\"Serie " + (k + 1) + " " + esc(kgL) + "\">" +
      "<input type=\"number\" inputmode=\"numeric\" step=\"1\" min=\"0\" data-ej=\"" + e.id + "\" data-k=\"" + k + "\" data-c=\"reps\" value=\"" + v(val.reps) + "\" placeholder=\"" + v(ph.reps) + "\" aria-label=\"Serie " + (k + 1) + " " + esc(u) + "\">" +
      "<button type=\"button\" class=\"btn sec\" data-acc=\"timer\" data-seg=\"" + e.d + "\" aria-label=\"Descanso " + mmss(e.d) + "\">⏱</button></div>";
  }
  return "<div class=\"tarjeta\"><div class=\"ej-cab\"><span class=\"num\">" + num + "</span><div><h3>" + esc(e.n) + "</h3><div class=\"tags\">" +
    "<span class=\"tag f\">" + n + " × " + e.r[0] + "-" + e.r[1] + " " + esc(u) + "</span><span class=\"tag\">" + esc(esfuerzoDe(e, s)) + "</span><span class=\"tag\">Descanso " + mmss(e.d) + "</span></div></div></div>" +
    (e.x ? "<p class=\"chico\" style=\"color:var(--acento-2)\">" + esc(e.x) + "</p>" : "") +
    (ult ? "<p class=\"chico suave\">Última vez (" + bonita(ult.fecha) + "): " + ult.sets.map(function (x) { return v(x.kg === null ? "–" : x.kg) + "×" + v(x.reps === null ? "–" : x.reps); }).join(" · ") + "</p>" : "<p class=\"chico suave\">Primera vez: anota con qué peso empiezas.</p>") +
    (sube ? "<p class=\"chico ok-txt\">💪 La vez pasada llegaste al tope en todas: hoy prueba con " + sube + " kg.</p>" : "") +
    (e.a ? "<p class=\"chico\">" + esc(aproximacion(e, base)) + "</p>" : "") +
    "<div class=\"series\">" + filas + "</div>" +
    "<details><summary>Técnica" + (e.alt ? " y alternativa" : "") + "</summary><p class=\"chico\">" + esc(e.tip) + "</p>" + (e.alt ? "<p class=\"chico\"><b>Si molesta o está ocupada:</b> " + esc(e.alt) + "</p>" : "") + "</details></div>";
}
function recolectar() {
  var ej = {};
  $$("input[data-ej]", panel).forEach(function (inp) {
    var id = inp.dataset.ej, k = +inp.dataset.k;
    if (!ej[id]) ej[id] = [];
    if (!ej[id][k]) ej[id][k] = { kg: null, reps: null };
    ej[id][k][inp.dataset.c] = numero(inp.value);
  });
  return ej;
}
function limpiar(ej) {
  var out = {};
  for (var id in ej) {
    var sets = ej[id].filter(function (x) { return x && (x.kg != null || x.reps != null); });
    if (sets.length) out[id] = sets;
  }
  return out;
}
function guardarBorrador() {
  if (!abierta) return;
  datos.borradores[abierta] = { fecha: hoy(), ej: recolectar(), nota: $("#nota-sesion", panel).value };
  clearTimeout(guardarTimeout); guardarTimeout = setTimeout(guardar, 300);
}
function guardarSesion() {
  var ej = limpiar(recolectar()), fecha = $("#fecha-sesion", panel).value || hoy(), nota = $("#nota-sesion", panel).value.trim();
  if (fecha > hoy()) fecha = hoy();
  if (!Object.keys(ej).length && !confirm("No anotaste ninguna serie. ¿Marcar la sesión como hecha igual?")) return;
  datos.registros = datos.registros.filter(function (r) { return !(r.fecha === fecha && r.sesion === abierta); });
  var reg = { fecha: fecha, sesion: abierta, ej: ej, nota: nota };
  datos.registros.push(reg);
  datos.registros.sort(porFecha);
  nubeReg(reg);
  delete datos.borradores[abierta];
  guardar(); aviso("Sesión guardada ✔");
  cerrarSesion(false); irA("hoy");
}
function cerrarSesion(desdeHistorial) {
  if (!abierta) return;
  abierta = null; panel.hidden = true; panel.innerHTML = "";
  document.body.classList.remove("con-panel");
  pararTimer(); soltarPantalla();
  if (!desdeHistorial && history.state && history.state.panel) history.back();
  render();
}
window.addEventListener("popstate", function () { if (abierta) cerrarSesion(true); });

/* ---------- Temporizador de descanso ---------- */
var timer = { fin: 0, total: 1, id: null }, audio = null;
function iniciarTimer(seg) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (e) { audio = null; }
  timer.fin = Date.now() + seg * 1000; timer.total = seg;
  clearInterval(timer.id); timer.id = setInterval(tick, 250);
  $("#timer").hidden = false; tick();
}
function tick() {
  var resta = Math.max(0, Math.ceil((timer.fin - Date.now()) / 1000));
  $("#timer-num").textContent = mmss(resta);
  $("#timer-barra").style.width = (100 * (1 - resta / timer.total)) + "%";
  if (resta <= 0) {
    clearInterval(timer.id); timer.id = null;
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    pitido(); $("#timer-num").textContent = "¡Dale!";
    setTimeout(function () { if (!timer.id) $("#timer").hidden = true; }, 4000);
  }
}
function pararTimer() { clearInterval(timer.id); timer.id = null; $("#timer").hidden = true; }
function pitido() {
  if (!audio) return;
  try {
    [0, 0.35].forEach(function (t0) {
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + t0;
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t); o.stop(t + 0.3);
    });
  } catch (e) {}
}
var bloqueoPantalla = null;
function pedirPantalla() { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (l) { bloqueoPantalla = l; }).catch(function () {}); }
function soltarPantalla() { if (bloqueoPantalla) { bloqueoPantalla.release().catch(function () {}); bloqueoPantalla = null; } }

/* ---------- DIETA ---------- */
function htmlDieta() {
  var s = hoy(), f = faseDe(s), D = PLAN.dieta, filas = "", tk = 0, tp = 0;
  D.dia.forEach(function (c) {
    filas += "<tr class=\"sub\"><th colspan=\"3\">" + esc(c.comida) + "</th></tr>";
    c.items.forEach(function (it) { tk += it[2]; tp += it[3]; filas += "<tr><td>" + esc(it[0]) + "<br><span class=\"suave\">" + esc(it[1]) + "</span></td><td class=\"n\">" + it[2] + "</td><td class=\"n\">" + it[3] + " g</td></tr>"; });
  });
  var h = "<div class=\"tarjeta destacada\"><h2>Tu meta hoy · " + esc(f.corto) + "</h2>" + htmlMetas(f, s) + "<p class=\"chico\">" + esc(D.intro) + "</p></div>";
  h += tarjeta("Reglas simples", lista(D.reglas));
  h += "<div class=\"tarjeta\"><h2>Un día de ejemplo (definición)</h2><p class=\"chico suave\">Cambia alimentos con las equivalencias de abajo.</p><table class=\"tabla\"><thead><tr><th>Alimento</th><th class=\"n\">kcal</th><th class=\"n\">Prot.</th></tr></thead><tbody>" + filas + "</tbody><tfoot><tr><td>Total</td><td class=\"n\">≈" + tk + "</td><td class=\"n\">≈" + tp + " g</td></tr></tfoot></table><p class=\"chico\">" + esc(D.mantenimiento) + "</p></div>";
  h += tarjeta("Si compras el almuerzo", lista(D.almuerzoComprado));
  h += tarjeta("Después del gym (opcional)", "<p class=\"chico\">" + esc(D.postEntreno) + "</p>");
  h += tarjeta("Meriendas para la tarde", lista(D.meriendas));
  h += "<div class=\"tarjeta\"><h2>Comer fuera</h2><p class=\"chico\">" + esc(D.fueraIntro) + "</p>" + D.fuera.map(function (x) {
    return "<div class=\"fuera\"><h3>" + esc(x.lugar) + "</h3><p class=\"chico\"><b class=\"ok-txt\">Sí:</b> " + esc(x.si) + "</p><p class=\"chico\"><b class=\"mal-txt\">Mejor no:</b> " + esc(x.no) + "</p></div>";
  }).join("") + "</div>";
  h += "<div class=\"tarjeta\"><h2>Equivalencias</h2>" + D.equivalencias.map(function (g) { return "<h3>" + esc(g.grupo) + "</h3>" + lista(g.items); }).join("") + "</div>";
  h += tarjeta("Si te da hambre", lista(D.hambre));
  h += tarjeta("Fiestas", lista(D.fiestas));
  h += tarjeta("Lista de compras (por semana, aprox.)", lista(D.compras));
  return h;
}

/* ---------- PROGRESO ---------- */
function promedioSemana(lunes) {
  var hasta = sumarDias(lunes, 6), xs = datos.pesos.filter(function (p) { return p.fecha >= lunes && p.fecha <= hasta; });
  if (!xs.length) return null;
  return { lunes: lunes, prom: xs.reduce(function (a, p) { return a + p.kg; }, 0) / xs.length, n: xs.length };
}
function promediosSemanales() {
  var vistos = {}, out = [];
  datos.pesos.forEach(function (p) { var l = lunesDe(p.fecha); if (!vistos[l]) { vistos[l] = 1; out.push(promedioSemana(l)); } });
  return out.sort(function (a, b) { return a.lunes < b.lunes ? -1 : 1; });
}
function htmlAjuste() {
  var s = hoy(), sem = promediosSemanales().filter(function (w) { return w.lunes < lunesDe(s) && w.n >= 2; });
  if (sem.length < 3) return "<p class=\"chico suave\">Con 3 semanas completas (2 pesajes o más cada una) te digo si hay que ajustar calorías.</p>";
  var u = sem.slice(-3);
  if (!faseDe(u[1].lunes).def || !faseDe(u[2].lunes).def) return "<p class=\"chico suave\">Ajuste: solo se calcula con semanas de definición.</p>";
  if (semanaDef(u[2].lunes) < 3) return "<p class=\"chico suave\">Las 2 primeras semanas de definición la balanza baila por agua y creatina. El ajuste empieza en la semana 3.</p>";
  var cambio = (u[2].prom - u[0].prom) / 2;
  if (cambio > -0.25) return "<p class=\"aviso\">Bajas lento (" + fmt(cambio, 2) + " kg/sem). Quita unas 150 kcal (el pan del desayuno, o 50 g de arroz en cada comida) o agrega 20 min de caminata 3 veces por semana.</p>";
  if (cambio < -0.9) return "<p class=\"aviso\">Bajas muy rápido (" + fmt(cambio, 2) + " kg/sem). Agrega unas 150 kcal (1 pan o 50 g más de arroz al día) para cuidar el músculo.</p>";
  return "<p class=\"chico ok-txt\">✓ Vas en el ritmo correcto (" + fmt(cambio, 2) + " kg/sem). No cambies nada.</p>";
}
function linea(serie, o) {
  o = o || {};
  if (serie.length < 2) return "<p class=\"chico suave\">" + esc(o.vacio || "Con 2 datos o más aparece la gráfica.") + "</p>";
  var extra = o.puntos || [], vs = serie.concat(extra).map(function (p) { return p.v; });
  var min = Math.min.apply(null, vs), max = Math.max.apply(null, vs), pad = Math.max(o.pad || 0.5, (max - min) * 0.15);
  min -= pad; max += pad;
  var desde = o.desde || serie[0].fecha, hasta = o.hasta || serie[serie.length - 1].fecha, span = Math.max(1, diasEntre(desde, hasta));
  var W = 320, H = 140, L = 36, R = 8, T = 10, B = 22;
  function x(f) { return L + Math.max(0, Math.min(span, diasEntre(desde, f))) / span * (W - L - R); }
  function y(val) { return T + (1 - (val - min) / (max - min)) * (H - T - B); }
  var pl = serie.map(function (p) { return x(p.fecha).toFixed(1) + "," + y(p.v).toFixed(1); }).join(" ");
  var marcas = o.marcas ? serie.map(function (p) { return "<circle cx=\"" + x(p.fecha).toFixed(1) + "\" cy=\"" + y(p.v).toFixed(1) + "\" r=\"2.5\" fill=\"#ffb35c\"/>"; }).join("") : "";
  var pts = extra.map(function (p) { return "<circle cx=\"" + x(p.fecha).toFixed(1) + "\" cy=\"" + y(p.v).toFixed(1) + "\" r=\"4\" fill=\"#ff7a33\"/>"; }).join("");
  return "<svg class=\"grafico\" viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"" + esc(o.titulo || "Gráfica") + "\">" +
    "<line x1=\"" + L + "\" y1=\"" + (H - B) + "\" x2=\"" + (W - R) + "\" y2=\"" + (H - B) + "\" stroke=\"#2a2f3a\"/>" +
    "<text x=\"2\" y=\"" + (T + 8) + "\" fill=\"#9ba3af\" font-size=\"10\">" + fmt(max, 1) + "</text><text x=\"2\" y=\"" + (H - B) + "\" fill=\"#9ba3af\" font-size=\"10\">" + fmt(min, 1) + "</text>" +
    "<text x=\"" + L + "\" y=\"" + (H - 6) + "\" fill=\"#9ba3af\" font-size=\"10\">" + bonita(desde) + "</text><text x=\"" + (W - R) + "\" y=\"" + (H - 6) + "\" fill=\"#9ba3af\" font-size=\"10\" text-anchor=\"end\">" + bonita(hasta) + "</text>" +
    "<polyline points=\"" + pl + "\" fill=\"none\" stroke=\"#9ba3af\" stroke-width=\"1.5\"/>" + marcas + pts + "</svg>";
}
function grafico() {
  var desde = sumarDias(hoy(), -62);
  var serie = datos.pesos.filter(function (p) { return p.fecha >= desde; }).map(function (p) { return { fecha: p.fecha, v: p.kg }; });
  var prom = promediosSemanales().filter(function (w) { return w.lunes >= sumarDias(desde, -3); }).map(function (w) { var f = sumarDias(w.lunes, 3); return { fecha: f < desde ? desde : f, v: w.prom }; });
  if (serie.length < 2) return "<p class=\"chico suave\">Con 2 pesajes o más aparece aquí la gráfica.</p>";
  return linea(serie, { desde: desde, hasta: hoy(), puntos: prom, titulo: "Peso de las últimas 9 semanas" }) + "<p class=\"chico suave\">Línea: cada pesaje. Puntos naranjas: promedio de la semana.</p>";
}
var CAMPOS = [
  ["peso", "Peso (kg)"], ["cintura", "Cintura, a la altura del ombligo"], ["cuello", "Cuello, bajo la manzana de Adán"], ["cadera", "Cadera, parte más ancha"],
  ["pecho", "Pecho, a la altura de los pezones"], ["brazoRel", "Brazo relajado"], ["brazoCon", "Brazo contraído"], ["antebrazo", "Antebrazo, puño cerrado"],
  ["muslo", "Muslo, parte más gruesa"], ["pantorrilla", "Pantorrilla, parte más gruesa"], ["muneca", "Muñeca, entre la mano y el huesito"],
  ["tobillo", "Tobillo, parte más delgada"], ["estatura", "Estatura (cm)"]
];
function ultimoValor(campo) { for (var i = datos.medidas.length - 1; i >= 0; i--) { var x = datos.medidas[i][campo]; if (x != null) return x; } return null; }
function pesoActual() { var m = ultimoValor("peso"); if (datos.pesos.length) { var p = datos.pesos[datos.pesos.length - 1]; return p.kg; } return m; }
function htmlProgreso() {
  var s = hoy(), sem = promediosSemanales().slice(-10);
  var h = htmlCuenta();
  h += "<div class=\"tarjeta ancho\"><h2>Peso</h2><div class=\"fila\"><input id=\"peso-fecha\" type=\"date\" value=\"" + s + "\" max=\"" + s + "\" style=\"max-width:11rem\"><input id=\"peso-kg\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" placeholder=\"kg\" style=\"max-width:7rem\"><button class=\"btn\" data-acc=\"guardar-peso2\">Guardar</button></div>" + grafico();
  if (sem.length) {
    h += "<div class=\"scroll\"><table class=\"tabla\"><thead><tr><th>Semana del</th><th class=\"n\">Promedio</th><th class=\"n\">Cambio</th></tr></thead><tbody>";
    sem.forEach(function (w, i) {
      var prev = i > 0 ? sem[i - 1] : null, ch = prev ? w.prom - prev.prom : null, f = faseDe(w.lunes), est = "";
      if (ch != null && f.def) est = ch > -0.25 ? " · lento" : ch < -0.9 ? " · rápido" : " · ✓";
      h += "<tr><td>" + bonita(w.lunes) + " <span class=\"suave\">(" + w.n + ")</span></td><td class=\"n\">" + fmt(w.prom, 1) + " kg</td><td class=\"n\">" + (ch == null ? "–" : (ch > 0 ? "+" : "") + fmt(ch, 2)) + est + "</td></tr>";
    });
    h += "</tbody></table></div>";
  }
  h += htmlAjuste();
  h += "<details><summary>Pesajes anotados</summary>" + datos.pesos.slice(-21).reverse().map(function (p) { return "<div class=\"meta-sem\"><span>" + bonita(p.fecha) + "</span><span>" + p.kg + " kg <button class=\"borrar\" data-acc=\"borrar-peso\" data-f=\"" + p.fecha + "\" aria-label=\"Borrar\">×</button></span></div>"; }).join("") + "</details></div>";

  h += htmlFuerza();

  var cint = datos.cinturas.map(function (c) { return { fecha: c.fecha, v: c.cm }; });
  h += "<div class=\"tarjeta\"><h2>Cintura (cada lunes)</h2><p class=\"chico suave\">En la mañana, antes de desayunar, a la altura del ombligo, sin meter la panza. Es tu mejor guía de que bajas grasa.</p><div class=\"fila\"><input id=\"cintura-cm\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" placeholder=\"cm\" style=\"max-width:8rem\"><button class=\"btn\" data-acc=\"guardar-cintura\">Guardar</button></div>" +
    (cint.length >= 2 ? linea(cint, { marcas: true, titulo: "Cintura" }) : "") +
    datos.cinturas.slice(-8).reverse().map(function (c, i, arr) { var prev = arr[i + 1]; return "<div class=\"meta-sem\"><span>" + bonita(c.fecha) + "</span><span>" + c.cm + " cm" + (prev ? " <span class=\"suave\">(" + (c.cm - prev.cm > 0 ? "+" : "") + fmt(c.cm - prev.cm, 1) + ")</span>" : "") + " <button class=\"borrar\" data-acc=\"borrar-cintura\" data-f=\"" + c.fecha + "\" aria-label=\"Borrar\">×</button></span></div>"; }).join("") + "</div>";

  h += "<div class=\"tarjeta\"><h2>Medidas completas (cada 4 semanas)</h2><p class=\"chico suave\">En cm, en la mañana, relajado, con la cinta pegada a la piel sin apretar. Lo que no tengas, déjalo vacío.</p><div class=\"grid2\">" +
    CAMPOS.map(function (c) { var ph = c[0] === "estatura" ? v(ultimoValor("estatura")) : ""; return "<label>" + esc(c[1]) + "<input type=\"number\" inputmode=\"decimal\" step=\"0.1\" data-medida=\"" + c[0] + "\" value=\"" + ph + "\"></label>"; }).join("") +
    "</div><button class=\"btn bloque\" style=\"margin-top:.7rem\" data-acc=\"guardar-medidas\">Guardar medidas</button></div>";
  h += htmlTablaMedidas();
  h += htmlResultados() + htmlPotencial() + htmlConstancia() + htmlFotos() + htmlHistorial();
  h += "<div class=\"tarjeta ancho\"><h2>Respaldo</h2><p class=\"chico\">" + (nube.user ? "Tus datos ya se guardan en la nube. Igual puedes descargar una copia." : "Sin cuenta, tus datos están solo en este equipo. Haz un respaldo cada 2 semanas o entra con Google para sincronizar.") + (datos.ajustes.ultimoRespaldo ? " Último respaldo: " + bonita(datos.ajustes.ultimoRespaldo) + "." : "") + "</p>" +
    "<div class=\"fila\"><button class=\"btn\" data-acc=\"exportar\">Exportar respaldo</button><button class=\"btn sec\" data-acc=\"importar\">Importar</button><button class=\"btn peligro\" data-acc=\"borrar-todo\">Borrar todo</button></div></div>";
  return h;
}
function htmlTablaMedidas() {
  if (!datos.medidas.length) return "";
  var cols = [["peso", "Peso"], ["cintura", "Cintura"], ["cuello", "Cuello"], ["pecho", "Pecho"], ["brazoCon", "Brazo"], ["antebrazo", "Antebr."], ["muslo", "Muslo"], ["pantorrilla", "Pantorr."]];
  var est = ultimoValor("estatura");
  return "<div class=\"tarjeta ancho\"><h2>Evolución de medidas</h2><div class=\"scroll\"><table class=\"tabla\"><thead><tr><th>Fecha</th>" + cols.map(function (c) { return "<th class=\"n\">" + c[1] + "</th>"; }).join("") + "<th class=\"n\">% grasa</th><th></th></tr></thead><tbody>" +
    datos.medidas.slice().reverse().map(function (m) {
      var bf = grasaMarina(m.cintura, m.cuello, m.estatura || est);
      return "<tr><td>" + bonita(m.fecha) + "</td>" + cols.map(function (c) { return "<td class=\"n\">" + (m[c[0]] != null ? m[c[0]] : "–") + "</td>"; }).join("") + "<td class=\"n\">" + (bf == null ? "–" : fmt(bf, 1)) + "</td><td><button class=\"borrar\" data-acc=\"borrar-medida\" data-f=\"" + m.fecha + "\" aria-label=\"Borrar\">×</button></td></tr>";
    }).join("") + "</tbody></table></div></div>";
}
function grasaMarina(cintura, cuello, est) { if (!(cintura > cuello) || !est) return null; return 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(est)) - 450; }
function htmlResultados() {
  var ci = ultimoValor("cintura"), cu = ultimoValor("cuello"), est = ultimoValor("estatura"), peso = pesoActual();
  var bf = grasaMarina(ci, cu, est);
  if (bf == null) return tarjeta("% de grasa", "<p class=\"chico suave\">Guarda cintura, cuello y estatura en Medidas y aquí aparece tu % de grasa estimado (método de la Marina de EE. UU.).</p>");
  var h = "<div class=\"metas\" style=\"grid-template-columns:repeat(3,1fr)\"><div class=\"meta\"><b>" + fmt(bf, 1) + "%</b><span>grasa</span></div>";
  if (peso) {
    var magra = peso * (1 - bf / 100), m = est / 100, ffmi = magra / (m * m) + 6.1 * (1.8 - m);
    h += "<div class=\"meta\"><b>" + fmt(magra, 1) + "</b><span>kg magros</span></div><div class=\"meta\"><b>" + fmt(ffmi, 1) + "</b><span>FFMI</span></div></div>" +
      "<p class=\"chico\">Con tu músculo actual pesarías <b>" + fmt(magra / 0.88, 1) + " kg al 12%</b> y <b>" + fmt(magra / 0.9, 1) + " kg al 10%</b> de grasa.</p>" +
      "<p class=\"chico suave\">FFMI (músculo para tu estatura): ≈20 promedio · ≈22 muy entrenado · 24-25 techo natural aproximado. Es una estimación: compárala contigo mismo cada mes.</p>";
  } else h += "</div>";
  return tarjeta("% de grasa y músculo", h);
}
function htmlPotencial() {
  var est = ultimoValor("estatura"), mu = ultimoValor("muneca"), to = ultimoValor("tobillo");
  if (!est || !mu || !to) return tarjeta("Tu potencial natural", "<p class=\"chico suave\">Guarda estatura, muñeca y tobillo en Medidas y aquí verás tu techo natural estimado (fórmulas de Casey Butt) y cuánto te falta en cada medida.</p>");
  var lbm = Math.pow(est, 1.5) * (Math.sqrt(mu) / 322.4 + Math.sqrt(to) / 241.9) * (10 / 224 + 1);
  var techo = [
    ["Brazo contraído", "brazoCon", 1.2033 * mu + 0.1236 * est], ["Antebrazo", "antebrazo", 0.9626 * mu + 0.0989 * est],
    ["Pecho", "pecho", 1.6817 * mu + 1.3759 * to + 0.3314 * est], ["Cuello", "cuello", 1.1424 * mu + 0.1236 * est],
    ["Muslo", "muslo", 1.3868 * to + 0.1805 * est], ["Pantorrilla", "pantorrilla", 0.9298 * to + 0.1210 * est]
  ];
  var h = "<p class=\"chico\">Techo estimado: <b>" + fmt(lbm, 1) + " kg magros</b>, o sea unos <b>" + fmt(lbm / 0.9, 1) + " kg al 10% de grasa</b>. Algo más realista (95%): " + fmt(lbm * 0.95 / 0.9, 1) + " kg.</p>" +
    "<table class=\"tabla\"><thead><tr><th>Medida</th><th class=\"n\">Hoy</th><th class=\"n\">Techo</th><th class=\"n\">Falta</th></tr></thead><tbody>" +
    techo.map(function (t) {
      var hoyV = ultimoValor(t[1]), pct = hoyV ? Math.min(100, hoyV / t[2] * 100) : 0;
      return "<tr><td>" + t[0] + (hoyV ? "<div class=\"barra\"><i style=\"width:" + pct.toFixed(0) + "%\"></i></div>" : "") + "</td><td class=\"n\">" + (hoyV ? hoyV : "–") + "</td><td class=\"n\">" + fmt(t[2], 1) + "</td><td class=\"n\">" + (hoyV ? fmt(Math.max(0, t[2] - hoyV), 1) + " cm" : "–") + "</td></tr>";
    }).join("") + "</tbody></table>" +
    "<p class=\"chico suave\">Es el techo de los naturales con mejor genética tras muchos años, medido en condición magra. Una referencia para saber hacia dónde vas, no una promesa.</p>";
  return tarjeta("Tu potencial natural (el físico del 1%)", h);
}
var histSel = "todas";
function htmlHistorial() {
  if (!datos.registros.length) return tarjeta("Historial de sesiones", "<p class=\"chico suave\">Aquí aparecerán tus sesiones guardadas.</p>", true);
  var lista_ = datos.registros.filter(function (r) { return histSel === "todas" || r.sesion === histSel; }).slice(-40).reverse();
  var filtro = "<select data-hist aria-label=\"Filtrar sesiones\" style=\"max-width:16rem\"><option value=\"todas\">Todas las sesiones</option>" + PLAN.sesiones.map(function (x) { return "<option value=\"" + x.id + "\"" + (histSel === x.id ? " selected" : "") + ">" + esc(x.nombre) + "</option>"; }).join("") + "</select>";
  return tarjeta("Historial de sesiones", filtro + (lista_.length ? "" : "<p class=\"chico suave\">No hay sesiones de ese tipo.</p>") + lista_.map(function (r) {
    var x = sesion(r.sesion), nombres = nombresEjercicios();
    return "<details><summary>" + DCORTO[diaSemana(r.fecha)] + " " + bonita(r.fecha) + " · " + esc(x ? x.nombre : r.sesion) + "</summary><div class=\"chico\">" +
      Object.keys(r.ej || {}).map(function (id) { return "<div>" + esc(nombres[id] || id) + ": <span class=\"suave\">" + r.ej[id].map(function (s) { return v(s.kg === null ? "–" : s.kg) + "×" + v(s.reps === null ? "–" : s.reps); }).join(" · ") + "</span></div>"; }).join("") +
      (r.nota ? "<p class=\"suave\">📝 " + esc(r.nota) + "</p>" : "") +
      "<button class=\"btn peligro mini\" style=\"margin-top:.4rem\" data-acc=\"borrar-registro\" data-f=\"" + r.fecha + "\" data-id=\"" + r.sesion + "\">Borrar esta sesión</button></div></details>";
  }).join(""), true);
}
function nombresEjercicios() { var n = {}; PLAN.sesiones.forEach(function (x) { x.ej.forEach(function (e) { n[e.id] = e.n; }); }); return n; }
function e1rm(st) { return (st.kg > 0 && st.reps > 0 && st.reps <= 15) ? st.kg * (1 + st.reps / 30) : 0; }
function serieEjercicio(id) {
  return datos.registros.filter(function (r) { return r.ej && r.ej[id]; }).map(function (r) {
    var m = 0, top = 0; r.ej[id].forEach(function (st) { m = Math.max(m, e1rm(st)); top = Math.max(top, st.kg || 0); });
    return { fecha: r.fecha, v: m, top: top };
  }).filter(function (p) { return p.v > 0; });
}
var ejSel = null;
function htmlFuerza() {
  var n = nombresEjercicios(), ids = Object.keys(n).filter(function (id) { return serieEjercicio(id).length; });
  if (!ids.length) return tarjeta("Fuerza por ejercicio", "<p class=\"chico suave\">Cuando guardes sesiones con kg y reps, aquí verás cómo sube cada ejercicio y tus récords.</p>", true);
  if (!ejSel || ids.indexOf(ejSel) < 0) ejSel = ids.indexOf("sentadilla") >= 0 ? "sentadilla" : ids[0];
  var serie = serieEjercicio(ejSel), mejor = serie.reduce(function (a, p) { return p.v > a.v ? p : a; }, serie[0]);
  var maxTop = serie.reduce(function (a, p) { return Math.max(a, p.top); }, 0);
  var sel = "<select data-ej-sel aria-label=\"Ejercicio\">" + ids.map(function (id) { return "<option value=\"" + id + "\"" + (id === ejSel ? " selected" : "") + ">" + esc(n[id]) + "</option>"; }).join("") + "</select>";
  var filas = ids.map(function (id) {
    var se = serieEjercicio(id), b = se.reduce(function (a, p) { return p.v > a.v ? p : a; }, se[0]), t = se.reduce(function (a, p) { return Math.max(a, p.top); }, 0);
    return "<tr><td>" + esc(n[id]) + "</td><td class=\"n\">" + fmt(b.v, 1) + "</td><td class=\"n\">" + t + "</td><td class=\"n\">" + bonita(b.fecha) + "</td></tr>";
  }).join("");
  return "<div class=\"tarjeta ancho\"><h2>Fuerza por ejercicio</h2>" + sel +
    linea(serie, { marcas: true, titulo: "1RM estimado", vacio: "Con 2 sesiones de este ejercicio aparece la gráfica." }) +
    "<p class=\"chico\">Mejor 1RM estimado: <b>" + fmt(mejor.v, 1) + " kg</b> (" + bonita(mejor.fecha) + ") · Peso más alto usado: <b>" + maxTop + " kg</b></p>" +
    "<p class=\"chico suave\">El 1RM estimado sale de tu mejor serie (peso × reps) y sirve para comparar sesiones aunque cambies de reps.</p>" +
    "<details><summary>Récords de todos los ejercicios</summary><div class=\"scroll\"><table class=\"tabla\"><thead><tr><th>Ejercicio</th><th class=\"n\">1RM est.</th><th class=\"n\">Máx kg</th><th class=\"n\">Fecha</th></tr></thead><tbody>" + filas + "</tbody></table></div></details></div>";
}
function htmlConstancia() {
  var l = lunesDe(hoy()), inicio = PLAN.fases[0].desde, filas = "";
  for (var i = 0; i < 10; i++) {
    var lu = sumarDias(l, -7 * i); if (sumarDias(lu, 6) < inicio) break;
    var c = contarSemana(lu), su = [];
    for (var k = 0; k < 7; k++) { var d = datos.diario[sumarDias(lu, k)]; if (d && d.sueno) su.push(d.sueno); }
    filas += "<tr><td>" + bonita(lu) + "</td><td class=\"n\">" + c.sesiones + "/6</td><td class=\"n\">" + c.proteina + "/7</td><td class=\"n\">" + c.creatina + "/7</td><td class=\"n\">" + c.pantalla + "/7</td><td class=\"n\">" + (su.length ? fmt(su.reduce(function (a, b) { return a + b; }, 0) / su.length, 1) : "–") + "</td></tr>";
  }
  return tarjeta("Constancia por semana", "<div class=\"scroll\"><table class=\"tabla\"><thead><tr><th>Semana del</th><th class=\"n\">Gym</th><th class=\"n\">Proteína</th><th class=\"n\">Creatina</th><th class=\"n\">Pantalla</th><th class=\"n\">Sueño</th></tr></thead><tbody>" + filas + "</tbody></table></div><p class=\"chico suave\">Sale de lo que marcas en la pestaña Hoy. Sueño: promedio de cómo te levantaste (1-10).</p>", true);
}
var fotos = [], cmpA = null, cmpB = null;
var TIPOS_FOTO = [["frente", "Frente"], ["perfil", "Perfil"], ["espalda", "Espalda"]];
function htmlFotos() {
  if (!nube.user) return tarjeta("Fotos de progreso", "<p class=\"chico suave\">Las fotos se guardan en tu cuenta. Entra con Google (arriba) para usarlas.</p>", true);
  var fechas = []; fotos.forEach(function (f) { if (fechas.indexOf(f.fecha) < 0) fechas.push(f.fecha); }); fechas.sort().reverse();
  if (!cmpA || fechas.indexOf(cmpA) < 0) cmpA = fechas[fechas.length - 1] || null;
  if (!cmpB || fechas.indexOf(cmpB) < 0) cmpB = fechas[0] || null;
  function img(fe, t) { var f = fotos.filter(function (x) { return x.fecha === fe && x.tipo === t; })[0]; return f ? "<img src=\"" + f.img + "\" alt=\"" + t + " " + fe + "\" loading=\"lazy\">" : "<div class=\"suave chico\" style=\"aspect-ratio:3/4;display:grid;place-items:center;background:#0b0d11;border-radius:10px\">sin foto</div>"; }
  function opts(sel) { return fechas.map(function (fe) { return "<option value=\"" + fe + "\"" + (fe === sel ? " selected" : "") + ">" + bonita(fe) + " " + fe.slice(0, 4) + "</option>"; }).join(""); }
  var h = "<p class=\"chico suave\">Cada 4 semanas, con la misma luz y la misma hora: frente, perfil y espalda, relajado. Se comprimen y solo tu cuenta puede verlas.</p>" +
    "<div class=\"grid2\"><label>Fecha<input type=\"date\" id=\"foto-fecha\" value=\"" + hoy() + "\" max=\"" + hoy() + "\"></label><label>Vista<select id=\"foto-tipo\">" + TIPOS_FOTO.map(function (t) { return "<option value=\"" + t[0] + "\">" + t[1] + "</option>"; }).join("") + "</select></label></div>" +
    "<button class=\"btn bloque\" style=\"margin-top:.6rem\" data-acc=\"elegir-foto\">📷 Subir foto</button><input type=\"file\" id=\"foto-archivo\" accept=\"image/*\" hidden>";
  if (fechas.length >= 2) {
    h += "<h3 style=\"margin-top:1rem\">Comparar</h3><div class=\"grid2\"><select data-cmp=\"a\">" + opts(cmpA) + "</select><select data-cmp=\"b\">" + opts(cmpB) + "</select></div><div class=\"comparar\">" +
      TIPOS_FOTO.map(function (t) { return img(cmpA, t[0]) + img(cmpB, t[0]); }).join("") + "</div>";
  }
  h += fechas.map(function (fe) {
    return "<h3 style=\"margin-top:1rem\">" + bonita(fe) + " " + fe.slice(0, 4) + "</h3><div class=\"fotos\">" + fotos.filter(function (x) { return x.fecha === fe; }).map(function (f) {
      return "<figure><img src=\"" + f.img + "\" alt=\"" + f.tipo + "\" loading=\"lazy\"><figcaption>" + f.tipo + "</figcaption><button class=\"borrar\" data-acc=\"borrar-foto\" data-id=\"" + f.id + "\" aria-label=\"Borrar foto\">×</button></figure>";
    }).join("") + "</div>";
  }).join("");
  return tarjeta("Fotos de progreso", h, true);
}
function comprimir(file) {
  return new Promise(function (ok, mal) {
    var im = new Image(), url = URL.createObjectURL(file);
    im.onload = function () {
      var k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      var q = 0.75, d = c.toDataURL("image/jpeg", q);
      while (d.length > 600000 && q > 0.35) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
      ok(d);
    };
    im.onerror = function () { URL.revokeObjectURL(url); mal(new Error("imagen")); };
    im.src = url;
  });
}

/* ---------- GUIA ---------- */
function htmlGuia() {
  var G = PLAN.guia, fa = faseDe(hoy()).id;
  var h = tarjeta("Por qué este plan", lista(G.claves));
  h += "<div class=\"tarjeta\"><h2>Las fases</h2><ol class=\"fases chico\">" + PLAN.fases.map(function (f) {
    return "<li class=\"" + (f.id === fa ? "actual" : "") + "\"><b>" + esc(f.nombre) + (f.id === fa ? " ← estás aquí" : "") + "</b><br><span class=\"suave\">" + bonita(f.desde) + (f.hasta < "2099" ? " – " + bonita(f.hasta) : " en adelante") + " · " + (f.kcalTexto ? "come normal" : "≈" + f.kcal + " kcal") + "</span><br>" + esc(f.nota) + "</li>";
  }).join("") + "</ol><p class=\"chico suave\">Descargas: " + PLAN.descargas.map(function (d) { return bonita(d.desde) + " – " + bonita(d.hasta) + " (" + d.nombre + ")"; }).join(" y ") + ".</p></div>";
  h += tarjeta("Cómo entrenar", lista(G.entreno));
  h += tarjeta("Molestias", lista(G.molestias));
  h += tarjeta("Sueño", lista(G.sueno));
  h += tarjeta("Creatina, café y suplementos", lista(G.suplementos));
  h += tarjeta("Cómo usar esta página", lista(G.pagina));
  h += tarjeta("Estudios en los que se basa", lista(G.fuentes));
  return h;
}

/* ---------- Respaldo ---------- */
function exportar() {
  var nombre = "rutina-respaldo-" + hoy() + ".txt", texto = JSON.stringify(datos);
  var marcar = function () { datos.ajustes.ultimoRespaldo = hoy(); guardar(); render(); };
  var archivo = null;
  try { archivo = new File([texto], nombre, { type: "text/plain" }); } catch (e) {}
  if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: "Respaldo de mi rutina" }).then(marcar).catch(function () {});
    return;
  }
  var url = URL.createObjectURL(new Blob([texto], { type: "text/plain" })), a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  marcar(); aviso("Respaldo descargado ✔");
}
function importar(archivo) {
  var lector = new FileReader();
  lector.onload = function () {
    var d; try { d = JSON.parse(lector.result); } catch (e) { d = null; }
    if (!d || d.version !== 1 || !Array.isArray(d.registros)) { aviso("Ese archivo no es un respaldo válido."); return; }
    if (!confirm("Esto reemplaza los datos de este celular por los del respaldo. ¿Seguir?")) return;
    var sub = datos.ajustes.subidoA; datos = normalizar(d); datos.ajustes.subidoA = sub; guardar(); aviso("Respaldo cargado ✔"); render();
    if (nube.user) subirTodo().catch(errNube);
  };
  lector.readAsText(archivo);
}

/* ---------- Avisos ---------- */
var avisoT = null;
function aviso(t) { var el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(avisoT); avisoT = setTimeout(function () { el.hidden = true; }, 2600); }

/* ---------- Eventos ---------- */
function guardarPeso(fecha, kg) {
  if (kg == null || kg < 30 || kg > 200) { aviso("Escribe tu peso en kg."); return; }
  datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== fecha; });
  datos.pesos.push({ fecha: fecha, kg: kg }); datos.pesos.sort(porFecha);
  nubeSet({ pesos: o(fecha, kg) });
  guardar(); aviso("Peso guardado ✔"); render();
}
document.addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-tab],[data-acc]"); if (!b) return;
  if (b.dataset.tab) { irA(b.dataset.tab); return; }
  var acc = b.dataset.acc, s = hoy();
  if (acc === "abrir") abrirSesion(b.dataset.id);
  else if (acc === "cerrar") cerrarSesion(false);
  else if (acc === "guardar-sesion") guardarSesion();
  else if (acc === "timer") iniciarTimer(+b.dataset.seg);
  else if (acc === "timer-mas") { timer.fin += 30000; timer.total += 30; if (!timer.id) { timer.id = setInterval(tick, 250); $("#timer").hidden = false; } tick(); }
  else if (acc === "timer-parar") pararTimer();
  else if (acc === "guardar-peso") guardarPeso(s, numero($("#peso-hoy").value));
  else if (acc === "guardar-peso2") guardarPeso($("#peso-fecha").value || s, numero($("#peso-kg").value));
  else if (acc === "borrar-peso") { datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== b.dataset.f; }); nubeDel("pesos", b.dataset.f); guardar(); render(); }
  else if (acc === "guardar-cintura") {
    var cm = numero($("#cintura-cm").value); if (cm == null || cm < 40 || cm > 200) { aviso("Escribe la cintura en cm."); return; }
    datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== s; }); datos.cinturas.push({ fecha: s, cm: cm }); datos.cinturas.sort(porFecha);
    nubeSet({ cinturas: o(s, cm) });
    guardar(); aviso("Cintura guardada ✔"); render();
  }
  else if (acc === "borrar-cintura") { datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== b.dataset.f; }); nubeDel("cinturas", b.dataset.f); guardar(); render(); }
  else if (acc === "guardar-medidas") {
    var m = { fecha: s }, alguno = false;
    $$("[data-medida]").forEach(function (i) { var n = numero(i.value); if (n != null && n > 0) { m[i.dataset.medida] = n; if (i.dataset.medida !== "estatura") alguno = true; } });
    if (!alguno) { aviso("Escribe al menos una medida."); return; }
    datos.medidas = datos.medidas.filter(function (x) { return x.fecha !== s; }); datos.medidas.push(m); datos.medidas.sort(porFecha);
    if (m.peso) { datos.pesos = datos.pesos.filter(function (p) { return p.fecha !== s; }); datos.pesos.push({ fecha: s, kg: m.peso }); datos.pesos.sort(porFecha); }
    if (m.cintura) { datos.cinturas = datos.cinturas.filter(function (c) { return c.fecha !== s; }); datos.cinturas.push({ fecha: s, cm: m.cintura }); datos.cinturas.sort(porFecha); }
    var copia = Object.assign({}, m); delete copia.fecha;
    var up = { medidas: o(s, copia) }; if (m.peso) up.pesos = o(s, m.peso); if (m.cintura) up.cinturas = o(s, m.cintura);
    nubeSet(up);
    guardar(); aviso("Medidas guardadas ✔"); render();
  }
  else if (acc === "borrar-medida") { if (confirm("¿Borrar las medidas del " + bonita(b.dataset.f) + "?")) { datos.medidas = datos.medidas.filter(function (x) { return x.fecha !== b.dataset.f; }); nubeDel("medidas", b.dataset.f); guardar(); render(); } }
  else if (acc === "borrar-registro") { if (confirm("¿Borrar esta sesión del historial?")) { datos.registros = datos.registros.filter(function (r) { return !(r.fecha === b.dataset.f && r.sesion === b.dataset.id); }); nubeRegDel(b.dataset.f, b.dataset.id); guardar(); render(); } }
  else if (acc === "exportar") exportar();
  else if (acc === "importar") $("#archivo").click();
  else if (acc === "borrar-todo") {
    if (confirm(nube.user ? "¿Borrar TODOS tus registros de la nube y de este equipo?" : "¿Borrar TODOS tus registros de este equipo?") && confirm("Seguro? Esto no se puede deshacer si no tienes respaldo.")) {
      var subido = datos.ajustes.subidoA;
      datos = vacio(); datos.ajustes.subidoA = subido; guardar(); render();
      if (nube.user) borrarNube().then(function () { aviso("Datos borrados."); }).catch(errNube); else aviso("Datos borrados.");
    }
  }
  else if (acc === "cuenta") { if (nube.user) irA("progreso"); else entrar(); }
  else if (acc === "entrar") entrar();
  else if (acc === "sin-cuenta") { modoSesion("local"); pantallaInicio("oculto"); render(); }
  else if (acc === "salir") salir();
  else if (acc === "copiar-uid") { if (navigator.clipboard) navigator.clipboard.writeText(nube.user.uid).then(function () { aviso("UID copiado ✔"); }); }
  else if (acc === "elegir-foto") $("#foto-archivo").click();
  else if (acc === "borrar-foto") { if (confirm("¿Borrar esta foto?")) nube.F.deleteDoc(nube.F.doc(nube.db, "usuarios", nube.user.uid, "fotos", b.dataset.id)).catch(errNube); }
});
document.addEventListener("change", function (ev) {
  var t = ev.target, s = hoy();
  if (t.dataset.diario) { var d = datos.diario[s] = datos.diario[s] || {}; d[t.dataset.diario] = t.checked; nubeSet({ diario: o(s, o(t.dataset.diario, t.checked)) }); guardar(); }
  else if (t.dataset.semanal) { var l = lunesDe(s), w = datos.semanal[l] = datos.semanal[l] || {}; w[t.dataset.semanal] = t.checked; nubeSet({ semanal: o(l, o(t.dataset.semanal, t.checked)) }); guardar(); }
  else if (t.hasAttribute("data-sueno")) { var dd = datos.diario[s] = datos.diario[s] || {}; dd.sueno = +t.value; nubeSet({ diario: o(s, { sueno: +t.value }) }); guardar(); }
  else if (t.hasAttribute("data-ej-sel")) { ejSel = t.value; render(); }
  else if (t.hasAttribute("data-hist")) { histSel = t.value; render(); }
  else if (t.dataset.cmp) { if (t.dataset.cmp === "a") cmpA = t.value; else cmpB = t.value; render(); }
  else if (t.id === "foto-archivo" && t.files && t.files[0]) { subirFoto(t.files[0]); t.value = ""; }
  else if (t.id === "archivo" && t.files && t.files[0]) { importar(t.files[0]); t.value = ""; }
  if ((t.dataset.diario || t.dataset.semanal) && actual === "hoy") render();
});
document.addEventListener("input", function (ev) {
  var t = ev.target;
  if (t.hasAttribute("data-sueno")) $("#sueno-val").textContent = t.value;
  if (abierta && panel.contains(t) && (t.dataset.ej || t.id === "nota-sesion")) guardarBorrador();
});
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState !== "visible") return;
  if (abierta) pedirPantalla();
  if (timer.id) tick();
  if (!abierta && hoy() !== ultimoDia) render();
});
