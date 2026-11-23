# rutina

Página personal de entrenamiento, dieta y progreso (celular y PC): https://chutamipc.github.io/rutina/

Sin frameworks ni build: se publica tal cual con GitHub Pages desde `main`.

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Estructura de la página y pantalla de inicio de sesión |
| `css/estilos.css` | Diseño (celular y PC) |
| `js/plan.js` | El plan: fases, calorías, ejercicios y comidas. Es lo que más se cambia. |
| `js/app.js` | Lógica: Hoy, sesiones, dieta, progreso y guía |
| `js/nube.js` | Firebase: inicio de sesión con Google y sincronización |
| `js/inicio.js` | Arranque |

## Datos

- Con sesión iniciada, todo se guarda en Firestore bajo `usuarios/{uid}/` y se sincroniza entre equipos. Sin internet, se guarda en el equipo y se sube después.
- La sesión queda guardada en el equipo hasta que se toca "Cerrar sesión".
- Sin cuenta, los datos quedan solo en el navegador (`localStorage`, clave `rutina-v1`).
- Para probar otra fecha: agregar `?fecha=2026-12-01` a la URL.
