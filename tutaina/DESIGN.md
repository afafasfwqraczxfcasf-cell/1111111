# Tutaina Eje Cafetero, DESIGN.md (v5, "partir del sitio oficial")

Base: discotecatutaina.com (Bricks, `<style id="wpr-usedcss">`). La idea es que se reconozca como la marca real y quede más ordenado: sin efectos, con tamaños legibles y responsive de 320 a 2560 px.

## Tokens (literales del CSS oficial)
- Color: --tt-ink #060607 · --tt-ink-soft #0a0a0d · --tt-ink-card #101014 · fondo de hero/contacto #050506 · bandas #08080a
- Dorado: --tt-gold #ffd400 · --tt-gold-2 #f2b600 · --tt-gold-3 #ffe985 (hover) · texto sobre dorado #080808
- --tt-cream #f5f0e3 · --tt-muted #a3a096 · --tt-line rgba(255,255,255,.09) · --tt-gold-line rgba(255,212,0,.28)
- Easing: --tt-ease cubic-bezier(.22,.61,.36,1) · --tt-ease-out cubic-bezier(.16,1,.3,1)
- --tt-pad clamp(18.4px,4.4vw,72px), mínimo 16px · contenedor 1280px (el oficial usa 1320) · secciones clamp(64px,8vw,112px)
- Radios: tarjetas 6px · chips/insignias 3px · botones 999px

## Fuentes (Google Fonts, con los pesos del CSS oficial)
- Archivo 500–900 (--font-display): títulos en mayúsculas 900, wordmark y números.
- Manrope 300–800 (--font-body): texto y botones (800, .16em, en mayúsculas).
- Instrument Serif italic (--font-serif): el `<em>` dorado de los h2, los índices 01–07 y el "#1".

## Escala (corregida por el brief; el oficial usa etiquetas de 8–10px)
h1 clamp(44px,6vw,88px) · h2 clamp(30px,3.6vw,48px) · texto 15–18px/1.7 · etiquetas ≥11–12px · táctil ≥44px.

## Estructura (mismo orden que el sitio oficial)
Header .tt-header (corona + TUTAINA + EJE CAFETERO; nav Inicio/Eventos/El club/Galería/Contacto; "Reservar" en contorno sobre el hero y dorado al hacer scroll; menú móvil a pantalla completa ≤960px)
→ Hero (eyebrow, TUTAINA en dorado + PEREIRA en contorno, "La Discoteca #1 del Eje Cafetero", Reservar ahora / Ver agenda, horario y dirección; foto .webp a la derecha con el scrim oficial y marco dorado)
→ 01 "Calendario y tickets" (.event: flyer 4:5 contain, insignia de fecha, kicker, título, Reservar por WhatsApp; con 1 sola noche se muestra flyer + datos lado a lado)
→ 02 "Lo mejor de nuestras noches" (fila con scroll-snap manual, flechas, progreso y contador; 30 noches + tarjeta a Instagram)
→ 03 "¡La fiesta del Eje Cafetero!" (dos fotos, insignia 10+, chips, cifras fijas)
→ 04 "¿Dónde está Tutaina Pereira?" (texto, 8 sectores, mapa ilustrado estático + Abrir mapa)
→ 05 "¿Por qué Tutaina es la mejor discoteca en Pereira?" (4 razones + código de vestimenta)
→ 06 "Los mejores eventos en Tutaina" (8 fotos .webp, 4/3/2 columnas)
→ 07 "Reserva tu noche" (4 datos de contacto, WhatsApp/Llamar, horario)
→ Footer .tt-footer. Botón flotante de WhatsApp sin pulso, que se oculta en Contacto.

.section__head: grid auto / minmax(0,1fr) / minmax(0,320px). Desde 1100px la descripción baja a la columna 2; desde 520px va en una sola columna.

## Lo que se quitó del sitio oficial
Preloader, canvas de polvo, haces, grano, cursor-glow, barra de progreso, rail lateral, ticker, zoom del hero, brillo animado en el dorado, botones magnéticos, parallax, contadores, radar/ping del mapa, marquee del footer, lightbox y la animación de pulso. Las .jpg de 2024/10 tampoco están (se bloquean fuera de su dominio).

## Motion
Solo hay tres cosas: aparición al hacer scroll (opacity + 12px, 400ms, una vez), hovers de 300ms (color, borde, flecha 3px) y la transición del header. Con reduced motion no hay ninguna.

## Datos
FALLBACK_ARRAY + ../shared/ig-events.js + IGEvents.load({club:"tutaina"}) con permalinks. JSON-LD NightClub, y Event (#ld-events se reemplaza con los próximos eventos cargados).
