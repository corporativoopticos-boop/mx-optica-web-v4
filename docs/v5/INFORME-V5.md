# MX Óptica · V5 Cinematográfica — Informe técnico

Fecha: 2026-11-09 · Rama: `develop/v5-cinematica` · **No publicado en producción** (mxoptica.com sigue en V4, rama `main`).

## 1. Auditoría inicial

| Elemento | Estado verificado |
|---|---|
| Producción | `main` = `d9b89e0` (V4 GEO + GA4 G-1YKC3ZT1P1, PR #1). Cloudflare Pages construye `main` con directorio de salida `sitio`. |
| Respaldo | Rama `backup/v4-estable-2026-11-09` → `d9b89e0`, publicada en GitHub. El tag `v4-estable-2026-11-09` se creó localmente, pero el proxy de git de la sesión rechazó subirlo (HTTP 403); la rama cumple la misma función. |
| Siete páginas | Portada, 2 sucursales, 4 servicios. Se conservan URLs, `<title>`, descripciones, canonical, Open Graph, JSON-LD, verificación de Search Console, GA4, `sitemap.xml` y `robots.txt` sin cambios. |
| Verificación en vivo | No fue posible desde esta sesión: la red bloquea `mxoptica.com`, `*.pages.dev` y Google. Se verificó el estado por GitHub (commit de `main` y check de Cloudflare Pages). |

### Archivos de Google Drive leídos (conexión oficial, solo lectura)

| Archivo | ID | Bytes | SHA-256 |
|---|---|---|---|
| index-V4.5-legibilidad.html | 1AaPAQeLJ2i5FOFpQlJ8AyJejwJr7N__C | 724 448 | `8cb45020…a1e1` (coincide con el documentado en el Estado maestro) |
| mx-optica-v4.5-legibilidad.zip | 1C8mT491MXbbwRh3iMw7S7P8YXDSUNjV7 | 921 123 | `1def28d3…db69` |
| mx-optica-v4.3-cinematica.zip | 1A1GUjwubmxh6l1v8UI3-Tt5Y9HyxKFpr | 5 810 638 | `fe03849d…a2cd` |
| Estado maestro (Google Doc) | 1vYC_o5oJSCt9nC67wGRm3JoAtZra64jZI77W3-tPuBQ | — | leído como texto |

No se modificó ni eliminó nada en Drive.

## 2. Recursos audiovisuales de la protagonista

| Recurso | Resultado |
|---|---|
| `wide_bright_high_end_lifestyle_advertising_scene.png` (SHA-256 `03a9da5f…5c6`) | **NO DISPONIBLE.** No está en los ZIP V4.3/V4.5, ni incrustado en los HTML, ni en las carpetas 02 Diseño, 03 Código, 06 Respaldos ni en la raíz del proyecto en Drive. `render_v2.py` lo leía de `/mnt/data/` de un entorno anterior. **No se generó ni sustituyó por otro recurso.** |
| `hero-v2-background.mp4` | Extraído de `mx-optica-v4.3/video/` del ZIP V4.3. SHA-256 `5146d7621534c5be769f85b97602c129ac0d89e9ab4a0c72d0b740460a983d90`. **Idéntico byte a byte** al video incrustado en V4.5. H.264 720×1280, 24 fps, 8 s, sin audio, 269 614 bytes. |
| `hero-v2-poster.jpg` | SHA-256 `97b9660c7ec3100e0ee250681333353b214c9507c4a26f99e5f9c534514ca37e`, 122 124 bytes, 720×1280. **Idéntico byte a byte** al póster incrustado en V4.5. |

Publicados sin alteración en `sitio/media/`. Optimización móvil: el MP4 ya tiene el índice `moov` al inicio (arranque progresivo) y 266 kbps, así que no se recodificó para no alterar a la protagonista. Se probó un remux `+faststart` y dio fotogramas idénticos (framemd5 igual), pero no aportaba nada y se descartó. Optimización por carga: póster como LCP con `fetchpriority=high`, video `preload="none"` iniciado tras `load`, desactivado con *prefers-reduced-motion* o *Ahorro de datos*, pausado fuera de pantalla, y botón «Pausar video».

**Derechos:** según el README V4.3 y REFERENCIAS.md, la fotografía es una imagen generada para el prototipo y el video es una animación de cámara sobre esa fotografía. **Los derechos comerciales específicos (herramienta de generación, licencia y uso publicitario) siguen pendientes de comprobación antes de publicar en producción.**

## 3. Implementación V5

- `assets/styles.css`: diseño nuevo con paleta celeste, aqua, turquesa, blanco luminoso y dorado discreto. Texto azul petróleo oscuro y tarjetas con borde y sombra diferenciados. Animaciones de entrada, revelado al desplazarse y microinteracciones; todo se desactiva con *prefers-reduced-motion*.
- Portada: hero cinematográfico «Ver mejor, vivir mejor» con la misma mujer (video y póster originales):
  - En escritorio, el video va enmarcado en un arco. Así se evita el recorte de V4.5, que en pantallas anchas solo mostraba los labios.
  - En móvil, el video ocupa toda la pantalla y el texto va sobre un degradado de contraste.
- Secciones de la portada: franja de sucursales, 4 paquetes, 8 tratamientos y combinaciones, 4 servicios (enlaces SEO internos), 2 sucursales, cotizador, preguntas frecuentes y llamada a la acción.
- Menú móvil accesible: `aria-expanded`, cierre con Escape, con clic fuera o al elegir un enlace. Sin JavaScript se muestra un menú en línea.
- Botón flotante de WhatsApp en las 7 páginas.
- Cotizador (estructura de V4.5 mejorada): paquete o servicio, material, tratamiento (8, con combinaciones), graduación y sucursal, más un comentario opcional. Las tarjetas preseleccionan opciones. El resumen se actualiza en vivo.
- `assets/precios.js`: tabla pública de precios con **todos los importes en `null` y sin autorizar**. El cotizador solo calcula y muestra «Precio autorizado» cuando cada componente tiene `autorizado: true` y un importe numérico válido. En cualquier otro caso muestra «Por confirmar · Cotización sujeta a validación». Una graduación especial siempre pasa a revisión. Los precios históricos ($550, $1,125, $1,189, $1,470) **no se publican**.
- GA4 se mantiene con eventos únicos:
  - `whatsapp_click` con `link_location` (incluye el nuevo valor `flotante`).
  - `cotizacion_solicitud` con `tipo_lente`, `material`, `tratamiento` y `sucursal`; todos son valores de listas cerradas. **No se envían** el texto libre, la graduación ni datos personales.
- Panel administrativo V4.5: **no incluido** (solo demostrativo, sin autenticación). No hay Mercado Pago, cobros, costos internos ni credenciales.
- `_headers`:
  - `X-Robots-Tag: noindex` solo para `*.mx-optica-web-v4.pages.dev` (las vistas previas no compiten con mxoptica.com).
  - CSP en modo *Report-Only*, compatible con GA4.
  - Caché de 30 días para `/media/*`.

## 4. Pruebas ejecutadas (2026-11-09)

Playwright + Chromium contra un servidor local, más axe-core 4.10.2. Script: `pruebas/v5/run.js`. Resultados: `pruebas/v5/resultados-2026-11-09.json`. **113 de 113 pruebas aprobadas.**

| Área | Qué se probó | Resultado |
|---|---|---|
| Responsive | 7 páginas a 360, 390, 430 y 1440 px, sin desbordamiento horizontal | 28/28 |
| Robustez | Sin errores JS ni recursos rotos (7 páginas × 4 tamaños) | 28/28 |
| Video y póster | readyState 4, reproducción, 720×1280, botón pausar; con movimiento reducido: sin video y póster visible | 4/4 |
| Menú y navegación | Abre, Escape cierra, «Cotizar» desde subpágina lleva a `/#cotizador`; todos los enlaces y anclas internos responden 200 | 5/5 |
| Cotizador y cálculos | Sin precios autorizados muestra «Por confirmar»; preselección desde tarjetas; 8 casos de cálculo con tabla de prueba (suma, 0, no autorizado, null, negativo, graduación especial, servicio, sin receta) | 11/11 |
| WhatsApp | Mensaje completo a wa.me/522294090925; `#wa-send` sin el texto en el href | 2/2 |
| GA4 | Una sola configuración, 1 evento por acción, parámetros correctos, sin datos personales en dataLayer (prueba con nombre, teléfono, correo y graduación ficticios) | 4/4 |
| SEO | Título, descripción, canonical, og:url, 1 h1, `lang`, JSON-LD válido, imágenes con alt; sitemap con 7 URL; robots.txt | 9/9 |
| Accesibilidad | axe WCAG 2.1 AA y buenas prácticas en 7 páginas a 390 y 1440 px: **0 violaciones de cualquier nivel**; salto de contenido con teclado | 15/15 |
| Rendimiento (laboratorio) | Móvil 390 con red limitada (150 ms de latencia) y CPU ×4: LCP 0.6 s, CLS 0. Escritorio: LCP 0.1 s. 448 KB y 8 solicitudes en la portada, sin contar GA4 | 2/2 |
| Seguridad básica | Sin credenciales, Mercado Pago ni localStorage; único script externo GA4; `noopener` en todo `_blank`; CSP aplicada de forma estricta en local sin violaciones | 5/5 |

Correcciones hechas a partir de las pruebas:
- El botón «Pausar video» no se podía tocar en móvil.
- El logotipo aqua sobre blanco no tenía contraste suficiente.
- El botón «Cotizar» del menú tenía texto aqua sobre fondo aqua.
- El texto del hero quedaba sobre la zona clara del rostro.
- `aside` estaba anidado y el botón flotante quedaba fuera de un punto de referencia (*landmark*).

**No probado aquí:** dispositivos físicos Android e iPhone, Safari/WebKit, Lighthouse en vivo, recepción real en GA4 (la red de la sesión bloquea Google) y la vista previa en Cloudflare (la red de la sesión la bloquea).

## 5. Comparación visual con V4.5

Ver `docs/v5/capturas/`: `cmp-home-390.jpg`, `cmp-home-1440.jpg`, `cmp-paquetes-390.jpg` y `cmp-cotizador-390.jpg` (izquierda V4.5, derecha V5).

- Se conserva: la misma protagonista y el mismo video y póster, el eslogan con tipografía serif, la paleta aqua y dorado, la entrada escalonada y la estructura de paquetes, tratamientos y cotizador en cuadrícula de 2 columnas en móvil.
- Mejora:
  - Rostro completo en escritorio.
  - Menú real y navegación a las 7 páginas.
  - Botón de WhatsApp siempre visible.
  - Cotizador con material y sucursal.
  - Distinción clara entre «precio autorizado» y «sujeto a validación».
  - Se retiran la franja de «prototipo» y el panel demo.

## 6. Riesgos y pendientes

1. **Derechos de imagen y video** de la protagonista: confirmar la herramienta de origen y la licencia comercial antes de pasar a producción.
2. PNG original `wide_bright…png` no localizado: si existe en otra cuenta o equipo, subirlo a `02_Diseño_y_referencias` para completar la trazabilidad.
3. Precios: la dirección comercial debe autorizar importes y contenidos de los paquetes. Para publicarlos se edita `sitio/assets/precios.js`.
4. Aviso de privacidad (LFPDPPP): GA4 usa cookies. Falta una página de privacidad aprobada antes de campañas.
5. CSP en *Report-Only*: tras validar GA4 en vivo (consola sin violaciones), cambiar a `Content-Security-Policy`.
6. Pruebas en dispositivos físicos y en Safari iOS. También PageSpeed Insights sobre la vista previa.
7. Pagos (Mercado Pago), panel administrativo con autenticación y backend: fuera de V5 y sin activar.
8. Pasar V5 a producción requiere autorización expresa: PR de `develop/v5-cinematica` hacia `main`.

---

# Actualización V5.1 — 2026-11-09

## Información comercial incorporada (proporcionada por el propietario en el chat)
`sitio/assets/precios.js` es la única fuente de precios. El HTML estático se genera desde ella con `herramientas/v5_ensamblar_paginas.py`, y una prueba verifica que coincidan.

| Paquete | Desde | Incluye |
|---|---|---|
| Monofocal Blue Ray · Promoción | $980 | Blue Ray. **No incluye antirreflejante**; no acumulable; sin adicionales en línea |
| Monofocal Blue Ray | $1,125 | Blue Ray |
| Monofocal Blue Ray + Antirreflejante | $1,415 | Blue Ray, antirreflejante |
| Bifocal Básico / Antirreflejante | $899 / $1,189 | — / antirreflejante |
| Progresivo Básico / Antirreflejante | $1,470 / $1,760 | — / antirreflejante |
| Monofocal Básico, Fotocromático completo | Precio por confirmar | — |

- Adicionales: antirreflejante +$290, Blue Ray +$575, fotocromático +$675. Nunca se cobran si el paquete ya los incluye.
- Materiales: Hi-Index +$400 y Super Hi-Index +$1,090. Son excluyentes (un solo escalón) y se calculan **solo en monofocales**; en bifocales y progresivos pasan a «por confirmar».
- Buen Fin: 2 pares completos por $2,499, del 13 al 17 de noviembre de 2026, en hora del centro de México.
  - Antes de esa fecha muestra «Próximamente» y la opción del cotizador queda deshabilitada.
  - Durante la vigencia muestra «Promoción vigente» y el cotizador calcula $2,499.
  - Después se oculta de la portada, del cotizador y de las preguntas frecuentes.
  - No combinable con la promoción de $980.
- Contenido nuevo:
  - Examen visual gratuito en la portada, en la página de examen y en las sucursales.
  - Laboratorio propio.
  - Mapas de Google cargados solo al pulsar (privacidad y rendimiento).
  - WhatsApp con mensajes prellenados por contexto.
  - Cotizador compacto con casillas, desglose y precio en vivo.
  - Preguntas frecuentes actualizadas.
- Horarios: **sin cambios**. Se conservan los oficiales; no hubo información nueva que validar.

## Puntos que requieren confirmación del propietario
1. **Condiciones exactas del Buen Fin**: no se recibieron en el chat. `condiciones: null` muestra «Condiciones por confirmar en sucursal». Al recibir el texto se coloca tal cual.
2. **«Escala de recargos»**: no se recibieron rangos de graduación. Se interpretó como el escalón de material Hi-Index o Super Hi-Index (solo uno, solo en monofocales). Si existe una tabla por graduación, falta proporcionarla.
3. **Promoción de $980 con adicionales**: se bloqueó agregar antirreflejante o materiales en línea; el cliente puede pedir orientación. Confirmar si se permite sumar antirreflejante (+$290).

## Video
Ver `docs/v5/PROPUESTA-VIDEO-V5.1.md`. No se produjo ni publicó video nuevo; el original sigue intacto (mismos SHA-256).

## Pruebas V5.1 — 134/134 aprobadas
Archivo `pruebas/v5/resultados-v5.1-2026-11-09.json`.
- Cálculos con precios reales: 16 casos (sumas, sin duplicados, excluyentes, monofocal frente a bifocal/progresivo, promoción $980, por confirmar, examen gratuito, graduación especial).
- Promociones: 6 pruebas, con reloj simulado antes, durante y después del Buen Fin, incluidos el primer y el último segundo.
- Otras áreas:
  - Interfaz del cotizador.
  - WhatsApp.
  - GA4: `cotizacion_solicitud` ahora incluye `value`/`currency` estimados y sigue sin datos personales.
  - Mapas.
  - Horarios.
  - SEO.
  - axe WCAG AA, 0 violaciones.
  - Responsive 360/390/430/1440.
  - Rendimiento.
  - Seguridad.
- Defecto encontrado y corregido: botones con atributo `hidden` que seguían visibles por `.btn{display:inline-flex}`.
