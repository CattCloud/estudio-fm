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
  btnLista: $('btn-lista'), lista: $('lista'), filas: $('filas'),
  perilla: $('perilla'), perillaGiro: $('perilla-giro'), perillaMarcas: $('perilla-marcas'), perillaValor: $('perilla-valor'),
  banda: $('banda'), aguja: $('aguja'), estadoSr: $('estado-sr'),
};

// ── Estado ──────────────────────────────────────────────────────────────────

const memoria = {
  leer(clave, defecto) { try { const v = localStorage.getItem(`estudiofm.${clave}`); return v === null ? defecto : v === '1'; } catch { return defecto; } },
  guardar(clave, valor) { try { localStorage.setItem(`estudiofm.${clave}`, valor ? '1' : '0'); } catch { /* sin almacenamiento: no pasa nada */ } },
};

const e = {
  canciones: [],
  actual: -1,
  fase: 'listo',            // listo | cargando | reproduciendo | pausa | error
  mensaje: '',              // detalle para fase "error" o "pausa"
  buscar: memoria.leer('buscar', true),
  repetir: memoria.leer('repetir', false),
  explorar: false,
  fallidas: new Set(),
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

function construirDial() {
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
}

function construirLista() {
  el.filas.replaceChildren(...e.canciones.map((c, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fila';
    b.dataset.i = i;
    b.innerHTML = '<span class="f"></span><span><span class="t"></span><span class="c"></span></span><span class="d"></span>';
    b.querySelector('.f').textContent = freqTexto(c);
    b.querySelector('.t').textContent = c.titulo;
    b.querySelector('.c').textContent = c.canal;
    b.querySelector('.d').textContent = c.envivo ? 'EN VIVO' : formato(c.duracion);
    li.append(b);
    return li;
  }));
  // El panel reparte las filas en columnas de 8; si hay más, crecen más columnas.
}

const posAguja = (i) => `${((i + .5) / n()) * 100}%`;

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
    el.aguja.style.left = posAguja(e.actual);
    el.banda.querySelectorAll('.est').forEach((b, i) => {
      b.classList.toggle('on', i === e.actual);
      b.classList.toggle('fallida', e.fallidas.has(i));
      if (i === e.actual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    el.filas.querySelectorAll('.fila').forEach((b, i) => {
      b.classList.toggle('on', i === e.actual);
      b.classList.toggle('fallida', e.fallidas.has(i));
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
    if (!e.fallidas.has(j) && j !== e.actual) return j;
  }
  return null;
}

function deLaBolsa() {
  const sirve = (i) => i !== e.actual && !e.fallidas.has(i);
  e.bolsa = e.bolsa.filter(sirve);
  if (!e.bolsa.length) e.bolsa = barajar(e.canciones.map((_, i) => i).filter(sirve));
  return e.bolsa.length ? e.bolsa.pop() : null;
}

function destinoSiguiente() { return e.buscar ? deLaBolsa() : vecina(+1); }

function cancelarSalto() { clearTimeout(e.temporizadores.saltar); e.temporizadores.saltar = 0; }

function sintonizar(i, { reproducir = true, escaneo = false } = {}) {
  if (i == null || i < 0 || i >= n()) return;
  if (DEPURAR) depurar('sintonizar', freqTexto(e.canciones[i]), { escaneo, reproducir, explorar: e.explorar }, new Error().stack.split('\n')[2]?.trim());
  cancelarSalto();
  if (!escaneo) detenerExplorar();
  e.actual = i;
  e.tiempo = 0;
  e.duracion = null;
  e.mensaje = '';
  ponerMetadatos();
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
  e.canciones.forEach((c, i) => { if (vigentes[c.id]) e.fallidas.add(i); });
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
  e.fallidas.add(e.actual);
  e.fallosSeguidos++;
  e.fase = 'error'; e.mensaje = 'SIN SEÑAL';
  pintar();
  anunciar(`Sin señal en ${freqTexto(cancion())}`);
  const quedan = e.canciones.some((_, i) => !e.fallidas.has(i));
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

// ── Panel Lista ─────────────────────────────────────────────────────────────

function abrirLista(abrir) {
  el.lista.hidden = !abrir;
  el.escena.classList.toggle('panel-abierto', abrir);
  document.querySelector('.cuerpo').inert = abrir;
  el.btnLista.setAttribute('aria-expanded', String(abrir));
  if (abrir) (el.filas.querySelector('.fila.on') ?? el.filas.querySelector('.fila'))?.focus();
  else el.btnLista.focus({ preventScroll: true });
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
  const indiceEn = (clientX) => {
    const r = el.banda.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    return { x: x / r.width, i: Math.min(n() - 1, Math.floor((x / r.width) * n())) };
  };
  const vista = (i) => el.banda.querySelectorAll('.est').forEach((b, k) => b.classList.toggle('vista', k === i));

  el.aguja.addEventListener('pointerdown', (ev) => {
    arrastre = true; el.aguja.setPointerCapture(ev.pointerId); el.aguja.classList.add('arrastrando'); ev.preventDefault();
  });
  el.aguja.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const { x, i } = indiceEn(ev.clientX);
    el.aguja.style.left = `${x * 100}%`;
    vista(i);
  });
  const soltar = (ev) => {
    if (!arrastre) return;
    arrastre = false; el.aguja.classList.remove('arrastrando'); vista(-1);
    const { i } = indiceEn(ev.clientX);
    el.aguja.style.left = posAguja(i);
    if (i !== e.actual && !e.fallidas.has(i)) sintonizar(i); else el.aguja.style.left = posAguja(e.actual);
  };
  el.aguja.addEventListener('pointerup', soltar);
  el.aguja.addEventListener('pointercancel', () => { arrastre = false; el.aguja.classList.remove('arrastrando'); vista(-1); el.aguja.style.left = posAguja(e.actual); });
}

// ── Eventos ─────────────────────────────────────────────────────────────────

function enlazar() {
  el.btnPlay.addEventListener('click', alternar);
  el.pantalla.addEventListener('click', alternar);
  el.btnSiguiente.addEventListener('click', siguiente);
  el.btnAnterior.addEventListener('click', anterior);
  el.btnBuscar.addEventListener('click', () => { e.buscar = !e.buscar; e.bolsa = []; memoria.guardar('buscar', e.buscar); pintar(); });
  el.btnRepetir.addEventListener('click', () => { e.repetir = !e.repetir; memoria.guardar('repetir', e.repetir); pintar(); });
  el.btnExplorar.addEventListener('click', alternarExplorar);
  el.btnLista.addEventListener('click', () => abrirLista(el.lista.hidden));

  el.banda.addEventListener('click', (ev) => {
    const b = ev.target.closest('.est'); if (!b) return;
    const i = Number(b.dataset.i);
    if (i === e.actual && e.iframe && e.fase !== 'error') { alternar(); return; }
    e.fallidas.delete(i);
    sintonizar(i);
  });
  el.filas.addEventListener('click', (ev) => {
    const b = ev.target.closest('.fila'); if (!b) return;
    e.fallidas.delete(Number(b.dataset.i));
    sintonizar(Number(b.dataset.i));
    abrirLista(false);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const enBarra = ev.target === el.barra;   // con la barra enfocada, ← → mueven la canción y no la estación
    if (ev.key === 'ArrowLeft' && !enBarra) { ev.preventDefault(); sintonizarVecina(-1); }
    else if (ev.key === 'ArrowRight' && !enBarra) { ev.preventDefault(); sintonizarVecina(+1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); cambiarVolumen(+5); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); cambiarVolumen(-5); }
    else if (ev.key === ' ' && !ev.target.closest('button')) { ev.preventDefault(); alternar(); }
    else if (ev.key === 'Escape' && !el.lista.hidden) abrirLista(false);
  });

  addEventListener('resize', ajustarEscala);
  // Al volver a la pestaña lo primero que debe verse es lo que suena: la Lista no se queda abierta.
  document.addEventListener('visibilitychange', () => { if (document.hidden && !el.lista.hidden) abrirLista(false); });
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
    e.canciones = (await r.json()).canciones.slice().sort((a, b) => a.freq - b.freq);
    if (!e.canciones.length) throw new Error('la lista está vacía');
  } catch (err) {
    el.titulo.textContent = 'No pude cargar la lista de canciones';
    el.canal.textContent = location.protocol === 'file:' ? 'Abre la página con un servidor local' : String(err.message);
    return;
  }
  cargarBloqueos();
  construirPerilla();
  pintarVolumen();
  construirDial();
  construirLista();
  el.cuenta.textContent = String(n());
  const vivas = e.canciones.map((_, i) => i).filter((i) => !e.fallidas.has(i));
  const inicial = vivas.length ? (e.buscar ? vivas[Math.floor(Math.random() * vivas.length)] : vivas[0]) : 0;
  el.aguja.style.transition = 'none';           // la aguja nace en su estación, sin barrido de arranque
  sintonizar(inicial, { reproducir: false });
  el.aguja.getBoundingClientRect();
  el.aguja.style.transition = '';
  setInterval(() => { if (e.fase === 'reproduciendo') pintarTiempo(); }, 500);
}

iniciar();
