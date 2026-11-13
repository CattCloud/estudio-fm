// Estudio FM · reproductor
//
// El video va en un iframe de youtube-nocookie.com y se controla con el protocolo
// postMessage del propio reproductor de YouTube (el mismo que usa su IFrame API).
// No se carga ningún script de youtube.com: así funciona aunque ese dominio esté bloqueado.

const ORIGEN_YT = 'https://www.youtube-nocookie.com';
const SEGUNDOS_EXPLORAR = 15;
const ESPERA_CARGA_MS = 15000;
const PAUSA_ANTES_DE_SALTAR_MS = 1600;
const DEPURAR = new URLSearchParams(location.search).has('debug');

const $ = (id) => document.getElementById(id);
const el = {
  escena: $('escena'), pantalla: $('pantalla'), cubFreq: $('cub-freq'), cubMsg: $('cub-msg'),
  cuenta: $('cuenta'), lcdPos: $('lcd-pos'), lcdFreq: $('lcd-freq'),
  fEstado: $('f-estado'), fBuscar: $('f-buscar'), fExplorar: $('f-explorar'), fRepetir: $('f-repetir'),
  titulo: $('titulo'), canal: $('canal'), tActual: $('t-actual'), tTotal: $('t-total'),
  barra: $('barra'), barraLlena: $('barra-llena'),
  btnAnterior: $('btn-anterior'), btnPlay: $('btn-play'), usoPlay: $('uso-play'), btnSiguiente: $('btn-siguiente'),
  btnBuscar: $('btn-buscar'), btnExplorar: $('btn-explorar'), btnRepetir: $('btn-repetir'),
  perilla: $('perilla'), perillaGiro: $('perilla-giro'), perillaMarcas: $('perilla-marcas'), perillaValor: $('perilla-valor'),
  banda: $('banda'), bandaCaja: $('banda-caja'), pistaBanda: $('pista-banda'), aguja: $('aguja'), estadoSr: $('estado-sr'),
  lcdCasete: $('lcd-casete'), dialCasete: $('dial-casete'),
  pletina: $('pletina'), ranura: $('ranura'), btnEject: $('btn-eject'),
  estante: $('estante'), escenario: $('escenario'), nCasetes: $('n-casetes'),
  casAnt: $('cas-ant'), casSig: $('cas-sig'), btnInsertar: $('btn-insertar'),
  jcNombre: $('jc-nombre'), jcSub: $('jc-sub'), pistas: $('pistas'),
  centro: $('centro'), lateral: $('lateral'),
};

// ── Estado ──────────────────────────────────────────────────────────────────

const memoria = {
  leer(clave, defecto) { try { const v = localStorage.getItem(`estudiofm.${clave}`); return v === null ? defecto : v === '1'; } catch { return defecto; } },
  guardar(clave, valor) { try { localStorage.setItem(`estudiofm.${clave}`, valor ? '1' : '0'); } catch { /* sin almacenamiento: no pasa nada */ } },
};

const e = {
  casetes: [],              // [{ nombre, paso, papel, canciones, ultima }]: cada grupo de songs.json es un casete
  puesto: -1,               // casete que está en la pletina
  foco: 0,                  // casete elegido en el estante (aún sin insertar)
  abierto: false,           // ¿estante abierto?
  insertando: false,        // true mientras el casete vuela a la pletina
  canciones: [],            // las canciones del casete puesto: todo lo de abajo (dial, Siguiente, Buscar...) actúa solo sobre ellas
  actual: -1,               // índice dentro de `canciones`
  fase: 'listo',            // listo | cargando | reproduciendo | pausa | error
  mensaje: '',              // detalle para fase "error" o "pausa"
  buscar: memoria.leer('buscar', true),
  repetir: memoria.leer('repetir', false),
  explorar: false,
  fallidas: new Set(),      // ids de las canciones sin señal (no índices: valen en cualquier casete)
  bolsa: [],
  tiempo: 0,
  duracion: null,
  fallosSeguidos: 0,
  idCarga: 0,               // cuenta cada carga de canción: invalida los temporizadores de la anterior
  idFrame: 0,               // identifica al iframe vivo en el protocolo con YouTube; no cambia mientras el iframe dure
  cambiandoVideo: false,    // true entre pedirle otro video al reproductor vivo y que empiece a sonar
  iframe: null,
  conectado: false,         // ¿ya respondió el reproductor de esta carga?
  ultimoEstadoYT: null,
  temporizadores: { carga: 0, saludo: 0, saltar: 0, explorar: 0 },
  inicioExplorar: 0,
  volumen: leerVolumen(),
  arrastrandoBarra: false,
};

const depurar = (...a) => { if (DEPURAR) console.debug('[estudio-fm]', ...a); };

// ── Utilidades ──────────────────────────────────────────────────────────────

