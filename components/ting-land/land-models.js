/* eslint-disable */
import * as THREE from 'three';
import { getTextures, rep } from './land-textures.js';
export { texturesReady } from './land-textures.js';

// Ting family land — Sitiawan, Perak. ≈ 90 × 90 m plot. Meters, y-up.
export const PLOT = 90, HALF = 45, TRACK_Z = 42.5;
const TAU = Math.PI * 2, GA = 2.399963;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function xf(g, p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  const sc = Array.isArray(s) ? V(...s) : V(s, s, s);
  g.applyMatrix4(new THREE.Matrix4().compose(V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], 'YXZ')), sc));
  return g;
}
function along(g, from, dir) {
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  g.translate(from.x, from.y, from.z);
  return g;
}
export function merge(list) {
  const geos = list.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), hasC = geos.some(g => g.attributes.color), col = hasC ? new Float32Array(n * 3).fill(1) : null;
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    if (hasC && g.attributes.color) col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (hasC) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
function twoSided(g) {
  const a = g.index ? g.toNonIndexed() : g, b = a.clone();
  for (const key of ['position', 'normal', 'uv']) {
    const at = b.attributes[key]; if (!at) continue;
    const s = at.itemSize, arr = at.array;
    for (let t = 0; t < at.count; t += 3) for (let c = 0; c < s; c++) { const i1 = (t + 1) * s + c, i2 = (t + 2) * s + c, tmp = arr[i1]; arr[i1] = arr[i2]; arr[i2] = tmp; }
  }
  return merge([a, b]);
}
// leaf-cluster cards scattered through ellipsoid blobs; normals point out from the crown centre so the canopy shades as one soft volume
function foliage(blobs, r, { density, size, center, sy = 1, up = 0.35 }) {
  const parts = [], q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), Z = V(0, 0, 1), d = V();
  for (const [cx, cy, cz, rad, ey = 0.8] of blobs) {
    const n = Math.max(3, Math.round(density * rad * rad));
    for (let k = 0; k < n; k++) {
      const u = r() * 2 - 1, th = r() * TAU, s = Math.sqrt(1 - u * u), rr = rad * (0.5 + 0.5 * Math.cbrt(r()));
      const off = V(Math.cos(th) * s * rr, u * rr * ey, Math.sin(th) * s * rr);
      const sz = size * (0.75 + r() * 0.5), g = new THREE.PlaneGeometry(sz, sz);
      const nrm = off.clone().normalize().add(V((r() - 0.5) * 1.2, (r() - 0.5) * 1.2 + up, (r() - 0.5) * 1.2)).normalize();
      q.setFromUnitVectors(Z, nrm); q2.setFromAxisAngle(nrm, r() * TAU); g.applyQuaternion(q.premultiply(q2));
      g.translate(cx + off.x, cy + off.y, cz + off.z);
      const p = g.attributes.position, na = g.attributes.normal;
      for (let i = 0; i < p.count; i++) { d.set(p.getX(i) - center.x, (p.getY(i) - center.y) / sy, p.getZ(i) - center.z).normalize(); d.y = d.y * 0.8 + 0.3; d.normalize(); na.setXYZ(i, d.x, d.y, d.z); }
      parts.push(g);
    }
  }
  return twoSided(merge(parts));
}
function taperTube(curve, segs, r0, r1, radial = 6) {
  const g = new THREE.TubeGeometry(curve, segs, 1, radial), p = g.attributes.position, n = g.attributes.normal, c = V();
  for (let i = 0; i <= segs; i++) { curve.getPointAt(i / segs, c); const rad = r0 + (r1 - r0) * i / segs; for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; p.setXYZ(k, c.x + n.getX(k) * rad, c.y + n.getY(k) * rad, c.z + n.getZ(k) * rad); } }
  return g;
}
function bumpify(g, amp, f = 70) {
  const p = g.attributes.position;
  g.computeVertexNormals(); const n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = amp * (Math.sin(x * f + y * f * 0.7) * 0.5 + Math.sin(y * f * 1.9 + z * f * 1.3) * 0.3 + Math.sin(z * f * 2.7 - x * f * 2.1) * 0.2); p.setXYZ(i, x + n.getX(i) * k, y + n.getY(i) * k, z + n.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}
const sRGB = h => new THREE.Color(h);
const FR = { base: sRGB('#f2a838'), mid: sRGB('#d8471b'), tip: sRGB('#2e0b09'), pale: sRGB('#f1d27c'), paleTip: sRGB('#f0a446') };
// oil-palm fruitlet colouring: pale where it sits on the spikelet, orange-red body, dark sun-exposed apex
function fruitColors(g, y0, y1, outer, yy, r) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), dark = outer ? (0.45 + 0.55 * smooth(-0.5, 0.6, yy)) * (0.65 + r() * 0.35) : 0;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) - y0) / (y1 - y0);
    if (outer) { c.copy(FR.base).lerp(FR.mid, smooth(0.08, 0.5, t)); c.lerp(FR.tip, smooth(0.55, 1, t) * dark); }
    else c.copy(FR.pale).lerp(FR.paleTip, smooth(0.3, 1, t));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
// merged mesh whose single morph target pushes every part outward by its own offset (exploded view)
function morphMesh(list, mat, name) {
  const geos = list.map(o => (o.g.index ? o.g.toNonIndexed() : o.g)), base = merge(geos), mp = new Float32Array(base.attributes.position.array);
  let o = 0;
  geos.forEach((g, k) => { const off = list[k].off; for (let i = 0; i < g.attributes.position.count; i++, o++) { mp[o * 3] += off.x; mp[o * 3 + 1] += off.y; mp[o * 3 + 2] += off.z; } });
  base.morphAttributes.position = [new THREE.BufferAttribute(mp, 3)];
  const me = mesh(base, mat, name); me.updateMorphTargets(); me.morphTargetInfluences[0] = 0; return me;
}
function normUV(g, R) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / (2 * R) + 0.5, p.getY(i) / (2 * R) + 0.5); return g; }
function sphN(g) { const p = g.attributes.position, n = g.attributes.normal, t = V(); for (let i = 0; i < p.count; i++) { t.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); n.setXYZ(i, t.x, t.y, t.z); } return g; }
function mesh(geo, mat, name, cast = true) { const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = cast; m.receiveShadow = true; return m; }

