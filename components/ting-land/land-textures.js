/* eslint-disable */
import * as THREE from 'three';
// Baked textures are served from /public. Override with setTextureBase() before the first getTextures() call.
let TEX_BASE = '/ting-land/textures/';
export function setTextureBase(b) { if (b) TEX_BASE = b.endsWith('/') ? b : b + '/'; }
// Procedural canvas textures (color + normal) for the Ting land models. Generated once, cached.

function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgb = (c, a = 1) => `rgba(${cl(c[0]) * 255 | 0},${cl(c[1]) * 255 | 0},${cl(c[2]) * 255 | 0},${a})`;

// tileable value-noise fbm in [0,1]
function fbm(w, h, cx0, cy0, oct, seed, gain = 0.5) {
  const r = rnd(seed), out = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const cx = cx0 << o, cy = cy0 << o, g = new Float32Array(cx * cy);
    for (let i = 0; i < g.length; i++) g[i] = r();
    for (let y = 0; y < h; y++) {
      const fy = y / h * cy, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty), y0 = (iy % cy) * cx, y1 = ((iy + 1) % cy) * cx;
      for (let x = 0; x < w; x++) {
        const fx = x / w * cx, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx), x0 = ix % cx, x1 = (ix + 1) % cx;
        const a = g[y0 + x0], b = g[y0 + x1], c = g[y1 + x0], d = g[y1 + x1], top = a + (b - a) * sx;
        out[y * w + x] += amp * (top + (c + (d - c) * sx - top) * sy);
      }
    }
    tot += amp; amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function paint(w, h, fn) {
  const c = cv(w, h), ctx = c.getContext('2d'), im = ctx.createImageData(w, h), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, o = i * 4, col = fn(x, y, i); d[o] = cl(col[0]) * 255; d[o + 1] = cl(col[1]) * 255; d[o + 2] = cl(col[2]) * 255; d[o + 3] = 255; }
  ctx.putImageData(im, 0, 0); return c;
}
function lum(c) {
  const { width: w, height: h } = c, d = c.getContext('2d').getImageData(0, 0, w, h).data, H = new Float32Array(w * h);
  for (let i = 0; i < H.length; i++) H[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.55 + d[i * 4 + 2] * 0.15) / 255 * (d[i * 4 + 3] / 255);
  return H;
}
function normalFrom(H, w, h, s) {
  return paint(w, h, (x, y) => {
    const l = H[y * w + (x + w - 1) % w], r = H[y * w + (x + 1) % w], u = H[((y + h - 1) % h) * w + x], d = H[((y + 1) % h) * w + x];
    const nx = (l - r) * s, ny = (d - u) * s, L = Math.hypot(nx, ny, 1);
    return [nx / L * 0.5 + 0.5, ny / L * 0.5 + 0.5, 1 / L * 0.5 + 0.5];
  });
}
// draw a primitive at (x,y) and at wrapped copies when near an edge, so tiling stays seamless
function wrapDraw(w, h, x, y, m, fn) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
    const X = x + dx, Y = y + dy;
    if (X > -m && X < w + m && Y > -m && Y < h + m) fn(X, Y);
  }
}
function tex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (o.rep) t.repeat.set(o.rep[0], o.rep[1]);
  return t;
}
const CLONES = [];
export function rep(t, x, y) { const c = t.clone(); c.repeat.set(x, y); if (!t.image) c.version = 0; CLONES.push(c); return c; } // clone() flags an upload; hold it until the image arrives

