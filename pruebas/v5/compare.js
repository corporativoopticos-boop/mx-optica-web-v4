const { chromium } = require('playwright'); const path=require('path'); const O=path.join(__dirname,'out');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[390,844],[1440,900]]){const p=await b.newPage({viewport:{width:w,height:h}});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await p.waitForTimeout(2500);await p.screenshot({path:path.join(O,`v45-home-${w}.png`)});
 const sec=async(sel,name)=>{const el=await p.$(sel); if(el){await el.scrollIntoViewIfNeeded();await p.waitForTimeout(300);await el.screenshot({path:path.join(O,name)});}};
 if(w===390){await sec('#paquetes','v45-paquetes-390.png');await sec('#cotizador','v45-cotizador-390.png');}
 await p.close();
 const q=await b.newPage({viewport:{width:w,height:h}});await q.goto('http://localhost:8765/',{waitUntil:'load'});await q.waitForTimeout(2500);await q.screenshot({path:path.join(O,`v5c-home-${w}.png`)});
 if(w===390){await q.evaluate(()=>document.querySelectorAll('.reveal,.reveal-stagger').forEach(e=>e.classList.add('is-visible')));await q.waitForTimeout(900);
  for(const [s,n] of [['#paquetes','v5-paquetes-390.png'],['#cotizador','v5-cotizador-sec-390.png']]){const el=await q.$(s);await el.screenshot({path:path.join(O,n)});}}
 await q.close();}
await b.close();})();
