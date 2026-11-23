/* MX Óptica — consulta sin pagos ni envíos automáticos. */
(function(){
'use strict';
document.querySelectorAll('.mobile-menu-links a').forEach(link=>link.addEventListener('click',()=>{const m=link.closest('details');if(m)m.open=false;}));
const form=document.getElementById('cotizador-form');if(!form)return;
const $=id=>document.getElementById(id);
const branches={'plaza-bravo':'Plaza Bravo · Veracruz Centro','plaza-maryn':'Plaza Maryn · Boca del Río'};
const prices={'blue-promo':'$980','blue-regular':'$1,125','bifocal':'$899','progresivo':'$1,470'};
const label=id=>{const el=$(id);return el?.selectedOptions?.[0]?.textContent?.trim()||el?.value?.trim()||'Sin especificar';};
let preparedUrl='';
function source(){
 const q=new URLSearchParams(window.location.search),u=(q.get('utm_source')||'').replace(/[^\w.-]/g,'').slice(0,36);
 if(u)return u;
 try{const h=new URL(document.referrer).hostname.toLowerCase();
 if(h==='chatgpt.com'||h.endsWith('.chatgpt.com'))return'chatgpt';
 if(h.endsWith('.google.com')||h.endsWith('.google.com.mx'))return'google';
 if(h.endsWith('.facebook.com'))return'facebook';
 if(h.endsWith('.instagram.com'))return'instagram';}catch(_){}
 return'sitio_directo';
}
function summary(){
 $('res-tipo').textContent=label('tipo-lente');
 $('res-paquete').textContent=label('paquete');
 $('res-tratamiento').textContent=label('tratamiento');
 $('res-sucursal').textContent=branches[$('sucursal').value]||label('sucursal');
 $('res-receta').textContent=label('receta');
 $('res-precio').textContent=prices[$('paquete').value]?'Paquete base: '+prices[$('paquete').value]+' · sujeto a condiciones':'Precio por confirmar';
 preparedUrl='';const l=$('wa-send');if(l)l.hidden=true;
}
['paquete','tipo-lente','tratamiento','sucursal','receta'].forEach(id=>$(id)?.addEventListener('change',()=>{
 if(id==='paquete'&&prices[$('paquete').value])$('tipo-lente').value='Lentes graduados completos';
 if(id==='tipo-lente'&&$('tipo-lente').value!=='Lentes graduados completos')$('paquete').value='sin-definir';
 summary();
}));
$('detalle')?.addEventListener('input',summary);
document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{
 if(!Object.prototype.hasOwnProperty.call(prices,link.dataset.package))return;
 $('paquete').value=link.dataset.package;$('tipo-lente').value='Lentes graduados completos';
 if($('tratamiento').value==='No sé cuál necesito')$('tratamiento').value='Sin tratamiento adicional';
 summary(); // conserva sucursal
}));
$('wa-send')?.addEventListener('click',ev=>{ev.preventDefault();if(preparedUrl)window.open(preparedUrl,'_blank','noopener,noreferrer');});
form.addEventListener('submit',ev=>{
 ev.preventDefault();
 const msg=['Hola, encontré MX Óptica en su sitio web.',
 'Paquete: '+label('paquete'),
 'Producto o servicio: '+label('tipo-lente'),
 'Tratamiento de interés: '+label('tratamiento'),
 'Sucursal: '+(branches[$('sucursal').value]||label('sucursal')),
 'Tengo receta: '+label('receta'),
 'Observaciones: '+($('detalle').value.trim().slice(0,500)||'Sin observaciones adicionales.'),
 'Origen: web MX Óptica / '+source(),
 '¿Me ayudan a confirmar condiciones y disponibilidad?'].join('\n');
 preparedUrl='https://wa.me/522294090925?text='+encodeURIComponent(msg);
 const l=$('wa-send');if(l)l.hidden=false;
 window.open(preparedUrl,'_blank','noopener,noreferrer');
});
summary();
})();
