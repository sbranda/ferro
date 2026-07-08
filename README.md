# Ferro Carril Oeste — PWA

Estos tres archivos forman una Progressive Web App instalable:

- `index.html` — la app completa (HTML/CSS/JS, sin dependencias de build)
- `manifest.json` — nombre, ícono y colores para "agregar a pantalla de inicio"
- `sw.js` — service worker que cachea la app para que funcione offline

## Importante: necesita HTTPS

Los navegadores **no activan el service worker ni el botón de instalación si abrís `index.html` directamente desde tu computadora** (protocolo `file://`). Necesitás servir estos archivos desde un servidor con HTTPS (o `localhost` para probar).

## Cómo probarlo rápido en tu computadora

Con Python instalado, parado en la carpeta de estos 3 archivos:

```bash
python3 -m http.server 8000
```

Después abrí `http://localhost:8000` en Chrome o Safari desde tu celular (mismo Wi-Fi) o en tu computadora.

## Cómo publicarlo gratis (con HTTPS real)

Cualquiera de estas opciones sirve, subiendo los 3 archivos tal cual:

- **Netlify Drop**: arrastrás la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: `vercel` desde la carpeta (requiere cuenta)
- **GitHub Pages**: subís los archivos a un repo y activás Pages

Una vez publicado, entrá desde el celular con Chrome (Android) o Safari (iPhone) y usá "Agregar a pantalla de inicio" — o esperá el cartel de instalación que aparece solo.

## Datos en vivo (fixture y resultados)

`worker.js` es un Cloudflare Worker que scrapea la página de Promiedos del club
y devuelve JSON. Sin esto, la app funciona igual pero con los resultados fijos
que están en el código.

1. Entrá a [dash.cloudflare.com](https://dash.cloudflare.com) (cuenta gratis, sin tarjeta)
2. Workers & Pages → Create → Create Worker
3. Pegá todo el contenido de `worker.js` reemplazando el código de ejemplo
4. Deploy — te da una URL tipo `https://ferro-fixture.tu-nombre.workers.dev`
5. Probala en el navegador entrando a esa URL + `/fixture` (debería devolver JSON)
6. En `index.html`, buscá la línea `const WORKER_URL = "..."` y poné tu URL ahí
7. Volvé a subir `index.html` a donde tengas publicada la PWA

El Worker cachea la respuesta 30 minutos de su lado, así que no golpea Promiedos
en cada visita. Si en algún momento Promiedos cambia el diseño de su página,
el scraper puede dejar de funcionar — en ese caso la app simplemente vuelve a
mostrar los datos fijos (no se rompe nada, solo deja de actualizarse sola).



## Notas

- El service worker ahora precachea el escudo y las 3 fotos del estadio apenas se instala la PWA (no espera a que las visites), así Historia, Identidad, Estadio y Planteles se ven completos sin conexión desde el principio.
- Las tipografías de Google Fonts se intentan precachear también, pero si tu conexión es lenta esa parte puede fallar sin romper nada — en ese caso el texto se ve con la tipografía de reemplazo del sistema hasta la próxima vez que haya conexión.
- Sin desplegar el Worker, los datos de resultados quedan fijos en el código. Con el Worker desplegado, el fixture y los resultados se actualizan solos.
- El plantel (nombres, edades) sí queda fijo — no vale la pena scrapearlo tan seguido.
