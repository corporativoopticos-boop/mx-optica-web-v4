/* GA4 MX Óptica: eventos de conversión sin datos personales.
   - whatsapp_click: clic en cualquier enlace a wa.me (solo ubicación del botón).
   - cotizacion_solicitud: envío del cotizador (solo opciones de listas cerradas; nunca el texto libre ni la graduación). */
(function(){
  'use strict';
  if (window.__mxAnalyticsInit) return; // evita doble registro de listeners
  window.__mxAnalyticsInit = true;
  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params); };
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40) || 'sin_especificar';
  const placement = (a) => {
    if (a.dataset.waLocation) return slug(a.dataset.waLocation);
    if (a.id === 'wa-send') return 'cotizador_mensaje';
    if (a.closest('.site-footer')) return 'footer';
    if (a.closest('.site-header')) return 'header';
    if (a.closest('.hero, .page-hero')) return 'hero';
    const sec = a.closest('section[id]');
    return sec ? slug(sec.id) : 'contenido';
  };
  document.addEventListener('click', function(ev){
    const a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
    if (!a) return;
    track('whatsapp_click', { link_location: placement(a), page_type: document.body.dataset.pageType || slug(location.pathname.split('/').filter(Boolean)[0] || 'inicio') });
  }, true);
  const form = document.getElementById('cotizador-form');
  if (form) form.addEventListener('submit', function(){
    const val = (id) => { const el = document.getElementById(id); return el ? slug(el.value) : 'sin_especificar'; };
    const mat = form.querySelector('input[name="material"]:checked');
    const trt = [...form.querySelectorAll('input[name="trt"]:checked')].map(b => slug(b.value)).sort().join('+') || 'ninguno';
    const q = window.MXQuote && window.MXQuote.actual ? window.MXQuote.actual() : null;
    const params = { tipo_lente: val('tipo-lente'), material: mat ? slug(mat.value) : 'estandar', tratamiento: trt, sucursal: val('sucursal') };
    if (q && (q.estado === 'desde' || q.estado === 'promo') && Number.isFinite(q.total)) { params.value = q.total; params.currency = 'MXN'; }
    track('cotizacion_solicitud', params);
  });
})();
