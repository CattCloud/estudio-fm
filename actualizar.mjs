#!/usr/bin/env node
// Estudio FM · actualizar.mjs
//
// Lee la carpeta de marcadores "Musica de estudio" de Chrome, revisa cada video
// en YouTube (¿existe y permite incrustación?, ¿cuánto dura?) y regenera
// songs.json. Después hace commit y push de songs.json si esta carpeta es un
// repositorio git con remoto.
//
// Reglas de songs.json:
//   - Cada subcarpeta de "Musica de estudio" es un casete (grupo): el nombre de
//     la carpeta es el nombre del casete. Los videos sueltos van al casete
//     "General". Un mismo video solo puede estar en un casete (gana el primero).
//   - Cada casete tiene su propio dial: la frecuencia de cada canción es
//     88.1 + paso × n, con paso 1.2. Si el casete tiene más canciones de las que
//     caben hasta 108.0, el paso baja (23 canciones → 0.9, de 88.1 a 107.9).
//   - Las canciones que ya existían conservan su frecuencia; las nuevas toman la
//     más baja que esté libre en su casete. Solo si el paso tiene que bajar se
//     reparte de nuevo el casete entero (respetando el orden que ya tenía).
//   - "corto" es el nombre que se imprime en el dial. Se genera solo para las
//     canciones nuevas y se puede editar a mano: el script nunca lo pisa.
//   - "grupos" guarda el orden de los casetes y el paso de cada uno.
//
// Uso:  node actualizar.mjs [--sin-git]      (o doble clic en actualizar.cmd)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const DIR = dirname(fileURLToPath(import.meta.url));
const ARCHIVO = join(DIR, 'songs.json');
const CARPETA = 'musica de estudio';
const FREQ_INICIO = 881;   // décimas de MHz: 88.1
const FREQ_PASO = 12;      // 1.2 MHz
const FREQ_MAXIMA = 1080;  // 108.0, tope de la banda FM
const GRUPO_SUELTAS = 'General';
const sinGit = process.argv.includes('--sin-git');

function fallar(mensaje) {
  console.error(`\nERROR: ${mensaje}`);
  process.exit(1);
}

const sinAcentos = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
// NFKC convierte las letras "decorativas" de YouTube (𝐘𝐨𝐮 → You) en texto normal.
const limpiar = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const aFreq = (decimas) => decimas / 10;
const aDecimas = (freq) => Math.round(freq * 10);

// ── 1. Marcadores de Chrome ────────────────────────────────────────────────

function archivosDeMarcadores() {
  const base = process.env.CHROME_USER_DATA
    || join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
  if (!existsSync(base)) fallar(`No encuentro los datos de Chrome en ${base}`);
  const archivos = [];
  for (const perfil of readdirSync(base)) {
    if (perfil !== 'Default' && !/^Profile \d+$/.test(perfil)) continue;
    for (const nombre of ['Bookmarks', 'AccountBookmarks']) {
      const ruta = join(base, perfil, nombre);
      if (existsSync(ruta)) archivos.push(ruta);
    }
  }
  return archivos;
}

function carpetasConNombre(nodo, encontradas = []) {
  if (nodo && Array.isArray(nodo.children)) {
    if (nodo.type === 'folder' && sinAcentos(nodo.name) === CARPETA) encontradas.push(nodo);
    for (const hijo of nodo.children) carpetasConNombre(hijo, encontradas);
  }
  return encontradas;
}

// Devuelve Map(nombre del casete → URLs en el orden de los marcadores).
// "General" (los videos sueltos) va siempre primero.
function gruposDe(carpeta) {
  const grupos = new Map();
  const recorrer = (nodo, nombre) => {
    for (const hijo of nodo.children ?? []) {
      if (hijo.type === 'url') {
        if (!grupos.has(nombre)) grupos.set(nombre, []);
        grupos.get(nombre).push(hijo.url);
      } else if (hijo.type === 'folder') {
        recorrer(hijo, limpiar(hijo.name) || nombre);
      }
    }
  };
  recorrer(carpeta, GRUPO_SUELTAS);
  if (!grupos.has(GRUPO_SUELTAS)) return grupos;
  return new Map([[GRUPO_SUELTAS, grupos.get(GRUPO_SUELTAS)], ...[...grupos].filter(([n]) => n !== GRUPO_SUELTAS)]);
}

