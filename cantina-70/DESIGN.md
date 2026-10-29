# Cantina 70 — DESIGN.md (ronda "partir del sitio oficial")

Cantina 70 no tiene web: su sitio oficial es el Instagram @cantina70.med. Esta página es una extensión del feed: negro, dorado plano y los flyers como protagonistas en una rejilla 4:5, igual que el grid de IG. Sin conceptos nuevos ni efectos.

Fuente de marca: `ref/cantina-ig/grid1–5.png` y `img/*.webp`. Los colores se muestrearon con PIL sobre los titulares dorados de Contentoso, Aquelarre, Adicta al Dolor, Aguanile y Viernes de Banda, y sobre las esquinas negras de los flyers.

## Color (`:root`)
| Token | Hex | Origen | Uso |
|---|---|---|---|
| `--bg` | #0B0B0A | mediana de las esquinas de los flyers | fondo de la página, header y letterbox de los flyers |
| `--surface` | #141311 | bg +4 % | tarjetas de la semana, caja de cumpleaños |
| `--gold` | #D9C087 | dorado medio de los titulares (p40–60) | logotipo, títulos, botones, etiquetas |
| `--gold-hi` | #FCEDB5 | brillo del dorado (p85–97) | hover, foco, énfasis |
| `--gold-lo` | #52411F | sombra del dorado (p5–20) | filetes entre secciones, bordes |
| `--ink` | #F1EADA | blanco cálido de "NO COVER CON RESERVA" | texto |
| `--muted` | #A09C91 | ink al 65 % sobre bg | texto secundario |

Dorado siempre plano: sin degradados metálicos, sin glow y sin sombras. El brillo lo ponen los flyers.

## Tipografía
- **Cinzel** 700 (con 600 y 800 cargadas): logotipo "CANTINA 70", h1, h2, nombres de noche y fechas grandes. Es la romana de mayúsculas tipo Trajan de los flyers. Las minúsculas salen como versalitas, como en la marca.
- **Montserrat** 400/500/600: párrafos en minúscula normal (17px/1.65). Las etiquetas, la navegación y los botones van en mayúsculas de 12–13px con tracking de .14–.18em, como "NO COVER CON RESERVA".
- Escala: h1 `clamp(44px,6vw,88px)`, h2 `clamp(30px,3.6vw,48px)`, h3 22–26px.
- Detalle literal de los flyers: el filete dorado junto a las etiquetas (`.rule`), igual que "—— NO COVER ——".

## Espacio y forma
- El contenedor mide 1240px. Gutter `clamp(16px,4vw,40px)` (el mínimo de 16px respeta las safe areas). Secciones con padding `clamp(64px,8vw,112px)` y un filete `--gold-lo` entre cada una.
- Flyers en `aspect-ratio:4/5` con `object-fit:contain` sobre negro de marca, así nunca se recorta texto. Fotos en 4:5 con `cover` y `object-position:50% 20%` para no cortar caras.
- Las rejillas tipo IG tienen un gap de 6px: noches pasadas en 3 columnas (2 en móvil) y fotos en 4 columnas (2 en móvil).
- Radio 0 en imágenes y 2px en botones. Las zonas táctiles miden ≥44px.

## Movimiento
- Aparición al hacer scroll: opacity + translateY de 12px en 400ms, una sola vez (IntersectionObserver).
- Hover de color en botones y enlaces, opacidad .82 en los flyers del archivo, y un borde que aparece en el header al hacer scroll.
- `prefers-reduced-motion` quita todo lo anterior. No hay carruseles, autoplay, parallax ni preloaders.

## Estructura
1. **Header** sticky: logotipo, 5 enlaces y Reservar. En ≤980px el menú pasa a hamburguesa con un panel a pantalla completa (Esc cierra y el foco queda atrapado dentro).
2. **Hero**: etiqueta, h1 "Cantina 70" y una línea de horario. Después, el flyer de la próxima noche (el primer evento futuro de IGEvents o del fallback) con su nombre, fechas, nota, botón Reservar (WhatsApp con la noche prellenada) y enlace Ver en Instagram (permalink). Si no hay eventos próximos, se muestra el próximo Viernes de Banda (`viernes-banda-todos`).
3. **Agenda**: "Próximas fechas" muestra los demás eventos futuros (se oculta si no hay). "Cada semana" tiene tres tarjetas: Viernes de Banda, Sábado temático y Domingo de Despecho. Cada una lleva la fecha calculada de la próxima noche, el último flyer de ese tipo, las condiciones literales, un aviso si esa noche hay una fiesta especial y un botón Reservar para ese día. Debajo va una nota sobre el jueves.
4. **Noches pasadas**: flyers anteriores que no aparecen en la semana. Se cortan a un múltiplo de 3 y enlazan a su permalink.
5. **Así es Cantina 70**: 8 fotos reales.
6. **Mesas y cumpleaños**: flyer "Celebramos tu cumple", el copy literal "Te daremos" y dos botones de WhatsApp.
7. **Cómo llegar**: dirección con enlace a Maps, horario y pagos.
8. **Footer**: datos de contacto, Instagram, WhatsApp y el aviso legal de alcohol.

## No tocar
`FALLBACK_ARRAY`, `<script src="../shared/ig-events.js">` y `IGEvents.load({club:"cantina-70", fallback})` con sus permalinks. También el JSON-LD: el NightClub estático y los Event estáticos se reemplazan por los dinámicos cuando cargan los eventos. Un solo h1, canonical e `index,follow`. El `SITE_URL` es provisional (ver TODO en el head).