/* ---------- surfaces ---------- */
function ground() {
  const w = 512, Hn = fbm(w, w, 6, 6, 5, 11), P = fbm(w, w, 3, 3, 3, 12), F = fbm(w, w, 40, 40, 2, 13);
  const c = paint(w, w, (x, y, i) => {
    const p = ss(0.48, 0.7, P[i]), l = 0.74 + 0.3 * (Hn[i] - 0.5) + 0.12 * (F[i] - 0.5);
    return [l * (1.02 + 0.14 * p), l * (1.0 - 0.02 * p), l * (0.84 - 0.08 * p)];
  });
  const ctx = c.getContext('2d'), r = rnd(14);
  for (let k = 0; k < 11000; k++) {
    const x = r() * w, y = r() * w, L = 2 + r() * 7, a = -Math.PI / 2 + (r() - 0.5) * 1.4, v = 0.6 + r() * 0.55;
    ctx.strokeStyle = rgb([v * 0.9, v, v * 0.68], 0.3 + r() * 0.4); ctx.lineWidth = 0.6 + r() * 0.9;
    wrapDraw(w, w, x, y, 10, (X, Y) => { ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); ctx.stroke(); });
  }
  for (let k = 0; k < 1600; k++) {
    const x = r() * w, y = r() * w, s = 0.6 + r() * 1.8, v = r() < 0.55 ? 0.38 : 1.08;
    ctx.fillStyle = rgb([v * 0.8, v * 0.72, v * 0.6], 0.5);
    wrapDraw(w, w, x, y, 4, (X, Y) => { ctx.beginPath(); ctx.arc(X, Y, s, 0, 7); ctx.fill(); });
  }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3.2), { data: true }) };
}
function soil() {
  const w = 256, A = fbm(w, w, 8, 8, 5, 51), B = fbm(w, w, 24, 24, 2, 52);
  const c = paint(w, w, (x, y, i) => { const l = 0.8 + 0.28 * (A[i] - 0.5) + 0.1 * (B[i] - 0.5); return [l, l * 0.98, l * 0.95]; });
  const ctx = c.getContext('2d'), r = rnd(53);
  for (let k = 0; k < 700; k++) {
    const x = r() * w, y = r() * w, s = 0.8 + r() * 3.2, v = r() < 0.5 ? 0.55 : 1.15;
    ctx.fillStyle = rgb([v * 0.85, v * 0.8, v * 0.75], 0.55);
    wrapDraw(w, w, x, y, 5, (X, Y) => { ctx.beginPath(); ctx.ellipse(X, Y, s, s * (0.6 + r() * 0.4), r() * 3, 0, 7); ctx.fill(); });
  }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 4), { data: true }) };
}
function barkRubber() {
  const w = 256, h = 512, S = fbm(w, h, 28, 3, 4, 21), M = fbm(w, h, 4, 8, 4, 22), N = fbm(w, h, 32, 64, 2, 23);
  const base = [0.42, 0.31, 0.23], lichen = [0.56, 0.54, 0.47], dark = [0.27, 0.2, 0.15];
  const c = paint(w, h, (x, y, i) => {
    const l = 0.92 + 0.36 * (S[i] - 0.5) + 0.16 * (N[i] - 0.5);
    let col = mix(base, lichen, ss(0.6, 0.72, M[i]) * 0.5);
    col = mix(col, dark, ss(0.36, 0.24, M[i]) * 0.6);
    return [col[0] * l, col[1] * l, col[2] * l];
  });
  const ctx = c.getContext('2d'), r = rnd(24);
  for (let k = 0; k < 380; k++) {
    const x = r() * w, y = r() * h, L = 2 + r() * 6, t = 0.8 + r() * 1.1;
    wrapDraw(w, h, x, y, 12, (X, Y) => { ctx.fillStyle = 'rgba(40,28,18,0.28)'; ctx.fillRect(X, Y + t * 0.6, L, t * 0.7); ctx.fillStyle = 'rgba(165,145,118,0.32)'; ctx.fillRect(X, Y, L, t); });
  }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, h, 2.6), { data: true }) };
}
function barkTapped() {
  const w = 256, N = fbm(w, w, 8, 8, 4, 25);
  const c = paint(w, w, (x, y, i) => { const l = 0.95 + 0.2 * (N[i] - 0.5); return [0.8 * l, 0.62 * l, 0.43 * l]; });
  const ctx = c.getContext('2d'), r = rnd(26);
  for (let k = -20; k < 60; k++) {
    const y0 = k * 7 + r() * 2;
    ctx.strokeStyle = `rgba(90,60,35,${0.25 + r() * 0.3})`; ctx.lineWidth = 1 + r() * 1.5;
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0 - w * 0.55); ctx.stroke();
  }
  for (let k = 0; k < 10; k++) { const x = r() * w; ctx.strokeStyle = 'rgba(245,240,225,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r() * w); ctx.lineTo(x + (r() - 0.5) * 6, w); ctx.stroke(); }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3), { data: true }) };
}
function palmTrunk() {
  const w = 256, A = fbm(w, w, 6, 6, 5, 31);
  const c = paint(w, w, (x, y, i) => { const l = 0.85 + 0.4 * (A[i] - 0.5); return [0.34 * l, 0.25 * l, 0.17 * l]; });
  const ctx = c.getContext('2d'), r = rnd(32);
  for (let k = 0; k < 2200; k++) {
    const x = r() * w, y = r() * w, L = 8 + r() * 26, a = (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.6) - Math.PI / 2, v = 0.3 + r() * 0.35;
    ctx.strokeStyle = rgb([v * 1.25, v, v * 0.72], 0.5 + r() * 0.4); ctx.lineWidth = 0.7 + r();
    wrapDraw(w, w, x, y, 30, (X, Y) => { ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); ctx.stroke(); });
  }
  for (let k = 0; k < 160; k++) { const x = r() * w, y = r() * w, s = 2 + r() * 6; ctx.fillStyle = 'rgba(14,9,6,0.55)'; wrapDraw(w, w, x, y, 8, (X, Y) => { ctx.beginPath(); ctx.ellipse(X, Y, s, s * 0.45, r() * 3, 0, 7); ctx.fill(); }); }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 4.5), { data: true }) };
}
function bananaStem() {
  const w = 256, h = 512, St = fbm(w, h, 48, 2, 3, 41), B = fbm(w, h, 6, 12, 4, 42), D = fbm(w, h, 4, 6, 3, 43);
  const g = [0.56, 0.62, 0.3], blot = [0.3, 0.17, 0.12], dry = [0.6, 0.48, 0.3];
  return { map: tex(paint(w, h, (x, y, i) => {
    const l = 0.9 + 0.3 * (St[i] - 0.5);
    let c = mix(g, blot, ss(0.64, 0.74, B[i]) * 0.85);
    c = mix(c, dry, ss(0.5, 0.95, y / h) * ss(0.42, 0.6, D[i]));
    return [c[0] * l, c[1] * l, c[2] * l];
  })) };
}
function papayaTrunk() {
  const w = 256, h = 512, A = fbm(w, h, 6, 12, 4, 44);
  const c = paint(w, h, (x, y, i) => { const l = 0.88 + 0.26 * (A[i] - 0.5); return [0.6 * l, 0.6 * l, 0.49 * l]; });
  const ctx = c.getContext('2d'), r = rnd(45);
  for (let row = 0; row < 26; row++) for (let k = 0; k < 4; k++) {
    const x = ((k + row * 0.38) % 4) / 4 * w + r() * 8, y = row * (h / 26) + r() * 4;
    wrapDraw(w, h, x, y, 20, (X, Y) => {
      const sw = 10 + ((X * 7 + Y * 3) % 7), sh = 3 + ((X + Y) % 3);
      ctx.fillStyle = 'rgba(178,176,150,0.4)'; ctx.beginPath(); ctx.ellipse(X, Y, sw, sh, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(72,70,54,0.32)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(X, Y, sw, sh, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    });
  }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, h, 3), { data: true }) };
}

