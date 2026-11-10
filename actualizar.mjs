#!/usr/bin/env node
// Estudio FM · actualizar.mjs
//
// Lee la carpeta de marcadores "Musica de estudio" de Chrome, revisa cada video
// en YouTube (¿existe y permite incrustación?, ¿cuánto dura?) y regenera
// songs.json. Después hace commit y push de songs.json si esta carpeta es un
// repositorio git con remoto.
//
// Reglas de songs.json:
//   - Cada canción tiene una frecuencia fija (88.1 + 1.2 × n). Las que ya
//     existían la conservan; las nuevas toman la más baja que esté libre.
//   - "corto" es el nombre que se imprime en el dial. Se genera solo para las
//     canciones nuevas y se puede editar a mano: el script nunca lo pisa.
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

function urlsDe(nodo, urls = []) {
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === 'url') urls.push(hijo.url);
    else urlsDe(hijo, urls);
  }
  return urls;
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
  return urlsDe(mejor.carpeta);
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

async function main() {
  const previas = existsSync(ARCHIVO)
    ? new Map(JSON.parse(readFileSync(ARCHIVO, 'utf8')).canciones.map((c) => [c.id, c]))
    : new Map();

  const ids = [...new Set(leerMarcadores().map(idDeVideo).filter(Boolean))];
  console.log(`${ids.length} videos de YouTube en la carpeta. Revisando...\n`);

  const conservadas = [];   // ya estaban y siguen: conservan su frecuencia
  const nuevas = [];        // hay que asignarles frecuencia
  const omitidas = [];      // YouTube no permite usarlas
  const avisos = [];

  for (const id of ids) {
    const r = await revisar(id);
    const previa = previas.get(id);
    if (r.estado === 'ok') {
      if (previa) conservadas.push({ ...previa, titulo: r.titulo, canal: r.canal });
      else {
        const m = await medir(id);
        if (!m) { avisos.push(`${id}: no pude leer la duración; se intentará de nuevo la próxima vez.`); continue; }
        nuevas.push({ id, titulo: r.titulo, canal: r.canal, ...m });
      }
    } else if (r.estado === 'error') {
      if (previa) { conservadas.push(previa); avisos.push(`${id} (${previa.corto}): no pude revisarla (${r.detalle}); se deja como estaba.`); }
      else avisos.push(`${id}: no pude revisarla (${r.detalle}); se intentará de nuevo la próxima vez.`);
    } else {
      omitidas.push({ id, motivo: r.estado === 'sin-incrustacion' ? 'no permite incrustación' : 'ya no está disponible' });
    }
  }

  // Frecuencias: las nuevas toman la más baja que esté libre.
  const usadas = new Set(conservadas.map((c) => aDecimas(c.freq)));
  const agregadas = [];
  for (const n of nuevas) {
    let decimas = FREQ_INICIO;
    while (usadas.has(decimas)) decimas += FREQ_PASO;
    usadas.add(decimas);
    if (decimas > FREQ_MAXIMA) avisos.push(`${n.id}: la frecuencia ${aFreq(decimas)} pasa de 108.0; hay más canciones que estaciones en la banda.`);
    agregadas.push({ id: n.id, freq: aFreq(decimas), titulo: n.titulo, corto: cortoDe(n.titulo), canal: n.canal, duracion: n.duracion, envivo: n.envivo });
  }

  const canciones = [...conservadas, ...agregadas].sort((a, b) => a.freq - b.freq);
  const idsFinales = new Set(canciones.map((c) => c.id));
  const quitadas = [...previas.values()].filter((p) => !idsFinales.has(p.id));

  // Informe
  for (const c of agregadas) console.log(`  + ${String(c.freq.toFixed(1)).padStart(5)}  ${c.corto}  (${formato(c.duracion)})`);
  for (const c of quitadas) console.log(`  - ${String(c.freq.toFixed(1)).padStart(5)}  ${c.corto}  (ya no está en los marcadores o no se puede reproducir)`);
  for (const o of omitidas) console.log(`  ! omitida ${o.id}: ${o.motivo}`);
  for (const a of avisos) console.log(`  ? ${a}`);

  const cambio = JSON.stringify(canciones) !== JSON.stringify([...previas.values()].sort((a, b) => a.freq - b.freq));
  if (!cambio && existsSync(ARCHIVO)) {
    console.log(`\nSin cambios: ${canciones.length} canciones.`);
  } else {
    writeFileSync(ARCHIVO, `${JSON.stringify({ actualizado: new Date().toISOString(), canciones }, null, 2)}\n`);
    console.log(`\nsongs.json actualizado: ${canciones.length} canciones (+${agregadas.length} / -${quitadas.length}).`);
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
