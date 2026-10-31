// Pantón Bodegón · demo — JS propio de la web (el kit maneja datos, carrito, reservas y panel).
import { initKit } from '../kit/kit.js?v=1';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const desk = matchMedia('(min-width: 900px)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = (ms) => new Promise(r => setTimeout(r, ms));
const TZ = 'America/Argentina/Buenos_Aires';
let K = null; // contexto del kit
const DATA = { cats: [], prods: [] };
const prod = (id) => DATA.prods.find(p => p.id === id);
const mini = (src) => /-800\.webp$/.test(src || '') ? src.replace('-800.', '-240.') : src;
const precioTxt = (p) => p && p.precio != null ? K.money(p.precio) : 'A confirmar';

// ---------- fechas en Buenos Aires
function ahoraBA() {
  const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
    .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { fecha: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), dow };
}
function sumarDias(fecha, n) { const d = new Date(fecha + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function proximoDia(dows, hastaMin) {
  const a = ahoraBA();
  for (let i = 0; i < 14; i++) { const dow = (a.dow + i) % 7; if (dows.includes(dow) && (i > 0 || a.min < hastaMin)) return sumarDias(a.fecha, i); }
  return a.fecha;
}

// =====================================================================
// INTRO: se prende el cartel (el logo entero, una sola vez) y sube a la barra
// =====================================================================
async function intro() {
  const el = $('#intro');
  if (!html.classList.contains('con-intro') || !el) { html.classList.add('listo'); return; }
  const corto = !desk.matches;
  const inicio = performance.now();
  const heroImg = $('.hero__foto img');
  const listos = Promise.all([
    document.fonts ? document.fonts.ready.catch(() => {}) : null,
    heroImg && !heroImg.complete ? new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : null,
  ]);
  await espera(corto ? 60 : 120); el.classList.add('p1');
  await espera(corto ? 760 : 1000); el.classList.add('p2');
  await espera(corto ? 260 : 480);
  await Promise.race([listos, espera(Math.max(0, 2400 - (performance.now() - inicio)))]);
  const logo = $('.intro__logo', el); const dest = $('[data-logo-barra]');
  if (logo && dest) {
    const a = logo.getBoundingClientRect(); const b = dest.getBoundingClientRect();
    el.style.setProperty('--vx', `${b.left - a.left}px`); el.style.setProperty('--vy', `${b.top - a.top}px`); el.style.setProperty('--vs', (b.width / a.width).toFixed(4));
  }
  el.classList.add('p3');
  await espera(200); html.classList.add('listo');
  await espera(corto ? 420 : 520); el.classList.add('p4');
  await espera(260);
  html.classList.remove('con-intro'); el.classList.add('fin');
}

// =====================================================================
// BARRA, MENÚ, ENTRADAS Y ARRASTRE
// =====================================================================
function barra() {
  const b = $('#barra'); const hero = $('.hero');
  const pintar = () => { b.classList.toggle('solida', scrollY > Math.min(hero.offsetHeight - 140, innerHeight * .5)); html.classList.toggle('en-hero', scrollY < hero.offsetHeight * .55); if (scrollY < hero.offsetHeight * .5) $$('.barra__nav a.activo').forEach(a => a.classList.remove('activo')); };
  addEventListener('scroll', () => requestAnimationFrame(pintar), { passive: true }); pintar();
  const menu = $('#menu'); const btn = $('[data-menu]');
  let y = 0;
  const abrir = (si) => {
    if (si) { y = scrollY; document.body.style.cssText = `position:fixed;top:-${y}px;left:0;right:0`; menu.hidden = false; }
    else { document.body.style.cssText = ''; menu.hidden = true; scrollTo({ top: y, behavior: 'instant' }); }
    html.classList.toggle('menu-abierto', si); btn.setAttribute('aria-expanded', si); btn.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
  };
  btn.addEventListener('click', () => abrir(menu.hidden));
  menu.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault(); abrir(false); setTimeout(() => $(a.getAttribute('href'))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 30); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrir(false); });
  const ancho = matchMedia('(min-width: 1100px)'); ancho.addEventListener('change', () => { if (ancho.matches && !menu.hidden) abrir(false); });
  const links = $$('.barra__nav a');
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
}

