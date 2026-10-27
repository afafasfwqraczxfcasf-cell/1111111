# Agenda sincronizada con Instagram

Cada página muestra su sección **Agenda** a partir de los últimos posts de Instagram del club. Cuando el club publica un flyer, la web lo muestra en ≤10 minutos, sin tocar código.

## Cómo funciona

```
Instagram (cuenta Business/Creator)
   │  Graph API  /me/media   (caption, imagen, permalink, fecha)
   ▼
/api/ig-events?club=<slug>        ← función serverless, cache CDN 10 min
   │  shared/ig-parse.js: detecta si el post es un evento, saca título y fecha
   │  ("31 de octubre", "VIE 31 OCT", "31/10", "este sábado", "hoy"…)
   ▼
shared/ig-events.js (navegador)   ← si la API falla, usa la agenda de respaldo de la página
   ▼
Sección Agenda de cada página
```

Instagram no envía webhooks cuando se publica un post en el feed, así que la API consulta cada vez que vence la cache (10 min). Es el método oficial y no infringe términos (nada de scraping).

## Configuración (una vez por club)

1. La cuenta de IG del club debe ser **Profesional** (Empresa o Creador). Se cambia en la app: Configuración → Tipo de cuenta.
2. En https://developers.facebook.com crea una app tipo **Empresa** → agrega el producto **Instagram** → *API setup with Instagram login*.
3. En "Generate access tokens" agrega la cuenta del club y genera el token (permiso `instagram_business_basic`). Ese token ya es de larga duración (60 días).
4. Despliega esta carpeta en Vercel (`vercel deploy`) y agrega las variables de entorno:

| Club | Variable |
|---|---|
| Tutaina | `IG_TOKEN_TUTAINA` |
| Medallo Club | `IG_TOKEN_MEDALLO` |
| La Logia | `IG_TOKEN_LA_LOGIA` |
| Cantina 70 | `IG_TOKEN_CANTINA_70` |

5. (Recomendado) Conecta Vercel KV / Upstash y define `CRON_SECRET`. El cron de `vercel.json` llama a `/api/ig-refresh` cada lunes y renueva los tokens antes de que venzan. Sin KV, el refresh igual extiende la vigencia del token actual.

Prueba: `https://tu-dominio/api/ig-events?club=tutaina` debe devolver JSON con `events`.

## Para que un post se detecte como evento

El caption debe incluir una fecha o una palabra clave (evento, fiesta, line up, en vivo, invitado, preventa, cover, reserva, esta noche…). Recomendación para el community manager:

```
EL LINAJE                     ← primera línea = título
Viernes 31 de octubre         ← fecha
Line up: …  Reservas por WhatsApp
#tutaina
```

Posts sin fecha ni palabra clave (fotos de la noche, agradecimientos) se ignoran.

## Si la página se sirve en otro dominio

Antes de `shared/ig-events.js`:
```html
<script>window.IG_EVENTS_ENDPOINT = "https://api.tu-dominio.com/api/ig-events";</script>
```

## Alternativa sin código
Si no quieren crear la app de Meta, servicios como Behold.so o LightWidget generan un feed JSON de IG; basta con apuntar `IG_EVENTS_ENDPOINT` a un pequeño adaptador que devuelva el mismo formato `{events:[…]}`.
