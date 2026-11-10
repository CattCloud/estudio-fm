---
name: Estudio FM
description: Un radiocasete japonés de los 80 como reproductor de la playlist de estudio; cambiar de canción es sintonizar.
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
typography:
  marca:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  titulo:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.12
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
  ventana: "10px"
  caja: "12px"
  parlante: "14px"
spacing:
  tecla-gap: "6px"
  gap-lateral: "20px"
  gap-cuerpo: "36px"
  margen: "48px"
  marco-negro: "12px"
components:
  boton-lista:
    backgroundColor: "{colors.negro}"
    textColor: "{colors.plata-claro}"
    typography: "{typography.etiqueta}"
    rounded: "{rounded.boton}"
    padding: "13px 20px"
  boton-lista-abierto:
    backgroundColor: "{colors.rojo}"
  tecla:
    backgroundColor: "{colors.plata}"
    textColor: "{colors.negro}"
    rounded: "{rounded.tecla}"
    height: "62px"
  tecla-activa:
    backgroundColor: "{colors.plata-oscuro}"
    textColor: "{colors.rojo-texto}"
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
    width: "1028px"
    height: "591px"
  caja-dial:
    backgroundColor: "{colors.negro}"
    rounded: "{rounded.caja}"
    padding: "12px"
    height: "290px"
  aguja:
    backgroundColor: "{colors.rojo}"
    width: "4px"
---

# Design System: Estudio FM

## Overview

**Creative North Star: "El Radiocasete de los 80"**

La playlist es una banda de radio. Cada canción tiene una frecuencia fija (88.1 a 106.1, paso 1.2) y pasar de canción es sintonizar. La interfaz es un objeto: cuerpo de plástico plateado, marcos negros que encajan paneles, un LCD verde para la frecuencia, teclas de piano plateadas y un dial con aguja roja. Se ve de día, sin neón, y no se parece a un reproductor de video con barra y lista de miniaturas.

Es una superficie única de 1920 × 1050, pensada solo para una laptop de 18 pulgadas, sin versión móvil. La escena se escala entera a la ventana; si la ventana es más ancha que la escena, la cabecera y las franjas sangran a ancho completo y el resto se queda en 1920. El video es protagonista; nada lleva a YouTube.

Densidad media, todo con etiqueta propia: mayúsculas espaciadas para rótulos, VT323 solo donde hay una pantalla, un toque de japonés (ステレオ・ラジオ, エフエム) como sello de época.

**Key Characteristics:**
- Plástico plateado con estrías finas en la cabecera; negro como marco de todo lo que "se enchufa" (video, dial, lista, LCD).
- Firma de marca: tres franjas arena, café y negro, en la cabecera y al pie del dial.
- Un único acento vivo: el rojo marca lo que suena, la aguja y el piloto.
- Relieve físico (biseles, teclas hundibles) en lugar de sombras decorativas.

## Colors

Plata cálida-fría de electrodoméstico, negro de marco, y tres colores de marca (arena, café, negro) más el verde apagado del LCD.

