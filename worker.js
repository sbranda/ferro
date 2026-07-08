/**
 * Worker de Cloudflare — scraper para la app de Ferro Carril Oeste.
 *
 * Expone:
 *   GET /fixture   -> { proximos: [...], resultados: [...], actualizado: "ISO date" }
 *                      (scrapea la página del equipo en Promiedos)
 *   GET /standings -> { grupo: "A", equipos: [...], actualizado: "ISO date" }
 *                      (scrapea la tabla de posiciones en ESPN, porque la de
 *                      Promiedos se carga con JavaScript y no se puede leer
 *                      con un fetch simple del lado del servidor)
 *
 * Cachea cada resultado 30 minutos en el edge de Cloudflare para no golpear
 * las fuentes en cada visita, y siempre devuelve CORS abierto para que la PWA
 * (servida desde cualquier dominio) pueda consumirlas con fetch().
 *
 * Cómo desplegarlo (gratis, sin tarjeta):
 *  1. Entrá a https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 *  2. Pegá este archivo entero reemplazando el código de ejemplo
 *  3. Deploy. Te da una URL tipo https://TU-WORKER.TU-SUBDOMINIO.workers.dev
 *  4. Probalo en el navegador: .../fixture y .../standings
 *  5. Pegá esa URL base en index.html, en la constante WORKER_URL
 */

const TEAM_URL = "https://www.promiedos.com.ar/team/ferro-carril-oeste/hcbi";
const STANDINGS_URL = "https://www.espn.com.ar/futbol/posiciones/_/liga/arg.2";
const CACHE_TTL_SECONDS = 1800; // 30 minutos

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/fixture") {
      return withEdgeCache(url, request, ctx, scrapePromiedos);
    }
    if (url.pathname === "/standings") {
      return withEdgeCache(url, request, ctx, scrapeStandings);
    }
    return json({ error: "Ruta no encontrada. Usá /fixture o /standings" }, 404);
  },
};

// Envuelve un scraper con caché de edge + manejo de errores, para no repetir código.
async function withEdgeCache(url, request, ctx, scraperFn) {
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const data = await scraperFn();
    const response = json(data, 200);
    response.headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return json({ error: "No se pudo obtener los datos", detail: String(err) }, 502);
  }
}

// ---------- FIXTURE Y RESULTADOS (Promiedos) ----------

async function scrapePromiedos() {
  const res = await fetch(TEAM_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FerroPWA/1.0)" },
  });
  if (!res.ok) throw new Error(`Promiedos respondió ${res.status}`);
  const html = await res.text();

  const proximos = extractMatchTable(html, "PRÓXIMOS PARTIDOS", "Resultados");
  const resultados = extractMatchTable(html, ">Resultados<", "PLANTEL");

  return {
    proximos,
    resultados,
    actualizado: new Date().toISOString(),
  };
}

// Busca el <table> que aparece entre dos marcadores de texto y devuelve sus filas parseadas.
function extractMatchTable(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return [];
  const endIdx = html.indexOf(endMarker, startIdx);
  const chunk = html.slice(startIdx, endIdx === -1 ? undefined : endIdx);

  const tableMatch = chunk.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return [];

  const rows = [...tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const parsed = [];

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
      dedupe(stripTags(c[1]))
    );
    if (cells.length < 3) continue; // saltea filas de encabezado

    const [dia, cond, rivalRaw, extra] = cells;
    if (!dia || !/^\d{1,2}\/\d{1,2}$/.test(dia.trim())) continue;

    parsed.push({
      dia: dia.trim(),
      condicion: cond.trim(), // "L" o "V"
      rival: rivalRaw.trim(),
      dato: (extra || "").trim(), // hora (próximos) o resultado (jugados)
    });
  }
  return parsed;
}

// ---------- TABLA DE POSICIONES (ESPN) ----------
// La tabla de Promiedos se hidrata con JavaScript del lado del cliente, así que
// un fetch de servidor solo trae el esqueleto vacío. La de ESPN sí viene
// completa en el HTML inicial, así que la usamos para esto.