function formato(s) {
  if (s == null || !Number.isFinite(s)) return '0:00';
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}` : `${m}:${String(seg).padStart(2, '0')}`;
}
const dosDigitos = (n) => String(n).padStart(2, '0');
const freqTexto = (c) => c.freq.toFixed(1);
const cancion = () => e.canciones[e.actual];
const n = () => e.canciones.length;
const casetePuesto = () => e.casetes[e.puesto];
const falla = (i) => e.fallidas.has(e.canciones[i]?.id);   // ¿la estación i del casete puesto no tiene señal?
const duracionTexto = (c) => (c.envivo ? '● EN VIVO' : formato(c.duracion));
const rangoTexto = (c) => `${freqTexto(c.canciones[0])}–${freqTexto(c.canciones.at(-1))}`;

function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── Escala de la escena ─────────────────────────────────────────────────────

function ajustarEscala() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1050);
  el.escena.style.setProperty('--escala', s.toFixed(4));
  el.escena.style.setProperty('--ancho', `${Math.max(1920, innerWidth / s).toFixed(1)}px`);
}

// ── Construcción de la interfaz ─────────────────────────────────────────────

const ANCHO_ESTACION = 100;   // ancho mínimo por estación: con menos, los nombres inclinados se pisan

// Dibuja el dial del casete puesto. Si no cabe, la banda se hace más ancha que la ventana y se recorre arrastrando.
function construirDial(animar = false) {
  const caja = el.bandaCaja;
  const necesita = n() * ANCHO_ESTACION + 80;
  const desplaza = necesita > caja.clientWidth;
  caja.scrollLeft = 0;
  el.pistaBanda.style.width = desplaza ? `${necesita}px` : '100%';
  caja.classList.toggle('desplazable', desplaza);
  bordesDial();
  el.banda.style.setProperty('--n', n());
  el.banda.replaceChildren(...e.canciones.map((c, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'est';
    b.dataset.i = i;
    const duracion = c.envivo ? 'EN VIVO' : formato(c.duracion);
    b.setAttribute('aria-label', `${freqTexto(c)} FM, ${c.corto}, ${c.envivo ? 'en vivo' : duracion}`);
    b.innerHTML = `<span class="nombre"></span><span class="marca-esc"></span><span class="mhz"></span><span class="dur${c.envivo ? ' vivo' : ''}"></span>`;
    b.querySelector('.nombre').textContent = c.corto;
    b.querySelector('.mhz').textContent = freqTexto(c);
    b.querySelector('.dur').textContent = c.envivo ? '● EN VIVO' : duracion;
    li.append(b);
    return li;
  }));
  const casete = casetePuesto();
  el.dialCasete.textContent = casete.nombre.toUpperCase();
  el.cuenta.textContent = String(n());
  if (animar && !reducido) { el.banda.classList.remove('cambiando'); void el.banda.offsetWidth; el.banda.classList.add('cambiando'); }
}

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Los bordes del dial se desvanecen solo del lado donde quedan estaciones fuera de vista.
function bordesDial() {
  const caja = el.bandaCaja;
  const max = caja.scrollWidth - caja.clientWidth;
  caja.style.setProperty('--fade-i', caja.scrollLeft > 2 ? 0 : 1);
  caja.style.setProperty('--fade-d', caja.scrollLeft < max - 2 ? 0 : 1);
}

// Pone la aguja sobre la estación actual y, si el dial se desplaza, centra esa zona de la banda.
function moverAguja(sinTransicion = false) {
  const li = el.banda.children[e.actual];
  if (!li) return;
  const caja = el.bandaCaja;
  const x = li.offsetLeft + li.offsetWidth / 2 + el.banda.offsetLeft;
  if (sinTransicion) el.aguja.style.transition = 'none';
  el.aguja.style.left = `${x}px`;
  if (sinTransicion) { el.aguja.getBoundingClientRect(); el.aguja.style.transition = ''; }
  const max = caja.scrollWidth - caja.clientWidth;
  if (max > 0) caja.scrollTo({ left: Math.min(max, Math.max(0, x - caja.clientWidth / 2)), behavior: sinTransicion || reducido ? 'auto' : 'smooth' });
}

// ── Casete en SVG: carcasa, etiqueta con franjas, ventana con carretes ──────

const PAPELES = ['#EFE6D2', '#C9D3DB', '#E3D3B4', '#DCDCD4', '#E6D9D2', '#D3DDD0'];
const papelDe = (nombre) => PAPELES[[...nombre].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % PAPELES.length];
const radiosCinta = (p) => ({ izq: 11.5 + 8 * (1 - p), der: 11.5 + 8 * p });   // la cinta pasa de un carrete al otro; el rollo lleno (r 19.5) cabe en la ventana (r 22)

let contadorCasetes = 0;
function casete(c, progreso = .35) {
  const r = radiosCinta(progreso);
  const ventana = `v${++contadorCasetes}`;   // id único: varios casetes conviven en la página
  const dientes = (cx) => Array.from({ length: 6 }, (_, k) => `<rect x="${cx - 1.6}" y="79" width="3.2" height="5" rx="1" fill="#2A2C30" transform="rotate(${k * 60} ${cx} 88)"/>`).join('');
  const tornillo = (x, y) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#55595F"/><path d="M${x - 2.4} ${y}h4.8" stroke="#2A2C30" stroke-width="1.2"/>`;
  // Nombres largos: letra y espaciado más chicos, y si ni así caben, se cortan con "…" (el nombre completo está en la carátula y el dial).
  const MAX_NOMBRE = 24;
  const corto = c.nombre.length > MAX_NOMBRE ? `${c.nombre.slice(0, MAX_NOMBRE - 1).trimEnd()}…` : c.nombre;
  const nombre = corto.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const tamNombre = corto.length <= 15 ? 19 : Math.max(11, 19 * 15 / corto.length);
  const espaciado = (2 * tamNombre / 19).toFixed(1);
  return `<svg viewBox="0 0 314 200" role="img" aria-label="Casete ${nombre}">
    <rect x="1" y="1" width="312" height="198" rx="10" fill="#26282C"/>
    <rect x="1.5" y="1.5" width="311" height="197" rx="9.5" fill="none" stroke="#fff" stroke-opacity=".09"/>
    ${tornillo(10, 10)}${tornillo(304, 10)}${tornillo(10, 190)}${tornillo(304, 190)}
    <rect x="18" y="14" width="278" height="124" rx="4" fill="${c.papel}"/>
    <rect x="18" y="52" width="278" height="3.5" fill="#D9B98B"/><rect x="18" y="55.5" width="278" height="3.5" fill="#8A3F1B"/><rect x="18" y="59" width="278" height="3.5" fill="#151618"/>
    <text x="30" y="40" font-family="Archivo" font-weight="800" font-size="${tamNombre.toFixed(1)}" letter-spacing="${espaciado}" fill="#151618">${nombre.toUpperCase()}</text>
    <rect x="262" y="22" width="24" height="24" rx="3" fill="#151618"/><text x="274" y="40" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="17" fill="#ECEEF0">A</text>
    <defs><clipPath id="${ventana}"><rect x="80" y="68" width="154" height="44" rx="22"/></clipPath></defs>
    <rect x="80" y="68" width="154" height="44" rx="22" fill="#111214"/>
    <g clip-path="url(#${ventana})">
      <circle class="pack-i" cx="118" cy="88" r="${r.izq.toFixed(1)}" fill="#4A3426"/>
      <circle class="pack-d" cx="196" cy="88" r="${r.der.toFixed(1)}" fill="#4A3426"/>
      <circle cx="118" cy="88" r="${r.izq.toFixed(1)}" fill="none" stroke="#000" stroke-opacity=".25" class="pack-i"/>
      <circle cx="196" cy="88" r="${r.der.toFixed(1)}" fill="none" stroke="#000" stroke-opacity=".25" class="pack-d"/>
    </g>
    <rect x="80" y="68" width="154" height="44" rx="22" fill="none" stroke="#fff" stroke-opacity=".14"/>
    <path d="M86 75 Q157 66 228 75" stroke="#fff" stroke-opacity=".10" stroke-width="3" fill="none"/>
    <g class="carrete"><circle cx="118" cy="88" r="10" fill="#E9EAEC"/>${dientes(118)}<circle cx="118" cy="88" r="3.4" fill="#2A2C30"/></g>
    <g class="carrete"><circle cx="196" cy="88" r="10" fill="#E9EAEC"/>${dientes(196)}<circle cx="196" cy="88" r="3.4" fill="#2A2C30"/></g>
    <text x="30" y="128" font-family="Archivo" font-weight="700" font-size="10.5" letter-spacing="1.6" fill="#4F555D">${c.canciones.length} ESTACIONES · ${rangoTexto(c)}</text>
    <path d="M62 199 L78 156 H236 L252 199 Z" fill="#1E2023"/>
    <circle cx="102" cy="181" r="6" fill="#0E0F11"/><circle cx="212" cy="181" r="6" fill="#0E0F11"/>
    <rect x="138" y="170" width="10" height="10" rx="2" fill="#0E0F11"/><rect x="166" y="170" width="10" height="10" rx="2" fill="#0E0F11"/>
  </svg>`;
}

