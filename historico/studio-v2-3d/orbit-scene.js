// VOLTA / matéria em movimento — mundo contínuo.
// Um renderer por página. O host cobre o palco inteiro; um elemento [data-scene-anchor]
// no layout diz onde a escultura repousa, então a composição pertence ao CSS.
// Três camadas de profundidade: fragmentos distantes, a fita com suas órbitas de
// rastreio, e silhuetas próximas que cortam a borda do quadro.
import * as THREE from '/vendor/three.module.js';

const COLORS = { 'jose-isaias': '#d7c4a2', 'clara-prado': '#de8976', amanda: '#c78f99',
  'julia-alves': '#d6b76b', igor: '#63b6ad', guilherme: '#789ae3', 'jose-roberto': '#b6a0d4' };
// Família de formas dos fragmentos por pessoa: repertório gráfico, nunca métrica.
const FAMILIES = { 'jose-isaias': ['ico', 'octa', 'ico', 'can'], 'clara-prado': ['bar', 'tetra', 'bar', 'octa'],
  amanda: ['coin', 'octa', 'coin', 'tetra'], 'julia-alves': ['box', 'bar', 'box', 'can'],
  igor: ['frame', 'ball', 'frame', 'box'], guilherme: ['ball', 'tetra', 'octa', 'tetra'],
  'jose-roberto': ['box', 'octa', 'box', 'frame'] };
const INK = '#071f22', LIME = '#d8ed91', COPPER = '#c7a383', ICE = '#e3efeb', NEAR = '#10373a', FAR = '#1d4c49';
const FOV = 32, CAM_Z = 10, HALF = Math.tan(FOV * Math.PI / 360), RIBBON_R = 2.1;
const ARRIVAL = 4800, SHIFT = 1400, FRAME = 1000 / 24, BASE = [.42, -.5, -.22];
const RINGS = [[2.55, 1.6, 1.15, .2, .4], [3.0, 2.15, 1.32, -.35, 1.1], [3.5, 2.3, .95, .5, 2.0]];

