const CACHE_NAME = 'ferro-pwa-v12';

// App shell: mismo origen que la PWA.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
];

// Recursos de otros dominios que hacen falta para que Historia, Identidad,
// Estadio y Planteles se vean completos (con fotos) sin conexión.
// Se piden con mode:'no-cors' porque son cross-origin y no tienen headers CORS;
// eso los guarda como "respuesta opaca", que sirve igual para mostrarlos en <img>.
const CROSS_ORIGIN_ASSETS = [
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo_del_Club_Ferro_Carril_Oeste.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Estadioferrocarriloeste.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_Ferro_Carril_Oeste_platea.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_de_Ferro_desde_el_puente.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_Ferro_Carril_Oeste_tribuna_Mart%C3%ADn_de_Gainza_1.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Cricketers_ferro_1912.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Club_ferro_carril_oeste_sede_social_1930.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Ferro_escudo_figurita_1958.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Bandera_de_Ferro_Carril_Oeste.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20C.A.S.M.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Col%C3%B3n.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Club%20Deportivo%20Moron%20Escudo%20de%201962.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Los%20Andes.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Deportivo%20Godoy%20Cruz%20Antonio%20Tomba.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20All%20Boys.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Club%20Atl%C3%A9tico%20San%20Telmo%20(logo).svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Defensores%20de%20Belgrano%20Logo.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atletico%20Mitre.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Club-Atletico-Atlanta.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20de%20Quilmes%20Atl%C3%A9tico%20Club.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Chacarita%20Juniors.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Nueva%20Chicago.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Club-Atl%C3%A9tico-Temperley.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Colegiales%20arg%20logo.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Patronato%20de%20la%20Juventud%20Cat%C3%B3lica.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Almirante%20Brown.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atl%C3%A9tico%20Estudiantes%20de%20Buenos%20Aires.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Central%20Norte%20de%20Salta.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Chaco%20For%20Ever-ARG.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Almagro.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Social%20y%20Deportivo%20Madryn.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Racing%20de%20C%C3%B3rdoba.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Logotipo%20Oficial%20y%20Escudo%20del%20Club%20Atl%C3%A9tico%20de%20Rafaela.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20San%20Martin%20de%20Tucum%C3%A1n.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20de%20San%20Martin%20de%20San%20Juan.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Midland%20escudo.png',
  'https://es.wikipedia.org/wiki/Special:FilePath/Club%20acassuso%20logo.png',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Deportivo%20Maipu.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Club%20Atletico%20G%C3%BCemes%20de%20Santiago%20del%20Estero.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Gimnasia%20y%20Esgrima%20Jujuy.svg',
  'https://es.wikipedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Gimnasia%20y%20Tiro%20de%20Salta.svg',
  'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap',
];

// Precachea un recurso sin que un solo error tumbe la instalación entera.
async function precacheOne(cache, url) {
  try {
    const isSameOrigin = url.startsWith('./') || url.startsWith(self.location.origin);
    const request = new Request(url, { mode: isSameOrigin ? 'same-origin' : 'no-cors' });
    const response = await fetch(request);
    await cache.put(url, response);
  } catch (err) {
    console.warn('[sw] No se pudo precachear (se intentará de nuevo al usarse online):', url, err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const all = [...APP_SHELL, ...CROSS_ORIGIN_ASSETS];
      await Promise.all(all.map((url) => precacheOne(cache, url)));
    })
  );
  self.skipWaiting();
});

// Limpia caches de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// No cachear las llamadas al Worker de fixture/resultados: esos datos tienen
// que pedirse siempre a la red para no mostrar resultados viejos como si fueran
// actuales. Si falla la red, index.html ya tiene su propio respaldo (RESULTS_FALLBACK).
function isLiveDataRequest(url) {
  return url.pathname === '/fixture' || url.hostname.endsWith('workers.dev');
}

// Estrategia para todo lo demás: cache-first (instantáneo y funciona offline),
// y en segundo plano actualiza la caché por si cambió algo.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (isLiveDataRequest(url)) return; // dejá pasar directo a la red

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchAndUpdate = fetch(event.request)
        .then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchAndUpdate;
    })
  );
});
