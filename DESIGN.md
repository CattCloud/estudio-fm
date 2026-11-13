---
name: Estudio FM
description: Un radiocasete japonés de los 80 como reproductor de la playlist de estudio; cada grupo es un casete y cambiar de canción es sintonizar.
colors:
  plata-claro: "#ECEEF0"
  plata: "#D3D7DC"
  plata-fondo: "#C3C8CE"
  plata-oscuro: "#A9AFB6"
  negro: "#151618"
  gris: "#4F555D"
  rojo: "#D2232A"
  rojo-texto: "#B01B22"
  arena: "#D9B98B"
  cafe: "#8A3F1B"
  mostaza: "#E3A92B"
  mostaza-texto: "#85580A"
  lcd: "#A9B98E"
  lcd-tinta: "#1F2A14"
  carcasa-casete: "#26282C"
  acrilico: "#141619"
  cinta: "#4A3426"
  caratula: "#F3EEE3"
  papel-crema: "#EFE6D2"
  papel-azul: "#C9D3DB"
  papel-arena: "#E3D3B4"
  papel-humo: "#DCDCD4"
  papel-rosa: "#E6D9D2"
  papel-verde: "#D3DDD0"
typography:
  marca:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  titulo:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.12
  nombre-casete:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  etiqueta:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.18em"
  dato:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    lineHeight: 1
  lcd-frecuencia:
    fontFamily: "VT323, monospace"
    fontSize: "118px"
    fontWeight: 400
    lineHeight: 0.85
  lcd-linea:
    fontFamily: "VT323, monospace"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.06em"
  japones:
    fontFamily: "M PLUS 1p, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
rounded:
  segmento: "2px"
  tecla: "3px"
  boton: "4px"
  marco-interno: "6px"
  lcd: "8px"
  casete: "10px"
  ventana: "10px"
  caja: "12px"
spacing:
  tecla-gap: "6px"
  gap-lateral: "20px"
  gap-cuerpo: "36px"
  margen: "48px"
  marco-negro: "12px"
  marco-modulo: "10px"
components:
  tecla:
    backgroundColor: "{colors.plata}"
    textColor: "{colors.negro}"
    rounded: "{rounded.tecla}"
    height: "62px"
  tecla-activa:
    backgroundColor: "{colors.plata-oscuro}"
    textColor: "{colors.rojo-texto}"
  tecla-eject:
    backgroundColor: "{colors.plata}"
    textColor: "{colors.negro}"
    rounded: "{rounded.tecla}"
    height: "54px"
  lcd:
    backgroundColor: "{colors.lcd}"
    textColor: "{colors.lcd-tinta}"
    rounded: "{rounded.lcd}"
    padding: "14px 22px 12px"
  lcd-bandera-encendida:
    backgroundColor: "{colors.lcd-tinta}"
    textColor: "{colors.lcd}"
    rounded: "{rounded.segmento}"
  ventana-video:
    backgroundColor: "{colors.negro}"
    rounded: "{rounded.ventana}"
    padding: "14px"
    width: "960px"
    height: "552px"
  pletina:
    backgroundColor: "{colors.plata-claro}"
    rounded: "{rounded.marco-interno}"
    padding: "14px"
  casete:
    backgroundColor: "{colors.carcasa-casete}"
    textColor: "{colors.negro}"
    rounded: "{rounded.casete}"
    width: "324px"
  caratula:
    backgroundColor: "{colors.caratula}"
    textColor: "{colors.negro}"
    rounded: "{rounded.boton}"
    padding: "22px 26px 18px"
  estante:
    backgroundColor: "{colors.negro}"
    rounded: "{rounded.caja}"
    padding: "12px"
    width: "1388px"
    height: "606px"
  caja-dial:
    backgroundColor: "{colors.negro}"
    rounded: "{rounded.caja}"
    padding: "12px"
    width: "1824px"
    height: "340px"
  aguja:
    backgroundColor: "{colors.rojo}"
    width: "4px"
---

# Design System: Estudio FM

## Overview

**Creative North Star: "El Radiocasete de los 80"**