/* ---------- leaves ---------- */
function bananaLeaf(dead) {
  const w = 1024, h = 256, c = cv(w, h), ctx = c.getContext('2d'), r = rnd(dead ? 62 : 61);
  const edge = dead ? [0.42, 0.3, 0.16] : [0.2, 0.4, 0.11], mid = dead ? [0.62, 0.49, 0.28] : [0.4, 0.62, 0.2];
  const gr = ctx.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, rgb(edge)); gr.addColorStop(0.5, rgb(mid)); gr.addColorStop(1, rgb(edge));
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 160; k++) { const v = r() < 0.5 ? 0 : 255; ctx.fillStyle = `rgba(${v},${v},${v * 0.7},0.05)`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 20 + r() * 90, 6 + r() * 26, 0, 0, 7); ctx.fill(); }
  for (let x0 = -60; x0 < w; x0 += 4 + r() * 3) {
    ctx.strokeStyle = r() < 0.5 ? 'rgba(255,255,210,0.09)' : 'rgba(0,30,0,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, h / 2); ctx.quadraticCurveTo(x0 + 14, h * 0.25, x0 + 40, 0); ctx.moveTo(x0, h / 2); ctx.quadraticCurveTo(x0 + 14, h * 0.75, x0 + 40, h); ctx.stroke();
  }
  const mr = ctx.createLinearGradient(0, h / 2 - 7, 0, h / 2 + 7);
  const mc = dead ? [0.7, 0.58, 0.38] : [0.72, 0.78, 0.45];
  mr.addColorStop(0, rgb(mc, 0)); mr.addColorStop(0.5, rgb(mc, 0.95)); mr.addColorStop(1, rgb(mc, 0));
  ctx.fillStyle = mr; ctx.fillRect(0, h / 2 - 7, w, 14);
  const brown = 'rgba(105,72,38,0.85)';
  for (let k = 0; k < 900; k++) {
    const x = r() * w, side = r() < 0.5, d = Math.pow(r(), 2.2) * (14 + (x / w) * 40);
    ctx.fillStyle = r() < 0.5 ? brown : 'rgba(150,115,60,0.7)';
    ctx.beginPath(); ctx.arc(x, side ? d : h - d, 2 + r() * 4, 0, 7); ctx.fill();
  }
  const tears = dead ? 26 : 14, cuts = [];
  for (let k = 0; k < tears; k++) {
    const x = 90 + r() * (w - 130), top = r() < 0.5, depth = (0.25 + r() * 0.7) * (h / 2 - 9), wd = 2 + r() * 5;
    const y0 = top ? 0 : h, y1 = top ? depth : h - depth, x1 = x - depth * 0.3;
    cuts.push([x, y0, x1, y1, wd]);
    ctx.fillStyle = brown; ctx.beginPath(); ctx.moveTo(x - wd - 3, y0); ctx.lineTo(x1, y1 + (top ? 2 : -2)); ctx.lineTo(x + wd + 3, y0); ctx.fill();
  }
  ctx.globalCompositeOperation = 'destination-out';
  for (const [x, y0, x1, y1, wd] of cuts) { ctx.beginPath(); ctx.moveTo(x - wd, y0); ctx.lineTo(x1, y1); ctx.lineTo(x + wd, y0); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  return tex(c, { clamp: true });
}
function papayaLeaf() {
  const w = 512, A = fbm(w, w, 6, 6, 4, 71);
  const c = paint(w, w, (x, y, i) => { const l = 0.85 + 0.3 * (A[i] - 0.5); return [0.27 * l, 0.47 * l, 0.15 * l]; });
  const ctx = c.getContext('2d'), r = rnd(72);
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI * 2, ex = 256 + Math.cos(a) * 250, ey = 256 - Math.sin(a) * 250;
    ctx.strokeStyle = 'rgba(175,205,120,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(256, 256); ctx.lineTo(ex, ey); ctx.stroke();
    for (let s = 0.15; s < 0.95; s += 0.1 + r() * 0.05) for (const sg of [-1, 1]) {
      const px = 256 + Math.cos(a) * 250 * s, py = 256 - Math.sin(a) * 250 * s, b = a + sg * (0.7 + r() * 0.3), L = 30 + r() * 50 * (1 - s);
      ctx.strokeStyle = 'rgba(160,195,105,0.45)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(b) * L, py - Math.sin(b) * L); ctx.stroke();
    }
  }
  return tex(c, { clamp: true });
}
function palmLeaflet(old) {
  const w = 256, h = 32, c = cv(w, h), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, w, 0);
  const cs = old ? [[0.26, 0.26, 0.11], [0.4, 0.38, 0.17], [0.38, 0.29, 0.14]] : [[0.16, 0.3, 0.1], [0.27, 0.47, 0.16], [0.32, 0.47, 0.17]];
  g.addColorStop(0, rgb(cs[0])); g.addColorStop(0.45, rgb(cs[1])); g.addColorStop(1, rgb(cs[2]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const s = ctx.createLinearGradient(0, 0, 0, h); s.addColorStop(0, 'rgba(0,0,0,0.25)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = s; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = old ? 'rgba(220,200,120,0.6)' : 'rgba(190,210,120,0.55)'; ctx.fillRect(0, h / 2 - 1, w, 2);
  return tex(c, { clamp: true });
}
// oil-palm frond strip: rachis along v=0.5, two ranks of narrow lanceolate leaflets slanting toward the tip (+u)
function palmFrond(old) {
  const w = 1024, h = 256, c = cv(w, h), ctx = c.getContext('2d'), r = rnd(old ? 112 : 111);
  const base = old ? [0.4, 0.37, 0.16] : [0.16, 0.31, 0.1];
  for (const dir of [-1, 1]) for (let x = -70; x < w; x += 13 + r() * 5) {
    const len = 110 + r() * 16, slant = 44 + r() * 28, wd = 3 + r() * 2.2, x0 = x + (dir > 0 ? 7 : 0), y0 = h / 2, x1 = x0 + slant, y1 = y0 + dir * len;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), px = -dy / L, py = dx / L, mx = x0 + dx * 0.42, my = y0 + dy * 0.42, bend = (r() - 0.2) * 12;
    const l = 0.78 + r() * 0.5;
    let col = base.map(v => v * l);
    if (old && r() < 0.45) col = [0.5 * l, 0.38 * l, 0.18 * l];
    ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx + px * wd * 2 + bend, my + py * wd * 2, x1 + bend, y1); ctx.quadraticCurveTo(mx - px * wd * 2 + bend, my - py * wd * 2, x0, y0); ctx.fill();
    ctx.fillStyle = rgb(col.map(v => v * 1.32)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx + px * wd * 2 + bend, my + py * wd * 2, x1 + bend, y1); ctx.quadraticCurveTo(mx + bend * 0.5, my, x0, y0); ctx.fill();
    ctx.strokeStyle = 'rgba(205,215,140,0.42)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx + bend * 0.5, my, x1 + bend, y1); ctx.stroke();
    if (r() < 0.2) { ctx.fillStyle = 'rgba(120,92,48,0.85)'; ctx.beginPath(); ctx.arc(x1 + bend, y1 - dir * 4, 2.5, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = old ? 'rgba(150,135,70,1)' : 'rgba(110,120,55,1)'; ctx.fillRect(0, h / 2 - 3, w, 6);
  return tex(c, { clamp: true });
}
function stalkFiber() {
  const w = 256, S = fbm(w, w, 40, 2, 3, 121), N = fbm(w, w, 6, 6, 3, 122);
  const c = paint(w, w, (x, y, i) => { const l = 0.82 + 0.34 * (S[i] - 0.5) + 0.16 * (N[i] - 0.5); return [l, l * 0.93, l * 0.8]; });
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3.5), { data: true }) };
}
function stalkCut() {
  const w = 256, N = fbm(w, w, 8, 8, 3, 123);
  const c = paint(w, w, (x, y, i) => { const l = 0.9 + 0.12 * (N[i] - 0.5); return [l, l * 0.92, l * 0.74]; });
  const ctx = c.getContext('2d'), r = rnd(124);
  for (let k = 0; k < 1100; k++) { ctx.fillStyle = `rgba(140,105,60,${0.35 + r() * 0.35})`; ctx.beginPath(); ctx.arc(r() * w, r() * w, 0.8 + r() * 1.4, 0, 7); ctx.fill(); }
  return tex(c);
}
function leafCard(seed, hue) {
  const w = 512, c = cv(w, w), ctx = c.getContext('2d'), r = rnd(seed);
  ctx.strokeStyle = 'rgba(70,52,34,0.9)'; ctx.lineWidth = 3;
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(256, 256); ctx.quadraticCurveTo(256 + (r() - 0.5) * 200, 256 + (r() - 0.5) * 200, 120 + r() * 272, 120 + r() * 272); ctx.stroke(); }
  for (let k = 0; k < 30; k++) {
    const cx = 120 + r() * 272, cy = 120 + r() * 272, ang = r() * Math.PI * 2, L0 = 62 + r() * 46;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(80,90,40,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    for (const da of [-0.62, 0, 0.62]) {
      const L = da ? L0 * 0.85 : L0, W = L * 0.3, l = 0.16 + r() * 0.16, hh = hue + (r() - 0.5) * 0.06;
      ctx.save(); ctx.rotate(da);
      const col = [l * (0.75 + hh), l * 1.55, l * 0.55];
      ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(W, L * 0.45, 0, L); ctx.quadraticCurveTo(-W, L * 0.45, 0, 0); ctx.fill();
      ctx.fillStyle = rgb(col.map(v => v * 1.35)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(W, L * 0.45, 0, L); ctx.lineTo(0, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(200,215,150,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L * 0.95); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  return tex(c, { clamp: true });
}
function grassTuft() {
  const w = 256, c = cv(w, w), ctx = c.getContext('2d'), r = rnd(81);
  for (let k = 0; k < 52; k++) {
    const bx = 128 + (r() - 0.5) * 70, tx = bx + (r() - 0.5) * 170, ty = w - (90 + r() * 160), bw = 3 + r() * 4;
    const cx = (bx + tx) / 2 + (r() - 0.5) * 30, cy = (w + ty) / 2;
    const g = ctx.createLinearGradient(0, w, 0, ty), v = 0.75 + r() * 0.35;
    g.addColorStop(0, rgb([0.42 * v, 0.46 * v, 0.3 * v])); g.addColorStop(1, rgb([1.0 * v, 1.0 * v, 0.72 * v]));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - bw / 2, w); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.quadraticCurveTo(cx + bw * 0.4, cy, bx + bw / 2, w); ctx.fill();
  }
  return tex(c, { clamp: true });
}

/* ---------- fruit & flesh detail (neutral, tinted by material colour) ---------- */
function bananaSkin() {
  const w = 128, h = 256, N = fbm(w, h, 4, 8, 3, 91);
  const c = paint(w, h, (x, y, i) => {
    const u = x / w, v = 1 - y / h, ridge = Math.pow(Math.abs(Math.cos(u * Math.PI * 5)), 6);
    let l = 0.92 + 0.08 * (N[i] - 0.5) - 0.07 * ridge;
    const tip = Math.max(ss(0.06, 0.0, v), ss(0.94, 1, v)); l *= 1 - 0.7 * tip;
    return [l, l * 0.98, l * 0.93];
  });
  const ctx = c.getContext('2d'), r = rnd(92);
  for (let k = 0; k < 70; k++) { ctx.fillStyle = `rgba(70,45,20,${0.25 + r() * 0.35})`; ctx.beginPath(); ctx.arc(r() * w, 20 + r() * (h - 40), 0.6 + r() * 1.6, 0, 7); ctx.fill(); }
  return tex(c);
}
function papayaSkin() {
  const w = 256, N = fbm(w, w, 6, 6, 4, 93), S = fbm(w, w, 10, 2, 3, 94);
  const c = paint(w, w, (x, y, i) => {
    const l = 0.93 + 0.12 * (N[i] - 0.5), g = ss(0.55, 0.8, S[i]) * 0.35;
    return [l * (1 - g * 0.55), l, l * (1 - g * 0.2)];
  });
  const ctx = c.getContext('2d'), r = rnd(95);
  for (let k = 0; k < 500; k++) { ctx.fillStyle = 'rgba(255,250,220,0.35)'; ctx.beginPath(); ctx.arc(r() * w, r() * w, 0.5 + r() * 0.9, 0, 7); ctx.fill(); }
  return tex(c);
}
function grain() {
  const w = 256, A = fbm(w, w, 32, 4, 3, 96), B = fbm(w, w, 8, 8, 3, 97);
  return tex(paint(w, w, (x, y, i) => { const l = 0.9 + 0.1 * (A[i] - 0.5) + 0.08 * (B[i] - 0.5); return [l, l, l]; }));
}

/* ---------- palm fruit anatomy ---------- */
function fruitSkin() {
  const w = 256, A = fbm(w, w, 6, 6, 4, 131), B = fbm(w, w, 20, 5, 2, 132);
  const c = paint(w, w, (x, y, i) => { const l = 0.9 + 0.16 * (A[i] - 0.5) + 0.08 * (B[i] - 0.5); return [l, l * 0.98, l * 0.96]; });
  const ctx = c.getContext('2d'), r = rnd(133);
  for (let k = 0; k < 900; k++) { const lite = r() < 0.6, x = r() * w, y = r() * w, s = 0.4 + r() * 1.1; ctx.fillStyle = lite ? 'rgba(255,236,205,0.22)' : 'rgba(40,10,5,0.2)'; wrapDraw(w, w, x, y, 3, (X, Y) => { ctx.beginPath(); ctx.arc(X, Y, s, 0, 7); ctx.fill(); }); }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 1.6), { data: true }) };
}
// longitudinal cut through the mesocarp: u = radius (0 axis → 1 skin), v = length. Fibres run base→apex.
function mesoFace() {
  const w = 512, h = 512, N = fbm(w, h, 72, 3, 3, 141), M2 = fbm(w, h, 6, 6, 3, 142);
  const yel = [0.99, 0.72, 0.26], org = [0.95, 0.45, 0.1], red = [0.72, 0.2, 0.06];
  const c = paint(w, h, (x, y, i) => {
    const u = x / w + (M2[i] - 0.5) * 0.1;
    let col = mix(yel, org, ss(0.42, 0.8, u)); col = mix(col, red, ss(0.88, 1.0, u) * 0.75);
    const l = 0.9 + 0.2 * (N[i] - 0.5);
    return [col[0] * l, col[1] * l, col[2] * l];
  });
  const ctx = c.getContext('2d'), r = rnd(143);
  for (let k = 0; k < 900; k++) {
    let x = r() * w; const lite = r() < 0.5;
    ctx.strokeStyle = lite ? `rgba(255,222,150,${0.16 + r() * 0.2})` : `rgba(140,55,10,${0.12 + r() * 0.18})`; ctx.lineWidth = 0.6 + r() * 1.1;
    ctx.beginPath(); ctx.moveTo(x, -8); for (let y = 0; y <= h + 16; y += 14) { x += (r() - 0.5) * 2.6; ctx.lineTo(x, y); } ctx.stroke();
  }
  for (let k = 0; k < 420; k++) { ctx.fillStyle = 'rgba(255,236,180,0.4)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 0.8 + r() * 1.2, 2 + r() * 4, 0, 0, 7); ctx.fill(); }
  return { map: tex(c, { clamp: true }), normal: tex(normalFrom(lum(c), w, h, 2.4), { data: true, clamp: true }) };
}
function fibre() {
  const w = 256, N = fbm(w, w, 48, 3, 3, 181), B = fbm(w, w, 6, 6, 3, 182);
  const c = paint(w, w, (x, y, i) => { const l = 0.8 + 0.38 * (N[i] - 0.5) + 0.12 * (B[i] - 0.5); return [l, l, l * 0.97]; });
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3), { data: true }) };
}
// endocarp outside: near-black shell with mesocarp fibres still clinging to it
function shellOuter() {
  const w = 256, h = 512, N = fbm(w, h, 40, 4, 3, 151), B = fbm(w, h, 6, 10, 3, 152);
  const c = paint(w, h, (x, y, i) => { const l = 0.78 + 0.4 * (N[i] - 0.5) + 0.18 * (B[i] - 0.5); return [0.2 * l, 0.13 * l, 0.085 * l]; });
  const ctx = c.getContext('2d'), r = rnd(153);
  for (let k = 0; k < 650; k++) {
    let x = r() * w, y = r() * h; const L = 30 + r() * 120;
    ctx.strokeStyle = `rgba(${150 + r() * 60 | 0},${95 + r() * 40 | 0},${45 + r() * 20 | 0},${0.12 + r() * 0.3})`; ctx.lineWidth = 0.5 + r() * 0.9;
    ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < L; s += 10) { x += (r() - 0.5) * 3; y += 10; ctx.lineTo(x, y); } ctx.stroke();
  }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, h, 3), { data: true }) };
}
// kernel seed coat: brown with a dark reticulate network
function testa() {
  const w = 256, r = rnd(161), pts = Array.from({ length: 70 }, () => [r() * w, r() * w]), N = fbm(w, w, 8, 8, 3, 162);
  const base = [0.46, 0.3, 0.18], dark = [0.16, 0.09, 0.05];
  const c = paint(w, w, (x, y, i) => {
    let d1 = 1e9, d2 = 1e9;
    for (const [px, py] of pts) { let dx = Math.abs(x - px), dy = Math.abs(y - py); dx = Math.min(dx, w - dx); dy = Math.min(dy, w - dy); const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = Math.sqrt(d2) - Math.sqrt(d1), line = 1 - ss(0.8, 3.4, e), l = 0.88 + 0.24 * (N[i] - 0.5), col = mix(base, dark, line * 0.85);
    return [col[0] * l, col[1] * l, col[2] * l];
  });
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3), { data: true }) };
}
function endo() { const w = 256, N = fbm(w, w, 10, 10, 4, 171), G = fbm(w, w, 40, 40, 2, 172); return tex(paint(w, w, (x, y, i) => { const l = 0.95 + 0.07 * (N[i] - 0.5) + 0.04 * (G[i] - 0.5); return [l, l * 0.985, l * 0.95]; })); }