let host, anchor, canvas, renderer, scene, camera, core, mid, ribbonMat, beads = [], layers = [], svg, ro, io, cleanup = [];
let attempted = false, paused = false, reduced = false, visible = true, raf = 0, persona = '', accent = COLORS.guilherme;
let start = 0, duration = ARRIVAL, first = true, last = -Infinity, pointerEnd = 0, scrollEnd = 0;
let px = 0, py = 0, tpx = 0, tpy = 0, scroll = 0, key = null, serial = 0, sized = '', quiet = false, rings = [];
const target = { x: 0, y: 0, s: 1 }, from = { x: 0, y: 0, s: 1 }, cur = { x: 0, y: 0, s: 1 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - t, 3);
const active = () => host && !paused && visible && !document.hidden;
function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function stop() { cancelAnimationFrame(raf); raf = 0; }
function detach() {
  stop(); ro?.disconnect(); io?.disconnect(); ro = io = null;
  cleanup.forEach(fn => fn()); cleanup = [];
  if (host) delete host.dataset.renderer;
}
function listen(node, name, fn) {
  node.addEventListener(name, fn, { passive: true });
  cleanup.push(() => node.removeEventListener(name, fn));
}
// Fita fechada com uma torção completa e contorno irregular de metal recuperado.
function point(t, side, depth = 0) {
  const radius = 1.5 + .14 * Math.cos(3 * t), width = .44 + .08 * Math.sin(2 * t);
  const radial = radius + side * width * Math.cos(t) - depth * Math.sin(t);
  return [radial * Math.cos(t), radial * Math.sin(t), .3 * Math.sin(2 * t) + side * width * Math.sin(t) + depth * Math.cos(t)];
}
function ribbon() {
  const n = 180, corners = [[-1, -.05], [1, -.05], [1, .05], [-1, .05]], positions = [], indices = [];
  const geometry = new THREE.BufferGeometry();
  for (let face = 0; face < 4; face++) { // vértices próprios por face: arestas nítidas na luz em faixas
    const base = positions.length / 3, a = corners[face], b = corners[(face + 1) % 4], offset = indices.length;
    for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; positions.push(...point(t, a[0], a[1]), ...point(t, b[0], b[1])); }
    for (let i = 0; i < n; i++) { const v = base + i * 2; indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    geometry.addGroup(offset, indices.length - offset, face % 2 ? 2 : face / 2);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function shape(kind, s) {
  switch (kind) {
    case 'ball': return new THREE.IcosahedronGeometry(s, 1);
    case 'octa': return new THREE.OctahedronGeometry(s, 0);
    case 'tetra': return new THREE.TetrahedronGeometry(s * 1.25, 0);
    case 'box': return new THREE.BoxGeometry(s * 1.35, s * 1.35, s * 1.35);
    case 'bar': return new THREE.BoxGeometry(s * 2.9, s * .5, s * .5);
    case 'coin': return new THREE.CylinderGeometry(s, s, s * .28, 12);
    case 'frame': return new THREE.TorusGeometry(s, s * .24, 4, 4);
    case 'can': return new THREE.CylinderGeometry(s * .62, s * .7, s * 1.7, 7);
    default: return new THREE.IcosahedronGeometry(s, 0);
  }
}
function disposeTree(root) {
  const geometries = new Set(), materials = new Set();
  root?.traverse(obj => {
    if (obj.geometry) geometries.add(obj.geometry);
    if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => { m.gradientMap?.dispose(); m.dispose(); });
}
function releaseGPU() {
  if (canvas) canvas.removeEventListener('webglcontextlost', lost);
  disposeTree(scene);
  if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
  renderer = scene = camera = core = mid = ribbonMat = null; beads = []; layers = []; rings = []; persona = ''; sized = '';
}
function lost(event) { event.preventDefault(); fallback(); }
let ramp;
function toon(color) { return new THREE.MeshToonMaterial({ color, gradientMap: ramp, side: THREE.DoubleSide }); }
function fragment(kind, size, material, edge) {
  const geometry = shape(kind, size), mesh = new THREE.Mesh(geometry, material);
  if (edge) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 20), edge));
  return mesh;
}
function buildMid() {
  if (mid) { core.remove(mid); disposeTree(mid); }
  mid = new THREE.Group(); mid.visible = !quiet; core.add(mid);
  const rand = random(7), family = FAMILIES[persona] || FAMILIES.guilherme;
  const tones = [toon(accent), toon(COPPER), toon(ICE), toon(accent), toon(LIME)];
  const edge = new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: .5 });
  for (let i = 0; i < 13; i++) {
    const t = i * 2.39996, radius = 2.5 + rand() * .75, mesh = fragment(family[i % family.length], .13 + rand() * .15, tones[i % tones.length], edge);
    mesh.position.set(Math.cos(t) * radius, Math.sin(t) * radius * .82, (rand() - .5) * 2.2);
    mesh.rotation.set(rand() * 6, rand() * 6, rand() * 6); mid.add(mesh);
  }
}
function initialize() {
  if (attempted) return;
  attempted = true; canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'volta-orbit-canvas';
  try {
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!context || context.isContextLost()) return;
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    renderer.setClearColor(INK, 0); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
    ramp = new THREE.DataTexture(new Uint8Array([96, 158, 214, 255]), 4, 1, THREE.RedFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(INK, 9, 24);
    camera = new THREE.PerspectiveCamera(FOV, 16 / 9, .1, 60); camera.position.set(0, 0, CAM_Z);
    scene.add(new THREE.HemisphereLight(ICE, '#0c3033', 1.05));
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.05); keyLight.position.set(-3, 5, 6); scene.add(keyLight);
    const rim = new THREE.DirectionalLight(LIME, 1.3); rim.position.set(4, -2, -5); scene.add(rim);
    core = new THREE.Group(); scene.add(core);
    ribbonMat = toon(accent);
    core.add(new THREE.Mesh(ribbon(), [toon(LIME), ribbonMat, toon(COPPER)]));
    const edge = new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: .6 });
    for (const side of [-1, 1]) for (const depth of [-.052, .052]) {
      const points = Array.from({ length: 181 }, (_, i) => new THREE.Vector3(...point(i / 180 * Math.PI * 2, side, depth)));
      core.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), edge));
    }
    // Órbitas de rastreio: linhas finas e uma conta que percorre cada uma.
    RINGS.forEach(([a, b, rx, ry, rz], i) => {
      const ring = new THREE.Group(); ring.rotation.set(rx, ry, rz);
      const points = Array.from({ length: 129 }, (_, j) => new THREE.Vector3(Math.cos(j / 128 * Math.PI * 2) * a, Math.sin(j / 128 * Math.PI * 2) * b, 0));
      ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: .46 - i * .12 })));
      const bead = new THREE.Mesh(new THREE.IcosahedronGeometry(.075 - i * .012, 1), new THREE.MeshBasicMaterial({ color: i === 1 ? COPPER : LIME }));
      ring.add(bead); rings.push(ring); beads.push({ bead, a, b, theta: 1.2 + i * 2.1, turns: (i % 2 ? -1 : 1) * (2.2 - i * .5) }); core.add(ring);
    });
    const rand = random(41), farMat = toon(FAR), nearMat = toon(NEAR);
    const nearEdge = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: .3 });
    const kinds = ['ico', 'tetra', 'can', 'octa', 'box'];
    for (let i = 0; i < 30; i++) {
      const mesh = fragment(kinds[i % 5], .07 + rand() * .13, farMat);
      mesh.rotation.set(rand() * 6, rand() * 6, rand() * 6); scene.add(mesh);
      layers.push({ mesh, ax: rand() * 2.2 - 1.1, ay: rand() * 2.2 - 1.1, z: -2.5 - rand() * 8, spin: rand() - .5 });
    }
    for (const [ax, ay, z, size, kind] of [[-1.03, -.72, 3.6, .5, 'ico'], [1.02, .86, 4.3, .46, 'can'], [-.62, 1.02, 2.4, .42, 'tetra'], [.5, -1.04, 4.6, .4, 'box'], [1.06, -.3, 2.2, .3, 'octa']]) {
      const mesh = fragment(kind, size, nearMat, nearEdge);
      mesh.rotation.set(rand() * 6, rand() * 6, rand() * 6); scene.add(mesh);
      layers.push({ mesh, ax, ay, z, spin: rand() - .5 });
    }
    canvas.addEventListener('webglcontextlost', lost);
  } catch { releaseGPU(); }
}
function setPersona(next) {
  accent = COLORS[next] || COLORS.guilherme;
  if (!renderer || next === persona) return;
  persona = next; ribbonMat.color.set(accent); buildMid();
}
// O anchor do layout define centro e tamanho da escultura em unidades de mundo.
function measure() {
  const bounds = host.getBoundingClientRect(), width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
  const box = anchor?.isConnected ? anchor.getBoundingClientRect() : null;
  const frame = box && box.width > 1 && box.height > 1 ? box : { left: bounds.left + width * .2, top: bounds.top + height * .15, width: width * .6, height: height * .7 };
  return { bounds, width, height, cx: frame.left + frame.width / 2 - bounds.left, cy: frame.top + frame.height / 2 - bounds.top, size: Math.min(frame.width, frame.height) };
}
function resize() {
  if (!host) return;
  const m = measure();
  if (renderer) {
    try {
      const ratio = Math.min(devicePixelRatio || 1, 1.5), stamp = `${Math.round(m.width)}x${Math.round(m.height)}@${ratio}`;
      if (stamp !== sized) { // setSize limpa o buffer: só quando a medida muda
        renderer.setPixelRatio(ratio); renderer.setSize(m.width, m.height, false); sized = stamp;
        camera.aspect = m.width / m.height; camera.updateProjectionMatrix();
      }
    } catch { fallback(); return; }
    const unit = 2 * HALF * CAM_Z / m.height;
    target.x = (m.cx - m.width / 2) * unit; target.y = -(m.cy - m.height / 2) * unit; target.s = m.size * unit / (2 * RIBBON_R);
    // Composição pequena (faixa de página, celular): só a fita, sem órbitas nem fragmentos sobre o texto.
    quiet = m.size < 300; if (mid) mid.visible = !quiet; for (const ring of rings) ring.visible = !quiet;
    const narrow = clamp(camera.aspect / 1.5, .38, 1);
    for (const item of layers) {
      if (item.z > 0) item.mesh.scale.setScalar(narrow);
      const halfH = HALF * (CAM_Z - item.z);
      item.mesh.position.set(item.ax * halfH * camera.aspect, item.ay * halfH, item.z);
    }
    draw(performance.now()); schedule(); // um quadro estático mesmo em pausa ou fora da tela
  } else if (svg) paintSVG(m);
}
function draw(now) {
  if (!renderer) return;
  const p = reduced ? 1 : ease(clamp((now - start) / duration, 0, 1)), rest = 1 - p;
  cur.x = lerp(from.x, target.x, p); cur.y = lerp(from.y, target.y, p); cur.s = lerp(from.s, target.s, p);
  core.position.set(cur.x, cur.y, 0); core.scale.setScalar(cur.s * (first ? .84 + .16 * p : 1));
  core.rotation.set(BASE[0] + py * .22 + rest * .3, BASE[1] + px * .34 + scroll * .9 - rest * (first ? 1.5 : .6), BASE[2] + rest * .2);
  if (mid) { mid.rotation.z = rest * 1.1 + scroll * .5; mid.scale.setScalar(1 + rest * (first ? .6 : .2)); }
  for (const item of beads) { const theta = item.theta + (p + scroll * .4) * item.turns; item.bead.position.set(Math.cos(theta) * item.a, Math.sin(theta) * item.b, 0); }
  for (const item of layers) item.mesh.rotation.y = item.spin * (rest * 2 + scroll * 1.5 + px);
  camera.position.set(-px * .7, py * .45 - scroll * 1.1, CAM_Z + rest * (first ? 1.8 : .5));
  try { renderer.render(scene, camera); } catch { fallback(); }
}
function settling() { return Math.abs(px - tpx) + Math.abs(py - tpy) > .003; }
function moving(now) { return !reduced && (now < start + duration || now < scrollEnd || (now < pointerEnd + 1400 && (now < pointerEnd || settling()))); }
function schedule() { if (!raf && renderer && active() && moving(performance.now())) raf = requestAnimationFrame(tick); }
function tick(now) {
  raf = 0; if (!active() || reduced) return;
  if (now >= pointerEnd) tpx = tpy = 0;
  if (!moving(now)) { px = py = 0; draw(now); return; } // quadro final de repouso
  if (now - last >= FRAME) { px += (tpx - px) * .2; py += (tpy - py) * .2; last = now; draw(now); }
  raf = requestAnimationFrame(tick);
}
function resume() {
  if (!active()) { stop(); return; }
  draw(performance.now()); schedule();
}
// Fallback vetorial original: mesma composição, estática, sem WebGL.
function paintSVG(m) {
  if (!svg) return;
  const [rx, ry, rz] = BASE, scale = m.size / (2 * RIBBON_R), W = m.width, H = m.height, id = svg.dataset.id;
  const rot = ([x, y, z], a = rx, b = ry, c = rz) => {
    let t = x * Math.cos(c) - y * Math.sin(c); y = x * Math.sin(c) + y * Math.cos(c); x = t; // ordem XYZ do Euler: z, y, x
    t = x * Math.cos(b) + z * Math.sin(b); z = -x * Math.sin(b) + z * Math.cos(b); x = t;
    t = y * Math.cos(a) - z * Math.sin(a); z = y * Math.sin(a) + z * Math.cos(a); y = t; return [x, y, z];
  };
  const xy = p => `${(m.cx + p[0] * scale).toFixed(1)},${(m.cy - p[1] * scale).toFixed(1)}`;
  const poly = (x, y, s, sides, turn, fill, extra = '') => `<polygon points="${Array.from({ length: sides }, (_, i) => { const t = turn + i / sides * Math.PI * 2, r = s * (i % 2 ? .78 : 1); return `${(x + Math.cos(t) * r).toFixed(1)},${(y + Math.sin(t) * r * .86).toFixed(1)}`; }).join(' ')}" fill="${fill}" ${extra}/>`;
  const rand = random(41); let out = `<defs><radialGradient id="${id}-haze"><stop stop-color="#2a6a63" stop-opacity=".45"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.size * .9}" ry="${m.size * .75}" fill="url(#${id}-haze)"/>`;
  for (let i = 0; i < 26; i++) out += poly(rand() * W, rand() * H, 4 + rand() * 9, 5 + i % 3, rand() * 6, FAR);
  const calm = m.size < 300;
  if (!calm) RINGS.forEach(([a, b, x, y, z], i) => {
    const points = Array.from({ length: 73 }, (_, j) => xy(rot(rot([Math.cos(j / 72 * Math.PI * 2) * a, Math.sin(j / 72 * Math.PI * 2) * b, 0], x, y, z))));
    out += `<polyline points="${points.join(' ')}" fill="none" stroke="${LIME}" stroke-opacity="${.5 - i * .12}" stroke-width="1"/><circle cx="${points[9 + i * 20].split(',')[0]}" cy="${points[9 + i * 20].split(',')[1]}" r="${4 - i}" fill="${i === 1 ? COPPER : LIME}"/>`;
  });
  const faces = [], n = 120, tones = [[LIME, '#b9d07c', '#8fa868'], [accent, COPPER, '#7d6a58']];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, next = (i + 1) / n * Math.PI * 2, pts = [point(t, -1), point(t, 1), point(next, 1), point(next, -1)].map(p => rot(p));
    const u = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]], v = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]];
    const nz = u[0] * v[1] - u[1] * v[0], ny = u[2] * v[0] - u[0] * v[2], len = Math.hypot(u[1] * v[2] - u[2] * v[1], ny, nz) || 1;
    const light = Math.abs(nz * .6 + ny * .5) / len, tone = tones[nz > 0 ? 1 : 0][light > .55 ? 0 : light > .28 ? 1 : 2];
    faces.push({ z: pts.reduce((sum, p) => sum + p[2], 0), shape: `<polygon points="${pts.map(xy).join(' ')}" fill="${tone}" stroke="${tone}" stroke-width=".6"/>` });
  }
  out += faces.sort((a, b) => a.z - b.z).map(f => f.shape).join('');
  out += [-1, 1].map(side => `<polyline points="${Array.from({ length: n + 1 }, (_, i) => xy(rot(point(i / n * Math.PI * 2, side)))).join(' ')}" fill="none" stroke="${ICE}" stroke-opacity=".6" stroke-width=".8"/>`).join('');
  const fr = random(7);
  for (let i = 0; i < (calm ? 0 : 12); i++) { const t = i * 2.39996, r = (2.5 + fr() * .75) * scale; out += poly(m.cx + Math.cos(t) * r, m.cy + Math.sin(t) * r * .7, (.13 + fr() * .15) * scale * 1.2, 5 + i % 3, fr() * 6, [accent, COPPER, ICE, accent, LIME][i % 5], `stroke="${ICE}" stroke-opacity=".5" stroke-width=".7"`); }
  for (const [ax, ay, s] of [[.0, .82, .09], [.99, .08, .08], [.2, .0, .07], [.76, 1, .07]]) out += poly(ax * W, ay * H, s * Math.max(W, H) * .6 + 26, 6, ax * 9, NEAR, `stroke="${LIME}" stroke-opacity=".3"`);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.innerHTML = out;
}
function makeSVG() {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('aria-hidden', 'true'); node.setAttribute('focusable', 'false'); node.setAttribute('class', 'volta-orbit-svg');
  node.dataset.id = `volta-orbit-${++serial}`; return node;
}
function fallback() {
  stop(); releaseGPU(); canvas?.remove(); svg?.remove();
  if (!host) return;
  svg = makeSVG(); host.append(svg); host.dataset.renderer = 'svg'; paintSVG(measure());
}
function mount(nextHost, { persona: who = 'guilherme', reducedMotion = false, paused: initialPause = false, view = 'default' } = {}) {
  if (!(nextHost instanceof Element)) throw new TypeError('VoltaOrbit.mount requires a DOM host');
  const again = key === view && renderer && host; // mesma composição: não repete a chegada
  detach(); svg?.remove(); svg = null; host = nextHost; anchor = document.querySelector('[data-scene-anchor]');
  paused = Boolean(initialPause); reduced = Boolean(reducedMotion);
  visible = !('IntersectionObserver' in window); px = py = tpx = tpy = 0; pointerEnd = scrollEnd = 0; scroll = 0;
  initialize(); setPersona(who);
  if (renderer) { host.append(canvas); host.dataset.renderer = 'webgl'; }
  else { svg = makeSVG(); host.append(svg); host.dataset.renderer = 'svg'; }
  const now = performance.now();
  if (renderer) {
    resize(); // define target
    if (key === null) { first = true; duration = ARRIVAL; start = now; Object.assign(from, target); }
    else if (!again) { first = false; duration = SHIFT; start = now; Object.assign(from, cur); }
    else Object.assign(from, target), start = Math.min(start, now - duration);
    if (reduced) start = now - duration;
    key = view; last = -Infinity; draw(now);
  } else { key = view; paintSVG(measure()); }
  const track = event => {
    if (!active() || reduced || !renderer || event.pointerType === 'touch') return;
    const rect = host.getBoundingClientRect();
    if (event.clientY < rect.top || event.clientY > rect.bottom) return;
    tpx = clamp((event.clientX - rect.left) / Math.max(rect.width, 1) - .5, -.5, .5);
    tpy = clamp((event.clientY - rect.top) / Math.max(rect.height, 1) - .5, -.5, .5);
    pointerEnd = performance.now() + 900; schedule();
  };
  listen(window, 'pointermove', track);
  listen(window, 'scroll', () => {
    if (!host || reduced || !renderer) return;
    const rect = host.getBoundingClientRect(); scroll = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    if (!active()) return; scrollEnd = performance.now() + 160; schedule();
  });
  listen(document, 'visibilitychange', resume);
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(host); if (anchor) ro.observe(anchor); }
  else listen(window, 'resize', resize);
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); resume(); }); io.observe(host);
  }
  schedule(); return window.VoltaOrbit;
}
function pause(value) { paused = Boolean(value); if (paused) stop(); else resume(); }
function dispose() {
  detach(); releaseGPU(); canvas?.remove(); svg?.remove();
  host = anchor = canvas = svg = null; attempted = false; key = null; px = py = 0;
}
window.VoltaOrbit = { mount, pause, dispose, colors: COLORS };
window.dispatchEvent(new CustomEvent('volta-orbit-ready'));
