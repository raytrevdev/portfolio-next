/* eslint-disable */
// Ting Family Land — scroll-driven three.js experience.
// Ported 1:1 from the HTML prototype (reference/Ting Family Land.html).
// initTingLand(rootEl, { textureBase }) mounts onto the markup rendered by TingLand.tsx and returns dispose().
// Scroll source is the window; the #track element sets the page's scroll length.
import * as THREE from 'three';
import * as LM from './land-models.js';
import { setTextureBase } from './land-textures.js';

export function initTingLand(root, opts = {}) {
setTextureBase(opts.textureBase || '/ting-land/textures/');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const cleanups = [];
const listen = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
let disposed = false, rafId = 0;


const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const backOut = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0), TAU = Math.PI * 2;

/* ---------- chapters ---------- */
const CH = [
  { len: 1.3, pal: 'hero' },
  { len: 2.3, pal: 'e1' },
  { len: 2.2, pal: 'e1' },
  { len: 2.0, pal: 'spec', spec: 0 },
  { len: 2.0, pal: 'e1' },
  { len: 2.0, pal: 'spec', spec: 1 },
  { len: 2.5, pal: 'e2' },
  { len: 2.0, pal: 'e2' },
  { len: 1.8, pal: 'e2s', spec: 2 },
  { len: 2.5, pal: 'e3' },
  { len: 2.0, pal: 'e3' },
  { len: 1.7, pal: 'spec', spec: 3 },
  { len: 1.7, pal: 'spec', spec: 4 },
  { len: 1.6, pal: 'fin' },
];
const N = CH.length, SPEC_CH = [3, 5, 8, 11, 12];
const isSpec = i => !!CH[i] && CH[i].spec !== undefined;

const PAL_SRC = {
  hero: { top: '#1a232c', bot: '#4b5545', fog: [80, 280], sun: '#ffc690', si: 2.4, sd: [-60, 34, 30], hs: '#a9b6c4', hg: '#3a3022', hi: 0.7, ei: 0.5, mo: 0.2 },
  e1:   { top: '#7893ad', bot: '#cbc3a9', fog: [70, 300], sun: '#ffd9a6', si: 2.6, sd: [50, 34, 30], hs: '#e4e9ee', hg: '#5a4630', hi: 0.6, ei: 0.6, mo: 0.8 },
  spec: { top: '#0b0a08', bot: '#17140f', fog: [60, 220], sun: '#ffe6c4', si: 0.35, sd: [30, 60, 40], hs: '#4a525a', hg: '#120f0b', hi: 0.2, key: 1, ei: 0.22, mo: 0.3 },
  e2:   { top: '#55687a', bot: '#878670', fog: [6, 105], mo: 1, sh: 1, fo: 1, sun: '#ffd9a8', si: 2.8, sd: [30, 55, 70], hs: '#fff1dc', hg: '#9a7a52', hi: 1.3, fl: 1.2, ei: 0.6 },
  e2s:  { top: '#2a3338', bot: '#5f5d50', fog: [14, 150], mo: 0.5, sh: 0.45, fo: 1, sun: '#ffd9a8', si: 1.7, sd: [30, 55, 70], hs: '#ffeedd', hg: '#7a6044', hi: 0.9, key: 1, fl: 0.7, ei: 0.45 },
  e3:   { top: '#33495a', bot: '#93a28c', fog: [80, 320], sun: '#fff1d6', si: 2.8, sd: [15, 80, 25], hs: '#d5e9ff', hg: '#2a3520', hi: 0.55, ei: 0.6, mo: 0.55 },
  fin:  { top: '#161a1f', bot: '#5c4b36', fog: [100, 340], sun: '#ffd49a', si: 2.1, sd: [60, 35, -40], hs: '#c7c2b8', hg: '#2c2419', hi: 0.45, ei: 0.45 },
};
const PAL = {};
for (const k in PAL_SRC) { const p = PAL_SRC[k]; PAL[k] = { top: new THREE.Color(p.top), bot: new THREE.Color(p.bot), sun: new THREE.Color(p.sun), hs: new THREE.Color(p.hs), hg: new THREE.Color(p.hg), sd: V(...p.sd).normalize(), fn: p.fog[0], ff: p.fog[1], si: p.si, hi: p.hi, key: p.key || 0, fl: p.fl || 0, ei: p.ei ?? 0.5, mo: p.mo ?? 0.3, sh: p.sh || 0, fo: p.fo || 0 }; }
const P = { top: new THREE.Color(), bot: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), sd: V(), fn: 0, ff: 0, si: 0, hi: 0, key: 0, fl: 0, ei: 0, mo: 0, sh: 0, fo: 0 };
function mixPal(a, b, k) {
  for (const c of ['top', 'bot', 'sun', 'hs', 'hg']) P[c].copy(a[c]).lerp(b[c], k);
  P.sd.copy(a.sd).lerp(b.sd, k).normalize();
  for (const n of ['fn', 'ff', 'si', 'hi', 'key', 'fl', 'ei', 'mo', 'sh', 'fo']) P[n] = lerp(a[n], b[n], k);
}

