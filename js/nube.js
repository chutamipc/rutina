"use strict";
/* ---------- NUBE (Firebase): cuenta y sincronizacion ---------- */
var FIREBASE = {
  apiKey: "AIzaSyAkWGXnn5rVfgLlDEd1EL9IhSHar93OHfw",
  authDomain: "rutina-9572d.firebaseapp.com",
  projectId: "rutina-9572d",
  storageBucket: "rutina-9572d.firebasestorage.app",
  messagingSenderId: "38953618508",
  appId: "1:38953618508:web:0f00dc48c18fab278538e9"
};
var FB_VERSION = "10.14.1";
var nube = { A: null, F: null, auth: null, db: null, user: null, ref: null, subs: [], error: null };
function cargarFirebase() {
  var base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]).then(function (m) {
    var app = m[0].initializeApp(FIREBASE);
    nube.A = m[1]; nube.F = m[2];
    try {
      nube.auth = m[1].initializeAuth(app, {
        persistence: [m[1].indexedDBLocalPersistence, m[1].browserLocalPersistence],
        popupRedirectResolver: m[1].browserPopupRedirectResolver
      });
    } catch (e) { nube.auth = m[1].getAuth(app); }
    try { nube.db = m[2].initializeFirestore(app, { localCache: m[2].persistentLocalCache({ tabManager: m[2].persistentMultipleTabManager() }) }); }
    catch (e) { nube.db = m[2].getFirestore(app); }
    m[1].getRedirectResult(nube.auth).catch(errNube);
    m[1].onAuthStateChanged(nube.auth, alCambiarUsuario);
  }).catch(function (e) { nube.error = "sin-conexion"; console.warn("Firebase no cargó", e); pintarCuenta(); if (!modoSesion()) pantallaInicio("sin-red"); if (actual === "progreso") render(); });
}
function errNube(e) {
  console.warn("nube", e);
  if (!e) return;
  if (e.code === "permission-denied") aviso("La nube rechazó el guardado. Revisa las reglas de Firestore.", "triangle-alert");
  else if (e.code === "auth/unauthorized-domain") aviso("Este dominio no está autorizado en Firebase.", "triangle-alert");
  else if (e.code && e.code.indexOf("auth/") === 0 && e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") aviso("No se pudo iniciar sesión (" + e.code + "). Intenta de nuevo.", "triangle-alert");
}
function entrar() {
  if (!nube.A) { aviso("Conectando con la nube. Intenta en unos segundos.", "cloud"); return; }
  var prov = new nube.A.GoogleAuthProvider();
  nube.A.signInWithPopup(nube.auth, prov).catch(function (e) {
    if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) return nube.A.signInWithRedirect(nube.auth, prov);
    errNube(e);
  });
}
function salir() { if (nube.A && confirm("¿Cerrar sesión en este equipo? Tus datos siguen en la nube.")) { modoSesion(null); nube.A.signOut(nube.auth); } }
function desuscribir() { nube.subs.forEach(function (u) { try { u(); } catch (e) {} }); nube.subs = []; }
function alCambiarUsuario(u) {
  desuscribir(); nube.user = u || null;
  if (!u) {
    fotos = []; nube.ref = null; pintarCuenta();
    if (modoSesion() === "local") pantallaInicio("oculto"); else { modoSesion(null); pantallaInicio("entrar"); }
    render(); return;
  }
  modoSesion("google"); pantallaInicio("oculto");
  nube.ref = nube.F.doc(nube.db, "usuarios", u.uid, "datos", "principal");
  pintarCuenta();
  var hayLocal = datos.registros.length || datos.pesos.length || datos.medidas.length || datos.cinturas.length || Object.keys(datos.diario).length;
  var primera = datos.ajustes.subidoA !== u.uid && hayLocal;
  var migrar = !primera && datos.ajustes.subidoA === u.uid && !datos.ajustes.colaV;
  (primera ? primeraSubida(u) : migrar ? reconciliar(u) : Promise.resolve()).then(function () {
    if (!primera) datos.ajustes.subidoA = u.uid;
    datos.ajustes.colaV = 1;
    guardar(); enviarPendientes(); escuchar();
  }, function (e) {
    /* Si no se pudo comparar con la nube, no se escucha en esta visita: asi
       los datos del equipo no se tocan y se reintenta al abrir de nuevo. */
    errNube(e); guardar();
  });
}
/* Una sola vez, en equipos que ya usaban la nube antes de la cola de cambios:
   sube lo que este equipo tenga y la nube no (sesiones, pesos, medidas y
   habitos), sin pisar lo que la nube ya tiene. */