function entradas(root = document) {
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .seccion .titulo, .descubre:not(.hero .descubre), [data-ruta]', root).forEach(el => { if (!el.classList.contains('visto')) io.observe(el); });
  const ifr = $('iframe[data-src]');
  if (ifr) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { ifr.src = ifr.dataset.src; o.disconnect(); } }, { rootMargin: '500px' }).observe(ifr);
}

// arrastrar con el mouse las filas deslizables (con el dedo ya se deslizan solas)
function arrastrable(fila) {
  if (fila.dataset.arrastreOk) return; fila.dataset.arrastreOk = '1';
  let x0 = 0, s0 = 0, activo = false, movio = false, v = 0, ult = 0, tUlt = 0, raf = 0;
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button > 0 || fila.scrollWidth <= fila.clientWidth + 2) return;
    if (e.target.closest('button, a, input, .kit-step, .cazuela__plato')) return;
    activo = true; movio = false; x0 = e.clientX; s0 = fila.scrollLeft; ult = e.clientX; tUlt = performance.now(); v = 0; cancelAnimationFrame(raf);
    fila.style.scrollSnapType = 'none'; fila.style.scrollBehavior = 'auto'; fila.classList.add('agarrando'); e.preventDefault();
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) movio = true;
    fila.scrollLeft = s0 - dx; const ahora = performance.now(); v = (e.clientX - ult) / Math.max(1, ahora - tUlt); ult = e.clientX; tUlt = ahora;
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false; fila.classList.remove('agarrando');
    let vel = -v * 16;
    const paso = () => { if (Math.abs(vel) < .5) { fila.style.scrollSnapType = ''; fila.style.scrollBehavior = ''; return; } fila.scrollLeft += vel; vel *= .92; raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
  });
  fila.addEventListener('click', (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
}
function arrastre() { $$('[data-arrastre]').forEach(arrastrable); }

// =====================================================================
// HORARIOS Y ESTADO (siempre "7:00 a 01:00 hs")
// =====================================================================
const hora = (h, cierre = false) => cierre ? h : h.replace(/^0([1-9]):/, '$1:');
function horarios() {
  const H = K.config.horarios;
  const dias = [['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo']];
  const hoy = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][ahoraBA().dow];
  $('[data-horarios]').innerHTML = dias.map(([k, n]) => `<li class="${k === hoy ? 'hoy' : ''}"><span>${n}${k === hoy ? ' · hoy' : ''}</span><span>${(H[k] || []).length ? H[k].map(([d, c]) => `${hora(d)} a ${hora(c, true)} hs`).join(' · ') : 'Cerrado'}</span></li>`).join('');
  const est = $('[data-estado]'); const dEst = $('[data-donde-estado]');
  const pintar = () => {
    const s = K.abierto();
    const txt = s.abierto ? `Abierto ahora · hasta las ${hora(s.cierra, true)} hs` : s.abre ? `Cerrado · abrimos a las ${hora(s.abre)} hs` : 'Cerrado hoy';
    html.classList.toggle('cerrado-ahora', !s.abierto);
    est.classList.toggle('cerrado', !s.abierto); est.textContent = txt;
    dEst.classList.toggle('cerrado', !s.abierto); dEst.textContent = txt;
  };
  pintar(); setInterval(pintar, 60_000);
}

