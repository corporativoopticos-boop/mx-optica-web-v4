import pathlib,re,sys,hashlib,base64
root=pathlib.Path(sys.argv[1]); main_index=pathlib.Path(sys.argv[2]).read_text()
import json,subprocess
PR=json.loads(subprocess.check_output(['node','-e',"global.window={};require(process.argv[1]);console.log(JSON.stringify(window.MX_PRECIOS))",str((root/'assets/precios.js').resolve())]))
def mx(n): return '${:,}'.format(n)
def okp(e): return e and e.get('autorizado') and isinstance(e.get('precio'),(int,float)) and e['precio']>=0
def expand(s):
    s=re.sub(r'\{\{P:([\w-]+)\}\}',lambda m:('Desde '+mx(PR['paquetes'][m.group(1)]['precio'])) if okp(PR['paquetes'][m.group(1)]) else 'Precio por confirmar',s)
    s=re.sub(r'\{\{T:([\w-]+)\}\}',lambda m:'+'+mx(PR['tratamientos'][m.group(1)]['precio']),s)
    s=re.sub(r'\{\{M:([\w-]+)\}\}',lambda m:('+'+mx(PR['materiales'][m.group(1)]['precio'])) if PR['materiales'][m.group(1)]['precio'] else 'Incluido',s)
    s=s.replace('{{BF}}',mx(PR['promociones']['buen-fin-2026']['precio']))
    G=PR['recargosGraduacion']['escalones']
    s=s.replace('{{GRADOPTS}}',''.join(f'<option value="{e["id"]}">{e["etiqueta"]}</option>' for e in G))
    s=s.replace('{{GRADROWS}}',''.join(f'<tr><td>{e["etiqueta"]}</td><td>{("+"+mx(e["recargo"])) if e["recargo"] else "Sin recargo"}</td></tr>' for e in G))
    s=re.sub(r'\{\{G:(g\d)\}\}',lambda m:'+'+mx(next(e for e in G if e['id']==m.group(1))['recargo']),s)
    s=s.replace('{{BFCOND}}',''.join(f'<li>{c}</li>' for c in PR['promociones']['buen-fin-2026']['condiciones']))
    s=s.replace('{{MIN}}',mx(min(p['precio'] for p in PR['paquetes'].values() if okp(p))))
    assert '{{' not in s, re.findall(r'\{\{[^}]*\}\}',s)
    return s
main_index=expand(main_index)

JSCLASS="<script>document.documentElement.className=document.documentElement.className.replace('no-js','js')</script>"
WA_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M8.5 9.5c.3 2.2 2.3 4.4 4.9 5.2l1.4-1.2 2 1"/></svg>'
def header(P,home):
    h=(lambda a:'#'+a) if home else (lambda a:P+'#'+a)
    logo='./' if home else P
    return f'''<header class="site-header"><div class="wrap header-inner">
  <a class="logo" href="{logo}" aria-label="MX Óptica — inicio"><span class="logo-mark" aria-hidden="true"></span><span>MX <b>ÓPTICA</b></span></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú"><span class="bars" aria-hidden="true"></span></button>
  <nav class="site-nav" id="menu-principal" aria-label="Menú principal">
    <a href="{h('paquetes')}">Paquetes</a><a href="{h('tratamientos')}">Tratamientos</a><a href="{h('servicios')}">Servicios</a><a href="{h('sucursales')}">Sucursales</a>
    <a class="btn btn-primary" href="{h('cotizador')}">Cotizar</a>
  </nav>
</div></header>'''
def footer(P):
    return f'''<footer class="site-footer"><div class="wrap">
  <div class="footer-grid"><div><h3>MX Óptica · Veracruz</h3><p>Ver mejor, vivir mejor. Atención cercana para encontrar los lentes adecuados a tus necesidades, con precios sujetos a confirmación.</p><a href="https://wa.me/522294090925" rel="noopener noreferrer" target="_blank">WhatsApp: 229 409 0925</a></div>
  <div><h3>Sucursales</h3><p><a href="{P}sucursales/plaza-bravo/">Plaza Bravo · Veracruz Centro</a></p><p><a href="{P}sucursales/plaza-maryn/">Plaza Maryn · Boca del Río</a></p></div>
  <div><h3>Redes oficiales</h3><p><a href="https://www.facebook.com/mxoptica" rel="noopener noreferrer" target="_blank">Facebook</a></p><p><a href="https://www.instagram.com/mxoptica/" rel="noopener noreferrer" target="_blank">Instagram</a></p><p><a href="https://www.tiktok.com/@mxoptica" rel="noopener noreferrer" target="_blank">TikTok</a></p></div></div>
  <div class="footer-bottom">© 2026 MX Óptica. Cotizaciones sujetas a verificación de graduación, materiales, tratamiento y disponibilidad. No se cobran pagos en este sitio.</div>
</div>
<a class="wa-float" href="https://wa.me/522294090925" target="_blank" rel="noopener noreferrer" data-wa-location="flotante" aria-label="Escribir a MX Óptica por WhatsApp">{WA_SVG}<span class="wa-label">WhatsApp</span></a>
</footer>
<script src="{P}assets/site.js" defer></script><script src="{P}assets/precios.js" defer></script><script src="{P}assets/quote.js" defer></script><script src="{P}assets/analytics.js" defer></script></body></html>'''
for p in sorted(root.rglob('index.html')):
    t=p.read_text(); depth=len(p.relative_to(root).parts)-1; P='../'*depth; home=depth==0
    head,rest=t.split('</head>',1)
    assert 'G-1YKC3ZT1P1' in head and head.count('gtag/js')==1
    head=head.replace('<html lang="es-MX">','<html lang="es-MX" class="no-js">',1)
    head=head.replace('<meta charset="utf-8">','<meta charset="utf-8">'+JSCLASS,1) if JSCLASS not in head else head
    if home and 'rel="preload"' not in head:
        head=head.replace('<link rel="stylesheet"','<link rel="preload" as="image" href="media/hero-v2-poster.jpg" fetchpriority="high">\n<link rel="stylesheet"',1)
    head=head.replace('content="#e9faff"','content="#07344a"')
    if home:
        body='<body><a class="skip" href="#contenido">Ir al contenido principal</a>\n'+header(P,True)+'\n'+main_index+footer(P)
    else:
        m=re.search(r'<main id="contenido">.*?</main>',rest,re.S); assert m
        mn=m.group(0).replace(P+'index.html#',P+'#').replace('href="'+P+'index.html"','href="'+P+'"')
        mn=expand(mn)
        body='<body><a class="skip" href="#contenido">Ir al contenido principal</a>\n'+header(P,False)+'\n'+mn+'\n'+footer(P)
    p.write_text(head+'</head>'+body); print('ok',p.relative_to(root))
h=hashlib.sha256(JSCLASS[8:-9].encode()).digest(); print('js-class hash sha256-'+base64.b64encode(h).decode())