La playlist es una banda de radio y cada grupo de canciones es un casete. Dentro de un casete, cada canción tiene una frecuencia fija (desde 88.1, paso 1.2, o menor si no caben hasta 108.0) y pasar de canción es sintonizar. La interfaz es un objeto: cuerpo de plástico plateado, marcos negros que encajan paneles, una pletina con el casete visible tras una tapa ahumada, un LCD verde para la frecuencia, teclas de piano plateadas y un dial con aguja roja. Se ve de día, sin neón, y no se parece a un reproductor de video con barra y lista de miniaturas.

Es una superficie única de 1920 × 1050, pensada solo para una laptop de 18 pulgadas, sin versión móvil. La escena se escala entera a la ventana; si la ventana es más ancha que la escena, las franjas superiores sangran a ancho completo y el resto se queda en 1920. El video es protagonista; nada lleva a YouTube.

Densidad media, todo con etiqueta propia: mayúsculas espaciadas para rótulos, VT323 solo donde hay una pantalla, un toque de japonés (ステレオ・ラジオ, エフエム) como sello de época. No hay cabecera: las franjas son el canto superior del aparato y la marca es una placa bajo el video.

**Key Characteristics:**
- Plástico plateado; negro como marco de todo lo que "se enchufa" (video, dial, estante, LCD, pletina, volumen).
- Firma de marca: tres franjas arena, café y negro, en el canto superior, al pie del dial y como banda de la etiqueta de cada casete.
- Un único acento vivo: el rojo marca lo que suena, la aguja y el piloto.
- Relieve físico (biseles, teclas hundibles, tapa de acrílico) en lugar de sombras decorativas.
- Los casetes son objetos reales: carcasa, etiqueta de papel, carretes y cinta que se mueven con la canción.

## Colors

Plata cálida-fría de electrodoméstico, negro de marco, tres colores de marca (arena, café, negro), el verde apagado del LCD y los papeles de las etiquetas de casete.

