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

## Notas

- El escudo y las fotos del estadio se cargan desde Wikimedia Commons; necesitás conexión la primera vez para que el service worker las guarde en caché.
- Los datos de plantel y resultados están fijos en el código (no se actualizan solos). Si querés que se actualicen automáticamente, hay que conectar una fuente de datos en vivo.
