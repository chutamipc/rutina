# rutina

Página personal de entrenamiento, dieta y progreso (celular y PC): https://chutamipc.github.io/rutina/

Sin frameworks ni build: se publica tal cual con GitHub Pages desde `main`. Se puede instalar como app (PWA) y funciona sin internet.

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Estructura, íconos (Lucide, licencia ISC) y pantalla de inicio de sesión |
| `css/estilos.css` | Diseño para celular y PC. Colores por tipo de día: pierna rojo, torso azul, hombros y brazos dorado; verde para lo hecho |
| `js/plan.js` | El plan: fases, calorías, ejercicios y comidas. Es lo que más se cambia |
| `js/datos.js` | Utilidades, fechas, almacenamiento, qué toca hoy y fórmulas |
| `js/graficas.js` | Gráficas de línea con valor al tocar |
| `js/vistas.js` | Pestañas: Hoy, Rutina, Dieta, Progreso y Guía |
| `js/sesion.js` | Registro de series, récords y temporizador de descanso |
| `js/nube.js` | Firebase: inicio de sesión con Google y sincronización |
| `js/eventos.js` | Botones, copias de seguridad y avisos |
| `js/inicio.js` | Arranque y registro de la app instalable |
| `sw.js`, `manifest.webmanifest`, `img/` | App instalable y uso sin internet |
| `fonts/` | Archivo (Google Fonts, licencia OFL), guardada aquí para no depender de internet |

## Datos

- Con sesión iniciada, todo se guarda en Firestore bajo `usuarios/{uid}/` y se sincroniza entre equipos. Sin internet, se guarda en el equipo y se sube después.
- La sesión queda guardada en el equipo hasta que se toca "Cerrar sesión".
- Sin cuenta, los datos quedan solo en el navegador (`localStorage`, clave `rutina-v1`).
- Para probar otra fecha: agregar `?fecha=2026-12-01` a la URL.
- Al cambiar archivos, sube la versión de `CACHE` en `sw.js` para que los equipos instalados tomen la nueva.
