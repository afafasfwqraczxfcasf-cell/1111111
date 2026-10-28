# Cantina 70 — DESIGN.md

Modo: Persuade (quien entra quiere saber qué hay este fin de semana y reservar por WhatsApp). Los flyers y las fotos de Instagram son el diseño de la marca; la web los enmarca en negro y se retira.

## Color (tokens en `:root`)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | #070707 | Suelo de la página |
| `--surface` | #100f0d | Campo de la sección Fotos, caja de cumpleaños, respaldo de imagen |
| `--ink` | #ECE8E1 | Texto y titulares |
| `--muted` | #A39D92 | Texto secundario |
| `--gold` | #C9A35F | Wordmark, botón principal, fechas de noches próximas, días de la semana |
| `--gold-hi` | #E0C384 | Hover del botón y de enlaces, foco |

Pedidos del cliente: solo negro y dorado en la interfaz (nada de rojo, crema o verde; el color lo ponen las fotos). Dorado plano: sin gradientes metálicos en texto ni en botones, sin glow.

## Tipografía (2 familias)
- Cinzel 600: wordmark, `Cantina 70` del h1, h2 y el nombre de la próxima noche. Tamaños contenidos (h2 34–52px; "Cómo llegar" 26–32px).
- Jost 400/500: todo lo demás, en caja normal. Sin eyebrows ni etiquetas espaciadas.

## Estructura
1. Barra fija negra (sin blur): wordmark, 4 enlaces, botón Reservar (WhatsApp directo).
2. Portada: h1 (Cantina 70 + "Discoteca en La 70, Laureles, Medellín"), próxima noche (fecha, nombre, nota), Reservar por WhatsApp, horario y dirección en una frase; a la derecha el flyer de la próxima noche. Se rellena con la primera noche próxima de IGEvents; sin noche anunciada, Viernes de Banda (`viernes-banda-todos.webp`).
3. Agenda: columna izquierda con lo fijo de la semana (viernes, sábado, domingo, jueves) y a la derecha los flyers (sin marcos, sin rotar), con fecha, nombre y condiciones reales. La noche de la portada no se repite.
4. Fotos: muro 4×2 (2×4 en móvil), 4px de separación, como el grid de Instagram; sin pies de foto inventados.
5. Mesas y cumpleaños: flyer de cumple, cómo reservar, cover de sábado, paquete de cumpleaños, CTA WhatsApp.
6. Cómo llegar: compacto, tres datos (dirección + enlace de Maps en texto, horario, pagos).
7. Footer.

## Forma y movimiento
Radio 0. Sin sombras. Un solo hover: zoom 1.03 del flyer en la agenda (solo puntero fino) y cambio de tono del botón. Nada de canvas, marquees, sellos, contadores ni badges. `prefers-reduced-motion` quita transiciones.

## No tocar
`FALLBACK_ARRAY` + contrato `IGEvents.load({club, fallback})`, permalinks, JSON-LD (estático y dinámico).
