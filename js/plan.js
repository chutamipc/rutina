"use strict";
/* ==========================================================================
   PLAN - CAMBIAR AQUI
   Fechas (AAAA-MM-DD), calorias, sesiones, ejercicios y comidas.
   Ejercicio: n = nombre, s = series, r = [min, max] reps, e = esfuerzo
   (rir2, rir1, fallo, fallo+, duro), d = descanso en segundos,
   a = aproximaciones (barra, mancuerna, pm), opc = opcional.
   ========================================================================== */
var PLAN = {
  fases: [
    { id: "s0", nombre: "Semana 0 · Prueba", corto: "Semana 0", desde: "2026-11-23", hasta: "2026-11-29",
      kcal: 2400, kcalTexto: "Normal", p: 140, g: null, c: null,
      nota: "Come como siempre, pero ya con proteína alta, sin jugo y máximo 1 pan. Pesa tus porciones para aprender. Entrena dejando 2-3 reps en reserva para encontrar tus pesos. Esta semana: medidas, fotos y empezar la creatina." },
    { id: "def1", nombre: "Definición · Bloque 1", corto: "Definición", desde: "2026-11-30", hasta: "2026-12-20",
      kcal: 2000, p: 145, g: 60, c: 220, def: true,
      nota: "Meta: bajar unos 0.5 kg por semana. Entrena pesado: mantener tus pesos ya es ganar." },
    { id: "mant", nombre: "Mantenimiento · Navidad", corto: "Mantenimiento", desde: "2026-12-21", hasta: "2027-01-03",
      kcal: 2450, p: 140, g: 70, c: 315,
      nota: "Comes más (sobre todo carbohidratos) y disfrutas las fiestas sin culpa. La balanza sube 1-2 kg por agua y glucógeno: es normal, no es grasa." },
    { id: "def2", nombre: "Definición · Bloque 2", corto: "Definición", desde: "2027-01-04", hasta: "2027-02-28",
      kcal: 2000, p: 145, g: 60, c: 220, def: true,
      nota: "Igual que el bloque 1. En Carnaval (8 y 9 de febrero) comes a mantenimiento." },
    { id: "eval", nombre: "Evaluación", corto: "Evaluación", desde: "2027-03-01", hasta: "2099-12-31",
      kcal: 2000, p: 145, g: 60, c: 220,
      nota: "Mide todo y toma fotos. Con eso decidimos si sigues definiendo unas semanas o pasas a volumen limpio." }
  ],
  semanasDefinicion: 11,
  kcalMantenimiento: 2450,
  descargas: [
    { desde: "2026-12-28", hasta: "2027-01-03", nombre: "Fin de Año" },
    { desde: "2027-02-08", hasta: "2027-02-14", nombre: "Carnaval" }
  ],
  diasMantenimiento: [
    { fecha: "2027-02-08", nombre: "Carnaval" },
    { fecha: "2027-02-09", nombre: "Carnaval" }
  ],

  calentamiento: {
    pierna: "5 min de caminadora (caminando) o bici suave. Luego 10 balanceos de pierna por lado, 5 sentadillas profundas sin peso con pausa abajo y 10 puentes de glúteo. Después, las aproximaciones del primer ejercicio.",
    torso: "5 min suaves de caminadora o bici. Luego 15 face pull muy livianos, 10 círculos grandes de hombro y 15 rotaciones externas con polea liviana por brazo. Después, las aproximaciones del primer ejercicio.",
    brazos: "Lo mismo que el día de torso y, antes del primer ejercicio de brazo, 1 serie de 20 de curl y 1 de jalón de tríceps en polea, muy livianas, para calentar los codos."
  },

  sesiones: [
    { id: "PA", nombre: "Pierna A", corto: "Pierna A", foco: "Cuádriceps", dia: 0, min: 75, cal: "pierna", ej: [
      { id: "sentadilla", n: "Sentadilla con barra (barra alta)", s: 3, r: [5, 8], e: "rir1", d: 210, a: "barra",
        tip: "En la jaula, con las barras de seguridad un poco debajo de tu punto más bajo. Baja controlado (2-3 s) hasta tu profundidad de siempre y sube fuerte. Si una rep sale lenta o la técnica se rompe, esa es la última.",
        alt: "Sentadilla hack 3 × 8-12." },
      { id: "femoral-sentado", n: "Femoral sentado (máquina)", s: 3, r: [8, 12], e: "fallo", d: 120,
        tip: "Cadera bien atrás y torso un poco inclinado adelante: así el femoral se estira más y crece más que en el acostado. Sube fuerte y baja en 3 s.",
        alt: "Femoral acostado con una toalla doblada bajo el cojín duro." },
      { id: "extension-cuadriceps", n: "Extensión de cuádriceps", s: 3, r: [10, 15], e: "fallo+", d: 120,
        x: "Opcional, en la última serie: al llegar al fallo, sigue con 4-6 medias repeticiones en la parte de abajo (rodilla doblada).",
        tip: "Pausa de 1 s arriba y baja en 3 s." },
      { id: "aductores", n: "Aductores (máquina)", s: 2, r: [10, 15], e: "fallo", d: 90,
        tip: "Abre hasta sentir estiramiento y cierra apretando 1 s." },
      { id: "gemelos-pie", n: "Gemelos de pie (máquina)", s: 4, r: [8, 12], e: "fallo+", d: 90,
        x: "Opcional: al llegar al fallo, sigue con medias repeticiones en la parte de abajo (talón bajo) hasta no poder.",
        tip: "Abajo, pausa de 2 s con el talón lo más bajo posible: el gemelo crece más trabajando estirado. Sube completo y explosivo, rodillas casi rectas." },
      { id: "crunch-polea", n: "Crunch en polea (de rodillas)", s: 3, r: [10, 15], e: "fallo", d: 60,
        tip: "Cuerda junto a la cabeza. Enrolla la columna llevando las costillas hacia la cadera; no jales con los brazos ni bajes la cadera." }
    ]},
    { id: "TA", nombre: "Torso A", corto: "Torso A", foco: "Pecho alto y remos", dia: 1, min: 80, cal: "torso", ej: [
      { id: "press-inclinado-mancuernas", n: "Press inclinado con mancuernas (banco a 30°)", s: 3, r: [6, 10], e: "fallo", d: 180, a: "mancuerna", kgL: "kg c/u",
        tip: "Omóplatos juntos y abajo, codos a 45-60° del cuerpo, baja hasta sentir el pecho estirado. Las mancuernas se pueden soltar: al fallo, llévalas al pecho y gira a un lado. Para ahorrar tiempo puedes alternarlo con el remo (press, 90 s, remo, 90 s).",
        alt: "Press inclinado en máquina o en Smith." },
      { id: "remo-barra-t", n: "Remo en barra T (remo en punta)", s: 3, r: [6, 10], e: "fallo", d: 180,
        tip: "Pecho arriba y espalda neutra. Jala con los codos hacia la cadera, aprieta 1 s y baja estirando la espalda. Straps permitidos.",
        alt: "Remo con barra." },
      { id: "press-pecho-maquina", n: "Press de pecho en máquina", s: 2, r: [8, 12], e: "fallo", d: 150,
        tip: "Asiento a la altura que deje las manijas a media altura del pecho. Empuja sin bloquear los codos de golpe y baja lento.",
        alt: "Press plano con mancuernas." },
      { id: "jalon-pecho", n: "Jalón al pecho (agarre medio)", s: 2, r: [8, 12], e: "fallo", d: 120,
        tip: "Pecho hacia la barra; lleva los codos hacia abajo y atrás. Arriba, estira completo." },
      { id: "laterales-mancuerna", n: "Elevaciones laterales con mancuernas", s: 3, r: [8, 12], e: "fallo+", d: 120, kgL: "kg c/u",
        x: "Biserie (tu estilo): al terminar cada serie, toma mancuernas de la mitad del peso y sigue hasta el fallo.",
        tip: "Torso un poco inclinado adelante. Sube llevando el codo, no la mano, hasta la altura del hombro y baja en 2-3 s." },
      { id: "posterior-polea", n: "Deltoide posterior: cruce en polea alta", s: 3, r: [12, 20], e: "fallo", d: 90,
        tip: "Poleas a la altura de los hombros, cables cruzados. Brazos casi rectos: abre hacia los lados como abriendo una puerta corrediza, sin juntar los omóplatos. Peso liviano; si sientes la espalda, baja el peso." }
    ]},
    { id: "HA", nombre: "Hombros y brazos A", corto: "Brazos A", foco: "Hombro, posterior, brazos y antebrazo", dia: 2, min: 75, cal: "brazos", saltable: true, ej: [
      { id: "press-hombro-mancuernas", n: "Press de hombro sentado con mancuernas", s: 3, r: [6, 10], e: "fallo", d: 180, a: "mancuerna", kgL: "kg c/u",
        tip: "Banco casi vertical (75-80°). Codos un poco adelante del cuerpo; baja hasta la altura de la barbilla y empuja sin chocar las mancuernas.",
        alt: "Es nuevo para ti: pruébalo 4 semanas. Si no lo sientes o te molesta el hombro, cámbialo por 2 series más de laterales." },
      { id: "laterales-mancuerna", n: "Elevaciones laterales con mancuernas", s: 3, r: [8, 12], e: "fallo+", d: 120, kgL: "kg c/u",
        x: "Biserie: al terminar cada serie, toma mancuernas de la mitad del peso y sigue hasta el fallo.",
        tip: "Torso un poco inclinado adelante. Sube llevando el codo hasta la altura del hombro y baja en 2-3 s." },
      { id: "pajaros-banco", n: "Pájaros con el pecho apoyado (banco inclinado)", s: 3, r: [12, 20], e: "fallo", d: 90, kgL: "kg c/u",
        tip: "Pecho apoyado en un banco a 30-45° y pulgares hacia abajo. Abre los brazos hacia los lados, casi rectos, sin juntar los omóplatos." },
      { id: "curl-mancuernas", n: "Curl con mancuernas de pie", s: 3, r: [6, 10], e: "fallo", d: 120, kgL: "kg c/u",
        tip: "Codos quietos a los lados. Gira la palma hacia arriba al subir y baja en 3 s. Puedes alternarlo con el ejercicio siguiente." },
      { id: "triceps-cabeza-polea", n: "Extensión de tríceps sobre la cabeza en polea (cuerda)", s: 3, r: [8, 12], e: "fallo", d: 120,
        tip: "De espaldas a la polea, codos apuntando al frente y quietos. Estira completo atrás y extiende sin bloquear de golpe. Con el brazo arriba el tríceps crece más, y con menos peso. Empieza liviano.",
        alt: "Si molesta el codo: jalón de tríceps con cuerda." },
      { id: "martillo-mancuernas", n: "Curl martillo con mancuernas", s: 2, r: [8, 12], e: "fallo", d: 90, kgL: "kg c/u",
        tip: "Palmas mirándose. Sube sin balancear. Trabaja bíceps y antebrazo." },
      { id: "jalon-triceps-cuerda", n: "Jalón de tríceps con cuerda", s: 2, r: [10, 15], e: "fallo", d: 90,
        tip: "Codos pegados al cuerpo. Abajo, abre la cuerda y aprieta 1 s." },
      { id: "curl-muneca", n: "Antebrazo: curl de muñeca con mancuerna", s: 2, r: [12, 20], e: "fallo", d: 60, kgL: "kg c/u",
        tip: "Antebrazo apoyado en el banco y palma arriba. Deja rodar la mancuerna hasta los dedos y sube enrollando la muñeca. Alterna con el siguiente." },
      { id: "curl-invertido-polea", n: "Antebrazo: curl invertido en polea (barra recta)", s: 2, r: [10, 15], e: "fallo", d: 60,
        tip: "Palmas hacia abajo y codos quietos. Sube controlado." }
    ]},
    { id: "PB", nombre: "Pierna B", corto: "Pierna B", foco: "Peso muerto y cadena posterior", dia: 3, min: 80, cal: "pierna", ej: [
      { id: "peso-muerto", n: "Peso muerto convencional", s: 2, r: [4, 6], e: "rir2", d: 240, a: "pm", inc: 5,
        tip: "Barra sobre el medio del pie, espalda neutra, pecho arriba. Empuja el piso con las piernas; cadera y hombros suben juntos. Cada rep desde el piso, sin rebotar. Straps solo en las series de trabajo (el agarre se entrena aparte).",
        alt: "Peso muerto con trap bar." },
      { id: "hack", n: "Sentadilla hack (máquina)", s: 3, r: [8, 12], e: "fallo", d: 180,
        tip: "Pies a media altura de la plataforma, al ancho de los hombros. Baja profundo y controlado; sube sin bloquear las rodillas de golpe.",
        alt: "Sentadilla en Smith, o sentadilla con barra con pausa de 2 s abajo (más liviana, con barras de seguridad)." },
      { id: "femoral-sentado", n: "Femoral sentado (máquina)", s: 4, r: [8, 12], e: "fallo", d: 120,
        tip: "Cadera bien atrás y torso un poco inclinado adelante. Sube fuerte y baja en 3 s.",
        alt: "Femoral acostado con una toalla doblada bajo el cojín duro." },
      { id: "extension-cuadriceps", n: "Extensión de cuádriceps", s: 3, r: [12, 15], e: "fallo+", d: 90,
        x: "Opcional: al llegar al fallo, sigue con 4-6 medias repeticiones abajo.",
        tip: "Pausa de 1 s arriba y baja en 3 s." },
      { id: "gemelos-sentado", n: "Gemelos sentado (máquina)", s: 4, r: [10, 15], e: "fallo+", d: 90,
        x: "Opcional: al llegar al fallo, sigue con medias repeticiones abajo hasta no poder.",
        tip: "Sentado se trabaja el sóleo, que da grosor a la pantorrilla. Pausa de 2 s abajo bien estirado y sube completo." },
      { id: "granjero", n: "Caminata de granjero con mancuernas", s: 3, r: [30, 40], u: "metros", kgL: "kg c/u", e: "duro", d: 120,
        tip: "Las mancuernas más pesadas que aguantes sin straps (empieza con unos 30 kg cada una). Hombros abajo, pecho arriba y pasos cortos. Trabaja agarre, antebrazo y trapecio. Si no hay espacio, sostenlas de pie 40 s." },
      { id: "elevaciones-piernas", n: "Elevaciones de piernas colgado", s: 3, r: [8, 15], e: "fallo", d: 60, kgL: "lastre kg",
        tip: "Sube la pelvis hacia el pecho, no solo las piernas. Sin balanceo y bajando lento." }
    ]},
    { id: "TB", nombre: "Torso B", corto: "Torso B", foco: "Pecho alto y jalones", dia: 4, min: 80, cal: "torso",
      notaExtra: "Haz el extra solo si esta semana no vas a hacer ningún día de Hombros y brazos.", ej: [
      { id: "press-inclinado-barra", n: "Press inclinado con barra (dentro de la jaula)", s: 3, r: [5, 8], e: "rir1", d: 210, a: "barra",
        tip: "Banco a 30° dentro de la jaula, con las barras de seguridad 2-3 cm debajo de tu pecho: si fallas, apoyas la barra ahí. Agarre un poco más ancho que los hombros; baja controlado al pecho alto, sin rebotar.",
        alt: "Press inclinado en Smith." },
      { id: "dominadas", n: "Dominadas", s: 3, r: [5, 10], e: "fallo", d: 180, kgL: "lastre kg",
        tip: "Desde los brazos estirados hasta el pecho cerca de la barra, sin balanceo. Cuando hagas 3 × 10, agrega peso con un disco o una mancuerna entre los pies.",
        alt: "Si no salen 5 limpias: jalón al pecho pesado, 3 × 6-10." },
      { id: "remo-mancuerna", n: "Remo con mancuerna a una mano (apoyado en banco)", s: 2, r: [8, 12], e: "fallo", d: 120,
        tip: "Rodilla y mano en el banco, espalda plana. Jala hacia la cadera y estira bien abajo. Anota las reps del lado más débil." },
      { id: "aperturas-polea-baja", n: "Aperturas en polea, de abajo hacia arriba", s: 3, r: [10, 15], e: "fallo", d: 90,
        tip: "Poleas abajo. Sube las manos en arco hasta la altura de la barbilla y aprieta; baja estirando el pecho. Trabaja el pecho alto.",
        alt: "Pec deck (máquina fly)." },
      { id: "laterales-polea", n: "Elevación lateral en polea, a un brazo", s: 3, r: [10, 15], e: "fallo", d: 90,
        tip: "Polea abajo y el cable por delante del cuerpo. Sube hasta la altura del hombro con tensión constante. Anota el lado más débil." },
      { id: "face-pull", n: "Face pull con cuerda", s: 3, r: [12, 20], e: "fallo", d: 90,
        tip: "Polea a la altura de la frente. Jala hacia la cara abriendo la cuerda, codos altos y pulgares hacia atrás. Aprieta 1 s." },
      { id: "curl-mancuernas", n: "Curl con mancuernas de pie", s: 2, r: [8, 12], e: "fallo", d: 90, kgL: "kg c/u", opc: true,
        tip: "Codos quietos, baja en 3 s. Alterna con el jalón de tríceps." },
      { id: "jalon-triceps-cuerda", n: "Jalón de tríceps con cuerda", s: 2, r: [10, 15], e: "fallo", d: 90, opc: true,
        tip: "Codos pegados al cuerpo; abajo abre la cuerda y aprieta 1 s." }
    ]},
    { id: "HB", nombre: "Hombros, brazos y gemelos B", corto: "Brazos B", foco: "Hombro, posterior, brazos, gemelos y antebrazo", dia: 5, min: 85, cal: "brazos", saltable: true,
      notaExtra: "Solo si te sobra tiempo.", ej: [
      { id: "laterales-sentado", n: "Elevaciones laterales sentado con mancuernas", s: 4, r: [8, 12], e: "fallo+", d: 120, kgL: "kg c/u",
        x: "Biserie: al terminar cada serie, toma mancuernas de la mitad del peso y sigue hasta el fallo.",
        tip: "Sentado no hay impulso que valga. Sube con el codo hasta la altura del hombro y baja en 2-3 s." },
      { id: "posterior-maquina", n: "Deltoide posterior en máquina (pec deck invertido)", s: 3, r: [12, 20], e: "fallo", d: 90,
        tip: "Agarre neutro o pulgares abajo, brazos casi rectos. Empuja hacia afuera, no hacia atrás, y no juntes los omóplatos.",
        alt: "Si aún no lo sientes: cruce en polea alta." },
      { id: "curl-scott", n: "Curl en banco Scott con mancuerna, a un brazo", s: 3, r: [8, 12], e: "fallo", d: 60,
        tip: "Axila pegada al borde del banco. Baja casi hasta estirar, sin soltar el peso de golpe, y sube sin despegar el codo. Mientras trabaja un brazo, descansa el otro." },
      { id: "triceps-cabeza-unilateral", n: "Extensión de tríceps a un brazo sobre la cabeza (polea)", s: 3, r: [8, 12], e: "fallo", d: 60,
        tip: "De espaldas a la polea baja, codo apuntando arriba y quieto. Estira completo y extiende. Liviano y controlado.",
        alt: "Si molesta el codo: jalón de tríceps a un brazo." },
      { id: "martillo-cuerda", n: "Curl martillo con cuerda en polea", s: 2, r: [10, 15], e: "fallo", d: 90,
        tip: "Palmas mirándose, codos quietos. Alterna con el siguiente." },
      { id: "jalon-triceps-barra", n: "Jalón de tríceps con barra recta o V", s: 2, r: [8, 12], e: "fallo", d: 90,
        tip: "Codos pegados al cuerpo; extiende completo y sube controlado." },
      { id: "gemelos-pie", n: "Gemelos de pie (máquina)", s: 4, r: [8, 12], e: "fallo+", d: 90,
        x: "Opcional: al llegar al fallo, sigue con medias repeticiones abajo hasta no poder.",
        tip: "Pausa de 2 s abajo con el talón lo más bajo posible. Sube completo y explosivo." },
      { id: "extension-muneca", n: "Antebrazo: extensión de muñeca con mancuerna", s: 2, r: [15, 20], e: "fallo", d: 60, kgL: "kg c/u",
        tip: "Antebrazo apoyado y palma abajo. Sube el dorso de la mano y baja lento. Alterna con el siguiente." },
      { id: "curl-muneca-espalda", n: "Antebrazo: curl de muñeca con barra detrás de la espalda", s: 2, r: [12, 20], e: "fallo", d: 60,
        tip: "De pie, barra detrás del cuerpo con las palmas hacia atrás. Deja rodar hasta los dedos y sube enrollando." },
      { id: "crunch-polea", n: "Crunch en polea (de rodillas)", s: 3, r: [10, 15], e: "fallo", d: 60,
        tip: "Enrolla la columna llevando las costillas hacia la cadera; no jales con los brazos." },
      { id: "encogimientos", n: "Encogimientos con mancuernas", s: 2, r: [8, 12], e: "fallo", d: 90, kgL: "kg c/u", opc: true,
        tip: "Sube los hombros hacia las orejas, pausa 2 s arriba y baja lento." }
    ]}
  ],

  diario: [
    { id: "creatina", txt: "Creatina 5 g" },
    { id: "proteina", txt: "Proteína 140 g o más" },
    { id: "sinjugo", txt: "Sin jugo artificial ni gaseosa normal" },
    { id: "cafe", txt: "Último café antes de las 2 pm" },
    { id: "pantalla", txt: "Anoche: pantalla apagada en la cama" },
    { id: "agua", txt: "2-3 L de agua" }
  ],
  metasSemana: [
    { id: "dias", txt: "Ir al gym 4 días o más (ideal 6)", auto: "sesiones", min: 4 },
    { id: "pesajes", txt: "Pesarte 3 veces o más", auto: "pesajes", min: 3 },
    { id: "cintura", txt: "Medir la cintura (lunes en la mañana)", auto: "cintura", min: 1 },
    { id: "proteina", txt: "Proteína 6 de 7 días", auto: "proteina", min: 6 },
    { id: "creatina", txt: "Creatina los 7 días", auto: "creatina", min: 7 },
    { id: "pantalla", txt: "Pantalla apagada 5 noches o más", auto: "pantalla", min: 5 },
    { id: "mejora", txt: "Mejorar al menos 1 ejercicio por sesión" },
    { id: "salidas", txt: "Máximo 3 comidas fuera, eligiendo de la guía" }
  ],

  dieta: {
    intro: "La meta de proteína es fija; las calorías cambian con la fase. Con el día de ejemplo y las equivalencias no hace falta contar todo: pesa tus porciones 2 semanas y luego ya las calculas a ojo.",
    reglas: [
      "**Proteína en cada comida.** Meta: 140-150 g al día.",
      "**Jugo artificial y gaseosa normal: fuera.** Agua, gaseosa zero o jugo natural sin azúcar.",
      "**Pan: máximo 1 al día.** El día que compras el almuerzo, ninguno.",
      "**Chatarra: ya no entre semana.** Se queda en tus 3 salidas, eligiendo de la guía de abajo.",
      "**Merienda a media tarde**, para no llegar muerto de hambre a la cena.",
      "**Café: el último antes de las 2 pm.**",
      "**Creatina: 5 g todos los días.**",
      "Las cantidades son en **cocido** (arroz cocido, carne cocida)."
    ],
    dia: [
      { comida: "Desayuno · 7:30", items: [
        ["Avena en agua", "40 g en seco", 150, 5],
        ["Guineo", "1 mediano", 90, 1],
        ["Huevos revueltos", "3 enteros + 2 claras", 250, 26],
        ["Queso fresco", "30 g", 90, 5],
        ["Pan", "1 (ninguno si compras almuerzo)", 140, 4],
        ["Aceite para cocinar", "1 cucharadita", 45, 0],
        ["Café negro", "sin azúcar", 5, 0] ]},
      { comida: "Almuerzo · 1:20 (tupper)", items: [
        ["Pechuga de pollo o carne magra", "150 g cocida", 250, 46],
        ["Arroz", "150 g cocido (¾ de taza)", 195, 4],
        ["Verduras o ensalada", "1 taza", 35, 2],
        ["Aceite", "1 cucharadita", 45, 0] ]},
      { comida: "Media tarde · 4:30", items: [
        ["Atún en agua", "1 lata", 120, 26],
        ["Uvas o guineo", "1 taza de uvas o 1 guineo", 100, 1] ]},
      { comida: "Cena · 7:00 (1 hora antes del gym)", items: [
        ["Carne de res magra, lomo o pollo", "130 g cocida", 250, 36],
        ["Arroz", "150 g cocido", 195, 4],
        ["Verduras", "1 taza", 35, 2] ]}
    ],
    mantenimiento: "En mantenimiento (21 dic - 3 ene y Carnaval) suma unas 450 kcal al día: 1 pan, 100 g más de arroz en el almuerzo y en la cena, y 1 fruta.",
    almuerzoComprado: [
      "Toma la sopa: llena mucho.",
      "Pide poco arroz y cambia el jugo por agua.",
      "La carne del almuerzo suele ser poca: lleva de casa 2 huevos duros o 1 atún y súmalos.",
      "Ese día, sin pan en el desayuno.",
      "Mejor aún: lleva tupper 3 días o más por semana."
    ],
    postEntreno: "No es obligatorio. Solo si ese día no llegaste a la proteína: 1 atún o 2 huevos con 30 g de queso. Si no te da hambre, no comas por comer.",
    meriendas: [
      "1 atún en agua + 1 guineo o 1 taza de uvas (≈220 kcal, 26 g de proteína).",
      "2 huevos duros + 1 fruta (≈240 kcal, 13 g).",
      "Sánduche: 1 pan + ½ lata de atún o 60 g de pollo + tomate (≈230-250 kcal, 15-20 g).",
      "40 g de queso fresco + 1 pan (≈260 kcal, 11 g).",
      "½ lata de sardina + 1 paquetito de galletas de sal (≈260 kcal, 16 g).",
      "Para probar: yogur griego natural sin azúcar. Si en 2 semanas te salen espinillas, lo quitas."
    ],
    fueraIntro: "Puedes salir 3 veces por semana. Ese día, el resto de comidas va igual pero sin pan y con medio arroz.",
    fuera: [
      { lugar: "KFC o pollo frito", si: "2 presas (mejor pechuga y pierna) + ensalada de col + bebida zero o agua.", no: "Combos con papas grandes, puré con gravy extra, gaseosa normal, baldes." },
      { lugar: "Pollo a la brasa o asadero", si: "¼ de pollo + ensalada + 1 papa o poco arroz.", no: "Papas fritas grandes y gaseosa normal." },
      { lugar: "Hamburguesas", si: "Sencilla o doble carne, sin tocino ni salsas extra + bebida zero. Papas pequeñas y compartidas, o nada.", no: "Combo agrandado, malteada, doble queso con tocino." },
      { lugar: "Pizza", si: "2 porciones (pollo, jamón o vegetariana) + ensalada.", no: "4-5 porciones, bordes rellenos, pan de ajo." },
      { lugar: "Comida típica", si: "Pollo o carne asada, seco de pollo, parrillada (carne + ensalada + 1 papa), ceviche o encebollado con pocos chifles.", no: "Platos dobles de hornado o fritada con llapingachos y mote extra, chorizo." },
      { lugar: "Chifa", si: "Pollo o carne salteada con verduras + arroz pequeño o compartido.", no: "Chaulafán grande, wantanes fritos, combinados gigantes." },
      { lugar: "Postres y golosinas", si: "1 cosa pequeña o compartida: 1 bola de helado, 1 chocolate pequeño.", no: "Sundae, pastel con helado, funda de golosinas." },
      { lugar: "Alcohol (cada 2 semanas)", si: "Ron o whisky con cola zero o agua mineral, máximo 2-3 tragos. Cerveza: máximo 2. Come proteína antes.", no: "Ron con cola normal toda la noche, cerveza sin límite." }
    ],
    equivalencias: [
      { grupo: "Proteína (≈30 g por porción)", items: [
        "150 g de pechuga de pollo cocida",
        "130 g de carne de res magra o lomo de cerdo, cocidos",
        "1 lata de atún en agua + 2 claras",
        "1 lata pequeña de sardina (155 g)",
        "1 huevo entero + 6 claras",
        "1½ tazas de lenteja o fréjol cocido (≈27 g; cuenta también como tu porción de arroz)" ]},
      { grupo: "Carbohidrato (≈40 g por porción)", items: [
        "150 g de arroz cocido (¾ de taza)",
        "200 g de papa cocida (2 medianas)",
        "1 taza de fideo cocido",
        "55 g de avena en seco",
        "2 guineos medianos",
        "Mote o choclo: 1 taza ≈ ¾ de porción. 1 pan ≈ ½ porción." ]},
      { grupo: "Grasa (≈10 g por porción)", items: [
        "2 cucharaditas de aceite",
        "40 g de queso fresco",
        "Un puñado pequeño de maní (15 g)" ]}
    ],
    hambre: [
      "Toma primero la sopa o un caldo: llena mucho con pocas calorías.",
      "La papa cocida es de lo que más llena por caloría.",
      "Proteína en cada comida y la merienda de la tarde, sin saltarla.",
      "2-3 L de agua al día, como ya lo haces.",
      "Dormir mal sube el hambre al día siguiente.",
      "Antojo de noche: gelatina sin azúcar, 1 huevo o 1 fruta."
    ],
    fiestas: [
      "**21 dic - 3 ene: mantenimiento (≈2450 kcal).** Navidad y Fin de Año: come normal y disfruta, sin compensar al día siguiente.",
      "**Carnaval (8 y 9 feb):** esos 2 días comes a mantenimiento; al día siguiente vuelves al plan.",
      "Tras una comida grande, la balanza sube 1-2 kg por sal y agua y baja en 2-3 días. No es grasa."
    ],
    compras: [
      "Pechuga de pollo: 1.5 kg (en crudo)",
      "Carne de res magra o lomo de cerdo: 1 kg",
      "Huevos: 1½ cubetas (45)",
      "Atún en agua: 7 latas",
      "Sardina: 2 latas (opcional)",
      "Queso fresco: 1 (≈500 g)",
      "Avena: 500 g (dura casi 2 semanas)",
      "Arroz: ≈1 kg en crudo",
      "Guineos: 10 · uvas u otra fruta: 1 kg",
      "Verduras: brócoli, zanahoria, vainita, tomate, pepino (1-1.5 kg)",
      "Pan: máximo 7",
      "Galletas de sal para las meriendas",
      "Creatina: 5 g al día (≈150 g al mes)"
    ]
  },

  guia: {
    claves: [
      "**El volumen semanal es lo que más pesa** (Pelland 2025). Tu espalda crecía fácil porque le dabas muchas series. Ahora tus puntos débiles (gemelos, hombro posterior, brazos, antebrazo, piernas) reciben unas 12-16 series duras por semana; lo demás, 8-10.",
      "**Tu fuerza está dormida, no perdida.** Vuelve rápido entrenando constante, aunque estés en definición.",
      "**La grasa vino de 3 sitios:** el pan diario, la chatarra entre semana y las salidas. Tu comida de casa está bien.",
      "**Faltaba proteína** (≈85-100 g al día). La meta ahora es 140-150 g.",
      "**Dormir bien decide si bajas grasa o músculo.** A dieta y durmiendo mal se pierde mucho más músculo.",
      "**Bajar lento** (≈0.5 kg por semana) para no repetir la definición pasada, cuando se fue la fuerza y bajaste de más.",
      "**Cerca del fallo crece más** (Robinson 2024). Al fallo real en mancuernas, máquinas y poleas. Con barra, 1 rep en reserva solo por seguridad, porque entrenas sin compañero.",
      "**Lo que dolía se cambió:** fuera fondos, rompecráneos y barra Z."
    ],
    entreno: [
      "**Esfuerzo.** Mancuernas, máquinas y poleas: al fallo con técnica limpia. Barra (sentadilla, press inclinado): 1 rep en reserva; peso muerto: 1-2. Es solo por seguridad sin compañero.",
      "**Aproximaciones.** En el primer ejercicio pesado la página te calcula los pesos (≈50% × 8, 70% × 4, 85% × 2 de tu peso de trabajo).",
      "**Progresión doble.** Cada ejercicio tiene un rango (por ejemplo 6-10). Cuando haces el máximo del rango en todas las series, la próxima vez subes: la mancuerna siguiente, 2.5 kg en barra (5 kg en peso muerto) o una placa en máquina. La página te avisa.",
      "**Descansos.** Pesados 3-4 min, secundarios 2-3 min, aislamiento 1.5-2 min. Usa el botón ⏱ de cada serie.",
      "**En definición, mantener tus pesos ya es ganar.** Si bajan un poco no pasa nada; si bajan mucho 2 semanas seguidas, hay que ajustar.",
      "**Si faltas.** La pestaña Hoy te dice qué toca. Al día siguiente haces la sesión pendiente. Lo primero que se cae son los días de Hombros y brazos, nunca Pierna ni Torso. El domingo siempre descansas y el lunes empiezas de cero.",
      "**Descargas: solo si las necesitas.** Una semana libre no quita músculo ni lo suma (Coleman 2024). Si te sientes muy cansado o te duelen los tendones: mismos pesos, 1 serie menos y 2-3 reps en reserva durante una semana.",
      "**Estirado:** baja siempre completo y con control; la parte estirada es la que más hace crecer. Las medias repeticiones abajo al final de la serie son un extra opcional.",
      "**Semana 0** (23 - 29 nov): todo con 2-3 reps en reserva para encontrar tus pesos y aprender los ejercicios nuevos."
    ],
    molestias: [
      "**Fuera por ahora:** fondos en paralelas, rompecráneos y curl con barra Z.",
      "**Regla del dolor:** si molesta 3/10 o menos y no empeora al día siguiente, sigue. Si pasa de 3/10 o está peor al día siguiente, usa la alternativa de ese ejercicio.",
      "**Codos:** antes de brazos, 1 serie de 20 de curl y de jalón de tríceps en polea, muy livianas. Las extensiones sobre la cabeza, siempre en polea y controladas.",
      "**Bíceps cerca del hombro:** curl con mancuerna, polea o Scott; por ahora sin curl inclinado.",
      "**Hombro:** en los press, codos a 45-60° del cuerpo y sin rebotar abajo.",
      "**Tibia:** nada de correr ni saltar. En la caminadora solo caminar, y solo si no duele. Si te duele al caminar, en reposo o en un punto pequeño del hueso: médico y radiografía.",
      "Si una molestia sigue igual o peor en 4-6 semanas: fisioterapeuta."
    ],
    sueno: [
      "**Meta:** luz apagada a las 11:30 pm y levantarte 7:15-7:30. El fin de semana, misma hora ±1 h.",
      "**Llamada sí, pantalla no:** celular boca abajo o con la pantalla apagada. Nada de TikTok en la cama.",
      "**Café:** el último antes de las 2 pm. En la cena, agüita (manzanilla, hierbaluisa) o descafeinado. Prueba 2 semanas y compara cómo te levantas.",
      "**Después del gym:** ducha tibia y luz baja.",
      "**Cuarto oscuro y fresco.**",
      "Anota cada mañana cómo te levantaste (1-10) en la pestaña Hoy."
    ],
    suplementos: [
      "**Creatina:** 5 g todos los días, domingos incluidos, a cualquier hora. Empieza ya.",
      "La creatina suma ≈1 kg de agua en las primeras 2-3 semanas: la balanza puede no bajar al inicio. Guíate también por la cintura.",
      "**Preentreno:** no lo uses. Entrenas a las 8 pm y te quitaría el sueño.",
      "**Proteína en polvo:** no hace falta; con comida llegas a la meta."
    ],
    fuentes: [
      "Robinson 2024: cercanía al fallo e hipertrofia (pubmed 38970765)",
      "Pelland 2025: volumen y frecuencia semanal (pubmed 41343037)",
      "Coleman 2024: semana de descarga (PMC10809978)",
      "Wolf 2024-25 y estudio en entrenados 2024: entrenar en estiramiento",
      "Peos 2021 (ICECAP): pausas de dieta en gente que entrena",
      "Lamon 2021 y Nedeltcheva 2010: sueño, músculo y grasa",
      "Helms 2014 y Garthe 2011: proteína y ritmo de bajada en definición",
      "Maeo 2021 y 2023: femoral sentado y tríceps sobre la cabeza"
    ],
    pagina: [
      "**Entra con Google** (botón arriba a la derecha) y todo se guarda en la nube: lo ves igual en el celular y en la PC. Solo tu cuenta puede leer tus datos.",
      "Sin internet sigue funcionando: guarda en el equipo y sube los cambios cuando vuelve la conexión.",
      "Igual puedes descargar una copia cuando quieras: Progreso → Respaldo → Exportar.",
      
      "Para tenerla como app: en Chrome, menú ⋮ → Añadir a pantalla de inicio.",
      "Cuando se actualice el plan, tus registros no se borran."
    ]
  }
};
/* ==========================================================================
   FIN DEL PLAN. De aqui para abajo solo se dibuja la pagina y se guardan
   los registros.
   ========================================================================== */