function leerMarcadores() {
  let mejor = null;
  for (const ruta of archivosDeMarcadores()) {
    let json;
    try { json = JSON.parse(readFileSync(ruta, 'utf8')); } catch { continue; }
    const raices = Object.values(json.roots ?? {}).filter((r) => r && typeof r === 'object');
    const carpetas = raices.flatMap((r) => carpetasConNombre(r));
    if (!carpetas.length) continue;
    const fecha = statSync(ruta).mtimeMs;
    if (!mejor || fecha > mejor.fecha) mejor = { ruta, fecha, carpeta: carpetas[0] };
  }
  if (!mejor) {
    fallar('No encontré la carpeta "Musica de estudio" en los marcadores de Chrome. '
      + 'Puede estar en cualquier lugar (barra o "Otros marcadores"), pero debe llamarse así.');
  }
  console.log(`Marcadores: ${mejor.ruta}`);
  return gruposDe(mejor.carpeta);
}

function idDeVideo(texto) {
  try {
    const u = new URL(texto);
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else id = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// ── 2. Revisión en YouTube ─────────────────────────────────────────────────

async function revisar(id) {
  const url = 'https://www.youtube.com/oembed?format=json&url='
    + encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (r.status === 200) {
      const j = await r.json();
      return { estado: 'ok', titulo: limpiar(j.title), canal: limpiar(j.author_name) };
    }
    if (r.status === 401 || r.status === 403) return { estado: 'sin-incrustacion' };
    if (r.status === 404) return { estado: 'no-disponible' };
    return { estado: 'error', detalle: `HTTP ${r.status}` };
  } catch (e) {
    return { estado: 'error', detalle: e.message };
  }
}

async function medir(id) {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'Accept-Language': 'es' },
      signal: AbortSignal.timeout(20000),
    });
    const html = await r.text();
    const segundos = html.match(/"lengthSeconds":"(\d+)"/);
    if (!segundos) return null;
    const s = Number(segundos[1]);
    const envivo = /"isLive":true/.test(html) || s === 0;
    return { duracion: envivo ? null : s, envivo };
  } catch {
    return null;
  }
}

