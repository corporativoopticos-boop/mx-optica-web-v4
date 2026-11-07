/* Cotización preliminar sin precios no autorizados; datos solo se mandan con clic expreso. */
(function(){
  'use strict';
  const form = document.getElementById('cotizador-form');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const $fields = ['tipo-lente','tratamiento','sucursal','receta','detalle'];
  const titles = { 'plaza-bravo':'Plaza Bravo · Veracruz Centro', 'plaza-maryn':'Plaza Maryn · Boca del Río' };
  const labelOf = (id) => { const el=$(id); return el?.selectedOptions?.[0]?.textContent?.trim() || el?.value?.trim() || 'Sin especificar'; };
  const getSource = () => {
    const q = new URLSearchParams(window.location.search);
    const explicit = (q.get('utm_source') || '').replace(/[^\w.-]/g,'').slice(0,36);
    if (explicit) return explicit;
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'chatgpt';
      if (host === 'www.google.com' || host.endsWith('.google.com') || host.endsWith('.google.com.mx')) return 'google';
      if (host === 'www.facebook.com' || host.endsWith('.facebook.com')) return 'facebook';
      if (host === 'www.instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
      return 'sitio_directo';
    } catch(_) { return 'sitio_directo'; }
  };
  const summary = () => {
    $('res-tipo').textContent = labelOf('tipo-lente');
    $('res-tratamiento').textContent = labelOf('tratamiento');
    $('res-sucursal').textContent = titles[$('sucursal').value] || labelOf('sucursal');
    $('res-receta').textContent = labelOf('receta');
  };
  $fields.forEach(id => $(id)?.addEventListener('change', summary));
  $('detalle')?.addEventListener('input', summary);
  let preparedUrl='';
  $('wa-send')?.addEventListener('click', function(ev){
    if (!preparedUrl) return;
    ev.preventDefault();
    window.open(preparedUrl,'_blank','noopener,noreferrer');
  });
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    const tipo = labelOf('tipo-lente'); const tratamiento = labelOf('tratamiento');
    const sucursal = titles[$('sucursal').value] || labelOf('sucursal');
    const receta = labelOf('receta'); const detalle = $('detalle').value.trim().slice(0,500);
    const msg = ['👋 ¡Hola! Encontré MX Óptica en su sitio web.',
      'Me interesa: '+tipo,
      'Tratamiento: '+tratamiento,
      'Sucursal: '+sucursal,
      'Tengo receta: '+receta,
      'Consulta: '+(detalle || 'Quisiera conocer opciones, disponibilidad y precio.'),
      'Referencia de origen: web MX Óptica / '+getSource(),
      '¿Me ayudan con una cotización?'].join('\n');
    const url='https://wa.me/522294090925?text='+encodeURIComponent(msg);
    // El href queda sin el texto del mensaje para que ninguna herramienta de medición
    // (p. ej. clics salientes de GA4) registre la consulta escrita por el cliente.
    preparedUrl=url;
    const link=$('wa-send'); if (link) { link.hidden=false; }
    // Solo se abre WhatsApp por la acción explícita del cliente.
    window.open(url,'_blank','noopener,noreferrer');
  });
  summary();
})();