async function scrapeStandings() {
  const res = await fetch(STANDINGS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FerroPWA/1.0)" },
  });
  if (!res.ok) throw new Error(`ESPN respondió ${res.status}`);
  const html = await res.text();

  // 1) Nombres de equipo de la Zona A: la sección entre ">Grupo A<" y ">Grupo B<"
  const groupAStart = html.indexOf(">Grupo A<");
  const groupBStart = html.indexOf(">Grupo B<", groupAStart === -1 ? 0 : groupAStart);
  if (groupAStart === -1) throw new Error("No se encontró la sección Grupo A");
  const namesChunk = html.slice(groupAStart, groupBStart === -1 ? undefined : groupBStart);

  const teamLinkRegex = /futbol\/equipo\/_\/id\/(\d+)\/[a-z0-9\-]+"[^>]*>([^<]+)<\/a>/gi;
  const namesById = new Map(); // conserva el orden de primera aparición = orden de la tabla
  let m;
  while ((m = teamLinkRegex.exec(namesChunk)) !== null) {
    const id = m[1];
    const rawText = m[2].trim();
    // Cada equipo aparece repetido (ícono, "ABR (Nombre)", "Nombre" limpio).
    // Nos quedamos con la variante más larga sin el prefijo de 2-5 letras + paréntesis.
    const clean = rawText.replace(/^[A-ZÁÉÍÓÚÑ0-9]{2,6}\s*\(/, "").replace(/\)$/, "");
    const prev = namesById.get(id);
    if (!prev || clean.length > prev.length) namesById.set(id, clean);
  }
  const teamIds = [...namesById.keys()];
  const teamNames = [...namesById.values()];
  if (teamNames.length < 10) throw new Error("No se pudieron leer los nombres de equipo");

  // 2) Estadísticas de la Zona A: el primer bloque de <td> después del primer
  // encabezado "ordenar/gamesplayed" (que marca la columna "J"), hasta que
  // reaparece el mismo encabezado para la Zona B.
  const marker = "ordenar/gamesplayed";
  const statsStart = html.indexOf(marker);
  if (statsStart === -1) throw new Error("No se encontró la tabla de estadísticas");
  const nextMarker = html.indexOf(marker, statsStart + marker.length);
  const statsChunk = html.slice(statsStart, nextMarker === -1 ? statsStart + 40000 : nextMarker);

  const cellRegex = /<td[^>]*>\s*([+-]?\d+)\s*<\/td>/gi;
  const numbers = [...statsChunk.matchAll(cellRegex)].map((c) => c[1]);

  const equipos = [];
  const colsPerRow = 8; // J, G, E, P, GF, GC, DIF, PTS
  const rowCount = Math.min(teamNames.length, Math.floor(numbers.length / colsPerRow));

  for (let i = 0; i < rowCount; i++) {
    const slice = numbers.slice(i * colsPerRow, i * colsPerRow + colsPerRow);
    const [jugados, ganados, empatados, perdidos, gf, gc, dif, pts] = slice.map(Number);
    equipos.push({
      pos: i + 1,
      equipoId: teamIds[i],
      equipo: teamNames[i],
      jugados, ganados, empatados, perdidos, gf, gc, dif, pts,
    });
  }
  if (!equipos.length) throw new Error("No se pudieron cruzar nombres y estadísticas");

  return {
    grupo: "A",
    equipos,
    actualizado: new Date().toISOString(),
  };
}

// ---------- HELPERS ----------

function stripTags(str) {
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Promiedos suele repetir el nombre del equipo dos veces en la misma celda
// (ej. "Estudiantes  Estudiantes"). Esto lo colapsa a una sola aparición.
function dedupe(str) {
  const s = str.trim();
  const half = s.length / 2;
  if (Number.isInteger(half)) {
    const a = s.slice(0, half).trim();
    const b = s.slice(half).trim();
    if (a && a === b) return a;
  }
  const words = s.split(" ");
  if (words.length % 2 === 0) {
    const mid = words.length / 2;
    const a = words.slice(0, mid).join(" ");
    const b = words.slice(mid).join(" ");
    if (a === b) return a;
  }
  return s;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
