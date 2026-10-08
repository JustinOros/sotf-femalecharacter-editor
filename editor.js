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
const hiddenPieces = new Set();
const EYE_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_SHUT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const DEFAULT_LAYERS = {
  wolgade_female_top_01: 10, wolgade_female_panties_01: 10, "mindfront_f_one-piece_swimsuit_01": 10,
  cortu_cargo_pants: 20, toigo_wool_pants: 20, mindfront_female_trousers_1: 20,
  elvs_male_shirt_untucked_bd1: 30, elvs_halter_style_pantsuit1: 30, punkduck_wetsuit: 30, elvs_racing_fire_suit_female1: 30,
  culturalibre_hero_suit_1: 30, tiomegamanx_skintight_body_suit_female: 30,
  mindfront_shoes_biker_boots_female: 40, "scailman_low-heeled_boots": 40,
  elvs_emt_uniform_jacket_female: 50, elvs_hooded_sweat_jacket1: 50, toigo_fisherman_sweater: 50,
  toigo_shift_dress: 60, toigo_halter_dress_knee_length: 60, donitz_monk_robe: 60
};

function layerOf(e) {
  return e.length > 3 && Number.isFinite(e[3]) ? e[3] : (DEFAULT_LAYERS[e[0]] ?? 30);
}

function withLayers(outfits) {
  for (const k in outfits) {
    outfits[k].forEach(e => {
      while (e.length < 3) e.push(0);
      if (e.length < 4) e.push(DEFAULT_LAYERS[e[0]] ?? 30);
    });
  }
  return outfits;
}
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
  const outfits = withLayers(await (await fetch("settings/outfits.json")).json());
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
      m.alphaTest = /_(hair|eyebrows|eyelashes|eyes)$/.test(o.name) ? 0.5 : 0;
      m.depthWrite = true;
      m.side = THREE.DoubleSide;
    });
    if (o.name.startsWith("piece__") || /_hair$/.test(o.name)) {
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
  const layered = [];
  w.root.traverse(o => {
    if (!o.isMesh) return;
    const n = o.name;
    if (n.startsWith("body__") || n.startsWith("piece__")) {
      const anyHidden = [...hiddenPieces].some(h => h.startsWith(`${outfit}|`));
      if (n.startsWith("body__")) o.visible = outfitList(n).includes(anyHidden ? "base" : outfit);
      else o.visible = (outfitList(n).includes(outfit) && !hiddenPieces.has(`${outfit}|${assetOf(n)}`)) || (anyHidden && outfit !== "base" && outfitList(n).includes("base"));
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
      const e = entryFor(outfit, asset) || entryFor("base", asset);
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
      layered.push({ mesh: o, layer: layerOf(e) });
    }
  });
  applyLayers(layered);
  w.root.traverse(o => {
    if (!o.isMesh || !/_hair$/.test(o.name) || !o.userData.base) return;
    if (o.userData.axisZ === undefined) {
      let body = null;
      w.root.traverse(b => { if (b.isMesh && b.name === "body__base") body = b; });
      const bp = body ? body.geometry.attributes.position.array : null;
      const zs = [];
      if (bp) for (let i = 0; i < bp.length; i += 3) if (bp[i + 1] > 1.1 && bp[i + 1] < 1.4 && Math.abs(bp[i]) < 0.12) zs.push(bp[i + 2]);
      zs.sort((p, q) => p - q);
      o.userData.axisZ = zs.length ? zs[zs.length >> 1] : 0;
    }
    const pos = o.geometry.attributes.position;
    pos.array.set(o.userData.base);
    pos.needsUpdate = true;
    layered.forEach(item => pushOutside(o, item.mesh));
  });
}

function pushOutside(hair, piece, reach = 0.15, gap = 0.008) {
  const hp = piece.geometry.attributes.position.array;
  const lp = hair.geometry.attributes.position;
  const a = lp.array;
  const zc = hair.userData.axisZ ?? 0;
  const SLICES = 128, CELL = 0.01;
  const grid = new Map();
  const bucket = (x, y, z) => {
    const ang = Math.atan2(z - zc, x);
    return [Math.floor((ang + Math.PI) / (2 * Math.PI) * SLICES), Math.floor(y / CELL)];
  };
  for (let i = 0; i < hp.length; i += 3) {
    const [s, h] = bucket(hp[i], hp[i + 1], hp[i + 2]);
    const k = s * 100000 + h;
    let list = grid.get(k);
    if (!list) grid.set(k, list = []);
    list.push(Math.hypot(hp[i], hp[i + 2] - zc));
  }
  let moved = 0;
  for (let v = 0; v < a.length; v += 3) {
    const x = a[v], y = a[v + 1], z = a[v + 2];
    const r = Math.hypot(x, z - zc);
    if (r < 1e-4) continue;
    const [s, h] = bucket(x, y, z);
    let maxR = -1;
    for (let ds = -1; ds <= 1; ds++) for (let dh = -1; dh <= 1; dh++) {
      const list = grid.get(((s + ds + SLICES) % SLICES) * 100000 + h + dh);
      if (!list) continue;
      for (const pr of list) if (pr < r + reach && pr > maxR) maxR = pr;
    }
    if (maxR < 0 || r >= maxR + gap) continue;
    const k = (maxR + gap) / r;
    a[v] = x * k;
    a[v + 2] = zc + (z - zc) * k;
    moved++;
  }
  if (moved) lp.needsUpdate = true;
}

function applyLayers(items) {
  items.sort((a, b) => b.layer - a.layer);
  for (let i = 1; i < items.length; i++) {
    for (let k = 0; k < i; k++) {
      if (items[k].layer > items[i].layer) pushInside(items[i].mesh, items[k].mesh);
    }
  }
}