### Primary
- **Rojo Radiocasete** (#D2232A): la aguja, la barra de avance, el piloto encendido, la marca de la perilla, la selección de texto y el foco. Marca "lo que suena".
- **Rojo de Lectura** (#B01B22): el mismo rojo oscurecido para texto sobre plata (estación o canción activa, tecla activada, rótulo PUESTO, nombre del casete en el dial, leyenda japonesa del dial).

### Secondary
- **Arena** (#D9B98B): primera franja de marca, en el canto superior, al pie del dial y en la etiqueta del casete.
- **Café** (#8A3F1B): segunda franja de marca.
- **Mostaza Tostada** (#E3A92B): solo en el patrón rayado de la barra "en vivo".
- **Mostaza de Lectura** (#85580A): texto "EN VIVO" sobre plata.

### Tertiary
- **Verde LCD** (#A9B98E) y **Tinta LCD** (#1F2A14): pantalla de frecuencia y su segmento invertido; el verde también tiñe la cubierta del video.

### Neutral
- **Plata Clara** (#ECEEF0), **Plata** (#D3D7DC), **Plata Fondo** (#C3C8CE): degradado vertical del fondo del cuerpo y luz de las teclas.
- **Plata Oscura** (#A9AFB6): bisel de la ventana y del foso de la pletina, fondo de la barra, tecla hundida.
- **Negro Carcasa** (#151618): marcos, franja, texto principal.
- **Gris Tinta** (#4F555D): texto secundario (canal, duraciones, subtítulo de la carátula, "LADO A").
- **Carcasa de Casete** (#26282C): plástico del casete; **Cinta** (#4A3426): rollo de cinta visible en la ventana del casete.
- **Gris Acrílico** (#141619, a 18-50% de opacidad en degradado vertical): la tapa ahumada de la pletina; deja ver el casete y se aclara un poco al abrirla.
- **Carátula** (#F3EEE3): papel de la carátula interior (J-card) con las canciones.
- **Papeles de etiqueta**: crema (#EFE6D2), azul (#C9D3DB), arena (#E3D3B4), humo (#DCDCD4), rosa (#E6D9D2) y verde (#D3DDD0). Cada casete toma uno según su nombre (un hash estable del nombre), de modo que el mismo grupo siempre lleva el mismo papel.

### Named Rules
**The Dos Rojos Rule.** El rojo de marca (#D2232A) va en superficies; el texto rojo sobre plata usa siempre #B01B22. Un tono único no sirve para ambas cosas.
**The Rojo Que Suena Rule.** El rojo señala el estado "sonando" o "puesto" (aguja, barra, estación activa, canción activa, PUESTO). No se usa como decoración.
**The Papel Por Nombre Rule.** El papel de la etiqueta lo decide el nombre del casete, nunca el azar ni el orden; los seis papeles son tonos cálidos o fríos muy suaves, sin saturar.

## Typography

**Display Font:** Archivo (itálica 900 solo para la marca), autoalojada, con system-ui de respaldo
**Body Font:** Archivo 700-800 (rango variable 500-800)
**Label/Mono Font:** VT323 para todo lo que sea pantalla LCD y cubierta; M PLUS 1p 700 para el japonés

**Character:** Archivo es el rótulo serigrafiado del aparato, firme y con números tabulares (`font-variant-numeric: tabular-nums` en el body). VT323 es el segmento luminoso. El japonés va siempre como pastilla o leyenda corta.

### Hierarchy
- **Marca** (900 itálica, 34px, 1): "ESTUDIO FM" en la placa bajo el video.
- **Frecuencia LCD** (VT323 400, 118px, .85): la frecuencia grande; la cubierta del video repite el motivo a 176px.
- **Título** (700, 28px, 1.12, balance, máx. 3 líneas): canción en curso.
- **Nombre de casete** (800, 34px, 1, 0.02em, mayúsculas, una línea con elipsis): encabezado de la carátula. En la etiqueta del casete (SVG) el nombre va en 800 a 19px y baja hasta 11px si es largo, cortado a 24 caracteres.
- **Dato** (800, 17-26px, 1): MHz de cada estación del dial y frecuencias de la carátula (17px).
- **Cuerpo** (700, 13-17px): tiempo, canciones de la carátula (14px, una línea con elipsis).
- **Etiqueta** (800, 12-15px, 0.12-0.22em, mayúsculas): teclas de texto, EJECT, INSERTAR, cabeceras de pletina, estante y dial, canal, PUESTO.
- **Línea LCD** (VT323, 21-24px, 0.06em): FM STEREO (o el nombre del casete), posición 08/16 y banderas.

### Named Rules
**The Serigrafía Rule.** Las etiquetas de equipo son mayúsculas espaciadas en Archivo 700-800; son el idioma nativo de un aparato y rotulan controles y zonas reales (pletina, estante, dial, teclas). No se usan como antetítulo decorativo sobre un título.
**The Solo Pantalla Rule.** VT323 aparece únicamente dentro del LCD y de la cubierta de video.

## Layout

Escena de 1920 × 1050 posicionada al centro y escalada con `--escala`; el ancho de escena crece a `max(1920, ventana / escala)` para que las franjas lleguen a los bordes. Sin scroll ni versión móvil.

De arriba abajo: tres franjas de 6px (18px en total) como canto del aparato, el cuerpo (654px de alto, 30px de aire superior, márgenes laterales de 48px) y el dial anclado al pie (340px de alto, 26px del borde inferior). El cuerpo es una rejilla de columnas 400px / 960px / 1fr con 36px de separación; las tres columnas miden 606px.

- **Izquierda (400px):** pletina (ocupa el espacio libre) y módulo de volumen (178px de cara más 10px de margen), con 16px entre ambos.
- **Centro (960px):** ventana de video de 960 × 552 (pantalla de 932 × 524) y, debajo, la placa "ESTUDIO FM ステレオ・ラジオ" centrada con 18px de separación.
- **Lateral (1fr):** LCD, ficha (título + canal, mínimo 118px), tiempo con barra y las seis teclas fijas al pie con `margin-top: auto`, de modo que no se mueven si el título ocupa 1 o 3 líneas. Ritmo: 20px entre bloques, 6px entre teclas.

El estante (1388 × 606) se abre sobre las columnas central y lateral y deja visibles la pletina y el volumen; las dos columnas cubiertas se desvanecen. Por dentro es una rejilla de 520px (torre de casetes con su mando) y 1fr (carátula).

El dial ocupa 1824px (marco negro de 12px). Cada estación pide al menos 100px: si el casete cabe, las estaciones se reparten a ancho completo; si no, la banda se hace más ancha que la caja y se recorre arrastrando o con la rueda, sin barra de desplazamiento.

## Elevation & Depth

Híbrido físico: relieve de objeto, no sombras ambientales. La profundidad sale de marcos negros que rodean paneles claros, biseles internos, una tapa de acrílico sobre un foso oscuro y teclas con borde inferior grueso.

### Shadow Vocabulary
- **Bisel plata** (`box-shadow: 0 0 0 3px #A9AFB6, 0 10px 24px rgba(21,22,24,.28)`): ventana de video.
- **LCD hundido** (`inset 0 3px 10px rgba(0,0,0,.35), 0 0 0 4px #151618`): pantalla empotrada con marco.
- **Marco de módulo** (`0 0 0 10px #151618`, con 10px de margen): anillo negro plano de la pletina y del volumen.
- **Foso de pletina** (`inset 0 4px 12px rgba(0,0,0,.7), 0 0 0 3px #A9AFB6`): hueco oscuro donde asienta el casete.
- **Tecla alta** (`inset 0 -5px 0 rgba(0,0,0,.18), 0 1px 0 rgba(255,255,255,.12)`): tecla en reposo.
- **Tecla hundida** (`inset 0 3px 6px rgba(0,0,0,.35)` + degradado invertido): estado activo, pulsado o `aria-pressed`.
- **Estante flotante** (`0 18px 40px rgba(21,22,24,.4)`): solo el estante de casetes.
- **Casete sobre fondo** (`drop-shadow(0 12px 18px rgba(21,22,24,.35))`): casetes de la torre y el casete en vuelo.
- **Carátula** (`0 0 0 1px rgba(21,22,24,.12), 0 6px 14px rgba(21,22,24,.12)`): papel levemente despegado del marco.

### Named Rules
**The Hundida Rule.** Activo significa hundido: la tecla activa invierte su degradado y cambia a sombra interior. Ninguna tecla activa "se ilumina" o brilla.
**The Sin Sombra Dura Rule.** No hay sombras con desplazamiento duro; toda sombra exterior es difusa o un anillo plano de bisel.

## Shapes

Esquinas pequeñas, de plástico moldeado: 2px segmentos del LCD, 3px teclas y placa japonesa, 4px pantalla de video y carátula, 6px interiores de paneles, 8px LCD, 10px ventana de video y carcasa del casete, 12px cajas del dial y del estante. Los marcos son anillos concéntricos: negro de 10-12px, luego el panel claro con radio menor. El casete tiene la ventana de cinta en cápsula (radio completo), cuatro tornillos y un trapecio oscuro en la base. El resto es recto: barra de avance sin radio, marcas de escala de 2px, aguja de 4px. El piloto y la perilla son los únicos círculos. Los íconos de control son SVG de relleno plano, de 30px (22px el de EJECT).

## Components

### Franjas de marca
Tres franjas de 6px (arena, café, negro) forman el canto superior del aparato y sangran a ancho completo. La misma secuencia, en tercios exactos, cierra el dial (6px) y se repite como banda de 3.5px por franja en la etiqueta de cada casete.

### Placa de marca
Bajo el video, centrada: "ESTUDIO FM" en itálica 900 de 34px y una pastilla negra con ステレオ・ラジオ (15px, 3px de radio, texto plata claro).

### Teclas
Seis teclas en rejilla de 3 columnas dentro de un estuche negro (6px de padding y de separación, 6px de radio). Cada una mide 62px de alto, con degradado plata claro a plata oscura. Tres de ícono (anterior, play/pausa, siguiente) y tres de texto (BUSCAR, EXPLORAR, REPETIR). Hover: brillo 1.06 (.12s). Activa/pulsada/`aria-pressed`: hundida (ver Elevación), y las de texto pasan a texto #B01B22. Foco: contorno rojo de 3px hacia adentro (-3px).

### LCD
Verde #A9B98E, tinta #1F2A14, 8px, anillo negro de 4px. Fila superior (el nombre del casete en mayúsculas, cortado a 12 caracteres, con FM STEREO como texto inicial, y la posición) a 24px; frecuencia de 118px con "MHz" a 36px; fila de banderas (estado, BUSCAR, EXPLORAR, REPETIR) en VT323 21px. Bandera apagada al 80% de opacidad; encendida = segmento invertido (fondo tinta, texto verde), sin transición, para que fondo y texto cambien a la vez. En pausa o sin sonar (`data-sonando="no"`) la fila superior y la frecuencia bajan a 75% de opacidad.

### Ventana de video con cubierta
Ventana negra de 960 × 552 (14px de padding, 10px de radio, bisel plata) con pantalla 16:9 de 932 × 524. Una cubierta absorbe todos los clics (nada lleva a YouTube) y tapa lo que YouTube pinta al pausar: líneas de barrido de 2px cada 5px, degradado oscuro y verde LCD, la frecuencia a 176px en VT323 y un mensaje de 40px con 0.14em. Se desvanece a opacidad 0 en 250 ms ease-out cuando la fase es "reproduciendo", pero sigue recibiendo clics. En fase de error el mensaje pasa a ámbar (#E8B84A).

### Tiempo y barra
Tiempos en 700 17px. La barra es un deslizador: se pulsa o se arrastra para saltar a un punto de la canción. Pista de 6px sobre plata oscura, relleno rojo con `scaleX` y una manija de fader (9 × 20px, plata con filo negro de 1.5px); la zona de agarre es 14px más alta que la pista. En vivo, el total dice "● EN VIVO" en #85580A, la barra se llena entera con rayas de 10px alternando mostaza y negro, la manija desaparece y la barra no responde.

### Casete
Objeto SVG de 314 × 200, la pieza central del sistema. Carcasa #26282C con filo claro al 9%, cuatro tornillos, etiqueta de papel (el papel del casete, ver Colores) con las tres franjas de marca, el nombre del grupo en mayúsculas 800, un cuadro negro con una "A" y, al pie de la etiqueta, "n ESTACIONES · rango de MHz" en 10.5px. La ventana en cápsula deja ver dos rollos de cinta (#4A3426) y dos carretes de seis dientes. La cinta pasa de un carrete al otro con el avance de la canción: el rollo izquierdo se vacía y el derecho se llena (radios de 11.5 a 19.5). Base en trapecio oscuro con dos agujeros y dos ranuras. Se dibuja igual en la pletina, en la torre y en el casete en vuelo.

### Pletina
Módulo claro de bisel negro de 10px, en la columna izquierda. Cabecera "STEREO CASSETTE" y "LADO A" (800 13px, 0.18em; el segundo en gris). El casete (324px de ancho) se ve a través de una tapa ahumada (gris acrílico con reflejo diagonal y filo interior) sobre un foso oscuro con ejes de arrastre, cabezal y rodillos. Los carretes giran (2.4s lineales, en sentido contrario al reloj) solo mientras suena (`data-sonando="si"`). Debajo, el botón EJECT: tecla de 54px con ícono de eject y etiqueta 800 14px con 0.16em, en estuche negro de 6px.

Al pulsar EJECT, la tapa bascula 22° hacia adelante sobre su bisagra inferior (.42s), el casete asoma 34px por arriba y los carretes se detienen; la música sigue.

### Estante de casetes
Caja negra de 1388 × 606 (12px de radio, 12px de marco, sombra flotante) que se desliza 28px desde la izquierda con un fundido (.22s opacidad, .32s transformación) sobre el video y la columna derecha, que se desvanecen en .18s sin parar el sonido. Cabecera "CASETES · n" (800 14px, 0.18em). A la izquierda, la torre; a la derecha, la carátula. Se cierra con Esc, al tocar el dial o al ocultar la pestaña.

- **Torre de casetes en bucle:** el casete elegido va al centro a 340px; los vecinos de arriba y abajo se desplazan 172px y se reducen a .48 con menos saturación y brillo; los de segundo orden quedan invisibles (opacidad 0, sin recibir clics). Se recorre con los botones anterior/siguiente del mando, ↑ ↓ del teclado o tocando un vecino. El casete que ya está en la pletina lleva un rótulo vertical "PUESTO" en #B01B22 (800 12px, 0.22em) a su derecha.
- **Mando:** estuche negro de 440px con tres teclas de 56px (70px, 1fr, 70px): anterior y siguiente giradas 90° y el botón INSERTAR (800 15px, 0.16em), que dice SEGUIR CON ESTE si el casete elegido ya está puesto.
- **Insertar:** el casete elegido vuela al lugar de la pletina (clon fijo que se oculta en la torre mientras viaja) y el estante se cierra; insertar no reproduce solo.
- **Carátula (J-card):** papel #F3EEE3 de 4px de radio con el nombre del casete (34px, mayúsculas, una línea), subtítulo "LADO A · n ESTACIONES · rango MHz" en 700 13px 0.16em gris y un filete a 74px del borde superior. Las canciones van en filas de 12 por columna (flujo en columnas, 28px de separación): frecuencia 800 17px, título 700 14px (una línea con elipsis) y duración a la derecha en gris 13px, separadas por filete punteado al 28% de negro; hover al 6%. Canción activa: frecuencia y título en #B01B22. Sin señal: 45% de opacidad y título tachado.

### Dial
Caja negra de 1824 × 340 con panel claro. Cabecera de leyendas (piloto, "CASETE nombre · n ESTACIONES" con el nombre en rojo de lectura, "SINTONIZAR" con dos flechas, japonés エフエム 88–108 en rojo de lectura). Cada casete tiene su propio dial: la banda se reconstruye con sus estaciones, con un fundido de 24px a la derecha (.42s) al cambiar de casete. Estaciones equidistantes (`--n`), con un mínimo de 100px cada una: cada una tiene nombre inclinado a -38° (máx. 200px, con elipsis) sobre una marca negra de 2px × 40px, escala fina de ticks al 20%, MHz en 800 21px y duración en 700 12px. Estados de estación: reposo con nombre #2A2D32 y marca de 40px; hover o foco, nombre negro y marca de 46px; activa (`.on`), nombre #B01B22; sin señal (`.fallida`), nombre tachado al 45% y marca, MHz y duración al 40%; en vivo, duración "● EN VIVO" en mostaza de lectura 800. El piloto de 11px es un LED metálico gris y se enciende rojo mientras suena.

**Dial desplazable.** Si el casete necesita más de lo que cabe (100px por estación más 80px), la banda se recorre arrastrando (cursor grab) o con la rueda, sin barra; el borde izquierdo o derecho se desvanece en 56px solo del lado donde quedan estaciones fuera de vista, y la aguja centra su estación al moverse.

### Aguja
Barra roja de 4px que cruza la banda, con zona de captura de 14px a cada lado; se arrastra (cursor grab) y salta a una estación al soltar.

### Perilla de volumen
En un módulo propio bajo la pletina, con el mismo marco negro de 10px y la misma cara clara del dial; la perilla mide 170px y marcas y rótulos van en tinta negra. Falda negra con muescas finas, tapa plateada en degradado vertical (#ECEEF0 → #A9AFB6) y una marca roja que va de la falda a la tapa. Recorrido de 270° (de -135° a +135°) con 11 marcas, rótulos "0" y "10" en los extremos y "VOL n" al centro, en Archivo 800. Se gira arrastrando en vertical (160px = todo el recorrido), con la rueda o con ↑ ↓ (con el estante cerrado); el nivel se guarda en el navegador. Foco: anillo rojo de 3px.

### Movimiento
Aguja: `left` en 280 ms con `cubic-bezier(.16, 1, .3, 1)` (ease-out exponencial, sin rebote). Nace posicionada en su estación, sin barrido de arranque; mientras se arrastra, sin transición. Otras transiciones: tapa de la pletina .42 s y casete que asoma .3 s con la misma curva, estante .22-.32 s, casetes de la torre .36 s con la misma curva, cambio de dial .42 s, cubierta 250 ms ease-out, columnas al abrir el estante .18 s, piloto 200 ms, hover de botón y tecla .12-.15 s. Carretes: giro lineal de 2.4 s, solo con sonido. `prefers-reduced-motion: reduce` anula las transiciones de aguja, tapa, ranura, estante, torre, columnas, cubierta, banderas del LCD, fila superior y frecuencia, y el giro de los carretes y el fundido del dial (la aguja salta; el casete no vuela).

### Estados de sistema (resumen)
- **Sonando:** piloto rojo, LCD a plena opacidad, carretes girando, icono de pausa en la tecla, cubierta transparente, estación activa en rojo de lectura.
- **Pausa o sin sonar:** piloto gris, carretes quietos, LCD al 75%, cubierta visible con la frecuencia grande y el mensaje.
- **Estante abierto:** tapa abierta, carretes quietos, video y columna lateral ocultos (el audio sigue), torre y carátula visibles.
- **Sin señal:** estación y canción tachadas y atenuadas; la aguja salta a la siguiente que sirve.
- **En vivo:** mostaza de lectura en texto, rayas mostaza y negro en la barra, rótulo "● EN VIVO".

## Do's and Don'ts

### Do:
- **Do** enmarcar cada pieza que "se enchufa" (video, dial, estante, pletina, volumen) en negro #151618 con panel interior de radio menor.
- **Do** usar #B01B22 para texto rojo y #D2232A para superficies, la aguja y el foco.
- **Do** mostrar activo como hundido (degradado invertido y sombra interior), no como brillante.
- **Do** mover la aguja con 280 ms y `cubic-bezier(.16, 1, .3, 1)`, y dejar toda transición en `none` bajo `prefers-reduced-motion`.
- **Do** mantener las seis teclas al pie de la columna lateral con altura fija; el contenido variable se queda arriba.
- **Do** dar a cada estado una señal que no dependa solo del color: tachado, hundido, segmento invertido, rayado o rótulo (PUESTO).
- **Do** usar las etiquetas en mayúsculas espaciadas solo para rotular controles y zonas reales del aparato.
- **Do** dibujar todo casete con el mismo SVG (carcasa, etiqueta con franjas, ventana con carretes) y dejar que su papel lo decida el nombre.
- **Do** hacer que los carretes giren solo con sonido y que la cinta refleje el avance de la canción.
- **Do** dar a cada casete su propio dial, y recorrerlo sin barra de desplazamiento cuando no cabe.

### Don't:
- **Don't** usar neón, fondos oscuros brillantes ni degradados de color: el aparato es plata de día.
- **Don't** imitar un reproductor de YouTube o Spotify: sin miniaturas, sin barra de video estándar, sin enlaces de salida.
- **Don't** poner sombras con desplazamiento duro; el relieve es de biseles, anillos y sombras difusas.
- **Don't** usar VT323 fuera del LCD y la cubierta, ni el japonés más allá de leyendas cortas.
- **Don't** añadir rojo decorativo: si no marca "sonando", "puesto", acento de marca o foco, no va en rojo.
- **Don't** añadir una versión móvil ni breakpoints; la escena es una sola y se escala.
- **Don't** reproducir al insertar un casete: insertar solo cambia lo que hay en la pletina.

## Defectos no canonizados

Nota de documentación, fuera del sistema: el aire de la columna lateral con títulos cortos es una decisión tomada por el usuario: se deja así, a cambio de que las teclas no se muevan. Los glifos de texto "●" en "EN VIVO" y "▶" en el título de la pestaña son recursos del build, no una regla para nuevas superficies (los íconos del sistema son SVG). Los valores sueltos #2A2C30, #2A2D32, #E8B84A, #0B0C0E, #0E0F11 (foso), los grises internos del SVG de la pletina y del casete (#3A3D42, #C9CDD2, #8D9299, #6E737A, #55595F, #1E2023, #111214, #E9EAEC) y el degradado de panel #F4F5F6 → #DADDE1 no son tokens; son ajustes puntuales del build. La carátula del casete usa un subtítulo en mayúsculas espaciadas con letra de 13px, ajuste del build que no se extiende a otras superficies.
