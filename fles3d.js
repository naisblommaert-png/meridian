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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.35, 6.2);

  const licht = new THREE.DirectionalLight(0xffe2cf, 2.4); // warme zon rechtsboven
  licht.position.set(3, 4, 3); scene.add(licht);
  const rand = new THREE.DirectionalLight(0xd9ccff, 1.4); // koel randlicht links achter
  rand.position.set(-4, 2, -3); scene.add(rand);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // lucht als achtergrond in de 3D-scène, zodat het glas ze echt kan breken
  const luchtCanvas = document.createElement('canvas'); luchtCanvas.width = 512; luchtCanvas.height = 512;
  const luchtTex = new THREE.CanvasTexture(luchtCanvas); luchtTex.colorSpace = THREE.SRGBColorSpace;
  function tekenLucht(c1, c2) {
    const g = luchtCanvas.getContext('2d');
    const lin = g.createLinearGradient(0, 0, 0, 512); lin.addColorStop(0, c1); lin.addColorStop(1, c2);
    g.fillStyle = lin; g.fillRect(0, 0, 512, 512);
    const zon = g.createRadialGradient(400, 60, 0, 400, 60, 230); zon.addColorStop(0, 'rgba(255,180,143,.75)'); zon.addColorStop(1, 'rgba(255,180,143,0)');
    g.fillStyle = zon; g.fillRect(0, 0, 512, 512);
    luchtTex.needsUpdate = true;
  }
  scene.background = luchtTex;

  const fles = new THREE.Group(); fles.position.y = -0.1; scene.add(fles);

  // vorm van het flesje: trapezium, onderaan breder, met afgeronde randen (zoals op de productfoto's)
  function trapezium(onder, boven, hoogte, r) {
    const s = new THREE.Shape();
    const hk = (x0, y0, x1, y1, x2, y2) => { s.lineTo(x0, y0); s.quadraticCurveTo(x1, y1, x2, y2); };
    const d = r || 0.0001;
    s.moveTo(-onder / 2 + d, 0);
    hk(onder / 2 - d, 0, onder / 2, 0, onder / 2 - d * 0.3, d);
    hk(boven / 2 + d * 0.3, hoogte - d, boven / 2, hoogte, boven / 2 - d, hoogte);
    hk(-boven / 2 + d, hoogte, -boven / 2, hoogte, -boven / 2 - d * 0.3, hoogte - d);
    hk(-onder / 2 + d * 0.3, d, -onder / 2, 0, -onder / 2 + d, 0);
    return s;
  }
  const diepte = 0.66, H = 1.9, ONDER = 1.32, BOVEN = 0.8;
  const glasGeo = new THREE.ExtrudeGeometry(trapezium(ONDER, BOVEN, H, 0.06), { depth: diepte, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 8 });
  glasGeo.translate(0, -1.05, -diepte / 2);
  const glasMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.9, ior: 1.5,
    specularIntensity: 0.8, clearcoat: 1, clearcoatRoughness: 0.03, dispersion: 0.15,
    attenuationColor: 0xeef0ff, attenuationDistance: 3, envMapIntensity: 0.7,
  });
  fles.add(new THREE.Mesh(glasGeo, glasMat));

  // vloeistof: dikke glazen bodem eronder, vulniveau net onder de schouder
  const bodem = 0.26, vul = 1.38;
  const vOnder = ONDER - 0.24, vBoven = (ONDER - (ONDER - BOVEN) * ((bodem + vul) / H)) - 0.24;
  const vloeistofGeo = new THREE.ExtrudeGeometry(trapezium(vOnder - (ONDER - BOVEN) * (bodem / H), vBoven, vul, 0.04), { depth: diepte - 0.2, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
  vloeistofGeo.translate(0, -1.05 + bodem, -(diepte - 0.2) / 2);
  const vloeistofMat = new THREE.MeshPhysicalMaterial({ color: GEUREN.iris.vloeistof, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9 });
  fles.add(new THREE.Mesh(vloeistofGeo, vloeistofMat));

  // spraybuisje in de vloeistof
  const buis = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.55, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.45 }));
  buis.position.set(0, -0.08, 0); fles.add(buis);

  // metalen hals (krimpring) en dop met afgeronde bovenrand
  const metaal = new THREE.MeshPhysicalMaterial({ color: 0xd8d8dc, metalness: 1, roughness: 0.18, envMapIntensity: 1.3 });
  const hals = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.14, 48), metaal);
  hals.position.y = 0.97; fles.add(hals);
  const kraag = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.018, 12, 48), metaal);
  kraag.rotation.x = Math.PI / 2; kraag.position.y = 0.91; fles.add(kraag);
  const dopProfiel = [];
  const R = 0.27, DH = 0.64, rr = 0.05;
  dopProfiel.push(new THREE.Vector2(0, 0), new THREE.Vector2(R - 0.01, 0), new THREE.Vector2(R, 0.01), new THREE.Vector2(R, DH - rr));
  for (let i = 1; i <= 8; i++) { const h = (i / 8) * Math.PI / 2; dopProfiel.push(new THREE.Vector2(R - rr + Math.cos(h) * rr, DH - rr + Math.sin(h) * rr)); }
  dopProfiel.push(new THREE.Vector2(0, DH));
  const dop = new THREE.Mesh(new THREE.LatheGeometry(dopProfiel, 64), new THREE.MeshPhysicalMaterial({ color: 0x0d0c10, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.2 }));
  dop.position.y = 1.04; fles.add(dop);

  // etiket: canvas-textuur in de huisstijl (MERIDIAN, korte lijn, geurnaam)
  const etiketCanvas = document.createElement('canvas'); etiketCanvas.width = 512; etiketCanvas.height = 600; // tekenen op 2x voor scherpte
  const etiketTex = new THREE.CanvasTexture(etiketCanvas); etiketTex.colorSpace = THREE.SRGBColorSpace; etiketTex.anisotropy = 8; etiketTex.generateMipmaps = true;
  function tekenEtiket(geur) {
    const g = etiketCanvas.getContext('2d');
    g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, 512, 600);
    for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(39,29,53,' + (Math.random() * 0.025) + ')'; g.fillRect(Math.random() * 512, Math.random() * 600, 1.5, 1.5); }
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
  const etiket = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), new THREE.MeshStandardMaterial({ map: etiketTex, roughness: 0.9, emissive: 0xffffff, emissiveMap: etiketTex, emissiveIntensity: 0.55 }));
  etiket.position.set(0, 0.02, diepte / 2 + 0.072); fles.add(etiket);

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
    tekenLucht(GEUREN[geur].lucht[0], GEUREN[geur].lucht[1]);
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