function cortoDe(titulo) {
  let t = titulo.split(/\s+[-–—|·]\s+|\s*\/\/\s*|\s+[(\[]/)[0].trim();
  if (t.length > 26) t = `${t.slice(0, 25).replace(/\s+\S*$/, '')}…`;
  return t;
}

const formato = (s) => {
  if (s == null) return 'en vivo';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}` : `${m}:${String(seg).padStart(2, '0')}`;
};

// ── 3. Construir songs.json ────────────────────────────────────────────────

// Paso entre estaciones (en décimas de MHz) para un casete de n canciones:
// 1.2 si caben hasta 108.0; si no, el mayor paso que las haga caber.
function pasoPara(n) {
  if (n <= 1) return FREQ_PASO;
  return Math.max(1, Math.min(FREQ_PASO, Math.floor((FREQ_MAXIMA - FREQ_INICIO) / (n - 1))));
}

// Campos en orden fijo, para que songs.json quede siempre igual de legible.
const ficha = (c, grupo) => ({
  id: c.id, grupo, freq: c.freq, titulo: c.titulo, corto: c.corto,
  canal: c.canal, duracion: c.duracion, envivo: c.envivo,
});

// Reparte las frecuencias de un casete. `items` viene en el orden de los
// marcadores; los que ya tenían frecuencia en este casete traen `freq`.
// Devuelve el paso usado (décimas) y modifica `items` poniéndoles `freq`.
function asignarFrecuencias(nombre, items, pasoPrevio, avisos) {
  const paso = Math.min(pasoPrevio ?? FREQ_PASO, pasoPara(items.length));
  const conFreq = items.filter((i) => i.freq != null);
  const enRejilla = conFreq.every((i) => {
    const d = aDecimas(i.freq);
    return d >= FREQ_INICIO && d <= FREQ_MAXIMA && (d - FREQ_INICIO) % paso === 0;
  });

  const ocupadas = new Set();
  if (enRejilla) {
    for (const i of conFreq) ocupadas.add((aDecimas(i.freq) - FREQ_INICIO) / paso);
  } else {
    // El paso bajó: se reparte de nuevo el casete, respetando su orden.
    conFreq.sort((a, b) => a.freq - b.freq).forEach((i, k) => { i.freq = aFreq(FREQ_INICIO + paso * k); ocupadas.add(k); });
    avisos.push(`"${nombre}": el paso baja a ${aFreq(paso)} y sus estaciones se reparten de nuevo.`);
  }
  for (const i of items.filter((x) => x.freq == null)) {
    let k = 0;
    while (ocupadas.has(k)) k++;
    ocupadas.add(k);
    const decimas = FREQ_INICIO + paso * k;
    if (decimas > FREQ_MAXIMA) avisos.push(`${i.id}: la frecuencia ${aFreq(decimas)} pasa de 108.0; el casete "${nombre}" tiene más canciones que estaciones.`);
    i.freq = aFreq(decimas);
  }
  return paso;
}

async function main() {
  const previo = existsSync(ARCHIVO) ? JSON.parse(readFileSync(ARCHIVO, 'utf8')) : { canciones: [] };
  const previas = new Map(previo.canciones.map((c) => [c.id, { ...c, grupo: c.grupo ?? GRUPO_SUELTAS }]));
  const pasosPrevios = new Map((previo.grupos ?? []).map((g) => [g.nombre, aDecimas(g.paso)]));

  const marcadores = leerMarcadores();   // Map(casete → URLs)
  const total = [...marcadores.values()].reduce((s, u) => s + u.length, 0);
  console.log(`${total} marcadores en ${marcadores.size} casete(s): ${[...marcadores].map(([n, u]) => `${n} (${u.length})`).join(', ')}. Revisando...\n`);

  const porGrupo = new Map();   // casete → canciones en el orden de los marcadores
  const omitidas = [];          // YouTube no permite usarlas
  const movidas = [];
  const avisos = [];
  const vistos = new Map();     // id → casete donde ya se contó

  for (const [grupo, urls] of marcadores) {
    for (const id of urls.map(idDeVideo).filter(Boolean)) {
      if (vistos.has(id)) {
        if (vistos.get(id) !== grupo) avisos.push(`${id}: está en "${vistos.get(id)}" y en "${grupo}"; se queda en "${vistos.get(id)}".`);
        continue;
      }
      vistos.set(id, grupo);

      const r = await revisar(id);
      const previa = previas.get(id);
      const mismoGrupo = previa?.grupo === grupo;
      let cancion = null;
      if (r.estado === 'ok') {
        if (previa) cancion = { ...previa, titulo: r.titulo, canal: r.canal };
        else {
          const m = await medir(id);
          if (!m) { avisos.push(`${id}: no pude leer la duración; se intentará de nuevo la próxima vez.`); continue; }
          cancion = { id, titulo: r.titulo, canal: r.canal, corto: cortoDe(r.titulo), ...m };
        }
      } else if (r.estado === 'error') {
        if (previa) { cancion = previa; avisos.push(`${id} (${previa.corto}): no pude revisarla (${r.detalle}); se deja como estaba.`); }
        else { avisos.push(`${id}: no pude revisarla (${r.detalle}); se intentará de nuevo la próxima vez.`); continue; }
      } else {
        omitidas.push({ id, motivo: r.estado === 'sin-incrustacion' ? 'no permite incrustación' : 'ya no está disponible' });
        continue;
      }
      // Si la canción cambió de casete, su frecuencia vieja ya no vale.
      if (previa && !mismoGrupo) { cancion = { ...cancion, freq: null }; movidas.push(`${cancion.corto}: de "${previa.grupo}" a "${grupo}"`); }
      if (!porGrupo.has(grupo)) porGrupo.set(grupo, []);
      porGrupo.get(grupo).push(cancion);
    }
  }

  // Frecuencias, casete por casete.
  const grupos = [];
  const canciones = [];
  for (const [nombre, items] of porGrupo) {
    const paso = asignarFrecuencias(nombre, items, pasosPrevios.get(nombre), avisos);
    grupos.push({ nombre, paso: aFreq(paso) });
    canciones.push(...items.sort((a, b) => a.freq - b.freq).map((c) => ficha(c, nombre)));
  }

  const idsFinales = new Set(canciones.map((c) => c.id));
  const quitadas = [...previas.values()].filter((p) => !idsFinales.has(p.id));
  const agregadas = canciones.filter((c) => !previas.has(c.id));

  // Informe
  for (const g of grupos) {
    const delGrupo = canciones.filter((c) => c.grupo === g.nombre);
    console.log(`  ${g.nombre} · ${delGrupo.length} estaciones · paso ${g.paso}`);
    for (const c of delGrupo.filter((x) => !previas.has(x.id))) console.log(`    + ${String(c.freq.toFixed(1)).padStart(5)}  ${c.corto}  (${formato(c.duracion)})`);
  }
  for (const c of quitadas) console.log(`  - ${String(c.freq.toFixed(1)).padStart(5)}  ${c.corto}  (ya no está en los marcadores o no se puede reproducir)`);
  for (const m of movidas) console.log(`  ~ movida ${m}`);
  for (const o of omitidas) console.log(`  ! omitida ${o.id}: ${o.motivo}`);
  for (const a of avisos) console.log(`  ? ${a}`);

  const antes = JSON.stringify({ grupos: previo.grupos ?? [], canciones: previo.canciones });
  const cambio = JSON.stringify({ grupos, canciones }) !== antes;
  if (!cambio && existsSync(ARCHIVO)) {
    console.log(`\nSin cambios: ${canciones.length} canciones en ${grupos.length} casete(s).`);
  } else {
    writeFileSync(ARCHIVO, `${JSON.stringify({ actualizado: new Date().toISOString(), grupos, canciones }, null, 2)}\n`);
    console.log(`\nsongs.json actualizado: ${canciones.length} canciones en ${grupos.length} casete(s) (+${agregadas.length} / -${quitadas.length}).`);
  }
  if (cambio) subir(agregadas.length, quitadas.length);
}

// ── 4. Git ─────────────────────────────────────────────────────────────────

const git = (...a) => execFileSync('git', a, { cwd: DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function subir(mas, menos) {
  if (sinGit) { console.log('Git: omitido (--sin-git).'); return; }
  let raiz;
  try { raiz = git('rev-parse', '--show-toplevel'); }
  catch { console.log('Git: esta carpeta aún no es un repositorio; no se sube nada.'); return; }
  if (resolve(raiz).toLowerCase() !== resolve(DIR).toLowerCase()) {
    console.log('Git: esta carpeta no es la raíz de su propio repositorio; no se sube nada.');
    return;
  }
  try {
    git('add', 'songs.json');
    if (!git('status', '--porcelain', '--', 'songs.json')) { console.log('Git: sin cambios que subir.'); return; }
    git('commit', '-m', `Actualiza la lista de canciones (+${mas} / -${menos})`, '--', 'songs.json');
    git('push');
    console.log('Git: subido. GitHub Pages tarda uno o dos minutos en mostrar el cambio.');
  } catch (e) {
    const detalle = String(e.stderr || e.message).trim().split('\n').slice(-3).join(' | ');
    console.error(`Git: no se pudo subir (${detalle}).`);
    process.exitCode = 1;
  }
}

main().catch((e) => fallar(e.stack || e.message));
