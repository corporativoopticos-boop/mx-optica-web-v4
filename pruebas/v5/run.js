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

  // 4) Cotizador V5.1, cálculos con precios reales, promociones temporales, WhatsApp y GA4
  {
    const D = (s) => new Date(s);
    // 4a) Cálculos puros con la tabla real (assets/precios.js)
    {
      const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(BASE, { waitUntil: 'load' });
      const R = await page.evaluate(() => {
        const T = window.MX_PRECIOS, c = (paquete, tratamientos = [], material = 'estandar', graduacion = 'g0', now, astig = 'hasta2') => window.MXQuote.calc(T, { paquete, tratamientos, material, graduacion, astig }, now ? new Date(now) : new Date('2026-11-09T12:00:00-06:00'));
        const s = (r) => ({ e: r.estado, t: r.total, m: r.motivo, d: r.desglose.map(x => x.importe), min: r.minimo, va: r.valorAnalitica, rev: !!r.revision });
        return {
          promo: s(c('mono-br-promo')), promoAR: s(c('mono-br-promo', ['antirreflejante'])), promoHI: s(c('mono-br-promo', [], 'hi-index')), promoBR: s(c('mono-br-promo', ['blue-ray'])),
          brAR: s(c('mono-br', ['antirreflejante'])), brAR_pkg: s(c('mono-br-ar')), brDup: s(c('mono-br', ['blue-ray'])), brarDup: s(c('mono-br-ar', ['antirreflejante', 'blue-ray', 'antirreflejante'])),
          hi: s(c('mono-br', [], 'hi-index')), shi: s(c('mono-br-ar', ['fotocromatico'], 'super-hi-index')), matInvalido: s(c('mono-br', [], 'ultra')),
          bifHI: s(c('bifocal', [], 'hi-index')), progSHI: s(c('progresivo-ar', [], 'super-hi-index')),
          bifAR: s(c('bifocal', ['antirreflejante'])), bifAR_pkg: s(c('bifocal-ar')), progAR: s(c('progresivo', ['antirreflejante'])), progAR_pkg: s(c('progresivo-ar')),
          progFull: s(c('progresivo-ar', ['blue-ray', 'fotocromatico'])), bifBR: s(c('bifocal-ar', ['blue-ray'])),
          monoBasico: s(c('mono-basico')), fotoCompleto: s(c('foto-completo')), examen: s(c('examen-visual')), micas: s(c('cambio-de-micas')),
          tiers: ['g0','g1','g2','g3','g4','g5'].map(g => c('mono-br', [], 'estandar', g).total), tierDesglose: s(c('mono-br', [], 'estandar', 'g3')),
          gradHI: s(c('mono-br', [], 'hi-index', 'g3')), gradBRAR: s(c('mono-br-ar', ['fotocromatico'], 'super-hi-index', 'g5')),
          bifG5: s(c('bifocal', [], 'estandar', 'g5')), progG4: s(c('progresivo-ar', [], 'estandar', 'g4')), bifNose: s(c('bifocal', [], 'estandar', 'nose')),
          monoNose: s(c('mono-br', ['antirreflejante'], 'estandar', 'nose')), promoG0: s(c('mono-br-promo', [], 'estandar', 'g0')), promoG2: s(c('mono-br-promo', [], 'estandar', 'g2')), promoNose: s(c('mono-br-promo', [], 'estandar', 'nose')),
          bfAstig: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-15T12:00:00-06:00', 'mas2')), bfOk: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-15T12:00:00-06:00', 'hasta2')), bfG3: s(c('buen-fin-2026', [], 'estandar', 'g3', '2026-11-15T12:00:00-06:00', 'hasta2')), bfAstigNose: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-15T12:00:00-06:00', 'nose')),
          bfCond: T.promociones['buen-fin-2026'].condiciones,
          bfAntes: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-12T23:59:59-06:00')), bfInicio: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-13T00:00:00-06:00')),
          bfFin: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-17T23:59:59-06:00')), bfDespues: s(c('buen-fin-2026', [], 'estandar', 'g0', '2026-11-18T00:00:00-06:00')),
          bfExtras: s(c('buen-fin-2026', ['antirreflejante'], 'hi-index', 'g0', '2026-11-15T12:00:00-06:00')),
          estados: ['2026-11-12T23:59:59-06:00', '2026-11-13T00:00:00-06:00', '2026-11-17T23:59:59-06:00', '2026-11-18T00:00:00-06:00'].map(d => window.MXQuote.promoEstado(T.promociones['buen-fin-2026'], new Date(d)))
        };
      });
      const eq = (r, t) => r.e === 'desde' && r.t === t;
      rec('calculos', 'Promoción $980 sola = desde $980', eq(R.promo, 980), R.promo);
      rec('calculos', 'Promoción $980 + antirreflejante o material especial → no se suma (por confirmar)', R.promoAR.e === 'validacion' && R.promoHI.e === 'validacion' && /no incluye antirreflejante/.test(R.promoAR.m), [R.promoAR, R.promoHI]);
      rec('calculos', 'Promoción $980 + Blue Ray (ya incluido) = $980 sin duplicar', eq(R.promoBR, 980), R.promoBR);
      rec('calculos', 'Monofocal BR $1,125 + AR $290 = $1,415 = paquete BR+AR', eq(R.brAR, 1415) && eq(R.brAR_pkg, 1415), [R.brAR, R.brAR_pkg]);
      rec('calculos', 'Sin duplicar tratamientos incluidos (BR en BR; AR y BR en BR+AR; repetidos)', eq(R.brDup, 1125) && eq(R.brarDup, 1415), [R.brDup, R.brarDup]);
      rec('calculos', 'Hi-Index +$400 en monofocal ($1,525); Super Hi-Index +$1,090 con fotocromático ($3,180)', eq(R.hi, 1525) && eq(R.shi, 1415 + 675 + 1090), [R.hi, R.shi]);
      rec('calculos', 'Material desconocido → por confirmar', R.matInvalido.e === 'validacion', R.matInvalido);
      rec('calculos', 'Hi-Index / Super Hi-Index NO se aplican a bifocal ni progresivo', R.bifHI.e === 'validacion' && R.progSHI.e === 'validacion', [R.bifHI, R.progSHI]);
      rec('calculos', 'Bifocal $899 + AR = $1,189 y Progresivo $1,470 + AR = $1,760 (coinciden con paquetes AR)', eq(R.bifAR, 1189) && eq(R.bifAR_pkg, 1189) && eq(R.progAR, 1760) && eq(R.progAR_pkg, 1760));
      rec('calculos', 'Progresivo AR + Blue Ray + Fotocromático = $3,010; Bifocal AR + BR = $1,764', eq(R.progFull, 3010) && eq(R.bifBR, 1764), [R.progFull, R.bifBR]);
      rec('calculos', 'Monofocal básico y Fotocromático completo → precio por confirmar', R.monoBasico.e === 'validacion' && R.monoBasico.t === null && R.fotoCompleto.e === 'validacion');
      rec('calculos', 'Examen visual → gratuito, sin importe; servicios → personalizado', R.examen.e === 'validacion' && /gratuito/.test(R.examen.m) && R.micas.e === 'validacion');
      rec('recargos', 'Escalones monofocal: 0 / 350 / 550 / 750 / 1,100 / 1,550 sobre $1,125', JSON.stringify(R.tiers) === JSON.stringify([1125, 1475, 1675, 1875, 2225, 2675]), R.tiers);
      rec('recargos', 'Un solo escalón por cotización (una sola línea de recargo)', JSON.stringify(R.tierDesglose.d) === JSON.stringify([1125, 750]), R.tierDesglose);
      rec('recargos', 'Recargo independiente de Hi-Index: $1,125 + Hi-Index $400 + recargo $750 = $2,275 en líneas separadas', R.gradHI.t === 2275 && JSON.stringify(R.gradHI.d) === JSON.stringify([1125, 400, 750]), R.gradHI);
      rec('recargos', 'BR+AR + fotocromático + Super Hi-Index + recargo ≥10.25 = $1,415+675+1,090+1,550 = $4,730', R.gradBRAR.t === 4730, R.gradBRAR);
      rec('recargos', 'Sin recargo en bifocales ni progresivos (Bifocal ≥10.25 = $899; Progresivo AR 8.25–10 = $1,760)', R.bifG5.t === 899 && R.progG4.t === 1760 && R.bifNose.e === 'desde', [R.bifG5, R.progG4]);
      rec('recargos', 'Monofocal sin graduación conocida → sujeto a validación, mínimo desde base + adicionales ($1,415)', R.monoNose.e === 'validacion' && R.monoNose.t === null && R.monoNose.min === 1415 && /graduación/.test(R.monoNose.m), R.monoNose);
      rec('recargos', 'Promoción $980: hasta 2.00 = $980; con recargo o sin graduación → validación sin sumar', R.promoG0.t === 980 && R.promoG2.e === 'validacion' && R.promoG2.min === 980 && /no acumula/.test(R.promoG2.m) && R.promoNose.e === 'validacion', [R.promoG0, R.promoG2, R.promoNose]);
      rec('recargos', 'Valor para GA4 excluye el recargo por graduación (no permite inferir la receta)', R.tierDesglose.va === 1125 && R.gradHI.va === 1525, [R.tierDesglose.va, R.gradHI.va]);
      rec('promociones', 'Buen Fin: astigmatismo >2.00 D → valoración; ≤2.00 y hasta ±2.00 → $2,499 sin revisión; graduación alta o astigmatismo desconocido → $2,499 con aviso de valoración', R.bfAstig.e === 'validacion' && /2\.00 D/.test(R.bfAstig.m) && R.bfOk.e === 'promo' && !R.bfOk.rev && R.bfG3.t === 2499 && R.bfG3.rev && R.bfAstigNose.rev, [R.bfAstig, R.bfOk, R.bfG3]);
      rec('promociones', 'Buen Fin: 9 condiciones del propietario registradas', R.bfCond.length === 9 && R.bfCond.includes('Astigmatismo hasta 2.00 D.') && R.bfCond.includes('No aplica en bifocales ni progresivos.') && R.bfCond.includes('Segundo par de línea con micas monofocales sencillas sin tratamientos.'), R.bfCond);
      rec('promociones', 'Buen Fin: estados próxima / vigente (inicio y último segundo) / finalizada en hora de México', JSON.stringify(R.estados) === JSON.stringify(['proxima', 'vigente', 'vigente', 'finalizada']), R.estados);
      rec('promociones', 'Buen Fin: sin precio antes y después; $2,499 durante la vigencia', R.bfAntes.e === 'validacion' && R.bfDespues.e === 'validacion' && R.bfInicio.e === 'promo' && R.bfInicio.t === 2499 && R.bfFin.t === 2499);
      rec('promociones', 'Buen Fin no combinable: los adicionales no se suman', R.bfExtras.e === 'promo' && R.bfExtras.t === 2499 && /no combinable/i.test(R.bfExtras.m), R.bfExtras);
      // Texto estático (sin JS) = texto calculado desde precios.js
      const raw = await (await page.request.get(BASE)).text();
      const staticP = [...raw.matchAll(/data-price-for="([\w-]+)">([^<]+)</g)].map(m => [m[1], m[2]]);
      const live = await page.$$eval('[data-price-for]', els => els.map(e => [e.dataset.priceFor, e.textContent]));
      rec('precios', 'Precios del HTML estático idénticos a los calculados desde precios.js', staticP.length >= 9 && JSON.stringify(staticP) === JSON.stringify(live), { staticP, live });
      const expected = { 'mono-br-promo': 'Desde $980', 'mono-br': 'Desde $1,125', 'mono-br-ar': 'Desde $1,415', 'mono-basico': 'Precio por confirmar', 'bifocal': 'Desde $899', 'bifocal-ar': 'Desde $1,189', 'progresivo': 'Desde $1,470', 'progresivo-ar': 'Desde $1,760', 'foto-completo': 'Precio por confirmar' };
      rec('precios', 'Precios publicados = información del propietario (7 «desde» y 2 «por confirmar»)', live.every(([k, v]) => expected[k] === v), live);
      const adds = await page.$$eval('[data-add-price],[data-mat-price]', els => els.map(e => (e.dataset.addPrice || e.dataset.matPrice) + '=' + e.textContent));
      rec('precios', 'Adicionales publicados: AR +$290, Blue Ray +$575, Fotocromático +$675, Hi-Index +$400, Super Hi-Index +$1,090', JSON.stringify(adds) === JSON.stringify(['antirreflejante=+$290', 'blue-ray=+$575', 'fotocromatico=+$675', 'hi-index=+$400', 'super-hi-index=+$1,090']), adds);
      await ctx.close();
    }
    // 4b) Promoción temporal en la interfaz con reloj simulado (antes, durante, después)
    for (const [fecha, esperado] of [['2026-11-09T12:00:00-06:00', 'proxima'], ['2026-11-14T12:00:00-06:00', 'vigente'], ['2026-11-18T09:00:00-06:00', 'finalizada']]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date(fecha));
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(300);
      const u = await page.evaluate(() => { const box = document.querySelector('section[data-promo]'), o = document.querySelector('#tipo-lente option[value="buen-fin-2026"]'), faq = document.querySelector('details[data-promo]'); return { hidden: box.hidden, state: box.querySelector('[data-promo-state]').textContent, opt: o ? (o.disabled ? 'disabled' : 'enabled') : 'removed', optText: o && o.textContent, cta: (() => { const b = box.querySelector('[data-pick-pkg]'); return !box.hidden && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height > 0; })(), faq: faq.hidden }; });
      const okUI = esperado === 'proxima' ? (!u.hidden && u.state === 'Próximamente' && u.opt === 'disabled' && /próximamente/.test(u.optText) && !u.cta && !u.faq)
        : esperado === 'vigente' ? (!u.hidden && u.state === 'Promoción vigente' && u.opt === 'enabled' && u.cta && !u.faq)
        : (u.hidden && u.opt === 'removed' && u.faq);
      rec('promociones', `Interfaz Buen Fin ${fecha.slice(0, 10)} → ${esperado}`, okUI, u);
      if (esperado === 'vigente') {
        const conds = await page.$$eval('section[data-promo] [data-promo-cond] li', l => l.map(x => x.textContent));
        rec('promociones', 'Buen Fin vigente muestra las 9 condiciones en la portada', conds.length === 9 && conds[2] === 'Primer par con armazón de marca participante y antirreflejante.', conds);
        await page.evaluate(() => document.querySelector('section[data-promo]').scrollIntoView({behavior:'instant',block:'center'})); await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(OUT, 'v51-buenfin-vigente-390.png') });
        await page.click('[data-pick-pkg="buen-fin-2026"]'); await page.waitForTimeout(900);
        const p = await page.evaluate(() => [document.getElementById('tipo-lente').value, document.getElementById('res-precio').textContent, document.getElementById('res-estado').textContent]);
        rec('promociones', 'Durante Buen Fin el botón selecciona la promoción y muestra $2,499 (2 pares)', p[0] === 'buen-fin-2026' && p[1] === '$2,499' && /2 pares/.test(p[2]), p);
      }
      if (esperado === 'proxima') { await page.evaluate(() => document.querySelector('section[data-promo]').scrollIntoView({behavior:'instant',block:'center'})); await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, 'v51-buenfin-proxima-390.png') }); }
      await ctx.close();
    }
    // 4c) Interacción del cotizador, WhatsApp y GA4
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
    const page = await ctx.newPage(); await page.clock.setFixedTime(new Date('2026-11-09T12:00:00-06:00'));
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(500);
    const st = () => page.evaluate(() => ({ pkg: document.getElementById('tipo-lente').value, trt: [...document.querySelectorAll('input[name=trt]')].map(b => b.value + ':' + (b.checked ? 'on' : 'off') + (b.disabled ? '/bloq' : '') + ':' + b.closest('.opt').querySelector('.opt-tag').textContent), mat: [...document.querySelectorAll('input[name=material]')].map(r => r.value + (r.checked ? '*' : '') + (r.disabled ? '/bloq' : '')), precio: document.getElementById('res-precio').textContent, live: document.getElementById('live-precio').textContent, estado: document.getElementById('res-estado').textContent, desglose: [...document.querySelectorAll('#res-desglose li')].map(l => l.textContent) }));
    const s0 = await st();
    const waVis0 = await page.$eval('#wa-send', e => getComputedStyle(e).display);
    rec('whatsapp', 'Botón «Abrir el mensaje preparado» oculto hasta preparar la cotización', waVis0 === 'none', waVis0);
    rec('cotizador', 'Estado inicial: promoción $980, Blue Ray «Incluido», otros adicionales bloqueados, precio desde $980', s0.pkg === 'mono-br-promo' && s0.precio === 'Desde $980' && s0.live === 'Desde $980' && s0.trt.includes('blue-ray:on/bloq:Incluido') && s0.trt.includes('antirreflejante:off/bloq:+$290'), s0);
    await page.selectOption('#tipo-lente', 'mono-br'); await page.check('input[name=trt][value=antirreflejante]'); await page.check('input[name=material][value=hi-index]');
    const s1 = await st();
    rec('cotizador', 'Sin graduación: Monofocal BR + AR + Hi-Index → «Desde $1,815» sujeto a validación', s1.precio === 'Desde $1,815' && JSON.stringify(s1.desglose) === JSON.stringify(['Monofocal Blue Ray$1,125', 'Antirreflejante$290', 'Material Hi-Index$400']), s1);
    await page.selectOption('#graduacion', 'g2');
    const s1b = await st();
    rec('cotizador', 'Con graduación ±4.25–6.00: suma un recargo de $550 en línea propia (desde $2,365)', s1b.precio === 'Desde $2,365' && s1b.desglose.includes('Recargo por graduación (±4.25 a ±6.00 D)$550') && /validación/.test(s1b.estado), s1b);
    await page.check('input[name=material][value=super-hi-index]');
    const s2 = await st();
    rec('cotizador', 'Hi-Index y Super Hi-Index excluyentes en la interfaz (solo uno marcado)', s2.mat.filter(m => m.includes('*')).length === 1 && s2.mat.includes('super-hi-index*') && s2.precio === 'Desde $3,055', s2);
    await page.selectOption('#tipo-lente', 'progresivo-ar');
    const s3 = await st();
    rec('cotizador', 'Al elegir progresivo: material vuelve a estándar y Hi-Index se bloquea; AR queda «Incluido»', s3.mat.includes('estandar*') && s3.mat.includes('hi-index/bloq') && s3.trt.includes('antirreflejante:on/bloq:Incluido') && s3.precio === 'Desde $1,760', s3);
    await page.click('[data-pick-trt="fotocromatico"]').catch(() => page.evaluate(() => document.querySelector('[data-pick-trt="fotocromatico"]').click())); await page.waitForTimeout(900);
    const s4 = await st();
    rec('cotizador', 'Tarjeta «Agregar» marca el tratamiento en el cotizador (Progresivo AR + Fotocromático = $2,435)', s4.trt.includes('fotocromatico:on:+$675') && s4.precio === 'Desde $2,435', s4);
    await page.screenshot({ path: path.join(OUT, 'v51-cotizador-390.png') });
    // WhatsApp + GA4
    await page.selectOption('#tipo-lente', 'mono-br-ar'); await page.selectOption('#sucursal', 'plaza-maryn'); await page.selectOption('#graduacion', 'g1'); await page.selectOption('#astigmatismo', 'hasta2'); await page.uncheck('input[name=trt][value=fotocromatico]');
    await page.click('.more summary'); await page.fill('#detalle', 'Soy Ana Prueba, mi tel 2290000000, correo ana@example.com, graduación -6.50');
    const dl0 = await page.evaluate(() => dataLayer.length);
    await page.click('.quote-submit'); await page.waitForTimeout(400);
    const out = await page.evaluate(() => ({ opened: window.__opened, href: document.getElementById('wa-send').getAttribute('href') }));
    const msg = decodeURIComponent((out.opened[0] || '').split('text=')[1] || '');
    rec('whatsapp', 'Mensaje prellenado con paquete, incluidos, material, graduación, sucursal y «desde $1,765» (con recargo)', out.opened.length === 1 && /Monofocal Blue Ray \+ Antirreflejante/.test(msg) && /Blue Ray \(incluido\)/.test(msg) && /Antirreflejante \(incluido\)/.test(msg) && /Material: Estándar/.test(msg) && /Plaza Maryn/.test(msg) && /Graduación más alta: ±2\.25 a ±4\.00 D/.test(msg) && /desde \$1,765 MXN/.test(msg), msg);
    rec('whatsapp', '#wa-send sin el mensaje en el href', out.href === 'https://wa.me/522294090925');
    await page.click('.wa-float'); await page.waitForTimeout(200);
    const ev = await page.evaluate((n) => dataLayer.slice(n).map(x => Array.from(x)), dl0); const dlAll = await page.evaluate(() => JSON.stringify(dataLayer));
    const cot = ev.filter(e => e[0] === 'event' && e[1] === 'cotizacion_solicitud'), wa = ev.filter(e => e[0] === 'event' && e[1] === 'whatsapp_click');
    rec('ga4', 'Una sola configuración G-1YKC3ZT1P1', (await page.evaluate(() => dataLayer.filter(x => x[0] === 'config' && x[1] === 'G-1YKC3ZT1P1').length)) === 1);
    rec('ga4', 'cotizacion_solicitud con listas cerradas y value 1415 (sin recargo de graduación)', cot.length === 1 && JSON.stringify(cot[0][2]) === JSON.stringify({ tipo_lente: 'mono_br_ar', material: 'estandar', tratamiento: 'antirreflejante+blue_ray', sucursal: 'plaza_maryn', value: 1415, currency: 'MXN' }), cot);
    rec('ga4', 'whatsapp_click una vez por clic (flotante)', wa.length === 1 && wa[0][2].link_location === 'flotante', wa);
    rec('ga4', 'Sin datos personales en dataLayer', !/Ana|2290000000|example\.com|6\.50|receta|graduaci|astigm|±|g1|1765/i.test(dlAll));
    await ctx.close();
    // 4d) Mapa bajo demanda y WhatsApp prellenado de sucursal
    {
      const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await c2.newPage();
      await p2.route(/google\.com\/maps/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>mapa</p>' }));
      await p2.goto(BASE + 'sucursales/plaza-bravo/'); const before = await p2.$$eval('iframe', f => f.length);
      await p2.click('.map-load'); await p2.waitForTimeout(300);
      const src = await p2.$eval('.map-embed iframe', f => f.src).catch(() => null);
      const waHref = await p2.$eval('.hero-actions a[href*="wa.me"]', a => decodeURIComponent(a.href));
      rec('sucursales', 'Mapa no se carga hasta pulsar; luego iframe de Google Maps con la dirección', before === 0 && !!src && src.startsWith('https://www.google.com/maps?q=Nicol') && /output=embed/.test(src), { before, src });
      rec('sucursales', 'WhatsApp de sucursal con mensaje prellenado (Plaza Bravo)', /text=Hola, quiero información de MX Óptica Plaza Bravo\./.test(waHref), waHref);
      const hours = await p2.$$eval('.hours td', t => t.map(x => x.textContent).join('|'));
      rec('sucursales', 'Horarios Plaza Bravo sin cambios (L-V 10:00–19:00, Sáb 10:00–17:00)', hours === 'Lunes a viernes|10:00–19:00|Sábado|10:00–17:00|Domingo|Cerrado', hours);
      await c2.close();
    }
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