function construirPletina() { el.ranura.innerHTML = casete(casetePuesto(), progresoCinta()); }

// La cinta avanza con la canción: el rollo izquierdo se vacía y el derecho se llena.
let ultimoProgresoCinta = -1;
function progresoCinta() {
  const c = cancion();
  const total = c && !c.envivo ? (e.duracion ?? c.duracion) : null;
  return total ? Math.min(1, e.tiempo / total) : .5;
}
function pintarCinta() {
  const p = progresoCinta();
  if (Math.abs(p - ultimoProgresoCinta) < .004) return;
  ultimoProgresoCinta = p;
  const r = radiosCinta(p);
  el.ranura.querySelectorAll('.pack-i').forEach((x) => x.setAttribute('r', r.izq.toFixed(1)));
  el.ranura.querySelectorAll('.pack-d').forEach((x) => x.setAttribute('r', r.der.toFixed(1)));
}

// ── Pintar el estado ────────────────────────────────────────────────────────

function pintar() {
  const c = cancion();
  const sonando = e.fase === 'reproduciendo';
  document.body.dataset.sonando = sonando ? 'si' : 'no';
  el.pantalla.dataset.fase = e.fase;

  if (c) {
    el.lcdFreq.textContent = freqTexto(c);
    el.lcdPos.textContent = `${dosDigitos(e.actual + 1)}/${dosDigitos(n())}`;
    el.titulo.textContent = c.titulo;
    el.canal.textContent = c.canal;
    el.cubFreq.textContent = freqTexto(c);
    el.lcdCasete.textContent = casetePuesto().nombre.toUpperCase().slice(0, 12);
    el.banda.querySelectorAll('.est').forEach((b, i) => {
      b.classList.toggle('on', i === e.actual);
      b.classList.toggle('fallida', falla(i));
      if (i === e.actual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }

  const textoEstado = { listo: 'LISTO', cargando: 'SINTONIZANDO', reproduciendo: 'PLAY', pausa: 'PAUSA', error: 'SIN SEÑAL' }[e.fase];
  el.fEstado.textContent = textoEstado;
  el.fEstado.classList.toggle('on', e.fase !== 'listo');
  el.fBuscar.classList.toggle('on', e.buscar);
  el.fRepetir.classList.toggle('on', e.repetir);
  el.fExplorar.classList.toggle('on', e.explorar);

  el.btnBuscar.setAttribute('aria-pressed', String(e.buscar));
  el.btnRepetir.setAttribute('aria-pressed', String(e.repetir));
  el.btnExplorar.setAttribute('aria-pressed', String(e.explorar));
  el.btnPlay.classList.toggle('hundida', sonando);
  el.btnPlay.setAttribute('aria-label', sonando ? 'Pausar' : 'Reproducir');
  el.usoPlay.setAttribute('href', sonando ? '#i-pausa' : '#i-play');

  el.cubMsg.textContent = {
    listo: 'PULSA PLAY', cargando: 'SINTONIZANDO', reproduciendo: '', pausa: e.mensaje || 'PAUSA', error: e.mensaje || 'SIN SEÑAL',
  }[e.fase];

  pintarTiempo(true);
  pintarTitulo();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = sonando ? 'playing' : (e.fase === 'pausa' ? 'paused' : 'none');
}

function pintarTitulo() {
  const c = cancion();
  if (!c || e.fase === 'listo') { document.title = 'Estudio FM'; return; }
  const marca = { reproduciendo: '▶', pausa: '❚❚', cargando: '…', error: '✕' }[e.fase];
  document.title = `${marca} ${freqTexto(c)} · ${c.corto}`;
}

let ultimoSegundoPintado = -1;
function pintarTiempo(forzar = false) {
  const c = cancion();
  if (!c) return;
  const seg = Math.floor(e.tiempo);
  if (!forzar && seg === ultimoSegundoPintado) return;
  ultimoSegundoPintado = seg;
  const vivo = c.envivo;
  el.tActual.textContent = formato(e.tiempo);
  el.tTotal.textContent = vivo ? '● EN VIVO' : formato(e.duracion ?? c.duracion);
  el.tTotal.classList.toggle('vivo', !!vivo);
  el.barra.classList.toggle('vivo', !!vivo);
  const total = e.duracion ?? c.duracion;
  const p = vivo || !total ? 0 : Math.min(1, e.tiempo / total);
  el.barra.style.setProperty('--p', p.toFixed(4));
  el.barra.setAttribute('aria-valuemax', String(Math.round(total || 0)));
  el.barra.setAttribute('aria-valuenow', String(Math.round(e.tiempo)));
  el.barra.setAttribute('aria-valuetext', vivo ? 'En vivo' : `${formato(e.tiempo)} de ${formato(total)}`);
  el.barra.setAttribute('aria-disabled', String(!!vivo));
  pintarCinta();
}

function anunciar(texto) { el.estadoSr.textContent = texto; }

function ponerMetadatos() {
  const c = cancion();
  if (!c || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: c.titulo, artist: c.canal, album: `Estudio FM · ${freqTexto(c)} FM` });
}

// ── Selección de estación ───────────────────────────────────────────────────

function vecina(direccion, desde = e.actual) {
  for (let k = 1; k <= n(); k++) {
    const j = (((desde + direccion * k) % n()) + n()) % n();
    if (!falla(j) && j !== e.actual) return j;
  }
  return null;
}

function deLaBolsa() {
  const sirve = (i) => i !== e.actual && !falla(i);
  e.bolsa = e.bolsa.filter(sirve);
  if (!e.bolsa.length) e.bolsa = barajar(e.canciones.map((_, i) => i).filter(sirve));
  return e.bolsa.length ? e.bolsa.pop() : null;
}

function destinoSiguiente() { return e.buscar ? deLaBolsa() : vecina(+1); }

function cancelarSalto() { clearTimeout(e.temporizadores.saltar); e.temporizadores.saltar = 0; }

function sintonizar(i, { reproducir = true, escaneo = false, sinBarrido = false } = {}) {
  if (i == null || i < 0 || i >= n()) return;
  if (DEPURAR) depurar('sintonizar', freqTexto(e.canciones[i]), { escaneo, reproducir, explorar: e.explorar }, new Error().stack.split('\n')[2]?.trim());
  cancelarSalto();
  if (!escaneo) detenerExplorar();
  e.actual = i;
  casetePuesto().ultima = i;   // cada casete recuerda su última estación
  e.tiempo = 0;
  e.duracion = null;
  e.mensaje = '';
  ponerMetadatos();
  moverAguja(sinBarrido);
  if (reproducir) cargar(i); else { descargar(); e.fase = 'listo'; pintar(); }
  anunciar(`Sintonizado ${freqTexto(cancion())}, ${cancion().titulo}`);
}

// Siguiente y Anterior (botones, flechas del teclado, teclas multimedia) van siempre a la estación vecina.
// Buscar solo decide qué pasa cuando una canción termina sola.
function sintonizarVecina(direccion) { const i = vecina(direccion); if (i != null) sintonizar(i); }
function siguiente() { sintonizarVecina(+1); }
function anterior() { sintonizarVecina(-1); }

// ── Reproductor (iframe + postMessage) ──────────────────────────────────────

function descargar() {
  clearTimeout(e.temporizadores.carga); clearInterval(e.temporizadores.saludo);
  e.idCarga++;
  e.conectado = false;
  e.cambiandoVideo = false;
  e.ultimoEstadoYT = null;
  if (e.iframe) { e.iframe.remove(); e.iframe = null; }
}

// Si el reproductor ya está vivo se le cambia el video en lugar de crear otro iframe.
// Un iframe nuevo en una pestaña oculta no arranca solo; el que ya venía sonando sí sigue con la siguiente canción.
function cambiarVideo(c) {
  clearTimeout(e.temporizadores.carga);
  const id = ++e.idCarga;
  if (e.ultimoEstadoYT !== 0) e.ultimoEstadoYT = null;   // un "terminó" repetido del video anterior no cuenta como canción nueva
  e.cambiandoVideo = true;                                // al cambiar de video el reproductor pasa por "pausa" un instante: no es una pausa real
  e.fase = 'cargando';
  pintar();
  ordenarConArgs('loadVideoById', [c.id]);
  esperarCarga(id);
}

function esperarCarga(id) {
  e.temporizadores.carga = setTimeout(() => {
    if (id !== e.idCarga || e.fase !== 'cargando') return;
    e.cambiandoVideo = false;
    if (e.conectado) { e.fase = 'pausa'; e.mensaje = 'PULSA PLAY'; pintar(); }   // el navegador no dejó arrancar solo
    else senalPerdida('no respondió');
  }, ESPERA_CARGA_MS);
}

function cargar(i) {
  const c = e.canciones[i];
  if (e.iframe && e.conectado) return cambiarVideo(c);
  descargar();
  const id = e.idCarga;
  e.idFrame = id;
  e.fase = 'cargando';
  pintar();

  if (location.protocol === 'file:') return mostrarFalloGlobal('ABRE POR HTTP', 'Abre la página con un servidor local o desde GitHub Pages, no con doble clic en el archivo.');

  const parametros = new URLSearchParams({
    autoplay: '1', controls: '0', disablekb: '1', fs: '0', iv_load_policy: '3', rel: '0',
    modestbranding: '1', playsinline: '1', enablejsapi: '1', cc_load_policy: '0', origin: location.origin,
  });
  const f = document.createElement('iframe');
  f.title = 'Reproductor de video';
  f.tabIndex = -1;
  f.allow = 'autoplay; encrypted-media; picture-in-picture';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.addEventListener('load', () => {
    if (id !== e.idCarga) return;
    let intentos = 0;
    e.temporizadores.saludo = setInterval(() => {
      if (id !== e.idCarga || e.conectado || ++intentos > 60) { clearInterval(e.temporizadores.saludo); return; }
      enviar({ event: 'listening', id, channel: 'widget' });
    }, 250);
  });
  f.src = `${ORIGEN_YT}/embed/${c.id}?${parametros}`;
  e.iframe = f;
  el.pantalla.prepend(f);
  esperarCarga(id);
}

function enviar(mensaje) {
  try { e.iframe?.contentWindow?.postMessage(JSON.stringify(mensaje), ORIGEN_YT); } catch { /* el iframe aún no existe */ }
}
const ordenar = (func) => enviar({ event: 'command', func, args: '', id: e.idFrame, channel: 'widget' });
const ordenarConArgs = (func, args) => enviar({ event: 'command', func, args, id: e.idFrame, channel: 'widget' });

addEventListener('message', (ev) => {
  if (ev.origin !== ORIGEN_YT || !e.iframe || ev.source !== e.iframe.contentWindow) return;
  let d; try { d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data; } catch { return; }
  if (!d || d.id !== e.idFrame) return;
  if (!e.conectado) { e.conectado = true; clearInterval(e.temporizadores.saludo); depurar('conectado', d.event); aplicarVolumen(); }

  switch (d.event) {
    case 'onStateChange': estadoYT(d.info); break;
    case 'onError': errorYT(d.info); break;
    case 'initialDelivery':
    case 'infoDelivery': {
      const info = d.info || {};
      if (DEPURAR && typeof info.volume === 'number') depurar('volumen del reproductor', info.volume);
      // El reproductor vivo no manda onError cuando un video no se puede incrustar: lo dice en videoData.errorCode.
      const errorVideo = info.videoData?.errorCode;
      if (errorVideo && info.videoData.video_id === cancion()?.id && e.fase !== 'error') {
        recordarBloqueo(cancion().id);
        senalPerdida(`errorCode ${errorVideo}`);
        break;
      }
      if (typeof info.currentTime === 'number' && !e.arrastrandoBarra) { e.tiempo = info.currentTime; pintarTiempo(); }
      if (typeof info.duration === 'number' && info.duration > 0 && !cancion().envivo) { e.duracion = info.duration; }
      if (typeof info.playerState === 'number') estadoYT(info.playerState);
      break;
    }
    default: break;
  }
});

function estadoYT(estado) {
  if (estado === e.ultimoEstadoYT) return;
  e.ultimoEstadoYT = estado;
  depurar('estado', estado);
  if (estado === 1) {                         // reproduciendo
    clearTimeout(e.temporizadores.carga);
    e.fallosSeguidos = 0;
    olvidarBloqueo(cancion().id);
    aplicarVolumen();
    e.cambiandoVideo = false;
    e.fase = 'reproduciendo'; e.mensaje = '';
    pintar();
    if (e.explorar) programarExplorar();
  } else if (estado === 2) {                  // pausa
    if (e.cambiandoVideo) return;
    clearTimeout(e.temporizadores.carga);
    if (e.fase !== 'pausa') { e.fase = 'pausa'; e.mensaje = ''; pintar(); }
    clearTimeout(e.temporizadores.explorar);
  } else if (estado === 0) {                  // terminó
    alTerminar();
  }
}

function errorYT(codigo) {
  depurar('error', codigo);
  if (codigo === 153) return mostrarFalloGlobal('ERROR 153', 'YouTube no recibió la dirección de la página. Abre Estudio FM con un servidor local o desde GitHub Pages.');
  if (e.fase === 'error') return;   // ya se marcó por videoData.errorCode
  if ([100, 101, 150].includes(codigo)) recordarBloqueo(cancion().id);   // no incrustable o ya no existe: no cambia solo
  senalPerdida(`error ${codigo}`);
}

// Los videos que YouTube no deja incrustar se recuerdan 14 días para no volver a intentarlos.
const CLAVE_BLOQUEOS = 'estudiofm.bloqueados';
const VIGENCIA_BLOQUEO_MS = 14 * 24 * 3600 * 1000;
function leerBloqueos() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BLOQUEOS) || '{}'); } catch { return {}; }
}
function recordarBloqueo(id) {
  try { localStorage.setItem(CLAVE_BLOQUEOS, JSON.stringify({ ...leerBloqueos(), [id]: Date.now() })); } catch { /* sin almacenamiento */ }
}
function olvidarBloqueo(id) {
  const b = leerBloqueos();
  if (!(id in b)) return;
  delete b[id];
  try { localStorage.setItem(CLAVE_BLOQUEOS, JSON.stringify(b)); } catch { /* sin almacenamiento */ }
}
function cargarBloqueos() {
  const vigentes = Object.fromEntries(Object.entries(leerBloqueos()).filter(([, t]) => Date.now() - t < VIGENCIA_BLOQUEO_MS));
  try { localStorage.setItem(CLAVE_BLOQUEOS, JSON.stringify(vigentes)); } catch { /* sin almacenamiento */ }
  for (const id of Object.keys(vigentes)) e.fallidas.add(id);
}

