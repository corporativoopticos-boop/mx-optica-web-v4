# Prueba audiovisual · Escena 1 (3 s) — paquete de producción y control

Estado: **dirección creativa aprobada · prueba NO generada todavía**. El video del sitio no cambia.

## Por qué la prueba no se generó en esta sesión
El movimiento natural (girar la cabeza, sonreír, parpadear) a partir de la fotografía original requiere un modelo de generación de video a partir de imagen. En el entorno de trabajo:
- No hay GPU, y la red no permite conectar con servicios de generación de video (Runway, Luma, Replicate, fal y Hugging Face aparecen bloqueados).
- El conector Blotato disponible solo anima imágenes generadas por IA (sería otra mujer) o crea un «selfie parlante» con narración que regenera al personaje. Ninguna opción conserva la identidad, y ambas consumirían créditos de la cuenta. No se usó.
- Cualquier efecto hecho localmente sobre el póster (zoom, paneo, deformación) sería una «fotografía animada», que es lo que el propietario descartó.

## Vías para producir la prueba
**A. El propietario genera el clip** con la herramienta de imagen a video que ya utilice, usando el prompt de abajo. Después me entrega el archivo (por Drive o en el chat) y yo ejecuto el control de calidad, preparo la versión web y la presento para revisión.

**B. Autorizar la generación desde la sesión.** Se necesitan:
1. Elegir el proveedor.
2. Guardar su clave de API mediante el formulario seguro de credenciales del entorno. Nunca debe pegarse en el chat.
3. Permitir el dominio de su API en la configuración de red del entorno.

Con eso genero las variantes, las mido y le entrego solo las que pasen el control.

## Entrada
- **Imagen de partida (primer cuadro):** `sitio/media/hero-v2-poster.jpg` (SHA-256 `97b9660c7ec3100e0ee250681333353b214c9507c4a26f99e5f9c534514ca37e`), sin recortar ni retocar.
- Formato 9:16, 720×1280 o mayor, de 3 a 5 s (se recorta a 3 s), 24 fps, sin audio. Fijar la semilla (*seed*) para poder repetir el resultado.

## Prompt (variante A, recomendada para la primera prueba: sin manos)
> Use the provided image as the exact first frame. Keep the woman's identity unchanged: same face shape, eyes, eyebrows, nose, lips, skin tone, long wavy brown hair, thin gold round eyeglasses, small gold earring, white strap top, sunlit glass dome background. Natural, subtle motion over 3 seconds: she slowly turns her head a few degrees toward the camera, her smile widens naturally, she blinks once, and her hair moves gently in a light breeze. Camera almost static with a very slow push-in. Photorealistic, warm soft sunlight, cinematic, shallow depth of field. No text, no logos, no extra people.

**Negativo:** different person, face change, morphing, distorted or melting glasses, asymmetric eyes, extra teeth, flicker, warping background, text, watermark.

**Variante B** (solo si A aprueba la identidad): añade *«at the end she lightly adjusts the temple of her glasses with her right hand»*. El riesgo de errores en las manos es mayor.

## Criterios de aceptación
1. **Movimiento natural (medido):** ejecutar `python3 herramientas/v5_video_qc.py CLIP.mp4 --poster sitio/media/hero-v2-poster.jpg --out docs/v5/propuesta-video/prueba-escena1`. Debe dar «MOVIMIENTO NATURAL», con al menos 1 % de píxeles del rostro con movimiento no explicable por una cámara (percentil 90).
   - Línea base del video actual: **0.01 % → FOTOGRAFÍA ANIMADA** (`qc-linea-base/`).
   - Calibración: un control con movimiento local dio 3.32 % y uno demasiado sutil dio 0.68 %.
   - Pasar este control es necesario pero **no suficiente**: la aprobación final es visual.
2. **Identidad (visual, propietario):** revisar la `hoja-identidad.jpg` (póster original junto a 5 cuadros del clip): forma del rostro, ojos y cejas, armazón dorado, arete, cabello, sonrisa y tono de piel. **Si cambia cualquiera de estos rasgos, la toma se rechaza.**
3. **Especificación:** de 2.5 a 3.5 s, vertical 9:16, 24 a 30 fps, sin audio. La versión web normalizada debe pesar ≤ 400 KB para 3 s.
4. **Derechos:** confirmar que la herramienta permite uso comercial. Etiquetar como contenido generado con IA en las plataformas que lo exijan.

## Después de la aprobación
Solo con aprobación visual expresa se continúa con las escenas 2–4 (`PROPUESTA-VIDEO-V5.1.md`). El cambio del video en el sitio requiere otra aprobación, y publicarlo en producción, la autorización de fusionar el PR.
