"use strict";
/* Datos y calculos: utilidades, fechas, almacenamiento, fases, que toca hoy,
   historial de ejercicios y formulas. No dibuja nada. */

var CLAVE = "rutina-v1";
var DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
var DCORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
var MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
var ESFUERZO = {
  rir2: "Deja 1 o 2 reps en reserva.",
  rir1: "Deja 1 rep en reserva.",
  fallo: "Al fallo, con técnica limpia.",
  "fallo+": "Al fallo, con el extra de abajo.",
  duro: "Hasta que el agarre casi se suelte."
};
var ORDEN = PLAN.sesiones.map(function (s) { return s.id; });

/* ---------- Utilidades ---------- */
function $(sel, raiz) { return (raiz || document).querySelector(sel); }
function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
function numero(x) { if (x == null || x === "") return null; var n = parseFloat(String(x).replace(",", ".")); return isFinite(n) ? n : null; }
function fmt(n, d) { if (n == null || !isFinite(n)) return "–"; var f = Math.pow(10, d || 0); return String(Math.round(n * f) / f); }
function v(x) { return x == null ? "" : x; }
function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
function o(k, val) { var x = {}; x[k] = val; return x; }
function ico(nombre, clase) { return "<svg class=\"ico" + (clase ? " " + clase : "") + "\" aria-hidden=\"true\"><use href=\"#i-" + nombre + "\"/></svg>"; }

/* ---------- Fechas (siempre hora local del equipo) ---------- */
function pad(n) { return (n < 10 ? "0" : "") + n; }
function aTexto(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function aFecha(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function sumarDias(s, n) { var d = aFecha(s); d.setDate(d.getDate() + n); return aTexto(d); }
function diasEntre(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 86400000); }
function diaSemana(s) { return (aFecha(s).getDay() + 6) % 7; }
function lunesDe(s) { return sumarDias(s, -diaSemana(s)); }
function bonita(s) { var d = aFecha(s); return d.getDate() + " " + MESES[d.getMonth()]; }
function fechaLarga(s) { var d = aFecha(s); return DIAS[diaSemana(s)] + " " + d.getDate() + " de " + MESES_LARGO[d.getMonth()]; }
/* El dia cambia a las 3 am: una sesion guardada despues de medianoche cuenta
   para el dia en que entrenaste. */
var CORTE_DIA = 3;
function hoy() {
  var q = new URLSearchParams(location.search).get("fecha");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  var d = new Date(); d.setHours(d.getHours() - CORTE_DIA);
  return aTexto(d);
}

/* ---------- Datos guardados en el equipo ---------- */
function vacio() { return { version: 1, registros: [], borradores: {}, pesos: [], cinturas: [], medidas: [], diario: {}, semanal: {}, ajustes: {}, pendientes: [] }; }
function porFecha(a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; }
function normalizar(d) {
  var base = vacio();
  for (var k in base) if (d[k] === undefined || d[k] === null) d[k] = base[k];
  d.registros.sort(porFecha); d.pesos.sort(porFecha); d.cinturas.sort(porFecha); d.medidas.sort(porFecha);
  return d;
}
function cargar() {
  try { var t = localStorage.getItem(CLAVE); return t ? normalizar(JSON.parse(t)) : vacio(); }
  catch (e) { return vacio(); }
}
var datos = cargar();
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch (e) { aviso("No se pudo guardar en este navegador."); }
}

/* ---------- Fases del plan ---------- */
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
function nombreFaseCorto(s) {
  var f = faseDe(s);
  return f.def ? "Definición, semana " + semanaDef(s) + " de " + PLAN.semanasDefinicion : f.corto;
}

/* ---------- Que toca hoy ----------
   Orden fijo de lunes a sabado. Si faltas, al dia siguiente toca la sesion
   pendiente; si la semana ya no alcanza, se saltan primero los dias marcados
   como "saltable" (hombros y brazos), nunca pierna ni torso. */