/* ---------- plantation floor ---------- */
// fallen rubber leaves; each leaf's alpha doubles as its reveal threshold, so lowering alphaTest makes litter accumulate
function litter() {
  const w = 512, c = cv(w, w), ctx = c.getContext('2d'), r = rnd(191);
  const cols = [[0.55, 0.36, 0.18], [0.62, 0.42, 0.2], [0.45, 0.28, 0.14], [0.72, 0.52, 0.24], [0.38, 0.24, 0.12], [0.6, 0.5, 0.3], [0.5, 0.46, 0.26]];
  for (let k = 0; k < 560; k++) {
    const x = 24 + r() * (w - 48), y = 24 + r() * (w - 48), L = 14 + r() * 16, W = L * (0.3 + r() * 0.12), l = 0.8 + r() * 0.4, al = 0.42 + r() * 0.58, col = cols[(r() * cols.length) | 0].map(v => v * l);
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI * 2);
    ctx.fillStyle = rgb(col, al); ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -W, L / 2, 0); ctx.quadraticCurveTo(0, W, -L / 2, 0); ctx.fill();
    ctx.strokeStyle = rgb(col.map(v => v * 0.7), al); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-L / 2 - 3, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
    ctx.restore();
  }
  return tex(c, { clamp: true });
}
// bare weeded circle around a palm: alpha falls off radially (ragged), so lowering alphaTest grows it outward
function weedCircle() {
  const w = 256, N = fbm(w, w, 8, 8, 4, 195), F = fbm(w, w, 24, 24, 2, 196), c = cv(w, w), ctx = c.getContext('2d'), im = ctx.createImageData(w, w), d = im.data;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, o = i * 4, dx = (x + 0.5) / w * 2 - 1, dy = (y + 0.5) / w * 2 - 1, e = Math.hypot(dx, dy) + (N[i] - 0.5) * 0.3, l = 0.78 + 0.34 * (F[i] - 0.5);
    d[o] = cl(0.52 * l) * 255; d[o + 1] = cl(0.35 * l) * 255; d[o + 2] = cl(0.22 * l) * 255; d[o + 3] = cl((0.98 - e) * 1.3) * 255;
  }
  ctx.putImageData(im, 0, 0);
  const r = rnd(197);
  for (let k = 0; k < 26; k++) { const a = r() * 6.283, rr = r() * w * 0.3; ctx.fillStyle = r() < 0.6 ? 'rgba(196,72,28,1)' : 'rgba(90,22,14,1)'; ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(a) * rr, w / 2 + Math.sin(a) * rr, 2.6, 3.4, r() * 3, 0, 7); ctx.fill(); }
  return tex(c, { clamp: true });
}

