import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WOMEN = ["White", "Black", "Latin", "Asian", "BlackA", "WhiteA", "BlackB", "LatinA"];
const EYES = ["blue", "bluegreen", "brown", "brownlight", "deepblue", "green", "grey", "ice", "lightblue"];
const OUTFIT_NAMES = {
  base: "Underwear", tactical: "Tactical", hoodie: "Hoodie", oldjacket: "Old Jacket", leatherjacket: "Leather Jacket",
  puffyjacket: "Puffy Jacket", tuxedo: "Tuxedo", pyjamas: "Silk Pyjamas", wetsuit: "Wetsuit", spacesuit: "Space Suit",
  priest: "Priest", flightattendant: "Flight Attendant", goldenarmour: "Golden Armour", v_camosuit: "Virginia Camo Suit",
  v_dress: "Virginia Dress", v_leathersuit: "Virginia Leather Suit", v_tracksuit: "Virginia Tracksuit", v_swimsuit: "Virginia Swimsuit"
};
const PIECE_NAMES = {
  wolgade_female_top_01: "Bra", wolgade_female_panties_01: "Panties", elvs_emt_uniform_jacket_female: "Jacket",
  cortu_cargo_pants: "Cargo pants", mindfront_shoes_biker_boots_female: "Boots", elvs_hooded_sweat_jacket1: "Hoodie",
  toigo_fisherman_sweater: "Sweater", elvs_halter_style_pantsuit1: "Pantsuit", "scailman_low-heeled_boots": "Boots",
  elvs_male_shirt_untucked_bd1: "Shirt", toigo_wool_pants: "Pants", punkduck_wetsuit: "Wetsuit",
  elvs_racing_fire_suit_female1: "Suit", donitz_monk_robe: "Robe", toigo_shift_dress: "Dress",
  culturalibre_hero_suit_1: "Bodysuit", tiomegamanx_skintight_body_suit_female: "Bodysuit",
  toigo_halter_dress_knee_length: "Dress", mindfront_female_trousers_1: "Pants", "mindfront_f_one-piece_swimsuit_01": "Swimsuit"
};
const STORE = "fc-editor-v1";
const $ = id => document.getElementById(id);

let defaults = null;
let state = null;
let current = { woman: 0, outfit: "base" };
const loaded = {};
const textures = {};

