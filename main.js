// Meridian landingspagina: kleine animaties, zonder externe bibliotheken
(function () {
  // header-schaduw bij scrollen
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // secties zacht laten verschijnen
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('zichtbaar'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('zichtbaar'); }); }

  // lichte parallax op het sfeerbeeld
  var media = document.querySelector('.sfeer-media > *');
  var sfeer = document.querySelector('.sfeer');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (media && sfeer && !reduce) {
    window.addEventListener('scroll', function () {
      var r = sfeer.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      media.style.transform = 'translateY(' + (-p * 12) + '%)';
    }, { passive: true });
  }

  // fallbacktekst verbergen zodra het MailerLite-formulier geladen is
  var kaart = document.querySelector('.form-kaart');
  var embed = document.querySelector('.ml-embedded');
  if (kaart && embed) {
    var check = function () { if (embed.children.length) { kaart.classList.add('geladen'); return true; } return false; };
    if (!check()) { new MutationObserver(function (m, obs) { if (check()) obs.disconnect(); }).observe(embed, { childList: true, subtree: true }); }
  }
})();

// Toegankelijkheidsmenu: instellingen worden bewaard in localStorage
(function () {
  var root = document.documentElement;
  var knop = document.querySelector('.a11y-knop');
  var paneel = document.getElementById('a11y-paneel');
  if (!knop || !paneel) return;
  var KEY = 'meridian-a11y';
  var staat = { tekst: 100, opties: {} };
  try { staat = JSON.parse(localStorage.getItem(KEY)) || staat; } catch (e) {}
  var pct = document.getElementById('a11y-pct');

  function toepassen() {
    var z = staat.tekst / 100;
    ['main', '.site-header', '.site-footer'].forEach(function (s) {
      var el = document.querySelector(s); if (el) el.style.zoom = z === 1 ? '' : z;
    });
    pct.textContent = staat.tekst + '%';
    paneel.querySelectorAll('.a11y-optie').forEach(function (b) {
      var o = b.getAttribute('data-optie'), aan = !!staat.opties[o];
      b.setAttribute('aria-pressed', aan ? 'true' : 'false');
      root.classList.toggle('a-' + o, aan);
    });
    try { localStorage.setItem(KEY, JSON.stringify(staat)); } catch (e) {}
  }
  function open(aan) {
    paneel.hidden = !aan;
    knop.setAttribute('aria-expanded', aan ? 'true' : 'false');
    if (aan) paneel.querySelector('button').focus(); else knop.focus();
  }
  knop.addEventListener('click', function () { open(paneel.hidden); });
  paneel.querySelector('.a11y-sluit').addEventListener('click', function () { open(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !paneel.hidden) open(false); });
  paneel.querySelectorAll('[data-tekst]').forEach(function (b) {
    b.addEventListener('click', function () {
      staat.tekst = Math.min(150, Math.max(90, staat.tekst + 10 * Number(b.getAttribute('data-tekst'))));
      toepassen();
    });
  });
  paneel.querySelectorAll('.a11y-optie').forEach(function (b) {
    b.addEventListener('click', function () { var o = b.getAttribute('data-optie'); staat.opties[o] = !staat.opties[o]; toepassen(); });
  });
  paneel.querySelector('.a11y-reset').addEventListener('click', function () { staat = { tekst: 100, opties: {} }; toepassen(); });
  toepassen();
})();

//// Momentknoppen zonder WebGL: wissel de foto en de lucht (het 3D-script doet de rest als WebGL werkt)
(function () {
  var LUCHT = { iris: ['#BEE2F4', '#E9E1F4'], sage: ['#FBF9F4', '#E1F1EA'], amber: ['#FFD9C4', '#FFB48F'], noir: ['#E9E1F4', '#8E79B5'] };
  var houder = document.querySelector('.fles3d');
  if (!houder) return;
  var foto = houder.querySelector('.fles3d-fallback');
  document.querySelectorAll('[data-moment]').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.getAttribute('data-moment');
      document.querySelectorAll('[data-moment]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (houder.classList.contains('actief')) return;
      foto.src = 'img/fles-' + g + '.webp';
      foto.alt = 'Meridian ' + g.charAt(0).toUpperCase() + g.slice(1);
      houder.style.setProperty('--lucht1', LUCHT[g][0]);
      houder.style.setProperty('--lucht2', LUCHT[g][1]);
    });
  });
})();

// Meridiaanlijnen bij de sectiekoppen: een golvende lijn door de witruimte, zoals in de hero
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var labels = Array.prototype.filter.call(document.querySelectorAll('main section .label'), function (l) { return !l.closest('.hero'); });
  if (!labels.length) return;
  var items = labels.map(function (lab, i) {
    var sec = lab.closest('section');
    sec.classList.add('met-lijn'); lab.classList.add('label-lijn');
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'kop-lijn'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(NS, 'path'); svg.appendChild(path); sec.insertBefore(svg, sec.firstChild);
    return { lab: lab, sec: sec, svg: svg, path: path, omgekeerd: i % 2 === 1 };
  });
  function teken() {
    items.forEach(function (it) {
      var sr = it.sec.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(it.lab); var lr = rg.getBoundingClientRect();
      var W = sr.width, H = 200, m = H / 2;
      var x1 = lr.left - sr.left - 12, x2 = lr.right - sr.left + 14;
      var y = lr.top - sr.top + lr.height / 2;
      var rev = it.lab.closest('.reveal'); // schuift het label nog in? reken die verschuiving eruit
      if (rev) { var t = getComputedStyle(rev).transform; if (t && t !== 'none') { var mt = t.match(/matrix(3d)?\(([^)]+)\)/); if (mt) { var v = mt[2].split(','); y -= parseFloat(v[mt[1] ? 13 : 5]) || 0; } } }
      var a = it.omgekeerd ? m + 70 : m - 70, b = it.omgekeerd ? m - 60 : m + 60; // in en uit de lijn, afwisselend boven/onder
      it.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      it.svg.style.top = (y - m) + 'px'; it.svg.style.width = W + 'px'; it.svg.style.height = H + 'px';
      var d = x1 > 60 ? 'M -4 ' + a + ' C ' + (x1 * 0.45) + ' ' + a + ', ' + (x1 * 0.6) + ' ' + m + ', ' + x1 + ' ' + m : '';
      if (x2 < W - 40) d += (d ? ' ' : '') + 'M ' + x2 + ' ' + m + ' C ' + (x2 + (W - x2) * 0.4) + ' ' + m + ', ' + (W - (W - x2) * 0.35) + ' ' + b + ', ' + (W + 4) + ' ' + b;
      it.path.setAttribute('d', d);
      var len = it.path.getTotalLength();
      it.path.style.strokeDasharray = len; if (!it.svg.classList.contains('getekend')) it.path.style.strokeDashoffset = len;
    });
  }
  var wacht = false;
  function later() { if (wacht) return; wacht = true; requestAnimationFrame(function () { wacht = false; teken(); }); }
  teken();
  window.addEventListener('resize', later);
  // opnieuw meten als een sectie van hoogte verandert (bv. het MailerLite-formulier laadt) of een blok klaar is met inschuiven
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(later); items.forEach(function (it) { ro.observe(it.sec); ro.observe(it.lab); }); }
  document.addEventListener('transitionend', function (e) { if (e.target.classList && e.target.classList.contains('reveal')) later(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('getekend'); e.target.querySelector('path').style.strokeDashoffset = 0; io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    items.forEach(function (it) { io.observe(it.svg); });
  } else { items.forEach(function (it) { it.svg.classList.add('getekend'); it.path.style.strokeDashoffset = 0; }); }
})();
