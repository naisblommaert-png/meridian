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
