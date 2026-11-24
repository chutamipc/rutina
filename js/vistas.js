"use strict";
/* Dibuja las pestanas: Hoy, Rutina, Dieta, Progreso y Guia. */

var actual = "hoy", ultimoDia = hoy(), progSec = "cuerpo", cargada = null;
var histSel = "todas", ejSel = null, fotos = [], cmpA = null, cmpB = null;
var TIPOS_FOTO = [["frente", "Frente"], ["perfil", "Perfil"], ["espalda", "Espalda"]];
var ICONOS_DIARIO = { creatina: "pill", proteina: "beef", sinjugo: "cup-soda", cafe: "coffee", pantalla: "smartphone", agua: "glass-water" };

/* ---------- Piezas comunes ---------- */
function lista(items) { return "<ul class=\"lista\">" + items.map(function (t) { return "<li>" + md(t) + "</li>"; }).join("") + "</ul>"; }
function caja(titulo, cuerpo, clase) { return "<section class=\"caja" + (clase ? " " + clase : "") + "\">" + (titulo ? "<h2>" + esc(titulo) + "</h2>" : "") + cuerpo + "</section>"; }
function acc(titulo, icono, cuerpo, abierto) {
  return "<details class=\"acc\"" + (abierto ? " open" : "") + "><summary>" + ico(icono) + "<span>" + esc(titulo) + "</span>" + ico("chevron-down", "acc-flecha") + "</summary><div class=\"acc-cuerpo\">" + cuerpo + "</div></details>";
}
function banda(icono, texto, boton, clase) { return "<div class=\"banda" + (clase ? " " + clase : "") + "\">" + ico(icono) + "<p>" + texto + "</p>" + (boton || "") + "</div>"; }
function num(valor, etiqueta) { return "<div class=\"num\"><span class=\"num-v\">" + valor + "</span><span class=\"num-e\">" + etiqueta + "</span></div>"; }
function vacia(icono, titulo, texto, boton) { return "<section class=\"caja vacia ancho\">" + ico(icono, "vacia-ico") + "<h2>" + esc(titulo) + "</h2><p>" + texto + "</p>" + (boton || "") + "</section>"; }
function botonesSesiones() {
  return "<details class=\"otra\"><summary>Elegir otra sesión</summary><div class=\"otra-lista\">" + PLAN.sesiones.map(function (x) {
    return "<button class=\"btn btn-sec t-" + x.cal + "\" data-acc=\"abrir\" data-id=\"" + x.id + "\"><i class=\"pt\" aria-hidden=\"true\"></i>" + esc(x.nombre) + "</button>";
  }).join("") + "</div></details>";
}

