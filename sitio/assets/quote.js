/* MX Óptica · PR #3: cotización informativa sin pagos ni mensajes automáticos. */
(function(){
  'use strict';
  // One and only one anchor offset, derived from the actual sticky header height.
  const header=document.querySelector('.site-header');
  if(header){
    const measure=()=>document.documentElement.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(header);
    window.addEventListener('resize',measure,{passive:true});
  }
  document.querySelectorAll('.mobile-menu-links a').forEach(link=>{
    link.addEventListener('click',()=>{const menu=link.closest('details');if(menu)menu.open=false;});
  });
  const form=document.getElementById('cotizador-form');
  if(!form)return; // All other seven-page navigation still measures header.
  const $=id=>document.getElementById(id);
  const branches={'plaza-bravo':'Plaza Bravo · Veracruz Centro','plaza-maryn':'Plaza Maryn · Boca del Río'};
  const prices={'blue-promo':'$980','blue-regular':'$1,125','bifocal':'$899','progresivo':'$1,470'};
  const label=id=>{const el=$(id);return el?.selectedOptions?.[0]?.textContent?.trim()||el?.value?.trim()||'Sin especificar';};
  let preparedUrl='';
  function source(){
    const q=new URLSearchParams(window.location.search),utm=(q.get('utm_source')||'').replace(/[^\w.-]/g,'').slice(0,36);
    if(utm)return utm;
    try{const h=new URL(document.referrer).hostname.toLowerCase();
      if(h==='chatgpt.com'||h.endsWith('.chatgpt.com'))return'chatgpt';
      if(h.endsWith('.google.com')||h.endsWith('.google.com.mx'))return'google';
      if(h.endsWith('.facebook.com'))return'facebook';
      if(h.endsWith('.instagram.com'))return'instagram';
    }catch(_){}
    return'sitio_directo';
  }
  function summary(){
    const id=$('paquete').value,known=Object.prototype.hasOwnProperty.call(prices,id);
    const pkg=known?label('paquete'):id==='personalizado'?'Otra opción / solo servicio':'Todavía no he elegido paquete';
    const amount=known?prices[id]:'Por confirmar';
    $('service-type-row').hidden=known; // package identifies the product; other services remain selectable.
    $('quote-selected').hidden=!known;
    $('selected-package').textContent=pkg;
    $('selected-price').textContent=amount;
    $('mini-package').textContent=pkg;
    $('mini-price').textContent=amount;
    $('mini-branch').textContent=branches[$('sucursal').value]||label('sucursal');
    $('mini-treatment').textContent=label('tratamiento');
    preparedUrl='';$('wa-send').hidden=true;
  }
  ['paquete','tipo-lente','tratamiento','sucursal','receta'].forEach(id=>$(id)?.addEventListener('change',()=>{
    if(id==='paquete'&&Object.prototype.hasOwnProperty.call(prices,$('paquete').value))$('tipo-lente').value='Lentes graduados completos';
    if(id==='tipo-lente'&&$('tipo-lente').value!=='Lentes graduados completos')$('paquete').value='personalizado';
    summary();
  }));
  $('detalle')?.addEventListener('input',summary);
  document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{
    if(!Object.prototype.hasOwnProperty.call(prices,link.dataset.package))return;
    $('paquete').value=link.dataset.package;
    $('tipo-lente').value='Lentes graduados completos';
    // Treatment, branch and observations are never overwritten by package selection.
    summary();
    // href="#cotizador-form" performs the native scroll; no focus or keyboard opening.
  }));
  $('wa-send')?.addEventListener('click',ev=>{
    ev.preventDefault();if(preparedUrl)window.open(preparedUrl,'_blank','noopener,noreferrer');
  });
  form.addEventListener('submit',ev=>{
    ev.preventDefault();
    const id=$('paquete').value,known=Object.prototype.hasOwnProperty.call(prices,id);
    const msg=[
      'Hola, encontré MX Óptica en su sitio web.',
      'Paquete: '+label('paquete'),
      'Precio base anunciado: '+(known?prices[id]:'Por confirmar'),
      'Producto o servicio: '+(known?'Lentes graduados completos':label('tipo-lente')),
      'Tratamiento de interés: '+label('tratamiento'),
      'Sucursal: '+(branches[$('sucursal').value]||label('sucursal')),
      'Tengo receta: '+label('receta'),
      'Observaciones: '+($('detalle').value.trim().slice(0,500)||'Sin observaciones adicionales.'),
      'Origen: web MX Óptica / '+source(),
      '¿Me ayudan a confirmar condiciones y disponibilidad?'
    ].join('\n');
    preparedUrl='https://wa.me/522294090925?text='+encodeURIComponent(msg);
    $('wa-send').hidden=false; // fallback after an explicit request
    window.open(preparedUrl,'_blank','noopener,noreferrer'); // never sends the message itself
  });
  summary();
})();
