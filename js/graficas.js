"use strict";
/* Graficas de linea en SVG. El dibujo se estira al ancho disponible
   (preserveAspectRatio="none") y los trazos no se deforman gracias a
   vector-effect; los textos van en HTML para que siempre se lean igual.
   Al tocar o pasar el mouse aparece una linea guia con el valor. */

var graficaN = 0;
function pasoBonito(rango) {
  var bruto = rango / 3, mag = Math.pow(10, Math.floor(Math.log10(bruto))), r = bruto / mag;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
}
/* series: [{ nombre, clase: "s-tiza"|"s-pierna"|..., puntos: [{fecha, v}], marcas: bool, area: bool, solo: bool }]
   o: { desde, hasta, unidad, dec, vacio, titulo } */
function grafico(series, o) {
  o = o || {};
  var todos = [];
  series.forEach(function (s) { s.puntos.forEach(function (p) { todos.push(p); }); });
  if (todos.length < 2) return "<p class=\"vacio\">" + esc(o.vacio || "Con 2 datos o más aparece la gráfica.") + "</p>";
  var fechas = todos.map(function (p) { return p.fecha; }).sort();
  var desde = o.desde || fechas[0], hasta = o.hasta || fechas[fechas.length - 1], span = Math.max(1, diasEntre(desde, hasta));
  var vals = todos.map(function (p) { return p.v; }), min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  var paso = pasoBonito(Math.max(max - min, o.rangoMin || 1));
  var lo = Math.floor(min / paso) * paso, hi = Math.ceil(max / paso) * paso;
  if (hi - lo < paso * 2) hi = lo + paso * 2;
  function X(f) { return Math.max(0, Math.min(100, diasEntre(desde, f) / span * 100)); }
  function Y(val) { return (1 - (val - lo) / (hi - lo)) * 100; }
  var id = "g" + (++graficaN), svg = "", ejeY = "", tip = [];
  svg += "<defs>" + series.map(function (s, i) { return "<linearGradient class=\"" + s.clase + "\" id=\"" + id + "-" + i + "\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" class=\"g-stop\" stop-opacity=\".32\"/><stop offset=\"1\" class=\"g-stop\" stop-opacity=\"0\"/></linearGradient>"; }).join("") + "</defs>";
  for (var t = lo; t <= hi + paso / 2; t += paso) {
    svg += "<line class=\"g-rej\" x1=\"0\" x2=\"100\" y1=\"" + Y(t).toFixed(2) + "\" y2=\"" + Y(t).toFixed(2) + "\" vector-effect=\"non-scaling-stroke\"/>";
    ejeY += "<span style=\"top:" + Y(t).toFixed(2) + "%\">" + fmt(t, paso % 1 ? 1 : 0) + "</span>";
  }
  series.forEach(function (s, i) {
    var pts = s.puntos.slice().sort(porFecha);
    var xy = pts.map(function (p) { return X(p.fecha).toFixed(2) + "," + Y(p.v).toFixed(2); });
    var g = "<g class=\"" + s.clase + "\">";
    if (s.area && pts.length > 1) g += "<path class=\"g-area\" fill=\"url(#" + id + "-" + i + ")\" d=\"M" + X(pts[0].fecha).toFixed(2) + ",100 L" + xy.join(" L") + " L" + X(pts[pts.length - 1].fecha).toFixed(2) + ",100 Z\"/>";
    if (!s.solo && pts.length > 1) g += "<polyline class=\"g-linea\" points=\"" + xy.join(" ") + "\" vector-effect=\"non-scaling-stroke\"/>";
    if (s.marcas || s.solo) g += pts.map(function (p) { return "<path class=\"g-marca\" d=\"M" + X(p.fecha).toFixed(2) + " " + Y(p.v).toFixed(2) + "h0\" vector-effect=\"non-scaling-stroke\"/>"; }).join("");
    svg += g + "</g>";
    pts.forEach(function (p) { tip.push({ x: +X(p.fecha).toFixed(2), y: +Y(p.v).toFixed(2), t: bonita(p.fecha) + ": " + fmt(p.v, o.dec == null ? 1 : o.dec) + (o.unidad ? " " + o.unidad : "") + (series.length > 1 ? " (" + s.nombre.toLowerCase() + ")" : ""), c: s.clase }); });
  });
  var leyenda = series.length > 1 ? "<div class=\"g-ley\">" + series.map(function (s) { return "<span class=\"" + s.clase + "\"><i class=\"" + (s.solo ? "punto" : "raya") + "\"></i>" + esc(s.nombre) + "</span>"; }).join("") + "</div>" : "";
  return "<figure class=\"graf\" data-g=\"" + esc(JSON.stringify(tip)) + "\">" +
    "<div class=\"g-caja\" role=\"img\" aria-label=\"" + esc(o.titulo || "Gráfica") + ", del " + bonita(desde) + " al " + bonita(hasta) + "\">" +
    "<div class=\"g-ejey\" aria-hidden=\"true\">" + ejeY + "</div>" +
    "<div class=\"g-dibujo\"><svg viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\" aria-hidden=\"true\">" + svg + "</svg>" +
    "<i class=\"g-guia\" hidden></i><i class=\"g-punto\" hidden></i><span class=\"g-tip\" hidden></span></div></div>" +
    "<div class=\"g-ejex\" aria-hidden=\"true\"><span>" + bonita(desde) + "</span><span>" + bonita(hasta) + "</span></div>" + leyenda + "</figure>";
}

/* Linea guia y valor al tocar o pasar el mouse. */
function moverGuia(ev) {
  var caja = ev.target.closest && ev.target.closest(".g-dibujo"); if (!caja) return;
  var fig = caja.closest(".graf"), pts; try { pts = JSON.parse(fig.dataset.g || "[]"); } catch (e) { return; }
  if (!pts.length) return;
  var r = caja.getBoundingClientRect(), xp = (ev.clientX - r.left) / r.width * 100, mejor = pts[0];
  pts.forEach(function (p) { if (Math.abs(p.x - xp) < Math.abs(mejor.x - xp)) mejor = p; });
  var guia = $(".g-guia", caja), punto = $(".g-punto", caja), tip = $(".g-tip", caja);
  guia.hidden = punto.hidden = tip.hidden = false;
  guia.style.left = punto.style.left = mejor.x + "%";
  punto.style.top = mejor.y + "%";
  punto.className = "g-punto " + mejor.c;
  tip.textContent = mejor.t;
  tip.style.left = Math.min(Math.max(mejor.x, 18), 82) + "%";
  tip.style.top = (mejor.y < 30 ? mejor.y + 10 : mejor.y - 22) + "%";
}
function ocultarGuia(ev) {
  var caja = ev.target.closest && ev.target.closest(".g-dibujo"); if (!caja || ev.pointerType === "touch" || (ev.relatedTarget && caja.contains(ev.relatedTarget))) return;
  $$(".g-guia, .g-punto, .g-tip", caja).forEach(function (el) { el.hidden = true; });
}
document.addEventListener("pointermove", moverGuia);
document.addEventListener("pointerdown", moverGuia);
document.addEventListener("pointerout", ocultarGuia);