// =====================================================================
// EL RELOJ DE PANTÓN: la web cambia con la hora (con ?momento= para mostrarla en otro horario)
// =====================================================================
const INI = 7 * 60, FIN = 25 * 60; // 7:00 → 01:00 del día siguiente
const MOMENTOS = {
  desayuno: { desde: 7 * 60, hasta: 12 * 60, t: 'Desayuno', img: 'img/desayuno-800.webp', d: 'Café con leche, medialunas y tostados para arrancar el día en la esquina. Abrimos a las 7:00 hs, todos los días.', acc: [['Ver desayunos', 'cat:desayunos', 'rojo']] },
  mediodia: { desde: 12 * 60, hasta: 16 * 60, t: 'Mediodía', img: 'img/cazuela-800.webp', d: 'De lunes a viernes, menú del día: plato principal y bebida, con café y postre si querés. Y la carta completa, siempre.', acc: [['Reservá para el mediodía', 'res:almuerzo', 'rojo'], ['Ver el menú del día', '#menu-dia', 'linea']] },
  merienda: { desde: 16 * 60, hasta: 20 * 60, t: 'Merienda', img: 'img/merienda-800.webp', d: 'Tortas caseras, café y algo dulce para la tarde. También para llevar.', acc: [['Ver meriendas', 'cat:desayunos', 'rojo'], ['Ver postres', 'cat:postres', 'linea']] },
  cena: { desde: 20 * 60, hasta: 25 * 60, t: 'Cena', img: 'img/salon-alto-1100.webp', d: 'Cazuelas al centro, vino y sobremesa larga hasta la 01:00 hs. Los sábados se llena: mejor reservar.', acc: [['Reservá para la cena', 'res:cena', 'rojo'], ['Pedí a casa', '#carta', 'linea']] },
};
const RELOJ = { actual: null, ahora: null };
function minutoReloj() {
  const q = new URLSearchParams(location.search).get('momento');
  if (q && MOMENTOS[q]) return MOMENTOS[q].desde + 60;
  let m = ahoraBA().min; if (m < 60) m += 1440;
  return m;
}
const momentoDe = (m) => Object.keys(MOMENTOS).find(k => m >= MOMENTOS[k].desde && m < MOMENTOS[k].hasta) || null;
const pct = (m) => Math.max(0, Math.min(100, (m - INI) / (FIN - INI) * 100));
function pintarMomento(id, { min = null, animar = true } = {}) {
  const M = MOMENTOS[id]; if (!M) return;
  const card = $('[data-momento-card]');
  $$('.reloj__tramo').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.momento === id)));
  const aguja = $('[data-reloj-aguja]');
  if (aguja) aguja.style.setProperty('--p', `${pct(min ?? (M.desde + (M.hasta - M.desde) / 2))}%`);
  if (RELOJ.actual === id) return;
  RELOJ.actual = id;
  const poner = () => {
    $('[data-momento-k]').textContent = id === RELOJ.ahora ? 'Ahora en Pantón' : `De ${hora(String(Math.floor(M.desde / 60) % 24).padStart(2, '0') + ':00')} a ${String(Math.floor(M.hasta / 60) % 24).padStart(2, '0')}:00 hs`;
    $('[data-momento-t]').textContent = M.t;
    $('[data-momento-d]').textContent = M.d;
    $('[data-momento-acc]').innerHTML = M.acc.map(([txt, dest, est]) => `<button type="button" class="btn btn--${est}" data-ir="${esc(dest)}">${esc(txt)}</button>`).join('');
    const img = $('[data-momento-img]');
    if (img.getAttribute('src') !== M.img) {
      const n = new Image(); n.src = M.img;
      const cambiar = () => { img.classList.add('sale'); setTimeout(() => { img.src = M.img; img.alt = M.t; requestAnimationFrame(() => img.classList.remove('sale')); }, animar && !reduce ? 220 : 0); };
      if (n.complete) cambiar(); else n.onload = cambiar;
    }
    card.classList.remove('cambia');
  };
  if (animar && !reduce) { card.classList.add('cambia'); setTimeout(poner, 220); } else poner();
}
function reloj() {
  const m = minutoReloj(); const id = momentoDe(m);
  RELOJ.ahora = id;
  if (id) $(`.reloj__tramo[data-momento="${id}"]`)?.classList.add('ahora');
  pintarMomento(id || 'desayuno', { min: id ? m : INI, animar: false });
  if (!id) $('[data-momento-k]').textContent = 'Abrimos a las 7:00 hs';
  const sec = $('#momentos');
  sec.addEventListener('click', (e) => {
    const b = e.target.closest('.reloj__tramo'); if (b && !arr.movio) { pintarMomento(b.dataset.momento); return; }
    const ir = e.target.closest('[data-ir]'); if (!ir) return;
    const d = ir.dataset.ir;
    if (d.startsWith('cat:')) { CARTA.cat = d.slice(4); pintarCarta(); $('#carta').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    else if (d.startsWith('res:')) reservar(d.slice(4));
    else $(d)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  // desktop: arrastrar la aguja por la línea de 7:00 a 01:00
  const pista = $('[data-reloj-pista]'); const arr = { activo: false, movio: false };
  const aMin = (x) => { const r = pista.getBoundingClientRect(); return INI + Math.max(0, Math.min(.999, (x - r.left) / r.width)) * (FIN - INI); };
  let raf = 0;
  pista.addEventListener('pointerdown', (e) => { if (!desk.matches || e.pointerType !== 'mouse' || e.button > 0) return; arr.activo = true; arr.movio = false; arr.x0 = e.clientX; arr.id = e.pointerId; });
  pista.addEventListener('pointermove', (e) => {
    if (!arr.activo) return;
    if (!arr.movio && Math.abs(e.clientX - arr.x0) > 4) { arr.movio = true; pista.classList.add('agarrando'); try { pista.setPointerCapture(arr.id); } catch (_) { /* nada */ } }
    if (!arr.movio) return;
    cancelAnimationFrame(raf); const x = e.clientX; raf = requestAnimationFrame(() => { const mm = aMin(x); pintarMomento(momentoDe(mm), { min: mm }); });
  });
  const soltar = () => { if (!arr.activo) return; arr.activo = false; pista.classList.remove('agarrando'); setTimeout(() => { arr.movio = false; }, 0); };
  pista.addEventListener('pointerup', soltar); pista.addEventListener('pointercancel', soltar);
}

// =====================================================================
// LA CARTA: pestañas / índice + una sección por vez + foto del plato
// =====================================================================
const OCULTAS = ['menu-dia'];
const CARTA = { cat: null };
const catsCarta = () => DATA.cats.filter(c => !OCULTAS.includes(c.id) && DATA.prods.some(p => p.categoria === c.id));
function pintarCarta({ animar = true } = {}) {
  const cuerpo = $('[data-carta-cuerpo]'); const cats = catsCarta();
  if (!cats.length) { cuerpo.innerHTML = '<p class="carta__cargando">La carta se está actualizando.</p>'; return; }
  if (!cats.some(c => c.id === CARTA.cat)) CARTA.cat = cats[0].id;
  const cat = cats.find(c => c.id === CARTA.cat); const i = cats.indexOf(cat);
  const items = DATA.prods.filter(p => p.categoria === cat.id);
  const primeraFoto = items.find(p => p.foto) || DATA.prods.find(p => p.foto && cats.some(c => c.id === p.categoria));
  cuerpo.innerHTML = `
    <div class="indice">
      <span class="indice__k">Secciones</span>
      <div class="indice__lista" role="tablist" aria-label="Secciones de la carta">${cats.map(c => `<button type="button" role="tab" class="indice__b" aria-selected="${c.id === cat.id}" data-cat="${esc(c.id)}"><span>${esc(c.nombre)}</span><small>${DATA.prods.filter(p => p.categoria === c.id).length}</small></button>`).join('')}</div>
    </div>
    <div class="seccion-carta" role="tabpanel" aria-label="${esc(cat.nombre)}">
      <div class="seccion-carta__cab"><h3 class="seccion-carta__t">${esc(cat.nombre)}</h3><span class="seccion-carta__n">${items.length} ${items.length === 1 ? 'opción' : 'opciones'}<br>a casa o para llevar</span></div>
      <p class="seccion-carta__nota">${esc(cat.nota || '')}</p>
      <ul class="platos">${items.map((p, k) => `
        <li class="plato${p.foto ? ' plato--foto' : ''}${p.disponible === false ? ' is-off' : ''}" data-id="${esc(p.id)}" ${p.foto ? `data-foto="${esc(K.asset(p.foto))}"` : ''} style="--i:${animar ? k : 0}">
          ${p.foto ? `<img class="plato__mini" src="${esc(K.asset(mini(p.foto)))}" alt="" width="68" height="68" loading="lazy" decoding="async">` : ''}
          <p class="plato__nom">${esc(p.nombre)}${(p.etiquetas || []).includes('casa') ? '<span class="plato__casa">De la casa</span>' : ''}</p>
          ${p.descripcion ? `<p class="plato__desc">${esc(p.descripcion)}</p>` : ''}
          <span class="plato__precio">${p.disponible === false ? 'Sin stock hoy' : esc(precioTxt(p))}</span>
          ${p.disponible === false ? '' : `<div class="plato__add" data-kit-qty="${esc(p.id)}"></div>`}
        </li>`).join('')}</ul>
      <div class="seccion-carta__nav">
        <button type="button" data-mover="-1" ${i <= 0 ? 'disabled' : ''}>← ${esc(cats[i - 1]?.nombre || '')}</button>
        <button type="button" data-mover="1" ${i >= cats.length - 1 ? 'disabled' : ''}>${esc(cats[i + 1]?.nombre || '')} →</button>
      </div>
    </div>
    <figure class="foto-plato" aria-hidden="true"><div class="foto-plato__box">${primeraFoto ? `<img src="${esc(K.asset(primeraFoto.foto))}" alt=""><span class="foto-plato__chip">${esc(primeraFoto.nombre)}</span>` : ''}</div><figcaption>Pasá el mouse por los platos con punto rojo para ver la foto.</figcaption></figure>`;
  K.carrito?.sync(cuerpo);
  const on = $('.indice__b[aria-selected="true"]', cuerpo);
  if (on && !desk.matches) { const l = $('.indice__lista', cuerpo); l.scrollLeft = on.offsetLeft - 22; }
}
function fotoPlato(li) {
  const box = $('.foto-plato__box'); if (!box || !li?.dataset.foto) return;
  $$('.plato.activo').forEach(x => x.classList.remove('activo')); li.classList.add('activo');
  const actual = $('img:not(.sale)', box); if (actual && actual.getAttribute('src') === li.dataset.foto) return;
  const img = new Image(); img.alt = ''; img.src = li.dataset.foto; img.className = 'sale'; box.prepend(img);
  const chip = $('.foto-plato__chip', box) || box.appendChild(Object.assign(document.createElement('span'), { className: 'foto-plato__chip' }));
  chip.textContent = $('.plato__nom', li).firstChild.textContent;
  const mostrar = () => requestAnimationFrame(() => { img.classList.remove('sale'); if (actual) { actual.classList.add('sale'); setTimeout(() => actual.remove(), 400); } });
  if (img.complete) mostrar(); else img.onload = mostrar;
}
function volverArribaCarta() {
  const c = $('[data-carta-cuerpo]'); const top = c.getBoundingClientRect().top + scrollY - (desk.matches ? 110 : 70);
  if (scrollY > top + 10) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}
function carta() {
  const sec = $('#carta');
  sec.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (c) { CARTA.cat = c.dataset.cat; pintarCarta(); if (!desk.matches) volverArribaCarta(); return; }
    const mv = e.target.closest('[data-mover]');
    if (mv) { const cats = catsCarta(); const i = cats.findIndex(x => x.id === CARTA.cat) + Number(mv.dataset.mover); if (cats[i]) { CARTA.cat = cats[i].id; pintarCarta(); volverArribaCarta(); } }
  });
  let raf;
  sec.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const li = e.target.closest('.plato--foto'); if (!li) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fotoPlato(li)); });
  desk.addEventListener('change', () => pintarCarta({ animar: false }));
}