function sesion(id) { for (var i = 0; i < PLAN.sesiones.length; i++) if (PLAN.sesiones[i].id === id) return PLAN.sesiones[i]; return null; }
function tipoDe(id) { var x = sesion(id); return x ? x.cal : "neutro"; }
function hechasEnSemana(lunes) {
  var fin = sumarDias(lunes, 6), h = {};
  datos.registros.forEach(function (r) { if (r.fecha >= lunes && r.fecha <= fin && !h[r.sesion]) h[r.sesion] = r.fecha; });
  return h;
}
function registroDe(fecha, id) { for (var i = datos.registros.length - 1; i >= 0; i--) { var r = datos.registros[i]; if (r.fecha === fecha && r.sesion === id) return r; } return null; }
function sugerir(s) {
  var dow = diaSemana(s), hechas = hechasEnSemana(lunesDe(s)), hechaHoy = null;
  datos.registros.forEach(function (r) { if (r.fecha === s) hechaHoy = r.sesion; });
  if (dow === 6) return { descanso: true, hechas: hechas, hechaHoy: hechaHoy, plan: [], salta: [], fechas: {} };
  var dias = 6 - dow - (hechaHoy ? 1 : 0);
  var plan = ORDEN.filter(function (x) { return !hechas[x]; }), salta = [], exceso = plan.length - dias, i;
  for (i = plan.length - 1; i >= 0 && exceso > 0; i--) if (sesion(plan[i]).saltable) { salta.unshift(plan[i]); plan.splice(i, 1); exceso--; }
  for (i = plan.length - 1; i >= 0 && exceso > 0; i--) { salta.unshift(plan[i]); plan.splice(i, 1); exceso--; }
  /* Dia en que toca cada sesion pendiente: hoy (o manana si ya entrenaste) y siguientes. */
  var fechas = {}, base = hechaHoy ? 1 : 0;
  plan.forEach(function (x, k) { fechas[x] = sumarDias(s, base + k); });
  return { descanso: false, hechas: hechas, hechaHoy: hechaHoy, plan: plan, salta: salta, fechas: fechas, siguiente: plan[0] || null };
}

/* ---------- Historial de ejercicios ---------- */
function nombresEjercicios() { var n = {}; PLAN.sesiones.forEach(function (x) { x.ej.forEach(function (e) { if (!n[e.id]) n[e.id] = e.n; }); }); return n; }
function tipoEjercicio(exId) { for (var i = 0; i < PLAN.sesiones.length; i++) for (var j = 0; j < PLAN.sesiones[i].ej.length; j++) if (PLAN.sesiones[i].ej[j].id === exId) return PLAN.sesiones[i].cal; return "neutro"; }
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
  if (!base) return "Series de aproximación: " + (ej.a === "barra" ? "la barra sola por 10, luego " : "") + esquema.map(function (p) { return p[0] * 100 + "% por " + p[1]; }).join(", ") + " de tu peso de trabajo. Cuando anotes tu primera sesión te pongo los kilos.";
  var partes = ej.a === "barra" ? ["barra sola × 10"] : [];
  esquema.forEach(function (p) { partes.push(redondear(base * p[0], ej.a) + " kg × " + p[1]); });
  return "Aproximación para " + base + " kg: " + partes.join(", ") + ".";
}
function esfuerzoDe(ej, s) { return esSemana0(s) ? "Deja 2 o 3 reps en reserva." : (ESFUERZO[ej.e] || ""); }
function e1rm(st) { return (st.kg > 0 && st.reps > 0 && st.reps <= 15) ? st.kg * (1 + st.reps / 30) : 0; }
function mejorE1rm(sets) { var m = 0; (sets || []).forEach(function (st) { m = Math.max(m, e1rm(st)); }); return m; }
function serieEjercicio(id) {
  return datos.registros.filter(function (r) { return r.ej && r.ej[id]; }).map(function (r) {
    var top = 0; r.ej[id].forEach(function (st) { top = Math.max(top, st.kg || 0); });
    return { fecha: r.fecha, v: mejorE1rm(r.ej[id]), top: top };
  }).filter(function (p) { return p.v > 0; });
}
/* Ejercicios en los que esta sesion supera el mejor 1RM estimado anterior. */
function recordsDe(reg) {
  var out = [], nombres = nombresEjercicios();
  Object.keys(reg.ej || {}).forEach(function (id) {
    var nuevo = mejorE1rm(reg.ej[id]), antes = 0;
    datos.registros.forEach(function (r) { if (r !== reg && r.fecha < reg.fecha && r.ej && r.ej[id]) antes = Math.max(antes, mejorE1rm(r.ej[id])); });
    if (antes > 0 && nuevo > antes + 0.05) out.push({ id: id, nombre: nombres[id] || id, kg: nuevo });
  });
  return out;
}

