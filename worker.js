/**
 * Worker de Cloudflare — scraper de Promiedos para Ferro Carril Oeste.
 *
 * Expone:
 *   GET /fixture  -> { proximos: [...], resultados: [...], actualizado: "ISO date" }
 *
 * Cachea el resultado 30 minutos en el edge de Cloudflare para no golpear
 * Promiedos en cada visita, y siempre devuelve CORS abierto para que la PWA
 * (servida desde cualquier dominio) pueda consumirlo con fetch().
 *
 * Cómo desplegarlo (gratis, sin tarjeta):
 *  1. Entrá a https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 *  2. Pegá este archivo entero reemplazando el código de ejemplo
 *  3. Deploy. Te da una URL tipo https://TU-WORKER.TU-SUBDOMINIO.workers.dev
 *  4. Probala en el navegador: https://TU-WORKER.workers.dev/fixture
 *  5. Pegá esa URL en index.html, en la constante WORKER_URL
 */

const TEAM_URL = "https://www.promiedos.com.ar/team/ferro-carril-oeste/hcbi";
const CACHE_TTL_SECONDS = 1800; // 30 minutos

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname !== "/fixture") {
      return json({ error: "Ruta no encontrada. Usá /fixture" }, 404);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);
    if (response) return response;

    try {
      const data = await scrapePromiedos();
      response = json(data, 200);
      response.headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      return json({ error: "No se pudo obtener el fixture", detail: String(err) }, 502);
    }
  },
};

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
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      dedupe(stripTags(m[1]))
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