function mostrarFalloGlobal(mensaje, detalle) {
  descargar();
  e.fase = 'error'; e.mensaje = mensaje;
  pintar();
  anunciar(detalle);
  console.warn(`[estudio-fm] ${detalle}`);
}

function senalPerdida(motivo) {
  depurar('sin señal', cancion()?.corto, motivo);
  e.cambiandoVideo = false;
  if (e.conectado) { clearTimeout(e.temporizadores.carga); e.idCarga++; }   // el reproductor sigue vivo: la cubierta tapa su pantalla de error
  else descargar();
  e.fallidas.add(cancion().id);
  e.fallosSeguidos++;
  e.fase = 'error'; e.mensaje = 'SIN SEÑAL';
  pintar();
  anunciar(`Sin señal en ${freqTexto(cancion())}`);
  const quedan = e.canciones.some((_, i) => !falla(i));
  if (!quedan) { e.mensaje = 'SIN SEÑAL EN NINGUNA ESTACIÓN'; pintar(); return; }
  cancelarSalto();
  e.temporizadores.saltar = setTimeout(() => {
    const i = e.explorar ? vecina(+1) : destinoSiguiente();
    if (i != null) sintonizar(i, { escaneo: e.explorar });
  }, PAUSA_ANTES_DE_SALTAR_MS);
}

