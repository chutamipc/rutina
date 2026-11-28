"use strict";
/* La sesion en el gym: registro de series, borrador automatico,
   temporizador de descanso y pantalla siempre encendida. */

var abierta = null, guardarTimeout = null, fechaAbierta = null, fechaOriginal = null;
var panel = $("#panel");

/* Abre una sesion para anotarla. Con "fecha" abre la que ya se guardo ese dia
   (para verla o corregirla); sin fecha, la de hoy. */
function abrirSesion(id, fecha) {
  var s = fecha || hoy(), x = sesion(id); if (!x) return;
  abierta = id; fechaAbierta = s;
  var reg = registroDe(s, id);
  fechaOriginal = reg ? reg.fecha : null;
  var bor = datos.borradores[id]; if (bor && bor.fecha !== s) { delete datos.borradores[id]; bor = null; guardar(); }
  var valores = (bor && bor.ej) || (reg && reg.ej) || {}, nota = (bor && bor.nota) || (reg && reg.nota) || "";
  var principales = x.ej.filter(function (e) { return !e.opc; }), extra = x.ej.filter(function (e) { return e.opc; });
  var h = "<header class=\"p-top t-" + x.cal + "\"><button class=\"ico-btn\" data-acc=\"cerrar\" aria-label=\"Volver\">" + ico("arrow-left") + "</button>" +
    "<div class=\"p-tit\"><h2 id=\"p-titulo\">" + esc(x.nombre) + "</h2><p>" + esc(x.foco) + ", unos " + x.min + " minutos</p></div>" +
    "<span class=\"p-prog\" id=\"p-prog\" aria-live=\"polite\"></span></header><div class=\"p-cuerpo\">";
  if (esSemana0(s)) h += banda("info", "Semana de prueba: deja 2 o 3 reps en reserva en todo, encuentra tus pesos y anótalos.");
  if (enDescarga(s)) h += banda("info", "Semana de " + esc(enDescarga(s).nombre) + ": entrena normal si puedes. Baja la carga solo si estás muy cansado o con molestias.");
  h += "<div class=\"p-fecha\"><label for=\"fecha-sesion\">" + ico("calendar-days") + "Fecha del entrenamiento</label><input type=\"date\" id=\"fecha-sesion\" value=\"" + ((bor && bor.fechaSesion) || s) + "\" max=\"" + hoy() + "\" required></div>";
  if (reg) h += banda("check", "Esta sesión ya está guardada con fecha " + fechaLarga(reg.fecha).toLowerCase() + ". Si cambias algo, incluida la fecha, vuelve a guardar.", "", "ok");
  h += "<details class=\"calentar\"><summary>" + ico("flame") + "<span>Calentamiento, 5 a 7 minutos</span>" + ico("chevron-down", "acc-flecha") + "</summary><p>" + esc(PLAN.calentamiento[x.cal]) + "</p></details>";
  h += principales.map(function (e, i) { return htmlEjercicio(e, i + 1, s, valores); }).join("");
  if (extra.length) h += "<h3 class=\"p-extra\">Extra</h3><p class=\"nota\">" + esc(x.notaExtra || "") + "</p>" + extra.map(function (e, i) { return htmlEjercicio(e, principales.length + i + 1, s, valores); }).join("");
  h += "<div class=\"p-final\"><label for=\"nota-sesion\">Nota del día<span class=\"nota\">Cómo te sentiste, molestias o lo que quieras recordar.</span></label><textarea id=\"nota-sesion\" rows=\"3\">" + esc(nota) + "</textarea></div></div>" +
    "<footer class=\"p-pie\"><button class=\"btn btn-tipo t-" + x.cal + " bloque grande\" data-acc=\"guardar-sesion\">" + ico("check") + "Guardar sesión</button></footer>";
  panel.innerHTML = h; panel.hidden = false; panel.scrollTop = 0;
  panel.setAttribute("aria-labelledby", "p-titulo");
  document.body.classList.add("con-panel");
  history.pushState({ panel: id }, "");
  actualizarProgreso();
  pedirPantalla();
  var boton = $(".p-top .ico-btn", panel); if (boton) boton.focus({ preventScroll: true });
}
function htmlEjercicio(e, num, s, valores) {
  var ult = ultimaVez(e.id, s), sube = esSemana0(s) ? null : subirPeso(e, ult), vals = valores[e.id] || [];
  var base = sube || (ult ? maxKg(ult.sets) : 0), kgL = e.kgL || "kg", u = e.u || "reps";
  var filas = "<div class=\"set cab\" aria-hidden=\"true\"><span>Serie</span><span>" + esc(kgL) + "</span><span>" + esc(u) + "</span><span></span></div>";
  for (var k = 0; k < e.s; k++) {
    var val = vals[k] || {}, ph = ult && ult.sets[k] ? ult.sets[k] : {}, completa = val.kg != null && val.reps != null;
    filas += "<div class=\"set" + (completa ? " completa" : "") + "\"><span class=\"set-n\">" + (k + 1) + "</span>" +
      "<input type=\"number\" inputmode=\"decimal\" step=\"0.5\" min=\"0\" data-ej=\"" + e.id + "\" data-k=\"" + k + "\" data-c=\"kg\" value=\"" + v(val.kg) + "\" placeholder=\"" + v(ph.kg) + "\" aria-label=\"Serie " + (k + 1) + ", " + esc(kgL) + "\">" +
      "<input type=\"number\" inputmode=\"numeric\" step=\"1\" min=\"0\" data-ej=\"" + e.id + "\" data-k=\"" + k + "\" data-c=\"reps\" value=\"" + v(val.reps) + "\" placeholder=\"" + v(ph.reps) + "\" aria-label=\"Serie " + (k + 1) + ", " + esc(u) + "\">" +
      "<button type=\"button\" class=\"ico-btn reloj\" data-acc=\"timer\" data-seg=\"" + e.d + "\" aria-label=\"Descanso de " + mmss(e.d) + "\">" + ico("timer") + "</button></div>";
  }
  var rango = e.r[0] + " a " + e.r[1] + " " + (u === "reps" ? "reps" : u);
  return "<article class=\"ej\" data-ej-card=\"" + e.id + "\"><header class=\"ej-cab\"><span class=\"ej-num\" aria-hidden=\"true\">" + num + "</span><div><h3>" + esc(e.n) + "</h3>" +
    "<p class=\"ej-pres\"><b>" + e.s + " series de " + rango + "</b>. " + esc(esfuerzoDe(e, s)) + " Descanso " + mmss(e.d) + ".</p></div></header>" +
    (e.x ? "<p class=\"ej-extra\">" + esc(e.x) + "</p>" : "") +
    (ult ? "<p class=\"ej-ult\">La vez pasada, el " + bonita(ult.fecha) + ": " + ult.sets.map(function (st) { return (st.kg == null ? "–" : st.kg) + " × " + (st.reps == null ? "–" : st.reps); }).join(", ") + ".</p>" : "<p class=\"ej-ult\">Primera vez: anota con qué peso empiezas.</p>") +
    (sube ? "<p class=\"ej-sube\">" + ico("trophy") + "Llegaste al tope en todas las series: hoy prueba con " + sube + " kg.</p>" : "") +
    (e.a ? "<p class=\"ej-aprox\">" + esc(aproximacion(e, base)) + "</p>" : "") +
    "<div class=\"sets\">" + filas + "</div>" +
    (ult ? "<button type=\"button\" class=\"btn-texto\" data-acc=\"repetir\" data-ej=\"" + e.id + "\">" + ico("copy") + (sube ? "Llenar con " + sube + " kg" : "Usar los pesos de la vez pasada") + "</button>" : "") +
    "<details class=\"tecnica\"><summary>Técnica" + (e.alt ? " y alternativa" : "") + ico("chevron-down", "acc-flecha") + "</summary><p>" + esc(e.tip) + "</p>" + (e.alt ? "<p><b>Si molesta o está ocupada:</b> " + esc(e.alt) + "</p>" : "") + "</details></article>";
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
/* Marca las series completas y cuenta los ejercicios con al menos una serie. */
function actualizarProgreso() {
  if (!abierta) return;
  var x = sesion(abierta), total = x.ej.filter(function (e) { return !e.opc; }).length, conSerie = 0;
  $$(".set:not(.cab)", panel).forEach(function (fila) {
    var ins = $$("input", fila); fila.classList.toggle("completa", ins.length === 2 && ins[0].value !== "" && ins[1].value !== "");
  });
  x.ej.forEach(function (e) { if (!e.opc && $(".ej[data-ej-card=\"" + e.id + "\"] .set.completa", panel)) conSerie++; });
  var p = $("#p-prog", panel); if (p) p.textContent = conSerie + "/" + total;
}
function repetirPesos(exId) {
  var e = null; sesion(abierta).ej.forEach(function (x) { if (x.id === exId) e = x; });
  var f = fechaAbierta || hoy(), ult = ultimaVez(exId, f); if (!e || !ult) return;
  var sube = esSemana0(f) ? null : subirPeso(e, ult);
  $$("input[data-ej=\"" + exId + "\"][data-c=\"kg\"]", panel).forEach(function (inp) {
    var st = ult.sets[+inp.dataset.k] || ult.sets[ult.sets.length - 1];
    if (inp.value === "" && st && st.kg != null) inp.value = sube || st.kg;
  });
  guardarBorrador(); actualizarProgreso();
}
function guardarBorrador() {
  if (!abierta) return;
  datos.borradores[abierta] = { fecha: fechaAbierta || hoy(), fechaSesion: $("#fecha-sesion", panel).value, ej: recolectar(), nota: $("#nota-sesion", panel).value };
  clearTimeout(guardarTimeout); guardarTimeout = setTimeout(guardar, 300);
}
function guardarSesion() {
  var ej = limpiar(recolectar()), fecha = $("#fecha-sesion", panel).value, nota = $("#nota-sesion", panel).value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) { aviso("Elige la fecha del entrenamiento.", "triangle-alert"); $("#fecha-sesion", panel).focus(); return; }
  if (fecha > hoy()) { aviso("La fecha no puede ser después de hoy.", "triangle-alert"); return; }
  if (!Object.keys(ej).length && !confirm("No anotaste ninguna serie. ¿Marcar la sesión como hecha igual?")) return;
  var id = abierta, reg = { fecha: fecha, sesion: id, ej: ej, nota: nota };
  if (fechaOriginal && fechaOriginal !== fecha) {
    datos.registros = datos.registros.filter(function (r) { return !(r.fecha === fechaOriginal && r.sesion === id); });
    nubeRegDel(fechaOriginal, id);
  }
  datos.registros = datos.registros.filter(function (r) { return !(r.fecha === fecha && r.sesion === id); });
  datos.registros.push(reg);
  datos.registros.sort(porFecha);
  delete datos.borradores[id];
  guardar(); nubeReg(reg);
  var recs = recordsDe(reg);
  if (lunesDe(fecha) === lunesDe(hoy())) cargada = id;
  cerrarSesion(false); irA("hoy");
  if (recs.length) aviso(recs.length === 1 ? "Récord en " + recs[0].nombre + ": " + fmt(recs[0].kg, 1) + " kg estimados" : recs.length + " récords nuevos en esta sesión", "trophy");
  else aviso("Sesión guardada: " + fechaLarga(fecha).toLowerCase(), "check");
}
function cerrarSesion(desdeHistorial) {
  if (!abierta) return;
  var id = abierta;
  abierta = null; fechaAbierta = null; fechaOriginal = null; panel.hidden = true; panel.innerHTML = "";
  document.body.classList.remove("con-panel");
  pararTimer(); soltarPantalla();
  if (!desdeHistorial && history.state && history.state.panel) history.back();
  render();
  var volver = $("[data-acc=\"abrir\"][data-id=\"" + id + "\"]"); if (volver) volver.focus({ preventScroll: true });
}
window.addEventListener("popstate", function () { if (abierta) cerrarSesion(true); });

