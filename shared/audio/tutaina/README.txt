Audio local de tutaina (tiene prioridad sobre el ambiente sintetizado)

1. Descarga pistas libres de derechos (Biblioteca de audio de YouTube Studio o Pixabay Music).
   Usa solo licencias sin atribución obligatoria, o anota la atribución exigida en creditos.txt.
2. Copia los archivos en esta carpeta como 01.mp3, 02.mp3, 03.mp3…
3. Edita playlist.json con una entrada por pista, en este formato:
   [
     {"file": "01.mp3", "title": "Nombre del tema", "artist": "Artista"},
     {"file": "02.mp3", "title": "Otro tema", "artist": "Otro artista"}
   ]
4. (Opcional) creditos.txt: texto libre con fuente, licencia y atribución de cada pista.
   Es para tu registro de licencias (no se muestra en la página).

Si playlist.json queda vacío ([]), la página usa el ambiente sintetizado del club.