### Primary
- **Rojo Radiocasete** (#D2232A): la aguja, la barra de avance, el piloto encendido, el botón Lista abierto, la selección de texto y el foco. Marca "lo que suena".
- **Rojo de Lectura** (#B01B22): el mismo rojo oscurecido para texto sobre plata (estación o fila activa, tecla activada, leyenda japonesa del dial).

### Secondary
- **Arena** (#D9B98B): primera franja de marca, en la cabecera y al pie del dial.
- **Café** (#8A3F1B): segunda franja de marca.
- **Mostaza Tostada** (#E3A92B): ya no es franja de marca; queda solo en el patrón rayado de la barra "en vivo".
- **Mostaza de Lectura** (#85580A): texto "EN VIVO" sobre plata.

### Neutral
- **Plata Clara** (#ECEEF0), **Plata** (#D3D7DC), **Plata Fondo** (#C3C8CE): degradado vertical del fondo del cuerpo y luz de las teclas.
- **Plata Oscura** (#A9AFB6): bisel de ventana y parlante, fondo de la barra, tecla hundida.
- **Negro Carcasa** (#151618): marcos, franja, texto principal, botón Lista.
- **Gris Tinta** (#4F555D): texto secundario (canal, duraciones).
- **Verde LCD** (#A9B98E) y **Tinta LCD** (#1F2A14): pantalla de frecuencia y su segmento invertido; el verde también tiñe la cubierta del video.

### Named Rules
**The Dos Rojos Rule.** El rojo de marca (#D2232A) va en superficies; el texto rojo sobre plata usa siempre #B01B22. Un tono único no sirve para ambas cosas.
**The Rojo Que Suena Rule.** El rojo señala el estado "sonando" (aguja, barra, estación activa). No se usa como decoración.

## Typography

**Display Font:** Archivo (itálica 900 solo para la marca), autoalojada, con system-ui de respaldo
**Body Font:** Archivo 700-800 (rango variable 500-800)
**Label/Mono Font:** VT323 para todo lo que sea pantalla LCD y cubierta; M PLUS 1p 700 para el japonés

**Character:** Archivo es el rótulo serigrafiado del aparato, firme y con números tabulares (`font-variant-numeric: tabular-nums` en el body). VT323 es el segmento luminoso. El japonés va siempre como pastilla o leyenda corta.

### Hierarchy
- **Marca** (900 itálica, 40px, 1): "ESTUDIO FM".
- **Frecuencia LCD** (VT323 400, 118px, .85): la frecuencia grande; la cubierta del video repite el motivo a 190px.
- **Título** (700, 28px, 1.12, balance, máx. 3 líneas): canción en curso.
- **Dato** (800, 21-26px, 1): MHz de cada estación del dial y frecuencias de la lista.
- **Cuerpo** (700, 15-17px): tiempo, filas de la lista (16px, máx. 2 líneas).
- **Etiqueta** (800, 14px, 0.12-0.18em, mayúsculas): teclas de texto, cabeceras de dial y lista, canal.
- **Línea LCD** (VT323, 21-24px, 0.06em): FM STEREO, posición 08/16 y banderas.

### Named Rules
**The Serigrafía Rule.** Las etiquetas de equipo son mayúsculas espaciadas en Archivo 700-800; son el idioma nativo de un aparato y rotulan controles reales (dial, teclas, lista). No se usan como antetítulo decorativo sobre un título.
**The Solo Pantalla Rule.** VT323 aparece únicamente dentro del LCD y de la cubierta de video.

## Layout

Escena de 1920 × 1050 posicionada al centro y escalada con `--escala`; el ancho de escena crece a `max(1920, ventana / escala)` para que las franjas lleguen a los bordes. Sin scroll ni versión móvil.

De arriba abajo: cabecera de 78px (márgenes laterales de 48px, estrías de 1px cada 4px al 5% negro), franjas de 18px en tres filas, fila principal y dial anclado al pie (290px, 26px del borde inferior). La fila principal es una rejilla de 300px (parlante) / 1028px (ventana de video) / 1fr (columna lateral), con 36px de separación y 26px de aire superior; las tres columnas miden 591px de alto. El panel Lista ocupa el ancho del dial (1824px) en el lugar de la fila principal, que se oculta con un fundido.

La columna lateral tiene altura fija y apila LCD, ficha (título + canal, mínimo 118px), tiempo con barra, y las seis teclas fijas al pie con `margin-top: auto`, de modo que no se mueven si el título ocupa 1 o 3 líneas. Ritmo: 20px entre bloques laterales, 6px entre teclas, 12px de marco negro.

## Elevation & Depth

Híbrido físico: relieve de objeto, no sombras ambientales. La profundidad sale de marcos negros que rodean paneles claros, biseles internos y teclas con borde inferior grueso.

### Shadow Vocabulary
- **Bisel plata** (`box-shadow: 0 0 0 3px #A9AFB6, 0 10px 24px rgba(21,22,24,.28)`): ventana de video.
- **LCD hundido** (`inset 0 3px 10px rgba(0,0,0,.35), 0 0 0 4px #151618`): pantalla empotrada con marco.
- **Tecla alta** (`inset 0 -5px 0 rgba(0,0,0,.18), 0 1px 0 rgba(255,255,255,.12)`): tecla en reposo.
- **Tecla hundida** (`inset 0 3px 6px rgba(0,0,0,.35)` + degradado invertido): estado activo, pulsado o `aria-pressed`.
- **Panel flotante** (`0 18px 40px rgba(21,22,24,.4)`): solo el panel Lista.
- **Rejilla de parlante**: bisel interior doble (3px plata oscura y 8px #2A2C30) con puntos de 12px.

### Named Rules
**The Hundida Rule.** Activo significa hundido: la tecla activa invierte su degradado y cambia a sombra interior. Ninguna tecla activa "se ilumina" o brilla.
**The Sin Sombra Dura Rule.** No hay sombras con desplazamiento duro; toda sombra exterior es difusa o un anillo plano de bisel.

## Shapes

Esquinas pequeñas, de plástico moldeado: 2px segmentos del LCD, 3px teclas, 4px botón Lista y pantalla de video, 6px interiores de paneles, 8px LCD, 10px ventana, 12px cajas de dial y lista, 14px parlante. Los marcos son anillos concéntricos: negro de 12-14px, luego el panel claro con radio menor. El resto es recto: barra de avance sin radio, marcas de escala de 2px, aguja de 4px. El piloto es el único círculo. Los íconos de control son SVG de relleno plano, de 30px.

## Components

### Cabecera con franjas
Marca en itálica 900, pastilla negra con ステレオ・ラジオ (3px de radio), y a la derecha el botón Lista. El rótulo del dial dice "ESTACIONES DE ESTUDIO · 16 ESTACIONES" (el número sale de la lista). Debajo, tres franjas de 6px: arena, café, negro. La franja se repite al pie del dial (6px, tercios exactos).

### Botón Lista
Negro con texto plata claro, etiqueta 800 15px con 0.16em de espaciado, 13px 20px. Hover #2B2E33 (.15s); abierto (`aria-expanded`) pasa a rojo.

### Teclas
Seis teclas en rejilla de 3 columnas dentro de un estuche negro (6px de padding y de separación, 6px de radio). Cada una mide 62px de alto, con degradado plata claro a plata oscura. Tres de ícono (anterior, play/pausa, siguiente) y tres de texto (BUSCAR, EXPLORAR, REPETIR). Hover: brillo 1.06 (.12s). Activa/pulsada/`aria-pressed`: hundida (ver Elevación), y las de texto pasan a texto #B01B22. Foco: contorno rojo de 3px hacia adentro (-3px).

### LCD
Verde #A9B98E, tinta #1F2A14, 8px, anillo negro de 4px. Fila superior FM STEREO y posición; frecuencia de 118px con "MHz" a 36px; fila de banderas (estado, BUSCAR, EXPLORAR, REPETIR) en VT323 21px. Bandera apagada al 80% de opacidad; encendida = segmento invertido (fondo tinta, texto verde), sin transición, para que fondo y texto cambien a la vez. En pausa o sin sonar (`data-sonando="no"`) la fila superior y la frecuencia bajan a 75% de opacidad.

### Ventana de video con cubierta
Ventana negra de 1028 × 591 (14px de padding, 10px de radio, bisel plata) con pantalla 16:9 de 1000 × 563. Una cubierta absorbe todos los clics (nada lleva a YouTube) y tapa lo que YouTube pinta al pausar: líneas de barrido de 2px cada 5px, degradado oscuro y verde LCD, la frecuencia a 190px en VT323 y un mensaje de 40px con 0.14em. Se desvanece a opacidad 0 en 250 ms ease-out cuando la fase es "reproduciendo", pero sigue recibiendo clics. En fase de error el mensaje pasa a ámbar (#E8B84A).

### Tiempo y barra
Tiempos en 700 17px; la barra mide 6px sobre plata oscura, rellena en rojo con `scaleX`. En vivo: el total dice "● EN VIVO" en #85580A y la barra se llena entera con rayas de 10px alternando mostaza y negro.

### Dial
Caja negra de 1824 × 290 con panel claro. Cabecera de leyendas (piloto, "SINTONIZAR" con dos flechas, japonés エフエム 88–108 en rojo de lectura). Banda de 16 estaciones equidistantes (`--n`): cada una tiene nombre inclinado a -38° sobre una marca negra de 2px × 40px, escala fina de ticks al 20%, MHz en 800 21px y duración en 700 12px. Estados de estación: reposo con nombre #2A2D32 y marca de 40px; hover o foco, nombre negro y marca de 46px; activa (`.on`), nombre #B01B22; sin señal (`.fallida`), nombre tachado al 45% y marca, MHz y duración al 40%; en vivo, duración "● EN VIVO" en mostaza de lectura 800. El piloto de 11px es un LED metálico gris y se enciende rojo mientras suena.

### Aguja
Barra roja de 4px que cruza la banda, con zona de captura de 14px a cada lado; se arrastra (cursor grab) y salta a una estación al soltar.

### Panel Lista
Caja negra de 1824 × 591 sobre la fila principal, que se desvanece a opacidad 0 en .15s (el video sigue sonando). Panel claro con cabecera ESTACIONES / "Esc para cerrar" y 8 filas por columna en dos columnas (grid de columna, 40px de separación). Cada fila: frecuencia 800 26px, título 700 16px (2 líneas) con canal en mayúsculas de 12px y duración a la derecha, separada por un filete al 16% de negro; hover al 6%. Fila activa: frecuencia y título en #B01B22. Sin señal: 45% de opacidad y título tachado. El panel se cierra solo si se oculta la pestaña.

### Movimiento
Aguja: `left` en 280 ms con `cubic-bezier(.16, 1, .3, 1)` (ease-out exponencial, sin rebote). Nace posicionada en su estación, sin barrido de arranque (transición en `none` en la primera colocación, restaurada después); mientras se arrastra, sin transición. Otras transiciones: cubierta 250 ms ease-out, cuerpo al abrir la Lista 150 ms ease-out, piloto 200 ms, hover de botón y tecla .12-.15 s. `prefers-reduced-motion: reduce` anula las transiciones de aguja, cuerpo, cubierta, banderas del LCD, fila superior y frecuencia (la aguja salta).

### Perilla de volumen
En un módulo propio bajo el parlante (el parlante se acortó para dejarle sitio), con el mismo marco negro de 10px y la misma cara clara del dial; la perilla mide 218px y marcas y rótulos van en tinta negra. Falda negra con muescas finas, tapa plateada en degradado vertical (#ECEEF0 → #A9AFB6) y una marca roja que va de la falda a la tapa. Recorrido de 270° (de -135° a +135°) con 11 marcas, rótulos "0" y "10" en los extremos y "VOL n" al centro, en Archivo 800. Se gira arrastrando en vertical (160px = todo el recorrido), con la rueda o con ↑ ↓; el nivel se guarda en el navegador. Foco: anillo rojo de 3px.

### Barra de posición
La barra de avance es un deslizador: se pulsa o se arrastra para saltar a un punto de la canción. Pista gris plata de 6px, relleno rojo y una manija de fader (9 × 20px, plata con filo negro de 1.5px). La zona de agarre es 14px más alta que la pista. En vivo, la manija desaparece y la barra no responde.

### Estados de sistema (resumen)
- **Sonando:** piloto rojo, LCD a plena opacidad, icono de pausa en la tecla, cubierta transparente, estación activa en rojo de lectura.
- **Pausa o sin sonar:** piloto gris, LCD al 75%, cubierta visible con la frecuencia grande y el mensaje.
- **Sin señal:** estación y fila tachadas y atenuadas; la aguja salta a la siguiente que sirve.
- **En vivo:** mostaza de lectura en texto, rayas mostaza y negro en la barra, rótulo "● EN VIVO".

## Do's and Don'ts

### Do:
- **Do** enmarcar cada pieza que "se enchufa" (video, dial, lista) en negro #151618 con panel interior de radio menor.
- **Do** usar #B01B22 para texto rojo y #D2232A para superficies, la aguja y el foco.
- **Do** mostrar activo como hundido (degradado invertido y sombra interior), no como brillante.
- **Do** mover la aguja con 280 ms y `cubic-bezier(.16, 1, .3, 1)`, y dejar toda transición en `none` bajo `prefers-reduced-motion`.
- **Do** mantener las seis teclas al pie de la columna lateral con altura fija; el contenido variable se queda arriba.
- **Do** dar a cada estado una señal que no dependa solo del color: tachado, hundido, segmento invertido o rayado.
- **Do** usar las etiquetas en mayúsculas espaciadas solo para rotular controles y zonas reales del aparato.

### Don't:
- **Don't** usar neón, fondos oscuros brillantes ni degradados de color: el aparato es plata de día.
- **Don't** imitar un reproductor de YouTube o Spotify: sin miniaturas, sin barra de video estándar, sin enlaces de salida.
- **Don't** poner sombras con desplazamiento duro; el relieve es de biseles, anillos y sombras difusas.
- **Don't** usar VT323 fuera del LCD y la cubierta, ni el japonés más allá de leyendas cortas.
- **Don't** añadir rojo decorativo: si no marca "sonando", acento de marca o foco, no va en rojo.
- **Don't** añadir una versión móvil ni breakpoints; la escena es una sola y se escala.

## Defectos no canonizados

Nota de documentación, fuera del sistema: el aire de la columna lateral con títulos cortos es una decisión tomada por el usuario: se deja así, a cambio de que las teclas no se muevan. Los glifos de texto "●" en "EN VIVO" y "▶" en el título de la pestaña son recursos del build, no una regla para nuevas superficies (los íconos del sistema son SVG). Los valores sueltos #2B2E33, #2A2C30, #2A2D32, #E8B84A, #0B0C0E y los grises del degradado del panel no son tokens; son ajustes puntuales del build.