/* ---------- rubber trunk anatomy ---------- */
const RINGS = (() => { const r = rnd(201), a = []; let x = 0.07; while (x < 0.97) { a.push(x); x += 0.05 + r() * 0.055; } return a; })();
const VESS = [0.07, 0.15, 0.24, 0.34, 0.46, 0.6];
// long-grain cut through the wood: u = radius (pith 0 → cambium 1), v = length
function woodLong() {
  const w = 256, h = 512, F = fbm(w, h, 64, 2, 3, 202), B = fbm(w, h, 4, 8, 3, 203);
  const c = paint(w, h, (x, y, i) => {
    const u = x / w; let ring = 0; for (const q of RINGS) { const d = (u - q) * w; ring = Math.max(ring, Math.exp(-d * d / 5)); }
    const l = 0.93 + 0.12 * (F[i] - 0.5) + 0.06 * (B[i] - 0.5) - 0.24 * ring - 0.3 * ss(0.03, 0, u) - 0.06 * ss(0.5, 0, u);
    return [0.93 * l, 0.83 * l * (1 - 0.04 * ring), 0.66 * l * (1 - 0.1 * ring)];
  });
  const ctx = c.getContext('2d'), r = rnd(206);
  for (let k = 0; k < 260; k++) { const x = r() * w, y = r() * h; ctx.strokeStyle = 'rgba(255,246,222,0.4)'; ctx.lineWidth = 1 + r(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3 + r() * 9, y + (r() - 0.5) * 2); ctx.stroke(); }
  return { map: tex(c, { clamp: true }), normal: tex(normalFrom(lum(c), w, h, 1.6), { data: true, clamp: true }) };
}
// end grain: u = angle, v = radius (0 at the bark side → 1 at the pith)
function woodEnd() {
  const w = 512, h = 256, F = fbm(w, h, 8, 6, 3, 204), N = fbm(w, h, 24, 24, 2, 205);
  const c = paint(w, h, (x, y, i) => {
    const rr = 1 - y / h + (F[i] - 0.5) * 0.025; let ring = 0; for (const q of RINGS) { const d = (rr - q) * h; ring = Math.max(ring, Math.exp(-d * d / 4)); }
    const l = 0.9 + 0.1 * (N[i] - 0.5) - 0.26 * ring - 0.35 * ss(0.05, 0, rr) - 0.06 * ss(0.5, 0, rr);
    return [0.9 * l, 0.79 * l * (1 - 0.04 * ring), 0.61 * l * (1 - 0.1 * ring)];
  });
  const ctx = c.getContext('2d'), r = rnd(207);
  for (let k = 0; k < 110; k++) { const x = r() * w; ctx.strokeStyle = 'rgba(255,246,222,0.22)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, h * r() * 0.3); ctx.lineTo(x + (r() - 0.5) * 2, h * (0.7 + r() * 0.3)); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { const x = r() * w; ctx.strokeStyle = 'rgba(70,48,28,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + (r() - 0.5) * 6, h * (0.35 + r() * 0.3)); ctx.stroke(); }
  return { map: tex(c, { clamp: true }), normal: tex(normalFrom(lum(c), w, h, 2), { data: true, clamp: true }) };
}
// soft (inner) bark, long section: u = 0 at the cambium → 1 at the outer bark; latex vessel rows run lengthwise
function softLong() {
  const w = 128, h = 512, F = fbm(w, h, 24, 3, 3, 211), c = paint(w, h, (x, y, i) => { const l = 0.9 + 0.16 * (F[i] - 0.5), col = mix([0.88, 0.72, 0.54], [0.6, 0.4, 0.26], ss(0.25, 1, x / w)); return [col[0] * l, col[1] * l, col[2] * l]; });
  const ctx = c.getContext('2d'), r = rnd(212);
  VESS.forEach((v, k) => { ctx.strokeStyle = 'rgba(250,247,238,0.88)'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let y = 0; y <= h; y += 8) { const x = v * w + Math.sin(y * 0.045 + k * 1.7) * 1.4; y ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); });
  for (let k = 0; k < 180; k++) { ctx.fillStyle = 'rgba(70,45,28,0.5)'; ctx.beginPath(); ctx.arc(w * (0.62 + r() * 0.36), r() * h, 0.7 + r() * 0.9, 0, 7); ctx.fill(); }
  return { map: tex(c, { clamp: true }), normal: tex(normalFrom(lum(c), w, h, 2), { data: true, clamp: true }) };
}
// soft bark end: u = angle, v = 0 at the outer bark → 1 at the cambium; vessel rows show as dotted rings
function softEnd() {
  const w = 512, h = 128, F = fbm(w, h, 24, 6, 3, 213), c = paint(w, h, (x, y, i) => { const s = 1 - y / h, l = 0.9 + 0.16 * (F[i] - 0.5), col = mix([0.88, 0.72, 0.54], [0.6, 0.4, 0.26], ss(0.25, 1, s)); return [col[0] * l, col[1] * l, col[2] * l]; });
  const ctx = c.getContext('2d'), r = rnd(214);
  VESS.forEach(v => { const y = (1 - v) * h; for (let x = 0; x < w; x += 3 + r() * 3) { ctx.fillStyle = `rgba(250,247,238,${0.6 + r() * 0.35})`; ctx.beginPath(); ctx.arc(x, y + (r() - 0.5) * 1.5, 0.9 + r() * 0.6, 0, 7); ctx.fill(); } });
  return tex(c, { clamp: true });
}
function barkSection() {
  const w = 256, A = fbm(w, w, 10, 10, 4, 215), B = fbm(w, w, 40, 6, 2, 216);
  const c = paint(w, w, (x, y, i) => { const l = 0.85 + 0.35 * (A[i] - 0.5) + 0.12 * (B[i] - 0.5); return [0.4 * l, 0.27 * l, 0.17 * l]; });
  const ctx = c.getContext('2d'), r = rnd(217);
  for (let k = 0; k < 500; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(170,130,90,0.5)' : 'rgba(30,18,10,0.45)'; ctx.beginPath(); ctx.arc(r() * w, r() * w, 0.6 + r() * 1.3, 0, 7); ctx.fill(); }
  return { map: tex(c), normal: tex(normalFrom(lum(c), w, w, 3), { data: true }) };
}

let cache = null, gen = null;
function generate() {
  if (gen) return gen;
  gen = {
    ground: ground(), soil: soil(), barkRubber: barkRubber(), barkTapped: barkTapped(), palmTrunk: palmTrunk(),
    bananaStem: bananaStem(), papayaTrunk: papayaTrunk(),
    bananaLeaf: bananaLeaf(false), bananaDead: bananaLeaf(true), papayaLeaf: papayaLeaf(),
    palmFrond: palmFrond(false), palmFrondOld: palmFrond(true), stalkFiber: stalkFiber(), stalkCut: stalkCut(),
    rubberCard: leafCard(101, 0.0), wildCard: leafCard(102, 0.12), grass: grassTuft(),
    bananaSkin: bananaSkin(), papayaSkin: papayaSkin(), grain: grain(),
    woodLong: woodLong(), woodEnd: woodEnd(), softLong: softLong(), softEnd: softEnd(), barkSection: barkSection(),
    litter: litter(), weedCircle: weedCircle(), fruitSkin: fruitSkin(), mesoFace: mesoFace(), fibre: fibre(), shellOuter: shellOuter(), testa: testa(), endo: endo(),
  };
  return gen;
}

/* ---------- baked copies of the textures above (generated once, saved as images) ---------- */
const BAKED = {"ground.map":["ground_map.jpg",0,0],"ground.normal":["ground_normal.jpg",0,1],"soil.map":["soil_map.jpg",0,0],"soil.normal":["soil_normal.jpg",0,1],"barkRubber.map":["barkRubber_map.jpg",0,0],"barkRubber.normal":["barkRubber_normal.jpg",0,1],"barkTapped.map":["barkTapped_map.jpg",0,0],"barkTapped.normal":["barkTapped_normal.jpg",0,1],"palmTrunk.map":["palmTrunk_map.jpg",0,0],"palmTrunk.normal":["palmTrunk_normal.jpg",0,1],"bananaStem.map":["bananaStem_map.jpg",0,0],"papayaTrunk.map":["papayaTrunk_map.jpg",0,0],"papayaTrunk.normal":["papayaTrunk_normal.jpg",0,1],"bananaLeaf":["bananaLeaf.png",1,0],"bananaDead":["bananaDead.png",1,0],"papayaLeaf":["papayaLeaf.jpg",1,0],"palmFrond":["palmFrond.png",1,0],"palmFrondOld":["palmFrondOld.png",1,0],"stalkFiber.map":["stalkFiber_map.jpg",0,0],"stalkFiber.normal":["stalkFiber_normal.jpg",0,1],"stalkCut":["stalkCut.jpg",0,0],"rubberCard":["rubberCard.png",1,0],"wildCard":["wildCard.png",1,0],"grass":["grass.png",1,0],"bananaSkin":["bananaSkin.jpg",0,0],"papayaSkin":["papayaSkin.jpg",0,0],"grain":["grain.jpg",0,0],"woodLong.map":["woodLong_map.jpg",1,0],"woodLong.normal":["woodLong_normal.jpg",1,1],"woodEnd.map":["woodEnd_map.jpg",1,0],"woodEnd.normal":["woodEnd_normal.jpg",1,1],"softLong.map":["softLong_map.jpg",1,0],"softLong.normal":["softLong_normal.jpg",1,1],"softEnd":["softEnd.jpg",1,0],"barkSection.map":["barkSection_map.jpg",0,0],"barkSection.normal":["barkSection_normal.jpg",0,1],"litter":["litter.png",1,0],"weedCircle":["weedCircle.png",1,0],"fruitSkin.map":["fruitSkin_map.jpg",0,0],"fruitSkin.normal":["fruitSkin_normal.jpg",0,1],"mesoFace.map":["mesoFace_map.jpg",1,0],"mesoFace.normal":["mesoFace_normal.jpg",1,1],"fibre.map":["fibre_map.jpg",0,0],"fibre.normal":["fibre_normal.jpg",0,1],"shellOuter.map":["shellOuter_map.jpg",0,0],"shellOuter.normal":["shellOuter_normal.jpg",0,1],"testa.map":["testa_map.jpg",0,0],"testa.normal":["testa_normal.jpg",0,1],"endo":["endo.jpg",0,0]};
let ready = null;
function loadBaked() {
  const root = {}, waits = [];
  for (const [path, [file, clamp, data]] of Object.entries(BAKED)) {
    const t = new THREE.Texture(), keys = path.split('.');
    t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8;
    let o = root; for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] || (o[keys[i]] = {});
    o[keys[keys.length - 1]] = t;
    const use = img => {
      t.image = img; t.needsUpdate = true; for (const c of CLONES) if (c.source === t.source) c.needsUpdate = true;
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('ting-tex'));
    };
    const fallback = () => { let g = generate(); for (const k of keys) g = g[k]; use(g.image); };
    // resolve on the load event: decode() never settles in a hidden tab or iframe
    const im = new Image();
    waits.push(new Promise(res => { im.onload = () => { use(im); res(); }; im.onerror = () => { fallback(); res(); }; }));
    im.src = TEX_BASE + file;
  }
  ready = Promise.all(waits);
  return root;
}
export function getTextures() {
  if (cache) return cache;
  if (typeof Image === 'undefined') { cache = generate(); ready = Promise.resolve(); } else cache = loadBaked();
  return cache;
}
export function texturesReady() { getTextures(); return ready; }