const renderer = new THREE.WebGLRenderer({ canvas: $("view"), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--stage").trim() || "#c9ccc6");
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
camera.position.set(0, 1.05, 4.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.95, 0);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f86, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(2, 3, 3);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.0);
rim.position.set(-2, 2, -3);
scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshStandardMaterial({ color: 0x8d918a, roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const draco = new DRACOLoader();
draco.setDecoderPath("vendor/three/examples/jsm/libs/draco/gltf/");
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const texLoader = new THREE.TextureLoader();

function resize() {
  const el = renderer.domElement.parentElement;
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function status(text) { $("status").textContent = text; }

function lin(x) { return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(rgb) { return "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }

function tex(name) {
  if (textures[name]) return textures[name];
  const t = texLoader.load(`assets/${name}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  textures[name] = t;
  return t;
}

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

async function fetchDefaults() {
  const women = [];
  for (let i = 0; i < 8; i++) women.push(await (await fetch(`settings/woman${i}.json`)).json());
  const outfits = await (await fetch("settings/outfits.json")).json();
  return { women, outfits };
}

function outfitList(name) {
  const parts = name.split("__");
  return parts.length > 1 ? parts[1].split("+") : [];
}

function assetOf(name) {
  const parts = name.split("__");
  return parts.length > 2 ? parts[2] : null;
}

function entryFor(outfit, asset) {
  return (state.outfits[outfit] || []).find(e => e[0] === asset);
}

async function getWoman(i) {
  if (loaded[i]) return loaded[i];
  status(`Loading Woman${i}`);
  const gltf = await loader.loadAsync(`assets/woman${i}.gltf`);
  const root = gltf.scene;
  root.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(m => {
      m.transparent = false;
      m.alphaTest = 0.5;
      m.depthWrite = true;
      m.side = THREE.DoubleSide;
    });
    if (o.name.startsWith("piece__")) {
      o.material = o.material.clone();
      const pos = o.geometry.attributes.position;
      o.userData.base = pos.array.slice();
    }
  });
  loaded[i] = { root, unitScale: 1 };
  return loaded[i];
}

function applyFit(mesh, offset, scaleK) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const base = mesh.userData.base;
  const d = (offset || 0) * scaleK;
  for (let i = 0; i < pos.count; i++) {
    pos.array[i * 3] = base[i * 3] + nrm.array[i * 3] * d;
    pos.array[i * 3 + 1] = base[i * 3 + 1] + nrm.array[i * 3 + 1] * d;
    pos.array[i * 3 + 2] = base[i * 3 + 2] + nrm.array[i * 3 + 2] * d;
  }
  pos.needsUpdate = true;
}

function setMap(m, name) {
  const t = tex(name);
  if (m.map !== t) {
    m.map = t;
    m.needsUpdate = true;
  }
}

function paint() {
  const w = loaded[current.woman];
  if (!w) return;
  const ws = state.women[current.woman];
  const outfit = current.outfit;
  w.root.traverse(o => {
    if (!o.isMesh) return;
    const n = o.name;
    if (n.startsWith("body__") || n.startsWith("piece__")) {
      o.visible = outfitList(n).includes(outfit);
    }
    if (!o.visible) return;
    const m = o.material;
    if (n.startsWith("body__")) {
      setMap(m, `skin_${ws.skin}.png`);
      const t = ws.skintint || [1, 1, 1];
      m.color.setRGB(lin(t[0]), lin(t[1]), lin(t[2]));
    } else if (n.endsWith("_hair")) {
      const c = ws.hairrgb;
      m.color.setRGB(lin(2 * c[0] / 255), lin(2 * c[1] / 255), lin(2 * c[2] / 255));
    } else if (n.endsWith("_eyes")) {
      setMap(m, `eye_${ws.eyecolor}.png`);
      m.color.setRGB(1, 1, 1);
    } else if (n.startsWith("piece__")) {
      const asset = assetOf(n);
      const e = entryFor(outfit, asset);
      if (!e) return;
      const rgb = e[1];
      if (rgb === "camo") {
        setMap(m, `camo_${asset}.png`);
        m.color.setRGB(1, 1, 1);
      } else if (rgb === null || rgb === undefined) {
        setMap(m, `orig_${asset}.png`);
        m.color.setRGB(1, 1, 1);
      } else {
        setMap(m, `lum_${asset}.png`);
        m.color.setRGB(lin(2 * rgb[0] / 255), lin(2 * rgb[1] / 255), lin(2 * rgb[2] / 255));
      }
      applyFit(o, e[2] || 0, w.unitScale);
    }
  });
}

async function show() {
  for (const k in loaded) if (loaded[k].root.parent) scene.remove(loaded[k].root);
  const w = await getWoman(current.woman);
  scene.add(w.root);
  paint();
  status(`Woman${current.woman} (${WOMEN[current.woman]}) in ${OUTFIT_NAMES[current.outfit] || current.outfit}`);
}

function buildPieces() {
  const box = $("pieces");
  box.innerHTML = "";
  (state.outfits[current.outfit] || []).forEach((e, idx) => {
    const asset = e[0];
    const div = document.createElement("div");
    div.className = "piece";
    const mode = e[1] === "camo" ? "camo" : (e[1] == null ? "orig" : "color");
    const colorHex = Array.isArray(e[1]) ? rgbToHex(e[1]) : "#808080";
    const fit = Math.round((e[2] || 0) * 1000);
    div.innerHTML = `
      <div class="name">${PIECE_NAMES[asset] || asset}</div>
      <label class="row">Look <select data-k="mode">
        <option value="color"${mode === "color" ? " selected" : ""}>Custom color</option>
        <option value="orig"${mode === "orig" ? " selected" : ""}>Original colors</option>
        <option value="camo"${mode === "camo" ? " selected" : ""}>Camo</option>
      </select></label>
      <label class="row">Color <input type="color" data-k="color" value="${colorHex}"${mode === "color" ? "" : " disabled"}></label>
      <div class="fit"><span>Fit</span><input type="range" min="-10" max="30" step="1" value="${fit}" data-k="fit"><output>${fit} mm</output></div>`;
    const modeSel = div.querySelector('[data-k="mode"]');
    const colorIn = div.querySelector('[data-k="color"]');
    const fitIn = div.querySelector('[data-k="fit"]');
    const fitOut = div.querySelector("output");
    modeSel.addEventListener("change", () => {
      e[1] = modeSel.value === "camo" ? "camo" : (modeSel.value === "orig" ? null : hexToRgb(colorIn.value));
      colorIn.disabled = modeSel.value !== "color";
      changed();
    });
    colorIn.addEventListener("input", () => { e[1] = hexToRgb(colorIn.value); changed(); });
    fitIn.addEventListener("input", () => {
      const v = parseInt(fitIn.value, 10);
      fitOut.textContent = `${v} mm`;
      while (e.length < 3) e.push(0);
      e[2] = v / 1000;
      changed();
    });
    box.appendChild(div);
  });
}

function syncBody() {
  const ws = state.women[current.woman];
  const t = ws.skintint || [1, 1, 1];
  $("skin").value = rgbToHex(t.map(v => v * 255));
  $("hair").value = rgbToHex(ws.hairrgb);
  $("eyes").value = ws.eyecolor;
}

function changed() {
  save();
  paint();
}

function fillSelects() {
  $("woman").innerHTML = WOMEN.map((r, i) => `<option value="${i}">Woman${i} (${r})</option>`).join("");
  $("outfit").innerHTML = Object.keys(state.outfits).map(o => `<option value="${o}">${OUTFIT_NAMES[o] || o}</option>`).join("");
  $("eyes").innerHTML = EYES.map(c => `<option value="${c}">${c}</option>`).join("");
  $("woman").value = current.woman;
  $("outfit").value = current.outfit;
}

function wire() {
  $("woman").addEventListener("change", async () => { current.woman = +$("woman").value; syncBody(); await show(); });
  $("outfit").addEventListener("change", () => { current.outfit = $("outfit").value; buildPieces(); show(); });
  $("skin").addEventListener("input", () => {
    const rgb = hexToRgb($("skin").value).map(v => +(v / 255).toFixed(3));
    state.women[current.woman].skintint = rgb;
    changed();
  });
  $("hair").addEventListener("input", () => { state.women[current.woman].hairrgb = hexToRgb($("hair").value); changed(); });
  $("eyes").addEventListener("change", () => { state.women[current.woman].eyecolor = $("eyes").value; changed(); });
  $("export").addEventListener("click", exportZip);
  $("import").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", importZip);
  $("reset").addEventListener("click", () => {
    if (!confirmReset()) return;
    state = JSON.parse(JSON.stringify(defaults));
    save();
    syncBody();
    buildPieces();
    paint();
  });
}

function confirmReset() {
  const b = $("reset");
  if (b.dataset.armed) {
    delete b.dataset.armed;
    b.textContent = "Reset everything";
    return true;
  }
  b.dataset.armed = "1";
  b.textContent = "Click again to reset";
  setTimeout(() => { delete b.dataset.armed; b.textContent = "Reset everything"; }, 3000);
  return false;
}

async function exportZip() {
  const zip = new JSZip();
  state.women.forEach((w, i) => zip.file(`woman${i}.json`, JSON.stringify(w, null, 1)));
  zip.file("outfits.json", JSON.stringify(state.outfits, null, 1));
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "femalecharacter-settings.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  status("Exported femalecharacter-settings.zip");
}

async function importZip(ev) {
  const f = ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  try {
    const zip = await JSZip.loadAsync(f);
    const next = JSON.parse(JSON.stringify(state));
    for (let i = 0; i < 8; i++) {
      const file = zip.file(`woman${i}.json`);
      if (file) next.women[i] = JSON.parse(await file.async("string"));
    }
    const of = zip.file("outfits.json");
    if (of) next.outfits = JSON.parse(await of.async("string"));
    state = next;
    save();
    fillSelects();
    syncBody();
    buildPieces();
    paint();
    status(`Imported ${f.name}`);
  } catch (e) {
    status(`Could not read ${f.name}`);
  }
}

function loop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

(async () => {
  resize();
  loop();
  defaults = await fetchDefaults();
  state = load() || JSON.parse(JSON.stringify(defaults));
  fillSelects();
  syncBody();
  wire();
  buildPieces();
  await show();
})();