function pushInside(low, high, reach = 0.05, gap = 0.006, side = 0.02) {
  const hp = high.geometry.attributes.position.array;
  const hn = high.geometry.attributes.normal.array;
  const lp = low.geometry.attributes.position;
  const a = lp.array;
  const ln = low.geometry.attributes.normal.array;
  const cell = reach;
  const grid = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  for (let i = 0; i < hp.length; i += 3) {
    const k = key(Math.floor(hp[i] / cell), Math.floor(hp[i + 1] / cell), Math.floor(hp[i + 2] / cell));
    let list = grid.get(k);
    if (!list) grid.set(k, list = []);
    list.push(i);
  }
  const r2 = reach * reach;
  let moved = 0;
  for (let v = 0; v < a.length; v += 3) {
    const x = a[v], y = a[v + 1], z = a[v + 2];
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
    let best = -1, bd = r2;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(key(cx + dx, cy + dy, cz + dz));
      if (!list) continue;
      for (const i of list) {
        const ex = x - hp[i], ey = y - hp[i + 1], ez = z - hp[i + 2];
        const d2 = ex * ex + ey * ey + ez * ez;
        if (d2 < bd) { bd = d2; best = i; }
      }
    }
    if (best < 0) continue;
    let nx = ln[v], ny = ln[v + 1], nz = ln[v + 2];
    if (nx * hn[best] + ny * hn[best + 1] + nz * hn[best + 2] < 0) { nx = hn[best]; ny = hn[best + 1]; nz = hn[best + 2]; }
    const d = (x - hp[best]) * nx + (y - hp[best + 1]) * ny + (z - hp[best + 2]) * nz;
    const t2 = bd - d * d;
    if (d > -gap && t2 < side * side) {
      const s = d + gap;
      a[v] = x - nx * s;
      a[v + 1] = y - ny * s;
      a[v + 2] = z - nz * s;
      moved++;
    }
  }
  if (moved) lp.needsUpdate = true;
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
      <div class="head"><span class="name">${PIECE_NAMES[asset] || asset}</span><button type="button" class="eye" data-k="eye"></button></div>
      <label class="row">Look <select data-k="mode">
        <option value="color"${mode === "color" ? " selected" : ""}>Custom color</option>
        <option value="orig"${mode === "orig" ? " selected" : ""}>Original colors</option>
        <option value="camo"${mode === "camo" ? " selected" : ""}>Camo</option>
      </select></label>
      <label class="row">Color <input type="color" data-k="color" value="${colorHex}"${mode === "color" ? "" : " disabled"}></label>
      <div class="fit"><span>Fit</span><button type="button" class="step" data-k="minus" aria-label="Tighter">-</button><input type="range" min="-10" max="30" step="1" value="${fit}" data-k="fit"><button type="button" class="step" data-k="plus" aria-label="Looser">+</button><output>${fit} mm</output></div>
      <label class="row">Layer <input type="number" min="0" max="99" step="1" value="${layerOf(e)}" data-k="layer"></label>`;
    const modeSel = div.querySelector('[data-k="mode"]');
    const colorIn = div.querySelector('[data-k="color"]');
    const fitIn = div.querySelector('[data-k="fit"]');
    const fitOut = div.querySelector("output");
    const layerIn = div.querySelector('[data-k="layer"]');
    const eye = div.querySelector('[data-k="eye"]');
    const hideKey = `${current.outfit}|${asset}`;
    const drawEye = () => {
      const off = hiddenPieces.has(hideKey);
      eye.innerHTML = off ? EYE_SHUT : EYE_OPEN;
      eye.title = off ? "Show this piece" : "Hide this piece";
      eye.setAttribute("aria-label", eye.title);
      div.classList.toggle("off", off);
    };
    drawEye();
    if (current.outfit === "base") {
      eye.disabled = true;
      eye.title = "Underwear always stays on";
      eye.setAttribute("aria-label", eye.title);
    }
    eye.addEventListener("click", () => {
      if (eye.disabled) return;
      if (hiddenPieces.has(hideKey)) hiddenPieces.delete(hideKey); else hiddenPieces.add(hideKey);
      drawEye();
      paint();
    });
    layerIn.addEventListener("change", () => {
      let v = parseInt(layerIn.value, 10);
      if (!Number.isFinite(v)) v = layerOf(e);
      v = Math.max(0, Math.min(99, v));
      layerIn.value = v;
      while (e.length < 4) e.push(e.length === 2 ? 0 : layerOf(e));
      e[3] = v;
      save();
    });
    modeSel.addEventListener("change", () => {
      e[1] = modeSel.value === "camo" ? "camo" : (modeSel.value === "orig" ? null : hexToRgb(colorIn.value));
      colorIn.disabled = modeSel.value !== "color";
      changed();
    });
    colorIn.addEventListener("input", () => { e[1] = hexToRgb(colorIn.value); changed(); });
    const setFit = v => {
      v = Math.max(-10, Math.min(30, v));
      fitIn.value = v;
      fitOut.textContent = `${v} mm`;
      while (e.length < 3) e.push(0);
      e[2] = v / 1000;
      changed();
    };
    fitIn.addEventListener("input", () => setFit(parseInt(fitIn.value, 10)));
    div.querySelector('[data-k="minus"]').addEventListener("click", () => setFit(parseInt(fitIn.value, 10) - 1));
    div.querySelector('[data-k="plus"]').addEventListener("click", () => setFit(parseInt(fitIn.value, 10) + 1));
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
    if (of) next.outfits = withLayers(JSON.parse(await of.async("string")));
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
  withLayers(state.outfits);
  fillSelects();
  syncBody();
  wire();
  buildPieces();
  await show();
})();