export function makeMaterials() {
  const DS = THREE.DoubleSide;
  const m = (name, color, roughness = 0.85, extra = {}) => Object.assign(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }), { name });
  const M = {
    ground: m('ground_cover', 0x4a5e2e, 1), track: m('laterite_track', 0xa25a34, 0.95),
    topsoil: m('topsoil', 0x3a2a1d, 0.95), laterite: m('laterite', 0x9a4b27, 0.95), clay: m('clay', 0xb88a52, 0.95), bedrock: m('bedrock', 0x5f5b55, 0.9),
    shrub: m('wild_scrub', 0x324d27, 0.9, { flatShading: true }), wildBark: m('wild_bark', 0x4b4136, 0.95),
    bananaStem: m('banana_pseudostem', 0x7d8c43, 0.8), bananaLeaf: m('banana_leaf', 0x6a9a3a, 0.7, { side: DS }),
    bananaFruit: m('banana_fruit', 0x9fb33c, 0.6), bananaHeart: m('banana_heart', 0x5a2141, 0.55),
    papayaTrunk: m('papaya_trunk', 0x8a876c, 0.85), papayaLeaf: m('papaya_leaf', 0x5b8b2f, 0.75, { side: DS }), papayaFruit: m('papaya_fruit', 0xe0802a, 0.5), papayaGreen: m('papaya_fruit_unripe', 0x7a9a3a, 0.55),
    rubberBark: m('rubber_bark', 0x7a5232, 0.9), tappedBark: m('tapped_bark', 0xc49a68, 0.85), rubberLeaf: m('rubber_canopy', 0x3f6a34, 0.85, { flatShading: true }),
    latex: m('latex', 0xf4f0e4, 0.3), cup: m('latex_cup', 0x5a4330, 0.6, { side: DS }),
    palmTrunk: m('palm_trunk', 0x5a4933, 0.95), palmFrond: m('palm_frond', 0x3c6a2b, 0.72, { side: DS }),
    palmFruit: m('palm_fruitlet_ripe', 0xc0401b, 0.45), palmFruitDark: m('palm_fruitlet_dark', 0x4a1a12, 0.45), bunchStalk: m('bunch_stalk', 0x6e5a33, 0.85),
    peel: m('banana_peel', 0xe6c445, 0.6, { side: DS }), peelIn: m('banana_peel_inner', 0xf1e9c9, 0.7, { side: DS }),
    bFlesh: m('banana_flesh', 0xf3e4b4, 0.6, { side: DS }), bCore: m('banana_core', 0xe7d391, 0.6, { side: DS }), seed: m('seed', 0x1d1714, 0.35, { side: DS }),
    pSkin: m('papaya_skin', 0xe0802a, 0.5, { side: DS }), pFlesh: m('papaya_flesh', 0xea6f2c, 0.55, { side: DS }),
    barkOuter: m('outer_bark', 0x7a5232, 0.9, { side: DS }), barkCut: m('outer_bark_section', 0x5e3f26, 0.9, { side: DS }),
    softBark: m('soft_bark', 0xc39a68, 0.85, { side: DS }), vessel: m('latex_vessels', 0xf6f2e6, 0.4, { side: DS }),
    cambium: m('cambium', 0xb3bb4e, 0.6, { side: DS }), wood: m('rubberwood', 0xead9b2, 0.75, { side: DS }), ring: m('growth_ring', 0xcdb487, 0.75, { side: DS }),
    exo: m('exocarp', 0xc2381a, 0.4, { side: DS }), meso: m('mesocarp', 0xf2a134, 0.5, { side: DS }),
    shell: m('endocarp_shell', 0x33241b, 0.55, { side: DS }), kernel: m('kernel', 0xf2ebdc, 0.6, { side: DS }),
    bananaDead: m('banana_leaf_dead', 0xffffff, 0.9, { side: DS }), palmFrondOld: m('palm_frond_old', 0xffffff, 0.75, { side: DS }),
    palmRachis: m('palm_rachis', 0x7a7a3c, 0.7), grass: m('grass', 0xffffff, 0.9),
    ffbFruit: m('palm_fruitlets', 0xffffff, 0.3, { vertexColors: true }), spikelet: m('spikelet', 0xc2a466, 0.8), spine: m('spikelet_spine', 0x3a2618, 0.55),
    stalkCut: m('bunch_stalk_cut', 0xffffff, 0.85),
  };
  const T = getTextures(), W = 0xffffff, n2 = s => new THREE.Vector2(s, s);
  const set = (k, o) => { const { color, ...rest } = o; Object.assign(M[k], rest); if (color !== undefined) M[k].color = new THREE.Color(color); };
  set('ground', { map: rep(T.ground.map, 22, 22), normalMap: rep(T.ground.normal, 22, 22), normalScale: n2(0.9) });
  for (const [k, h] of [['topsoil', 0.7], ['laterite', 3.2], ['clay', 2.0], ['bedrock', 1.6]]) set(k, { map: rep(T.soil.map, PLOT / 4, h / 4), normalMap: rep(T.soil.normal, PLOT / 4, h / 4) });
  set('track', { map: rep(T.soil.map, 30, 1), normalMap: rep(T.soil.normal, 30, 1) });
  set('rubberBark', { color: W, map: rep(T.barkRubber.map, 1, 5), normalMap: rep(T.barkRubber.normal, 1, 5) });
  set('barkOuter', { color: W, map: rep(T.barkRubber.map, 1, 0.25), normalMap: rep(T.barkRubber.normal, 1, 0.25) });
  set('wildBark', { color: 0xb0a090, map: rep(T.barkRubber.map, 1, 4), normalMap: rep(T.barkRubber.normal, 1, 4) });
  set('tappedBark', { color: W, map: T.barkTapped.map, normalMap: T.barkTapped.normal });
  set('palmTrunk', { color: W, map: rep(T.palmTrunk.map, 3, 4), normalMap: rep(T.palmTrunk.normal, 3, 4), normalScale: n2(1.4) });
  set('bananaStem', { color: W, map: T.bananaStem.map });
  set('papayaTrunk', { color: W, map: rep(T.papayaTrunk.map, 1, 2), normalMap: rep(T.papayaTrunk.normal, 1, 2) });
  set('bananaLeaf', { color: W, map: T.bananaLeaf, alphaTest: 0.5, roughness: 0.6 });
  set('bananaDead', { map: T.bananaDead, alphaTest: 0.5 });
  set('papayaLeaf', { color: W, map: T.papayaLeaf, roughness: 0.65 });
  set('palmFrond', { color: W, map: T.palmFrond, alphaTest: 0.5, roughness: 0.62 });
  set('palmFrondOld', { map: T.palmFrondOld, alphaTest: 0.5 });
  set('bunchStalk', { color: 0xd2bd92, map: rep(T.stalkFiber.map, 2, 1), normalMap: rep(T.stalkFiber.normal, 2, 1) });
  set('stalkCut', { map: T.stalkCut });
  set('spikelet', { map: T.grain });
  const phys = (name, o) => Object.assign(new THREE.MeshPhysicalMaterial({ metalness: 0, side: DS, ...o }), { name });
  Object.assign(M, {
    ffbFruit: phys('palm_fruitlets', { vertexColors: true, side: THREE.FrontSide, map: T.fruitSkin.map, normalMap: T.fruitSkin.normal, normalScale: n2(0.3), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    pfSkin: phys('palm_fruit_exocarp', { vertexColors: true, map: rep(T.fruitSkin.map, 2, 1), normalMap: rep(T.fruitSkin.normal, 2, 1), normalScale: n2(0.4), roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3 }),
    pfSkinCut: phys('palm_fruit_exocarp_cut', { color: 0xa83a18, roughness: 0.5 }),
    pfSkinIn: phys('palm_fruit_exocarp_inner', { color: 0xd8692a, map: rep(T.fibre.map, 3, 1), normalMap: rep(T.fibre.normal, 3, 1), roughness: 0.55 }),
    pfMeso: phys('palm_fruit_mesocarp', { map: T.mesoFace.map, normalMap: T.mesoFace.normal, normalScale: n2(0.7), roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    pfMesoOut: phys('palm_fruit_mesocarp_outer', { color: 0xdc7a2e, map: rep(T.fibre.map, 3, 1), normalMap: rep(T.fibre.normal, 3, 1), roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    pfMesoWall: phys('palm_fruit_mesocarp_wall', { color: 0xeeb866, map: rep(T.fibre.map, 3, 1), normalMap: rep(T.fibre.normal, 3, 1), roughness: 0.5 }),
    pfShell: phys('palm_fruit_endocarp', { color: W, map: rep(T.shellOuter.map, 2, 1), normalMap: rep(T.shellOuter.normal, 2, 1), normalScale: n2(1.2), roughness: 0.6 }),
    pfShellCut: phys('palm_fruit_endocarp_cut', { color: 0x2e1f15, map: T.grain, roughness: 0.5 }),
    pfTesta: phys('palm_kernel_testa', { color: W, map: rep(T.testa.map, 2, 1), normalMap: rep(T.testa.normal, 2, 1), roughness: 0.7 }),
    pfTestaCut: phys('palm_kernel_testa_cut', { color: 0x4a2c18, roughness: 0.6 }),
    pfEndo: phys('palm_kernel_endosperm', { color: 0xeee4cf, roughness: 0.55 }),
    pfEndoCut: phys('palm_kernel_endosperm_cut', { color: 0xf2e9d6, map: T.endo, roughness: 0.42, sheen: 0.3, sheenColor: new THREE.Color(0xffffff) }),
    pfCalyx: phys('palm_fruit_calyx', { color: 0xcdb27c, map: T.fibre.map, normalMap: T.fibre.normal, roughness: 0.8 }),
  });
  set('palmRachis', { map: T.grain });
  set('rubberLeaf', { color: W, map: T.rubberCard, alphaTest: 0.5, side: THREE.FrontSide, flatShading: false, roughness: 0.55 });
  set('shrub', { color: 0xe6ecd8, map: T.wildCard, alphaTest: 0.5, side: THREE.FrontSide, flatShading: false, roughness: 0.7 });
  set('grass', { map: T.grass, alphaTest: 0.45 });
  for (const k of ['bananaFruit', 'peel']) set(k, { map: T.bananaSkin });
  for (const k of ['papayaFruit', 'papayaGreen', 'pSkin']) set(k, { map: T.papayaSkin });
  for (const k of ['bFlesh', 'bCore', 'pFlesh', 'wood', 'meso', 'kernel', 'softBark']) set(k, { map: T.grain });
  for (const k of ['palmFruit', 'palmFruitDark', 'exo']) set(k, { roughness: 0.32 });
  return M;
}

/* ---------------- land ---------------- */
export function heightAt(x, z) {
  const d = Math.min(HALF - Math.abs(x), HALF - Math.abs(z));
  const f = smooth(0, 7, d) * smooth(2.4, 6, Math.abs(z - TRACK_Z));
  return f * (0.32 + 0.2 * Math.sin(x * 0.061 + 1.3) * Math.cos(z * 0.052 - 0.4) + 0.08 * Math.sin(x * 0.17 + z * 0.11) + 0.04 * Math.cos(z * 0.37 - x * 0.21));
}
export function buildLand(M) {
  const g = new THREE.Group(); g.name = 'ting_plot';
  const top = new THREE.PlaneGeometry(PLOT, PLOT, 150, 150).rotateX(-Math.PI / 2);
  const p = top.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)) + 0.004);
  top.computeVertexNormals();
  g.add(mesh(top, M.ground, 'ground_surface', false));
  g.add(mesh(new THREE.PlaneGeometry(PLOT - 0.6, 3.2).rotateX(-Math.PI / 2).translate(0, 0.012, TRACK_Z), M.track, 'laterite_track', false));
  const strata = [['topsoil', 0.7], ['laterite', 3.2], ['clay', 2.0], ['bedrock', 1.6]];
  const bounds = []; let y = 0;
  strata.forEach(([k, h], i) => {
    const w = PLOT - i * 0.3;
    g.add(mesh(new THREE.BoxGeometry(w, h, w).translate(0, y - h / 2, 0), M[k], k, false));
    bounds.push([y, y - h, w / 2]); y -= h;
  });
  const r = rng(11), stones = [];
  for (let i = 0; i < 90; i++) {
    const d = -0.9 - r() * 6.2, L = bounds.find(b => d <= b[0] && d >= b[1]) || bounds[1];
    const u = (r() - 0.5) * (PLOT - 4), s = 0.2 + r() * 0.5, side = Math.floor(r() * 4), hw = L[2];
    const pos = [[hw, d, u], [-hw, d, u], [u, d, hw], [u, d, -hw]][side];
    stones.push(xf(new THREE.DodecahedronGeometry(s, 0), pos, [r() * 3, r() * 3, 0], [1, 0.7, 1]));
  }
  g.add(mesh(merge(stones), M.bedrock, 'stones', false));
  const tuft = twoSided(merge([0, 1.05, 2.1].map(a => new THREE.PlaneGeometry(0.75, 0.5).translate(0, 0.24, 0).rotateY(a))));
  { const n = tuft.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); }
  const rg = rng(12), mats = [];
  for (let ix = 0; ix < 86; ix++) for (let iz = 0; iz < 86; iz++) {
    const x = -44.2 + ix * 1.03 + (rg() - 0.5) * 0.95, z = -44.2 + iz * 1.03 + (rg() - 0.5) * 0.95;
    if (Math.abs(z - TRACK_Z) < 1.9 || Math.abs(x) > 44.6 || Math.abs(z) > 44.6) continue;
    const s = 0.55 + rg() * 0.9;
    mats.push(new THREE.Matrix4().compose(V(x, heightAt(x, z), z), new THREE.Quaternion().setFromAxisAngle(UP, rg() * TAU), V(s, s * (0.7 + rg() * 0.6), s)));
  }
  const gm = new THREE.InstancedMesh(tuft, M.grass, mats.length), tc = new THREE.Color();
  gm.name = 'grass_tufts'; gm.castShadow = false; gm.receiveShadow = true;
  mats.forEach((mt, i) => { gm.setMatrixAt(i, mt); const v = 0.75 + rg() * 0.45; tc.setRGB(v * (1 + (rg() - 0.5) * 0.2), v, v * 0.9); gm.setColorAt(i, tc); });
  g.add(gm); g.userData.grass = gm;
  return g;
}

/* ---------------- instancing ---------------- */
function inst(x, z, r, s, d) { return { p: V(x, heightAt(x, z), z), ry: r() * TAU, s, d: Math.min(1, Math.max(0, d + (r() - 0.5) * 0.08)), d2: r(), ax: r() * TAU, opt: {} }; }
export function instanceSet(template, list, name) {
  template.updateMatrixWorld(true);
  const meshes = [], zero = new THREE.Matrix4().makeScale(0, 0, 0), vr = rng(list.length * 13 + name.length * 7), jit = list.map(() => [vr(), vr()]), tc = new THREE.Color();
  template.traverse(o => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry.clone().applyMatrix4(o.matrixWorld), o.material, list.length);
    im.name = o.name; im.castShadow = o.castShadow; im.receiveShadow = true; im.frustumCulled = false;
    let q = o; while (q && !q.userData.opt) q = q.parent;
    im.userData.opt = q ? q.userData.opt : null;
    const leafy = /leaf|canopy|frond|scrub/.test(o.material.name);
    for (let i = 0; i < list.length; i++) {
      im.setMatrixAt(i, zero);
      const [a, b] = jit[i], v = leafy ? 0.8 + a * 0.34 : 0.86 + a * 0.22, hs = leafy ? b * 0.12 - 0.02 : (b - 0.5) * 0.05;
      tc.setRGB(v * (1 + hs), v, v * (1 - hs * 1.5)); im.setColorAt(i, tc);
    }
    meshes.push(im);
  });
  const group = new THREE.Group(); group.name = name; meshes.forEach(m => group.add(m));
  return { group, meshes, list };
}

