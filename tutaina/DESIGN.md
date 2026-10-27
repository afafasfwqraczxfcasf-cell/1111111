# Tutaina Eje Cafetero — DESIGN.md

Modo: Persuade (la visita decide y reserva). Mundo: la noche de un club grande; la fotografía y los flyers oficiales llevan el color, la interfaz se retira.

## Color (tokens en `:root`)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | #050506 | Suelo principal (70–90 % de la página) |
| `--surface` | #0b0b0d | Campo alterno por sección (un paso de tono, borde duro, sin degradado) |
| `--plate` | #141416 | Respaldo de imagen sin foto (+ grano finísimo) |
| `--ink` | #f2f0ea | Texto y titulares (blanco roto, nunca #fff) |
| `--muted` | #a29d93 | Texto secundario, gris cálido (≥ 4.5:1 sobre `--bg`) |
| `--faint` | #6d6962 | Solo texto de placeholder en placas, nunca texto de lectura |
| `--accent` | #fee003 | Único acento |
| `--accent-ink` | #050506 | Texto sobre amarillo |

### Reglas del amarillo (< 5 % de cualquier pantalla)
Solo en: (1) el botón principal "Reservar mesa", (2) la fecha del próximo evento, (3) el subrayado de enlace activo/hover, (4) el estado activo (filtro de año, foco). Nunca en titulares, iconos, bordes de tarjeta ni fondos de sección. Sin glow, sin sombras de color, sin degradados en texto.

## Tipografía
- Display: **Archivo** variable. Marca/firma (hero, footer): `wdth 125`, `wght 800`, mayúsculas, tracking −0.02em. Titulares h2: `wdth 75` (condensada), `wght 700`, mayúsculas, line-height .92, máx. 6rem. h3: Archivo `wdth 100`, `wght 600`, caja normal.
- Texto: **Hanken Grotesk** 400/500/600, 17px/1.6, medida ≤ 66ch.
- Datos: **IBM Plex Mono** 400/500 solo para fechas y horas (dato, no etiqueta), `font-variant-numeric: tabular-nums`.
- Escala (5 tamaños lejanos): 14 · 17 · 24 · clamp(44→96) · clamp(64→200 firma).
- Sin etiquetas en mayúsculas espaciadas, sin eyebrows, sin numeración 01/02.

## Retícula
12 columnas, máx. 1320px, gutter `max(16px, env(safe-area-inset-*))` / 4vw en escritorio, gap 24px. Dos o tres bordes izquierdos reutilizados: col 1 (titulares), col 6/7 (texto). Secciones: 120–160px de aire vertical; el cambio de campo de color separa, no las líneas. Líneas de 1px solo dentro de datos tabulares (horario, barra de info del hero, lista de razones).

## Forma
Radio 0 en todo (imágenes, botones, placas). Sin sombras en reposo. Proporción de flyer 4:5.

## Imagen
Flyers y fotos oficiales sin lavar con color. Texto sobre foto solo con scrim neutro negro (30–60 %). Respaldo sin foto: placa `--plate` con grano, título en Archivo abajo-izquierda y fecha en mono.

## Hero (v2)
Asimétrico: firma + h1 + CTA en cols 1–6; a la derecha, composición de 4 flyers oficiales (próximo evento al frente, 3 recientes detrás) con rotación −8°…+5°, escala y brillo según profundidad (1 / .7 / .45 / .3), sombras con desplazamiento (nunca halo). Luz: foco cálido radial (rgba(255,228,176,.13)) y un haz suave desde arriba, ambos respiran. Banda de datos + ticker mono de próximas fechas (eventos + jue–sáb siguientes, pausa al hover). Fotos de fondo al 55 % de opacidad.

## Motion
- Un solo momento orquestado: entrada del hero — foto asienta (1.06→1), firma con clip-path (.1s), texto y CTA suben (.4–.6s), flyers se reparten en stagger (.3/.45/.6/.75s, 900ms), banda de datos (.9s). Curva `cubic-bezier(0.23,1,0.32,1)`.
- Parallax de la composición: ratón (solo puntero fino) ±22px × profundidad y scroll −0.12 × profundidad, rAF con amortiguación; desactivado con reduced-motion.
- Luz contenida: grano que respira (opacidad, 6s) y un haz fino vertical casi imperceptible. Nada figurativo.
- Microinteracciones 200–300ms: zoom de imagen 1.03 y subrayado que crece, solo con `(hover:hover) and (pointer:fine)`.
- Nav: transparente sobre el hero, sólida (`--bg`) al hacer scroll, transición 250ms.
- `prefers-reduced-motion`: se quitan transformaciones y bucles; quedan cambios de opacidad.

## Superficies del navegador
`::selection` amarillo/negro, `caret-color` amarillo, `scrollbar-color` gris cálido, foco 2px amarillo con offset 3px.