function reconciliar(u) {
  var F = nube.F;
  return Promise.all([F.getDocs(F.collection(nube.db, "usuarios", u.uid, "registros")), F.getDoc(nube.ref)]).then(function (rs) {
    var ids = rs[0].docs.map(function (d) { return d.id; }), remoto = rs[1].exists() ? rs[1].data() : {};
    var b = F.writeBatch(nube.db), n = 0, local = principalLocal(), falta = {}, hay = false;
    datos.registros.forEach(function (r) { if (ids.indexOf(r.fecha + "_" + r.sesion) < 0 && n < 400) { b.set(F.doc(nube.db, "usuarios", u.uid, "registros", r.fecha + "_" + r.sesion), r); n++; } });
    ["pesos", "cinturas", "medidas"].forEach(function (c) {
      Object.keys(local[c]).forEach(function (f) { if (!remoto[c] || !(f in remoto[c])) { falta[c] = falta[c] || {}; falta[c][f] = local[c][f]; hay = true; } });
    });
    ["diario", "semanal"].forEach(function (c) {
      Object.keys(local[c] || {}).forEach(function (f) {
        Object.keys(local[c][f] || {}).forEach(function (k) {
          if (!remoto[c] || !remoto[c][f] || !(k in remoto[c][f])) { falta[c] = falta[c] || {}; falta[c][f] = falta[c][f] || {}; falta[c][f][k] = local[c][f][k]; hay = true; }
        });
      });
    });
    if (hay) b.set(nube.ref, falta, { merge: true });
    if (!n && !hay) return;
    return b.commit().then(function () { if (n) aviso(n + (n === 1 ? " sesión de este equipo se subió" : " sesiones de este equipo se subieron") + " a la nube", "cloud"); });
  });
}
/* Primera vez que este equipo entra a la cuenta: sube lo que tenga. Si la
   cuenta ya tiene sesiones y este equipo trae otras distintas (por ejemplo
   pruebas), pregunta antes de mezclarlas. */