/* ---------------- wild scrub (before 1933) ---------------- */
export function buildWild(M) {
  const r = rng(21);
  const shrub = new THREE.Group();
  shrub.add(mesh(foliage([[0, 0.7, 0, 1.1, 0.8], [0.8, 0.5, 0.3, 0.8, 0.8], [-0.6, 0.45, -0.5, 0.7, 0.8]], rng(22), { density: 9, size: 0.75, center: V(0, 0.4, 0) }), M.shrub, 'scrub'));
  const tree = new THREE.Group();
  tree.add(mesh(new THREE.CylinderGeometry(0.18, 0.3, 9, 8).translate(0, 4.5, 0), M.wildBark, 'wild_trunk'));
  tree.add(mesh(foliage([[0, 10, 0, 3, 0.7], [2, 9, 1, 2.2, 0.8], [-1.8, 9.4, -1.2, 2.4, 0.8]], rng(23), { density: 4, size: 2, center: V(0, 9.5, 0), sy: 0.7 }), M.shrub, 'wild_canopy'));
  const sl = [], tl = [];
  for (let i = 0; i < 360; i++) { const x = (r() - 0.5) * 86, z = (r() - 0.5) * 86; if (Math.abs(z - TRACK_Z) < 2.6) continue; sl.push(inst(x, z, r, 0.6 + r() * 1.2, (x + HALF) / PLOT)); }
  for (let i = 0; i < 48; i++) { const x = (r() - 0.5) * 82, z = (r() - 0.5) * 80 - 2; tl.push(inst(x, z, r, 0.7 + r() * 0.6, (x + HALF) / PLOT)); }
  const a = instanceSet(shrub, sl, 'wild_scrub'), b = instanceSet(tree, tl, 'wild_trees');
  const group = new THREE.Group(); group.name = 'era_0_wild'; group.add(a.group, b.group);
  return { group, sets: [a, b], targets: [] };
}