/* ---------- Semana: conteos para metas y constancia ---------- */
function contarSemana(lunes) {
  var hasta = sumarDias(lunes, 6), c = { sesiones: Object.keys(hechasEnSemana(lunes)).length, pesajes: 0, cintura: 0, proteina: 0, creatina: 0, pantalla: 0 };
  datos.pesos.forEach(function (p) { if (p.fecha >= lunes && p.fecha <= hasta) c.pesajes++; });
  datos.cinturas.forEach(function (p) { if (p.fecha >= lunes && p.fecha <= hasta) c.cintura++; });
  for (var i = 0; i < 7; i++) { var d = datos.diario[sumarDias(lunes, i)] || {}; if (d.proteina) c.proteina++; if (d.creatina) c.creatina++; if (d.pantalla) c.pantalla++; }
  return c;
}

/* ---------- Peso y medidas ---------- */
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
var CAMPOS = [
  ["peso", "Peso (kg)"], ["cintura", "Cintura, a la altura del ombligo"], ["cuello", "Cuello, bajo la manzana de Adán"], ["cadera", "Cadera, parte más ancha"],
  ["pecho", "Pecho, a la altura de los pezones"], ["brazoRel", "Brazo relajado"], ["brazoCon", "Brazo contraído"], ["antebrazo", "Antebrazo, puño cerrado"],
  ["muslo", "Muslo, parte más gruesa"], ["pantorrilla", "Pantorrilla, parte más gruesa"], ["muneca", "Muñeca, entre la mano y el huesito"],
  ["tobillo", "Tobillo, parte más delgada"], ["estatura", "Estatura (cm)"]
];
function ultimoValor(campo) { for (var i = datos.medidas.length - 1; i >= 0; i--) { var x = datos.medidas[i][campo]; if (x != null) return x; } return null; }
function pesoActual() { if (datos.pesos.length) return datos.pesos[datos.pesos.length - 1].kg; return ultimoValor("peso"); }
/* % de grasa, metodo de la Marina de EE. UU. (hombres, cm). */
function grasaMarina(cintura, cuello, est) { if (!(cintura > cuello) || !est) return null; return 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(est)) - 450; }
/* Techo natural estimado, formulas de Casey Butt (cm y kg). */
function potencial(est, mu, to) {
  return {
    lbm: Math.pow(est, 1.5) * (Math.sqrt(mu) / 322.4 + Math.sqrt(to) / 241.9) * (10 / 224 + 1),
    medidas: [
      ["Brazo contraído", "brazoCon", 1.2033 * mu + 0.1236 * est], ["Antebrazo", "antebrazo", 0.9626 * mu + 0.0989 * est],
      ["Pecho", "pecho", 1.6817 * mu + 1.3759 * to + 0.3314 * est], ["Cuello", "cuello", 1.1424 * mu + 0.1236 * est],
      ["Muslo", "muslo", 1.3868 * to + 0.1805 * est], ["Pantorrilla", "pantorrilla", 0.9298 * to + 0.1210 * est]
    ]
  };
}
function ajusteCalorias() {
  var s = hoy(), sem = promediosSemanales().filter(function (w) { return w.lunes < lunesDe(s) && w.n >= 2; });
  if (sem.length < 3) return { tipo: "espera", txt: "Con 3 semanas completas, de 2 pesajes o más cada una, te digo si hay que ajustar calorías." };
  var u = sem.slice(-3);
  if (!faseDe(u[1].lunes).def || !faseDe(u[2].lunes).def) return { tipo: "espera", txt: "El ajuste solo se calcula con semanas de definición." };
  if (semanaDef(u[2].lunes) < 3) return { tipo: "espera", txt: "Las 2 primeras semanas de definición la balanza baila por agua y creatina. El ajuste empieza en la semana 3." };
  var cambio = (u[2].prom - u[0].prom) / 2;
  if (cambio > -0.25) return { tipo: "aviso", txt: "Bajas lento (" + fmt(cambio, 2) + " kg por semana). Quita unas 150 kcal, por ejemplo el pan del desayuno o 50 g de arroz en cada comida, o suma 20 minutos de caminata 3 veces por semana." };
  if (cambio < -0.9) return { tipo: "aviso", txt: "Bajas muy rápido (" + fmt(cambio, 2) + " kg por semana). Suma unas 150 kcal, por ejemplo 1 pan o 50 g más de arroz al día, para cuidar el músculo." };
  return { tipo: "ok", txt: "Vas al ritmo correcto (" + fmt(cambio, 2) + " kg por semana). No cambies nada." };
}
