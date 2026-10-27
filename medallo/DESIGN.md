# Medallo Club — DESIGN.md

Modo: Persuade (la visita decide y reserva por WhatsApp). Mundo: la pared de afiches de Provenza bajo una sola luz azul. El hero (wordmark oficial + afiches oficiales superpuestos + luz azul) es la idea; el resto de la página se retira y deja hablar a los flyers, las fotos y los datos.

## Color (tokens en `:root`, solo la paleta de marca)
| Token | Hex | Rol |
|---|---|---|
| `--bg` | #00030D | Suelo (75–85 % de la página) |
| `--surface` | #050A24 | Campo alterno: un paso de tono, borde duro, sin degradado |
| `--action` | #2448FF | **Único azul de acción** (sombra del logo). Texto encima: `--ink` (5.7:1) |
| `--field` | #0543BE | Campo de color de una sola sección (Cómo llegar) y la boleta de palco. Nunca botón |
| `--light` | #00B2FF | Solo luz: haz del hero, halo del cierre. Nunca texto, borde ni botón |
| `--muted` | #8FB4FF | Texto secundario sobre `--bg`/`--surface` (≥ 9:1) |
| `--ink` | #F5F8FF | Texto y titulares; campo invertido de Cumpleaños |

Reglas del azul de acción (< 5 % de cada pantalla): botón primario "Reservar mesa" / "Reservar mi cumpleaños", marca "Hoy" en la semana, filtro activo del FAQ, subrayado de enlace en hover. Nada más. Sin glow, sin sombras de color, sin texto con contorno, sin degradados en texto. Excepción de datos: estrellas de Google en #FBBC04 (`--star`).

## Tipografía (las del sitio oficial)
- Display: **Anton** 400, mayúsculas, tracking 0.005em, line-height .9. Fallback métrico `Anton Fallback` (Impact / DejaVu Sans Condensed Bold con `size-adjust`).
- Texto: **Barlow Semi Condensed** 400/500/600/700, 18px/1.55, medida ≤ 62ch.
- Escala de 5 pasos: 15 · 18 · 24 · clamp(44→88) h2 · clamp(64→150) firma.
- Sin eyebrows, sin etiquetas en mayúsculas espaciadas, sin mono, sin numeración 01/02.

## Retícula
12 columnas, máx. 1360px, margen `max(16px, safe-area)` / 32px desde 900px, gap 24px. Dos bordes izquierdos: col 1 (titulares) y col 7 (texto en filas partidas). Secciones a 136px (escritorio) / 84px (móvil). Las secciones se separan por cambio de campo (`--bg` → `--surface` → `--ink` → `--field`), no por líneas. Líneas de 1px solo dentro de datos tabulares (boletas, horario, FAQ).

## Forma y profundidad
Radio 0 en imágenes, botones y placas; los avatares de reseña son círculos. Sombra solo en lo que flota sobre otra cosa (afiches del hero, paquete de cumpleaños): `0 24px 48px -12px rgb(0 0 0 / .6)`. Proporción de flyer 4:5 en toda la página.

## Imagen
Flyers y fotos oficiales sin lavar. Respaldo sin foto: placa `--surface` con grano finísimo y un solo haz de luz, título en Anton abajo-izquierda, fecha en texto. Logos oficiales siempre en `<img>` (sombra azul, íconos, Blessd) con wordmark tipográfico de respaldo.

## Motion
- Un momento orquestado: entrada del hero (900ms, `cubic-bezier(0.23,1,0.32,1)`): la luz se enciende, el logo aparece con desenfoque→nítido, el h1 se revela con clip-path línea por línea, los afiches se asientan de su giro inicial con 70ms de escalonado. Todo visible sin JS.
- Ambiente: la luz respira (opacidad, 9s) y la franja de noches se desplaza lento (lineal, 60s). Profundidad: los afiches siguen al puntero ±6px por capa, solo con `(hover:hover) and (pointer:fine)`.
- Microinteracciones ≤ 250ms: botón `scale(.97)` al presionar, zoom de imagen 1.03 en hover de puntero fino, acordeón 200ms.
- `prefers-reduced-motion`: sin transformaciones ni bucles; quedan cambios de opacidad.

## Superficies del navegador
`::selection` acción/ink, `caret-color` acción, `scrollbar-color` muted sobre bg, foco 2px `--muted` con offset 3px, `font-variant-numeric: tabular-nums` en horas y precios.
