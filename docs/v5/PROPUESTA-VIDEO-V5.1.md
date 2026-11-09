# Propuesta audiovisual V5.1 — pendiente de aprobación del propietario

**Estado:** propuesta. **No hay video nuevo producido ni publicado.** El sitio sigue usando el video y póster originales (`sitio/media/hero-v2-*`), que se conservan como respaldo permanente.

Guion gráfico: `docs/v5/propuesta-video/storyboard-v5.1.jpg`.

## Diagnóstico
El video actual (`hero-v2-background.mp4`, 8 s) es una animación de cámara (acercamiento y desplazamiento) sobre **una sola fotografía**. La protagonista no hace ningún movimiento real; por eso se percibe como un GIF. Ningún ajuste de código puede añadirle movimientos que el material no tiene: se necesita **material audiovisual nuevo**.

## Secuencia propuesta (12 s en bucle, sin audio)
| Escena | Tiempo | Contenido | Origen del material |
|---|---|---|---|
| 1 | 0–3 s | La misma mujer gira levemente la cabeza, sonríe y se acomoda los lentes | **Nuevo**, generado a partir del póster original (imagen a video) con control de identidad |
| 2 | 3–5.5 s | Barrido de luz aqua en el cristal; el armazón dorado da paso a armazones girando | **Nuevo**: armazones reales de MX Óptica en tornamesa (grabación en sucursal) |
| 3 | 5.5–9 s | Primeros planos: bisagra y metal, antirreflejante frente a sin tratamiento, fotocromático, mica Hi-Index, biselado en el laboratorio propio | **Nuevo**: grabación macro en sucursal y laboratorio, solo producto |
| 4 | 9–12 s | Regreso a la composición de marca «Ver mejor, vivir mejor» + «Cotiza tus lentes» | Plano limpio. Texto y botón en **HTML real** (accesible y clicable), no incrustados |

## Preservación de identidad (escena 1)
- Fuente única: el póster original (SHA-256 `97b9660c7ec3100e0ee250681333353b214c9507c4a26f99e5f9c534514ca37e`), o el PNG original si aparece. **No se usará otra modelo.**
- Lista de control en la revisión, cuadro por cuadro: forma del rostro, ojos y cejas, armazón dorado, arete, cabello, tono de piel y sonrisa. **Se descarta cualquier toma con deformaciones o cambios de rasgos.**
- Movimientos sutiles (2–3 s) para reducir el riesgo de deformación.
- Derechos: confirmar que la herramienta de generación permite uso comercial. Etiquetar el contenido como generado con IA donde lo exijan Meta y TikTok.

## Especificación técnica
- Móvil: 720×1280, H.264 High, ~0.8 Mbps, 24 fps, sin audio, `+faststart`, **≤ 1.2 MB**. Opcional: WebM/AV1 como fuente adicional.
- Escritorio: el mismo archivo, recortado por CSS en el arco. Las escenas de producto se encuadran centradas para que el recorte sea seguro.
- Póster: se mantiene el actual (primer cuadro de la escena 1), por lo que el LCP no cambia.
- Comportamiento:
  - Se conservan `preload="none"` y la carga diferida.
  - Pausa fuera de pantalla y botón «Pausar video».
  - Con *prefers-reduced-motion* o *Ahorro de datos* se muestra solo el póster.
  - El video es decorativo (`aria-hidden`); el mensaje y el CTA son texto HTML.

## Flujo de aprobación (sin publicar nada sin revisión)
1. El propietario aprueba o ajusta este guion gráfico.
2. Prueba de la escena 1 (3 s). El propietario la revisa junto al póster original y aprueba la identidad.
3. Grabación de las escenas 2 y 3 en sucursal: teléfono 4K, tornamesa, luz suave y fondo celeste o blanco, sin suscripciones nuevas.
4. Edición y compresión. Se entrega como archivo en `docs/v5/propuesta-video/`, **sin conectarlo a la página**.
5. Con la aprobación visual expresa, se cambia el `src` del video en la rama `develop/v5-cinematica`, se prueba y se revisa en la vista previa.
6. Publicar en producción sigue requiriendo autorización para fusionar el PR.

## Lista de tomas para sucursal (escenas 2 y 3)
- 6 a 8 armazones en tornamesa (metal dorado, acetato, al aire), 3–4 s cada uno, a 60 fps.
- Bisagra y varilla en macro.
- Lente con antirreflejante y lente sin tratamiento frente a una luz puntual.
- Lente fotocromático bajo luz UV o luz solar: transición de claro a oscuro.
- Canto de una mica estándar frente a una Hi-Index (grosor).
- Biseladora o montaje en el laboratorio propio (sin personas identificables, o con su consentimiento).
