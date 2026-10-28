# Tutaina Eje Cafetero, DESIGN.md (v3, ronda "que no se note IA")

Modo: Persuade. La foto de la noche y los flyers oficiales llevan todo el color; la interfaz es negra, plana y se retira.

## Estructura (5 secciones + footer)
1. **Portada**: foto real a sangre con un único scrim neutro, wordmark TUTAINA (h1), "Discoteca en Pereira, Eje Cafetero", próxima noche (dinámica), horario corto, Reservar mesa + enlace Ver eventos. Sin foto: fondo negro plano.
2. **Eventos** (`#eventos`): flyer de la próxima noche grande (4:5, sin rotación ni marco) + título, fechas, caption real, Puertas/Dónde/Mesas, botones. Debajo "Noches pasadas": muro de flyers (5/4/2 col), filtro por año, "Ver N más". Flyers enlazan a `permalink` si existe, si no a Instagram. El origen de la agenda (Instagram o respaldo) va solo en `data-src` de la sección.
3. **Fotos** (`#galeria`): mosaico de 8 .webp oficiales; el texto (h2 + 1 párrafo) ocupa una celda del mosaico. Figcaptions ocultos visualmente (quedan para lectores de pantalla).
4. **Reservas**: cómo reservar por WhatsApp, número, botón; a la derecha un bloque plano con el código de vestimenta real.
5. **Ubicación y horario**: dirección, barrios cercanos, Google Maps, tabla de horario, redes.
Footer: lockup, WhatsApp, sitio oficial, todas las discotecas, ©.

## Color
`--bg #050506`, `--surface #0c0c0e` (secciones alternas), `--plate #131315` (respaldo de imagen y bloque de vestimenta), `--ink #f2f0ea`, `--muted #a29d93`, `--faint #6d6962`, `--accent #fee003`.
Amarillo solo en: wordmark, botón principal, fechas de evento, año activo, foco. Sin degradados, glows ni sombras (salvo el scrim de la foto y la línea de la barra fija).

## Tipografía (2 familias)
- **Archivo**: wordmark (900, wdth 118, mayúsculas, solo la marca), títulos de sección 650 wdth 88 en caja normal (30→48px), título de evento 750 wdth 80 (44→84px).
- **Hanken Grotesk**: todo lo demás, 17px/1.6. Números con `tabular-nums`; sin monoespaciada.
- Nada de mayúsculas gigantes en secciones, eyebrows, numeración 01/02 ni etiquetas espaciadas.

## Respaldo sin foto
`.plate`: tono plano `--plate` con la corona al 7 % centrada. Sin texto encima. La foto real (onerror la retira si falla) lo tapa por completo.

## Motion
Solo: entrada suave del bloque de portada (14px, .9s), zoom 1.025 en hover de flyers (puntero fino), subrayado que aparece en enlaces, nav transparente → sólida. Sin parallax, ticker, partículas ni bucles. `prefers-reduced-motion` lo apaga todo.

## Voz
Corta y concreta, como el community manager: datos (horario, dirección, cómo reservar, qué no se permite) en vez de adjetivos. Prohibido: "experiencia", "alto nivel", "seguro y controlado", "atención personalizada", "la mejor rumba", cifras sueltas tipo "10+ años" en fila.

## Conservado
Wordmark con corona sobre la A + "EJE CAFETERO" en el nav, FALLBACK_ARRAY + `IGEvents`, JSON-LD (NightClub, Event estático y `#ld-events` dinámico), h1 único, alts, píldora de música (`shared/music.js` + `ambient.js`), menú móvil con foco atrapado y Escape, safe areas, objetivos ≥44px.
