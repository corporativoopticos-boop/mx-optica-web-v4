// Pruebas V5 MX Óptica — Playwright/Chromium contra servidor local (http://localhost:8765)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:8765/';
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PAGES = ['', 'sucursales/plaza-bravo/', 'sucursales/plaza-maryn/', 'servicios/lentes-graduados/', 'servicios/cambio-de-micas/', 'servicios/examen-de-la-vista/', 'servicios/lentes-progresivos/'];
const VIEWS = [[360, 740], [390, 844], [430, 932], [1440, 900]];
const results = []; let fails = 0;
const rec = (area, name, pass, detail) => { results.push({ area, name, pass, detail }); if (!pass) fails++; console.log((pass ? 'PASS' : 'FAIL') + ' [' + area + '] ' + name + (detail !== undefined ? ' :: ' + JSON.stringify(detail) : '')); };
const isGoogle = (u) => /googletagmanager|google-analytics/.test(u);

(async () => {
  const browser = await chromium.launch();

  // 1) Responsive, errores JS, recursos, desbordamiento en 7 páginas x 4 tamaños
  for (const [w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    for (const p of PAGES) {
      const page = await ctx.newPage(); const errs = [], bad = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('requestfailed', r => { if (!isGoogle(r.url())) bad.push(r.url()); });
      page.on('response', r => { if (r.status() >= 400 && !isGoogle(r.url())) bad.push(r.status() + ' ' + r.url()); });
      await page.goto(BASE + p, { waitUntil: 'load' }); await page.waitForTimeout(1300);
      const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !e.closest('.cinema-stage'); }).slice(0, 3).map(e => e.className || e.tagName) }));
      rec('responsive', `${w}px /${p} sin desbordamiento horizontal`, ov.sw <= ov.iw, ov);
      rec('robustez', `${w}px /${p} sin errores JS ni recursos rotos`, errs.length === 0 && bad.length === 0, { errs, bad });
      if (p === '' || p === 'sucursales/plaza-bravo/') await page.screenshot({ path: path.join(OUT, `v5-${p ? 'sucursal' : 'home'}-${w}.png`), fullPage: false });
      if (p === '' && w !== 1440) { await page.evaluate(() => document.querySelectorAll('.reveal,.reveal-stagger').forEach(e => e.classList.add('is-visible'))); await page.waitForTimeout(900); } if (p === '' && w !== 1440) await page.screenshot({ path: path.join(OUT, `v5-home-full-${w}.png`), fullPage: true });
      await page.close();
    }
    await ctx.close();
  }

  // 2) Video y póster
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const v = await page.evaluate(() => { const v = document.getElementById('heroVideo'), i = document.querySelector('.cinema-poster'); return { ready: v && v.readyState, paused: v && v.paused, playing: v && v.classList.contains('is-playing'), vw: v && v.videoWidth, vh: v && v.videoHeight, src: v && v.currentSrc.split('/').pop(), poster: i.complete && i.naturalWidth, toggle: !document.getElementById('heroVideoToggle').hidden }; });
    rec('video', 'Video se carga y reproduce (readyState≥3, 720×1280)', v.ready >= 3 && !v.paused && v.playing && v.vw === 720 && v.vh === 1280, v);
    rec('video', 'Póster cargado (720 px) y botón pausar visible', v.poster === 720 && v.toggle, v);
    await page.click('#heroVideoToggle'); const pz = await page.evaluate(() => [document.getElementById('heroVideo').paused, document.getElementById('heroVideoToggle').textContent]);
    rec('video', 'Botón pausa detiene el video', pz[0] === true && /Reproducir/.test(pz[1]), pz);
    await ctx.close();
    const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const rp = await rctx.newPage(); await rp.goto(BASE, { waitUntil: 'load' }); await rp.waitForTimeout(800);
    const r = await rp.evaluate(() => ({ video: !!document.getElementById('heroVideo'), poster: document.querySelector('.cinema-poster').naturalWidth, revealHidden: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity !== '1').length }));
    rec('video', 'prefers-reduced-motion: sin video, póster visible, contenido sin animación oculta', !r.video && r.poster === 720 && r.revealHidden === 0, r);
    await rp.screenshot({ path: path.join(OUT, 'v5-home-390-reduced-motion.png') });
    await rctx.close();
  }

  // 3) Menú y navegación
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); await page.goto(BASE + 'sucursales/plaza-maryn/', { waitUntil: 'load' });
    const vis = () => page.evaluate(() => { const n = document.getElementById('menu-principal'); return getComputedStyle(n).visibility; });
    rec('menu', 'Menú móvil cerrado al inicio', (await vis()) === 'hidden');
    await page.click('.menu-toggle'); await page.waitForTimeout(350);
    rec('menu', 'Menú abre y aria-expanded=true', (await vis()) === 'visible' && (await page.getAttribute('.menu-toggle', 'aria-expanded')) === 'true');
    await page.screenshot({ path: path.join(OUT, 'v5-menu-390.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(350);
    rec('menu', 'Escape cierra el menú', (await vis()) === 'hidden');
    await page.click('.menu-toggle'); await page.waitForTimeout(300);
    await Promise.all([page.waitForURL(/#cotizador$/), page.click('#menu-principal >> text=Cotizar')]);
    await page.waitForTimeout(2500);
    const at = await page.evaluate(() => { const r = document.getElementById('cotizador').getBoundingClientRect(); return { top: Math.round(r.top), path: location.pathname }; });
    rec('menu', 'Enlace «Cotizar» de subpágina lleva a la portada #cotizador', at.path === '/' && at.top < 200 && at.top > -50, at);
    // Rastreo de enlaces internos
    const links = new Set();
    for (const p of PAGES) { await page.goto(BASE + p); (await page.$$eval('a[href]', as => as.map(a => a.href))).forEach(h => links.add(h)); }
    const internal = [...links].filter(h => h.startsWith(BASE));
    const broken = [];
    for (const h of internal) {
      const u = new URL(h); const r = await page.request.get(u.origin + u.pathname); if (r.status() !== 200) broken.push(h);
      if (u.hash && u.pathname === '/') { await page.goto(u.origin + '/'); if (!(await page.$(u.hash))) broken.push('ancla ' + h); }
    }
    rec('navegacion', `Enlaces internos y anclas válidos (${internal.length})`, broken.length === 0, broken);
    await ctx.close();
  }

  // 4) Cotizador, cálculos, WhatsApp y GA4
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
    const page = await ctx.newPage(); await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(500);
    const st0 = await page.evaluate(() => [document.getElementById('res-precio').textContent, document.getElementById('res-estado').textContent, [...document.querySelectorAll('[data-price-for]')].map(e => e.textContent)]);
    rec('cotizador', 'Sin precios autorizados: muestra «Por confirmar» y «sujeta a validación»; tarjetas sin importes', st0[0] === 'Por confirmar' && /validación/.test(st0[1]) && st0[2].every(t => t === 'Precio por confirmar'), st0);
    const html = await page.content();
    rec('precios', 'No se publican importes históricos no autorizados (550/1125/1189/1470)', !/\$\s?(550|1,?125|1,?189|1,?470)\b/.test(html));
    // Atajo desde tarjeta
    await page.click('[data-pick-pkg="progresivo"]'); await page.waitForTimeout(900);
    await page.click('[data-pick-trt="triple"]').catch(async () => { await page.evaluate(() => document.querySelector('[data-pick-trt="triple"]').click()); }); await page.waitForTimeout(900);
    const pick = await page.evaluate(() => [document.getElementById('tipo-lente').value, document.getElementById('tratamiento').value, document.getElementById('res-tipo').textContent, document.getElementById('res-tratamiento').textContent]);
    rec('cotizador', 'Tarjetas preseleccionan paquete y tratamiento en el cotizador', pick[0] === 'progresivo' && pick[1] === 'triple' && pick[2] === 'Progresivo', pick);
    await page.screenshot({ path: path.join(OUT, 'v5-cotizador-390.png'), fullPage: false });
    // Cálculos (función pura con tabla de prueba; no altera precios reales)
    const calc = await page.evaluate(() => {
      const T = { paquetes: { a: { precio: 1000, autorizado: true }, b: { precio: 800, autorizado: false }, c: { precio: null, autorizado: true } }, materiales: { m: { precio: 200, autorizado: true }, z: { precio: 0, autorizado: true }, n: { precio: null, autorizado: false } }, tratamientos: { t: { precio: 300, autorizado: true }, s: { precio: 0, autorizado: true }, x: { precio: -5, autorizado: true } } };
      const c = (paquete, material, tratamiento, receta = 'tengo-receta') => window.MXQuote.calc(T, { paquete, material, tratamiento, receta });
      return { suma: c('a', 'm', 't'), cero: c('a', 'z', 's'), noAut: c('b', 'm', 't'), nulo: c('c', 'm', 't'), matNulo: c('a', 'n', 't'), negativo: c('a', 'm', 'x'), especial: c('a', 'm', 't', 'receta-especial'), servicio: c('cambio-de-micas', 'm', 't'), sinReceta: c('a', 'm', 't', 'necesito-orientacion') };
    });
    rec('calculos', 'Suma autorizada 1000+200+300 = 1500', calc.suma.estado === 'autorizado' && calc.suma.total === 1500, calc.suma);
    rec('calculos', 'Adicionales en 0 autorizados = solo base', calc.cero.total === 1000, calc.cero);
    rec('calculos', 'Paquete no autorizado → validación', calc.noAut.estado === 'validacion' && calc.noAut.total === null);
    rec('calculos', 'Precio null aunque autorizado → validación (null nunca es gratis)', calc.nulo.estado === 'validacion' && calc.matNulo.estado === 'validacion');
    rec('calculos', 'Precio negativo rechazado', calc.negativo.estado === 'validacion');
    rec('calculos', 'Graduación especial → revisión', calc.especial.estado === 'validacion' && /especial/.test(calc.especial.motivo));
    rec('calculos', 'Servicio personalizado → validación', calc.servicio.estado === 'validacion');
    rec('calculos', 'Sin receta con precio autorizado → aviso de confirmación', calc.sinReceta.estado === 'autorizado' && /graduación/.test(calc.sinReceta.motivo), calc.sinReceta);
    // Envío a WhatsApp con datos personales de prueba en el texto libre
    await page.selectOption('#material', 'policarbonato'); await page.selectOption('#receta', 'receta-especial'); await page.selectOption('#sucursal', 'plaza-maryn');
    await page.fill('#detalle', 'Soy Ana Prueba, mi tel 2290000000, correo ana@example.com, graduación -6.50');
    const dl0 = await page.evaluate(() => dataLayer.length);
    await page.click('.quote-submit'); await page.waitForTimeout(400);
    const out = await page.evaluate(() => ({ opened: window.__opened, href: document.getElementById('wa-send').getAttribute('href'), hidden: document.getElementById('wa-send').hidden }));
    const msg = decodeURIComponent((out.opened[0] || '').split('text=')[1] || '');
    rec('whatsapp', 'Abre wa.me/522294090925 con paquete, material, tratamiento, graduación, sucursal y precio', out.opened.length === 1 && out.opened[0].startsWith('https://wa.me/522294090925?text=') && /Progresivo/.test(msg) && /Policarbonato/.test(msg) && /Triple/.test(msg) && /alta o especial/.test(msg) && /Plaza Maryn/.test(msg) && /Precio: por confirmar/.test(msg), msg);
    rec('whatsapp', 'Botón #wa-send visible y sin el mensaje en el href', !out.hidden && out.href === 'https://wa.me/522294090925', out.href);
    await page.click('#wa-send'); await page.waitForTimeout(200);
    await page.click('.wa-float'); await page.waitForTimeout(200);
    const ev = await page.evaluate((n) => dataLayer.slice(n).map(x => Array.from(x)), dl0);
    const dlAll = await page.evaluate(() => JSON.stringify(dataLayer));
    const cot = ev.filter(e => e[0] === 'event' && e[1] === 'cotizacion_solicitud');
    const wa = ev.filter(e => e[0] === 'event' && e[1] === 'whatsapp_click');
    rec('ga4', 'Una sola configuración G-1YKC3ZT1P1', (await page.evaluate(() => dataLayer.filter(x => x[0] === 'config' && x[1] === 'G-1YKC3ZT1P1').length)) === 1);
    rec('ga4', 'cotizacion_solicitud una vez con parámetros de lista cerrada', cot.length === 1 && JSON.stringify(cot[0][2]) === JSON.stringify({ tipo_lente: 'progresivo', material: 'policarbonato', tratamiento: 'triple', sucursal: 'plaza_maryn' }), cot);
    rec('ga4', 'whatsapp_click una vez por clic (mensaje preparado y flotante)', wa.length === 2 && wa[0][2].link_location === 'cotizador_mensaje' && wa[1][2].link_location === 'flotante', wa);
    rec('ga4', 'Sin datos personales en dataLayer (nombre, tel, correo, graduación, texto libre)', !/Ana|2290000000|example\.com|6\.50|receta/i.test(dlAll));
    await ctx.close();
  }

  // 5) SEO
  {
    const ctx = await browser.newContext(); const page = await ctx.newPage(); const seo = [];
    for (const p of PAGES) {
      await page.goto(BASE + p);
      const s = await page.evaluate(() => ({ title: document.title, desc: document.querySelector('meta[name=description]')?.content, canon: document.querySelector('link[rel=canonical]')?.href, og: document.querySelector('meta[property="og:url"]')?.content, h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return true } catch { return false } }), imgNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length, robotsMeta: document.querySelector('meta[name=robots]')?.content || null }));
      seo.push([p, s]);
      rec('seo', `/${p} título, descripción, canonical mxoptica.com, 1 h1, JSON-LD válido`, s.title.length > 10 && s.desc && s.canon === 'https://mxoptica.com/' + p && s.og === s.canon && s.h1 === 1 && s.lang === 'es-MX' && s.ld.length >= 1 && s.ld.every(Boolean) && s.imgNoAlt === 0 && !s.robotsMeta, s);
    }
    const sm = await (await page.request.get(BASE + 'sitemap.xml')).text(); const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    rec('seo', 'sitemap.xml con 7 URLs que coinciden con las páginas', locs.length === 7 && PAGES.every(p => locs.includes('https://mxoptica.com/' + p)), locs);
    const rb = await (await page.request.get(BASE + 'robots.txt')).text();
    rec('seo', 'robots.txt intacto (Allow / y Sitemap)', /Allow: \//.test(rb) && /Sitemap: https:\/\/mxoptica.com\/sitemap.xml/.test(rb));
    await ctx.close();
  }

  // 6) Accesibilidad (axe-core WCAG 2.1 AA)
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: 'load' }); await page.addScriptTag({ content: AXE });
      const r = await page.evaluate(async () => { const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }); return res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0, 2).map(n => n.target.join(' ')) })); });
      const serious = r.filter(v => v.impact === 'serious' || v.impact === 'critical');
      rec('a11y', `${w}px /${p} axe sin violaciones graves/críticas`, serious.length === 0, r);
    }
    await ctx.close();
  }
  // Teclado: foco visible y orden
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); await page.goto(BASE);
    await page.keyboard.press('Tab'); const f1 = await page.evaluate(() => document.activeElement.className);
    await page.keyboard.press('Enter'); await page.waitForTimeout(300); const f2 = await page.evaluate(() => location.hash);
    rec('a11y', 'Primer Tab enfoca «Ir al contenido» y funciona', f1 === 'skip' && f2 === '#contenido', [f1, f2]);
    await ctx.close();
  }

  // 7) Rendimiento (Chromium, red local; complementar con Lighthouse/PageSpeed en vivo)
  for (const [label, opts] of [['móvil 390 + 4G simulada', { viewport: { width: 390, height: 844 } }], ['escritorio 1440', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await browser.newContext(opts); const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (label.startsWith('móvil')) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8 * 4, uploadThroughput: 750 * 1024 / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    await page.addInitScript(() => { window.__lcp = 0; window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(3500);
    const m = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource').filter(r => !/google/.test(r.name)); const kb = (res.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) + (n.transferSize || 0)) / 1024; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { fcp: Math.round(fcp ? fcp.startTime : -1), lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3), dcl: Math.round(n.domContentLoadedEventEnd), kb: Math.round(kb), requests: res.length + 1 }; });
    rec('rendimiento', `${label}: LCP < 2.5 s y CLS < 0.1`, m.lcp > 0 && m.lcp < 2500 && m.cls < 0.1, m);
    await ctx.close();
  }

  // 8) Seguridad básica (estático)
  {
    const root = '/home/user/mx-optica-web-v4/sitio'; const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(root);
    const text = files.filter(f => /\.(html|js|css|txt|xml)$|_headers$/.test(f)).map(f => [f.replace(root, ''), fs.readFileSync(f, 'utf8')]);
    const hits = text.filter(([f, t]) => /(api[_-]?key|secret|password|token|access_token|APP_USR-|mercadopago|localStorage|costo interno)/i.test(t)).map(([f]) => f);
    rec('seguridad', 'Sin credenciales, Mercado Pago, panel admin ni almacenamiento local en archivos públicos', hits.length === 0, hits);
    const ext = text.flatMap(([f, t]) => [...t.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map(m => m[1]));
    rec('seguridad', 'Único script externo: Google Tag (GA4)', ext.every(u => u.startsWith('https://www.googletagmanager.com/gtag/js?id=G-1YKC3ZT1P1')), [...new Set(ext)]);
    const blank = text.flatMap(([f, t]) => [...t.matchAll(/<a [^>]*target="_blank"[^>]*>/g)].map(m => m[0])).filter(a => !/noopener/.test(a));
    rec('seguridad', 'Todos los target=_blank con rel=noopener', blank.length === 0, blank);
    const hd = fs.readFileSync(root + '/_headers', 'utf8');
    rec('seguridad', '_headers: nosniff, DENY, Referrer-Policy, CSP (report-only), noindex solo en *.pages.dev', /nosniff/.test(hd) && /X-Frame-Options: DENY/.test(hd) && /Content-Security-Policy-Report-Only/.test(hd) && /pages\.dev\/\*\n\s+X-Robots-Tag: noindex/.test(hd) && !/^\/\*\n(?:.*\n)*?\s+X-Robots-Tag/m.test(hd.split('\n\n')[0]));
    // CSP: aplicar la política en modo ESTRICTO localmente y comprobar que el sitio no la viola
    const ctx = await browser.newContext(); const page = await ctx.newPage(); const viol = [];
    const csp = hd.match(/Content-Security-Policy-Report-Only: (.*)/)[1];
    await page.route('**/*', async (route) => { const r = await route.fetch().catch(() => null); if (!r) return route.abort(); const hdrs = { ...r.headers() }; if ((hdrs['content-type'] || '').includes('text/html')) hdrs['content-security-policy'] = csp; route.fulfill({ response: r, headers: hdrs }); });
    page.on('console', m => { if (/Content Security Policy|Refused/.test(m.text())) viol.push(m.text().slice(0, 160)); });
    for (const p of PAGES) { await page.goto(BASE + p, { waitUntil: 'load' }); await page.waitForTimeout(200); }
    rec('seguridad', 'CSP aplicada en modo estricto: sin violaciones en las 7 páginas (local)', viol.length === 0, viol);
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), total: results.length, fallos: fails, results }, null, 1));
  console.log(`\nTOTAL ${results.length} · FALLOS ${fails}`);
})();