// =====================================================================
// MENÚ DEL DÍA (sección "menu-dia" de la carta, editable en /admin)
// =====================================================================
function pintarMenuDia() {
  const a = ahoraBA(); const dias = [[1, 'Lun'], [2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie']];
  $('[data-dias]').innerHTML = dias.map(([d, n]) => `<span class="dia${d === a.dow ? ' hoy' : ''}">${n}${d === a.dow ? ' · hoy' : ''}</span>`).join('');
  const items = DATA.prods.filter(p => p.categoria === 'menu-dia' && p.disponible !== false);
  $('[data-menudia]').innerHTML = items.map(p => `<li><span><span class="pl__nom">${esc(p.nombre)}</span>${p.descripcion ? `<span class="pl__desc">${esc(p.descripcion)}${p.precio != null ? ` · ${esc(K.money(p.precio))}` : ''}</span>` : ''}</span><div data-kit-qty="${esc(p.id)}"></div></li>`).join('');
  K.carrito?.sync($('#menu-dia'));
}
function reservar(servicio) {
  const almuerzo = servicio === 'almuerzo';
  K.reservas?.abrir({ fecha: proximoDia([0, 1, 2, 3, 4, 5, 6], almuerzo ? 14 * 60 : 22 * 60), hora: almuerzo ? '13:00' : '21:00', personas: 2 });
}

// =====================================================================
// ARMÁ LA MESA: cazuelas que se arrastran (mouse) o se suman con un toque al mantel
// =====================================================================
const MESA = ['huevos-jamon', 'tortilla', 'rabas', 'cachopo', 'pesca', 'filloas'];
const SLOTS = [[22, 30], [50, 24], [78, 32], [30, 72], [62, 70], [86, 66], [12, 62], [46, 48]];
function lineasCarrito() { try { return JSON.parse(localStorage.getItem(`kit:${K.config.id}:carrito`) || '[]'); } catch (_) { return []; } }
function pintarCazuelas() {
  $('[data-cazuelas]').innerHTML = MESA.map(id => { const p = prod(id); if (!p || !p.foto) return ''; return `<li class="cazuela" data-cazuela="${esc(id)}">
    <div class="cazuela__plato" title="Arrastrala al mantel"><img src="${esc(K.asset(mini(p.foto)))}" srcset="${esc(K.asset(mini(p.foto)))} 240w, ${esc(K.asset(p.foto))} 800w" sizes="160px" alt="${esc(p.nombre)}" width="240" height="240" loading="lazy" decoding="async"></div>
    <p class="cazuela__nom">${esc(p.nombre)}</p>
    <button type="button" class="btn btn--rojo cazuela__btn" data-a-la-mesa="${esc(id)}">A la mesa</button></li>`; }).join('');
  pintarMantel(false);
}
function pintarMantel(animar = true) {
  const box = $('[data-mantel-platos]'); if (!box) return;
  const ls = lineasCarrito().filter(l => !l.gc && prod(l.id)?.foto);
  const porId = {}; ls.forEach(l => { porId[l.id] = (porId[l.id] || 0) + l.cant; });
  const ids = Object.keys(porId).slice(0, SLOTS.length);
  const ya = new Set($$('.mantel__plato', box).map(x => x.dataset.id));
  box.innerHTML = ids.map((id, i) => { const p = prod(id); const [x, y] = SLOTS[i]; return `<div class="mantel__plato" data-id="${esc(id)}" style="--x:${x}%;--y:${y}%;--s:${desk.matches ? 104 : 80}px;${!animar || ya.has(id) ? 'animation:none' : ''}"><img src="${esc(K.asset(mini(p.foto)))}" alt="${esc(p.nombre)}" width="240" height="240">${porId[id] > 1 ? `<b>×${porId[id]}</b>` : ''}</div>`; }).join('');
  const n = Object.values(porId).reduce((a, b) => a + b, 0);
  $('[data-mantel-vacio]').hidden = n > 0;
  $('[data-mantel-n]').textContent = n === 0 ? 'Mesa vacía' : `${n} ${n === 1 ? 'plato' : 'platos'} para el centro`;
  $$('.cazuela').forEach(c => c.classList.toggle('en-mesa', !!porId[c.dataset.cazuela]));
}
function mesa() {
  const sec = $('#mesa'); const mantel = $('[data-mantel]');
  sec.addEventListener('click', (e) => { const b = e.target.closest('[data-a-la-mesa]'); if (b) K.carrito?.agregar(b.dataset.aLaMesa, 1, { origen: b.closest('.cazuela').querySelector('.cazuela__plato') }); });
  // arrastre con el mouse (en el celu: el botón «A la mesa», o tocar la cazuela)
  let fant = null, id = null, x0 = 0, y0 = 0, movio = false;
  const sobreMantel = (x, y) => { const r = mantel.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; };
  sec.addEventListener('pointerdown', (e) => {
    const pl = e.target.closest('.cazuela__plato'); if (!pl || e.button > 0) return;
    id = pl.closest('.cazuela').dataset.cazuela; x0 = e.clientX; y0 = e.clientY; movio = false;
    if (e.pointerType !== 'mouse') return; // con el dedo, tocar = sumar (en pointerup)
    e.preventDefault();
  });
  addEventListener('pointermove', (e) => {
    if (!id || e.pointerType !== 'mouse') return;
    if (!movio && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) {
      movio = true; const src = $(`.cazuela[data-cazuela="${id}"] img`).currentSrc;
      fant = Object.assign(document.createElement('div'), { className: 'arrastrando-plato' }); fant.innerHTML = `<img src="${esc(src)}" alt="">`; document.body.appendChild(fant);
    }
    if (fant) { fant.style.left = `${e.clientX}px`; fant.style.top = `${e.clientY}px`; mantel.classList.toggle('sobre', sobreMantel(e.clientX, e.clientY)); }
  });
  addEventListener('pointerup', (e) => {
    if (!id) return;
    const pid = id; id = null;
    if (fant) { const dentro = sobreMantel(e.clientX, e.clientY); fant.remove(); fant = null; mantel.classList.remove('sobre'); if (dentro) K.carrito?.agregar(pid, 1); return; }
    if (!movio && e.target.closest('.cazuela__plato')) K.carrito?.agregar(pid, 1, { origen: e.target.closest('.cazuela__plato') });
  });
  addEventListener('pointercancel', () => { id = null; if (fant) { fant.remove(); fant = null; mantel.classList.remove('sobre'); } });
}

// =====================================================================
// HISTORIA: puntos del camino (hover o toque, la info aparece en el punto)
// =====================================================================
function ruta() {
  const r = $('[data-ruta]'); const puntos = $$('.punto', r);
  const abrir = (p, si) => { puntos.forEach(x => x.setAttribute('aria-expanded', String(x === p && si))); };
  r.addEventListener('click', (e) => { const p = e.target.closest('.punto'); abrir(p, !!p); });
  puntos.forEach(p => {
    p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') abrir(p, true); });
    p.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') p.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-ruta]')) abrir(null, false); });
  // cada punto se ubica sobre el trazo (horizontal en desktop, vertical en el celu)
  const ns = 'http://www.w3.org/2000/svg';
  const medir = document.createElementNS(ns, 'svg'); medir.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden'); document.body.appendChild(medir);
  [['.ruta__svg:not(.ruta__svg--v) .ruta__trazo', 1000, 420, 'x', 'y'], ['.ruta__svg--v .ruta__trazo', 400, 1000, 'vx', 'vy']].forEach(([sel, W, H, kx, ky]) => {
    const pth = document.createElementNS(ns, 'path'); pth.setAttribute('d', $(sel, r).getAttribute('d')); medir.appendChild(pth);
    const L = pth.getTotalLength();
    puntos.forEach(p => { const q = pth.getPointAtLength(L * Number(p.dataset.t || 0)); p.style.setProperty('--' + kx, `${(q.x / W * 100).toFixed(2)}%`); p.style.setProperty('--' + ky, `${(q.y / H * 100).toFixed(2)}%`); });
  });
  medir.remove();
  // largo real del trazo para dibujarlo con el scroll
  $$('.ruta__trazo', r).forEach(t => { try { const L = t.getTotalLength(); t.style.strokeDasharray = L; t.style.strokeDashoffset = L; } catch (_) { /* nada */ } });
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { $$('.ruta__trazo', r).forEach(t => { t.style.strokeDashoffset = 0; }); o.disconnect(); } }, { threshold: .3 }).observe(r);
}

