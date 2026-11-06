# MX Óptica · Sitio comercial V4 GEO (preview)

**No es el sistema POS**. Sitio web comercial con información GEO de Plaza Bravo y Plaza Maryn, siete páginas y solicitud de cotización por WhatsApp. No contiene cobros ni panel administrativo.

## Cloudflare Pages (GitHub)

- Repositorio: `corporativoopticos-boop/mx-optica-web-v4`
- Framework preset: `None` (ninguno)
- Production branch: `main`
- Root directory: `/` (por defecto)
- Build command: `exit 0` (opcional; sin compilación)
- **Build output directory: `sitio`**
- No configurar tokens, claves o Mercado Pago para este sitio estático.

Al conectar GitHub con Cloudflare Pages, el despliegue generará una URL `*.pages.dev` comprobable. La vista previa incorpora `X-Robots-Tag: noindex, nofollow` en `sitio/_headers` para evitar indexar contenido temporal sin dominio final.

## Antes del lanzamiento del dominio

1. Confirmar el **dominio exacto** registrado en Cloudflare (con y sin acento son distintos dominios).
2. Integrar una página de privacidad aprobada si se van a recolectar datos desde el sitio; actualmente solo abre WhatsApp.
3. Generar canonical, sitemap y robots.txt de producción con `herramientas/finalizar_dominio.py`, desde respaldo técnico.
4. **Eliminar** `X-Robots-Tag: noindex, nofollow` de `sitio/_headers` antes de solicitar indexación.
5. Activar dominio en Cloudflare Pages > Custom domains, probar HTTPS, URLs y móvil. Después configurar Search Console y sitios web en Google Business Profile.

No afirmar que el sitio está publicado hasta comprobar una URL en vivo; no exponer el respaldo con el prototipo de panel (solo este directorio público se despliega).