function alTerminar() {
  clearTimeout(e.temporizadores.explorar);
  if (e.repetir) { cargar(e.actual); return; }
  if (e.explorar) { const i = vecina(+1); if (i != null) sintonizar(i, { escaneo: true }); return; }
  const i = destinoSiguiente();   // vecina, o una estación al azar si Buscar está encendido
  if (i != null) sintonizar(i);
}

// ── Play / pausa ────────────────────────────────────────────────────────────

function reproducir() {
  if (e.actual < 0) return;
  if (!e.iframe || e.fase === 'listo' || e.fase === 'error') { cancelarSalto(); cargar(e.actual); return; }
  ordenar('playVideo');
}
function pausar() {
  if (!e.iframe) return;
  detenerExplorar();
  ordenar('pauseVideo');
  e.fase = 'pausa'; e.mensaje = ''; pintar();
}
function alternar() { if (e.fase === 'reproduciendo' || (e.fase === 'cargando' && e.iframe)) pausar(); else reproducir(); }

// ── Explorar: 15 s de cada estación ─────────────────────────────────────────

function alternarExplorar() {
  if (e.explorar) { detenerExplorar(); pintar(); return; }
  e.explorar = true;
  const i = vecina(+1);
  if (i == null) { e.explorar = false; return; }
  sintonizar(i, { escaneo: true });
}

function programarExplorar() {
  clearTimeout(e.temporizadores.explorar);
  e.inicioExplorar = performance.now();
  e.temporizadores.explorar = setTimeout(() => {
    if (!e.explorar) return;
    const i = vecina(+1);
    if (i != null) sintonizar(i, { escaneo: true });
  }, SEGUNDOS_EXPLORAR * 1000);
}

function detenerExplorar() {
  if (!e.explorar) return;
  e.explorar = false;
  clearTimeout(e.temporizadores.explorar);
  pintar();
}

// ── Casetes: pletina, estante e insertar ────────────────────────────────────

const CLAVE_CASETE = 'estudiofm.casete';
function guardarCasete(nombre) { try { localStorage.setItem(CLAVE_CASETE, nombre); } catch { /* sin almacenamiento */ } }
function casetePrevio() { try { return localStorage.getItem(CLAVE_CASETE); } catch { return null; } }