function primeraSubida(u) {
  var F = nube.F;
  return F.getDocs(F.collection(nube.db, "usuarios", u.uid, "registros")).then(function (qs) {
    var ids = qs.docs.map(function (d) { return d.id; });
    var nuevos = datos.registros.filter(function (r) { return ids.indexOf(r.fecha + "_" + r.sesion) < 0; }).length;
    if (ids.length && nuevos && !confirm("Este equipo tiene " + nuevos + (nuevos === 1 ? " sesión que no está" : " sesiones que no están") + " en tu cuenta. ¿Agregarlas a tu cuenta?\n\nSi eran pruebas, toca Cancelar y en este equipo quedará solo lo que ya está en tu cuenta.")) {
      datos.ajustes.subidoA = u.uid; datos.ajustes.colaV = 1; datos.pendientes = []; guardar(); return;
    }
    return subirTodo().then(function () { datos.ajustes.subidoA = u.uid; datos.ajustes.colaV = 1; datos.pendientes = []; guardar(); aviso("Tus datos de este equipo se subieron a la nube", "cloud"); });
  });
}
function escuchar() {
  var F = nube.F, uid = nube.user.uid;
  nube.subs.push(F.onSnapshot(nube.ref, function (sn) {
    var vacioCache = sn.metadata && sn.metadata.fromCache && !sn.exists();
    if (vacioCache && (datos.pesos.length || Object.keys(datos.diario).length)) return;
    aplicarPrincipal(sn.exists() ? sn.data() : {});
  }, errNube));
  nube.subs.push(F.onSnapshot(F.collection(nube.db, "usuarios", uid, "registros"), function (qs) {
    if (qs.metadata && qs.metadata.fromCache && qs.empty && datos.registros.length) return;
    datos.registros = qs.docs.map(function (d) { return d.data(); }).sort(porFecha);
    datos.pendientes.forEach(function (op) { if (op.t === "reg" || op.t === "regDel") aplicarOpLocal(op); });
    guardar(); refrescar();
  }, errNube));
  nube.subs.push(F.onSnapshot(F.collection(nube.db, "usuarios", uid, "fotos"), function (qs) {
    fotos = qs.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(porFecha); if (actual === "progreso") refrescar();
  }, errNube));
}
function mapaArr(m, fn) { return Object.keys(m || {}).sort().map(function (f) { return fn(f, m[f]); }); }
function aplicarPrincipal(p) {
  datos.pesos = mapaArr(p.pesos, function (f, x) { return { fecha: f, kg: x }; });
  datos.cinturas = mapaArr(p.cinturas, function (f, x) { return { fecha: f, cm: x }; });
  datos.medidas = mapaArr(p.medidas, function (f, x) { return Object.assign({ fecha: f }, x); });
  datos.diario = p.diario || {}; datos.semanal = p.semanal || {};
  datos.pendientes.forEach(function (op) { if (op.t === "set" || op.t === "del") aplicarOpLocal(op); });
  guardar(); refrescar();
}
function refrescar() {
  var foco = document.activeElement;
  if (foco && foco.matches && foco.matches("main input[type=number], main input[type=date], main textarea")) return;
  render();
}
function principalLocal() {
  var p = { pesos: {}, cinturas: {}, medidas: {}, diario: datos.diario, semanal: datos.semanal };
  datos.pesos.forEach(function (x) { p.pesos[x.fecha] = x.kg; });
  datos.cinturas.forEach(function (x) { p.cinturas[x.fecha] = x.cm; });
  datos.medidas.forEach(function (x) { var c = Object.assign({}, x); delete c.fecha; p.medidas[x.fecha] = c; });
  return p;
}
function subirTodo() {
  if (!nube.user) return Promise.resolve();
  var F = nube.F, uid = nube.user.uid, b = F.writeBatch(nube.db);
  b.set(nube.ref, principalLocal(), { merge: true });
  datos.registros.slice(-450).forEach(function (r) { b.set(F.doc(nube.db, "usuarios", uid, "registros", r.fecha + "_" + r.sesion), r); });
  return b.commit();
}

/* ---------- Cola de cambios ----------
   Cada cambio queda guardado en el equipo (datos.pendientes) hasta que la
   nube confirma que lo recibio. Asi no se pierde nada si se anota algo
   mientras la nube todavia carga, sin internet o con mala senal: se envia
   apenas hay conexion, aunque se haya cerrado la app. */