/* ---------- renderer & scene ---------- */
const canvas = $('#gl');
{ const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'), im = x.createImageData(180, 180); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`; }
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
const MOBILE = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
renderer.setClearColor(0x000000, 0);
const glr = (() => { try { const gl = renderer.getContext(), x = gl.getExtension('WEBGL_debug_renderer_info'); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
const LOW = /swiftshader|llvmpipe|software|basic render/i.test(glr);
if (LOW) { renderer.setPixelRatio(0.6); renderer.shadowMap.enabled = false; }
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x2b3022, 70, 260);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 1200);
// image-based ambient: soft sky dome above, warm earth bounce below
{
  const g = new THREE.SphereGeometry(10, 48, 24), p = g.attributes.position, col = [], c = new THREE.Color();
  const zen = new THREE.Color(0.62, 0.74, 0.92), hor = new THREE.Color(1.0, 0.94, 0.84), gnd = new THREE.Color(0.22, 0.19, 0.13);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; if (y >= 0) c.copy(hor).lerp(zen, Math.pow(y, 0.6)); else c.copy(hor).lerp(gnd, Math.min(1, -y * 4)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const es = new THREE.Scene(); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose();
}
// sky dome, tone-mapped with the scene so the horizon meets the fog exactly
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: V(0, 1, 0) }, sunCol: { value: new THREE.Color() }, uForest: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
  fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float uForest; varying vec3 vD;
void main(){
  vec3 d = normalize(vD); vec3 c = mix(bot, top, smoothstep(0.0, 0.62, d.y));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  c += sunCol * (pow(s, 5.0) * 0.16 + pow(s, 80.0) * 0.5) * smoothstep(-0.12, 0.06, d.y);
  if (uForest > 0.0) { // neighbouring plantation dissolving into haze beyond the plot
    float a = atan(d.z, d.x);
    float ht = 0.085 + 0.014 * sin(a * 7.0 + 1.3) + 0.01 * sin(a * 19.0) + 0.006 * sin(a * 53.0 + 2.0);
    float hb = 0.04 + 0.006 * sin(a * 11.0);
    vec3 haze = bot * vec3(0.9, 0.93, 0.87);
    vec3 can = mix(bot * vec3(0.72, 0.78, 0.66), haze, smoothstep(hb, ht, d.y) * 0.6);
    float t1 = smoothstep(0.78, 0.9, fract(a * 41.3 + 0.4 * sin(a * 5.0))), t2 = smoothstep(0.82, 0.92, fract(a * 67.7 + 0.5));
    vec3 trunks = mix(haze, bot * vec3(0.74, 0.7, 0.62), t1 * 0.45 + t2 * 0.25);
    vec3 f = d.y < hb ? mix(trunks, can, smoothstep(hb - 0.012, hb + 0.012, d.y)) : can;
    f = mix(f, bot, smoothstep(0.0, -0.05, d.y));
    c = mix(c, f, uForest * (1.0 - smoothstep(ht - 0.008, ht + 0.012, d.y)));
  }
  gl_FragColor = vec4(c, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), skyMat); skyDome.frustumCulled = false; skyDome.renderOrder = -10; scene.add(skyDome);
const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -64, right: 64, top: 64, bottom: -64, near: 1, far: 420 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05; sun.shadow.radius = 2.5;
scene.add(sun, sun.target);
const under = new THREE.DirectionalLight(0xffe2bc, 0); under.position.set(-40, 30, 60); scene.add(under); // shadowless fill so trunks under the rubber canopy keep their form

const MAT = LM.makeMaterials();
/* ---------- wind: vertex sway on foliage, anchored where leaves meet the plant ---------- */
const WIND = { value: 0 }, f3 = x => x.toFixed(3);
function addWind(mat, { r0 = -1, r1 = 0, y0 = -100, y1 = -99, amp, pw = 1, fq = 1 }) {
  const key = [r0, r1, y0, y1, amp, pw, fq].join(',');
  mat.customProgramCacheKey = () => 'wind:' + key;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
{
#ifdef USE_INSTANCING
  vec3 wo = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
  vec3 wo = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
  float ph = dot(wo.xz, vec2(0.13, 0.09)), rr = length(position.xz);
  float wt = pow(smoothstep(${f3(r0)}, ${f3(r1)}, rr) * smoothstep(${f3(y0)}, ${f3(y1)}, position.y), ${f3(pw)});
  float gust = 0.55 + 0.45 * sin(uWind * 0.31 + wo.x * 0.035 - wo.z * 0.02);
  float t = uWind * ${f3(fq)} + ph;
  vec3 sway = vec3(sin(t + position.y * 0.4) + 0.35 * sin(t * 2.3 + rr), 0.6 * sin(t * 1.7 + rr * 1.3), 0.7 * cos(t * 0.83 + position.x * 0.3));
  transformed += sway * wt * ${f3(amp)} * gust;
}`);
  };
}
if (!LOW) {
  addWind(MAT.bananaLeaf, { r0: 0.2, r1: 2.4, amp: 0.13, pw: 2, fq: 1.1 });
  addWind(MAT.bananaDead, { r0: 0.2, r1: 2.0, amp: 0.08, pw: 2, fq: 0.9 });
  addWind(MAT.papayaLeaf, { r0: 0.3, r1: 1.6, amp: 0.05, pw: 1.5, fq: 1.2 });
  for (const k of ['palmFrond', 'palmFrondOld', 'palmRachis']) addWind(MAT[k], { r0: 0.4, r1: 5.5, amp: 0.2, pw: 2, fq: 0.7 });
  addWind(MAT.rubberLeaf, { y0: 7, y1: 11, amp: 0.09, fq: 0.8 });
  addWind(MAT.shrub, { y0: 0.2, y1: 9, amp: 0.1, fq: 0.9 });
  addWind(MAT.grass, { y0: 0, y1: 0.5, amp: 0.06, fq: 2.2 });
}
const W = LM.buildWorld(MAT);
scene.add(W.root);
/* ---------- floating dust & pollen, wrapped around the camera ---------- */
const moteMat = new THREE.ShaderMaterial({
  uniforms: { uT: WIND, uCam: { value: V() }, uBox: { value: 16 }, uPx: { value: 800 }, uOp: { value: 0 }, uCol: { value: new THREE.Color(1, 0.9, 0.72) } },
  vertexShader: `uniform float uT, uBox, uPx; uniform vec3 uCam; attribute float aSeed; varying float vA;
void main(){
  vec3 p = position + vec3(sin(uT * 0.21 + aSeed * 31.0) * 0.6 + uT * 0.08, sin(uT * 0.13 + aSeed * 17.0) * 0.4 + uT * 0.03 * (fract(aSeed * 7.0) - 0.3), cos(uT * 0.17 + aSeed * 23.0) * 0.6);
  p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  float d = -mv.z;
  gl_PointSize = clamp(uPx * (0.006 + 0.01 * fract(aSeed * 13.0)) / max(d, 0.1), 1.0, 10.0);
  vA = smoothstep(0.5 * uBox, 0.25 * uBox, length(p - uCam)) * smoothstep(0.4, 1.6, d) * (0.35 + 0.65 * fract(aSeed * 5.0)) * (0.6 + 0.4 * sin(uT * 1.3 + aSeed * 40.0));
}`,
  fragmentShader: `uniform vec3 uCol; uniform float uOp; varying float vA;
void main(){ float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(uCol, a * a * vA * uOp); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
{
  const n = LOW ? 0 : MOBILE ? 380 : 900, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = (Math.random() - 0.5) * 16; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; seed[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const pts = new THREE.Points(g, moteMat); pts.frustumCulled = false; pts.renderOrder = 5; pts.name = 'motes'; scene.add(pts);
}
/* ---------- sun shafts through the rubber canopy ---------- */
const shaftMat = new THREE.ShaderMaterial({
  uniforms: { uOp: { value: 0 }, uCol: { value: new THREE.Color(1, 0.88, 0.66) } },
  vertexShader: `varying vec2 vUv; varying float vF;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  vec3 n = normalize(normalMatrix * normal); float d = -mv.z;
  vF = smoothstep(0.08, 0.55, abs(dot(n, normalize(-mv.xyz)))) * smoothstep(1.5, 6.0, d) * smoothstep(120.0, 40.0, d); }`,
  fragmentShader: `uniform float uOp; uniform vec3 uCol; varying vec2 vUv; varying float vF;
void main(){ float x = vUv.x - 0.5; float a = exp(-x * x * 16.0) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y); gl_FragColor = vec4(uCol, a * vF * uOp); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
const shafts = new THREE.Group(); shafts.name = 'sun_shafts'; scene.add(shafts);
{
  const sd = V(30, 55, 70).normalize(), r = LM.rng(909), q = new THREE.Quaternion().setFromUnitVectors(UP, sd);
  for (let k = 0; k < 16; k++) {
    const gx = -44 + r() * 64, gz = -13 + r() * 28, len = 10.5 / sd.y, wd = 1.2 + r() * 1.8;
    const parts = [0, Math.PI / 2].map(a => new THREE.PlaneGeometry(wd, len).translate(0, len / 2, 0).rotateY(a + r()));
    for (const g of parts) { const m = new THREE.Mesh(g, shaftMat); m.quaternion.copy(q); m.position.set(gx, 0, gz); m.frustumCulled = false; m.renderOrder = 4; shafts.add(m); }
  }
}
const SPEC = V(0, 24, 0);
const key = new THREE.PointLight(0xfff0dc, 0, 0, 2), rim = new THREE.PointLight(0xc8dcff, 0, 0, 2), fill = new THREE.PointLight(0xffd9b0, 0, 0, 2);
key.position.copy(SPEC).add(V(14, 12, 22)); rim.position.copy(SPEC).add(V(-18, 8, -16)); fill.position.copy(SPEC).add(V(-16, -6, 18));
scene.add(key, rim, fill);
const _bx = new THREE.Box3();
W.specimens.forEach(s => { s.setDisplay(false); s.realH = _bx.setFromObject(s.inner).getSize(V()).y; s.group.visible = false; s.group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); scene.add(s.group); });

/* ---------- eras ---------- */
const ERAS = [W.banana, W.rubber, W.palm];
W.banana.label = 'banana'; W.rubber.label = 'rubber'; W.palm.label = 'palm';
for (const e of [W.wild, ...ERAS]) e.targets.forEach(t => { t.ry0 = t.obj.rotation.y; t.base = { p: t.part.position.clone(), r: t.part.rotation.clone(), s: t.part.scale.clone() }; });
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), S3 = V(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function growth(it, G, F, S = 1) {
  const g = clamp((G * 1.35 - it.d) / 0.35);
  let s = g > 0 ? Math.max(0, backOut(g)) * (it.s ?? 1) * S : 0, tilt = 0;
  if (F > 0) { const f = clamp((F * 1.35 - (it.d2 ?? 0)) / 0.35); tilt = f * f * 1.45; s *= 1 - sm(0.6, 1, f); }
  return { g, s, tilt };
}
function updateEra(era, G, F, S = 1) {
  let planted = 0;
  for (const set of era.sets) {
    const { list, meshes } = set;
    for (let i = 0; i < list.length; i++) {
      const it = list[i], { g, s, tilt } = growth(it, G, F, S);
      if (g > 0.5) planted++;
      E.set(Math.cos(it.ax) * tilt, it.ry, Math.sin(it.ax) * tilt); Q.setFromEuler(E); S3.setScalar(s); M4.compose(it.p, Q, S3);
      for (const m of meshes) m.setMatrixAt(i, (s === 0 || (m.userData.opt && !it.opt[m.userData.opt])) ? ZERO : M4);
    }
    meshes.forEach(m => m.instanceMatrix.needsUpdate = true);
  }
  for (const t of era.targets) {
    const { g, s, tilt } = growth(t, G, F, S);
    if (g > 0.5) planted++;
    t.obj.visible = s > 0.0005; t.obj.scale.setScalar(Math.max(s, 0.0001));
    t.obj.rotation.set(Math.cos(t.ax || 0) * tilt, t.ry0, Math.sin(t.ax || 0) * tilt, 'YXZ');
  }
  era.group.visible = G > 0.0005 && F < 0.9999;
  return planted;
}
const eraCache = new Map();
function setEra(era, G, F = 0, S = 1) {
  const c = eraCache.get(era);
  if (c && Math.abs(c.G - G) < 1e-4 && Math.abs(c.F - F) < 1e-4 && Math.abs(c.S - S) < 1e-4) return c.n;
  const n = updateEra(era, G, F, S); eraCache.set(era, { G, F, S, n }); shadowDirty = true; return n;
}
/* ---------- floor details & hand-over props ---------- */
const DET = LM.buildDetails(MAT, W.rubber, W.palm); scene.add(DET.group);
const detCache = {};
function setDetails(T, rubF) {
  const litK = sm(6.3, 6.9, T) * (1 - sm(8.75, 9.05, T)), cirK = sm(9.35, 9.9, T), stK = sm(9.55, 10.2, T), sink = sm(9.45, 9.95, T);
  DET.litter.visible = litK > 0.01; DET.litter.material.alphaTest = 1 - 0.58 * litK;
  DET.circles.visible = cirK > 0.01; DET.circles.material.alphaTest = 1 - 0.7 * cirK;
  if (detCache.st !== stK) {
    detCache.st = stK; shadowDirty = true;
    DET.stacks.list.forEach((it, i) => { const g = clamp((stK * 1.3 - it.d) / 0.3), s = g > 0 ? easeOut(g) * it.s : 0; E.set(0, it.ry, 0); Q.setFromEuler(E); S3.set(it.s, s, it.s); M4.compose(it.p, Q, S3); DET.stacks.meshes.forEach(mm => mm.setMatrixAt(i, s > 0 ? M4 : ZERO)); });
    DET.stacks.meshes.forEach(mm => { mm.instanceMatrix.needsUpdate = true; mm.visible = stK > 0; });
  }
  if (detCache.f !== rubF || detCache.sk !== sink) {
    detCache.f = rubF; detCache.sk = sink; shadowDirty = true;
    const on = rubF > 0 && sink < 1;
    if (on) DET.stumps.items.forEach((it, i) => {
      const f = clamp((rubF * 1.35 - (it.src.d2 ?? 0)) / 0.35), s = sm(0.5, 0.62, f) * (1 - sink);
      E.set(0, it.p.x * 1.7, 0); Q.setFromEuler(E); S3.set(1, s, 1); _sp.copy(it.p); _sp.y -= 0.02 + 0.3 * sink; M4.compose(_sp, Q, S3);
      DET.stumps.meshes.forEach(mm => mm.setMatrixAt(i, s > 0.001 ? M4 : ZERO));
    });
    DET.stumps.meshes.forEach(mm => { mm.instanceMatrix.needsUpdate = true; mm.visible = on; });
  }
}
const _sp = V();
const GROUND = [[0, '#3f5a2a'], [1.1, '#6b573a'], [2.4, '#66603a'], [5.75, '#66603a'], [6.3, '#6e5a3c'], [9.1, '#6e5a3c'], [9.8, '#4b6830']].map(([t, c]) => [t, new THREE.Color(c)]);
function groundAt(T) { for (let i = 0; i < GROUND.length - 1; i++) { const [a, ca] = GROUND[i], [b, cb] = GROUND[i + 1]; if (T <= b) return MAT.ground.color.copy(ca).lerp(cb, sm(a, b, T)); } MAT.ground.color.copy(GROUND[GROUND.length - 1][1]); }

/* ---------- camera shots ---------- */
const cen = arr => arr.reduce((a, t) => a.add(t.obj.position), V()).multiplyScalar(1 / arr.length);
const cB = cen(W.banana.targets), cP = cen(W.palm.targets);
W.root.updateMatrixWorld(true);
const wpos = o => o.getWorldPosition(V());
W.banana.heroPapaya.obj.rotation.y = -Math.PI / 2 + 0.25; W.banana.heroPapaya.ry0 = W.banana.heroPapaya.obj.rotation.y; W.root.updateMatrixWorld(true);
const HB = W.banana.heroBanana.obj.userData.bunch.userData.hero, HP = W.banana.heroPapaya.part;
const bunchC = wpos(W.banana.heroBanana.obj.userData.bunch.userData.anchor), papC = wpos(HP);
const camB = bunchC.clone().add(V(1.5, 0.15, 3.6)), camPap = papC.clone().add(V(1.1, -0.35, 3.2)), camR = V(-1.2, 1.6, 2.7), camP = V(cP.x, 2.2, 56);
function specDef(S, from, H, dist, push, lift) {
  const flat = V(from.x - S.x, 0, from.z - S.z).normalize();
  const dir = flat.clone().add(V(0, 0.14, 0)).normalize();
  const F = S.clone().addScaledVector(flat, push).add(V(0, lift, 0));
  return { S, F, H, dist, dir, right: V().crossVectors(dir.clone().negate(), UP).normalize(), yaw: Math.atan2(flat.x, flat.z), drift: 0.05, spec: true };
}
const dBan = specDef(wpos(HB.mesh), camB, 0.62, 1.95, 0.55, 0.05); dBan.hide = HB.mesh; dBan.q0 = HB.mesh.getWorldQuaternion(new THREE.Quaternion());
const dPap = specDef(papC, camPap, 0.62, 2.5, 0.55, 0.02); dPap.hide = HP; dPap.q0 = HP.getWorldQuaternion(new THREE.Quaternion());
const dRub = specDef(W.rubber.targets[1].obj.position.clone().add(V(0, 1.43, 0)), camR, 1.0, 4.6, 1.4, 0.4);
const dFfb = specDef(wpos(W.palm.targets[1].anchor), camP, 1.6, 5.2, 6.2, -1.2);
const dFru = { ...dFfb, S: dFfb.F.clone().add(V(0.35, 0.25, 0.1)), H: 1.0, dist: 5.6 };
const SPECDEF = [dBan, dPap, dRub, dFfb, dFru];
const PEEL_G = MAT.bananaFruit.color.clone(), PEEL_Y = MAT.peel.color.clone();
{ // felled west to east like dominoes, each tree tipping away from the camera's exit point
  const F = V(-60, 0, 1.55);
  for (const it of [...W.rubber.sets[0].list, ...W.rubber.targets.map(t => ({ p: t.obj.position, ry: t.ry0, t }))]) {
    const dx = it.p.x - F.x, dz = it.p.z - F.z, dist = Math.hypot(dx, dz) || 1, ux = dx / dist, uz = dz / dist, r = it.ry || 0;
    const lx = ux * Math.cos(r) - uz * Math.sin(r), lz = ux * Math.sin(r) + uz * Math.cos(r);
    const d2 = clamp((it.p.x + 45) / 90) * 0.8 + Math.random() * 0.06, ax = Math.atan2(-lx, lz);
    if (it.t) { it.t.d2 = d2; it.t.ax = ax; } else { it.d2 = d2; it.ax = ax; }
  }
}
const SH = [
  { pos: V(78, 58, 92), tgt: V(0, -3, 0), drift: 0.35 },
  { pos: V(36, 17, 52), tgt: V(-2, 1, 4), drift: 0.25 },
  { pos: camB, tgt: bunchC.clone().add(V(-0.75, -0.1, 0)), drift: 0.05 },
  dBan,
  { pos: camPap, tgt: papC.clone().add(V(-0.8, 0.05, 0)), drift: 0.05 },
  dPap,
  { pos: V(-50, 3.2, 1.55), tgt: V(0, 3.4, 1.55), drift: 0, dolly: 0.24, via: { pos: papC.clone().add(V(1, 1.2, 9)), tgt: papC.clone().add(V(-1.5, -0.6, 0)) }, arcAfterVia: 10 },
  { pos: camR, tgt: V(4.2, 0.75, -1.8), drift: 0.04 },
  dRub,
  { pos: V(55, 30, 70), tgt: V(0, 3, 0), drift: 0.25, via: { pos: V(-54, 3.6, 1.55), tgt: V(0, 3.2, 1.55) } },
  { pos: V(cP.x, 2.2, 52), tgt: V(cP.x + 0.5, 3.7, cP.z), drift: 0.05 },
  dFfb, dFru,
  { pos: V(-80, 64, 88), tgt: V(0, -3, 0), drift: 0.4 },
];
let portrait = innerWidth / innerHeight < 0.9;
const _o = V(), _o2 = V(), sA = new THREE.Spherical(), sB = new THREE.Spherical();
function shotAt(i, t, outP, outT) {
  const s = SH[i];
  if (s.spec) {
    outT.copy(s.F);
    if (portrait) outT.y -= 0.3 * s.H; else outT.addScaledVector(s.right, -0.55 * s.H * clamp((innerWidth - 760) / 640, 0.25, 1));
    _o.copy(s.dir).multiplyScalar(s.dist * (portrait ? 1.6 : clamp(1300 / innerWidth, 1, 1.45)));
    _o.applyAxisAngle(UP, s.drift * (t - 0.5));
    outP.copy(outT).add(_o); return;
  }
  outT.copy(s.tgt);
  _o.copy(s.pos).sub(s.tgt);
  if (portrait) _o.multiplyScalar(1.45);
  _o.applyAxisAngle(UP, s.drift * (t - 0.5));
  if (s.dolly) _o.multiplyScalar(1 - s.dolly * t);
  outP.copy(outT).add(_o);
}
function blend(pa, ta, pb, tb, k, outP, outT) {
  sA.setFromVector3(_o.copy(pa).sub(ta)); sB.setFromVector3(_o2.copy(pb).sub(tb));
  let dt = sB.theta - sA.theta; dt = ((dt + Math.PI) % TAU + TAU) % TAU - Math.PI;
  outT.lerpVectors(ta, tb, k);
  sA.set(Math.exp(lerp(Math.log(sA.radius), Math.log(sB.radius), k)), lerp(sA.phi, sB.phi, k), sA.theta + dt * k);
  outP.setFromSpherical(sA).add(outT);
}

const anims = [];
/* ---------- scroll layout & gates ---------- */
const track = $('#track');
let starts = [], vh = innerHeight, gateMax = Infinity;
function layout() {
  vh = Math.max(1, innerHeight); let acc = 0;
  starts = CH.map(c => { const s = acc; acc += c.len * vh; return s; });
  gateMax = acc; track.style.height = (acc + vh) + 'px';
}
function scrollT() {
  const s = Math.max(0, scrollY);
  for (let i = N - 1; i >= 0; i--) if (s >= starts[i]) { const v = Math.min(N - 0.0001, i + (s - starts[i]) / (CH[i].len * vh)); return Number.isFinite(v) ? v : 0; }
  return 0;
}
$$('[data-jump]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); const i = +b.dataset.jump; window.scrollTo({ top: Math.min(starts[i] + (i ? 0.2 : 0) * CH[i].len * vh, gateMax), behavior: 'smooth' }); }));

/* ---------- autoplay: scrolls the story by itself (~3 min); any wheel / touch / key / click hands control back ---------- */
const AUTO_SEC = 6;                                   // seconds per viewport height of story
const autoEnd = () => starts[N - 1] + 0.45 * CH[N - 1].len * vh; // stop once the timeline recap is up
const trackEv = (event, params = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event, ...params }); if (!window.__GTM__ && typeof window.gtag === 'function') window.gtag('event', event, params); } catch (e) {} };
let auto = null, autoRaf = 0;
function autoStop(done) {
  if (!auto) return;
  cancelAnimationFrame(autoRaf); auto = null; root.dataset.auto = '0';
  trackEv(done ? 'roots_autoplay_complete' : 'roots_autoplay_stop', done ? {} : { progress: Math.round(clamp(scrollY / autoEnd()) * 100) });
}
function autoStart() {
  if (scrollY >= autoEnd() - 4) window.scrollTo(0, 0); // finished: play again from the top
  const t0 = performance.now();
  auto = { y: Math.max(0, scrollY), last: t0, t0 }; root.dataset.auto = '1'; trackEv('roots_autoplay_start');
  const step = now => {
    if (!auto || disposed) return;
    const dt = Math.min(0.1, (now - auto.last) / 1000); auto.last = now;
    if ($('#loader').classList.contains('done')) {
      let i = 0; while (i < N - 1 && auto.y >= starts[i + 1]) i++;
      const pace = CH[i].spec != null ? 1.2 : 1, ease = clamp((now - auto.t0) / 1200); // linger on cutaways; ease in
      auto.y = Math.min(autoEnd(), auto.y + ease * vh * dt / (AUTO_SEC * pace));
      window.scrollTo(0, auto.y);
      if (auto.y >= autoEnd()) { autoStop(true); return; }
    }
    autoRaf = requestAnimationFrame(step);
  };
  autoRaf = requestAnimationFrame(step);
}
$$('[data-auto-toggle]').forEach(b => listen(b, 'click', ev => { ev.preventDefault(); auto ? autoStop() : autoStart(); }));
['wheel', 'touchstart'].forEach(ev => listen(window, ev, () => autoStop(), { passive: true }));
listen(window, 'keydown', e => { if (!e.target.closest?.('[data-auto-toggle]')) autoStop(); });
listen(window, 'pointerdown', e => { if (!e.target.closest?.('[data-auto-toggle]')) autoStop(); });
cleanups.push(() => cancelAnimationFrame(autoRaf));

/* ---------- labels ---------- */
let labelsCompact = false;
const labels = $$('.lbl').map(el => ({ el, s: +el.dataset.s, l: +el.dataset.l, a: +el.dataset.a, on: false }));

/* ---------- frame ---------- */
const _box = new THREE.Box3(), _c = V();
function specRect(s) {
  _box.setFromObject(s.inner); const R = { l: 1e9, r: -1e9, t: 1e9, b: -1e9 };
  for (let k = 0; k < 8; k++) { _c.set(k & 1 ? _box.max.x : _box.min.x, k & 2 ? _box.max.y : _box.min.y, k & 4 ? _box.max.z : _box.min.z).project(camera); const x = (_c.x + 1) * innerWidth / 2, y = (1 - _c.y) * innerHeight / 2; R.l = Math.min(R.l, x); R.r = Math.max(R.r, x); R.t = Math.min(R.t, y); R.b = Math.max(R.b, y); }
  return R;
}
function specRight(s) {
  _box.setFromObject(s.inner); let mx = -1e9;
  for (let k = 0; k < 8; k++) { _c.set(k & 1 ? _box.max.x : _box.min.x, k & 2 ? _box.max.y : _box.min.y, k & 4 ? _box.max.z : _box.min.z).project(camera); mx = Math.max(mx, (_c.x + 1) * innerWidth / 2); }
  return mx;
}
const YK = [[0, 1933], [1, 1933], [3, 1944], [5.6, 1951], [6, 1952], [8, 2003], [8.6, 2003], [9, 2004], [11, 2024], [12.5, 2026], [14, 2026]];
const yearAt = T => { for (let i = 0; i < YK.length - 1; i++) if (T <= YK[i + 1][0]) return Math.round(lerp(YK[i][1], YK[i + 1][1], clamp((T - YK[i][0]) / (YK[i + 1][0] - YK[i][0])))); return 2026; };
let bootAt = 0, lastDraw = 0, tmp2 = null, tmp3 = null, force = true, lastT = -1, Tsm = null, shadowDirty = true, lastShadowT = -1, mx = 0, my = 0, smx = 0, smy = 0, last = performance.now(), bgKey = '', lastYear = 0, eraAttr = '';
listen(window, 'pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
const pA = V(), tA = V(), pB = V(), tB = V(), tmp = V(), right = V();
const onState = new Array(N).fill(null);
const counts = { banana: $('[data-count="banana"]'), rubber: $('[data-count="rubber"]'), palm: $('[data-count="palm"]') };
const bars = { banana: $('[data-bar="banana"]'), rubber: $('[data-bar="rubber"]'), palm: $('[data-bar="palm"]') };
const chEls = $$('.ch').sort((a, b) => a.dataset.i - b.dataset.i);

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const Tt = window.__forceT ?? scrollT();
  if (window.__forceT != null || !Number.isFinite(Tsm)) Tsm = Tt;
  if (Math.max(1, innerHeight) !== vh || innerWidth !== lastW) resize();
  Tsm = Tsm === null ? Tt : Tsm + (Tt - Tsm) * (1 - Math.exp(-dt * 5));
  if (Math.abs(Tt - Tsm) < 1e-5) Tsm = Tt;
  const T = clamp(Tsm, 0, N - 0.0001), i = Math.min(N - 1, Math.max(0, Math.floor(T))), t = T - i;
  const specLive = SPEC_CH.some(c => T > c - 0.65 && T < c + 1.05);
  if (!force && T === lastT && Math.abs(mx - smx) < 1e-4 && Math.abs(my - smy) < 1e-4 && !anims.length && !specLive && (LOW || now - lastDraw < 33)) return;
  force = false; lastT = T;

  // eras
  setEra(W.wild, 1 - sm(0.5, 1.15, T));
  // 1951: rubber saplings go in between the bananas, the bananas are cleared, the rubber grows up
  const nb = setEra(W.banana, sm(1.08, 1.7, T) * (1 - sm(5.86, 6.16, T)));
  const rubGrow = sm(6.02, 6.62, T), rubF = sm(8.72, 9.1, T);
  const nr = Math.round(setEra(W.rubber, sm(5.6, 5.9, T), rubF, 0.2 + 0.8 * rubGrow) * rubGrow);
  // 2004: felled rubber leaves stumps; palm seedlings are planted between them, then the stumps rot away
  const palGrow = sm(9.3, 9.85, T);
  const np = Math.round(setEra(W.palm, sm(9.0, 9.28, T), 0, 0.2 + 0.8 * palGrow) * palGrow);
  setDetails(T, rubF);
  groundAt(T); MAT.grass.color.copy(MAT.ground.color).multiplyScalar(1.7);
  const rubCanopy = sm(6.2, 6.8, T) * (1 - sm(8.6, 8.9, T));

  // camera + palette
  let kp = 0;
  shotAt(i, t, pA, tA);
  const nx = Math.min(N - 1, i + 1);
  if (nx !== i) {
    const k0 = isSpec(i) ? 0.62 : 0.38;
    kp = sm(k0 + 0.02, 1, t);
    const k = easeIO(sm(k0, 1, t));
    if (k > 0) {
      shotAt(nx, 0, pB, tB);
      const via = SH[nx].via;
      if (via) { if (k < 0.5) blend(pA, tA, via.pos, via.tgt, k * 2, pA, tA); else blend(via.pos, via.tgt, pB, tB, (k - 0.5) * 2, pA, tA); }
      else blend(pA, tA, pB, tB, k, pA, tA);
      if (SH[nx].arc) pA.y += Math.sin(Math.PI * k) * SH[nx].arc;
      if (SH[nx].arcAfterVia && k > 0.5) pA.y += Math.sin(Math.PI * (k - 0.5) * 2) * SH[nx].arcAfterVia;
    }
  }
  mixPal(PAL[CH[i].pal], PAL[CH[nx].pal], kp);
  const introK = bootAt ? easeOut(clamp((now - bootAt) / 4200)) : 0, heroW = 1 - sm(0.25, 0.9, T);
  if (heroW > 0 && introK < 1) {
    const back = (1 - introK) * heroW;
    pA.sub(tA).multiplyScalar(1 - 0.32 * back).applyAxisAngle(UP, 0.25 * back).add(tA); pA.y -= 6 * back;
    P.sd.applyAxisAngle(UP, -1.3 * back); P.sd.y = Math.max(0.12, P.sd.y - 0.25 * back); P.sd.normalize();
    P.si *= 1 - 0.65 * back; P.hi *= 1 - 0.45 * back; P.ei *= 1 - 0.45 * back;
    shadowDirty = true; force = true;
  }
  smx += (mx - smx) * (1 - Math.exp(-dt * 3)); smy += (my - smy) * (1 - Math.exp(-dt * 3));
  const dist = pA.distanceTo(tA);
  right.copy(tA).sub(pA).cross(UP).normalize();
  camera.position.copy(pA).addScaledVector(right, smx * dist * 0.03).addScaledVector(UP, -smy * dist * 0.015);
  camera.lookAt(tA);
  camera.updateMatrixWorld();

  // lights / fog / bg
  scene.fog.color.copy(P.bot); scene.fog.near = P.fn; scene.fog.far = P.ff;
  under.intensity = P.fl;
  sun.color.copy(P.sun); sun.intensity = P.si; sun.position.copy(P.sd).multiplyScalar(170);
  hemi.color.copy(P.hs); hemi.groundColor.copy(P.hg); hemi.intensity = P.hi;

  skyMat.uniforms.top.value.copy(P.top); skyMat.uniforms.bot.value.copy(P.bot);
  skyMat.uniforms.uForest.value = P.fo * sm(6.15, 6.6, T) * (1 - sm(8.72, 9.0, T));
  skyMat.uniforms.sunDir.value.copy(P.sd); skyMat.uniforms.sunCol.value.copy(P.sun).multiplyScalar(P.si * 0.25);
  skyDome.position.copy(camera.position);
  scene.environmentIntensity = P.ei;
  WIND.value = now / 1000;
  moteMat.uniforms.uCam.value.copy(camera.position); moteMat.uniforms.uOp.value = P.mo * 0.55;
  moteMat.uniforms.uCol.value.setRGB(1, 0.9, 0.72).lerp(P.sun, 0.4);
  shaftMat.uniforms.uOp.value = P.sh * rubCanopy * 0.16; shafts.visible = shaftMat.uniforms.uOp.value > 0.002;

  // specimens
  const _toCam = tmp2 || (tmp2 = V()), _ray = tmp3 || (tmp3 = V());
  let specE = 0, specIdx = -1, specA = 0, lightDef = null, lightA = 0;
  W.specimens.forEach((s, j) => {
    const c = SPEC_CH[j], d = SPECDEF[j];
    const inA = isSpec(c - 1) ? sm(c - 0.4, c + 0.08, T) : sm(c - 0.45, c + 0.2, T);
    const o0 = c + (isSpec(c + 1) ? 0.6 : 0.62), o1 = c + (isSpec(c + 1) ? 0.88 : 0.94), u = sm(o0, o1, T), outA = 1 - u;
    const a = Math.min(inA, outA), g = easeIO(a);
    s.group.visible = a > 0.001; if (d.hide) d.hide.visible = !s.group.visible;
    if (a > lightA) { lightA = a; lightDef = d; }
    if (!s.group.visible) return;
    const e = easeIO(sm(c + 0.04, c + 0.42, T)) * (1 - easeIO(sm(c + 0.47, c + 0.6, T)));
    s.apply(e);
    if (!d.q1) d.q1 = new THREE.Quaternion().setFromAxisAngle(UP, d.yaw);
    if (!d.q0) {
      const away = d.dir.clone().negate(), y0 = UP.clone(), z0 = away.clone().addScaledVector(y0, -away.dot(y0)).normalize(), x0 = V().crossVectors(y0, z0);
      d.q0 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x0, y0, z0));
    }
    const sH = d.H / s.realH, idle = Math.sin(now * 0.0003) * 0.12, bob = Math.sin(now * 0.0006) * 0.02 * d.H;
    if (u > 0) {
      // homecoming: the sealed fruit gathers itself, then shrinks along the camera→slot ray (so it never passes through the plant),
      // arcing slightly and twisting one full turn as it screws back into its exact place
      const w = clamp(easeIO(u) - 0.07 * Math.sin(Math.PI * clamp(u / 0.3)), -0.1, 1), sc = Math.exp(Math.log(sH) * (1 - w));
      _toCam.copy(camera.position).sub(d.S).normalize();
      _ray.copy(d.S).addScaledVector(_toCam, Math.max(0, (sc - 1) * 0.5 * s.realH) * 1.3);
      const fade = 1 - easeIO(sm(0, 0.4, u));
      s.group.position.copy(d.F).lerp(_ray, easeIO(sm(0.04, 0.62, u))).addScaledVector(UP, Math.sin(Math.PI * u) * (1 - u) * 0.4 * d.H + bob * fade);
      s.group.scale.setScalar(sc);
      s.group.quaternion.slerpQuaternions(d.q1, d.q0, easeIO(sm(0.12, 0.9, u)));
      s.group.rotateY(TAU * easeIO(sm(0.04, 1, u)) + (idle + (o0 - c - 0.4) * 0.35) * fade);
    } else {
      const gs = easeIO(sm(0.1, 1, a)), gr = easeIO(sm(0.25, 1, a));
      const snap = 1 + 0.05 * Math.sin(Math.PI * sm(c + 0.55, c + 0.62, T)); // layers lock shut with a small pulse
      s.group.scale.setScalar(Math.exp(Math.log(sH) * gs) * snap);
      s.group.quaternion.slerpQuaternions(d.q0, d.q1, gr);
      s.group.rotateY((idle + (T - c - 0.4) * 0.35) * gr);
      s.group.position.lerpVectors(d.S, d.F, gs); s.group.position.y += bob * gs;
    }
    s.group.updateMatrixWorld(true);
    if (i === c) { specE = e; specIdx = j; specA = a; }
    if (j === 0) MAT.peel.color.copy(PEEL_G).lerp(PEEL_Y, sm(0.3, 0.95, e));
  });
  if (lightDef) {
    const f = lightDef.dist / 36, q = new THREE.Quaternion().setFromAxisAngle(UP, lightDef.yaw);
    key.position.copy(V(14, 12, 22).multiplyScalar(f).applyQuaternion(q)).add(lightDef.F);
    rim.position.copy(V(-18, 8, -16).multiplyScalar(f).applyQuaternion(q)).add(lightDef.F);
    fill.position.copy(V(-16, -6, 18).multiplyScalar(f).applyQuaternion(q)).add(lightDef.F);
    key.intensity = 2600 * f * f * P.key; rim.intensity = 2200 * f * f * P.key; fill.intensity = 700 * f * f * P.key;
  } else key.intensity = rim.intensity = fill.intensity = 0;

  // chapter text
  for (let c = 0; c < N; c++) {
    const on = c === 0 ? T < 0.74 : c === N - 1 ? T > c + 0.06 : (T > c + 0.06 && T < c + (isSpec(c) ? 0.56 : 0.76));
    if (onState[c] !== on) { onState[c] = on; chEls[c].classList.toggle('on', on); }
  }
  const setCount = (k, n, total) => { counts[k].textContent = `${n} / ${total}`; bars[k].style.width = (n / total * 100).toFixed(1) + '%'; };
  if (onState[1]) setCount('banana', nb, W.banana.total);
  if (onState[6]) setCount('rubber', nr, W.rubber.total);
  if (onState[9]) setCount('palm', np, W.palm.total);

  // labels
  const hw = innerWidth / 2, hh = innerHeight / 2, vis = [];
  for (const L of labels) {
    const s = W.specimens[L.s];
    let show = specIdx === L.s && onState[SPEC_CH[L.s]] && specA > 0.9 && specE > 0.25 + L.l * 0.14;
    if (show) { tmp.copy(s.anchors[L.l][L.a]); s.layers[L.l].localToWorld(tmp); tmp.project(camera); show = tmp.z < 1 && Math.abs(tmp.x) < 0.98 && Math.abs(tmp.y) < 0.98; }
    if (show) { L.x = (tmp.x + 1) * hw; L.y = (1 - tmp.y) * hh; vis.push(L); }
    if (L.on !== show) { L.on = show; L.el.classList.toggle('on', show); }
  }
  const rowMode = vis.length && (vis[0].s === 4 || portrait);
  if (rowMode) {
    const rc = specRect(W.specimens[vis[0].s]), lwA = portrait ? 112 : 172, gap = portrait ? 8 : 16, sides = [[], []];
    if (labelsCompact !== portrait) { labelsCompact = portrait; $('#labels').classList.toggle('compact', portrait); labels.forEach(l => l.h = 0); }
    vis.sort((a, b) => a.x - b.x).forEach((l, k) => sides[(k + 1) % 2].push(l));
    sides.forEach((arr, sd) => {
      let prevR = -1e9; arr.forEach(l => { l.cx = Math.max(l.x, prevR + gap + lwA / 2); prevR = l.cx + lwA / 2; });
      const over = prevR - (innerWidth - 14); if (over > 0) arr.forEach(l => l.cx -= over);
      if (arr.length && arr[0].cx < 14 + lwA / 2) { const d = 14 + lwA / 2 - arr[0].cx; arr.forEach(l => l.cx += d); }
      arr.forEach(l => { const hgt = l.h || (l.h = l.el.children[2].offsetHeight || 40); l.lineY = sd === 0 ? rc.t - 18 : rc.b + 18; l.top = sd === 0 ? l.lineY - 8 - hgt : l.lineY + 8; });
    });
    for (const l of vis) {
      const dx = l.cx - l.x, dy = l.lineY - l.y, em = l.el.children[1], txt = l.el.children[2];
      l.el.style.transform = `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px)`;
      em.style.width = Math.hypot(dx, dy).toFixed(1) + 'px'; em.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      txt.style.transform = `translate(${(dx - lwA / 2).toFixed(1)}px,${(l.top - l.y).toFixed(1)}px)`; txt.style.setProperty('--lw', lwA + 'px'); txt.style.textAlign = 'center';
    }
  } else if (vis.length) {
    const lw = portrait ? 130 : clamp(innerWidth * 0.3 - 80, 150, 240), colX = portrait ? null : Math.min(Math.max(Math.max(...vis.map(l => l.x)) + 64, specRight(W.specimens[vis[0].s]) + 36), innerWidth - lw - 70);
    const avail = innerHeight - (portrait ? 330 : 280);
    const compact = vis.length * 70 + 40 > avail;
    if (compact !== labelsCompact) { labelsCompact = compact; $('#labels').classList.toggle('compact', compact); labels.forEach(l => l.h = 0); }
    vis.sort((a, b) => [0, 1, 4].includes(a.s) ? a.l - b.l : a.y - b.y);
    let prev = 80 - 1e9, ph = 0; vis.forEach(l => { const hgt = l.h || (l.h = l.el.children[2].offsetHeight || 40); l.ty = Math.max(l.y, prev + ph + (portrait ? 10 : 18)); prev = l.ty; ph = hgt; });
    const over = prev + ph - (innerHeight - (portrait ? 260 : 190)); if (over > 0) vis.forEach(l => l.ty -= over);
    const under = 90 - vis[0].ty; if (under > 0) vis.forEach(l => l.ty += under);
    for (const l of vis) {
      const tx = portrait ? l.x + 34 : colX, dx = tx - 8 - l.x, dy = l.ty - l.y;
      l.el.style.transform = `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px)`;
      const em = l.el.children[1], txt = l.el.children[2];
      em.style.width = Math.hypot(dx, dy).toFixed(1) + 'px'; em.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      txt.style.transform = `translate(${(tx - l.x).toFixed(1)}px,${(dy - 12).toFixed(1)}px)`; txt.style.setProperty('--lw', lw + 'px'); txt.style.textAlign = '';
    }
  }

  // hud: year, era, progress
  const year = yearAt(T);
  if (year !== lastYear) { lastYear = year; $('[data-year]').textContent = year; $('[data-tended]').textContent = year - 1933; }
  const era = T < 0.75 ? 0 : year < 1952 ? 1 : year < 2004 ? 2 : 3;
  const eraS = String(era);
  if (eraS !== eraAttr) {
    eraAttr = eraS; root.dataset.era = eraS;
    $('[data-eralabel]').textContent = ['Before planting', 'Banana & Papaya', 'Rubber', 'Oil Palm'][era];
    const ri = T > 13.2 ? 4 : era;
    $$('#rail button').forEach((b, k) => b.classList.toggle('on', k === ri));
  }
  if (T > 13.2) $$('#rail button').forEach((b, k) => b.classList.toggle('on', k === 4));
  $('#prog i').style.width = (T / (N - 0.0001) * 100).toFixed(2) + '%';

  if (shadowDirty || Math.abs(T - lastShadowT) > 0.0004) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; lastShadowT = T; }
  lastDraw = now;
  renderer.render(scene, camera);
}

let lastW = -1;
function resize() {
  force = true; lastW = innerWidth;
  if (!innerWidth || !innerHeight) { layout(); return; }
  portrait = innerWidth / innerHeight < 0.9;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = portrait ? 46 : 38; camera.updateProjectionMatrix();
  moteMat.uniforms.uPx.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * Math.PI / 360));
  layout(); shadowDirty = true; labels.forEach(l => l.h = 0);
}
listen(window, 'resize', resize);
resize();
window.__replayIntro = () => { bootAt = performance.now(); force = true; };
window.__frame = () => { force = true; frame(performance.now()); };
let rafSeen = false, lastFrameAt = 0;
function loop(t) { if (disposed) return; rafSeen = true; lastFrameAt = performance.now(); frame(t); rafId = requestAnimationFrame(loop); }
try { frame(performance.now()); } catch (err) { $('#loader p').textContent = err.message; console.error(err); }
rafId = requestAnimationFrame(loop);
const iv = setInterval(() => { if (disposed) return; const n = performance.now(); if (n - lastFrameAt > 150) { lastFrameAt = n; frame(n); } }, 60);
// compile every material up front (in parallel where supported) so later chapters don't hitch on first view
try { const vis = []; scene.traverse(o => { vis.push([o, o.visible]); o.visible = true; }); const p = renderer.compileAsync(scene, camera); vis.forEach(([o, v]) => o.visible = v); p.catch(() => {}); } catch (e) {}
force = true;
listen(window, 'ting-tex', () => { force = true; shadowDirty = true; });
Promise.race([LM.texturesReady(), new Promise(r => setTimeout(r, 5000))]).then(() => { force = true; shadowDirty = true; setTimeout(() => { $('#loader').classList.add('done'); bootAt = performance.now() - (matchMedia('(prefers-reduced-motion: reduce)').matches ? 4200 : 0); force = true; }, 250); });

return function dispose() {
  if (disposed) return;
  disposed = true;
  cancelAnimationFrame(rafId);
  clearInterval(iv);
  cleanups.forEach(f => f());
  delete window.__frame; delete window.__replayIntro; delete window.__forceT;
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose());
  });
  if (scene.environment) scene.environment.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
};
}
