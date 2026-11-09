/* MX Óptica V5.1 · Cotizador y precios públicos.
   - Todos los importes vienen de assets/precios.js y se muestran como «Desde», sujetos a validación de graduación.
   - Nunca cobra dos veces un tratamiento incluido; Hi-Index y Super Hi-Index son excluyentes y solo aplican a monofocales.
   - La promoción de $980 no admite adicionales en línea ni se acumula; Buen Fin solo se cotiza durante su vigencia.
   - Los datos del cliente solo salen del navegador cuando él mismo abre WhatsApp. */
(function(){
  'use strict';
  const WA = 'https://wa.me/522294090925';
  const TZ = 'America/Mexico_City';
  const ok = (e) => !!e && e.autorizado === true && typeof e.precio === 'number' && Number.isFinite(e.precio) && e.precio >= 0;
  const money = (n) => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);

  /* ---------- Funciones puras (probadas de forma aislada) ---------- */
  function promoEstado(promo, now){
    if (!promo || !promo.inicio || !promo.fin) return 'finalizada';
    const t = (now instanceof Date ? now : new Date()).getTime();
    if (t < Date.parse(promo.inicio)) return 'proxima';
    if (t <= Date.parse(promo.fin)) return 'vigente';
    return 'finalizada';
  }

  function calc(table, sel, now){
    const T = table || {}, P = T.paquetes || {}, TR = T.tratamientos || {}, M = T.materiales || {}, PR = T.promociones || {};
    const v = (estado, total, motivo, extra) => Object.assign({estado, total, motivo, desglose: [], incluidos: []}, extra || {});
    const trts = [...new Set(sel.tratamientos || [])];
    const matId = sel.material || 'estandar';
    const revision = sel.receta && sel.receta !== 'tengo-receta';

    const promo = PR[sel.paquete];
    if (promo) {
      const st = promoEstado(promo, now);
      if (st === 'proxima') return v('validacion', null, 'La promoción Buen Fin inicia el 13 de noviembre de 2026. Puedes solicitar información desde ahora.');
      if (st === 'finalizada' || !ok(promo)) return v('validacion', null, 'Esta promoción ya no está vigente. La óptica te ofrecerá la mejor opción disponible.');
      const extras = trts.length > 0 || matId !== 'estandar';
      return v('promo', promo.precio, extras
        ? 'Promoción no combinable: los adicionales o materiales especiales se cotizan por separado en sucursal.'
        : (promo.condiciones || 'Precio de promoción para 2 pares completos. Condiciones por confirmar en sucursal.'),
        {desglose: [{concepto: promo.nombre, importe: promo.precio}], pares: 2});
    }

    const pkg = P[sel.paquete];
    if (!pkg) return v('validacion', null, sel.paquete === 'examen-visual'
      ? 'El examen visual es gratuito. Confirma horario y disponibilidad por WhatsApp.'
      : 'Este servicio se cotiza de forma personalizada.');
    if (!ok(pkg)) return v('validacion', null, 'Este paquete aún no tiene precio publicado. La óptica confirmará el importe.');

    const mat = M[matId];
    if (!ok(mat)) return v('validacion', null, 'Material por confirmar en sucursal.');
    if (mat.soloTipos && !mat.soloTipos.includes(pkg.tipo))
      return v('validacion', null, 'En bifocales y progresivos los materiales especiales se cotizan en sucursal.');

    const incluidos = pkg.incluye || [];
    const adicionales = trts.filter(t => !incluidos.includes(t));
    if (pkg.admiteAdicionales === false && (adicionales.length || mat.precio > 0))
      return v('validacion', null, 'La promoción de $980 no incluye antirreflejante ni se combina con adicionales. Elige «Monofocal Blue Ray» para agregarlos, o pide orientación.', {incluidos});
    for (const t of adicionales) if (!ok(TR[t])) return v('validacion', null, 'Algún tratamiento aún no tiene precio publicado.', {incluidos});

    const desglose = [{concepto: pkg.nombre, importe: pkg.precio}];
    adicionales.forEach(t => desglose.push({concepto: TR[t].nombre, importe: TR[t].precio}));
    if (mat.precio > 0) desglose.push({concepto: 'Material ' + mat.nombre, importe: mat.precio});
    const total = desglose.reduce((a, d) => a + d.importe, 0);
    return v('desde', total, revision
      ? 'Precio desde. Tu graduación requiere revisión y podría cambiar material o precio.'
      : 'Precio desde. Se confirma al validar tu graduación en sucursal.', {desglose, incluidos, revision: !!revision});
  }
  window.MXQuote = {calc, promoEstado};

  const table = window.MX_PRECIOS;
  if (!table) return;
  const $ = (id) => document.getElementById(id);
  const now = () => new Date();

  /* ---------- Precios en tarjetas y textos (todas las páginas) ---------- */
  document.querySelectorAll('[data-price-for]').forEach(el => {
    const e = table.paquetes[el.dataset.priceFor];
    el.textContent = ok(e) ? 'Desde ' + money(e.precio) : 'Precio por confirmar';
  });
  document.querySelectorAll('[data-add-price]').forEach(el => { const e = table.tratamientos[el.dataset.addPrice]; el.textContent = ok(e) ? '+' + money(e.precio) : 'Precio por confirmar'; });
  document.querySelectorAll('[data-mat-price]').forEach(el => { const e = table.materiales[el.dataset.matPrice]; el.textContent = ok(e) ? (e.precio ? '+' + money(e.precio) : 'Incluido') : 'Por confirmar'; });

  /* ---------- Promoción temporal Buen Fin ---------- */
  const BF = 'buen-fin-2026', bf = table.promociones[BF], bfSt = promoEstado(bf, now());
  document.querySelectorAll('[data-promo="' + BF + '"]').forEach(box => {
    box.dataset.state = bfSt;
    if (bfSt === 'finalizada') { box.hidden = true; return; }
    box.hidden = false;
    const st = box.querySelector('[data-promo-state]'); if (st) st.textContent = bfSt === 'vigente' ? 'Promoción vigente' : 'Próximamente';
    const pr = box.querySelector('[data-promo-price]'); if (pr && ok(bf)) pr.textContent = money(bf.precio);
    const cd = box.querySelector('[data-promo-cond]'); if (cd) cd.textContent = bf.condiciones || 'Condiciones por confirmar en sucursal. No se combina con la promoción de $980.';
    const wa = box.querySelector('a[href^="' + WA + '"]');
    if (wa) wa.href = WA + '?text=' + encodeURIComponent(bfSt === 'vigente'
      ? 'Hola, me interesa la promoción Buen Fin de 2 pares completos por $2,499. ¿Qué condiciones aplican?'
      : 'Hola, quiero información de la promoción Buen Fin (13 al 17 de noviembre).');
    const cta = box.querySelector('[data-pick-pkg="' + BF + '"]'); if (cta) cta.hidden = bfSt !== 'vigente';
  });

  /* ---------- Cotizador ---------- */
  const form = $('cotizador-form');
  if (!form) return;
  const pkgSel = $('tipo-lente');
  const bfOpt = pkgSel.querySelector('option[value="' + BF + '"]');
  if (bfOpt) { if (bfSt === 'finalizada') bfOpt.remove(); else if (bfSt === 'proxima') { bfOpt.disabled = true; bfOpt.textContent += ' (próximamente)'; } }
  const trtBoxes = [...form.querySelectorAll('input[name="trt"]')];
  const matRadios = [...form.querySelectorAll('input[name="material"]')];
  const labelOf = (el) => el?.selectedOptions?.[0]?.textContent?.trim() || 'Sin especificar';
  const matValue = () => (matRadios.find(r => r.checked) || {}).value || 'estandar';
  const selection = () => ({paquete: pkgSel.value, tratamientos: trtBoxes.filter(b => b.checked && !b.disabled).map(b => b.value), material: matValue(), receta: $('receta').value});

  function syncControls(){
    const pkg = table.paquetes[pkgSel.value], promo = !!table.promociones[pkgSel.value];
    const incl = pkg ? (pkg.incluye || []) : [];
    const lockExtras = promo || !pkg || pkg.admiteAdicionales === false;
    trtBoxes.forEach(b => {
      const tag = b.closest('.opt').querySelector('.opt-tag');
      if (incl.includes(b.value)) { b.checked = true; b.disabled = true; tag.textContent = 'Incluido'; }
      else { if (b.disabled && b.dataset.wasIncluded) b.checked = false; b.disabled = lockExtras; if (lockExtras) b.checked = false; tag.textContent = '+' + money(table.tratamientos[b.value].precio); }
      b.dataset.wasIncluded = incl.includes(b.value) ? '1' : '';
    });
    const matOk = !!pkg && pkg.tipo === 'monofocal' && pkg.admiteAdicionales !== false;
    matRadios.forEach(r => { if (r.value !== 'estandar') { r.disabled = !matOk; if (!matOk && r.checked) { r.checked = false; matRadios[0].checked = true; } } });
    $('trt-note').textContent = promo ? 'Promoción no combinable con adicionales.' : !pkg ? 'Los tratamientos se definen con la óptica para este servicio.' : pkg.admiteAdicionales === false ? 'La promoción de $980 no incluye antirreflejante ni admite adicionales.' : incl.length ? 'Lo marcado como «Incluido» ya está en tu paquete y no se cobra de nuevo.' : 'Se suman al precio del paquete.';
    $('mat-note').textContent = matOk ? 'Elige uno: Hi-Index y Super Hi-Index no se combinan.' : 'Materiales especiales: solo monofocales en línea; en otros casos se cotizan en sucursal.';
  }

  let last = null;
  const trtText = () => { const s = selection(), pkg = table.paquetes[s.paquete], incl = pkg ? pkg.incluye || [] : []; const names = [...incl.map(t => table.tratamientos[t].nombre + ' (incluido)'), ...s.tratamientos.filter(t => !incl.includes(t)).map(t => table.tratamientos[t].nombre)]; return names.join(', ') || 'Sin tratamiento adicional'; };
  const matText = () => table.materiales[matValue()].nombre;
  function summary(){
    syncControls();
    $('res-tipo').textContent = labelOf(pkgSel).replace(' (próximamente)', '');
    $('res-tratamiento').textContent = trtText();
    $('res-material').textContent = matText();
    $('res-receta').textContent = labelOf($('receta'));
    $('res-sucursal').textContent = labelOf($('sucursal'));
    last = calc(table, selection(), now());
    const priced = last.estado === 'desde' || last.estado === 'promo';
    $('res-precio').textContent = priced ? (last.estado === 'desde' ? 'Desde ' : '') + money(last.total) : 'Por confirmar';
    $('res-estado').textContent = last.estado === 'promo' ? 'Promoción Buen Fin · 2 pares' : priced ? 'Precio desde · sujeto a validación' : 'Cotización por confirmar';
    $('res-estado').classList.toggle('is-ok', priced);
    $('res-explica').textContent = last.motivo;
    const lp = $('live-precio'); if (lp) lp.textContent = $('res-precio').textContent;
    const ul = $('res-desglose'); ul.replaceChildren();
    last.desglose.forEach(d => { const li = document.createElement('li'); const a = document.createElement('span'); a.textContent = d.concepto; const b = document.createElement('span'); b.textContent = money(d.importe); li.append(a, b); ul.append(li); });
    ul.hidden = last.desglose.length < 2;
  }
  window.MXQuote.actual = () => last;
  form.addEventListener('change', summary);

  /* Atajos desde tarjetas */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-pick-pkg],[data-pick-trt],[data-pick-mat]');
    if (!b) return;
    let focusEl;
    if (b.dataset.pickPkg) { pkgSel.value = b.dataset.pickPkg; focusEl = pkgSel; }
    if (b.dataset.pickTrt) { const x = trtBoxes.find(i => i.value === b.dataset.pickTrt); syncControls(); if (x && !x.disabled) x.checked = true; focusEl = x; }
    if (b.dataset.pickMat) { const x = matRadios.find(i => i.value === b.dataset.pickMat); syncControls(); if (x && !x.disabled) x.checked = true; focusEl = x; }
    summary();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('cotizador').scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    const card = form.closest('.quote-shell'); card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    if (focusEl) setTimeout(() => focusEl.focus({preventScroll: true}), reduce ? 0 : 450);
  });

  const getSource = () => {
    const q = new URLSearchParams(window.location.search);
    const explicit = (q.get('utm_source') || '').replace(/[^\w.-]/g, '').slice(0, 36);
    if (explicit) return explicit;
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      for (const [k, s] of [['chatgpt.com','chatgpt'],['google.','google'],['facebook.com','facebook'],['instagram.com','instagram'],['tiktok.com','tiktok']]) if (host.includes(k)) return s;
      return 'sitio_directo';
    } catch (_) { return 'sitio_directo'; }
  };
  let preparedUrl = '';
  $('wa-send')?.addEventListener('click', (ev) => { if (!preparedUrl) return; ev.preventDefault(); window.open(preparedUrl, '_blank', 'noopener,noreferrer'); });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    summary();
    const detalle = $('detalle').value.trim().slice(0, 500);
    const precio = last.estado === 'promo' ? 'Precio de promoción mostrado: ' + money(last.total) + ' MXN (2 pares)'
      : last.estado === 'desde' ? 'Precio mostrado: desde ' + money(last.total) + ' MXN (sujeto a validación de graduación)'
      : 'Precio: por confirmar';
    const msg = ['👋 ¡Hola! Quiero cotizar mis lentes en MX Óptica.',
      'Paquete: ' + labelOf(pkgSel),
      'Tratamientos: ' + trtText(),
      'Material: ' + matText(),
      'Graduación: ' + labelOf($('receta')),
      'Sucursal: ' + labelOf($('sucursal')),
      precio,
      'Consulta: ' + (detalle || 'Quisiera confirmar precio y disponibilidad.'),
      'Origen: web MX Óptica / ' + getSource()].join('\n');
    // El href de #wa-send queda sin el mensaje para que la medición de clics salientes no registre la consulta.
    preparedUrl = WA + '?text=' + encodeURIComponent(msg);
    const link = $('wa-send'); if (link) link.hidden = false;
    window.open(preparedUrl, '_blank', 'noopener,noreferrer');
  });
  summary();
})();