var opsEnVuelo = {};
function encolar(op) {
  if (!datos.ajustes.subidoA && !nube.user) return;
  op.n = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  datos.pendientes.push(op); guardar();
  if (nube.user && nube.ref) enviar(op);
}
function enviar(op) {
  if (opsEnVuelo[op.n]) return;
  var F = nube.F, uid = nube.user.uid, p;
  try {
    if (op.t === "set") p = F.setDoc(nube.ref, op.obj, { merge: true });
    else if (op.t === "del") p = F.setDoc(nube.ref, o(op.campo, o(op.clave, F.deleteField())), { merge: true });
    else if (op.t === "reg") p = F.setDoc(F.doc(nube.db, "usuarios", uid, "registros", op.reg.fecha + "_" + op.reg.sesion), op.reg);
    else if (op.t === "regDel") p = F.deleteDoc(F.doc(nube.db, "usuarios", uid, "registros", op.f + "_" + op.ses));
    else p = Promise.resolve();
  } catch (e) { p = Promise.reject(e); }
  opsEnVuelo[op.n] = true;
  p.then(function () {
    delete opsEnVuelo[op.n];
    datos.pendientes = datos.pendientes.filter(function (x) { return x.n !== op.n; }); guardar();
  }).catch(function (e) { delete opsEnVuelo[op.n]; errNube(e); });
}
function enviarPendientes() { if (nube.user && nube.ref) datos.pendientes.slice().forEach(enviar); }
function upsertFecha(lista, item) { var out = lista.filter(function (x) { return x.fecha !== item.fecha; }); out.push(item); return out.sort(porFecha); }
/* Aplica un cambio pendiente sobre los datos del equipo (para que se vea
   aunque la nube aun no lo tenga). */
