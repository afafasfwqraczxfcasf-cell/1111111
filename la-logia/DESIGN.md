# La Logia — DESIGN.md

Modo: Persuade (la visita decide y escribe por WhatsApp). Mundo: una casa de alta perfumería que de noche abre su trastienda. Terciopelo marrón casi negro, luz de lámpara cobre, una sola pieza de oro estampado por pantalla. El misterio sale de lo que se oculta (luz baja, recortes, un sello), no de símbolos repetidos.

## Color (tokens en `:root`)
| Token | Hex | Uso |
|---|---|---|
| `--void` | #0e0a08 | Suelo principal |
| `--crypt` | #1a1210 | Campo alterno de sección (un paso de tono, sin borde) |
| `--velvet` | #241915 | Placas de respaldo de flyer, menú móvil |
| `--ember` | #643828 | Banda del lema, luz de lámpara (solo como luz o campo entero) |
| `--brass` | #c29765 | Botón principal |
| `--gold` | #d6aa70 | Fechas, sello, enlace activo, foco |
| `--bone` | #f4efe5 | Texto y titulares; campo del decreto (sección invertida) |
| `--ash` | #b2a594 | Texto secundario (≥ 7:1 sobre `--void`) |
| `--ink-on-bone` | #1a1210 | Texto sobre `--bone` |

### Reglas del oro (< 6 % de pantalla)
Solo: botón principal, fechas de la agenda, el sello (logo o su respaldo trazado), subrayado de enlace/hover y foco. Nunca en titulares ni en bordes de tarjeta. Sin glow, sin texto degradado. El ojo en triángulo aparece una sola vez (estampado en seco detrás del hero); el resto de la identidad lo llevan los logos oficiales.

## Tipografía
- Display: **Bodoni Moda** 400/500, roman, `opsz` alto, tracking −0.025em, line-height .92. Nunca una palabra en itálica dentro de un titular romano.
- Texto: **Jost** 400/500 (geometría déco de perfumería), 17px/1.65, medida ≤ 62ch.
- Datos (horas, fechas): Jost 500 con `tabular-nums`.
- Escala (5 tamaños): 14 · 17 · 26 · clamp(42→84) h2 · clamp(52→112) h1/firma.
- Sin eyebrows, sin mayúsculas espaciadas, sin numeración 01/02, sin cadenas con punto medio.

## Retícula
12 columnas, máx. 1280px, gutter `max(16px, env(safe-area-inset-*))` y 4vw en escritorio. Bordes izquierdos reutilizados: col 1 (titulares), col 7 (texto/datos). Secciones 112–160px de aire. Cada sección cambia de composición: vitrina (hero), banda de lema, índice (agenda), díptico (zonas), decreto centrado sobre papel (código, el único momento centrado), vitrina asimétrica (galería), lista con titular fijo (FAQ), firma telefónica (reserva).

## Forma
Radio 0 en imágenes, botones y placas. Única excepción: el sello, circular. Sin sombras en reposo salvo la sombra con desplazamiento de los flyers del hero (profundidad física). Líneas de 1px solo en datos tabulares (noches pasadas, horario, preguntas). Flyers 4:5.

## Imagen
Flyers oficiales sin lavar. Respaldo sin foto: placa `--velvet` con luz cobre desde arriba, marco doble de etiqueta de perfume (filete fino + filete grueso), título del evento en Bodoni y fecha en oro. Es una composición, no una caja vacía.

## Motion
- Un momento orquestado: la entrada del hero (≈1.5 s). La luz de lámpara se enciende (opacidad), el titular se revela línea a línea con clip-path, los flyers asientan desde translateY(24px) escala .97 con 90 ms de desfase, el sello se estampa (scale 1.08 → 1, opacidad) al final. Curvas: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`.
- Continuo: marquee del lema (linear, 60 s), parallax de scroll suave en los flyers (≤ 40px).
- Microinteracciones 160–240 ms: botón `:active` scale .97, zoom 1.03 de flyer y subrayado que crece, solo con `(hover:hover) and (pointer:fine)`.
- `prefers-reduced-motion`: sin transformaciones ni marquee; quedan fundidos de opacidad.

## Superficies del navegador
`::selection` oro/negro, `caret-color` oro, `scrollbar-color` cobre sobre negro, foco 2px oro offset 3px, `text-underline-offset` 0.22em.
