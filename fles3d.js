// Meridian · 3D-flesje met three.js (WebGL)
// Glas, vloeistof per geur, zwarte dop, etiket en een meridiaanring.
// Bediening: slepen of pijltjestoetsen om te draaien; de momentknoppen wisselen de geur.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const GEUREN = {
  iris:  { naam: 'IRIS',  vloeistof: 0xC9B6E4, lucht: ['#BEE2F4', '#E9E1F4'] },
  sage:  { naam: 'SAGE',  vloeistof: 0xD3DFA0, lucht: ['#FBF9F4', '#E1F1EA'] },
  amber: { naam: 'AMBER', vloeistof: 0xE0A040, lucht: ['#FFD9C4', '#FFB48F'] },
  noir:  { naam: 'NOIR',  vloeistof: 0x2A2230, lucht: ['#E9E1F4', '#8E79B5'] },
};

const houder = document.querySelector('.fles3d');
const canvas = houder && houder.querySelector('canvas');
const stil = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a-stil');

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (houder && canvas && webglOk()) start();

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.35, 6.2);

  const licht = new THREE.DirectionalLight(0xffe2cf, 2.2); // warme zon rechtsboven
  licht.position.set(3, 4, 3); scene.add(licht);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const fles = new THREE.Group(); fles.position.y = -0.1; scene.add(fles);

  // vorm van het flesje: trapezium, onderaan breder (zoals op de productfoto's)
  function trapezium(onder, boven, hoogte) {
    const s = new THREE.Shape();
    s.moveTo(-onder / 2, 0); s.lineTo(onder / 2, 0); s.lineTo(boven / 2, hoogte); s.lineTo(-boven / 2, hoogte); s.closePath();
    return s;
  }
  const diepte = 0.62;
  const glasGeo = new THREE.ExtrudeGeometry(trapezium(1.32, 0.78, 1.9), { depth: diepte, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4 });
  glasGeo.translate(0, -1.05, -diepte / 2);
  const glas = new THREE.Mesh(glasGeo, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.25, ior: 1.45, attenuationColor: 0xffffff,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2, transparent: true,
  }));
  fles.add(glas);

  const vloeistofGeo = new THREE.ExtrudeGeometry(trapezium(1.16, 0.74, 1.55), { depth: diepte - 0.14, bevelEnabled: false });
  vloeistofGeo.translate(0, -0.97, -(diepte - 0.14) / 2);
  const vloeistofMat = new THREE.MeshPhysicalMaterial({ color: GEUREN.iris.vloeistof, roughness: 0.2, metalness: 0, clearcoat: 0.6, sheen: 0.3, envMapIntensity: 0.8 });
  fles.add(new THREE.Mesh(vloeistofGeo, vloeistofMat));

  const hals = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 32), new THREE.MeshPhysicalMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.25 }));
  hals.position.y = 0.98; fles.add(hals);
  const dop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.62, 48), new THREE.MeshPhysicalMaterial({ color: 0x111014, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }));
  dop.position.y = 1.36; fles.add(dop);

  // etiket: canvas-textuur in de huisstijl (MERIDIAN, korte lijn, geurnaam)
  const etiketCanvas = document.createElement('canvas'); etiketCanvas.width = 512; etiketCanvas.height = 600;
  const etiketTex = new THREE.CanvasTexture(etiketCanvas); etiketTex.colorSpace = THREE.SRGBColorSpace; etiketTex.anisotropy = 4;
  function tekenEtiket(geur) {
    const g = etiketCanvas.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 600);
    g.fillStyle = '#271D35'; g.textAlign = 'center';
    g.font = '500 64px "Space Grotesk", sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '18px';
    g.fillText('MERIDIAN', 268, 268);
    g.fillRect(206, 300, 100, 4);
    g.font = '700 40px "Space Grotesk", sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '10px';
    g.fillText(GEUREN[geur].naam, 261, 372);
    etiketTex.needsUpdate = true;
  }
  const etiket = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), new THREE.MeshBasicMaterial({ map: etiketTex, toneMapped: false }));
  etiket.position.set(0, 0.0, diepte / 2 + 0.075); fles.add(etiket);

  // meridiaanring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.012, 12, 180), new THREE.MeshBasicMaterial({ color: 0x7453A2 }));
  ring.rotation.set(Math.PI / 2.1, 0.18, 0); scene.add(ring);

  // zachte schaduw onder het flesje
  const schaduwCanvas = document.createElement('canvas'); schaduwCanvas.width = schaduwCanvas.height = 128;
  const sg = schaduwCanvas.getContext('2d'); const grad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(39,29,53,.35)'); grad.addColorStop(1, 'rgba(39,29,53,0)'); sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const schaduw = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(schaduwCanvas), transparent: true, depthWrite: false }));
  schaduw.rotation.x = -Math.PI / 2; schaduw.position.y = -1.14; scene.add(schaduw);

  // geur wisselen (momentknoppen)
  let huidig = 'iris';
  const doelKleur = new THREE.Color(GEUREN.iris.vloeistof);
  function kiesGeur(geur, direct) {
    if (!GEUREN[geur]) return;
    huidig = geur; doelKleur.set(GEUREN[geur].vloeistof);
    if (direct || stil()) vloeistofMat.color.copy(doelKleur);
    tekenEtiket(geur);
    houder.style.setProperty('--lucht1', GEUREN[geur].lucht[0]);
    houder.style.setProperty('--lucht2', GEUREN[geur].lucht[1]);
    canvas.setAttribute('aria-label', '3D-flesje Meridian ' + geur.charAt(0).toUpperCase() + geur.slice(1) + '. Sleep of gebruik de pijltjestoetsen om het te draaien.');
    vraagFrame();
  }
  document.querySelectorAll('[data-moment]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      kiesGeur(b.getAttribute('data-moment'));
    });
  });

  // draaien met slepen en toetsen
  let hoek = -0.5, snelheid = 0, slepen = false, vorigeX = 0;
  canvas.addEventListener('pointerdown', (e) => { slepen = true; vorigeX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!slepen) return; const dx = e.clientX - vorigeX; vorigeX = e.clientX; hoek += dx * 0.01; snelheid = dx * 0.002; vraagFrame(); });
  canvas.addEventListener('pointerup', () => { slepen = false; });
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { hoek -= 0.25; vraagFrame(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { hoek += 0.25; vraagFrame(); e.preventDefault(); }
  });

  function maat() {
    const w = houder.clientWidth, h = houder.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 8.4 : 7.4;
    camera.updateProjectionMatrix(); vraagFrame();
  }
  new ResizeObserver(maat).observe(houder);

  // alleen renderen als het flesje in beeld is
  let zichtbaar = true, gepland = false, start = performance.now(), vorigeT = performance.now();
  new IntersectionObserver((e) => { zichtbaar = e[0].isIntersecting; if (zichtbaar) vraagFrame(); }).observe(houder);
  function vraagFrame() { if (!gepland) { gepland = true; requestAnimationFrame(frame); } }
  function frame(t) {
    gepland = false;
    const rustig = stil();
    const dt = Math.min(0.1, (t - vorigeT) / 1000); vorigeT = t;
    const intro = Math.min(1, (t - start) / 1600); // één intro: flesje draait in beeld
    if (!rustig && !slepen) { hoek += dt * 0.2 + snelheid; snelheid *= 0.94; }
    fles.rotation.y = rustig ? hoek : hoek - (1 - easeOut(intro)) * 1.6;
    fles.position.y = -0.1 + (rustig ? 0 : Math.sin(t / 1400) * 0.04);
    ring.rotation.z = rustig ? 0.35 : t / 9000;
    vloeistofMat.color.lerp(doelKleur, rustig ? 1 : 1 - Math.exp(-dt * 6));
    if (!rustig && vloeistofMat.color.equals(doelKleur) === false && !zichtbaar) vloeistofMat.color.copy(doelKleur);
    renderer.render(scene, camera);
    if (zichtbaar && (!rustig || slepen)) vraagFrame();
  }
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);

  // fonts eerst laden, dan het etiket tekenen
  (document.fonts ? document.fonts.load('500 64px "Space Grotesk"') : Promise.resolve()).finally(() => kiesGeur(huidig, true));
  // "Animaties uit" in het menu: opnieuw renderen bij wijziging
  new MutationObserver(vraagFrame).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  houder.classList.add('actief'); // verbergt de fallbackfoto
  maat();
}