/* ---------------- banana & papaya ---------------- */
const BAN = { L: 0.19, R: 0.018, B: 0.32 }, PAP = { L: 0.26, R: 0.08 };
const bananaR = t => BAN.R * Math.pow(Math.sin(Math.PI * (0.02 + 0.96 * t)), 0.55) * (1 - 0.15 * t);
const papayaR = t => PAP.R * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * t)), 0.62) * (1.08 - 0.32 * t);
function fingerGeo(seg, steps, stem) {
  const parts = [bend(new THREE.LatheGeometry(profile(bananaR, BAN.L, steps, 0, 1), seg), BAN.B)];
  if (stem) parts.push(bend(new THREE.CylinderGeometry(0.0032, 0.0045, 0.03, 6).translate(0, BAN.L + 0.012, 0), BAN.B));
  return merge(parts);
}
function papayaGeo(seg, steps) { const g = new THREE.LatheGeometry(profile(papayaR, PAP.L, steps, 0, 1), seg); g.computeVertexNormals(); return g; }
const centerOf = g => new THREE.Box3().setFromBufferAttribute(g.attributes.position).getCenter(V());
function leafGeo(len, wid, droop) {
  const g = new THREE.PlaneGeometry(1, 1, 12, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getX(i) + 0.5, w = p.getY(i) * 2, u = (t - 0.1) / 0.9;
    const half = u <= 0 ? 0.02 : wid * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(u, 0.985)), 0.55);
    p.setXYZ(i, t * len, -droop * t * t * len * 0.6 - Math.abs(w) * half * 0.25, w * half);
  }
  g.computeVertexNormals(); return g;
}
function bananaBunch(M, h, hero = false) {
  const b = new THREE.Group(); b.name = 'banana_bunch'; b.userData.opt = 'bunch';
  const curve = new THREE.QuadraticBezierCurve3(V(0, h - 0.1, 0), V(0.55, h + 0.1, 0), V(0.5, h - 0.7, 0));
  const top = h - 0.7, bottom = top - 0.85;
  const stalk = [new THREE.TubeGeometry(curve, 10, 0.035, 6), xf(new THREE.CylinderGeometry(0.025, 0.035, top - bottom + 0.4, 8), [0.5, (top + bottom - 0.4) / 2, 0])];
  const fingers = [], fg = fingerGeo(hero ? 16 : 5, hero ? 16 : 5, hero), fc = centerOf(fg);
  let heroM = null;
  for (let k = 0; k < 5; k++) {
    const y = top - 0.1 - k * 0.16, n = 8 - Math.floor(k / 2);
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU + k * 0.4, out = V(Math.cos(a), 0, Math.sin(a));
      const Y = out.clone().multiplyScalar(0.8).add(V(0, 0.6, 0)).normalize();
      const X = UP.clone().addScaledVector(Y, -UP.dot(Y)).normalize(), Z = V().crossVectors(X, Y);
      const m4 = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(V(0.5, y, 0).addScaledVector(out, 0.035));
      if (hero && k === 1 && j === 0) heroM = m4; else fingers.push(fg.clone().applyMatrix4(m4));
    }
  }
  b.add(mesh(merge(stalk), M.bananaStem, 'banana_peduncle'));
  b.add(mesh(merge(fingers), M.bananaFruit, 'banana_hands'));
  b.add(mesh(new THREE.ConeGeometry(0.07, 0.22, 14).rotateX(Math.PI).translate(0.5, bottom - 0.5, 0), M.bananaHeart, 'banana_heart'));
  if (heroM) {
    const hm = mesh(fg.clone().translate(-fc.x, -fc.y, -fc.z), M.bananaFruit, 'banana_hero_finger', false); hm.receiveShadow = false;
    hm.position.copy(fc.clone().applyMatrix4(heroM)); hm.quaternion.setFromRotationMatrix(heroM); b.add(hm); b.userData.hero = { mesh: hm };
  }
  const a = new THREE.Object3D(); a.name = 'anchor'; a.position.set(0.5, (top + bottom) / 2, 0); b.add(a); b.userData.anchor = a;
  return b;
}
export function bananaPlant(M, r = rng(1), o = {}) {
  const g = new THREE.Group(); g.name = 'banana_plant';
  const h = o.h ?? 2.8;
  g.add(mesh(merge([new THREE.CylinderGeometry(0.11, 0.18, h, 14).translate(0, h / 2, 0), new THREE.CylinderGeometry(0.05, 0.09, 0.9, 10).translate(0.35, 0.45, 0.1), new THREE.CylinderGeometry(0.06, 0.11, 1.5, 10).translate(-0.32, 0.75, -0.22)]), M.bananaStem, 'pseudostem'));
  const leaves = [];
  for (let i = 0; i < 8; i++) leaves.push(xf(leafGeo(1.7 + r() * 0.6, 0.55, 0.5 + r() * 0.5), [0, h - 0.08, 0], [0, i / 8 * TAU + r() * 0.5, 0.25 + r() * 0.7]));
  for (let i = 0; i < 3; i++) leaves.push(xf(leafGeo(0.7, 0.25, 0.2), [0.35, 0.85, 0.1], [0, i * 2.1, 0.6]));
  { const r2 = rng(77); for (let i = 0; i < 4; i++) leaves.push(xf(leafGeo(1.0 + r2() * 0.3, 0.38, 0.35), [-0.32, 1.45, -0.22], [0, i * 1.6 + 0.4, 0.35 + r2() * 0.4])); }
  leaves.push(xf(new THREE.CylinderGeometry(0.015, 0.05, 0.8, 6), [0, h + 0.35, 0], [0, 0, 0.12]));
  g.add(mesh(merge(leaves), M.bananaLeaf, 'banana_leaves'));
  const dead = [];
  for (let i = 0; i < 2; i++) dead.push(xf(leafGeo(1.2 + r() * 0.4, 0.4, 0.1), [0, h - 0.3 - i * 0.3, 0], [0, Math.PI + (i ? 0.9 : -0.8) + (r() - 0.5) * 0.4, -1.3 - r() * 0.25]));
  g.add(mesh(merge(dead), M.bananaDead, 'banana_dead_leaves'));
  if (o.bunch !== false) { const b = bananaBunch(M, h, !!o.hero); g.add(b); g.userData.bunch = b; }
  return g;
}
function lobedShape(R, lobes) {
  const s = new THREE.Shape(), N = lobes * 10;
  for (let i = 0; i < N; i++) { const a = i / N * TAU, rr = R * (0.35 + 0.65 * Math.pow(Math.abs(Math.cos(a * lobes / 2)), 1.4)); i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(rr, 0); }
  return s;
}
export function papayaTree(M, r = rng(2), o = {}) {
  const g = new THREE.Group(); g.name = 'papaya_tree';
  const h = 3.4, n = 11, rT = y => 0.16 - 0.055 * (y / h), pet = [new THREE.CylinderGeometry(rT(h), rT(0), h, 14).translate(0, h / 2, 0)], blades = [];
  for (let i = 0; i < n; i++) {
    const az = i * GA, el = 0.15 + (i / n) * 0.95, dir = V(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    const base = V(0, h - 0.05 + i * 0.012, 0), end = base.clone().addScaledVector(dir, 1.05);
    pet.push(along(new THREE.CylinderGeometry(0.011, 0.018, 1.05, 5).translate(0, 0.525, 0), base, dir));
    const c = end.clone().add(V(Math.cos(az) * 0.3, -0.05, Math.sin(az) * 0.3));
    blades.push(xf(normUV(new THREE.ShapeGeometry(lobedShape(0.42, 7)), 0.42).rotateX(-Math.PI / 2), [c.x, c.y, c.z], [0.35, Math.PI / 2 - az, 0]));
  }
  g.add(mesh(merge(pet), M.papayaTrunk, 'papaya_trunk'));
  g.add(mesh(merge(blades), M.papayaLeaf, 'papaya_leaves'));
  // fruit cluster hugging the trunk just under the crown — green above, ripening orange below
  const fr = new THREE.Group(); fr.name = 'papaya_fruit'; fr.userData.opt = 'fruit';
  const pg = papayaGeo(o.hero ? 12 : 7, o.hero ? 10 : 6), pc = centerOf(pg); pg.translate(-pc.x, -pc.y, -pc.z);
  const green = [], ripe = [], rings = [[h - 0.14, 7, 0.22], [h - 0.33, 7, 0.3], [h - 0.52, 6, 0.36]];
  let heroM = null;
  rings.forEach(([y, cnt, tilt], k) => {
    for (let j = 0; j < cnt; j++) {
      const az = j / cnt * TAU + k * 0.45 + (r() - 0.5) * 0.15, out = V(Math.cos(az), 0, Math.sin(az));
      const Y = UP.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(out, -Math.sin(tilt)).normalize();
      const X = V(-out.z, 0, out.x), Z = V().crossVectors(X, Y);
      const rc = rT(y) + PAP.R * 0.92 + Math.sin(tilt) * 0.07;
      const m4 = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(out.clone().multiplyScalar(rc).add(V(0, y, 0)));
      const isHero = o.hero && k === 2 && j === 0;
      if (isHero) { heroM = m4; continue; }
      (k === 0 || (k === 1 && j % 3 !== 0) ? green : ripe).push(pg.clone().applyMatrix4(m4));
    }
  });
  fr.add(mesh(merge(green), M.papayaGreen, 'papaya_fruits_unripe'), mesh(merge(ripe), M.papayaFruit, 'papaya_fruits_ripe'));
  g.add(fr);
  if (heroM) {
    const hg = papayaGeo(48, 40), hc = centerOf(hg); hg.translate(-hc.x, -hc.y, -hc.z);
    const hf = mesh(hg, M.papayaFruit, 'papaya_hero_fruit', false); hf.receiveShadow = false;
    hf.position.setFromMatrixPosition(heroM); hf.quaternion.setFromRotationMatrix(heroM); fr.add(hf); g.userData.heroFruit = hf;
  }
  return g;
}
export function buildBananaEra(M) {
  const r = rng(31), banana = [], papaya = [];
  const spots = [V(-3.5, 0, 37.6), V(0.8, 0, 36.4), V(5, 0, 37.9)], papSpot = V(10.2, 0, 37.4);
  for (let ix = 0; ix < 24; ix++) for (let iz = 0; iz < 24; iz++) {
    const x = -41.4 + ix * 3.6 + (r() - 0.5) * 0.9, z = -41.4 + iz * 3.6 + (r() - 0.5) * 0.9;
    if (Math.abs(z - TRACK_Z) < 3.2 || [...spots, papSpot].some(t => Math.hypot(t.x - x, t.z - z) < 2.3)) continue;
    const it = inst(x, z, r, 0.85 + r() * 0.3, (x + HALF) / PLOT);
    if (r() < 0.26) { it.opt.fruit = r() < 0.8; papaya.push(it); } else { it.opt.bunch = r() < 0.55; banana.push(it); }
  }
  const a = instanceSet(bananaPlant(M, rng(5)), banana, 'banana_plants'), b = instanceSet(papayaTree(M, rng(6)), papaya, 'papaya_trees');
  const group = new THREE.Group(); group.name = 'era_1_banana_papaya'; group.add(a.group, b.group);
  const targets = spots.map((s, k) => {
    const pl = bananaPlant(M, rng(40 + k), { hero: k === 1 }); pl.position.set(s.x, heightAt(s.x, s.z), s.z); pl.rotation.y = -Math.PI / 2 + (k - 1) * 0.3;
    group.add(pl);
    return { obj: pl, part: pl.userData.bunch, anchor: pl.userData.bunch.userData.anchor, d: (s.x + HALF) / PLOT, s: 1 };
  });
  const pp = papayaTree(M, rng(45), { hero: true }); pp.position.set(papSpot.x, heightAt(papSpot.x, papSpot.z), papSpot.z); group.add(pp);
  const pt = { obj: pp, part: pp.userData.heroFruit, anchor: pp.userData.heroFruit, d: (papSpot.x + HALF) / PLOT, s: 1 };
  targets.push(pt);
  return { group, sets: [a, b], targets, total: banana.length + papaya.length + 4, heroBanana: targets[1], heroPapaya: pt };
}

/* ---------------- rubber ---------------- */
export function rubberTree(M, r = rng(3)) {
  const g = new THREE.Group(); g.name = 'rubber_tree';
  const h = 7.5, rAt = y => 0.2 - 0.075 * (y / h);
  const wood = [new THREE.CylinderGeometry(0.125, 0.2, h, 16).translate(0, h / 2, 0)];
  for (let k = 0; k < 4; k++) { const a = k * 1.7 + r(); wood.push(along(new THREE.CylinderGeometry(0.04, 0.085, 3.2, 7).translate(0, 1.6, 0), V(0, h - 0.6 - k * 0.5, 0), V(Math.cos(a) * 0.55, 0.83, Math.sin(a) * 0.55))); }
  g.add(mesh(merge(wood), M.rubberBark, 'rubber_trunk'));
  const blobs = [[0, h + 4.4, 0, 2.0, 0.75]];
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + r() * 0.5; blobs.push([Math.cos(a) * 1.7, h + 2.2 + r() * 2, Math.sin(a) * 1.7, 1.5 + r() * 0.9, 0.75]); }
  g.add(mesh(foliage(blobs, r, { density: 5.5, size: 1.5, center: V(0, h + 3.4, 0), sy: 0.8 }), M.rubberLeaf, 'rubber_canopy'));
  // tapping panel: half-spiral cut sloped ~28°, low end facing +z
  const tap = new THREE.Group(); tap.name = 'tapping_panel';
  const cy = 1.25, tilt = 0.5, R = rAt(cy) + 0.004, T = Math.tan(tilt), lowY = cy - R * T;
  tap.add(mesh(new THREE.TorusGeometry(R, 0.016, 6, 40, Math.PI).rotateX(Math.PI / 2).scale(1 / Math.cos(tilt), 1, 1).rotateZ(tilt).rotateY(Math.PI / 2).translate(0, cy, 0), M.latex, 'tapping_cut', false));
  const panel = new THREE.CylinderGeometry(R - 0.002, rAt(0.5) + 0.002, 1, 24, 1, true, 0, Math.PI);
  const pp = panel.attributes.position;
  for (let i = 0; i < pp.count; i++) { const z = pp.getZ(i); pp.setY(i, pp.getY(i) > 0 ? cy - z * T - 0.03 : 0.5); }
  panel.computeVertexNormals();
  const rb = rAt(lowY - 0.3);
  tap.add(mesh(merge([panel]), M.tappedBark, 'tapped_bark_panel', false));
  tap.add(mesh(merge([new THREE.CylinderGeometry(0.006, 0.006, 0.2, 5).translate(0, lowY - 0.1, R + 0.004)]), M.latex, 'latex_channel', false));
  const cupY = lowY - 0.42, cz = rb + 0.085;
  tap.add(mesh(merge([new THREE.CylinderGeometry(0.075, 0.055, 0.1, 18, 1, true).translate(0, cupY + 0.05, cz), new THREE.CircleGeometry(0.055, 18).rotateX(-Math.PI / 2).translate(0, cupY + 0.001, cz), new THREE.BoxGeometry(0.03, 0.006, 0.07).translate(0, lowY - 0.22, R + 0.03), new THREE.TorusGeometry(rb + 0.004, 0.004, 4, 24).rotateX(Math.PI / 2).translate(0, cupY + 0.08, 0)]), M.cup, 'latex_cup'));
  const fill = mesh(new THREE.CylinderGeometry(0.07, 0.056, 0.09, 18).translate(0, 0.045, 0), M.latex, 'latex_in_cup', false);
  fill.position.set(0, cupY + 0.003, cz); fill.scale.y = 0.15; tap.add(fill);
  const a = new THREE.Object3D(); a.name = 'anchor'; a.position.set(0, cupY + 0.1, cz); tap.add(a);
  g.add(tap); g.userData.fill = fill; g.userData.anchor = a;
  return g;
}
export function buildRubberEra(M) {
  const r = rng(41), list = [], targets = [];
  const group = new THREE.Group(); group.name = 'era_2_rubber';
  for (let k = 0; k < 13; k++) for (let j = 0; j < 30; j++) {
    const z = -42 + k * 6.7, x = -43.5 + j * 3, d = k / 12 * 0.85 + j / 29 * 0.15;
    if (k === 6 && j >= 15 && j <= 17) {
      const t = rubberTree(M, rng(60 + j)); t.position.set(x, heightAt(x, z), z); group.add(t);
      targets.push({ obj: t, part: t.userData.fill, anchor: t.userData.anchor, d, d2: r(), ax: r() * TAU, s: 1 });
      continue;
    }
    list.push({ p: V(x, heightAt(x, z), z), ry: (r() - 0.5) * 0.3, s: 0.88 + r() * 0.22, d, d2: r() * 0.6 + (x + HALF) / PLOT * 0.4, ax: r() * TAU, opt: {} });
  }
  const a = instanceSet(rubberTree(M, rng(3)), list, 'rubber_trees'); group.add(a.group);
  return { group, sets: [a], targets, total: list.length + 3 };
}