// =====================================================================
// GALERÍA: mazo en el celu, fila de fotos sueltas para arrastrar en desktop
// =====================================================================
function crearMazo(cont, cartas) {
  let orden = cartas.slice();
  const giro = cartas.map((_, i) => [-4, 3.5, -2, 4.5, -3][i % 5]);
  function pintar() {
    orden.forEach((c, k) => { c.classList.toggle('arriba', k === 0); c.style.zIndex = String(200 - k); const r = k === 0 ? 0 : giro[cartas.indexOf(c)]; c.style.transform = `translate(${Math.min(k, 2) * 5}px, ${Math.min(k, 2) * 9}px) rotate(${r}deg)`; c.style.opacity = k < 3 ? '1' : '0'; });
  }
  function siguiente(dir = 1) {
    const top = orden[0]; top.classList.add('vuela'); top.style.transform = `translate(${dir * 120}%, -20px) rotate(${dir * 18}deg)`;
    setTimeout(() => { top.classList.remove('vuela'); orden.push(orden.shift()); pintar(); }, reduce ? 0 : 320);
  }
  let x0 = 0, y0 = 0, dx = 0, activa = null, movio = false, id = null;
  const down = (e) => { if (desk.matches) return; const c = e.target.closest('.arriba'); if (!c) return; activa = c; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; movio = false; };
  const move = (e) => {
    if (!activa || e.pointerId !== id) return; dx = e.clientX - x0; const dy = e.clientY - y0;
    if (!movio && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { movio = true; activa.classList.add('arrastrando'); try { cont.setPointerCapture(id); } catch (_) { /* nada */ } }
    if (movio) activa.style.transform = `translate(${dx}px, ${Math.abs(dx) * .05}px) rotate(${dx * .06}deg)`;
  };
  const up = () => { if (!activa) return; const c = activa; activa = null; c.classList.remove('arrastrando'); if (movio && Math.abs(dx) > 70) siguiente(dx > 0 ? 1 : -1); else if (movio) pintar(); else siguiente(1); };
  cont.addEventListener('pointerdown', down); cont.addEventListener('pointermove', move); cont.addEventListener('pointerup', up);
  cont.addEventListener('pointercancel', () => { if (activa) { activa.classList.remove('arrastrando'); activa = null; pintar(); } });
  pintar();
  return { destruir() { cont.removeEventListener('pointerdown', down); cont.removeEventListener('pointermove', move); cont.removeEventListener('pointerup', up); cartas.forEach(c => { c.style.cssText = ''; c.classList.remove('arriba'); }); } };
}
function galeria() {
  const g = $('[data-galeria]'); const figs = $$('.g', g); let m = null;
  const armar = () => {
    if (desk.matches) { if (m) { m.destruir(); m = null; } arrastrable(g); return; }
    if (!m) m = crearMazo(g, figs);
  };
  armar(); desk.addEventListener('change', armar);
}

// =====================================================================
// CONTADOR DE LA COMANDA EN LA BARRA
// =====================================================================
function contador() {
  const n = lineasCarrito().reduce((a, l) => a + (l.cant || 0), 0);
  const b = $('[data-comanda-n]'); b.hidden = n === 0; b.textContent = String(n);
}

// =====================================================================
// ARRANQUE
// =====================================================================
function pintarTodo({ animar = true } = {}) { pintarCarta({ animar }); pintarMenuDia(); pintarCazuelas(); }
async function arrancar() {
  intro();
  barra(); entradas(); arrastre(); carta(); mesa(); ruta(); galeria();
  document.addEventListener('kit:carta', (e) => {
    DATA.prods = e.detail.productos; DATA.cats = e.detail.categorias;
    if (K) pintarTodo({ animar: false });
  });
  document.addEventListener('kit:carrito', () => { if (!K) return; pintarMantel(); contador(); });
  $('[data-reservar-mediodia]').addEventListener('click', () => reservar('almuerzo'));
  try {
    K = await initKit({
      config: 'cliente.json',
      carrito: { label: 'Tu comanda', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>' },
      badge: true,
      imagenes: { lqip: 'img/lqip.json' },
    });
    if (!DATA.prods.length) { DATA.prods = await K.store.getProductos(); DATA.cats = await K.store.getCategorias(); }
    horarios(); reloj(); pintarTodo(); contador();
  } catch (err) { console.error('[panton] kit', err); }
}
arrancar();