function aplicarOpLocal(op) {
  var f;
  if (op.t === "reg") {
    datos.registros = datos.registros.filter(function (r) { return !(r.fecha === op.reg.fecha && r.sesion === op.reg.sesion); });
    datos.registros.push(op.reg); datos.registros.sort(porFecha);
  }
  else if (op.t === "regDel") datos.registros = datos.registros.filter(function (r) { return !(r.fecha === op.f && r.sesion === op.ses); });
  else if (op.t === "set") {
    var x = op.obj;
    if (x.pesos) for (f in x.pesos) datos.pesos = upsertFecha(datos.pesos, { fecha: f, kg: x.pesos[f] });
    if (x.cinturas) for (f in x.cinturas) datos.cinturas = upsertFecha(datos.cinturas, { fecha: f, cm: x.cinturas[f] });
    if (x.medidas) for (f in x.medidas) datos.medidas = upsertFecha(datos.medidas, Object.assign({ fecha: f }, x.medidas[f]));
    if (x.diario) for (f in x.diario) datos.diario[f] = Object.assign({}, datos.diario[f] || {}, x.diario[f]);
    if (x.semanal) for (f in x.semanal) datos.semanal[f] = Object.assign({}, datos.semanal[f] || {}, x.semanal[f]);
  }
  else if (op.t === "del") {
    if (op.campo === "pesos") datos.pesos = datos.pesos.filter(function (y) { return y.fecha !== op.clave; });
    else if (op.campo === "cinturas") datos.cinturas = datos.cinturas.filter(function (y) { return y.fecha !== op.clave; });
    else if (op.campo === "medidas") datos.medidas = datos.medidas.filter(function (y) { return y.fecha !== op.clave; });
  }
}
function nubeSet(obj) { encolar({ t: "set", obj: obj }); }
function nubeDel(campo, clave) { encolar({ t: "del", campo: campo, clave: clave }); }
function nubeReg(r) { encolar({ t: "reg", reg: r }); }
function nubeRegDel(f, ses) { encolar({ t: "regDel", f: f, ses: ses }); }
function subirFoto(file) {
  var fecha = $("#foto-fecha").value || hoy(), tipo = $("#foto-tipo").value;
  aviso("Subiendo foto…", "upload");
  comprimir(file).then(function (img) {
    return nube.F.setDoc(nube.F.doc(nube.db, "usuarios", nube.user.uid, "fotos", fecha + "_" + tipo), { fecha: fecha, tipo: tipo, img: img });
  }).then(function () { aviso("Foto guardada", "camera"); }).catch(function (e) { errNube(e); if (!e || !e.code) aviso("No se pudo leer esa imagen. Prueba con otra foto.", "triangle-alert"); });
}
function borrarNube() {
  var F = nube.F, uid = nube.user.uid;
  return Promise.all(["registros", "fotos"].map(function (c) { return F.getDocs(F.collection(nube.db, "usuarios", uid, c)); })).then(function (rs) {
    var b = F.writeBatch(nube.db), n = 0;
    rs.forEach(function (qs) { qs.docs.forEach(function (d) { if (n < 480) { b.delete(d.ref); n++; } }); });
    b.delete(nube.ref);
    return b.commit();
  });
}
function pintarCuenta() {
  var b = $("#cuenta"); if (!b) return;
  var conectado = !!nube.user, enLinea = navigator.onLine;
  b.innerHTML = ico(conectado && !enLinea ? "cloud-off" : "cloud") + "<span>" + (conectado ? (enLinea ? "Sincronizado" : "Sin internet") : (nube.error ? "Sin nube" : "Entrar")) + "</span>";
  b.classList.toggle("on", conectado && enLinea);
  b.setAttribute("aria-label", conectado ? (enLinea ? "Tu cuenta: datos sincronizados" : "Sin internet: se sube al volver la conexión") : "Entrar con Google");
}
function htmlAvisoNube() {
  if (nube.user || !nube.A) return "";
  return banda("cloud", "Entra con Google para guardar todo en la nube y verlo igual en el celular y en la PC.", "<button class=\"btn btn-sec mini\" data-acc=\"entrar\">Entrar</button>");
}
function htmlCuenta() {
  if (!nube.A) return caja("Tu cuenta", "<p class=\"vacio\">" + (nube.error ? "No hay conexión con la nube. Lo que anotes queda en este equipo y se sube cuando entres." : "Conectando con la nube…") + "</p>");
  if (!nube.user) return caja("Sincroniza celular y PC", "<p>Entra con tu cuenta de Google y todo lo que anotes se guarda en la nube. Lo que ya tienes en este equipo se sube la primera vez. Solo tu cuenta puede ver tus datos.</p><button class=\"btn btn-tipo t-torso\" data-acc=\"entrar\">" + ico("user") + "Entrar con Google</button>");
  return caja("Tu cuenta", "<p class=\"cuenta-correo\">" + ico("user") + "<b>" + esc(nube.user.email || nube.user.displayName || "Tu cuenta") + "</b></p><p>Todo se sincroniza solo. Sin internet se guarda en el equipo y se sube después. La sesión queda abierta en este equipo hasta que la cierres.</p>" +
    "<details class=\"mini-lista\"><summary>Código de tu cuenta</summary><p class=\"nota\">Sirve para cerrar la base de datos solo a tu cuenta.</p><code class=\"uid\">" + esc(nube.user.uid) + "</code><button class=\"btn btn-sec mini\" data-acc=\"copiar-uid\">" + ico("copy") + "Copiar</button></details>" +
    "<button class=\"btn btn-sec\" data-acc=\"salir\">" + ico("log-out") + "Cerrar sesión</button>");
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

/* ---------- Pantalla de inicio de sesion ----------
   La sesion de Google queda guardada en el equipo (IndexedDB) hasta que se
   toca "Cerrar sesion". Se recuerda tambien si se eligio usar sin cuenta. */
var CLAVE_SESION = "rutina-sesion";
function modoSesion(val) {
  try {
    if (val === undefined) return localStorage.getItem(CLAVE_SESION);
    if (val === null) localStorage.removeItem(CLAVE_SESION); else localStorage.setItem(CLAVE_SESION, val);
  } catch (e) { return null; }
}
function pantallaInicio(modo) {
  var caja = $("#inicio"); if (!caja) return;
  caja.hidden = modo === "oculto";
  $("#inicio-estado").textContent = modo === "cargando" ? "Cargando…" : modo === "sin-red" ? "No hay conexión con la nube. Puedes seguir sin cuenta y entrar después." : "";
  $("#inicio-entrar").hidden = modo !== "entrar";
  $("#inicio-local").hidden = modo === "cargando";
  document.body.classList.toggle("con-inicio", modo !== "oculto");
}