/* ---------------- oil palm ---------------- */
function frondGeo(start, az, el, L, droop, r) {
  const dirH = V(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), pts = [];
  for (let k = 0; k <= 6; k++) { const s = k / 6, p = start.clone().addScaledVector(dirH, s * L); p.y -= droop * s * s * L; pts.push(p); }
  const curve = new THREE.CatmullRomCurve3(pts), pos = [], uv = [], nor = [], N = 10, nn = V(), e1 = V(), e2 = V(), S0 = 0.1;
  const wmax = L / 5.4, prof = s => 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * Math.min(0.97, 0.06 + s * 0.94)), 0.7);
  const ring = [];
  for (let k = 0; k <= N; k++) { const s = S0 + (1 - S0) * k / N, P = curve.getPointAt(s), T = curve.getTangentAt(s); ring.push({ u: k / N, P, T, S: V().crossVectors(T, UP).normalize(), w: wmax * prof(k / N) }); }
  for (const side of [-1, 1]) for (const rank of [0, 1]) {
    const lift = rank ? 0.62 + (r() - 0.5) * 0.2 : -0.22 + (r() - 0.5) * 0.2, fw = rank ? 0.32 : 0.26, ve = rank ? 0 : 1;
    const edge = ring.map(({ P, T, S, w }) => { const D = S.clone().multiplyScalar(side).addScaledVector(UP, lift).addScaledVector(T, fw).normalize(); const E = P.clone().addScaledVector(D, w); E.y -= w * 0.2; return E; });
    for (let k = 0; k < N; k++) {
      const a = ring[k].P, b = ring[k + 1].P, c = edge[k + 1], d = edge[k], u0 = ring[k].u, u1 = ring[k + 1].u;
      nn.crossVectors(e1.subVectors(b, a), e2.subVectors(d, a)).normalize(); if (nn.y < 0) nn.negate(); nn.addScaledVector(UP, 0.7).normalize();
      for (const q of [a, b, c, a, c, d]) pos.push(q.x, q.y, q.z);
      uv.push(u0, 0.5, u1, 0.5, u1, ve, u0, 0.5, u1, ve, u0, ve);
      for (let j = 0; j < 6; j++) nor.push(nn.x, nn.y, nn.z);
    }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return [taperTube(curve, 12, 0.07 * wmax + 0.02, 0.012, 5), lg];
}
function ffbParts(r, rx = 0.22, ry = 0.27, n = 72, fr = 0.04) {
  const fruit = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + 0.5) / n, rad = Math.sqrt(1 - y * y), th = i * GA, p = V(Math.cos(th) * rad * rx, y * ry, Math.sin(th) * rad * rx), s = fr * (0.85 + r() * 0.3);
    const g = fruitColors(sphN(new THREE.IcosahedronGeometry(s, 1)).scale(0.9 + r() * 0.2, 1.25, 0.9 + r() * 0.2), -s * 1.25, s * 1.25, true, y, r);
    fruit.push(along(g, p, p.clone().normalize()));
  }
  return { fruit: merge(fruit), core: merge([new THREE.SphereGeometry(rx * 0.85, 10, 8).scale(1, ry / rx, 1), new THREE.CylinderGeometry(0.05, 0.07, 0.3, 8).translate(0, ry + 0.1, 0)]) };
}
export function oilPalm(M, r = rng(4), o = {}) {
  const g = new THREE.Group(); g.name = 'oil_palm';
  const h = o.h ?? 4.6, trunk = [new THREE.CylinderGeometry(0.33, 0.44, h, 16).translate(0, h / 2, 0)];
  for (let i = 0; i < 110; i++) {
    const y = 0.8 + (i / 110) * (h - 0.75), az = i * GA, rr = 0.44 - 0.11 * (y / h), len = 0.38 + r() * 0.22 + 0.12 * (y / h);
    const boot = new THREE.CylinderGeometry(0.03, 0.12, len, 3).scale(1, 1, 0.55).rotateY(Math.PI / 6).translate(0, len * 0.42, 0);
    trunk.push(along(boot, V(Math.cos(az) * rr * 0.8, y, Math.sin(az) * rr * 0.8), V(Math.cos(az) * 0.62, 0.78, Math.sin(az) * 0.62)));
  }
  g.add(mesh(merge(trunk), M.palmTrunk, 'palm_trunk'));
  const rach = [], lfl = [], old = [], n = 32;
  for (let k = 0; k < 3; k++) { const az = k * 2.1 + r(), [t, l] = frondGeo(V(Math.cos(az) * 0.08, h + 0.4, Math.sin(az) * 0.08), az, 1.42, 2.0 + r() * 0.5, 0.02, r); rach.push(t); lfl.push(l); }
  for (let i = 0; i < n; i++) {
    const age = i / (n - 1), az = i * GA + r() * 0.2, el = 1.15 - age * 1.32 + (r() - 0.5) * 0.12, L = (age < 0.1 ? 3.8 : 5.3 + age * 0.6) + r() * 0.6;
    const [t, l] = frondGeo(V(Math.cos(az) * 0.22, h + 0.35 - age * 0.45, Math.sin(az) * 0.22), az, el, L, 0.18 + age * (age > 0.95 ? 0.4 : 0.22), r);
    rach.push(t); (age > 0.95 ? old : lfl).push(l);
  }
  g.add(mesh(merge(lfl), M.palmFrond, 'palm_fronds'), mesh(merge(rach), M.palmRachis, 'palm_rachis'), mesh(merge(old), M.palmFrondOld, 'palm_fronds_old'));
  const bunches = [];
  for (let k = 0; k < (o.bunches ?? 2); k++) {
    const az = (o.faceAz ?? r() * TAU) + k * 2.6, b = new THREE.Group(); b.name = 'fresh_fruit_bunch'; b.userData.opt = 'bunch';
    const P = ffbParts(r);
    b.add(mesh(P.core, M.bunchStalk, 'bunch_stalk'), mesh(P.fruit, M.ffbFruit, 'fruitlets'));
    b.position.set(Math.cos(az) * 0.6, h - 0.05, Math.sin(az) * 0.6); b.rotation.set(Math.sin(az) * 0.35, 0, -Math.cos(az) * 0.35);
    const a = new THREE.Object3D(); a.name = 'anchor'; b.add(a); b.userData.anchor = a;
    g.add(b); bunches.push(b);
  }
  g.userData.bunches = bunches;
  return g;
}
export function buildPalmEra(M) {
  const r = rng(51), list = [], targets = [];
  const group = new THREE.Group(); group.name = 'era_3_oil_palm';
  for (let k = 0; k < 11; k++) {
    const z = -41 + k * 7.79, odd = k % 2, n = odd ? 9 : 10;
    for (let j = 0; j < n; j++) {
      const x = (odd ? -36 : -40.5) + j * 9, d = Math.min(1, k / 10 * 0.7 + r() * 0.3);
      if (k === 10 && [-4.5, 4.5, 13.5].includes(x)) {
        const p = oilPalm(M, rng(80 + j), { faceAz: Math.PI / 2 }); p.position.set(x, heightAt(x, z), z); group.add(p);
        const b = p.userData.bunches[0];
        targets.push({ obj: p, part: b, anchor: b.userData.anchor, d, s: 1 });
        continue;
      }
      list.push({ p: V(x, heightAt(x, z), z), ry: r() * TAU, s: 0.9 + r() * 0.2, d, d2: 0, ax: 0, opt: {} });
    }
  }
  const a = instanceSet(oilPalm(M, rng(7)), list, 'oil_palms'); group.add(a.group);
  return { group, sets: [a], targets, total: list.length + 3 };
}