// Pone un casete en la pletina: el dial pasa a ser el suyo, y Siguiente, Buscar y Explorar actúan solo sobre sus canciones.
function ponerCasete(indice, { animar = false } = {}) {
  detenerExplorar();
  cancelarSalto();
  e.puesto = indice;
  e.canciones = casetePuesto().canciones;
  e.bolsa = [];
  guardarCasete(casetePuesto().nombre);
  construirPletina();
  construirDial(animar);
}

// Estación donde queda un casete al insertarlo: la última que tuvo, o la primera con señal.
function estacionInicial(c) {
  if (c.ultima != null) return c.ultima;
  const viva = c.canciones.findIndex((s) => !e.fallidas.has(s.id));
  return Math.max(0, viva);
}

function pintarEstante() {
  el.nCasetes.textContent = String(e.casetes.length);
  el.escenario.innerHTML = e.casetes.map((c, i) =>
    `<div class="cas${i === e.puesto ? ' puesto' : ''}" data-i="${i}">${casete(c, i === e.puesto ? progresoCinta() : .35)}</div>`).join('');
  colocarCarrusel();
}

// Torre en bucle: el último casete asoma arriba del primero. La distancia es circular.
function colocarCarrusel() {
  const total = e.casetes.length;
  el.escenario.querySelectorAll('.cas').forEach((c) => {
    let d = (((Number(c.dataset.i) - e.foco) % total) + total) % total;
    if (d > total / 2) d -= total;
    if (total === 2 && d === -1) d = 1;   // con dos casetes, el otro va solo abajo
    const antes = Number(c.dataset.d ?? d), nuevo = Math.max(-2, Math.min(2, d));
    if (Math.abs(nuevo - antes) > 1) { c.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transition = ''; })); }
    c.dataset.d = nuevo;   // al dar la vuelta, el casete salta por detrás sin cruzar el centro
    c.classList.toggle('lejos', Math.abs(d) > 2);
  });

  const c = e.casetes[e.foco];
  el.jcNombre.textContent = c.nombre;
  el.jcSub.textContent = `LADO A · ${c.canciones.length} ESTACIONES · ${rangoTexto(c)} MHz`;
  const columnas = c.canciones.length > 24 ? 3 : 2;
  el.pistas.style.gridTemplateRows = `repeat(${Math.max(8, Math.ceil(c.canciones.length / columnas))}, 1fr)`;
  el.pistas.replaceChildren(...c.canciones.map((s, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pista';
    b.dataset.i = i;
    b.classList.toggle('on', e.foco === e.puesto && i === e.actual);
    b.classList.toggle('fallida', e.fallidas.has(s.id));
    b.innerHTML = '<span class="f"></span><span class="t"></span><span class="d"></span>';
    b.querySelector('.f').textContent = freqTexto(s);
    b.querySelector('.t').textContent = s.corto;   // el mismo nombre del dial; el título completo sale a la derecha al sintonizar
    b.querySelector('.d').textContent = duracionTexto(s);
    li.append(b);
    return li;
  }));
  el.btnInsertar.textContent = e.foco === e.puesto ? 'SEGUIR CON ESTE' : 'INSERTAR';
  anunciar(`Casete ${c.nombre}, ${c.canciones.length} estaciones${e.foco === e.puesto ? ', el que está puesto' : ''}`);
}

function abrirEstante() {
  if (e.insertando || e.abierto) return;
  e.abierto = true;
  e.foco = e.puesto;
  pintarEstante();
  el.estante.inert = false;
  el.centro.inert = true; el.lateral.inert = true;   // el video sigue sonando; solo se oculta
  el.pletina.classList.add('abierta');
  el.escena.classList.add('estante-abierto');
  el.btnEject.setAttribute('aria-expanded', 'true');
  el.btnInsertar.focus({ preventScroll: true });
}

function cerrarEstante() {
  if (!e.abierto) return;
  e.abierto = false;
  const devolverFoco = el.estante.contains(document.activeElement);
  el.estante.inert = true;
  el.centro.inert = false; el.lateral.inert = false;
  el.pletina.classList.remove('abierta');
  el.escena.classList.remove('estante-abierto');
  el.btnEject.setAttribute('aria-expanded', 'false');
  if (devolverFoco) el.btnEject.focus({ preventScroll: true });
}

function moverFoco(delta) {
  e.foco = (e.foco + delta + e.casetes.length) % e.casetes.length;
  colocarCarrusel();
}

