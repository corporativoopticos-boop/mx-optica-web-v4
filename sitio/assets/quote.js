/* MX Óptica V5 · Cotizador. Calcula solo con precios autorizados; todo lo demás queda «sujeto a validación».
   Los datos del cliente solo salen del navegador cuando él mismo abre WhatsApp. */
(function(){
  'use strict';
  const WA = 'https://wa.me/522294090925';
  const ok = (e) => !!e && e.autorizado === true && typeof e.precio === 'number' && Number.isFinite(e.precio) && e.precio >= 0;
  const money = (n) => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);

  /* Función pura (probada de forma aislada): devuelve el estado de la cotización. */
  function calc(table, sel){
    const t = table || {paquetes:{},materiales:{},tratamientos:{}};
    const pkg = t.paquetes[sel.paquete], mat = t.materiales[sel.material], trt = t.tratamientos[sel.tratamiento];
    if (!pkg) return {estado:'validacion', total:null, motivo:'Este servicio se cotiza de forma personalizada.'};
    if (sel.receta === 'receta-especial') return {estado:'validacion', total:null, motivo:'Las graduaciones altas o especiales requieren revisión de la óptica.'};
    if (!(ok(pkg) && ok(mat) && ok(trt))) return {estado:'validacion', total:null, motivo:'Alguna opción aún no tiene precio autorizado. La óptica confirmará el importe.'};
    const total = pkg.precio + mat.precio + trt.precio;
    const sinReceta = sel.receta !== 'tengo-receta';
    return {estado:'autorizado', total, motivo: sinReceta
      ? 'Precio autorizado de lista. Se confirmará al revisar tu graduación.'
      : 'Precio autorizado de lista, sujeto a confirmar tu receta en sucursal.'};
  }
  window.MXQuote = Object.freeze({calc});

  const table = window.MX_PRECIOS;
  const $ = (id) => document.getElementById(id);

  /* Precios en tarjetas de paquetes (solo si están autorizados). */
  if (table) document.querySelectorAll('[data-price-for]').forEach(el => {
    const id = el.dataset.priceFor, e = table.paquetes[id], st = document.querySelector('[data-status-for="'+id+'"]');
    if (ok(e)) { el.textContent = 'Desde ' + money(e.precio); if (st){ st.textContent='Precio autorizado'; st.classList.add('is-ok'); } }
  });

  const form = $('cotizador-form');
  if (!form) return;
  const ids = ['tipo-lente','material','tratamiento','receta','sucursal'];
  const labelOf = (id) => { const el=$(id); return el?.selectedOptions?.[0]?.textContent?.trim() || 'Sin especificar'; };
  const getSource = () => {
    const q = new URLSearchParams(window.location.search);
    const explicit = (q.get('utm_source') || '').replace(/[^\w.-]/g,'').slice(0,36);
    if (explicit) return explicit;
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'chatgpt';
      if (host.endsWith('google.com') || host.endsWith('.google.com.mx')) return 'google';
      if (host.endsWith('facebook.com')) return 'facebook';
      if (host.endsWith('instagram.com')) return 'instagram';
      if (host.endsWith('tiktok.com')) return 'tiktok';
      return 'sitio_directo';
    } catch(_) { return 'sitio_directo'; }
  };
  const selection = () => ({paquete:$('tipo-lente').value, material:$('material').value, tratamiento:$('tratamiento').value, receta:$('receta').value});
  let last = calc(table, selection());
  const summary = () => {
    $('res-tipo').textContent = labelOf('tipo-lente');
    $('res-material').textContent = labelOf('material');
    $('res-tratamiento').textContent = labelOf('tratamiento');
    $('res-receta').textContent = labelOf('receta');
    $('res-sucursal').textContent = labelOf('sucursal');
    last = calc(table, selection());
    const auth = last.estado === 'autorizado';
    $('res-precio').textContent = auth ? money(last.total) : 'Por confirmar';
    $('res-estado').textContent = auth ? 'Precio autorizado' : 'Cotización sujeta a validación';
    $('res-estado').classList.toggle('is-ok', auth);
    $('res-explica').textContent = last.motivo;
  };
  ids.forEach(id => $(id)?.addEventListener('change', summary));

  /* Atajos desde las tarjetas de paquetes y tratamientos. */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-pick-pkg],[data-pick-trt]');
    if (!b) return;
    const sel = b.dataset.pickPkg ? $('tipo-lente') : $('tratamiento');
    sel.value = b.dataset.pickPkg || b.dataset.pickTrt;
    summary();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('cotizador').scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'start'});
    sel.classList.remove('flash'); void sel.offsetWidth; sel.classList.add('flash');
    setTimeout(() => sel.focus({preventScroll:true}), reduce ? 0 : 450);
  });

  let preparedUrl = '';
  $('wa-send')?.addEventListener('click', function(ev){
    if (!preparedUrl) return;
    ev.preventDefault();
    window.open(preparedUrl,'_blank','noopener,noreferrer');
  });
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    summary();
    const detalle = $('detalle').value.trim().slice(0,500);
    const precio = last.estado === 'autorizado' ? 'Precio autorizado mostrado: ' + money(last.total) + ' MXN' : 'Precio: por confirmar';
    const msg = ['👋 ¡Hola! Encontré MX Óptica en su sitio web.',
      'Me interesa: ' + labelOf('tipo-lente'),
      'Material: ' + labelOf('material'),
      'Tratamiento: ' + labelOf('tratamiento'),
      'Graduación: ' + labelOf('receta'),
      'Sucursal: ' + labelOf('sucursal'),
      precio,
      'Consulta: ' + (detalle || 'Quisiera conocer opciones, disponibilidad y precio.'),
      'Referencia de origen: web MX Óptica / ' + getSource(),
      '¿Me ayudan con una cotización?'].join('\n');
    // El href de #wa-send queda sin el mensaje para que la medición de clics salientes no registre la consulta.
    preparedUrl = WA + '?text=' + encodeURIComponent(msg);
    const link = $('wa-send'); if (link) link.hidden = false;
    // Solo se abre WhatsApp por la acción explícita del cliente.
    window.open(preparedUrl,'_blank','noopener,noreferrer');
  });
  summary();
})();
