/* MX Óptica V5 · Menú móvil, encabezado, revelado al desplazarse y video de portada. */
(function(){
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Menú móvil */
  const toggle = document.querySelector('.menu-toggle'), nav = document.getElementById('menu-principal');
  if (toggle && nav) {
    const set = (open) => { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) set(false); });
  }

  /* Sombra del encabezado al desplazarse */
  const header = document.querySelector('.site-header');
  if (header) { const on = () => header.classList.toggle('is-scrolled', window.scrollY > 8); on(); window.addEventListener('scroll', on, {passive:true}); }

  /* Revelado */
  const items = document.querySelectorAll('.reveal,.reveal-stagger');
  if (reduced || !('IntersectionObserver' in window)) items.forEach(el => el.classList.add('is-visible'));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), {rootMargin:'0px 0px -8% 0px', threshold:.08});
    items.forEach(el => io.observe(el));
  }

  /* Video de portada: el póster siempre visible; el video solo se reproduce si el usuario no reduce movimiento ni ahorra datos. */
  const v = document.getElementById('heroVideo'), btn = document.getElementById('heroVideoToggle');
  if (!v) return;
  const saver = !!(navigator.connection && navigator.connection.saveData);
  if (reduced || saver) { v.remove(); return; }
  let pausedByUser = false, visible = true;
  const label = (playing) => { if (!btn) return; btn.hidden = false; btn.textContent = playing ? 'Pausar video' : 'Reproducir video'; btn.setAttribute('aria-pressed', String(!playing)); };
  const start = () => {
    if (pausedByUser || !visible || document.hidden) return;
    const p = v.play();
    if (p && p.then) p.then(() => { v.classList.add('is-playing'); label(true); }).catch(() => { v.classList.remove('is-playing'); label(false); });
  };
  v.addEventListener('error', () => { v.classList.remove('is-playing'); if (btn) btn.hidden = true; }, true);
  btn && btn.addEventListener('click', () => { if (!v.paused) { pausedByUser = true; v.pause(); label(false); } else { pausedByUser = false; start(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : v.pause(); }, {threshold:.05}).observe(v);
  document.addEventListener('visibilitychange', () => document.hidden ? v.pause() : start());
  // Carga diferida: el video empieza a descargarse tras el primer pintado del póster.
  const kick = () => { v.preload = 'auto'; start(); };
  if (document.readyState === 'complete') setTimeout(kick, 150); else window.addEventListener('load', () => setTimeout(kick, 150), {once:true});
})();