/* ---------- Navegacion ---------- */
function irA(tab) {
  actual = tab;
  $$(".tab").forEach(function (t) { t.classList.toggle("activa", t.id === "tab-" + tab); });
  $$(".nav button").forEach(function (b) { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  render(); window.scrollTo(0, 0);
}
function render() {
  var s = hoy(), f = faseDe(s);
  ultimoDia = s;
  $("#pill").textContent = f.def ? "Definición " + semanaDef(s) + "/" + PLAN.semanasDefinicion : f.corto;
  var vistas = { hoy: vistaHoy, rutina: vistaRutina, dieta: vistaDieta, progreso: vistaProgreso, guia: vistaGuia };
  $("#tab-" + actual).innerHTML = vistas[actual]();
  pintarCuenta();
  cargada = null;
}

/* ---------- HOY ---------- */
function vistaHoy() {
  var s = hoy(), f = faseDe(s), sug = sugerir(s);
  return avisosHoy(s) + "<div class=\"hoy-grid\"><div class=\"col-a\">" + heroHoy(s, sug) + barraSemana(s, sug) + metasSemana(s) + "</div><div class=\"col-b\">" + paraHoy(s, f) + habitosHoy(s) + "</div>" + faseCaja(s, f) + "</div>";
}
/* Evita que la letra final de un nombre quede sola en otra linea ("Torso" / "A"). */
function titulo(t) { return esc(t).replace(/ (\S{1,2})$/, "\u00a0$1"); }
function avisosHoy(s) {
  var h = "", desc = enDescarga(s), esp = diaEspecial(s), ult = datos.ajustes.ultimoRespaldo;
  if (desc) h += banda("info", "Semana de " + esc(desc.nombre) + ": si faltas por las fiestas, no pasa nada. Baja la carga solo si estás muy cansado o te duelen los tendones: mismos pesos, 1 serie menos y 2 o 3 reps en reserva.");
  if (esp) h += banda("sparkles", esc(esp.nombre) + ": hoy comes a mantenimiento, unas " + PLAN.kcalMantenimiento + " kcal. Mañana vuelves al plan.");
  if (!nube.user && datos.registros.length && (!ult || diasEntre(ult, s) >= 14)) h += banda("download", "Hace " + (ult ? diasEntre(ult, s) + " días" : "rato") + " que no guardas una copia de tus datos.", "<button class=\"btn btn-sec mini\" data-acc=\"exportar\">Descargar copia</button>");
  return h;
}
function heroHoy(s, sug) {
  var cab = "<p class=\"hero-fecha\">" + fechaLarga(s) + "</p>";
  if (sug.descanso) {
    return "<section class=\"hero t-neutro\" aria-labelledby=\"hero-t\">" + cab + "<h1 id=\"hero-t\" class=\"hero-titulo\">Descanso</h1><p class=\"hero-sub\">Esta semana hiciste " + Object.keys(sug.hechas).length + " de 6 sesiones. Prepara la comida de la semana y mañana, antes de desayunar, mide tu cintura.</p>" + botonesSesiones() + "</section>";
  }
  if (sug.hechaHoy) {
    var x = sesion(sug.hechaHoy), sig = sug.siguiente ? sesion(sug.siguiente) : null;
    return "<section class=\"hero t-" + x.cal + " guardada\" aria-labelledby=\"hero-t\">" + cab + "<p class=\"hero-pre\">" + ico("check") + "Sesión guardada</p><h1 id=\"hero-t\" class=\"hero-titulo\">" + titulo(x.nombre) + "</h1><p class=\"hero-sub\">" + (sig ? "Mañana toca " + esc(sig.nombre) + "." : "Mañana descansas.") + "</p>" +
      "<div class=\"hero-acc\"><button class=\"btn btn-sec\" data-acc=\"abrir\" data-id=\"" + x.id + "\">" + ico("rotate-ccw") + "Ver o corregir</button></div>" + botonesSesiones() + "</section>";
  }
  if (!sug.siguiente) {
    return "<section class=\"hero t-hecho\" aria-labelledby=\"hero-t\">" + cab + "<p class=\"hero-pre\">" + ico("trophy") + "6 de 6</p><h1 id=\"hero-t\" class=\"hero-titulo\">Semana completa</h1><p class=\"hero-sub\">Hiciste todas las sesiones. Descansa y come bien.</p>" + botonesSesiones() + "</section>";
  }
  var t = sesion(sug.siguiente), nEj = t.ej.filter(function (e) { return !e.opc; }).length;
  return "<section class=\"hero t-" + t.cal + "\" aria-labelledby=\"hero-t\">" + cab +
    "<p class=\"hero-pre\">Hoy toca</p><h1 id=\"hero-t\" class=\"hero-titulo\">" + titulo(t.nombre) + "</h1>" +
    "<p class=\"hero-sub\">" + esc(t.foco) + ". " + nEj + " ejercicios, unos " + t.min + " minutos.</p>" +
    "<div class=\"hero-acc\"><button class=\"btn btn-tipo grande\" data-acc=\"abrir\" data-id=\"" + t.id + "\">" + ico("play") + "Empezar sesión</button></div>" +
    (sug.salta.length ? "<p class=\"hero-nota\">" + ico("info") + "<span>Esta semana ya no alcanza para todo: se salta " + sug.salta.map(function (x) { return esc(sesion(x).nombre); }).join(" y ") + ". Pierna y torso nunca se saltan.</span></p>" : "") +
    botonesSesiones() + "</section>";
}
/* La semana como una barra con 6 discos: cada sesion hecha "carga" su disco. */
function barraSemana(s, sug) {
  var n = Object.keys(sug.hechas).length;
  var discos = ORDEN.map(function (id, i) {
    var x = sesion(id), est = "pend";
    if (sug.hechas[id]) est = "hecha";
    else if (!sug.descanso && !sug.hechaHoy && id === sug.siguiente) est = "hoy";
    else if (sug.salta.indexOf(id) >= 0) est = "salta";
    var txt = { hecha: "hecha el " + bonita(sug.hechas[id] || s), hoy: "toca hoy", salta: "se salta esta semana", pend: "pendiente" }[est];
    return "<li class=\"disco-col t-" + x.cal + " " + est + (cargada === id ? " carga" : "") + "\"><span class=\"disco\" aria-hidden=\"true\">" + (est === "hecha" ? ico("check") : "") + "</span>" +
      "<span class=\"disco-dia\" aria-hidden=\"true\">" + DCORTO[i] + "</span><span class=\"disco-nom\" aria-hidden=\"true\">" + esc(x.corto) + "</span><span class=\"sr\">" + DIAS[i] + ", " + esc(x.nombre) + ": " + txt + ".</span></li>";
  }).join("");
  return "<section class=\"barra-sem\" aria-labelledby=\"barra-t\"><div class=\"barra-cab\"><h2 id=\"barra-t\">Tu semana</h2><p><b>" + n + "</b> de 6 sesiones</p></div><ol class=\"barra\">" + discos + "</ol></section>";
}
function paraHoy(s, f) {
  var esp = diaEspecial(s), normal = f.kcalTexto && !esp, ya = null;
  datos.pesos.forEach(function (p) { if (p.fecha === s) ya = p; });
  var pr = promedioSemana(lunesDe(s));
  return "<section class=\"caja para-hoy\"><h2>Para hoy</h2><div class=\"nums\">" +
    num(normal ? "Normal" : (esp ? PLAN.kcalMantenimiento : f.kcal), normal ? "kcal, come como siempre" : "kcal") + num(f.p + " g", "proteína") +
    (f.g && !normal ? num(f.g + " g", "grasa") + num(f.c + " g", "carbohidratos") : "") + "</div>" +
    "<div class=\"peso-hoy\"><label for=\"peso-hoy\">" + ico("scale") + "Peso de hoy</label><div class=\"fila\"><input id=\"peso-hoy\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" min=\"30\" max=\"200\" placeholder=\"kg\" value=\"" + v(ya && ya.kg) + "\"><button class=\"btn btn-sec\" data-acc=\"guardar-peso\">Guardar</button></div>" +
    "<p class=\"nota\">" + (pr ? "Promedio de esta semana: <b>" + fmt(pr.prom, 1) + " kg</b>, con " + pr.n + " pesaje" + (pr.n > 1 ? "s" : "") + ". " : "") + "Pésate en el gym, al llegar y antes de entrenar.</p></div></section>";
}
function habitosHoy(s) {
  var dd = datos.diario[s] || {}, hechos = PLAN.diario.filter(function (it) { return dd[it.id]; }).length;
  return "<section class=\"caja habitos\"><div class=\"caja-cab\"><h2>Hábitos de hoy</h2><span class=\"cuenta\">" + hechos + " de " + PLAN.diario.length + "</span></div><div class=\"chips\">" +
    PLAN.diario.map(function (it) {
      return "<button class=\"chip\" type=\"button\" data-diario=\"" + it.id + "\" aria-pressed=\"" + (dd[it.id] ? "true" : "false") + "\">" + ico(ICONOS_DIARIO[it.id] || "check") + "<span>" + esc(it.txt) + "</span>" + ico("check", "chip-ok") + "</button>";
    }).join("") + "</div>" +
    "<div class=\"sueno\"><label for=\"sueno\">" + ico("moon") + "¿Cómo te levantaste hoy?</label><div class=\"sueno-fila\"><input id=\"sueno\" type=\"range\" min=\"1\" max=\"10\" step=\"1\" value=\"" + (dd.sueno || 5) + "\" data-sueno><output id=\"sueno-val\" for=\"sueno\">" + (dd.sueno ? dd.sueno + "/10" : "Sin marcar") + "</output></div></div></section>";
}
function metasSemana(s) {
  var lunes = lunesDe(s), c = contarSemana(lunes), man = datos.semanal[lunes] || {};
  return "<section class=\"caja metas-caja\"><h2>Metas de la semana</h2><ul class=\"metas\">" + PLAN.metasSemana.map(function (m) {
    if (m.auto) {
      var val = c[m.auto], ok = val >= m.min;
      return "<li class=\"meta" + (ok ? " ok" : "") + "\"><span class=\"meta-ico\">" + ico("check") + "</span><span class=\"meta-txt\">" + esc(m.txt) + "</span><span class=\"meta-n\">" + val + "/" + m.min + "</span><span class=\"meta-barra\" aria-hidden=\"true\"><i style=\"width:" + Math.min(100, val / m.min * 100).toFixed(0) + "%\"></i></span></li>";
    }
    return "<li class=\"meta" + (man[m.id] ? " ok" : "") + "\"><button class=\"meta-btn\" type=\"button\" data-semanal=\"" + m.id + "\" aria-pressed=\"" + (man[m.id] ? "true" : "false") + "\"><span class=\"meta-ico\">" + ico("check") + "</span><span class=\"meta-txt\">" + esc(m.txt) + "</span><span class=\"meta-n\">" + (man[m.id] ? "Hecho" : "Marcar") + "</span></button></li>";
  }).join("") + "</ul></section>";
}
function faseCaja(s, f) {
  return "<section class=\"caja fase\"><h2>" + esc(f.nombre) + "</h2><p class=\"nota\">Del " + bonita(f.desde) + (f.hasta < "2099" ? " al " + bonita(f.hasta) : " en adelante") + (f.def ? ". Semana " + semanaDef(s) + " de " + PLAN.semanasDefinicion + " de definición" : "") + ".</p><p>" + esc(f.nota) + "</p><button class=\"btn-texto\" data-tab=\"guia\">Ver todas las fases</button></section>";
}

/* ---------- RUTINA ---------- */
function vistaRutina() {
  var sug = sugerir(hoy());
  var h = "<header class=\"vista-cab\"><h1>Rutina</h1><p>Seis días, de lunes a sábado. Cada músculo dos veces por semana y más series para tus puntos débiles: gemelos, hombro posterior, brazos y antebrazo.</p></header><ul class=\"ses-lista\">";
  h += PLAN.sesiones.map(function (x) {
    var hecha = sug.hechas[x.id], nEj = x.ej.filter(function (e) { return !e.opc; }).length;
    return "<li><button class=\"ses t-" + x.cal + (hecha ? " hecha" : "") + "\" data-acc=\"abrir\" data-id=\"" + x.id + "\"><span class=\"ses-dia\">" + DIAS[x.dia] + "</span><span class=\"ses-nom\">" + titulo(x.nombre) + "</span>" +
      "<span class=\"ses-det\">" + esc(x.foco) + ". " + nEj + " ejercicios, unos " + x.min + " minutos." + (x.saltable ? " Es la que se salta primero si faltas." : "") + "</span>" +
      "<span class=\"ses-est\">" + (hecha ? ico("check") + "Hecha" : ico("chevron-down", "der")) + "</span></button></li>";
  }).join("") + "</ul>";
  h += caja("Cómo entrenar", lista([
    "**Mancuernas, máquinas y poleas:** al fallo, con técnica limpia.",
    "**Barra:** 1 rep en reserva; en peso muerto, 1 o 2. Es solo por seguridad, porque entrenas sin compañero.",
    "**Sube de peso** cuando llegues al tope del rango en todas las series. La sesión te avisa.",
    "**Descansos:** 3 a 4 minutos en lo pesado, 2 a 3 en lo secundario y 1.5 a 2 en aislamiento. Usa el reloj de cada serie."
  ]), "reglas");
  return h;
}

/* ---------- DIETA ---------- */
function macro(nombre, g, icono) { return "<div class=\"macro\">" + ico(icono) + "<span class=\"macro-v\">" + g + " g</span><span class=\"macro-e\">" + nombre + "</span></div>"; }
function vistaDieta() {
  var s = hoy(), f = faseDe(s), D = PLAN.dieta, esp = diaEspecial(s), normal = f.kcalTexto && !esp, filas = "", tk = 0, tp = 0;
  D.dia.forEach(function (c) {
    filas += "<tr class=\"grupo\"><th colspan=\"3\" scope=\"colgroup\">" + esc(c.comida) + "</th></tr>";
    c.items.forEach(function (it) { tk += it[2]; tp += it[3]; filas += "<tr><td>" + esc(it[0]) + "<span class=\"cant\">" + esc(it[1]) + "</span></td><td class=\"n\">" + it[2] + "</td><td class=\"n\">" + it[3] + " g</td></tr>"; });
  });
  var tabla = "<div class=\"scroll\"><table class=\"tabla\"><thead><tr><th scope=\"col\">Alimento</th><th scope=\"col\" class=\"n\">kcal</th><th scope=\"col\" class=\"n\">Proteína</th></tr></thead><tbody>" + filas + "</tbody><tfoot><tr><td>Total</td><td class=\"n\">" + tk + "</td><td class=\"n\">" + tp + " g</td></tr></tfoot></table></div><p class=\"nota\">Cantidades en cocido. " + esc(D.mantenimiento) + "</p>";
  var fuera = "<p>" + esc(D.fueraIntro) + "</p>" + D.fuera.map(function (x) {
    return "<div class=\"fuera\"><h3>" + esc(x.lugar) + "</h3><p><b class=\"si\">" + ico("check") + "Pide:</b> " + esc(x.si) + "</p><p><b class=\"no\">" + ico("x") + "Evita:</b> " + esc(x.no) + "</p></div>";
  }).join("");
  var equiv = D.equivalencias.map(function (g) { return "<h3>" + esc(g.grupo) + "</h3>" + lista(g.items); }).join("");
  return "<section class=\"dieta-hero\"><p class=\"nota\">" + esc(f.nombre) + (esp ? ", " + esc(esp.nombre) : "") + "</p>" +
    "<p class=\"kcal\"><span class=\"kcal-v\">" + (normal ? "Normal" : (esp ? PLAN.kcalMantenimiento : f.kcal)) + "</span><span class=\"kcal-u\">" + (normal ? "come como siempre" : "kcal al día") + "</span></p>" +
    "<div class=\"macros\">" + macro("proteína", f.p, "beef") + (f.g && !normal ? macro("grasa", f.g, "droplet") + macro("carbohidratos", f.c, "wheat") : "") + "</div><p>" + esc(D.intro) + "</p></section>" +
    "<div class=\"acordeon\">" + acc("Reglas simples", "check", lista(D.reglas), true) + acc("Un día de ejemplo", "calendar-days", tabla) +
    acc("Si compras el almuerzo", "utensils", lista(D.almuerzoComprado)) + acc("Después del gym", "dumbbell", "<p>" + esc(D.postEntreno) + "</p>") +
    acc("Meriendas para la tarde", "coffee", lista(D.meriendas)) + acc("Comer fuera", "flame", fuera) + acc("Equivalencias", "scale", equiv) +
    acc("Si te da hambre", "info", lista(D.hambre)) + acc("Fiestas", "sparkles", lista(D.fiestas)) + acc("Lista de compras", "copy", lista(D.compras)) + "</div>";
}

/* ---------- PROGRESO ---------- */
function vistaProgreso() {
  var secs = [["cuerpo", "Cuerpo"], ["fuerza", "Fuerza"], ["constancia", "Constancia"], ["cuenta", "Cuenta"]];
  var sec = { cuerpo: secCuerpo, fuerza: secFuerza, constancia: secConstancia, cuenta: secCuenta }[progSec];
  return "<header class=\"vista-cab\"><h1>Progreso</h1></header><div class=\"seg\" role=\"tablist\" aria-label=\"Secciones de progreso\">" + secs.map(function (x) {
    return "<button role=\"tab\" type=\"button\" class=\"seg-btn\" data-prog=\"" + x[0] + "\" aria-selected=\"" + (progSec === x[0]) + "\">" + x[1] + "</button>";
  }).join("") + "</div><div class=\"prog\" role=\"tabpanel\">" + sec() + "</div>";
}
function graficaPeso() {
  var s = hoy(), desde = sumarDias(s, -62);
  var pts = datos.pesos.filter(function (p) { return p.fecha >= desde; }).map(function (p) { return { fecha: p.fecha, v: p.kg }; });
  if (pts.length < 2) return "<p class=\"vacio\">Con 2 pesajes o más aparece aquí tu gráfica de peso.</p>";
  var ini = pts[0].fecha;
  var prom = promediosSemanales().filter(function (w) { return sumarDias(w.lunes, 6) >= ini; }).map(function (w) {
    var f = sumarDias(w.lunes, 3); if (f < ini) f = ini; if (f > s) f = s; return { fecha: f, v: w.prom };
  });
  return grafico([{ nombre: "Pesaje", clase: "s-suave", puntos: pts, area: true }, { nombre: "Promedio semanal", clase: "s-tiza", puntos: prom, solo: true }],
    { desde: ini, hasta: s, unidad: "kg", titulo: "Peso de las últimas 9 semanas" });
}
function secCuerpo() {
  var s = hoy(), sem = promediosSemanales().slice(-8), aj = ajusteCalorias(), h = "";
  h += "<section class=\"caja ancho\"><div class=\"caja-cab\"><h2>Peso</h2>" + (pesoActual() ? "<span class=\"dato\">" + fmt(pesoActual(), 1) + " kg</span>" : "") + "</div>" +
    "<div class=\"fila entrada\"><label class=\"sr\" for=\"peso-fecha\">Fecha</label><input id=\"peso-fecha\" type=\"date\" value=\"" + s + "\" max=\"" + s + "\"><label class=\"sr\" for=\"peso-kg\">Peso en kg</label><input id=\"peso-kg\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" placeholder=\"kg\"><button class=\"btn btn-sec\" data-acc=\"guardar-peso2\">Guardar</button></div>" + graficaPeso();
  if (sem.length) {
    h += "<div class=\"scroll\"><table class=\"tabla\"><thead><tr><th scope=\"col\">Semana del</th><th scope=\"col\" class=\"n\">Promedio</th><th scope=\"col\" class=\"n\">Cambio</th><th scope=\"col\">Ritmo</th></tr></thead><tbody>" + sem.map(function (w, i) {
      var prev = i > 0 ? sem[i - 1] : null, ch = prev ? w.prom - prev.prom : null, est = "–";
      if (ch != null && faseDe(w.lunes).def) est = ch > -0.25 ? "Lento" : ch < -0.9 ? "Rápido" : "Bien";
      return "<tr><td>" + bonita(w.lunes) + " <span class=\"suave\">(" + w.n + ")</span></td><td class=\"n\">" + fmt(w.prom, 1) + " kg</td><td class=\"n\">" + (ch == null ? "–" : (ch > 0 ? "+" : "") + fmt(ch, 2)) + "</td><td>" + est + "</td></tr>";
    }).reverse().join("") + "</tbody></table></div>";
  }
  h += "<p class=\"ajuste " + aj.tipo + "\">" + ico(aj.tipo === "ok" ? "check" : aj.tipo === "aviso" ? "triangle-alert" : "info") + "<span>" + esc(aj.txt) + "</span></p>";
  h += datos.pesos.length ? "<details class=\"mini-lista\"><summary>Pesajes anotados</summary>" + datos.pesos.slice(-21).reverse().map(function (p) {
    return "<div class=\"fila-dato\"><span>" + bonita(p.fecha) + "</span><span>" + p.kg + " kg</span><button class=\"ico-btn\" data-acc=\"borrar-peso\" data-f=\"" + p.fecha + "\" aria-label=\"Borrar pesaje del " + bonita(p.fecha) + "\">" + ico("trash-2") + "</button></div>";
  }).join("") + "</details>" : "";
  h += "</section>";

  var cint = datos.cinturas.map(function (c) { return { fecha: c.fecha, v: c.cm }; });
  h += "<section class=\"caja\"><div class=\"caja-cab\"><h2>Cintura</h2>" + (cint.length ? "<span class=\"dato\">" + cint[cint.length - 1].v + " cm</span>" : "") + "</div>" +
    "<p class=\"nota\">Cada lunes en la mañana, antes de desayunar, a la altura del ombligo y sin meter la panza. Es tu mejor señal de que bajas grasa.</p>" +
    "<div class=\"fila entrada\"><label class=\"sr\" for=\"cintura-cm\">Cintura en cm</label><input id=\"cintura-cm\" type=\"number\" inputmode=\"decimal\" step=\"0.1\" placeholder=\"cm\"><button class=\"btn btn-sec\" data-acc=\"guardar-cintura\">Guardar</button></div>" +
    grafico([{ nombre: "Cintura", clase: "s-tiza", puntos: cint, marcas: true }], { unidad: "cm", titulo: "Cintura", vacio: "Con 2 medidas aparece la gráfica.", rangoMin: 2 }) +
    (cint.length ? "<details class=\"mini-lista\"><summary>Medidas anotadas</summary>" + datos.cinturas.slice(-10).reverse().map(function (c) {
      return "<div class=\"fila-dato\"><span>" + bonita(c.fecha) + "</span><span>" + c.cm + " cm</span><button class=\"ico-btn\" data-acc=\"borrar-cintura\" data-f=\"" + c.fecha + "\" aria-label=\"Borrar cintura del " + bonita(c.fecha) + "\">" + ico("trash-2") + "</button></div>";
    }).join("") + "</details>" : "") + "</section>";

  h += resultados();
  h += "<section class=\"caja\"><details class=\"medidas\"" + (datos.medidas.length ? "" : " open") + "><summary><h2>Anotar medidas</h2>" + ico("chevron-down", "acc-flecha") + "</summary>" +
    "<p class=\"nota\">Cada 4 semanas. En cm, en la mañana, relajado y con la cinta pegada a la piel sin apretar. Lo que no tengas, déjalo vacío.</p><div class=\"campos\">" +
    CAMPOS.map(function (c) { var ph = c[0] === "estatura" ? v(ultimoValor("estatura")) : ""; return "<label>" + esc(c[1]) + "<input type=\"number\" inputmode=\"decimal\" step=\"0.1\" data-medida=\"" + c[0] + "\" value=\"" + ph + "\"></label>"; }).join("") +
    "</div><button class=\"btn btn-tipo t-hecho bloque\" data-acc=\"guardar-medidas\">" + ico("check") + "Guardar medidas</button></details></section>";
  h += tablaMedidas() + potencialCaja() + fotosCaja();
  return h;
}
function resultados() {
  var ci = ultimoValor("cintura"), cu = ultimoValor("cuello"), est = ultimoValor("estatura"), peso = pesoActual(), bf = grasaMarina(ci, cu, est);
  if (bf == null) return caja("Grasa y músculo", "<p class=\"vacio\">Guarda cintura, cuello y estatura en Anotar medidas y aquí aparece tu porcentaje de grasa estimado.</p>");
  var h = "<div class=\"nums\">" + num(fmt(bf, 1) + "%", "grasa");
  if (peso) {
    var magra = peso * (1 - bf / 100), m = est / 100, ffmi = magra / (m * m) + 6.1 * (1.8 - m);
    h += num(fmt(magra, 1), "kg de masa magra") + num(fmt(ffmi, 1), "FFMI") + "</div>" +
      "<p>Con el músculo que tienes hoy pesarías <b>" + fmt(magra / 0.88, 1) + " kg al 12%</b> de grasa y <b>" + fmt(magra / 0.9, 1) + " kg al 10%</b>.</p>" +
      "<p class=\"nota\">El FFMI mide cuánto músculo tienes para tu estatura: cerca de 20 es lo promedio, 22 es muy entrenado y 24 a 25 es el techo natural aproximado. Es una estimación por el método de la Marina de EE. UU.; compárala contigo mismo cada mes.</p>";
  } else h += "</div>";
  return caja("Grasa y músculo", h);
}
function tablaMedidas() {
  if (!datos.medidas.length) return "";
  var cols = [["peso", "Peso"], ["cintura", "Cintura"], ["cuello", "Cuello"], ["pecho", "Pecho"], ["brazoCon", "Brazo"], ["antebrazo", "Antebrazo"], ["muslo", "Muslo"], ["pantorrilla", "Pantorrilla"]], est = ultimoValor("estatura");
  return "<section class=\"caja ancho\"><h2>Evolución de medidas</h2><div class=\"scroll\"><table class=\"tabla\"><thead><tr><th scope=\"col\">Fecha</th>" + cols.map(function (c) { return "<th scope=\"col\" class=\"n\">" + c[1] + "</th>"; }).join("") + "<th scope=\"col\" class=\"n\">% grasa</th><th scope=\"col\"><span class=\"sr\">Borrar</span></th></tr></thead><tbody>" +
    datos.medidas.slice().reverse().map(function (m) {
      var bf = grasaMarina(m.cintura, m.cuello, m.estatura || est);
      return "<tr><td>" + bonita(m.fecha) + "</td>" + cols.map(function (c) { return "<td class=\"n\">" + (m[c[0]] != null ? m[c[0]] : "–") + "</td>"; }).join("") + "<td class=\"n\">" + (bf == null ? "–" : fmt(bf, 1)) + "</td><td><button class=\"ico-btn\" data-acc=\"borrar-medida\" data-f=\"" + m.fecha + "\" aria-label=\"Borrar medidas del " + bonita(m.fecha) + "\">" + ico("trash-2") + "</button></td></tr>";
    }).join("") + "</tbody></table></div></section>";
}
function potencialCaja() {
  var est = ultimoValor("estatura"), mu = ultimoValor("muneca"), to = ultimoValor("tobillo");
  if (!est || !mu || !to) return caja("Tu potencial natural", "<p class=\"vacio\">Guarda estatura, muñeca y tobillo en Anotar medidas y aquí verás tu techo natural estimado y cuánto te falta en cada medida.</p>");
  var p = potencial(est, mu, to);
  return caja("Tu potencial natural", "<p>Techo estimado: <b>" + fmt(p.lbm, 1) + " kg de masa magra</b>, unos <b>" + fmt(p.lbm / 0.9, 1) + " kg al 10% de grasa</b>. Una meta más realista, el 95%, son " + fmt(p.lbm * 0.95 / 0.9, 1) + " kg.</p>" +
    "<ul class=\"techo\">" + p.medidas.map(function (t) {
      var hoyV = ultimoValor(t[1]), pct = hoyV ? Math.min(100, hoyV / t[2] * 100) : 0;
      return "<li><div class=\"techo-cab\"><span>" + t[0] + "</span><span>" + (hoyV ? hoyV + " de " : "") + fmt(t[2], 1) + " cm</span></div><div class=\"techo-barra\" aria-hidden=\"true\"><i style=\"width:" + pct.toFixed(0) + "%\"></i></div>" + (hoyV ? "<span class=\"nota\">Te faltan " + fmt(Math.max(0, t[2] - hoyV), 1) + " cm</span>" : "<span class=\"nota\">Sin medir</span>") + "</li>";
    }).join("") + "</ul><p class=\"nota\">Fórmulas de Casey Butt: es el techo de los naturales con mejor genética tras muchos años, medido en condición magra. Sirve de referencia, no es una promesa.</p>");
}
function fotosCaja() {
  if (!nube.user) return caja("Fotos de progreso", "<p class=\"vacio\">Las fotos se guardan en tu cuenta. Entra con Google para usarlas.</p><button class=\"btn btn-sec\" data-acc=\"entrar\">Entrar con Google</button>", "ancho");
  var fechas = []; fotos.forEach(function (f) { if (fechas.indexOf(f.fecha) < 0) fechas.push(f.fecha); }); fechas.sort().reverse();
  if (!cmpA || fechas.indexOf(cmpA) < 0) cmpA = fechas[fechas.length - 1] || null;
  if (!cmpB || fechas.indexOf(cmpB) < 0) cmpB = fechas[0] || null;
  function img(fe, t) { var f = fotos.filter(function (x) { return x.fecha === fe && x.tipo === t; })[0]; return f ? "<img src=\"" + f.img + "\" alt=\"" + t + ", " + bonita(fe) + "\" loading=\"lazy\">" : "<div class=\"sin-foto\">Sin foto</div>"; }
  function opts(sel) { return fechas.map(function (fe) { return "<option value=\"" + fe + "\"" + (fe === sel ? " selected" : "") + ">" + bonita(fe) + " de " + fe.slice(0, 4) + "</option>"; }).join(""); }
  var h = "<p class=\"nota\">Cada 4 semanas, con la misma luz y a la misma hora: frente, perfil y espalda, relajado. Se comprimen y solo tu cuenta puede verlas.</p>" +
    "<div class=\"campos\"><label>Fecha<input type=\"date\" id=\"foto-fecha\" value=\"" + hoy() + "\" max=\"" + hoy() + "\"></label><label>Vista<select id=\"foto-tipo\">" + TIPOS_FOTO.map(function (t) { return "<option value=\"" + t[0] + "\">" + t[1] + "</option>"; }).join("") + "</select></label></div>" +
    "<button class=\"btn btn-sec bloque\" data-acc=\"elegir-foto\">" + ico("camera") + "Subir foto</button><input type=\"file\" id=\"foto-archivo\" accept=\"image/*\" hidden>";
  if (fechas.length >= 2) h += "<h3>Comparar</h3><div class=\"campos\"><label>Antes<select data-cmp=\"a\">" + opts(cmpA) + "</select></label><label>Después<select data-cmp=\"b\">" + opts(cmpB) + "</select></label></div><div class=\"comparar\">" + TIPOS_FOTO.map(function (t) { return img(cmpA, t[0]) + img(cmpB, t[0]); }).join("") + "</div>";
  h += fechas.map(function (fe) {
    return "<h3>" + bonita(fe) + " de " + fe.slice(0, 4) + "</h3><div class=\"fotos\">" + fotos.filter(function (x) { return x.fecha === fe; }).map(function (f) {
      return "<figure><img src=\"" + f.img + "\" alt=\"" + f.tipo + ", " + bonita(fe) + "\" loading=\"lazy\"><figcaption>" + f.tipo + "</figcaption><button class=\"ico-btn foto-borrar\" data-acc=\"borrar-foto\" data-id=\"" + f.id + "\" aria-label=\"Borrar foto\">" + ico("trash-2") + "</button></figure>";
    }).join("") + "</div>";
  }).join("");
  return caja("Fotos de progreso", h, "ancho");
}
function secFuerza() {
  var n = nombresEjercicios(), ids = Object.keys(n).filter(function (id) { return serieEjercicio(id).length; });
  if (!ids.length) return vacia("trophy", "Todavía no hay sesiones", "Cuando guardes sesiones con kilos y repeticiones, aquí verás cómo sube cada ejercicio y tus récords.", "<button class=\"btn btn-sec\" data-tab=\"hoy\">Ir a la sesión de hoy</button>");
  if (!ejSel || ids.indexOf(ejSel) < 0) ejSel = ids.indexOf("sentadilla") >= 0 ? "sentadilla" : ids[0];
  var serie = serieEjercicio(ejSel), mejor = serie.reduce(function (a, p) { return p.v > a.v ? p : a; }, serie[0]);
  var maxTop = serie.reduce(function (a, p) { return Math.max(a, p.top); }, 0), tipo = tipoEjercicio(ejSel);
  var filas = ids.map(function (id) {
    var se = serieEjercicio(id), b = se.reduce(function (a, p) { return p.v > a.v ? p : a; }, se[0]), t = se.reduce(function (a, p) { return Math.max(a, p.top); }, 0);
    return "<tr><td><span class=\"t-" + tipoEjercicio(id) + " pt-txt\"><i class=\"pt\" aria-hidden=\"true\"></i>" + esc(n[id]) + "</span></td><td class=\"n\">" + fmt(b.v, 1) + "</td><td class=\"n\">" + t + "</td><td class=\"n\">" + bonita(b.fecha) + "</td></tr>";
  }).join("");
  return "<section class=\"caja ancho\"><h2>Fuerza por ejercicio</h2><label class=\"sr\" for=\"ej-sel\">Ejercicio</label><select id=\"ej-sel\" data-ej-sel>" + ids.map(function (id) { return "<option value=\"" + id + "\"" + (id === ejSel ? " selected" : "") + ">" + esc(n[id]) + "</option>"; }).join("") + "</select>" +
    "<div class=\"nums\">" + num(fmt(mejor.v, 1), "kg, mejor 1RM estimado") + num(maxTop, "kg, peso más alto") + num(serie.length, serie.length === 1 ? "sesión" : "sesiones") + "</div>" +
    grafico([{ nombre: n[ejSel], clase: "s-" + tipo, puntos: serie, marcas: true, area: true }], { unidad: "kg", titulo: "1RM estimado de " + n[ejSel], vacio: "Con 2 sesiones de este ejercicio aparece la gráfica.", rangoMin: 2 }) +
    "<p class=\"nota\">El 1RM estimado sale de tu mejor serie (peso por repeticiones) y sirve para comparar sesiones aunque cambies las reps. Tu mejor marca fue el " + bonita(mejor.fecha) + ".</p></section>" +
    "<section class=\"caja ancho\"><h2>Récords</h2><div class=\"scroll\"><table class=\"tabla\"><thead><tr><th scope=\"col\">Ejercicio</th><th scope=\"col\" class=\"n\">1RM est.</th><th scope=\"col\" class=\"n\">Máx. kg</th><th scope=\"col\" class=\"n\">Fecha</th></tr></thead><tbody>" + filas + "</tbody></table></div></section>";
}
function secConstancia() {
  var l = lunesDe(hoy()), inicio = PLAN.fases[0].desde, filas = "";
  for (var i = 0; i < 10; i++) {
    var lu = sumarDias(l, -7 * i); if (sumarDias(lu, 6) < inicio) break;
    var c = contarSemana(lu), su = [];
    for (var k = 0; k < 7; k++) { var d = datos.diario[sumarDias(lu, k)]; if (d && d.sueno) su.push(d.sueno); }
    filas += "<tr><td>" + bonita(lu) + "</td><td class=\"n\">" + c.sesiones + "/6</td><td class=\"n\">" + c.proteina + "/7</td><td class=\"n\">" + c.creatina + "/7</td><td class=\"n\">" + c.pantalla + "/7</td><td class=\"n\">" + (su.length ? fmt(su.reduce(function (a, b) { return a + b; }, 0) / su.length, 1) : "–") + "</td></tr>";
  }
  var h = "<section class=\"caja ancho\"><h2>Constancia por semana</h2><div class=\"scroll\"><table class=\"tabla\"><thead><tr><th scope=\"col\">Semana del</th><th scope=\"col\" class=\"n\">Gym</th><th scope=\"col\" class=\"n\">Proteína</th><th scope=\"col\" class=\"n\">Creatina</th><th scope=\"col\" class=\"n\">Pantalla</th><th scope=\"col\" class=\"n\">Sueño</th></tr></thead><tbody>" + filas + "</tbody></table></div><p class=\"nota\">Sale de lo que marcas en Hoy. El sueño es el promedio de cómo te levantaste, del 1 al 10.</p></section>";
  return h + historial();
}
function historial() {
  if (!datos.registros.length) return vacia("dumbbell", "Sin sesiones guardadas", "Aquí aparecerá cada sesión que guardes, con sus series.", "");
  var nombres = nombresEjercicios(), lst = datos.registros.filter(function (r) { return histSel === "todas" || r.sesion === histSel; }).slice(-40).reverse();
  return "<section class=\"caja ancho\"><div class=\"caja-cab\"><h2>Historial</h2><label class=\"sr\" for=\"hist\">Filtrar sesiones</label><select id=\"hist\" data-hist class=\"sel-corto\"><option value=\"todas\">Todas</option>" +
    PLAN.sesiones.map(function (x) { return "<option value=\"" + x.id + "\"" + (histSel === x.id ? " selected" : "") + ">" + esc(x.nombre) + "</option>"; }).join("") + "</select></div>" +
    (lst.length ? "" : "<p class=\"vacio\">No hay sesiones de ese tipo.</p>") + lst.map(function (r) {
      var x = sesion(r.sesion);
      return "<details class=\"hist t-" + (x ? x.cal : "neutro") + "\"><summary><i class=\"pt\" aria-hidden=\"true\"></i><span>" + esc(x ? x.nombre : r.sesion) + "</span><span class=\"suave\">" + DCORTO[diaSemana(r.fecha)] + " " + bonita(r.fecha) + "</span></summary><div class=\"hist-cuerpo\">" +
        Object.keys(r.ej || {}).map(function (id) { return "<p><b>" + esc(nombres[id] || id) + ":</b> " + r.ej[id].map(function (st) { return (st.kg == null ? "–" : st.kg) + " × " + (st.reps == null ? "–" : st.reps); }).join(", ") + "</p>"; }).join("") +
        (r.nota ? "<p class=\"nota\">Nota: " + esc(r.nota) + "</p>" : "") +
        "<button class=\"btn btn-peligro mini\" data-acc=\"borrar-registro\" data-f=\"" + r.fecha + "\" data-id=\"" + r.sesion + "\">" + ico("trash-2") + "Borrar esta sesión</button></div></details>";
    }).join("") + "</section>";
}
var avisoInstalar = null;
window.addEventListener("beforeinstallprompt", function (ev) { ev.preventDefault(); avisoInstalar = ev; if (actual === "progreso" && progSec === "cuenta") render(); });
function secCuenta() {
  var h = htmlCuenta();
  if (avisoInstalar) h += caja("Instalar como app", "<p>Ponla en tu pantalla de inicio y ábrela como una app, a pantalla completa.</p><button class=\"btn btn-sec\" data-acc=\"instalar\">" + ico("download") + "Instalar</button>");
  h += caja("Copia de tus datos", "<p>" + (nube.user ? "Tus datos ya se guardan en la nube. Igual puedes descargar una copia." : "Sin cuenta, tus datos están solo en este equipo. Descarga una copia cada 2 semanas o entra con Google para sincronizar.") + (datos.ajustes.ultimoRespaldo ? " Última copia: " + bonita(datos.ajustes.ultimoRespaldo) + "." : "") + "</p>" +
    "<div class=\"fila\"><button class=\"btn btn-sec\" data-acc=\"exportar\">" + ico("download") + "Descargar copia</button><button class=\"btn btn-sec\" data-acc=\"importar\">" + ico("upload") + "Cargar copia</button></div>" +
    "<button class=\"btn btn-peligro\" data-acc=\"borrar-todo\">" + ico("trash-2") + "Borrar todos mis datos</button>");
  return h;
}

/* ---------- GUIA ---------- */
function vistaGuia() {
  var G = PLAN.guia, fa = faseDe(hoy()).id;
  var fases = "<ol class=\"fases\">" + PLAN.fases.map(function (f) {
    return "<li class=\"" + (f.id === fa ? "actual" : "") + "\"><h3>" + esc(f.nombre) + (f.id === fa ? " <span class=\"aqui\">Estás aquí</span>" : "") + "</h3><p class=\"nota\">Del " + bonita(f.desde) + (f.hasta < "2099" ? " al " + bonita(f.hasta) : " en adelante") + ". " + (f.kcalTexto ? "Comes como siempre." : "Unas " + f.kcal + " kcal al día.") + "</p><p>" + esc(f.nota) + "</p></li>";
  }).join("") + "</ol><p class=\"nota\">Semanas para bajar la carga si hace falta: " + PLAN.descargas.map(function (d) { return "del " + bonita(d.desde) + " al " + bonita(d.hasta) + " (" + d.nombre + ")"; }).join(" y ") + ".</p>";
  return "<header class=\"vista-cab\"><h1>Guía</h1><p>Por qué el plan es así y cómo sacarle provecho.</p></header><div class=\"acordeon\">" +
    acc("Por qué este plan", "sparkles", lista(G.claves), true) + acc("Las fases", "calendar-days", fases) + acc("Cómo entrenar", "dumbbell", lista(G.entreno)) +
    acc("Molestias", "triangle-alert", lista(G.molestias)) + acc("Sueño", "moon", lista(G.sueno)) + acc("Creatina, café y suplementos", "pill", lista(G.suplementos)) +
    acc("Cómo usar esta página", "info", lista(G.pagina)) + acc("Estudios en los que se basa", "book-open", lista(G.fuentes)) + "</div>";
}