/* ---------------- specimens (cutaway, exploded) ---------------- */
function bend(g, R) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), th = y / R, rr = R - x; p.setXY(i, R - rr * Math.cos(th), rr * Math.sin(th)); }
  g.computeVertexNormals(); return g;
}
const bendPt = (v, R) => { const th = v.y / R, rr = R - v.x; return V(R - rr * Math.cos(th), rr * Math.sin(th), v.z); };
function profile(fn, len, steps, a, b) { const pts = []; for (let i = 0; i <= steps; i++) { const t = a + (b - a) * i / steps; pts.push(new THREE.Vector2(Math.max(0, fn(t)), t * len)); } return pts; }
function shell({ outer, inner, len, steps = 48, seg = 64, cut = 0.56 * Math.PI, ends = false, range = [0, 1] }) {
  const ps = cut / 2, pl = TAU - cut;
  const op = profile(outer, len, steps, ...range), ip = inner ? profile(inner, len, steps, ...range) : null;
  const skin = new THREE.LatheGeometry(op, seg, ps, pl), faces = [];
  if (ip) faces.push(new THREE.LatheGeometry(ip, seg, ps, pl));
  if (ends) {
    faces.push(new THREE.LatheGeometry([new THREE.Vector2(ip ? ip[0].x : 0, op[0].y), new THREE.Vector2(op[0].x, op[0].y)], seg, ps, pl));
    faces.push(new THREE.LatheGeometry([new THREE.Vector2(op[steps].x, op[steps].y), new THREE.Vector2(ip ? ip[steps].x : 0, op[steps].y)], seg, ps, pl));
  }
  const raw = [...op, ...(ip ? ip.slice().reverse() : [new THREE.Vector2(0, op[steps].y), new THREE.Vector2(0, op[0].y)])], poly = [];
  for (const p of raw) { const q = poly[poly.length - 1]; if (!q || q.distanceTo(p) > 1e-9) poly.push(p); }
  if (poly.length > 2 && poly[0].distanceTo(poly[poly.length - 1]) < 1e-9) poly.pop();
  const sh = new THREE.Shape(poly);
  const rmax = Math.max(...op.map(p => p.x)) || 1;
  for (const phi of [ps, ps + pl]) { const f = new THREE.ShapeGeometry(sh), uv = f.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / rmax, uv.getY(i) / len); faces.push(f.rotateY(phi - Math.PI / 2)); }
  return { skin, faces };
}
function collector() {
  const map = new Map();
  return {
    add(mat, ...geos) { if (!map.has(mat)) map.set(mat, []); map.get(mat).push(...geos); },
    shell(o, skinMat, faceMat) { const { skin, faces } = shell(o); if (o.bend) { bend(skin, o.bend); faces.forEach(f => bend(f, o.bend)); } this.add(skinMat, skin); this.add(faceMat, ...faces); },
    build(name) { const g = new THREE.Group(); g.name = name; map.forEach((geos, mat) => g.add(mesh(merge(geos), mat, `${name}__${mat.name}`))); return g; },
  };
}
function finalize(name, layers, o) {
  const outer = new THREE.Group(); outer.name = name;
  const inner = new THREE.Group(); inner.name = name + '_layers'; outer.add(inner);
  layers.forEach(l => inner.add(l.g));
  const box = new THREE.Box3().setFromObject(inner), c = box.getCenter(V()), size = box.getSize(V()), n = layers.length;
  layers.forEach((l, k) => { l.g.position.copy(c).negate(); l.g.userData.base = l.g.position.clone(); l.g.userData.k = k - (n - 1) / 2; });
  const display = o.height / size.y;
  const spec = { group: outer, inner, display, layers: layers.map(l => l.g), anchors: layers.map(l => l.a) };
  const applyLayers = o.apply ? e => o.apply(e, spec) : e => layers.forEach(l => l.g.position.copy(l.g.userData.base).addScaledVector(o.dir, l.g.userData.k * o.spacing * e));
  if (o.cover) {
    const cv = o.cover.obj || mesh(o.cover.geo, o.cover.mat, name + '_peel_cover');
    if (o.cover.fade) cv.traverse(q => { if (q.isMesh) { q.material = q.material.clone(); q.material.transparent = true; } });
    cv.position.copy(c).negate(); inner.add(cv); spec.cover = cv;
  }
  const Z = V(0, 0, 1);
  spec.apply = e => {
    applyLayers(e);
    if (!spec.cover) return;
    spec.cover.position.copy(layers[0].g.position).addScaledVector(Z, smooth(0, 0.3, e) * o.cover.off);
    if (o.cover.fade) {
      const op = 1 - smooth(0.08, 0.3, e); spec.cover.scale.setScalar(layers[0].g.scale.x); spec.cover.visible = op > 0.01;
      spec.cover.traverse(q => { if (q.isMesh) { q.material.opacity = op; q.material.depthWrite = op > 0.98; } });
      return;
    }
    spec.cover.scale.setScalar(Math.max(1e-4, layers[0].g.scale.x * (1 - smooth(0.1, 0.32, e)))); spec.cover.visible = e < 0.32;
  };
  spec.setDisplay = on => inner.scale.setScalar(on ? display : 1);
  spec.setDisplay(true);
  return spec;
}
export function bananaSpecimen(M) {
  const { L, B } = BAN, cut = Math.PI * 0.6, rO = bananaR;
  const peel = collector(), flesh = collector(), core = collector();
  peel.shell({ outer: rO, inner: t => rO(t) * 0.84, len: L, cut, bend: B }, M.peel, M.peelIn);
  peel.add(M.peel, bend(new THREE.CylinderGeometry(0.0032, 0.0045, 0.03, 10).translate(0, L + 0.012, 0), B));
  flesh.shell({ outer: t => rO(t) * 0.84, inner: t => rO(t) * 0.2, len: L, cut, bend: B }, M.bFlesh, M.bFlesh);
  core.shell({ outer: t => rO(t) * 0.2, len: L, cut, bend: B }, M.bCore, M.bCore);
  const seeds = [];
  for (let i = 0; i < 26; i++) { const t = 0.12 + 0.76 * i / 25; for (const phi of [cut / 2 + 0.25, TAU - cut / 2 - 0.25]) { const rr = rO(t) * 0.11; seeds.push(bend(new THREE.SphereGeometry(0.0011, 6, 4).translate(rr * Math.sin(phi), t * L, rr * Math.cos(phi)), B)); } }
  core.add(M.seed, ...seeds);
  const ap = (rr, t, phi = cut / 2) => bendPt(V(rr * Math.sin(phi), t * L, rr * Math.cos(phi)), B);
  return finalize('specimen_banana', [
    { g: peel.build('peel'), a: [ap(rO(0.68) * 0.92, 0.68)] },
    { g: flesh.build('flesh'), a: [ap(rO(0.5) * 0.55, 0.5)] },
    { g: core.build('seed_core'), a: [ap(rO(0.32) * 0.1, 0.32)] },
  ], { dir: V(1, 0, 0), spacing: 0.05, height: 13, cover: { geo: bend(new THREE.LatheGeometry(profile(rO, L, 48, 0, 1), 24, -cut / 2, cut), B), mat: M.peel, off: 0.05 } });
}
function papayaCover(rO, L, cut) { const g = new THREE.LatheGeometry(profile(rO, L, 56, 0, 1), 24, -cut / 2, cut); g.computeVertexNormals(); return g; }
export function papayaSpecimen(M) {
  const { L } = PAP, cut = Math.PI * 0.62, rO = papayaR;
  const cav = t => (t > 0.12 && t < 0.88) ? rO(t) * 0.5 * Math.pow(Math.sin(Math.PI * (t - 0.12) / 0.76), 0.7) : 0;
  const skin = collector(), flesh = collector(), seeds = collector();
  skin.shell({ outer: rO, inner: t => rO(t) * 0.95, len: L, cut, steps: 56 }, M.pSkin, M.pSkin);
  flesh.shell({ outer: t => rO(t) * 0.95, inner: cav, len: L, cut, steps: 56 }, M.pFlesh, M.pFlesh);
  const r = rng(61), sg = [];
  for (let i = 0; i < 380; i++) {
    const t = 0.16 + r() * 0.68, phi = cut / 2 + 0.06 + r() * (TAU - cut - 0.12), rr = cav(t) * (0.8 + r() * 0.12);
    sg.push(new THREE.SphereGeometry(0.0042 * (0.8 + r() * 0.4), 7, 5).translate(rr * Math.sin(phi), t * L, rr * Math.cos(phi)));
  }
  seeds.add(M.seed, ...sg);
  const ap = (rr, t, phi = cut / 2) => V(rr * Math.sin(phi), t * L, rr * Math.cos(phi));
  return finalize('specimen_papaya', [
    { g: skin.build('skin'), a: [ap(rO(0.7) * 0.975, 0.7)] },
    { g: flesh.build('flesh'), a: [ap(rO(0.5) * 0.72, 0.5)] },
    { g: seeds.build('seed_cavity'), a: [V(0, 0.48 * L, -cav(0.48) * 0.85)] },
  ], { height: 12, cover: { geo: papayaCover(rO, L, cut), mat: M.pSkin, off: 0.14 }, apply: (e, s) => {
    const p1 = smooth(0, 0.55, e), p2 = smooth(0.45, 1, e), [sk, fl, sd] = s.layers, c = sk.userData.base.clone().negate();
    const place = (g, scale, x, z) => { g.scale.setScalar(scale); g.position.copy(c).multiplyScalar(-scale).add(V(x, 0, z)); };
    place(sk, 1 + 0.32 * p1 * (1 - p2), -0.21 * p2, -0.01 * p1);
    place(fl, 1, 0, 0.075 * p1);
    place(sd, 1 - 0.12 * p1 * (1 - p2), 0.21 * p2, 0.15 * p1);
  } });
}
export function rubberSpecimen(M) {
  const L = 0.36, cut = Math.PI * 0.55;
  const RM = rubberMats(M);
  // one solid piece per tissue; rings, vessels and rays live in the textures (u remapped across each layer's thickness)
  const layer = (coll, r0, r1, skinMat, capMat, cutMat, wallMat) => {
    const { skin, faces } = shell({ outer: () => r0, inner: r1 > 0 ? () => r1 : null, len: L, cut, steps: 1, seg: 72, ends: true });
    const cuts = faces.slice(-2), caps = faces.slice(r1 > 0 ? 1 : 0, -2);
    cuts.forEach(f => { const uv = f.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * r0 - r1) / (r0 - r1)); });
    coll.add(skinMat, skin); coll.add(capMat, ...caps); coll.add(cutMat, ...cuts);
    if (r1 > 0) coll.add(wallMat || capMat, faces[0]);
  };
  const outer = collector(), soft = collector(), camb = collector(), wood = collector();
  layer(outer, 0.2, 0.186, M.barkOuter, RM.barkSec, RM.barkSec);
  layer(soft, 0.186, 0.162, RM.softSkin, RM.softEnd, RM.softLong, RM.softSkin);
  layer(camb, 0.162, 0.158, RM.camb, RM.camb, RM.camb);
  layer(wood, 0.158, 0, RM.woodSkin, RM.woodEnd, RM.woodLong);
  const R = 0.2, tilt = 0.5, cy = 0.2, beta = Math.PI / 2 + cut / 2 + 0.12;
  const phi0 = cut / 2 + 0.12, lowY = cy - R * Math.tan(tilt);
  // fresh latex beading along the cut and running toward the spout
  const beads = [], br = rng(212);
  for (let k = 0; k < 10; k++) {
    const a = 0.04 + k / 9 * 0.87 * Math.PI, p = V(R * Math.cos(a), R * Math.cos(a) * Math.tan(tilt), R * Math.sin(a)).applyAxisAngle(UP, beta), n = V(p.x, 0, p.z).normalize(), s = 0.0035 + br() * 0.003;
    p.y += cy; p.addScaledVector(n, 0.004);
    beads.push(new THREE.SphereGeometry(s, 12, 8).scale(1, 1.4, 1).translate(p.x, p.y - s * 0.5, p.z));
    if (br() < 0.5) { const dl = 0.008 + br() * 0.02; beads.push(new THREE.CapsuleGeometry(0.0021, dl, 2, 6).translate(p.x + n.x * 0.001, p.y - s - dl / 2, p.z + n.z * 0.001)); }
  }
  outer.add(RM.latex, ...beads);
  outer.add(RM.latex,
    new THREE.TorusGeometry(R, 0.0055, 6, 64, Math.PI * 0.95).rotateX(Math.PI / 2).scale(1 / Math.cos(tilt), 1, 1).rotateZ(tilt).rotateY(beta).translate(0, cy, 0),
    new THREE.CapsuleGeometry(0.004, 0.05, 2, 6).translate((R + 0.002) * Math.sin(phi0), lowY - 0.035, (R + 0.002) * Math.cos(phi0)));
  const u = Math.PI * 0.88, ph = Math.PI / 2 - u + beta;
  const ap = (r0, t) => V(r0 * Math.sin(cut / 2), t * L, r0 * Math.cos(cut / 2));
  return finalize('specimen_rubber_bark', [
    { g: outer.build('outer_bark'), a: [ap(0.193, 0.72), V(R * Math.sin(ph), cy + R * Math.tan(tilt) * Math.cos(u), R * Math.cos(ph))] },
    { g: soft.build('soft_bark_latex_vessels'), a: [ap(0.1745, 0.72)] },
    { g: camb.build('cambium'), a: [ap(0.16, 0.8)] },
    { g: wood.build('wood'), a: [ap(0.09, 0.88)] },
  ], { dir: V(0, 1, 0), spacing: 0.11, height: 8.5, cover: { obj: barkCover(M, L, cut), off: 0.09, fade: true } });
}
// the missing wedge of trunk, so the specimen starts (and returns) as a closed section of bark
const _rm = new WeakMap();
function rubberMats(M) {
  if (_rm.has(M)) return _rm.get(M);
  const T = getTextures(), n2 = s => new THREE.Vector2(s, s), ph = (name, o) => Object.assign(new THREE.MeshPhysicalMaterial({ metalness: 0, side: THREE.DoubleSide, ...o }), { name });
  const RM = {
    barkSec: ph('outer_bark_section', { map: T.barkSection.map, normalMap: T.barkSection.normal, roughness: 0.9 }),
    softLong: ph('soft_bark_section', { map: T.softLong.map, normalMap: T.softLong.normal, normalScale: n2(0.6), roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    softEnd: ph('soft_bark_end', { map: T.softEnd, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    softSkin: ph('soft_bark_surface', { color: 0xc9a07a, map: T.fibre.map, normalMap: T.fibre.normal, roughness: 0.6 }),
    camb: ph('cambium', { color: 0xc4c25a, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
    woodLong: ph('rubberwood_long_grain', { map: T.woodLong.map, normalMap: T.woodLong.normal, normalScale: n2(0.5), roughness: 0.72 }),
    woodEnd: ph('rubberwood_end_grain', { map: T.woodEnd.map, normalMap: T.woodEnd.normal, normalScale: n2(0.6), roughness: 0.8 }),
    woodSkin: ph('rubberwood_surface', { color: 0xe8d8b2, map: T.fibre.map, normalMap: T.fibre.normal, roughness: 0.5, clearcoat: 0.3 }),
    latex: ph('latex', { color: 0xf7f3e8, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
  };
  _rm.set(M, RM); return RM;
}
function barkCover(M, L, cut) {
  const g = new THREE.Group(); g.name = 'bark_cover'; const RM = rubberMats(M);
  const sector = (r0, r1, y) => new THREE.LatheGeometry([new THREE.Vector2(r1, y), new THREE.Vector2(r0, y)], 24, -cut / 2, cut);
  const caps = (r0, r1) => [sector(r0, r1, 0), sector(r0, r1, L)];
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, L, 40, 1, true, -cut / 2, cut).translate(0, L / 2, 0), M.barkOuter, 'cover_bark'));
  g.add(mesh(merge(caps(0.186, 0.2)), RM.barkSec, 'cover_bark_ends'));
  g.add(mesh(merge(caps(0.162, 0.186)), RM.softEnd, 'cover_soft_bark_ends'));
  g.add(mesh(merge(caps(0.158, 0.162)), RM.camb, 'cover_cambium_ends'));
  g.add(mesh(merge(caps(0.0001, 0.158)), RM.woodEnd, 'cover_wood_ends'));
  return g;
}
export function ffbSpecimen(M) {
  const r = rng(71), rx = 0.21, ry = 0.27, P = (d, f) => V(d.x * rx * f, d.y * ry * f, d.z * rx * f);
  // central axis (fibrous, irregular) + cut peduncle
  const core = collector(), yb = -ry * 0.88;
  core.add(M.bunchStalk, bumpify(new THREE.LatheGeometry(profile(t => rx * 0.34 * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.6), ry * 1.72, 30, 0, 1), 22).translate(0, yb, 0), 0.005));
  const pc = new THREE.QuadraticBezierCurve3(V(0, yb + 0.03, 0), V(0.008, yb - 0.08, 0.01), V(0.02, yb - 0.17, 0.018));
  core.add(M.bunchStalk, bumpify(taperTube(pc, 8, 0.05, 0.056, 18), 0.003, 90));
  core.add(M.stalkCut, along(new THREE.CircleGeometry(0.056, 22).rotateX(Math.PI / 2), V(0.02, yb - 0.17, 0.018), V(-0.02, -1, -0.02).normalize().negate()));
  // fruitlet template: egg with a pointed apex, base at y=0, apex at y=1
  const fGeo = new THREE.LatheGeometry(profile(t => 0.4 * Math.pow(Math.sin(Math.PI * (0.04 + 0.95 * t)), 0.65) * (1.08 - 0.42 * t), 1, 8, 0, 1), 9);
  const spk = [], spines = [], fruit = [], NS = 150;
  let spkA = null, frA = null;
  for (let i = 0; i < NS; i++) {
    const y = 0.93 - 1.86 * (i + 0.5) / NS, rad = Math.sqrt(1 - y * y), th = i * GA, d = V(Math.cos(th) * rad, y, Math.sin(th) * rad);
    const win = d.z > 0.8 && Math.abs(d.y) < 0.5; // cut-away window facing the viewer
    if (win && d.z > 0.95) continue; // core shows through the middle of the window
    const a = P(d, 0.34), b = P(d, 0.9), ctrl = P(d, 0.6).add(V(0, 0.03, 0)), curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
    const off = d.clone().multiplyScalar(0.025);
    spk.push({ g: taperTube(curve, 6, 0.0095, 0.0045, 5), off });
    spines.push({ g: along(new THREE.ConeGeometry(0.0028, 0.055, 5).translate(0, 0.0275, 0), b, b.clone().sub(ctrl).normalize()), off });
    if (!spkA && win && Math.abs(d.y) < 0.3) spkA = curve.getPoint(0.72).addScaledVector(off, 0.8);
    if (win) continue; // bare spikelets inside the window
    for (let j = 0; j < 12; j++) {
      const s = Math.min(1, 0.34 + 0.66 * (j / 11) + (r() - 0.5) * 0.05), c = curve.getPoint(s), T = curve.getTangent(s);
      const t1 = V().crossVectors(T, Math.abs(T.y) > 0.9 ? V(1, 0, 0) : UP).normalize(), t2 = V().crossVectors(T, t1), ang = r() * TAU;
      const side = t1.clone().multiplyScalar(Math.cos(ang)).addScaledVector(t2, Math.sin(ang));
      const outer = s > 0.64, len = (0.038 + r() * 0.014) * (outer ? 1 : 0.8);
      const pos = c.clone().addScaledVector(side, 0.014 + r() * 0.008), dir = T.clone().multiplyScalar(0.72).addScaledVector(side, 0.55).normalize();
      const g = fruitColors(fGeo.clone(), 0, 1, outer, d.y, r).scale(len * (0.8 + r() * 0.35), len, len * (0.8 + r() * 0.35));
      const fo = d.clone().multiplyScalar(outer ? 0.12 : 0.085);
      fruit.push({ g: along(g, pos, dir), off: fo });
      if (!frA && outer && d.x > 0.55 && Math.abs(d.y) < 0.25 && d.z > 0.2) frA = pos.clone().addScaledVector(fo, 0.85);
    }
  }
  const spkG = new THREE.Group(); spkG.name = 'spikelets_spines'; spkG.add(morphMesh(spk, M.spikelet, 'spikelets'), morphMesh(spines, M.spine, 'spines'));
  const frG = new THREE.Group(); frG.name = 'fruitlets'; frG.add(morphMesh(fruit, M.ffbFruit, 'fruitlets'));
  return finalize('specimen_fresh_fruit_bunch', [
    { g: core.build('bunch_stalk'), a: [V(0.012, yb - 0.1, 0.06)] },
    { g: spkG, a: [spkA || V(0, 0, rx * 0.6)] },
    { g: frG, a: [frA || V(rx, 0, 0)] },
  ], { height: 12, apply: (e, s) => s.layers.forEach(l => { l.position.copy(l.userData.base); l.traverse(o => { if (o.morphTargetInfluences) o.morphTargetInfluences[0] = e; }); }) });
}
export function palmFruitSpecimen(M) {
  const L = 0.04, R = 0.0155, cut = Math.PI;
  // blunt base where it sat on the spikelet, tapering to a pointed apex
  const rO = t => R * Math.pow(Math.sin(Math.PI * t), 0.5 + 0.55 * t) * (1.1 - 0.32 * t);
  const sh = t => (t > 0.17 && t < 0.84) ? R * 0.6 * Math.pow(Math.sin(Math.PI * (t - 0.17) / 0.67), 0.55) : 0;
  const ke = t => (t > 0.24 && t < 0.77) ? R * 0.46 * Math.pow(Math.sin(Math.PI * (t - 0.24) / 0.53), 0.55) : 0;
  // packing in the bunch leaves soft facets and a slight lean; applied to every layer so they stay nested
  const dfm = v => {
    const r = Math.hypot(v.x, v.z); if (r < 1e-7) return v;
    const phi = Math.atan2(v.x, v.z), t = v.y / L, q = Math.min(1, r / R);
    const k = 1 + 0.085 * Math.pow(q, 1.5) * Math.cos(3 * phi + Math.PI) * smooth(0.02, 0.3, t) * (1 - 0.6 * smooth(0.75, 1, t));
    v.x *= k; v.z *= k; v.y += 0.0014 * q * q * Math.cos(phi - 1.3); return v;
  };
  const tv = V(), dGeo = g => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { dfm(tv.fromBufferAttribute(p, i)); p.setXYZ(i, tv.x, tv.y, tv.z); } return g; };
  const C0 = new THREE.Color('#eaa63c'), C1 = new THREE.Color('#c63f19'), C2 = new THREE.Color('#5c1210'), C3 = new THREE.Color('#1c0807');
  const skinCol = g => {
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / L, sun = 0.5 + 0.5 * Math.cos(Math.atan2(p.getX(i), p.getZ(i)) - 2.4);
      c.copy(C0).lerp(C1, smooth(0.04, 0.4, t)).lerp(C2, smooth(0.35, 0.8, t) * (0.35 + 0.65 * sun)).lerp(C3, smooth(0.78, 1, t) * (0.5 + 0.5 * sun));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  };
  const part = (coll, o, skinMat, wallMat, cutMat, col) => {
    const { skin, faces } = shell({ steps: 64, seg: 72, cut, len: L, ...o });
    dGeo(skin).computeVertexNormals(); if (col) col(skin); coll.add(skinMat, skin);
    const cuts = faces.slice(-2), walls = faces.slice(0, -2);
    walls.forEach(w => dGeo(w).computeVertexNormals()); if (walls.length) coll.add(wallMat, ...walls);
    cuts.forEach(dGeo); coll.add(cutMat, ...cuts);
  };
  const exo = collector(), meso = collector(), shl = collector(), ker = collector();
  part(exo, { outer: rO, inner: t => rO(t) * 0.968 }, M.pfSkin, M.pfSkinIn, M.pfSkinCut, skinCol);
  // perianth (calyx) segments hugging the base, two whorls of three
  const calyx = [];
  for (let k = 0; k < 6; k++) {
    const inner = k % 2, pc = k / 6 * TAU + 0.3, pw = Math.atan2(Math.sin(pc), Math.cos(pc));
    if (Math.abs(pw) < cut / 2 + 0.15) continue;
    const H = (inner ? 0.2 : 0.27) * L, Wd = inner ? 0.75 : 0.95, rows = 8, cols = 4, pos = [], uv = [], idx = [];
    for (let i = 0; i <= rows; i++) {
      const f = i / rows, tt = -0.02 + f * (H / L + 0.02), wv = Wd * Math.pow(1 - f, 0.7) + 0.03;
      for (let j = 0; j <= cols; j++) { const phi = pc + wv * (j / cols - 0.5), rr = rO(Math.max(0.006, tt)) + 0.0004 + (inner ? 0 : 0.0003) + 0.0007 * f * f; pos.push(rr * Math.sin(phi), tt * L, rr * Math.cos(phi)); uv.push(j / cols, f); }
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    dGeo(g); g.computeVertexNormals(); calyx.push(g);
  }
  exo.add(M.pfCalyx, ...calyx);
  part(meso, { outer: t => rO(t) * 0.968, inner: sh }, M.pfMesoOut, M.pfMesoWall, M.pfMeso);
  part(shl, { outer: sh, inner: ke, range: [0.17, 0.84] }, M.pfShell, M.pfShellCut, M.pfShellCut);
  for (const phi of [Math.PI, Math.PI - 0.9, Math.PI + 0.9]) { // germ pores near the apex of the shell
    const tt = 0.78, p = dfm(V(sh(tt) * Math.sin(phi), tt * L, sh(tt) * Math.cos(phi)));
    shl.add(M.pfShellCut, along(new THREE.CylinderGeometry(0.0011, 0.0013, 0.0007, 14), p, V(Math.sin(phi), 0.7, Math.cos(phi)).normalize()));
  }
  part(ker, { outer: ke, inner: t => ke(t) * 0.9, range: [0.24, 0.77] }, M.pfTesta, M.pfTesta, M.pfTestaCut);
  part(ker, { outer: t => ke(t) * 0.9, range: [0.24, 0.77] }, M.pfEndo, M.pfEndo, M.pfEndoCut);
  const ap = (rr, t, phi = cut / 2) => dfm(V(rr * Math.sin(phi), t * L, rr * Math.cos(phi)));
  const cover = new THREE.LatheGeometry(profile(rO, L, 64, 0, 1), 36, -Math.PI / 2, Math.PI);
  dGeo(cover); cover.computeVertexNormals(); skinCol(cover);
  // [swell/shrink while sliding out, forward z, final x, final y, final turn] — outer layers stay back, inner ones come forward
  const PF = [[1.06, -0.012, -0.05, -0.012, -0.75], [1.0, 0.008, -0.014, -0.004, 0], [0.97, 0.02, 0.017, 0.004, 0], [0.94, 0.03, 0.041, 0.012, 0]];
  return finalize('specimen_palm_fruit', [
    { g: exo.build('exocarp'), a: [ap(rO(0.5), 0.5, cut / 2 + 0.25)] },
    { g: meso.build('mesocarp'), a: [ap((rO(0.42) * 0.968 + sh(0.42)) / 2, 0.42)] },
    { g: shl.build('endocarp_shell'), a: [ap((sh(0.62) + ke(0.62)) / 2, 0.62)] },
    { g: ker.build('kernel'), a: [ap(ke(0.5) * 0.45, 0.5)] },
  ], { height: 8.8, cover: { geo: cover, mat: M.pfSkin, off: 0.05 }, apply: (e, s) => {
    const p1 = smooth(0.08, 0.5, e), p2 = smooth(0.45, 1, e), q = smooth(0.62, 1, p2), c = s.layers[0].userData.base.clone().negate();
    s.layers.forEach((g, k) => {
      const [sc, z, x, y, ry] = PF[k], scale = 1 + (sc - 1) * p1 * (1 - q);
      g.scale.setScalar(scale); g.rotation.y = ry * q;
      g.position.copy(c).multiplyScalar(-scale).add(V(x * p2, y * p2, z * p1));
    });
  } });
}

/* ---------- plantation floor & hand-over props ---------- */
export function buildDetails(M, rubber, palm) {
  const T = getTextures(), DS = THREE.DoubleSide, r = rng(301), out = new THREE.Group(); out.name = 'plantation_details';
  const flat = (name, map) => new THREE.MeshStandardMaterial({ name, map, alphaTest: 0.999, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const inst = (geo, mat, mats, name, cast = false) => { const im = new THREE.InstancedMesh(geo, mat, mats.length); im.name = name; im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false; mats.forEach((mt, i) => im.setMatrixAt(i, mt)); out.add(im); return im; };
  const M4 = (p, ry, s) => new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s, s, s));
  // rubber leaf litter; the tapper's aisle and the track stay bare
  const lm = [];
  for (let ix = 0; ix < 40; ix++) for (let iz = 0; iz < 40; iz++) {
    const x = -43.5 + ix * 2.23 + (r() - 0.5) * 1.6, z = -43.5 + iz * 2.23 + (r() - 0.5) * 1.6;
    if (Math.abs(z - 1.55) < 1.1 || Math.abs(z - TRACK_Z) < 2.4 || Math.abs(x) > 44 || Math.abs(z) > 44 || r() < 0.2) continue;
    lm.push(M4(V(x, heightAt(x, z) + 0.05, z), r() * TAU, 0.8 + r() * 0.5));
  }
  const litter = inst(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), flat('rubber_leaf_litter', T.litter), lm, 'leaf_litter');
  // weeded circles at every palm
  const palmPos = [...palm.sets[0].list.map(it => it.p), ...palm.targets.map(t => t.obj.position)];
  const circles = inst(new THREE.PlaneGeometry(4.2, 4.2).rotateX(-Math.PI / 2), flat('palm_weeded_circle', T.weedCircle), palmPos.map(p => M4(V(p.x, p.y + 0.06, p.z), r() * TAU, 0.9 + r() * 0.2)), 'weeded_circles');
  // pruned fronds stacked along every other inter-row
  const sr = rng(311), rach = [], lfl = [];
  for (let k = 0; k < 12; k++) {
    const [tb, lf] = frondGeo(V(-2.2 + sr() * 1.6, 0.1 + k * 0.022, (sr() - 0.5) * 0.6), (sr() < 0.5 ? 0 : Math.PI) + (sr() - 0.5) * 0.45, -0.03, 3.2 + sr() * 1.4, 0, sr);
    rach.push(tb); lfl.push(lf);
  }
  const stackFr = new THREE.MeshStandardMaterial({ name: 'frond_stack', map: T.palmFrondOld, alphaTest: 0.5, side: DS, color: 0xb8a27a, roughness: 0.85 });
  const stackRa = new THREE.MeshStandardMaterial({ name: 'frond_stack_rachis', map: T.grain, color: 0x8a7a50, roughness: 0.8 });
  const stackList = [], sGeoF = merge(lfl), sGeoR = merge(rach);
  for (let k = 0; k < 10; k += 2) { const z = -41 + k * 7.79 + 3.9; for (let x = -39; x <= 39; x += 6.5) { const xx = x + (r() - 0.5) * 1.2; stackList.push({ p: V(xx, heightAt(xx, z), z), ry: (r() - 0.5) * 0.12 + (r() < 0.5 ? 0 : Math.PI), s: 0.9 + r() * 0.25, d: (x + 45) / 90 * 0.7 + r() * 0.3 }); } }
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), zs = stackList.map(() => zero);
  const stacks = { list: stackList, meshes: [inst(sGeoF, stackFr, zs, 'frond_stacks'), inst(sGeoR, stackRa, zs, 'frond_stack_rachis')] };
  // stumps left after the rubber is felled
  const items = [...rubber.sets[0].list.map(it => ({ src: it, p: it.p })), ...rubber.targets.map(t => ({ src: t, p: t.obj.position }))];
  const zs2 = items.map(() => zero);
  const stumps = { items, meshes: [
    inst(new THREE.CylinderGeometry(0.2, 0.27, 0.5, 14, 1, true).translate(0, 0.25, 0), M.rubberBark, zs2, 'rubber_stumps', true),
    inst(new THREE.CircleGeometry(0.2, 14).rotateX(-Math.PI / 2).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ name: 'stump_cut', color: 0x8c6c4a, map: T.grain, roughness: 0.9 }), zs2, 'rubber_stump_tops'),
  ] };
  return { group: out, litter, circles, stacks, stumps };
}

export function buildWorld(M) {
  const root = new THREE.Group(); root.name = 'ting_family_land';
  const land = buildLand(M), wild = buildWild(M), banana = buildBananaEra(M), rubber = buildRubberEra(M), palm = buildPalmEra(M);
  root.add(land, wild.group, banana.group, rubber.group, palm.group);
  const specimens = [bananaSpecimen(M), papayaSpecimen(M), rubberSpecimen(M), ffbSpecimen(M), palmFruitSpecimen(M)];
  return { root, land, wild, banana, rubber, palm, specimens };
}