// El casete elegido vuela del estante a la pletina y la tapa se cierra.
async function volarCasete(indice) {
  const origen = el.escenario.querySelector(`.cas[data-i="${indice}"]`);
  const destino = el.ranura;
  const a = origen.getBoundingClientRect(), b = destino.getBoundingClientRect();
  const clon = document.createElement('div');
  clon.className = 'clon';
  clon.innerHTML = casete(e.casetes[indice], .35);
  Object.assign(clon.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px` });
  document.body.append(clon);
  origen.classList.add('volando');
  destino.animate([{ transform: 'translateY(-16px)', opacity: 1 }, { transform: 'translateY(-70px)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
  el.escena.classList.remove('estante-abierto');
  const dx = b.left - a.left, dy = b.top - a.top - 16 * (b.width / 324), s = b.width / a.width;
  await clon.animate([
    { transform: 'translate(0,0) scale(1)', transformOrigin: '0 0' },
    { transform: `translate(${dx}px, ${dy - 40}px) scale(${s})`, transformOrigin: '0 0', offset: .7 },
    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, transformOrigin: '0 0' },
  ], { duration: 620, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' }).finished;
  return () => { destino.getAnimations().forEach((x) => x.cancel()); clon.remove(); };   // limpieza: se llama cuando ya está puesto el casete nuevo
}

// Insertar no reproduce solo: yo elijo qué tocar. Con una pista de la carátula sí: esa es una elección de qué tocar.
async function insertar(indice, pista) {
  if (e.insertando) return;
  e.insertando = true;
  try {
    const cambia = indice !== e.puesto;
    let limpiar = null;
    if (cambia && !reducido) limpiar = await volarCasete(indice);
    if (cambia) {
      ponerCasete(indice, { animar: true });
      sintonizar(estacionInicial(casetePuesto()), { reproducir: false, sinBarrido: true });
    }
    limpiar?.();
    cerrarEstante();
    if (pista != null) {
      const s = e.canciones[pista];
      if (s) { e.fallidas.delete(s.id); sintonizar(pista); }
    }
  } finally { e.insertando = false; }
}

// ── Volumen: perilla ────────────────────────────────────────────────────────

function leerVolumen() {
  try { const v = localStorage.getItem('estudiofm.volumen'); return v === null ? 80 : Math.min(100, Math.max(0, Number(v) || 0)); } catch { return 80; }
}

function pintarVolumen() {
  el.perillaGiro.setAttribute('transform', `rotate(${(-135 + 270 * (e.volumen / 100)).toFixed(1)} 100 100)`);
  el.perillaValor.textContent = `VOL ${e.volumen}`;
  el.perilla.setAttribute('aria-valuenow', String(e.volumen));
  el.perilla.setAttribute('aria-valuetext', `${e.volumen} %`);
}

function aplicarVolumen() { if (e.iframe && e.conectado) ordenarConArgs('setVolume', [e.volumen]); }

function ponerVolumen(v) {
  e.volumen = Math.min(100, Math.max(0, Math.round(v)));
  pintarVolumen();
  aplicarVolumen();
  try { localStorage.setItem('estudiofm.volumen', String(e.volumen)); } catch { /* sin almacenamiento */ }
}
const cambiarVolumen = (delta) => ponerVolumen(e.volumen + delta);

function construirPerilla() {
  const NS = 'http://www.w3.org/2000/svg';
  for (let k = 0; k <= 10; k++) {
    const a = ((-135 + 27 * k) * Math.PI) / 180;
    const r2 = 74 + (k % 5 === 0 ? 15 : 9);
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', (100 + 74 * Math.sin(a)).toFixed(1)); l.setAttribute('y1', (100 - 74 * Math.cos(a)).toFixed(1));
    l.setAttribute('x2', (100 + r2 * Math.sin(a)).toFixed(1)); l.setAttribute('y2', (100 - r2 * Math.cos(a)).toFixed(1));
    el.perillaMarcas.append(l);
  }
}

function enlazarPerilla() {
  let arrastre = null;
  el.perilla.addEventListener('pointerdown', (ev) => {
    arrastre = { y: ev.clientY, v: e.volumen };
    el.perilla.setPointerCapture(ev.pointerId); el.perilla.focus({ preventScroll: true }); ev.preventDefault();
  });
  el.perilla.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const escala = parseFloat(el.escena.style.getPropertyValue('--escala')) || 1;
    ponerVolumen(arrastre.v + ((arrastre.y - ev.clientY) / escala) * (100 / 160));   // 160 px de arrastre = todo el recorrido
  });
  el.perilla.addEventListener('pointerup', () => { arrastre = null; });
  el.perilla.addEventListener('pointercancel', () => { arrastre = null; });
  el.perilla.addEventListener('wheel', (ev) => { ev.preventDefault(); cambiarVolumen(ev.deltaY < 0 ? +5 : -5); }, { passive: false });
}

// ── Barra de posición: moverse por la canción ───────────────────────────────

function totalActual() { const c = cancion(); return c && !c.envivo ? (e.duracion ?? c.duracion) : null; }

function buscarEn(segundos) {
  const total = totalActual();
  if (!total || !e.iframe) return;
  const s = Math.min(Math.max(0, segundos), total - 1);
  e.tiempo = s;
  pintarTiempo(true);
  ordenarConArgs('seekTo', [s, true]);
}

function enlazarBarra() {
  const fraccion = (clientX) => { const r = el.barra.getBoundingClientRect(); return Math.min(Math.max((clientX - r.left) / r.width, 0), 1); };
  el.barra.addEventListener('pointerdown', (ev) => {
    if (!totalActual() || !e.iframe) return;
    e.arrastrandoBarra = true;
    el.barra.setPointerCapture(ev.pointerId); el.barra.focus({ preventScroll: true });
    e.tiempo = fraccion(ev.clientX) * totalActual(); pintarTiempo(true); ev.preventDefault();
  });
  el.barra.addEventListener('pointermove', (ev) => {
    if (!e.arrastrandoBarra) return;
    e.tiempo = fraccion(ev.clientX) * totalActual(); pintarTiempo(true);
  });
  el.barra.addEventListener('pointerup', (ev) => {
    if (!e.arrastrandoBarra) return;
    e.arrastrandoBarra = false;
    buscarEn(fraccion(ev.clientX) * totalActual());
  });
  el.barra.addEventListener('pointercancel', () => { e.arrastrandoBarra = false; });
  el.barra.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); buscarEn(e.tiempo - 10); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); buscarEn(e.tiempo + 10); }
  });
}

// ── Aguja arrastrable ───────────────────────────────────────────────────────

function enlazarAguja() {
  let arrastre = false;
  // La banda puede estar desplazada y la escena escalada: se mide sobre su rectángulo real y se devuelve en píxeles de la banda.
  const indiceEn = (clientX) => {
    const r = el.banda.getBoundingClientRect();
    const f = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    return { x: el.banda.offsetLeft + f * el.banda.offsetWidth, i: Math.min(n() - 1, Math.floor(f * n())) };
  };
  const vista = (i) => el.banda.querySelectorAll('.est').forEach((b, k) => b.classList.toggle('vista', k === i));

  el.aguja.addEventListener('pointerdown', (ev) => {
    arrastre = true; el.aguja.setPointerCapture(ev.pointerId); el.aguja.classList.add('arrastrando'); ev.preventDefault();
  });
  el.aguja.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const { x, i } = indiceEn(ev.clientX);
    el.aguja.style.left = `${x}px`;
    vista(i);
  });
  const soltar = (ev) => {
    if (!arrastre) return;
    arrastre = false; el.aguja.classList.remove('arrastrando'); vista(-1);
    const { i } = indiceEn(ev.clientX);
    if (i !== e.actual && !falla(i)) sintonizar(i); else moverAguja();
  };
  el.aguja.addEventListener('pointerup', soltar);
  el.aguja.addEventListener('pointercancel', () => { arrastre = false; el.aguja.classList.remove('arrastrando'); vista(-1); moverAguja(); });
}

// ── Dial desplazable: si el casete no cabe, se recorre arrastrando ──────────

function enlazarDial() {
  const caja = el.bandaCaja;
  let arrastre = null;
  let finArrastre = 0;
  caja.addEventListener('scroll', bordesDial);
  caja.addEventListener('pointerdown', (ev) => {
    if (!caja.classList.contains('desplazable') || ev.button !== 0 || ev.target.closest('.aguja')) return;   // la aguja tiene su propio arrastre
    arrastre = { x: ev.clientX, sl: caja.scrollLeft, movido: false, id: ev.pointerId };
  });
  caja.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) > 5) { arrastre.movido = true; caja.setPointerCapture(arrastre.id); caja.classList.add('arrastrando'); }
    if (arrastre.movido) caja.scrollLeft = arrastre.sl - dx / (parseFloat(el.escena.style.getPropertyValue('--escala')) || 1);
  });
  const soltar = () => {
    if (!arrastre) return;
    if (arrastre.movido) finArrastre = performance.now();
    arrastre = null;
    caja.classList.remove('arrastrando');
    bordesDial();
  };
  caja.addEventListener('pointerup', soltar);
  caja.addEventListener('pointercancel', soltar);
  caja.addEventListener('wheel', (ev) => {
    if (!caja.classList.contains('desplazable')) return;
    ev.preventDefault();
    caja.scrollLeft += ev.deltaY + ev.deltaX;
  }, { passive: false });
  // Un clic que cierra un arrastre no sintoniza.
  return () => performance.now() - finArrastre < 250;
}

// ── Eventos ─────────────────────────────────────────────────────────────────

function enlazar() {
  const fueArrastre = enlazarDial();
  el.btnPlay.addEventListener('click', alternar);
  el.pantalla.addEventListener('click', alternar);
  el.btnSiguiente.addEventListener('click', siguiente);
  el.btnAnterior.addEventListener('click', anterior);
  el.btnBuscar.addEventListener('click', () => { e.buscar = !e.buscar; e.bolsa = []; memoria.guardar('buscar', e.buscar); pintar(); });
  el.btnRepetir.addEventListener('click', () => { e.repetir = !e.repetir; memoria.guardar('repetir', e.repetir); pintar(); });
  el.btnExplorar.addEventListener('click', alternarExplorar);
  el.btnEject.addEventListener('click', () => (e.abierto ? cerrarEstante() : abrirEstante()));
  el.casAnt.addEventListener('click', () => moverFoco(-1));
  el.casSig.addEventListener('click', () => moverFoco(+1));
  el.btnInsertar.addEventListener('click', () => insertar(e.foco));
  el.escenario.addEventListener('click', (ev) => {
    const c = ev.target.closest('.cas'); if (!c) return;
    const i = Number(c.dataset.i);
    if (i === e.foco) insertar(i); else { e.foco = i; colocarCarrusel(); }
  });
  el.pistas.addEventListener('click', (ev) => { const p = ev.target.closest('.pista'); if (p) insertar(e.foco, Number(p.dataset.i)); });

  el.banda.addEventListener('click', (ev) => {
    if (fueArrastre()) return;
    const b = ev.target.closest('.est'); if (!b) return;
    const i = Number(b.dataset.i);
    cerrarEstante();   // tocar el dial con el estante abierto cancela el EJECT
    if (i === e.actual && e.iframe && e.fase !== 'error') { alternar(); return; }
    e.fallidas.delete(e.canciones[i].id);
    sintonizar(i);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (e.abierto) {   // con el estante abierto las flechas recorren la torre de casetes
      if (ev.key === 'Escape') cerrarEstante();
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); moverFoco(-1); }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); moverFoco(+1); }
      else if (ev.key === 'Enter' && !ev.target.closest('button')) insertar(e.foco);
      return;
    }
    const enBarra = ev.target === el.barra;   // con la barra enfocada, ← → mueven la canción y no la estación
    if (ev.key === 'ArrowLeft' && !enBarra) { ev.preventDefault(); sintonizarVecina(-1); }
    else if (ev.key === 'ArrowRight' && !enBarra) { ev.preventDefault(); sintonizarVecina(+1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); cambiarVolumen(+5); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); cambiarVolumen(-5); }
    else if (ev.key === ' ' && !ev.target.closest('button')) { ev.preventDefault(); alternar(); }
  });

  addEventListener('resize', ajustarEscala);
  // Al volver a la pestaña lo primero que debe verse es lo que suena: el estante no se queda abierto.
  document.addEventListener('visibilitychange', () => { if (document.hidden && e.abierto && !e.insertando) cerrarEstante(); });
  enlazarAguja();
  enlazarPerilla();
  enlazarBarra();

  if ('mediaSession' in navigator) {
    const acciones = { play: reproducir, pause: pausar, nexttrack: siguiente, previoustrack: anterior };
    for (const [nombre, fn] of Object.entries(acciones)) { try { navigator.mediaSession.setActionHandler(nombre, fn); } catch { /* acción no soportada */ } }
  }
}

// ── Inicio ──────────────────────────────────────────────────────────────────

async function iniciar() {
  ajustarEscala();
  enlazar();
  try {
    const r = await fetch('songs.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    e.casetes = armarCasetes(await r.json());
    if (!e.casetes.length) throw new Error('la lista está vacía');
  } catch (err) {
    el.titulo.textContent = 'No pude cargar la lista de canciones';
    el.canal.textContent = location.protocol === 'file:' ? 'Abre la página con un servidor local' : String(err.message);
    return;
  }
  cargarBloqueos();
  construirPerilla();
  pintarVolumen();
  ponerCasete(Math.max(0, e.casetes.findIndex((c) => c.nombre === casetePrevio())));   // el casete de la última vez, o el primero
  const vivas = e.canciones.map((_, i) => i).filter((i) => !falla(i));
  const inicial = vivas.length ? (e.buscar ? vivas[Math.floor(Math.random() * vivas.length)] : vivas[0]) : 0;
  sintonizar(inicial, { reproducir: false, sinBarrido: true });   // la aguja nace en su estación, sin barrido de arranque
  setInterval(() => { if (e.fase === 'reproduciendo') pintarTiempo(); }, 500);
}

// songs.json trae las canciones con su grupo (el casete) y su frecuencia dentro de él.
function armarCasetes(datos) {
  const porNombre = new Map();
  for (const c of datos.canciones) {
    const nombre = c.grupo ?? 'General';
    if (!porNombre.has(nombre)) porNombre.set(nombre, []);
    porNombre.get(nombre).push(c);
  }
  const orden = (datos.grupos ?? []).map((g) => g.nombre).filter((nombre) => porNombre.has(nombre));
  for (const nombre of porNombre.keys()) if (!orden.includes(nombre)) orden.push(nombre);
  return orden.map((nombre) => ({
    nombre, papel: papelDe(nombre), ultima: null,
    canciones: porNombre.get(nombre).sort((a, b) => a.freq - b.freq),
  }));
}

iniciar();