/* ---------- Temporizador de descanso ---------- */
var timer = { fin: 0, total: 1, id: null }, audio = null;
function iniciarTimer(seg) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (e) { audio = null; }
  timer.fin = Date.now() + seg * 1000; timer.total = seg;
  clearInterval(timer.id); timer.id = setInterval(tick, 250);
  $("#timer").hidden = false; $("#timer").classList.remove("fin"); tick();
}
function tick() {
  var resta = Math.max(0, Math.ceil((timer.fin - Date.now()) / 1000));
  $("#timer-num").textContent = mmss(resta);
  $("#timer-barra").style.transform = "scaleX(" + (1 - resta / timer.total).toFixed(3) + ")";
  if (resta <= 0) {
    clearInterval(timer.id); timer.id = null;
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    pitido(); $("#timer-num").textContent = "A darle"; $("#timer").classList.add("fin");
    setTimeout(function () { if (!timer.id) $("#timer").hidden = true; }, 4000);
  }
}
function pararTimer() { clearInterval(timer.id); timer.id = null; $("#timer").hidden = true; }
function pitido() {
  if (!audio) return;
  try {
    [0, 0.35].forEach(function (t0) {
      var osc = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + t0;
      osc.frequency.value = 880; osc.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch (e) {}
}
var bloqueoPantalla = null;
function pedirPantalla() { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (l) { bloqueoPantalla = l; }).catch(function () {}); }
function soltarPantalla() { if (bloqueoPantalla) { bloqueoPantalla.release().catch(function () {}); bloqueoPantalla = null; } }
